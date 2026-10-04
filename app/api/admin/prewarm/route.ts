import { NextResponse } from 'next/server';
import { geocodeDestination, fetchPlacesInRadius, batchFetchPlaceDetails } from '@/lib/places/opentripmap';
import { ImageService } from '@/lib/images/service';

const PREWARM_CITIES = [
  'Pune', 'Jaipur', 'Goa', 'Mumbai', 'Delhi', 'Manali', 'Udaipur', 'Kochi',
  'Varanasi', 'Agra', 'Bangalore', 'Kolkata', 'Hyderabad', 'Chennai', 'Shimla',
  'Amritsar', 'Rishikesh', 'Jaisalmer', 'Ooty', 'Munnar', 'Hampi', 'Mysore',
  'Darjeeling', 'Gangtok', 'Pondicherry', 'Nainital', 'Khajuraho', 'Madurai',
  'Alleppey', 'Leh'
];

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization') || '';
  const expectedSecret = process.env.PREWARM_SECRET?.trim();

  if (!expectedSecret || !authHeader.startsWith('Bearer ') || authHeader.slice(7).trim() !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Array<{ city: string; status: string; placesCount?: number }> = [];

  // Concurrency 2 across the 30 cities to respect provider limits
  const queue = [...PREWARM_CITIES];

  async function worker() {
    while (queue.length > 0) {
      const city = queue.shift();
      if (!city) break;

      try {
        // 1. Geocode
        const geo = await geocodeDestination(city);
        if (!geo) {
          results.push({ city, status: 'geocode_failed' });
          continue;
        }

        // 2. Places radius search
        const { rawPlaces } = await fetchPlacesInRadius(city, geo.lat, geo.lng);

        // 3. Top 12 details
        const top12 = rawPlaces.slice(0, 12);
        await batchFetchPlaceDetails(top12);

        // 4. Photo pools (landmark, garden, fort)
        await Promise.allSettled([
          ImageService.getCategoryPool(city, 'landmark'),
          ImageService.getCategoryPool(city, 'garden'),
          ImageService.getCategoryPool(city, 'fort'),
        ]);

        results.push({ city, status: 'prewarmed', placesCount: rawPlaces.length });
      } catch (err) {
        results.push({ city, status: 'error' });
      }
    }
  }

  await Promise.all([worker(), worker()]);

  return NextResponse.json({
    success: true,
    totalPrewarmed: results.length,
    results,
  });
}
