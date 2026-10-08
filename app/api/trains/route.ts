// app/api/trains/route.ts
// Live railway search endpoint powered by Qrail provider adapter

import { NextResponse } from 'next/server';
import {
  TrainOption,
  TrainSearchRequest,
  TravelSearchEnvelope,
} from '@/lib/types';
import { validateTrainQuery } from '@/lib/travel/validation';
import { resolveStationCode } from '@/lib/travel/providers/qrail/stations';
import { searchTrainsWithQrail } from '@/lib/travel/providers/qrail/service';
import { getServerCapabilities, getQrailApiKey } from '@/lib/config/capabilities';

export type { TrainOption, TrainSearchRequest };

/**
 * Extracts and normalizes TrainSearchRequest params from Request (GET query or POST body).
 */
function extractTrainParams(raw: Record<string, any>): Partial<TrainSearchRequest> {
  const origin = String(raw.origin || raw.from || raw.departure || '').trim();
  const destination = String(raw.destination || raw.to || raw.arrival || '').trim();
  const date = String(raw.date || raw.outboundDate || raw.journeyDate || '').trim();
  const trainClass = raw.trainClass || raw.classType || raw.class || undefined;
  const quota = String(raw.quota || 'GN').trim().toUpperCase();
  const travelers = raw.travelers ? Number(raw.travelers) : raw.adults ? Number(raw.adults) : 1;

  return {
    origin,
    destination,
    date,
    trainClass: trainClass ? String(trainClass).trim() : undefined,
    quota,
    travelers,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawParams: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    rawParams[key] = val;
  });

  return handleTrainSearch(rawParams);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return handleTrainSearch(body || {});
  } catch {
    const envelope: TravelSearchEnvelope<TrainOption> = {
      query: { origin: '', destination: '', date: '' },
      status: 'INVALID_REQUEST',
      results: [],
      count: 0,
      notice: 'Invalid JSON request payload provided.',
    };
    return NextResponse.json(
      { ...envelope, trains: [] },
      { status: 400 }
    );
  }
}

async function handleTrainSearch(rawParams: Record<string, any>) {
  const extracted = extractTrainParams(rawParams);

  // 1. Validate parameters using shared validation layer
  const validation = validateTrainQuery(extracted);
  if (!validation.isValid || !validation.data) {
    const envelope: TravelSearchEnvelope<TrainOption> = {
      query: extracted as TrainSearchRequest,
      status: 'INVALID_REQUEST',
      results: [],
      count: 0,
      fieldErrors: validation.errors,
      notice: Object.values(validation.errors)[0] || 'Invalid train search parameters.',
    };
    return NextResponse.json(
      {
        ...envelope,
        trains: [],
        from: extracted.origin,
        to: extracted.destination,
        date: extracted.date,
      },
      { status: 400 }
    );
  }

  const query = validation.data;

  // 2. Resolve Station Codes (never silently invent or default)
  const originStation = resolveStationCode(query.origin);
  const destStation = resolveStationCode(query.destination);

  if (!originStation || !destStation) {
    const unsupported = !originStation ? query.origin : query.destination;
    const fieldErrors: Record<string, string> = {
      ...(!originStation ? { origin: `Unsupported or unrecognized station for "${query.origin}".` } : {}),
      ...(!destStation ? { destination: `Unsupported or unrecognized station for "${query.destination}".` } : {}),
    };
    const envelope: TravelSearchEnvelope<TrainOption> = {
      query,
      status: 'INVALID_REQUEST',
      results: [],
      count: 0,
      fieldErrors,
      notice: `Station code could not be resolved for "${unsupported}". Please specify a valid station name or IRCTC station code (e.g. NDLS, CSMT, PUNE, NGP).`,
    };
    return NextResponse.json(
      {
        ...envelope,
        trains: [],
        from: query.origin,
        to: query.destination,
        date: query.date,
      },
      { status: 422 }
    );
  }

  // 3. Execute search via Qrail provider adapter or verified timetable schedule
  const envelope = await searchTrainsWithQrail(query);

  const httpStatus =
    envelope.status === 'LIVE' || envelope.status === 'NO_RESULTS'
      ? 200
      : envelope.status === 'INVALID_REQUEST'
      ? 400
      : 503;

  return NextResponse.json(
    {
      ...envelope,
      trains: envelope.results,
      from: query.origin,
      to: query.destination,
      date: query.date,
      unavailable: envelope.status === 'UNAVAILABLE',
    },
    { status: httpStatus }
  );
}
