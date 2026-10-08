import { prisma } from '@/lib/prisma';
import { fetchWithPolicy, mapLimit } from '@/lib/http/fetchPolicy';
import { getOrSet, normalizeKey } from '@/lib/cache';
import { CACHE_TTLS } from '@/lib/cache/ttls';
import {
  isIndoorKind,
  isExcludedForMainSightseeing,
  isGenericPlaceName,
  RAINY_DAY_INDOOR_KINDS,
} from './categories';

export interface Place {
  id: string; // The xid from OpenTripMap
  name: string;
  lat: number;
  lng: number;
  kinds: string[];
  kindsStr: string;
  rate: number; // Popularity score
  isIndoor: boolean;
  hasWiki: boolean;
  wikipediaExtract?: string;
  address?: string;
  mapsUrl: string;
  distFromCenterKm?: number;
}

export interface GeocodeResult {
  name: string;
  lat: number;
  lng: number;
  country?: string;
}

const BASE_URL = 'https://api.opentripmap.com/0.1/en/places';

/**
 * Check and increment daily API usage counter
 */
async function checkAndIncrementApiCap(dailyCap: number): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  try {
    const record = await prisma.apiUsage.findUnique({
      where: {
        provider_day: {
          provider: 'opentripmap',
          day: today,
        },
      },
    });

    if (record && record.count >= dailyCap) {
      console.warn(`[OpenTripMap] Daily call cap of ${dailyCap} reached for ${today}. Serving from cache only.`);
      return false;
    }

    await prisma.apiUsage.upsert({
      where: {
        provider_day: {
          provider: 'opentripmap',
          day: today,
        },
      },
      update: { count: { increment: 1 } },
      create: { provider: 'opentripmap', day: today, count: 1 },
    });
    return true;
  } catch (err) {
    console.error('[OpenTripMap] Error updating ApiUsage record:', err);
    return true; // Allow request if usage table is unavailable
  }
}

/**
 * Curated high-precision coordinates for popular destinations to guarantee 100% geographic accuracy
 * and bypass ambiguous third-party geoname database mismatches (e.g. Delhi vs Dili, Timor-Leste).
 */
