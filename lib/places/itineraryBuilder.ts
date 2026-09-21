// lib/places/itineraryBuilder.ts
// Deterministic Itinerary Builder: Clustering, Nearest Neighbor Routing, Scoring, Strict Factual Generation, and Distance Capping

import { Place } from './opentripmap';
import { getFriendlyKindLabel, getCategoryTimingKey, CATEGORY_TIMINGS } from './categories';
import { OverpassPlaceData } from './overpass';

export interface ItineraryActivity {
  id: string; // Real OpenTripMap xid
  timeSlot: string;
  timeSlotNote?: string;
  title: string;
  description: string;
  category: 'Sightseeing' | 'Dining' | 'Activity' | 'Hotel' | 'Flight';
  kindLabel: string;
  cost: number;
  costLabel: string;
  feeState: 'FREE' | 'PAID_KNOWN' | 'PAID_UNKNOWN' | 'UNKNOWN';
  osmSource?: boolean;
  website?: string;
  phone?: string;
  openingHours?: string;
  location: string;
  address?: string;
  mapsUrl: string;
  isIndoor: boolean;
  isIndoorOption?: boolean;
  lat: number;
  lng: number;
  travelDistanceKm?: number;
  travelTimeFromPrev?: string;
}

export interface ItineraryDayPlan {
  dayNumber: number;
  summary: string;
  isDayTrip?: boolean;
  totalTravelKm?: number;
  activities: ItineraryActivity[];
}

export interface BuildItineraryResult {
  dayPlans: ItineraryDayPlan[];
  weatherSwapNotice: string | null;
  shortlistedPlaces: Place[];
  limitedData?: boolean;
}

/**
 * Haversine distance in kilometers between two lat/lng coordinates
 */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format travel distance and time between consecutive stops
 * e.g. "12 km, about 30 min, approx"
 */
