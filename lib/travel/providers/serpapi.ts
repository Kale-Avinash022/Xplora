// lib/travel/providers/serpapi.ts
// Provider adapter for SerpAPI (Google Flights & Google Hotels) with credential redaction,
// explicit IATA mapping, TTL caching, and truthful standard envelopes.

import {
  FlightOption,
  FlightSearchRequest,
  StayOption,
  StaySearchRequest,
  TravelSearchEnvelope,
  ProviderMetadata,
} from '@/lib/types';
import { fetchWithPolicy } from '@/lib/http/fetchPolicy';
import { getSerpApiKey, getServerCapabilities } from '@/lib/config/capabilities';
import { validateProviderUrl } from '@/lib/travel/validation';

export class SerpApiError extends Error {
  public statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'SerpApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Strips sensitive query parameters (like api_key) before logging URLs.
 */
export function sanitizeUrlForLog(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    if (url.searchParams.has('api_key')) {
      url.searchParams.set('api_key', 'REDACTED');
    }
    return url.toString();
  } catch {
    return urlStr.replace(/api_key=[^&]+/gi, 'api_key=REDACTED');
  }
}

// ---------------------------------------------------------------------------
// Explicit City to Airport IATA Mapping (Strict — never defaults to Delhi!)
// ---------------------------------------------------------------------------
const CITY_TO_IATA: Record<string, string> = {
  delhi: 'DEL',
  'new delhi': 'DEL',
  mumbai: 'BOM',
  bombay: 'BOM',
  bangalore: 'BLR',
  bengaluru: 'BLR',
  goa: 'GOI',
  hyderabad: 'HYD',
  kolkata: 'CCU',
  calcutta: 'CCU',
  chennai: 'MAA',
  madras: 'MAA',
  pune: 'PNQ',
  jaipur: 'JAI',
  kochi: 'COK',
  cochin: 'COK',
  ahmedabad: 'AMD',
  nagpur: 'NAG',
  chandigarh: 'IXC',
  amritsar: 'ATQ',
  varanasi: 'VNS',
  lucknow: 'LKO',
  thiruvananthapuram: 'TRV',
  trivandrum: 'TRV',
  guwahati: 'GAU',
  patna: 'PAT',
  bhubaneswar: 'BBI',
  bagdogra: 'IXB',
  srinagar: 'SXR',
  udaipur: 'UDR',
  ranchi: 'IXR',
  mangalore: 'IXE',
  dehradun: 'DED',
  // International Hubs
  paris: 'CDG',
  london: 'LHR',
  dubai: 'DXB',
  singapore: 'SIN',
  tokyo: 'HND',
  'new york': 'JFK',
  bangkok: 'BKK',
  'kuala lumpur': 'KUL',
};

const VALID_IATA_CODES = new Set(Object.values(CITY_TO_IATA));

/**
 * Resolves a city name or IATA string to a validated 3-letter IATA code.
 * Returns null if unsupported — NEVER silently defaults to any other airport.
 */
