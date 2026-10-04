import { NextResponse } from 'next/server';
import {
  StayOption,
  StaySearchRequest,
  TravelSearchEnvelope,
} from '@/lib/types';
import { validateStayQuery } from '@/lib/travel/validation';
import { searchHotelsWithSerpApi } from '@/lib/travel/providers/serpapi';
import { getServerCapabilities, getSerpApiKey } from '@/lib/config/capabilities';

export type { StayOption };

export interface HotelOption extends StayOption {
  location: string;
  rating: number;
  reviewsCount: number;
  amenities: string[];
}

/**
 * Extracts and normalizes StaySearchRequest params from Request (GET query or POST body).
 */
function extractStayParams(raw: Record<string, any>): Partial<StaySearchRequest> {
  const destination = String(raw.destination || raw.dest || raw.city || raw.q || '').trim();
  const checkIn = String(raw.checkIn || raw.check_in_date || raw.checkin || '').trim();
  const checkOut = String(raw.checkOut || raw.check_out_date || raw.checkout || '').trim();
  const guests = raw.guests ? Number(raw.guests) : raw.adults ? Number(raw.adults) : 2;
  const rooms = raw.rooms ? Number(raw.rooms) : 1;
  const currency = String(raw.currency || 'INR').trim().toUpperCase();

  return {
    destination,
    checkIn,
    checkOut,
    guests,
    rooms,
    currency,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawParams: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    rawParams[key] = val;
  });

  return handleStaySearch(rawParams);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return handleStaySearch(body || {});
  } catch {
    const envelope: TravelSearchEnvelope<StayOption> = {
      query: {},
      status: 'INVALID_REQUEST',
      results: [],
      count: 0,
      notice: 'Invalid JSON request payload provided.',
    };
    return NextResponse.json(
      { ...envelope, hotels: [] },
      { status: 400 }
    );
  }
}

async function handleStaySearch(rawParams: Record<string, any>) {
  const extracted = extractStayParams(rawParams);

  // 1. Validate stay query according to strict truthfulness rules
  const validation = validateStayQuery(extracted);
  if (!validation.isValid || !validation.data) {
    const envelope: TravelSearchEnvelope<StayOption> = {
      query: extracted,
      status: 'INVALID_REQUEST',
      results: [],
      count: 0,
      fieldErrors: validation.errors,
      notice: Object.values(validation.errors)[0] || 'Invalid stay search parameters.',
    };
    return NextResponse.json(
      {
        ...envelope,
        hotels: [],
        destination: extracted.destination,
        checkIn: extracted.checkIn,
        checkOut: extracted.checkOut,
      },
      { status: 400 }
    );
  }

  const query = validation.data;

  // 2. Server Capability & API Key Gate
  const caps = getServerCapabilities();
  const apiKey = getSerpApiKey();

  if (!caps.liveStaysEnabled || !apiKey) {
    const envelope: TravelSearchEnvelope<StayOption> = {
      query,
      status: 'UNAVAILABLE',
      results: [],
      count: 0,
      notice: 'Live accommodations search is currently unconfigured or unavailable on this server. Check back shortly.',
    };
    return NextResponse.json(
      {
        ...envelope,
        hotels: [],
        destination: query.destination,
        checkIn: query.checkIn,
        checkOut: query.checkOut,
        unavailable: true,
      },
      { status: 503 }
    );
  }

  // 3. Execute provider search (SerpAPI Google Hotels)
  const envelope = await searchHotelsWithSerpApi(query);

  const httpStatus =
    envelope.status === 'LIVE' || envelope.status === 'NO_RESULTS'
      ? 200
      : envelope.status === 'INVALID_REQUEST'
      ? 400
      : 503;

  return NextResponse.json(
    {
      ...envelope,
      hotels: envelope.results,
      destination: query.destination,
      checkIn: query.checkIn,
      checkOut: query.checkOut,
    },
    { status: httpStatus }
  );
}
