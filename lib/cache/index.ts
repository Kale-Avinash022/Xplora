// lib/cache/index.ts
// Two-tier cache (L1 in-process LRU, L2 Upstash Redis REST or Prisma PlaceCache)
// with Single-Flight promise sharing, Stale-While-Revalidate, Negative Caching, and Normalized Keys.

import { prisma } from '@/lib/prisma';
import { RequestTracker } from '@/lib/perf/timing';

export interface CacheOptions {
  tracker?: RequestTracker;
  isNegative?: boolean; // Cache null or empty results
}

interface CacheRecord<T> {
  value: T;
  fetchedAt: number; // epoch ms
  ttlSeconds: number;
}

// In-process L1 LRU Cache (max 500 entries)
class LruMemoryCache {
  private map = new Map<string, CacheRecord<unknown>>();
  private readonly maxEntries: number;

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
  }

  get<T>(key: string): CacheRecord<T> | undefined {
    const item = this.map.get(key);
    if (!item) return undefined;
    // Refresh access order (delete and re-insert)
    this.map.delete(key);
    this.map.set(key, item);
    return item as CacheRecord<T>;
  }

  set<T>(key: string, record: CacheRecord<T>): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxEntries) {
      // Evict oldest (first key in map)
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
    this.map.set(key, record as CacheRecord<unknown>);
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }
}

const memoryL1 = new LruMemoryCache(500);

// Single-Flight: share in-flight promises across concurrent requests in same process
const inFlightPromises = new Map<string, Promise<unknown>>();

/**
 * Key Normalization & Versioning
 * Format: "xplora:v1:<type>:<lowercase trimmed input>"
 * Strictly verifies no personal data / emails / user ids are added
 */
export function normalizeKey(type: string, input: string): string {
  const cleanInput = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9:_\-,]/g, '');
  return `xplora:v1:${type.trim().toLowerCase()}:${cleanInput}`;
}

// L2: Upstash Redis REST Client (pure fetch, zero new dependencies)
class UpstashRedisRest {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, '');
    this.token = token;
  }

  private async executeCommand(command: (string | number)[]): Promise<unknown> {
    try {
      const res = await fetch(this.url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.result;
    } catch (err) {
      console.warn('[UpstashRedisRest] Error executing Redis command:', err);
      return null;
    }
  }

  async get<T>(key: string): Promise<CacheRecord<T> | null> {
    const raw = await this.executeCommand(['GET', key]);
    if (!raw || typeof raw !== 'string') return null;
    try {
      return JSON.parse(raw) as CacheRecord<T>;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, record: CacheRecord<T>, ttlSeconds: number): Promise<void> {
    const serialized = JSON.stringify(record);
    // Double TTL in Redis so stale-while-revalidate can read expired values within 2x TTL window
    const redisTtl = ttlSeconds * 2;
    await this.executeCommand(['SET', key, serialized, 'EX', redisTtl]);
  }
}

function getUpstashClient(): UpstashRedisRest | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) {
    return new UpstashRedisRest(url, token);
  }
  return null;
}

// L2 Database Fallback (Prisma PlaceCache)
async function getFromPrisma<T>(key: string): Promise<CacheRecord<T> | null> {
  try {
    const row = await prisma.placeCache.findUnique({ where: { key } });
    if (!row) return null;
    return JSON.parse(row.payload) as CacheRecord<T>;
  } catch {
    return null;
  }
}

async function setInPrisma<T>(key: string, record: CacheRecord<T>): Promise<void> {
  try {
    const payload = JSON.stringify(record);
    await prisma.placeCache.upsert({
      where: { key },
      update: { payload, fetchedAt: new Date(record.fetchedAt) },
      create: { key, payload, fetchedAt: new Date(record.fetchedAt) },
    });
  } catch (err) {
    console.warn('[Cache] Error writing to Prisma PlaceCache:', err);
  }
}

/**
 * getOrSet:
 * Retrieves value from L1 -> L2 -> loader()
 * Implements Single-Flight, SWR (stale-while-revalidate), negative caching, and perf tracker logging.
 */