export function resolveIataCode(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const clean = input.trim();
  const upper = clean.toUpperCase();

  // If already a recognized 3-letter IATA code
  if (upper.length === 3 && VALID_IATA_CODES.has(upper)) {
    return upper;
  }

  // Lookup in lowercase city mapping
  const lower = clean.toLowerCase();
  if (CITY_TO_IATA[lower]) {
    return CITY_TO_IATA[lower];
  }

  // Prefix match for cases like "Goa, India" or "Mumbai (BOM)"
  for (const [cityName, iata] of Object.entries(CITY_TO_IATA)) {
    if (lower.startsWith(cityName) || lower.includes(`(${iata.toLowerCase()})`)) {
      return iata;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// In-Memory TTL Caching (15 minutes)
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 15 * 60 * 1000;

interface CacheEntry<T> {
  envelope: TravelSearchEnvelope<T>;
  expiresAt: number;
}

const flightCache = new Map<string, CacheEntry<FlightOption>>();
const stayCache = new Map<string, CacheEntry<StayOption>>();

export function generateFlightCacheKey(req: FlightSearchRequest): string {
  const ret = req.returnDate || 'oneway';
  return `flight:${req.origin.trim().toUpperCase()}:${req.destination.trim().toUpperCase()}:${req.outboundDate}:${ret}:${req.travelers}:${req.cabinClass}:${req.currency}`;
}

export function generateStayCacheKey(req: StaySearchRequest): string {
  return `stay:${req.destination.trim().toLowerCase()}:${req.checkIn}:${req.checkOut}:${req.guests}:${req.rooms}:${req.currency}`;
}

// ---------------------------------------------------------------------------
// SerpAPI Google Flights: Request, Response Normalization & Execution
// ---------------------------------------------------------------------------

function mapCabinClassToSerpApi(cabinClass: string): string {
  switch (cabinClass) {
    case 'Premium Economy':
      return '2';
    case 'Business':
      return '3';
    case 'First Class':
      return '4';
    case 'Economy':
    default:
      return '1';
  }
}

function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return 'Direct';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Normalizes raw SerpAPI flight items into verified FlightOption models.
 */
export function normalizeSerpApiFlights(
  payload: any,
  currency: string
): FlightOption[] {
  const groups: any[] = [];
  if (Array.isArray(payload.best_flights)) {
    groups.push(...payload.best_flights);
  }
  if (Array.isArray(payload.other_flights)) {
    groups.push(...payload.other_flights);
  }

  const normalized: FlightOption[] = [];
  const nowIso = new Date().toISOString();

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const flights = Array.isArray(group.flights) ? group.flights : [];
    if (flights.length === 0) continue;

    const firstLeg = flights[0];
    const lastLeg = flights[flights.length - 1];

    const airline = firstLeg.airline || group.airline || 'Commercial Airline';
    const flightNumber = firstLeg.flight_number || `FL-${100 + i}`;
    const departureAirport = firstLeg.departure_airport?.id || firstLeg.departure_airport?.name || 'Origin';
    const arrivalAirport = lastLeg.arrival_airport?.id || lastLeg.arrival_airport?.name || 'Destination';
    const departureTime = firstLeg.departure_airport?.time || 'Scheduled';
    const arrivalTime = lastLeg.arrival_airport?.time || 'Scheduled';

    const rawPrice = group.price;
    const priceNum = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      // Discard invalid offer missing price
      continue;
    }

    const durationMin = group.total_duration;
    const duration = formatDuration(durationMin);
    const stopsCount = flights.length - 1;
    const stops = stopsCount === 0 ? 'Non-stop' : `${stopsCount} Stop${stopsCount > 1 ? 's' : ''}`;
    const isNonStop = stopsCount === 0;

    const rawBookingUrl = group.booking_token
      ? `https://www.google.com/travel/flights/booking?token=${encodeURIComponent(group.booking_token)}`
      : undefined;
    const bookingUrl = validateProviderUrl(rawBookingUrl);

    normalized.push({
      id: `serp-fl-${i}-${flightNumber}`,
      providerName: 'Google Flights via SerpAPI',
      airline,
      flightNumber,
      departureAirport,
      arrivalAirport,
      departureTime,
      arrivalTime,
      duration,
      stops,
      price: priceNum,
      currency: currency.toUpperCase(),
      priceMeaning: 'Total quoted price per traveler',
      cabinClass: firstLeg.travel_class || undefined,
      bookingUrl,
      fetchedAt: nowIso,
      logo: firstLeg.airline_logo,
      isNonStop,
      from: departureAirport,
      to: arrivalAirport,
    });
  }

  return normalized;
}

/**
 * Core provider execution for live flights via SerpAPI.
 */
export async function searchFlightsWithSerpApi(
  req: FlightSearchRequest
): Promise<TravelSearchEnvelope<FlightOption>> {
  const now = Date.now();
  const cacheKey = generateFlightCacheKey(req);

  // 1. Check TTL cache
  const cached = flightCache.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    return cached.envelope;
  }

  // 2. Validate Origin and Destination IATA
  const depIata = resolveIataCode(req.origin);
  const arrIata = resolveIataCode(req.destination);

  if (!depIata || !arrIata) {
    const unsupported = !depIata ? req.origin : req.destination;
    return {
      query: req,
      status: 'INVALID_REQUEST',
      results: [],
      count: 0,
      notice: `Live flight search is not yet available for "${unsupported}". Please choose a major listed city or airport (e.g., Delhi, Mumbai, Bengaluru, Goa).`,
      fieldErrors: {
        ...(!depIata ? { origin: `Unsupported airport for "${req.origin}".` } : {}),
        ...(!arrIata ? { destination: `Unsupported airport for "${req.destination}".` } : {}),
      },
    };
  }

  // 3. Check Server Capability & API Key
  const caps = getServerCapabilities();
  const apiKey = getSerpApiKey();

  if (!caps.liveFlightsEnabled || !apiKey) {
    return {
      query: req,
      status: 'UNAVAILABLE',
      results: [],
      count: 0,
      notice: 'Live flight search service is currently unconfigured or unavailable on this server. Check back shortly.',
    };
  }

  // 4. Construct SerpAPI Google Flights URL
  const searchParams = new URLSearchParams({
    engine: 'google_flights',
    departure_id: depIata,
    arrival_id: arrIata,
    outbound_date: req.outboundDate,
    type: req.returnDate ? '1' : '2',
    adults: String(req.travelers),
    travel_class: mapCabinClassToSerpApi(req.cabinClass),
    currency: req.currency || 'INR',
    hl: 'en',
    api_key: apiKey,
  });

  if (req.returnDate) {
    searchParams.set('return_date', req.returnDate);
  }

  const requestUrl = `https://serpapi.com/search.json?${searchParams.toString()}`;

  try {
    const res = await fetchWithPolicy('serpapi_flights', requestUrl);

    if (!res.ok) {
      let upstreamErr = '';
      try {
        const errJson = await res.json();
        upstreamErr = errJson.error || '';
      } catch {}
      console.warn(`[SerpAPI] Flights request failed with status ${res.status}: ${sanitizeUrlForLog(requestUrl)} ${upstreamErr}`);
      return {
        query: req,
        status: 'UNAVAILABLE',
        results: [],
        count: 0,
        notice: upstreamErr ? `Flight provider note: ${upstreamErr}` : 'Live flight provider returned a temporary error. Please try your search again in a moment.',
      };
    }

    const payload = await res.json();

    if (payload.error) {
      console.warn(`[SerpAPI] Upstream error: ${payload.error}`);
      return {
        query: req,
        status: 'NO_RESULTS',
        results: [],
        count: 0,
        notice: `Flight provider note: ${payload.error}`,
      };
    }

    const results = normalizeSerpApiFlights(payload, req.currency || 'INR');
    const fetchedAt = new Date().toISOString();
    const cacheExpiresAt = new Date(now + CACHE_TTL_MS).toISOString();

    const providerMetadata: ProviderMetadata = {
      providerName: 'Google Flights via SerpAPI',
      fetchedAt,
      cacheExpiresAt,
      sourceType: 'provider',
    };

    const status = results.length > 0 ? 'LIVE' : 'NO_RESULTS';
    const envelope: TravelSearchEnvelope<FlightOption> = {
      query: req,
      status,
      results,
      count: results.length,
      providerMetadata,
      notice: results.length === 0 ? 'No flight options found for the specified route and dates.' : undefined,
    };

    // Cache successful responses
    flightCache.set(cacheKey, { envelope, expiresAt: now + CACHE_TTL_MS });

    return envelope;
  } catch (err: any) {
    console.error(`[SerpAPI] Exception during flight fetch: ${err?.message || err}`);
    return {
      query: req,
      status: 'UNAVAILABLE',
      results: [],
      count: 0,
      notice: 'Flight search service experienced a timeout or connectivity issue. Please try again.',
    };
  }
}