export const CURATED_DESTINATIONS: Record<string, GeocodeResult> = {
  delhi: { name: 'Delhi', lat: 28.6139, lng: 77.2090, country: 'IN' },
  'new delhi': { name: 'New Delhi', lat: 28.6139, lng: 77.2090, country: 'IN' },
  'old delhi': { name: 'Old Delhi', lat: 28.6562, lng: 77.2410, country: 'IN' },
  mumbai: { name: 'Mumbai', lat: 19.0760, lng: 72.8777, country: 'IN' },
  bombay: { name: 'Mumbai', lat: 19.0760, lng: 72.8777, country: 'IN' },
  bengaluru: { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, country: 'IN' },
  bangalore: { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, country: 'IN' },
  goa: { name: 'Goa', lat: 15.2993, lng: 74.1240, country: 'IN' },
  jaipur: { name: 'Jaipur', lat: 26.9124, lng: 75.7873, country: 'IN' },
  agra: { name: 'Agra', lat: 27.1767, lng: 78.0081, country: 'IN' },
  kolkata: { name: 'Kolkata', lat: 22.5726, lng: 88.3639, country: 'IN' },
  calcutta: { name: 'Kolkata', lat: 22.5726, lng: 88.3639, country: 'IN' },
  chennai: { name: 'Chennai', lat: 13.0827, lng: 80.2707, country: 'IN' },
  madras: { name: 'Chennai', lat: 13.0827, lng: 80.2707, country: 'IN' },
  hyderabad: { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, country: 'IN' },
  pune: { name: 'Pune', lat: 18.5204, lng: 73.8567, country: 'IN' },
  varanasi: { name: 'Varanasi', lat: 25.3176, lng: 82.9739, country: 'IN' },
  banaras: { name: 'Varanasi', lat: 25.3176, lng: 82.9739, country: 'IN' },
  kashi: { name: 'Varanasi', lat: 25.3176, lng: 82.9739, country: 'IN' },
  kochi: { name: 'Kochi', lat: 9.9312, lng: 76.2673, country: 'IN' },
  cochin: { name: 'Kochi', lat: 9.9312, lng: 76.2673, country: 'IN' },
  manali: { name: 'Manali', lat: 32.2396, lng: 77.1887, country: 'IN' },
  shimla: { name: 'Shimla', lat: 31.1048, lng: 77.1734, country: 'IN' },
  udaipur: { name: 'Udaipur', lat: 24.5854, lng: 73.7125, country: 'IN' },
  amritsar: { name: 'Amritsar', lat: 31.6340, lng: 74.8723, country: 'IN' },
  srinagar: { name: 'Srinagar', lat: 34.0837, lng: 74.7973, country: 'IN' },
  ahmedabad: { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, country: 'IN' },
  nagpur: { name: 'Nagpur', lat: 21.1458, lng: 79.0882, country: 'IN' },
  chandigarh: { name: 'Chandigarh', lat: 30.7333, lng: 76.7794, country: 'IN' },
  lucknow: { name: 'Lucknow', lat: 26.8467, lng: 80.9462, country: 'IN' },
  rishikesh: { name: 'Rishikesh', lat: 30.0869, lng: 78.2676, country: 'IN' },
  haridwar: { name: 'Haridwar', lat: 29.9457, lng: 78.1642, country: 'IN' },
  darjeeling: { name: 'Darjeeling', lat: 27.0410, lng: 88.2663, country: 'IN' },
  mysuru: { name: 'Mysuru', lat: 12.2958, lng: 76.6394, country: 'IN' },
  mysore: { name: 'Mysuru', lat: 12.2958, lng: 76.6394, country: 'IN' },
  ooty: { name: 'Ooty', lat: 11.4102, lng: 76.6950, country: 'IN' },
  ladakh: { name: 'Ladakh', lat: 34.1526, lng: 77.5771, country: 'IN' },
  leh: { name: 'Leh', lat: 34.1526, lng: 77.5771, country: 'IN' },
  pondicherry: { name: 'Puducherry', lat: 11.9416, lng: 79.8083, country: 'IN' },
  puducherry: { name: 'Puducherry', lat: 11.9416, lng: 79.8083, country: 'IN' },
  // International hubs
  paris: { name: 'Paris', lat: 48.8566, lng: 2.3522, country: 'FR' },
  london: { name: 'London', lat: 51.5074, lng: -0.1278, country: 'GB' },
  dubai: { name: 'Dubai', lat: 25.2048, lng: 55.2708, country: 'AE' },
  singapore: { name: 'Singapore', lat: 1.3521, lng: 103.8198, country: 'SG' },
  tokyo: { name: 'Tokyo', lat: 35.6762, lng: 139.6503, country: 'JP' },
  'new york': { name: 'New York', lat: 40.7128, lng: -74.0060, country: 'US' },
  rome: { name: 'Rome', lat: 41.9028, lng: 12.4964, country: 'IT' },
  bangkok: { name: 'Bangkok', lat: 13.7563, lng: 100.5018, country: 'TH' },
  bali: { name: 'Bali', lat: -8.4095, lng: 115.1889, country: 'ID' },
};

/**
 * Geocode destination center with multi-tier resolution:
 * 1. Curated high-precision city dictionary (0ms, 100% verified)
 * 2. Photon OpenStreetMap Geocoding (population-ranked, fuzzy matching)
 * 3. Nominatim OpenStreetMap API
 * 4. OpenTripMap geoname endpoint (with country disambiguation)
 */