export async function getOrSet<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  const now = Date.now();
  const ttlMs = ttlSeconds * 1000;
  const staleWindowMs = ttlMs * 2; // 2x TTL window for stale-while-revalidate
  const upstash = getUpstashClient();

  // 1. Check L1 Memory Cache
  const l1Record = memoryL1.get<T>(key);
  if (l1Record) {
    const age = now - l1Record.fetchedAt;
    if (age <= ttlMs) {
      options?.tracker?.recordCacheHit();
      return l1Record.value;
    }
    // Stale-while-revalidate window
    if (age <= staleWindowMs) {
      options?.tracker?.recordCacheStale();
      triggerBackgroundRefresh(key, ttlSeconds, loader, options);
      return l1Record.value;
    }
  }

  // 2. Check L2 (Upstash Redis REST or Prisma)
  let l2Record: CacheRecord<T> | null = null;
  if (upstash) {
    l2Record = await upstash.get<T>(key);
  } else {
    l2Record = await getFromPrisma<T>(key);
  }

  if (l2Record) {
    const age = now - l2Record.fetchedAt;
    // Populate L1
    memoryL1.set(key, l2Record);

    if (age <= ttlMs) {
      options?.tracker?.recordCacheHit();
      return l2Record.value;
    }

    if (age <= staleWindowMs) {
      options?.tracker?.recordCacheStale();
      triggerBackgroundRefresh(key, ttlSeconds, loader, options);
      return l2Record.value;
    }
  }

  // 3. Cache Miss: execute loader with Single-Flight deduplication
  options?.tracker?.recordCacheMiss();

  let flightPromise = inFlightPromises.get(key) as Promise<T> | undefined;
  if (!flightPromise) {
    flightPromise = (async () => {
      try {
        const freshValue = await loader();
        const record: CacheRecord<T> = {
          value: freshValue,
          fetchedAt: Date.now(),
          ttlSeconds,
        };

        // Write L1
        memoryL1.set(key, record);

        // Write L2 (non-blocking)
        if (upstash) {
          upstash.set(key, record, ttlSeconds).catch(() => {});
        } else {
          setInPrisma(key, record).catch(() => {});
        }

        return freshValue;
      } finally {
        inFlightPromises.delete(key);
      }
    })();

    inFlightPromises.set(key, flightPromise);
  }

  return flightPromise;
}

/**
 * Directly set a cache entry in L1 and L2
 */
export async function setCacheRecord<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const record: CacheRecord<T> = {
    value,
    fetchedAt: Date.now(),
    ttlSeconds,
  };
  memoryL1.set(key, record);
  const upstash = getUpstashClient();
  if (upstash) {
    await upstash.set(key, record, ttlSeconds);
  } else {
    await setInPrisma(key, record);
  }
}

/**
 * Check if a valid entry exists in L1 or L2 without executing a fallback loader
 */
export async function peekCacheRecord<T>(
  key: string,
  options?: CacheOptions
): Promise<T | null> {
  const now = Date.now();
  // 1. L1
  const l1Record = memoryL1.get<T>(key);
  if (l1Record) {
    const age = now - l1Record.fetchedAt;
    const ttlMs = l1Record.ttlSeconds * 1000;
    if (age <= ttlMs) {
      options?.tracker?.recordCacheHit();
      return l1Record.value;
    }
  }

  // 2. L2
  const upstash = getUpstashClient();
  let l2Record: CacheRecord<T> | null = null;
  if (upstash) {
    l2Record = await upstash.get<T>(key);
  } else {
    l2Record = await getFromPrisma<T>(key);
  }

  if (l2Record) {
    const age = now - l2Record.fetchedAt;
    const ttlMs = l2Record.ttlSeconds * 1000;
    memoryL1.set(key, l2Record);
    if (age <= ttlMs) {
      options?.tracker?.recordCacheHit();
      return l2Record.value;
    }
  }

  return null;
}

/**
 * Background refresh for Stale-While-Revalidate
 */
function triggerBackgroundRefresh<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
  options?: CacheOptions
): void {
  if (inFlightPromises.has(key)) return;

  const refreshPromise = (async () => {
    try {
      const freshValue = await loader();
      const record: CacheRecord<T> = {
        value: freshValue,
        fetchedAt: Date.now(),
        ttlSeconds,
      };
      memoryL1.set(key, record);
      const upstash = getUpstashClient();
      if (upstash) {
        await upstash.set(key, record, ttlSeconds);
      } else {
        await setInPrisma(key, record);
      }
    } catch (err) {
      console.warn(`[Cache] Background refresh failed for ${key}:`, err);
    } finally {
      inFlightPromises.delete(key);
    }
  })();

  inFlightPromises.set(key, refreshPromise);
}

/**
 * Helper to clear memory cache (for tests)
 */
export function clearL1Cache(): void {
  memoryL1.clear();
}