// ---------------------------------------------------------------------------
// SerpAPI Google Hotels: Request, Response Normalization & Execution
// ---------------------------------------------------------------------------

/**
 * Normalizes raw SerpAPI hotel items into verified StayOption models.
 */
export function normalizeSerpApiHotels(
  payload: any,
  currency: string
): StayOption[] {
  const properties = Array.isArray(payload.properties) ? payload.properties : [];
  const normalized: StayOption[] = [];
  const nowIso = new Date().toISOString();

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    const name = prop.name;
    if (!name) continue;

    const rawRate =
      prop.rate_per_night?.extracted_lowest ??
      prop.extracted_lowest ??
      prop.rate_per_night?.lowest;
    const priceNum = typeof rawRate === 'number' ? rawRate : parseFloat(String(rawRate || '').replace(/[^0-9.]/g, ''));
    if (isNaN(priceNum) || priceNum <= 0) {
      continue;
    }

    const rating = typeof prop.overall_rating === 'number' ? prop.overall_rating : undefined;
    const reviewsCount = typeof prop.reviews === 'number' ? prop.reviews : undefined;
    const location = prop.description || prop.neighborhood || undefined;

    const rawImageUrl = prop.images?.[0]?.thumbnail || prop.thumbnail || undefined;
    const imageUrl = validateProviderUrl(rawImageUrl);

    const rawBookingUrl = prop.link || undefined;
    const bookingUrl = validateProviderUrl(rawBookingUrl);

    const amenities = Array.isArray(prop.amenities)
      ? prop.amenities.slice(0, 6)
      : undefined;

    normalized.push({
      id: `serp-stay-${i}-${name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15)}`,
      providerName: 'Google Hotels via SerpAPI',
      name,
      imageUrl,
      rating: rating ?? 0,
      reviewsCount: reviewsCount ?? 0,
      location: location || 'City Center',
      pricePerNight: priceNum,
      currency: currency.toUpperCase(),
      priceMeaning: 'Nightly base rate quoted by provider',
      hotelType: prop.type || 'Hotel / Resort',
      amenities: amenities || [],
      bookingUrl,
      fetchedAt: nowIso,
      image: imageUrl,
      category: prop.type || 'Hotel / Resort',
      distanceFromCenter: location || 'City Center',
    });
  }

  return normalized;
}

