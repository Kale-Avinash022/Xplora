import { NextResponse } from 'next/server';
import { fetchLiveWeather } from '@/lib/weather';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || searchParams.get('destination') || 'Goa';
  const startDate = searchParams.get('startDate') || undefined;

  const weather = await fetchLiveWeather(city, startDate);
  return NextResponse.json(weather, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const city = body.city || body.destination || 'Goa';
    const startDate = body.startDate || undefined;
    const weather = await fetchLiveWeather(city, startDate);
    return NextResponse.json(weather, { status: 200 });
  } catch {
    const fallback = await fetchLiveWeather('Goa');
    return NextResponse.json(fallback, { status: 200 });
  }
}