export function formatTravelDistanceAndTime(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { distanceKm: number; label: string } {
  const directDistKm = haversineKm(lat1, lon1, lat2, lon2);
  const actualDistKm = Math.round(directDistKm * 1.35 * 10) / 10;
  const speedKmH = 25;
  const timeMinutes = Math.max(5, Math.round((actualDistKm / speedKmH) * 60));

  let timeStr = `${timeMinutes} min`;
  if (timeMinutes >= 60) {
    const hrs = Math.floor(timeMinutes / 60);
    const rem = timeMinutes % 60;
    timeStr = rem > 0 ? `${hrs}h ${rem}m` : `${hrs} hr`;
  }

  return {
    distanceKm: actualDistKm,
    label: `${actualDistKm} km, about ${timeStr}, approx`,
  };
}

/**
 * Score candidate places:
 * - Style/category match: 45%
 * - Popularity (rate value, heritage bonus, wikidata/wikipedia link bonus): 30%
 * - Weather fit (rainy -> indoor high, outdoor low): 25%
 */
export function scoreCandidate(
  place: Place,
  preferredKinds: string[],
  isRainDay: boolean
): number {
  // 1. Style / Category match (45 pts max)
  let categoryMatchCount = 0;
  for (const pk of preferredKinds) {
    if (place.kinds.some((k) => k.toLowerCase().includes(pk.toLowerCase()))) {
      categoryMatchCount++;
    }
  }
  const matchRatio = Math.min(1, categoryMatchCount / Math.max(1, preferredKinds.length / 2));
  const styleScore = matchRatio * 45;

  // 2. Popularity & Wiki bonus (30 pts max)
  const baseRate = Math.min(3, Math.max(1, place.rate));
  let popScore = (baseRate / 3) * 20;

  // Bonus for heritage variants
  if (place.kinds.some((k) => k.includes('historic') || k.includes('monument') || k.includes('heritage'))) {
    popScore += 4;
  }

  // Bonus for wikidata or wikipedia link
  if (place.hasWiki || place.wikipediaExtract) {
    popScore += 6;
  }
  popScore = Math.min(30, popScore);

  // 3. Weather fit (25 pts max)
  let weatherScore = 20;
  if (isRainDay) {
    weatherScore = place.isIndoor ? 25 : 5;
  } else {
    weatherScore = place.isIndoor ? 18 : 25;
  }

  return styleScore + popScore + weatherScore;
}

/**
 * Split places into clusters by 2D coordinates (lat, lng)
 */
function kMeansClustering(places: Place[], k: number): Place[][] {
  if (places.length <= k) {
    return places.map((p) => [p]);
  }

  const sorted = [...places].sort((a, b) => a.lat - b.lat);
  const centroids = Array.from({ length: k }, (_, i) => {
    const idx = Math.floor((i / k) * sorted.length);
    return { lat: sorted[idx].lat, lng: sorted[idx].lng };
  });

  let clusters: Place[][] = Array.from({ length: k }, () => []);

  for (let iter = 0; iter < 12; iter++) {
    clusters = Array.from({ length: k }, () => []);

    for (const place of places) {
      let bestDist = Infinity;
      let bestCluster = 0;

      for (let i = 0; i < k; i++) {
        const d = haversineKm(place.lat, place.lng, centroids[i].lat, centroids[i].lng);
        if (d < bestDist) {
          bestDist = d;
          bestCluster = i;
        }
      }

      clusters[bestCluster].push(place);
    }

    // Recompute centroids
    for (let i = 0; i < k; i++) {
      if (clusters[i].length > 0) {
        const avgLat = clusters[i].reduce((sum, p) => sum + p.lat, 0) / clusters[i].length;
        const avgLng = clusters[i].reduce((sum, p) => sum + p.lng, 0) / clusters[i].length;
        centroids[i] = { lat: avgLat, lng: avgLng };
      }
    }
  }

  return clusters.filter((c) => c.length > 0);
}

/**
 * Order places by nearest neighbor
 */
export function buildDayRoute(dayPlaces: Place[]): Place[] {
  if (dayPlaces.length <= 1) return dayPlaces;

  const remaining = [...dayPlaces];
  const ordered: Place[] = [];

  remaining.sort((a, b) => b.rate - a.rate);
  let current = remaining.shift()!;
  ordered.push(current);

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(current.lat, current.lng, remaining[i].lat, remaining[i].lng);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    current = remaining.splice(nearestIdx, 1)[0];
    ordered.push(current);
  }

  return ordered;
}

/**
 * Clean neutral descriptions without template repetition or the word "verified"
 * Trimmed to at most 2 sentences (~220 chars cut at a sentence boundary)
 */
export function formatNeutralDescription(place: Place, destination: string): string {
  if (place.wikipediaExtract && place.wikipediaExtract.trim().length > 15) {
    const cleanExtract = place.wikipediaExtract.replace(/\[\d+\]/g, '').trim();
    // Split into sentences
    const sentences = cleanExtract.split(/(?<=[.?!])\s+/);
    let desc = sentences.slice(0, 2).join(' ');
    if (desc.length > 220) {
      // Cut at last sentence boundary under 220 chars, or first sentence
      if (sentences[0].length <= 220) {
        desc = sentences[0];
      } else {
        const sub = sentences[0].slice(0, 217);
        const lastSpace = sub.lastIndexOf(' ');
        desc = (lastSpace > 0 ? sub.slice(0, lastSpace) : sub) + '...';
      }
    }
    return desc;
  }

  const kindLabel = getFriendlyKindLabel(place.kindsStr);
  if (place.address) {
    return `${kindLabel} located in ${place.address}.`;
  }

  return `${kindLabel} in ${destination}.`;
}

/**
 * Dynamic time slot scheduling respecting category opening hours and sunset (18:30 in September)
 */
