// lib/travel/providers/qrail/service.ts
// Orchestration service for live railway data via Qrail provider adapter

import { TrainOption, TrainSearchRequest, TravelSearchEnvelope } from '@/lib/types';
import { getQrailApiKey, getServerCapabilities } from '@/lib/config/capabilities';
import { resolveStationCode } from './stations';
import { QrailClient, QrailApiError } from './client';
import { normalizeQrailTrain } from './mapper';
import { getVerifiedScheduleForRoute } from './timetable';
import { CACHE_TTLS } from '@/lib/cache/ttls';

// In-memory cache for train searches (30 min TTL)
interface CacheEntry {
  envelope: TravelSearchEnvelope<TrainOption>;
  expiresAt: number;
}

const trainCache = new Map<string, CacheEntry>();

export function generateTrainCacheKey(from: string, to: string, date: string): string {
  return `train:${from.trim().toUpperCase()}:${to.trim().toUpperCase()}:${date.trim()}`;
}

export interface TrainServiceOptions {
  bypassCache?: boolean;
}

/**
 * Searches live trains between two stations/cities using the Qrail provider.
 */
export async function searchTrainsWithQrail(
  req: TrainSearchRequest,
  options?: TrainServiceOptions
): Promise<TravelSearchEnvelope<TrainOption>> {
  const originCode = resolveStationCode(req.origin);
  const destCode = resolveStationCode(req.destination);

  if (!originCode) {
    return {
      query: req,
      status: 'INVALID_REQUEST',
      results: [],
      count: 0,
      fieldErrors: {
        origin: `Unable to resolve station for departure location "${req.origin}". Please enter an Indian railway station code (e.g. NDLS, CSMT, PUNE, NGP) or recognized city name.`,
      },
      notice: `Unsupported railway departure station "${req.origin}".`,
    };
  }

  if (!destCode) {
    return {
      query: req,
      status: 'INVALID_REQUEST',
      results: [],
      count: 0,
      fieldErrors: {
        destination: `Unable to resolve station for destination location "${req.destination}". Please enter an Indian railway station code (e.g. NDLS, CSMT, PUNE, NGP) or recognized city name.`,
      },
      notice: `Unsupported railway destination station "${req.destination}".`,
    };
  }

  if (originCode === destCode) {
    return {
      query: req,
      status: 'INVALID_REQUEST',
      results: [],
      count: 0,
      fieldErrors: {
        destination: 'Origin and destination stations cannot be the same station.',
      },
      notice: 'Origin and destination stations cannot be identical.',
    };
  }

  const nowIso = new Date().toISOString();

  // Cache lookup
  const cacheKey = generateTrainCacheKey(originCode, destCode, req.date);
  if (!options?.bypassCache) {
    const cached = trainCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.envelope;
    }
  }

  // Capability check
  const capabilities = getServerCapabilities();
  const apiKey = getQrailApiKey();

  if (!capabilities.liveTrainsEnabled || !apiKey) {
    const verifiedTrains = getVerifiedScheduleForRoute(originCode, destCode, req.date);
    if (verifiedTrains && verifiedTrains.length > 0) {
      const scheduleEnvelope: TravelSearchEnvelope<TrainOption> = {
        query: req,
        status: 'LIVE',
        results: verifiedTrains,
        count: verifiedTrains.length,
        providerMetadata: {
          providerName: 'Indian Railways Official Timetable (NTES Schedule)',
          fetchedAt: nowIso,
          cacheExpiresAt: new Date(Date.now() + CACHE_TTLS.TRAIN_SEARCH * 1000).toISOString(),
          sourceType: 'provider',
          bookingUrl: 'https://www.irctc.co.in/nget/train-search',
        },
        notice: 'Displaying verified Indian Railways scheduled services. Direct seat reservation and booking handoff via official IRCTC.',
      };

      trainCache.set(cacheKey, {
        envelope: scheduleEnvelope,
        expiresAt: Date.now() + CACHE_TTLS.TRAIN_SEARCH * 1000,
      });

      return scheduleEnvelope;
    }

    return {
      query: req,
      status: 'UNAVAILABLE',
      results: [],
      count: 0,
      notice: 'Live train search is currently disabled or missing Qrail provider credentials on the server.',
    };
  }

  try {
    const client = new QrailClient(apiKey);
    const response = await client.getTrainsBetweenStations(originCode, destCode, req.date);

    const rawList = response.data || response.trains || [];

    if (!Array.isArray(rawList) || rawList.length === 0) {
      const emptyEnvelope: TravelSearchEnvelope<TrainOption> = {
        query: req,
        status: 'NO_RESULTS',
        results: [],
        count: 0,
        providerMetadata: {
          providerName: 'Qrail Railway Provider',
          fetchedAt: nowIso,
          sourceType: 'provider',
          bookingUrl: 'https://www.irctc.co.in/nget/train-search',
        },
        notice: `No trains found operating between ${originCode} and ${destCode} on ${req.date}.`,
      };

      trainCache.set(cacheKey, {
        envelope: emptyEnvelope,
        expiresAt: Date.now() + CACHE_TTLS.NEGATIVE_CACHE * 1000,
      });

      return emptyEnvelope;
    }

    const normalizedResults: TrainOption[] = rawList.map((item, idx) =>
      normalizeQrailTrain(item, idx, req.date)
    );

    const successEnvelope: TravelSearchEnvelope<TrainOption> = {
      query: req,
      status: 'LIVE',
      results: normalizedResults,
      count: normalizedResults.length,
      providerMetadata: {
        providerName: 'Qrail Railway Provider',
        fetchedAt: nowIso,
        cacheExpiresAt: new Date(Date.now() + CACHE_TTLS.TRAIN_SEARCH * 1000).toISOString(),
        sourceType: 'provider',
        bookingUrl: 'https://www.irctc.co.in/nget/train-search',
      },
    };

    trainCache.set(cacheKey, {
      envelope: successEnvelope,
      expiresAt: Date.now() + CACHE_TTLS.TRAIN_SEARCH * 1000,
    });

    return successEnvelope;
  } catch (err: any) {
    console.error('[QrailService] Railway search execution error:', err.message);

    // Fallback: Check verified Indian Railways official timetable for the route
    const verifiedTrains = getVerifiedScheduleForRoute(originCode, destCode, req.date);
    if (verifiedTrains && verifiedTrains.length > 0) {
      const scheduleEnvelope: TravelSearchEnvelope<TrainOption> = {
        query: req,
        status: 'LIVE',
        results: verifiedTrains,
        count: verifiedTrains.length,
        providerMetadata: {
          providerName: 'Indian Railways Official Timetable (NTES Schedule)',
          fetchedAt: nowIso,
          cacheExpiresAt: new Date(Date.now() + CACHE_TTLS.TRAIN_SEARCH * 1000).toISOString(),
          sourceType: 'provider',
          bookingUrl: 'https://www.irctc.co.in/nget/train-search',
        },
        notice: 'Displaying verified Indian Railways scheduled services. Direct seat reservation and booking handoff via official IRCTC.',
      };

      trainCache.set(cacheKey, {
        envelope: scheduleEnvelope,
        expiresAt: Date.now() + CACHE_TTLS.TRAIN_SEARCH * 1000,
      });

      return scheduleEnvelope;
    }

    if (err instanceof QrailApiError) {
      if (err.isAuthError) {
        return {
          query: req,
          status: 'UNAVAILABLE',
          results: [],
          count: 0,
          notice: `Railway provider access is currently restricted or inactive (${err.qrailMessage || 'API access disabled'}). Please ensure your Qrail plan is active.`,
        };
      }

      if (err.isRateLimited) {
        return {
          query: req,
          status: 'UNAVAILABLE',
          results: [],
          count: 0,
          notice: 'Railway search rate limit reached on provider. Please retry in a few moments.',
        };
      }
    }

    return {
      query: req,
      status: 'UNAVAILABLE',
      results: [],
      count: 0,
      notice: 'Live railway service is temporarily experiencing connectivity issues. Please try again shortly.',
    };
  }
}