/**
 * Core provider execution for live hotel stays via SerpAPI.
 */
export async function searchHotelsWithSerpApi(
  req: StaySearchRequest
): Promise<TravelSearchEnvelope<StayOption>> {
  const now = Date.now();
  const cacheKey = generateStayCacheKey(req);

  // 1. Check TTL cache
  const cached = stayCache.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    return cached.envelope;
  }

  // 2. Check Server Capability & API Key
  const caps = getServerCapabilities();
  const apiKey = getSerpApiKey();

  if (!caps.liveStaysEnabled || !apiKey) {
    return {
      query: req,
      status: 'UNAVAILABLE',
      results: [],
      count: 0,
      notice: 'Live accommodations search is currently unconfigured or unavailable on this server. Check back shortly.',
    };
  }

  // 3. Construct SerpAPI Google Hotels URL
  const searchParams = new URLSearchParams({
    engine: 'google_hotels',
    q: req.destination,
    check_in_date: req.checkIn,
    check_out_date: req.checkOut,
    adults: String(req.guests),
    currency: req.currency || 'INR',
    hl: 'en',
    api_key: apiKey,
  });

  const requestUrl = `https://serpapi.com/search.json?${searchParams.toString()}`;

  try {
    const res = await fetchWithPolicy('serpapi_hotels', requestUrl);

    if (!res.ok) {
      console.warn(`[SerpAPI] Hotels request failed with status ${res.status}: ${sanitizeUrlForLog(requestUrl)}`);
      return {
        query: req,
        status: 'UNAVAILABLE',
        results: [],
        count: 0,
        notice: 'Accommodations provider returned a temporary error. Please try your search again in a moment.',
      };
    }

    const payload = await res.json();

    if (payload.error) {
      console.warn(`[SerpAPI] Upstream error: ${payload.error}`);
      return {
        query: req,
        status: 'NO_RESULTS',
        results: [],
        count: 0,
        notice: `Hotel provider note: ${payload.error}`,
      };
    }

    const results = normalizeSerpApiHotels(payload, req.currency || 'INR');
    const fetchedAt = new Date().toISOString();
    const cacheExpiresAt = new Date(now + CACHE_TTL_MS).toISOString();

    const providerMetadata: ProviderMetadata = {
      providerName: 'Google Hotels via SerpAPI',
      fetchedAt,
      cacheExpiresAt,
      sourceType: 'provider',
    };

    const status = results.length > 0 ? 'LIVE' : 'NO_RESULTS';
    const envelope: TravelSearchEnvelope<StayOption> = {
      query: req,
      status,
      results,
      count: results.length,
      providerMetadata,
      notice: results.length === 0 ? `No available properties found for "${req.destination}" on the selected dates.` : undefined,
    };

    // Cache successful responses
    stayCache.set(cacheKey, { envelope, expiresAt: now + CACHE_TTL_MS });

    return envelope;
  } catch (err: any) {
    console.error(`[SerpAPI] Exception during hotel fetch: ${err?.message || err}`);
    return {
      query: req,
      status: 'UNAVAILABLE',
      results: [],
      count: 0,
      notice: 'Hotel search service experienced a timeout or connectivity issue. Please try again.',
    };
  }
}