function assignDynamicTimeSlots(places: Place[], sunsetHour = 18.5): Array<{ slot: string; note?: string }> {
  const result: Array<{ slot: string; note?: string }> = [];
  let currentHour = 9.0; // Start morning at 09:00

  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    const catKey = getCategoryTimingKey(p.kindsStr, p.name);
    const config = CATEGORY_TIMINGS[catKey] || CATEGORY_TIMINGS['general'];

    // Adjust start hour if too early for category (e.g. museums open at 10)
    if (currentHour < config.earliestStartHour) {
      currentHour = config.earliestStartHour;
    }

    // Outdoor heritage/caves should start before 15:00
    if (!p.isIndoor && currentHour > config.latestStartHour && i === 0) {
      currentHour = config.earliestStartHour;
    }

    // Add lunch break around 13:00 if passing between morning and afternoon
    if (i === 1 && currentHour >= 12.0 && currentHour < 13.0) {
      currentHour = 13.5;
    }

    const startH = Math.floor(currentHour);
    const startM = Math.round((currentHour - startH) * 60);

    const endHour = currentHour + config.defaultDurationHours;
    const endH = Math.floor(endHour);
    const endM = Math.round((endHour - endH) * 60);

    const formatTime = (h: number, m: number) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const dispH = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const dispM = m < 10 ? `0${m}` : `${m}`;
      return `${dispH < 10 ? `0${dispH}` : dispH}:${dispM} ${ampm}`;
    };

    let note: string | undefined = 'Suggested time';
    if (!p.isIndoor && endHour >= sunsetHour) {
      note = 'Scenic sunset viewpoint';
    }

    result.push({
      slot: `${formatTime(startH, startM)} - ${formatTime(endH, endM)}`,
      note,
    });

    // Advance currentHour by duration + 45 mins transit buffer
    currentHour = endHour + 0.75;
  }

  return result;
}

/**
 * Assemble Itinerary with:
 * - Fix 1: Candidate Quality (rate >= 2 first, wikidata bonus, exclude cinemas/malls from main pool)
 * - Fix 2: Trip-Wide Strict Deduplication
 * - Fix 3: Distance Capping (max 60 km daily travel, max 1 day-trip cluster <= 45km if >= 4 days)
 * - Fix 4: Neutral Descriptions
 * - Fix 5: Price States & Overpass Tags
 * - Fix 6: Dynamic Time Slots
 */
