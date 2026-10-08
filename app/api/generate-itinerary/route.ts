import { NextResponse } from 'next/server';
import { fetchLiveWeather, WeatherDataResponse } from '@/lib/weather';
import {
  geocodeDestination,
  fetchPlacesInRadius,
  filterCandidatesByQuality,
  batchFetchPlaceDetails,
  Place,
} from '@/lib/places/opentripmap';
import { STYLE_TO_KINDS } from '@/lib/places/categories';
import { assembleItinerary, ItineraryDayPlan } from '@/lib/places/itineraryBuilder';
import { batchFetchOverpassDetails, OverpassPlaceData } from '@/lib/places/overpass';
import { ImageService } from '@/lib/images/service';
import { ImagePhoto, ImageProviderName, PlaceCategoryType } from '@/lib/images/types';
import { RequestTracker } from '@/lib/perf/timing';
import { getOrSet, setCacheRecord, peekCacheRecord, normalizeKey } from '@/lib/cache';
import { CACHE_TTLS } from '@/lib/cache/ttls';
import { RequestBudget } from '@/lib/perf/budget';
import { generatePlaceSummaries } from '@/lib/llm/client';
import { estimateTripCost, TripCostEstimate } from '@/lib/costEstimator';

export interface GeneratedActivity {
  id: string;
  timeSlot: string;
  timeSlotNote?: string;
  title: string;
  description: string;
  category: 'Flight' | 'Hotel' | 'Sightseeing' | 'Dining' | 'Activity';
  kindLabel?: string;
  cost: number;
  costLabel: string;
  feeState: 'FREE' | 'PAID_KNOWN' | 'PAID_UNKNOWN' | 'UNKNOWN';
  osmSource?: boolean;
  website?: string;
  phone?: string;
  openingHours?: string;
  location: string;
  address?: string;
  mapsUrl?: string;
  isIndoor?: boolean;
  isIndoorOption?: boolean;
  lat?: number;
  lng?: number;
  travelTimeFromPrev?: string;
  travelDistanceKm?: number;
  image?: ImagePhoto;
}

export interface GeneratedDayPlan {
  dayNumber: number;
  summary: string;
  isDayTrip?: boolean;
  totalTravelKm?: number;
  activities: GeneratedActivity[];
}