export async function geocodeDestination(destination: string): Promise<GeocodeResult | null> {
  const normKey = destination.trim().toLowerCase().replace(/,\s*(india|in)$/i, '').trim();
  if (CURATED_DESTINATIONS[normKey]) {
    return CURATED_DESTINATIONS[normKey];
  }

  const cacheKey = normalizeKey('geocode', destination);
  return getOrSet(cacheKey, CACHE_TTLS.GEOCODE, async () => {
    // 1. Try Photon OpenStreetMap geocoding
    try {
      const photonRes = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(destination.trim())}&limit=1`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (photonRes.ok) {
        const photonData = await photonRes.json();
        const feat = photonData?.features?.[0];
        if (feat?.geometry?.coordinates && Array.isArray(feat.geometry.coordinates)) {
          const [lng, lat] = feat.geometry.coordinates;
          if (typeof lat === 'number' && typeof lng === 'number') {
            return {
              name: feat.properties?.name || destination,
              lat,
              lng,
              country: feat.properties?.countrycode?.toUpperCase() || feat.properties?.country,
            };
          }
        }
      }
    } catch (err) {
      console.warn('[Geocode] Photon geocoding failed or timed out:', err);
    }

    // 2. Try Nominatim OpenStreetMap search API
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination.trim())}&format=json&limit=1`,
        {
          headers: { 'User-Agent': 'XploraTravelApp/1.0 (support@xplora.local)' },
          signal: AbortSignal.timeout(4000),
        }
      );
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        const first = nomData?.[0];
        if (first?.lat && first?.lon) {
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);
          if (!isNaN(lat) && !isNaN(lng)) {
            return {
              name: first.name || destination,
              lat,
              lng,
              country: first.address?.country_code?.toUpperCase(),
            };
          }
        }
      }
    } catch (err) {
      console.warn('[Geocode] Nominatim geocoding failed or timed out:', err);
    }

    // 3. Fallback: OpenTripMap geoname endpoint
    const apiKey = (process.env.OPENTRIPMAP_API_KEY || '').trim();
    if (!apiKey) {
      throw new Error('OPENTRIPMAP_API_KEY is not configured on the server.');
    }

    const dailyCap = Number(process.env.OPENTRIPMAP_DAILY_CALL_CAP) || 3000;
    const canCallApi = await checkAndIncrementApiCap(dailyCap);
    if (!canCallApi) return null;

    const url = `${BASE_URL}/geoname?name=${encodeURIComponent(destination.trim())}&apikey=${apiKey}`;
    const res = await fetchWithPolicy('opentripmap', url);

    if (!res.ok) return null;

    let data = await res.json();
    // Sanity check: If query was "delhi" and country returned is "TL" (Timor-Leste), retry with country=IN
    if (data.status === 'OK' && normKey === 'delhi' && data.country === 'TL') {
      const inUrl = `${BASE_URL}/geoname?name=Delhi&country=IN&apikey=${apiKey}`;
      const inRes = await fetchWithPolicy('opentripmap', inUrl);
      if (inRes.ok) {
        data = await inRes.json();
      }
    }

    if (data.status !== 'OK' || typeof data.lat !== 'number' || typeof data.lon !== 'number') {
      return null;
    }

    return {
      name: data.name || destination,
      lat: data.lat,
      lng: data.lon,
      country: data.country,
    };
  });
}

/**
 * Raw place item from /radius endpoint
 */
interface RawRadiusPlace {
  xid: string;
  name: string;
  dist?: number;
  rate?: number;
  osm?: string;
  wikidata?: string;
  kinds: string;
  point: {
    lat: number;
    lon: number;
  };
}

/**
 * Haversine distance in meters between two lat/lng points
 */
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Deduplicate places by id and normalized name within 300 meters
 */
export function deduplicatePlaces(places: Place[]): Place[] {
  const result: Place[] = [];
  const seenIds = new Set<string>();

  for (const place of places) {
    if (seenIds.has(place.id)) continue;

    const normName = place.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const isDuplicate = result.some((existing) => {
      if (existing.id === place.id) return true;
      const existingNorm = existing.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const dist = haversineMeters(existing.lat, existing.lng, place.lat, place.lng);
      
      // Exact normalized name match within 300m
      if (normName === existingNorm && dist < 300) return true;
      // Close distance (< 300m) with one name containing the other or very close proximity (< 60m)
      if (dist < 300 && (normName.includes(existingNorm) || existingNorm.includes(normName))) return true;
      if (dist < 60) return true;
      
      return false;
    });

    if (!isDuplicate) {
      seenIds.add(place.id);
      result.push(place);
    }
  }

  return result;
}

/**
 * Search places in radius:
 * PHASE 1 BATCHING: ONE radius request per destination with all needed kinds comma-separated
 * and a limit of about 200, then bucket by each result's `kinds` locally, instead of one request per category.
 */