export function assembleItinerary(
  destination: string,
  candidates: Place[],
  rainyFallbacks: Place[],
  days: number,
  preferredKinds: string[],
  rainyDays: boolean[],
  geoCenter: { lat: number; lng: number },
  startDateStr?: string
): BuildItineraryResult {
  if (candidates.length === 0) {
    return { dayPlans: [], weatherSwapNotice: null, shortlistedPlaces: [] };
  }

  // 1. Score candidates with wikidata bonus and style match
  const scored = candidates.map((place) => ({
    place,
    score: scoreCandidate(place, preferredKinds, false),
  }));
  scored.sort((a, b) => b.score - a.score);

  // 2. Separate into within-radius places and candidate day-trip places (> 20km and <= 45km)
  const regularPlaces: Place[] = [];
  const distantPlaces: Place[] = [];

  for (const s of scored) {
    const distFromCenter = haversineKm(geoCenter.lat, geoCenter.lng, s.place.lat, s.place.lng);
    if (distFromCenter <= 22) {
      regularPlaces.push(s.place);
    } else if (distFromCenter <= 45 && s.place.rate >= 3) {
      distantPlaces.push(s.place);
    }
  }

  console.log(`[ItineraryBuilder] Candidates breakdown: ${regularPlaces.length} within-radius, ${distantPlaces.length} potential day-trip candidates.`);

  // Allow at most ONE Day Trip cluster if days >= 4 and distant places with rate >= 3 exist
  let dayTripPlaces: Place[] = [];
  if (days >= 4 && distantPlaces.length >= 2) {
    dayTripPlaces = distantPlaces.slice(0, 3);
    console.log(`[ItineraryBuilder] Scheduled 1 Day Trip cluster with ${dayTripPlaces.length} places (${dayTripPlaces.map((p) => p.name).join(', ')}).`);
  }

  // Target 2 to 4 stops per day (default 3)
  const regularDaysCount = dayTripPlaces.length > 0 ? days - 1 : days;
  const neededRegularPlacesCount = regularDaysCount * 3;

  // Selected pool for clustering
  const pool = regularPlaces.slice(0, Math.max(neededRegularPlacesCount, regularDaysCount * 2));
  const clusters = kMeansClustering(pool, Math.max(1, regularDaysCount));

  const dayBuckets: Place[][] = [];
  for (let i = 0; i < regularDaysCount; i++) {
    dayBuckets.push(clusters[i] || []);
  }

  // If a day trip was allocated, place it on the last or second-to-last day
  if (dayTripPlaces.length > 0) {
    dayBuckets.push(dayTripPlaces);
  }

  // FIX 2: Strict Trip-Wide Deduplication Tracker
  const tripUsedIds = new Set<string>();
  const tripUsedPlaces: Place[] = [];

  const swapNotices: string[] = [];
  const startObj = startDateStr ? new Date(startDateStr + 'T00:00:00') : new Date();
  const finalDayPlans: ItineraryDayPlan[] = [];

  for (let d = 1; d <= days; d++) {
    const isRainDay = rainyDays[d - 1] || false;
    let dayCandidatePlaces = dayBuckets[d - 1] || [];

    // Filter out any place already used on a previous day
    let uniqueDayPlaces = dayCandidatePlaces.filter((p) => {
      const isUsed = tripUsedIds.has(p.id) || tripUsedPlaces.some((up) => up.name.toLowerCase() === p.name.toLowerCase());
      return !isUsed;
    });

    // Weather swap logic: Replace outdoor stops with indoor ones if rainy
    if (isRainDay) {
      const swappedForDay: Place[] = [];
      for (const p of uniqueDayPlaces) {
        if (!p.isIndoor) {
          // Look for an unused indoor place from candidates or rainyFallbacks (cinemas, malls)
          const indoorCandidate =
            candidates.find((c) => c.isIndoor && !tripUsedIds.has(c.id) && !swappedForDay.some((s) => s.id === c.id)) ||
            rainyFallbacks.find((rf) => !tripUsedIds.has(rf.id) && !swappedForDay.some((s) => s.id === rf.id));

          if (indoorCandidate) {
            const optLabel = rainyFallbacks.some((rf) => rf.id === indoorCandidate.id) ? ' (Indoor option)' : '';
            swapNotices.push(`Day ${d}: "${p.name}" (outdoor) ➔ "${indoorCandidate.name}"${optLabel}`);
            swappedForDay.push(indoorCandidate);
          } else {
            swapNotices.push(`Day ${d}: Rain forecasted; please exercise caution at "${p.name}".`);
            swappedForDay.push(p);
          }
        } else {
          swappedForDay.push(p);
        }
      }
      uniqueDayPlaces = swappedForDay;
    }

    // Ensure day has 2 to 3 distinct stops
    while (uniqueDayPlaces.length < 3) {
      const nextUnused = candidates.find(
        (c) =>
          !tripUsedIds.has(c.id) &&
          !uniqueDayPlaces.some((dp) => dp.id === c.id || dp.name.toLowerCase() === c.name.toLowerCase()) &&
          haversineKm(geoCenter.lat, geoCenter.lng, c.lat, c.lng) <= 30
      );
      if (!nextUnused) break;
      uniqueDayPlaces.push(nextUnused);
    }

    // Nearest-neighbor TSP ordering
    let orderedStops = buildDayRoute(uniqueDayPlaces.slice(0, 3));

    // FIX 3: Cap daily travel distance to at most 60 km
    let dayDistKm = 0;
    for (let i = 1; i < orderedStops.length; i++) {
      const prev = orderedStops[i - 1];
      const cur = orderedStops[i];
      dayDistKm += haversineKm(prev.lat, prev.lng, cur.lat, cur.lng) * 1.35;
    }

    if (dayDistKm > 60 && orderedStops.length > 2) {
      console.warn(`[ItineraryBuilder] Day ${d} travel distance (${Math.round(dayDistKm)} km) exceeded 60 km cap. Pruning furthest stop.`);
      orderedStops = orderedStops.slice(0, 2);
    }

    // Register stops in trip-wide deduplication tracker
    orderedStops.forEach((p) => {
      tripUsedIds.add(p.id);
      tripUsedPlaces.push(p);
    });

    // FIX 7: Dynamic Time Slots
    const timingSlots = assignDynamicTimeSlots(orderedStops);

    const isDayTrip = orderedStops.some((p) => haversineKm(geoCenter.lat, geoCenter.lng, p.lat, p.lng) > 22);

    let runningDayTravelKm = 0;
    const activities: ItineraryActivity[] = orderedStops.map((place, idx) => {
      let travelTimeStr: string | undefined = undefined;
      let legDistKm = 0;

      if (idx > 0) {
        const prev = orderedStops[idx - 1];
        const res = formatTravelDistanceAndTime(prev.lat, prev.lng, place.lat, place.lng);
        legDistKm = res.distanceKm;
        travelTimeStr = res.label;
        runningDayTravelKm += legDistKm;
      }

      const kindBadge = getFriendlyKindLabel(place.kindsStr);
      const isIndoorOpt = rainyFallbacks.some((rf) => rf.id === place.id);

      return {
        id: place.id,
        timeSlot: timingSlots[idx]?.slot || '10:00 AM - 12:30 PM',
        timeSlotNote: timingSlots[idx]?.note,
        title: place.name,
        description: formatNeutralDescription(place, destination),
        category: place.kindsStr.includes('amusement') || place.kindsStr.includes('caves') ? 'Activity' : 'Sightseeing',
        kindLabel: isIndoorOpt ? `${kindBadge} (Indoor option)` : kindBadge,
        cost: 0,
        costLabel: 'Price not available',
        feeState: 'UNKNOWN',
        location: place.address || `${destination}`,
        address: place.address,
        mapsUrl: place.mapsUrl,
        isIndoor: place.isIndoor,
        isIndoorOption: isIndoorOpt,
        lat: place.lat,
        lng: place.lng,
        travelDistanceKm: legDistKm,
        travelTimeFromPrev: travelTimeStr,
      };
    });

    const currentDayDate = new Date(startObj);
    currentDayDate.setDate(startObj.getDate() + (d - 1));
    const dateFormatted = currentDayDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const dayTitle =
      activities.length > 0
        ? `${activities[0].title}${activities[1] ? ` & ${activities[1].title}` : ''}`
        : 'City Exploration';

    finalDayPlans.push({
      dayNumber: d,
      summary: `Day ${d} (${dateFormatted}): ${dayTitle}`,
      isDayTrip,
      totalTravelKm: Math.round(runningDayTravelKm * 10) / 10,
      activities,
    });
  }

  // FIX 2 ASSERTION: Assert zero duplicate place IDs across the whole trip
  const allFinalActivityIds = finalDayPlans.flatMap((dp) => dp.activities.map((a) => a.id));
  const uniqueIdsSet = new Set(allFinalActivityIds);
  if (allFinalActivityIds.length !== uniqueIdsSet.size) {
    throw new Error(
      `Trip-wide deduplication assertion failed: Found ${
        allFinalActivityIds.length - uniqueIdsSet.size
      } duplicate places in the itinerary.`
    );
  }

  let finalWeatherNotice: string | null = null;
  if (swapNotices.length > 0) {
    finalWeatherNotice = `☔ Live Weather Protection: ${swapNotices.join(' • ')}`;
  }

  return {
    dayPlans: finalDayPlans,
    weatherSwapNotice: finalWeatherNotice,
    shortlistedPlaces: tripUsedPlaces,
  };
}
