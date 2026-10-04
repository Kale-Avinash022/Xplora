// app/api/buses/cities/route.ts
// Autocomplete endpoint for bus destinations

import { NextResponse } from 'next/server';
import { searchBusPlaces } from '@/lib/travel/busService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const limitStr = searchParams.get('limit') || '8';
  const limit = Math.min(20, Math.max(1, parseInt(limitStr, 10) || 8));

  try {
    const places = searchBusPlaces(query, limit);
    return NextResponse.json({
      query,
      count: places.length,
      cities: places.map((p) => ({
        place: p.place,
        state: p.state,
        region: p.region,
        distanceFromCentre: p.distanceFromCentre,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to search cities', cities: [] },
      { status: 500 }
    );
  }
}
