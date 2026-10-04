import { NextResponse } from 'next/server';
import {
  FlightOption,
  FlightSearchRequest,
  TravelSearchEnvelope,
  CabinClass,
} from '@/lib/types';
import { validateFlightQuery, getTodayIsoDate } from '@/lib/travel/validation';
import {
  searchFlightsWithSerpApi,
  resolveIataCode,
} from '@/lib/travel/providers/serpapi';
import { getServerCapabilities, getSerpApiKey } from '@/lib/config/capabilities';

// Re-export type for backward compatibility until Phase 5 component refactor
export type { FlightOption };

/**
 * Extracts and normalizes FlightSearchRequest params from Request (GET query or POST body).
 */
function extractFlightParams(raw: Record<string, any>): Partial<FlightSearchRequest> {
  const origin = String(raw.origin || raw.from || '').trim();
  const destination = String(raw.destination || raw.to || '').trim();
  const outboundDate = String(raw.outboundDate || raw.date || raw.departure || '').trim();
  const returnDate = raw.returnDate ? String(raw.returnDate).trim() : undefined;
  const travelers = raw.travelers ? Number(raw.travelers) : raw.adults ? Number(raw.adults) : 1;
  const cabinClass = (raw.cabinClass || raw.classType || 'Economy') as CabinClass;
  const currency = String(raw.currency || 'INR').trim().toUpperCase();

  return {
    origin,
    destination,
    outboundDate,
    returnDate,
    travelers,
    cabinClass,
    currency,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawParams: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    rawParams[key] = val;
  });

  return handleFlightSearch(rawParams);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return handleFlightSearch(body || {});
  } catch {
    const envelope: TravelSearchEnvelope<FlightOption> = {
      query: {},
      status: 'INVALID_REQUEST',
      results: [],
      count: 0,
      notice: 'Invalid JSON request payload provided.',
    };
    return NextResponse.json(
      { ...envelope, flights: [] },
      { status: 400 }
    );
  }
}

async function handleFlightSearch(rawParams: Record<string, any>) {
  const extracted = extractFlightParams(rawParams);

  // 1. Validate parameters using shared validation layer
  const validation = validateFlightQuery(extracted);
  if (!validation.isValid || !validation.data) {
    const envelope: TravelSearchEnvelope<FlightOption> = {
      query: extracted,
      status: 'INVALID_REQUEST',
      results: [],
      count: 0,
      fieldErrors: validation.errors,
      notice: Object.values(validation.errors)[0] || 'Invalid flight search parameters.',
    };
    return NextResponse.json(
      {
        ...envelope,
        flights: [],
        from: extracted.origin,
        to: extracted.destination,
        date: extracted.outboundDate,
      },
      { status: 400 }
    );
  }

  const query = validation.data;

  // 2. Resolve Airport IATA codes (never silently default to Delhi)
  const depIata = resolveIataCode(query.origin);
  const arrIata = resolveIataCode(query.destination);

  if (!depIata || !arrIata) {
    const unsupported = !depIata ? query.origin : query.destination;
    const fieldErrors: Record<string, string> = {
      ...(!depIata ? { origin: `Unsupported airport for "${query.origin}".` } : {}),
      ...(!arrIata ? { destination: `Unsupported airport for "${query.destination}".` } : {}),
    };
    const envelope: TravelSearchEnvelope<FlightOption> = {
      query,
      status: 'INVALID_REQUEST',
      results: [],
      count: 0,
      fieldErrors,
      notice: `Live flight search is not yet available for "${unsupported}". Please choose a listed city or airport.`,
    };
    return NextResponse.json(
      {
        ...envelope,
        flights: [],
        from: query.origin,
        to: query.destination,
        date: query.outboundDate,
      },
      { status: 422 }
    );
  }

  // 3. Server Capability & API Key Gate
  const caps = getServerCapabilities();
  const apiKey = getSerpApiKey();

  if (!caps.liveFlightsEnabled || !apiKey) {
    const envelope: TravelSearchEnvelope<FlightOption> = {
      query,
      status: 'UNAVAILABLE',
      results: [],
      count: 0,
      notice: 'Live flight search service is currently unconfigured or unavailable on this server. Check back shortly.',
    };
    return NextResponse.json(
      {
        ...envelope,
        flights: [],
        from: query.origin,
        to: query.destination,
        date: query.outboundDate,
        unavailable: true,
      },
      { status: 503 }
    );
  }

  // 4. Execute provider search (SerpAPI Google Flights)
  const envelope = await searchFlightsWithSerpApi(query);

  const httpStatus =
    envelope.status === 'LIVE' || envelope.status === 'NO_RESULTS'
      ? 200
      : envelope.status === 'INVALID_REQUEST'
      ? 400
      : 503;

  return NextResponse.json(
    {
      ...envelope,
      flights: envelope.results,
      from: query.origin,
      to: query.destination,
      date: query.outboundDate,
    },
    { status: httpStatus }
  );
}