export interface GeneratedItineraryResponse {
  title: string;
  destination: string;
  durationDays: number;
  totalBudget: number;
  estimatedCost: number;
  hasUnknownPricing: boolean;
  currency: string;
  travelStyle: string;
  weatherSwapNotice?: string | null;
  limitedData?: boolean;
  usedImageProviders?: ImageProviderName[];
  geocodedCenter?: {
    lat: number;
    lng: number;
  };
  weatherPreview: {
    temp: string;
    condition: string;
    recommendation: string;
    icon?: string;
    humidity?: string;
    windSpeed?: string;
    forecast?: Array<{
      day: string;
      condition: string;
      tempMax: string;
      tempMin: string;
      icon: string;
    }>;
  };
  dayPlans: GeneratedDayPlan[];
  costEstimate?: TripCostEstimate;
  budgetWarning?: {
    isUnderBudget: boolean;
    minimumRequired: number;
    recommended: number;
    deficit: number;
  } | null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      destination = 'Pune',
      durationDays = 4,
      budget = 25000,
      travelStyle = 'Family',
      startDate,
    } = body;

    const parsedDays = Math.min(Math.max(Number(durationDays) || 3, 1), 30);
    const parsedBudget = Number(budget) || 25000;
    const cleanDest = (destination || 'Pune').trim();

    const tracker = new RequestTracker(cleanDest);

    // Check finished itinerary cache (6-hour TTL)
    const tripCacheKey = normalizeKey(
      'itinerary',
      `${cleanDest}:${startDate || 'nodate'}:${parsedDays}:${travelStyle}:${parsedBudget}:1`
    );

    const cachedResponse = await tracker.timeStage('itinerary_cache_check', async () => {
      try {
        return await peekCacheRecord<GeneratedItineraryResponse>(tripCacheKey, { tracker });
      } catch {
        return null;
      }
    });

    if (cachedResponse) {
      const hasOnlyPlaceholders =
        (!cachedResponse.usedImageProviders || cachedResponse.usedImageProviders.length === 0) &&
        cachedResponse.dayPlans.some((dp) => dp.activities.some((a) => a.image?.isPlaceholder || !a.image?.url));

      if (hasOnlyPlaceholders) {
        try {
          const tripAssignmentInput = cachedResponse.dayPlans.map((dp) => ({
            dayNumber: dp.dayNumber,
            activities: dp.activities.map((act) => ({
              id: act.id,
              title: act.title,
              kindsStr: act.kindLabel || act.category || '',
            })),
          }));
          const imgRes = await ImageService.assignImagesToTrip(cleanDest, tripAssignmentInput);
          if (imgRes.usedProviders.length > 0) {
            cachedResponse.usedImageProviders = imgRes.usedProviders;
            for (const dp of cachedResponse.dayPlans) {
              for (const act of dp.activities) {
                const assigned = imgRes.photoMap.get(act.id);
                if (assigned && !assigned.isPlaceholder) {
                  act.image = assigned;
                }
              }
            }
            setCacheRecord(tripCacheKey, cachedResponse, CACHE_TTLS.FINISHED_ITINERARY).catch(() => {});
          }
        } catch (enrichErr) {
          console.warn('[Generate Itinerary] Failed to enrich cached itinerary with images:', enrichErr);
        }
      }

      tracker.logMetrics();
      return NextResponse.json(cachedResponse, {
        status: 200,
        headers: {
          'Server-Timing': tracker.getServerTimingHeader(),
          'X-Cache-Hit': 'true',
        },
      });
    }

    // 1. Geocode destination center via OpenTripMap
    let geoCenter;
    try {
      geoCenter = await tracker.timeStage('geocode', () => geocodeDestination(cleanDest));
    } catch (err) {
      console.error('[Generate Itinerary] Geocoding error:', err);
      tracker.recordProviderFailure('opentripmap_geocode');
      tracker.logMetrics();
      return NextResponse.json(
        { error: `OpenTripMap service configuration error. Please ensure OPENTRIPMAP_API_KEY is configured.` },
        { status: 500, headers: { 'Server-Timing': tracker.getServerTimingHeader() } }
      );
    }

    if (!geoCenter) {
      tracker.logMetrics();
      return NextResponse.json(
        { error: `We couldn't find verified places for "${cleanDest}". Please check the destination name and try again.` },
        { status: 404, headers: { 'Server-Timing': tracker.getServerTimingHeader() } }
      );
    }

    // 2 & 3. Concurrent stage after geocoding: Weather and Places radius search run together!
    const preferredKinds = STYLE_TO_KINDS[travelStyle] || STYLE_TO_KINDS['General'];
    const radiusKinds = Array.from(
      new Set([preferredKinds[0], preferredKinds[1] || 'cultural', 'historic', 'interesting_places', 'natural', 'religion'])
    ).filter(Boolean).join(',');

    const [weatherSettled, placesSettled] = await Promise.allSettled([
      tracker.timeStage('weather', () => fetchLiveWeather(cleanDest, startDate)),
      tracker.timeStage('candidates_fetch', () =>
        fetchPlacesInRadius(cleanDest, geoCenter.lat, geoCenter.lng, radiusKinds)
      ),
    ]);

    // Handle weather result (degrade gracefully if failed)
    let liveWeatherData: WeatherDataResponse;
    if (weatherSettled.status === 'fulfilled') {
      liveWeatherData = weatherSettled.value;
    } else {
      console.warn('[Generate Itinerary] Weather failed, degrading gracefully:', weatherSettled.reason);
      tracker.recordProviderFailure('weather');
      liveWeatherData = {
        city: cleanDest,
        temp: '26°C',
        tempNum: 26,
        condition: 'Sunny & Pleasant',
        icon: '☀️',
        humidity: '55%',
        windSpeed: '12 km/h',
        recommendation: `Forecast is currently unavailable for ${cleanDest}.`,
        packingAdvice: 'Pack standard travel essentials.',
        packingBadge: 'Essentials',
        isLive: false,
        forecast: [],
      };
    }

    // Identify rain on specific days
    const rainyDays: boolean[] = [];
    const conditionLower = (liveWeatherData.condition || '').toLowerCase();
    const isMainRain =
      conditionLower.includes('rain') ||
      conditionLower.includes('shower') ||
      conditionLower.includes('thunder') ||
      conditionLower.includes('drizzle');

    for (let d = 0; d < parsedDays; d++) {
      if (liveWeatherData.forecast && liveWeatherData.forecast[d]) {
        const fCond = liveWeatherData.forecast[d].condition.toLowerCase();
        rainyDays.push(
          fCond.includes('rain') ||
            fCond.includes('shower') ||
            fCond.includes('thunder') ||
            fCond.includes('drizzle')
        );
      } else {
        rainyDays.push(isMainRain);
      }
    }

    // Handle places candidates
    let allRawCandidates: Place[] = [];
    let isLimitedData = false;
    if (placesSettled.status === 'fulfilled') {
      allRawCandidates = placesSettled.value.rawPlaces;
      isLimitedData = !!placesSettled.value.limitedData;
    } else {
      console.error('[Generate Itinerary] Candidates fetch failed:', placesSettled.reason);
      tracker.recordProviderFailure('opentripmap_radius');
    }

    // Filter candidates by quality (FIX 1: rate >= 2 first, exclude cinemas/malls, drop generic names)
    const { sightseeingCandidates, rainyIndoorFallbacks } = filterCandidatesByQuality(
      allRawCandidates,
      parsedDays
    );

    if (sightseeingCandidates.length === 0) {
      tracker.logMetrics();
      return NextResponse.json(
        { error: `We couldn't find verified places for ${cleanDest}. Please try again.` },
        { status: 404, headers: { 'Server-Timing': tracker.getServerTimingHeader() } }
      );
    }

    // 4. Assemble deterministic itinerary (FIX 2, FIX 3, FIX 4, FIX 7)
    const assembled = tracker.timeStage('route_assemble', async () =>
      assembleItinerary(
        cleanDest,
        sightseeingCandidates,
        rainyIndoorFallbacks,
        parsedDays,
        preferredKinds,
        rainyDays,
        geoCenter,
        startDate
      )
    ) as unknown as ReturnType<typeof assembleItinerary>;
    const assembledResolved = await assembled;

    if (assembledResolved.dayPlans.length === 0) {
      tracker.logMetrics();
      return NextResponse.json(
        { error: `We couldn't find verified places for ${cleanDest}. Please try again.` },
        { status: 404, headers: { 'Server-Timing': tracker.getServerTimingHeader() } }
      );
    }

    // 5. Enrich shortlisted places via OpenTripMap batch /xid and batched Overpass API
    // days * 3 + 3 shortlisted places per Phase 1 rule
    const maxPlacesToEnrich = Math.min(24, parsedDays * 3 + 3);
    const placesToFetch = assembledResolved.shortlistedPlaces.slice(0, maxPlacesToEnrich);

    let enrichedPlacesMap = new Map<string, Place>();
    let overpassDataMap = new Map<string, OverpassPlaceData>();

    await tracker.timeStage('enrichment_overpass_otm', async () => {
      const [otmEnrichSettled, overpassSettled] = await Promise.allSettled([
        batchFetchPlaceDetails(placesToFetch),
        batchFetchOverpassDetails(placesToFetch.map((p) => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng }))),
      ]);

      if (otmEnrichSettled.status === 'fulfilled') {
        enrichedPlacesMap = otmEnrichSettled.value;
      } else {
        console.warn('[Generate Itinerary] OpenTripMap batch enrichment failed:', otmEnrichSettled.reason);
        tracker.recordProviderFailure('opentripmap_details');
        for (const p of placesToFetch) enrichedPlacesMap.set(p.id, p);
      }

      if (overpassSettled.status === 'fulfilled') {
        overpassDataMap = overpassSettled.value;
      } else {
        console.warn('[Generate Itinerary] Overpass batch query failed:', overpassSettled.reason);
        tracker.recordProviderFailure('overpass');
      }
    });

    // 6. Assign unique images across the trip using Pexels & Unsplash
    let photoMap = new Map<string, ImagePhoto>();
    let usedImageProviders: ImageProviderName[] = [];
    await tracker.timeStage('images_assignment', async () => {
      try {
        const tripAssignmentInput = assembledResolved.dayPlans.map((dp) => ({
          dayNumber: dp.dayNumber,
          activities: dp.activities.map((act) => {
            const place = enrichedPlacesMap.get(act.id);
            return {
              id: act.id,
              title: act.title,
              kindsStr: place?.kindsStr || '',
              rate: place?.rate,
              hasWiki: place?.hasWiki,
            };
          }),
        }));
        const imgRes = await ImageService.assignImagesToTrip(cleanDest, tripAssignmentInput);
        photoMap = imgRes.photoMap;
        usedImageProviders = imgRes.usedProviders;
      } catch (imgErr) {
        console.error('[Generate Itinerary] Image assignment error:', imgErr);
        tracker.recordProviderFailure('image_service');
      }
    });

    // 7. Build final activity representations with accurate price states & images
    let totalKnownCost = 0;
    let hasUnknownPricing = false;

    const finalDayPlans: GeneratedDayPlan[] = assembledResolved.dayPlans.map((dp) => ({
      dayNumber: dp.dayNumber,
      summary: dp.summary,
      isDayTrip: dp.isDayTrip,
      totalTravelKm: dp.totalTravelKm,
      activities: dp.activities.map((act) => {
        const enriched = enrichedPlacesMap.get(act.id);
        const resolvedAddress = enriched?.address || act.address;

        let resolvedDesc = act.description;
        if (enriched?.wikipediaExtract && enriched.wikipediaExtract.length > 20) {
          const sentences = enriched.wikipediaExtract.replace(/\[\d+\]/g, '').trim().split(/(?<=[.?!])\s+/);
          let candidate = sentences.slice(0, 2).join(' ');
          if (candidate.length > 220) {
            candidate = sentences[0].length <= 220 ? sentences[0] : candidate.slice(0, 217) + '...';
          }
          resolvedDesc = candidate;
        }

        const opData = overpassDataMap.get(act.id);

        let feeState: 'FREE' | 'PAID_KNOWN' | 'PAID_UNKNOWN' | 'UNKNOWN' = 'UNKNOWN';
        let costNum = 0;
        let costLabelStr = 'Price not available';
        let osmSource = false;
        let website = opData?.website;
        let phone = opData?.phone;
        let openingHours = opData?.openingHoursRaw;

        if (opData?.matched) {
          feeState = opData.feeState;
          osmSource = true;

          if (feeState === 'FREE') {
            costNum = 0;
            costLabelStr = 'Free';
          } else if (feeState === 'PAID_KNOWN') {
            costNum = opData.parsedAmount || 0;
            costLabelStr = `${opData.chargeText || `₹${costNum}`} (OpenStreetMap)`;
            totalKnownCost += costNum;
          } else if (feeState === 'PAID_UNKNOWN') {
            costLabelStr = 'Paid, amount not listed';
            hasUnknownPricing = true;
          } else {
            costLabelStr = 'Price not available';
            hasUnknownPricing = true;
          }
        } else {
          hasUnknownPricing = true;
        }

        const assignedImage = photoMap.get(act.id);

        return {
          id: act.id,
          timeSlot: act.timeSlot,
          timeSlotNote: act.timeSlotNote,
          title: act.title,
          description: resolvedDesc,
          category: act.category,
          kindLabel: act.kindLabel,
          cost: costNum,
          costLabel: costLabelStr,
          feeState,
          osmSource,
          website,
          phone,
          openingHours,
          location: resolvedAddress || `${cleanDest}`,
          address: resolvedAddress,
          mapsUrl: act.mapsUrl,
          isIndoor: act.isIndoor,
          isIndoorOption: act.isIndoorOption,
          lat: act.lat,
          lng: act.lng,
          travelTimeFromPrev: act.travelTimeFromPrev,
          travelDistanceKm: act.travelDistanceKm,
          image: assignedImage,
        };
      }),
    }));

    const tripCostEstimate = estimateTripCost({
      destination: cleanDest,
      from: body.from,
      durationDays: parsedDays,
      travelers: Number(body.travelers) || 2,
      travelStyle,
    });

    const budgetWarning =
      parsedBudget < tripCostEstimate.minimumRequired
        ? {
            isUnderBudget: true,
            minimumRequired: tripCostEstimate.minimumRequired,
            recommended: tripCostEstimate.recommended,
            deficit: tripCostEstimate.minimumRequired - parsedBudget,
          }
        : null;

    const responsePayload: GeneratedItineraryResponse = {
      title: `${parsedDays}-Day ${travelStyle} Trip to ${cleanDest}`,
      destination: cleanDest,
      durationDays: parsedDays,
      totalBudget: parsedBudget,
      estimatedCost: totalKnownCost,
      hasUnknownPricing,
      currency: 'INR',
      travelStyle,
      weatherSwapNotice: assembledResolved.weatherSwapNotice,
      limitedData: isLimitedData,
      usedImageProviders,
      geocodedCenter: {
        lat: geoCenter.lat,
        lng: geoCenter.lng,
      },
      weatherPreview: {
        temp: liveWeatherData.temp,
        condition: liveWeatherData.condition,
        recommendation: liveWeatherData.recommendation,
        icon: liveWeatherData.icon,
        humidity: liveWeatherData.humidity,
        windSpeed: liveWeatherData.windSpeed,
        forecast: liveWeatherData.forecast,
      },
      dayPlans: finalDayPlans,
      costEstimate: tripCostEstimate,
      budgetWarning,
    };

    // Save finished itinerary in cache (6 hours)
    setCacheRecord(tripCacheKey, responsePayload, CACHE_TTLS.FINISHED_ITINERARY).catch(() => {});

    tracker.logMetrics();
    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        'Server-Timing': tracker.getServerTimingHeader(),
      },
    });
  } catch (error) {
    console.error('Generate Itinerary API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate itinerary. Please try again later.' },
      { status: 500 }
    );
  }
}