export async function fetchPlacesInRadius(
  destination: string,
  lat: number,
  lng: number,
  kinds: string = 'cultural,historic,interesting_places,natural,architecture,religion'
): Promise<{ rawPlaces: Place[]; limitedData?: boolean }> {
  const normalizedKinds = Array.from(new Set(kinds.split(',').map((k) => k.trim()).filter(Boolean)))
    .sort()
    .join(',');

  const radius = Number(process.env.OPENTRIPMAP_SEARCH_RADIUS_M) || 20000;
  const cacheKey = normalizeKey('places', `${destination}:${normalizedKinds}:${radius}`);

  const rawPlaces = await getOrSet(cacheKey, CACHE_TTLS.PLACES_PER_CITY, async () => {
    const apiKey = (process.env.OPENTRIPMAP_API_KEY || '').trim();
    if (!apiKey) {
      throw new Error('OPENTRIPMAP_API_KEY is not configured on the server.');
    }

    const dailyCap = Number(process.env.OPENTRIPMAP_DAILY_CALL_CAP) || 3000;
    const canCallApi = await checkAndIncrementApiCap(dailyCap);
    if (!canCallApi) return [];

    const url = `${BASE_URL}/radius?radius=${radius}&lon=${lng}&lat=${lat}&kinds=${encodeURIComponent(
      normalizedKinds
    )}&limit=200&format=json&apikey=${apiKey}`;

    let res: Response;
    try {
      res = await fetchWithPolicy('opentripmap', url);
    } catch (err) {
      console.error('[OpenTripMap] fetchWithPolicy failed for radius:', err);
      return [];
    }

    if (!res.ok) return [];

    const rawList: RawRadiusPlace[] = await res.json();
    if (!Array.isArray(rawList)) return [];

    const validPlaces: Place[] = [];
    for (const raw of rawList) {
      if (!raw.name || !raw.name.trim()) continue;
      if (!raw.point || typeof raw.point.lat !== 'number' || typeof raw.point.lon !== 'number') continue;

      const latCoord = raw.point.lat;
      const lngCoord = raw.point.lon;
      const kindsArr = (raw.kinds || '').split(',').map((k) => k.trim());
      const isIndoor = isIndoorKind(raw.kinds);
      const hasWiki = Boolean(raw.wikidata || raw.osm);
      const distFromCenterKm = raw.dist ? raw.dist / 1000 : haversineMeters(lat, lng, latCoord, lngCoord) / 1000;

      validPlaces.push({
        id: raw.xid,
        name: raw.name.trim(),
        lat: latCoord,
        lng: lngCoord,
        kinds: kindsArr,
        kindsStr: raw.kinds,
        rate: Number(raw.rate) || 1,
        isIndoor,
        hasWiki,
        distFromCenterKm,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${latCoord}%2C${lngCoord}`,
      });
    }

    return deduplicatePlaces(validPlaces);
  });

  return { rawPlaces };
}

/**
 * Filter candidates with strict quality rules (Fix 1):
 * - Popularity: rate >= 2 first; relax to rate 1 only if fewer than (days * 4) remain
 * - Exclude cinemas, malls, fountains, generic names
 */
export function filterCandidatesByQuality(
  allPlaces: Place[],
  days: number
): {
  sightseeingCandidates: Place[];
  rainyIndoorFallbacks: Place[];
} {
  const initialCount = allPlaces.length;

  // Separate indoor fallbacks (cinemas, malls) for rainy days
  const rainyIndoorFallbacks: Place[] = [];
  const candidatePool: Place[] = [];

  for (const p of allPlaces) {
    const isExcluded = isExcludedForMainSightseeing(p.kindsStr);
    const isGeneric = isGenericPlaceName(p.name, p.hasWiki);

    if (isGeneric) {
      continue; // Skip generic names like "Fountain in Park", "Park", "Temple" without wikidata
    }

    if (isExcluded) {
      const isRainyFallback = RAINY_DAY_INDOOR_KINDS.some((rk) => p.kindsStr.includes(rk));
      if (isRainyFallback) {
        rainyIndoorFallbacks.push(p);
      }
      continue;
    }

    candidatePool.push(p);
  }

  console.log(`[OpenTripMap Filter] Initial places: ${initialCount} -> After exclusion/generic check: ${candidatePool.length} (Indoor fallbacks: ${rainyIndoorFallbacks.length})`);

  // Popularity filter: rate >= 2 first
  const highRate = candidatePool.filter((p) => p.rate >= 2);
  const minRequired = days * 4;

  let sightseeingCandidates: Place[];
  if (highRate.length >= minRequired) {
    sightseeingCandidates = highRate;
  } else {
    console.warn(
      `[OpenTripMap Filter] Only ${highRate.length} places with rate >= 2 (required ${minRequired}). Relaxing filter to include rate 1 places.`
    );
    sightseeingCandidates = candidatePool;
  }

  return {
    sightseeingCandidates: deduplicatePlaces(sightseeingCandidates),
    rainyIndoorFallbacks: deduplicatePlaces(rainyIndoorFallbacks),
  };
}

/**
 * Place detail from /xid endpoint
 */
interface RawPlaceDetail {
  xid: string;
  name: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    county?: string;
    state?: string;
    country?: string;
  };
  wikipedia_extracts?: {
    text?: string;
  };
  wikipedia?: string;
  wikidata?: string;
  otm?: string;
  url?: string;
  point?: {
    lat: number;
    lon: number;
  };
}

/**
 * Fetch detailed information for shortlisted places in batch with N+1 cache query fix
 */
export async function batchFetchPlaceDetails(places: Place[]): Promise<Map<string, Place>> {
  const resultMap = new Map<string, Place>();
  if (!places || places.length === 0) return resultMap;

  const apiKey = (process.env.OPENTRIPMAP_API_KEY || '').trim();

  // 1. Batch cache lookup
  const cacheKeys = places.map((p) => `xid_v2:${p.id}`);
  const uncachedPlaces: Place[] = [];

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
      const c = cachedMap.get(`xid_v2:${p.id}`);
      if (c) {
        const ageDays = (now - new Date(c.fetchedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays < 30) {
          try {
            const cachedPlace = JSON.parse(c.payload) as Place;
            resultMap.set(p.id, { ...p, ...cachedPlace });
            continue;
          } catch (e) {}
        }
      }
      uncachedPlaces.push(p);
    }
  } catch (err) {
    console.warn('[OpenTripMap] Cache batch read error for xids:', err);
    uncachedPlaces.push(...places);
  }

  if (uncachedPlaces.length === 0 || !apiKey) {
    for (const p of places) {
      if (!resultMap.has(p.id)) resultMap.set(p.id, p);
    }
    return resultMap;
  }

  // 2. Fetch uncached places concurrently using mapLimit (concurrency 6)
  const recordsToCache: Array<{ key: string; payload: string }> = [];

  await mapLimit(uncachedPlaces, 6, async (p) => {
    try {
      const url = `${BASE_URL}/xid/${encodeURIComponent(p.id)}?apikey=${apiKey}`;
      const res = await fetchWithPolicy('opentripmap', url);
      if (!res.ok) {
        resultMap.set(p.id, p);
        return;
      }

      const detail: RawPlaceDetail = await res.json();

      let formattedAddress = p.address;
      if (detail.address) {
        const parts = [
          detail.address.road,
          detail.address.suburb,
          detail.address.city || detail.address.town || detail.address.county,
          detail.address.state,
        ].filter(Boolean);
        if (parts.length > 0) {
          formattedAddress = parts.join(', ');
        }
      }

      const wikiText = detail.wikipedia_extracts?.text;
      const hasWiki = Boolean(detail.wikidata || detail.wikipedia || p.hasWiki);

      const enrichedPlace: Place = {
        ...p,
        hasWiki,
        wikipediaExtract: wikiText ? wikiText.slice(0, 350) : undefined,
        address: formattedAddress,
      };

      resultMap.set(p.id, enrichedPlace);
      recordsToCache.push({ key: `xid_v2:${p.id}`, payload: JSON.stringify(enrichedPlace) });
    } catch (err) {
      resultMap.set(p.id, p);
    }
  });

  // 3. Batch cache save (non-blocking)
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
 * Single fetchPlaceDetails for backward compatibility
 */
export async function fetchPlaceDetails(place: Place): Promise<Place> {
  const map = await batchFetchPlaceDetails([place]);
  return map.get(place.id) || place;
}
