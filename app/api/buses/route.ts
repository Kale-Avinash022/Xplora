// app/api/buses/route.ts
// Search endpoint for bus travels and local buses
// Distance calculated using Centre Triangle (Nagpur Zero Mile Stone reference)
// Pricing calculated with mathematical formula: ₹13 per km
// Redirects ticket booking to https://www.redbus.in/

import { NextResponse } from 'next/server';
import { BusOption, BusSearchRequest, TravelSearchEnvelope } from '@/lib/types';
import { validateBusQuery } from '@/lib/travel/validation';
import { searchBuses } from '@/lib/travel/busService';

export type { BusOption, BusSearchRequest };

/**
 * Extracts BusSearchRequest parameters from GET query or POST body
 */
function extractBusParams(raw: Record<string, any>): Partial<BusSearchRequest> {
  const origin = String(raw.origin || raw.from || raw.departure || '').trim();
  const destination = String(raw.destination || raw.to || raw.arrival || '').trim();
  const date = String(raw.date || raw.outboundDate || raw.journeyDate || raw.travelDate || '').trim();
  const category = (raw.category === 'TRAVELS' || raw.category === 'LOCAL') ? raw.category : 'ALL';
  const travelers = raw.travelers ? Number(raw.travelers) : raw.adults ? Number(raw.adults) : 1;

  return {
    origin,
    destination,
    date,
    category,
    travelers,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawParams: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    rawParams[key] = val;
  });

  return handleBusSearch(rawParams);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return handleBusSearch(body || {});
  } catch {
    const envelope: TravelSearchEnvelope<BusOption> = {
      query: { origin: '', destination: '', date: '' },
      status: 'INVALID_REQUEST',
      results: [],
      count: 0,
      notice: 'Invalid JSON request payload provided.',
    };
    return NextResponse.json(
      { ...envelope, buses: [] },
      { status: 400 }
    );
  }
}

async function handleBusSearch(rawParams: Record<string, any>) {
  const extracted = extractBusParams(rawParams);

  // 1. Validation
  const validation = validateBusQuery(extracted);
  if (!validation.isValid || !validation.data) {
    const envelope: TravelSearchEnvelope<BusOption> = {
      query: extracted as BusSearchRequest,
      status: 'INVALID_REQUEST',
      results: [],
      count: 0,
      fieldErrors: validation.errors,
      notice: Object.values(validation.errors)[0] || 'Invalid bus search parameters.',
    };
    return NextResponse.json(
      {
        ...envelope,
        buses: [],
        from: extracted.origin,
        to: extracted.destination,
        date: extracted.date,
      },
      { status: 400 }
    );
  }

  const query = validation.data;

  // 2. Search and compute
  const envelope = await searchBuses(query);

  const httpStatus =
    envelope.status === 'LIVE' || envelope.status === 'NO_RESULTS'
      ? 200
      : envelope.status === 'INVALID_REQUEST'
      ? 400
      : 503;

  return NextResponse.json(
    {
      ...envelope,
      buses: envelope.results,
      from: query.origin,
      to: query.destination,
      date: query.date,
    },
    { status: httpStatus }
  );
}
