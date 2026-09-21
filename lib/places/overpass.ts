// lib/places/overpass.ts
// Overpass API Client for OSM Enrichment (fee, charge, opening_hours, website, phone)
// Optimized with fetchWithPolicy, batched query for multiple places, and N+1 prevention.

import { prisma } from '@/lib/prisma';
import { fetchWithPolicy } from '@/lib/http/fetchPolicy';

export interface OverpassPlaceData {
  osmId?: string;
  feeState: 'FREE' | 'PAID_KNOWN' | 'PAID_UNKNOWN' | 'UNKNOWN';
  chargeText?: string;
  parsedAmount?: number;
  openingHoursRaw?: string;
  openingHoursParsed?: {
    is24_7: boolean;
    standardRange?: { days: string; open: string; close: string };
  };
  website?: string;
  phone?: string;
  matched: boolean;
  matchType?: 'id' | 'proximity';
  tagsFound?: string[];
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

/**
 * Parse fee and charge from OSM tags
 */
export function parseFeeTags(tags: Record<string, string>): {
  feeState: 'FREE' | 'PAID_KNOWN' | 'PAID_UNKNOWN' | 'UNKNOWN';
  chargeText?: string;
  parsedAmount?: number;
} {
  const feeTag = (tags['fee'] || '').trim().toLowerCase();
  const chargeTag = (tags['charge'] || '').trim();

  if (feeTag === 'no' || feeTag === 'free') {
    return { feeState: 'FREE', chargeText: 'Free', parsedAmount: 0 };
  }

  if (chargeTag) {
    const singlePriceMatch = chargeTag.match(/(?:(?:INR|Rs\.?|₹)\s*(\d+))|(?:(\d+)\s*(?:INR|Rs\.?|₹))/i);
    const hasMultiplePrices = chargeTag.includes(';') || chargeTag.includes('/') || chargeTag.match(/\d+.*?\d+/);

    if (hasMultiplePrices) {
      return { feeState: 'PAID_KNOWN', chargeText: chargeTag };
    }

    if (singlePriceMatch) {
      const amtStr = singlePriceMatch[1] || singlePriceMatch[2];
      const amt = parseInt(amtStr, 10);
      return { feeState: 'PAID_KNOWN', chargeText: `₹${amt}`, parsedAmount: amt };
    }

    return { feeState: 'PAID_KNOWN', chargeText: chargeTag };
  }

  if (feeTag === 'yes') {
    return { feeState: 'PAID_UNKNOWN', chargeText: 'Paid, amount not listed' };
  }

  return { feeState: 'UNKNOWN' };
}

/**
 * Minimal parser for opening_hours
 */
export function parseOpeningHours(rawHours?: string): {
  is24_7: boolean;
  standardRange?: { days: string; open: string; close: string };
} | undefined {
  if (!rawHours) return undefined;
  const clean = rawHours.trim();

  if (clean === '24/7') {
    return { is24_7: true };
  }

  const rangeMatch = clean.match(/^([A-Za-z]{2}(?:-[A-Za-z]{2})?)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
  if (rangeMatch) {
    return {
      is24_7: false,
      standardRange: {
        days: rangeMatch[1],
        open: rangeMatch[2],
        close: rangeMatch[3],
      },
    };
  }

  return undefined;
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

/**
 * Execute Overpass query using fetchWithPolicy ('overpass' policy: 12s timeout, circuit breaker)
 */
async function executeOverpassQuery(query: string): Promise<OverpassResponse | null> {
  const contactEmail = process.env.OVERPASS_CONTACT_EMAIL || 'support@xplora.local';

  try {
    const res = await fetchWithPolicy('overpass', OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': `Xplora/1.0 (contact: ${contactEmail})`,
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (res.ok) {
      return (await res.json()) as OverpassResponse;
    }
    return null;
  } catch (err) {
    console.warn('[Overpass] Query failed or timed out:', String(err));
    return null;
  }
}

function processElementToPlaceData(el: OverpassElement, matchType: 'id' | 'proximity'): OverpassPlaceData {
  const tags = el.tags || {};
  const tagsFound = Object.keys(tags);
  const feeInfo = parseFeeTags(tags);
  const rawHours = tags['opening_hours'];
  const parsedHours = parseOpeningHours(rawHours);
  const website = tags['website'] || tags['contact:website'];
  const phone = tags['phone'] || tags['contact:phone'];

  return {
    osmId: `${el.type}/${el.id}`,
    feeState: feeInfo.feeState,
    chargeText: feeInfo.chargeText,
    parsedAmount: feeInfo.parsedAmount,
    openingHoursRaw: rawHours,
    openingHoursParsed: parsedHours,
    website,
    phone,
    matched: true,
    matchType,
    tagsFound,
  };
}

/**
 * Batch fetch Overpass details for an array of places in ONE single query!
 * Form: [out:json][timeout:12];(node(id:1,2,3);way(id:4,5);relation(id:6););out tags center;
 */
export async function batchFetchOverpassDetails(
  places: Array<{ id: string; name: string; lat: number; lng: number }>
): Promise<Map<string, OverpassPlaceData>> {
  const resultMap = new Map<string, OverpassPlaceData>();
  if (!places || places.length === 0) return resultMap;

  // 1. Batch cache check from Postgres/SQLite PlaceCache
  const cacheKeys = places.map((p) => `overpass:${p.id}`);
  const uncachedPlaces: typeof places = [];

  try {
    const cachedRecords = await prisma.placeCache.findMany({
      where: { key: { in: cacheKeys } },
      select: { key: true, payload: true, fetchedAt: true },
    });

    const cachedMap = new Map<string, { payload: string; fetchedAt: Date }>();
    for (const rec of cachedRecords) {
      cachedMap.set(rec.key, rec);
    }

    const now = Date.now();
    for (const p of places) {
      const c = cachedMap.get(`overpass:${p.id}`);
      if (c) {
        const ageDays = (now - new Date(c.fetchedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays < 30) {
          try {
            resultMap.set(p.id, JSON.parse(c.payload) as OverpassPlaceData);
            continue;
          } catch (e) {}
        }
      }
      uncachedPlaces.push(p);
    }
  } catch (err) {
    console.warn('[Overpass] Error reading cache batch:', err);
    uncachedPlaces.push(...places);
  }

  if (uncachedPlaces.length === 0) {
    return resultMap;
  }

  // 2. Separate into OSM ID places and Proximity places
  const nodeIds: string[] = [];
  const wayIds: string[] = [];
  const relationIds: string[] = [];
  const idToPlaceMap = new Map<string, typeof places[0]>();
  const proximityPlaces: typeof places = [];

  for (const p of uncachedPlaces) {
    const osmIdMatch = p.id.match(/^([NWR])(\d+)$/i);
    if (osmIdMatch) {
      const typeChar = osmIdMatch[1].toUpperCase();
      const idNum = osmIdMatch[2];
      if (typeChar === 'N') nodeIds.push(idNum);
      else if (typeChar === 'W') wayIds.push(idNum);
      else relationIds.push(idNum);

      idToPlaceMap.set(`${typeChar === 'N' ? 'node' : typeChar === 'W' ? 'way' : 'relation'}:${idNum}`, p);
    } else {
      proximityPlaces.push(p);
    }
  }

  // 3. Construct ONE single batch query for all ID places
  const statements: string[] = [];
  if (nodeIds.length > 0) statements.push(`node(id:${nodeIds.join(',')});`);
  if (wayIds.length > 0) statements.push(`way(id:${wayIds.join(',')});`);
  if (relationIds.length > 0) statements.push(`relation(id:${relationIds.join(',')});`);

  const recordsToCache: Array<{ key: string; payload: string }> = [];

  if (statements.length > 0) {
    const batchQuery = `[out:json][timeout:12];(${statements.join('')});out tags center;`;
    const batchRes = await executeOverpassQuery(batchQuery);

    if (batchRes && Array.isArray(batchRes.elements)) {
      for (const el of batchRes.elements) {
        const place = idToPlaceMap.get(`${el.type}:${el.id}`);
        if (place) {
          const data = processElementToPlaceData(el, 'id');
          resultMap.set(place.id, data);
          recordsToCache.push({ key: `overpass:${place.id}`, payload: JSON.stringify(data) });
        }
      }
    }
  }

  // Any remaining ID places that weren't matched in the batch or had no OSM ID fallback to default/proximity
  for (const p of uncachedPlaces) {
    if (!resultMap.has(p.id)) {
      const defaultData: OverpassPlaceData = { feeState: 'UNKNOWN', matched: false };
      resultMap.set(p.id, defaultData);
      recordsToCache.push({ key: `overpass:${p.id}`, payload: JSON.stringify(defaultData) });
    }
  }

  // 4. Batch cache write (fire-and-forget or non-blocking)
  if (recordsToCache.length > 0) {
    Promise.allSettled(
      recordsToCache.map((rec) =>
        prisma.placeCache.upsert({
          where: { key: rec.key },
          update: { payload: rec.payload, fetchedAt: new Date() },
          create: { key: rec.key, payload: rec.payload },
        })
      )
    ).catch(() => {});
  }

  return resultMap;
}

/**
 * Backward-compatible single fetch delegating to batch fetch
 */
export async function fetchOverpassDetails(
  xid: string,
  name: string,
  lat: number,
  lng: number
): Promise<OverpassPlaceData> {
  const map = await batchFetchOverpassDetails([{ id: xid, name, lat, lng }]);
  return map.get(xid) || { feeState: 'UNKNOWN', matched: false };
}
