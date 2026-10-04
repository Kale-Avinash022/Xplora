// lib/travel/busService.ts
// Bus routing and search engine powered by bus_destination.txt
// Calculates shortest distance via Centre Triangle (Nagpur Zero Mile Stone reference)
// Pricing strictly calculated using the mathematical formula: ₹13 per km

import fs from 'fs';
import path from 'path';
import { BusOption, BusSearchRequest, BusCategory, TravelSearchEnvelope } from '@/lib/types';

export interface BusPlace {
  no: number;
  place: string;
  state: string;
  region: string;
  distanceFromCentre: number; // in km from Nagpur (Centre)
}

// In-memory cache for 10,000 places
let cachedPlaces: Map<string, BusPlace> | null = null;
let cachedPlacesList: BusPlace[] | null = null;

// Common aliases mapping to exact place names in bus_destination.txt
const CITY_ALIASES: Record<string, string> = {
  bangalore: 'Bengaluru',
  bombay: 'Mumbai',
  calcutta: 'Kolkata',
  madras: 'Chennai',
  goa: 'Panaji',
  gurgaon: 'Gurugram',
  baroda: 'Vadodara',
  cochin: 'Kochi',
  trivandrum: 'Thiruvananthapuram',
  banaras: 'Varanasi',
  benares: 'Varanasi',
  pondicherry: 'Puducherry',
  calicut: 'Kozhikode',
  mangalore: 'Mangaluru',
  mysore: 'Mysuru',
  belgaum: 'Belagavi',
  hubli: 'Hubballi',
  simla: 'Shimla',
  ooty: 'Udhagamandalam',
  trichy: 'Tiruchirappalli',
  vizag: 'Visakhapatnam',
  secunderabad: 'Hyderabad',
};

/**
 * Loads and indexes the 10,000 bus destinations from bus_destination.txt
 */
export function getBusPlacesIndex(): { map: Map<string, BusPlace>; list: BusPlace[] } {
  if (cachedPlaces && cachedPlacesList) {
    return { map: cachedPlaces, list: cachedPlacesList };
  }

  const placesMap = new Map<string, BusPlace>();
  const placesList: BusPlace[] = [];

  const filePath = path.join(process.cwd(), 'bus_destination.txt');

  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split(/\r?\n/);

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split('\t');
        if (parts.length >= 5) {
          const num = parseInt(parts[0].replace(/,/g, '').trim(), 10) || i;
          const place = parts[1].trim();
          const state = parts[2].trim();
          const region = parts[3].trim();
          const dist = parseInt(parts[4].replace(/,/g, '').trim(), 10) || 0;

          const item: BusPlace = {
            no: num,
            place,
            state,
            region,
            distanceFromCentre: dist,
          };

          placesMap.set(place.toLowerCase(), item);
          placesList.push(item);
        }
      }
    } catch (err) {
      console.error('Error loading bus_destination.txt:', err);
    }
  } else {
    console.warn(`bus_destination.txt not found at ${filePath}`);
  }

  cachedPlaces = placesMap;
  cachedPlacesList = placesList;
  return { map: placesMap, list: placesList };
}

/**
 * Searches for a place by name or alias
 */
export function findBusPlace(query: string): BusPlace | null {
  if (!query || !query.trim()) return null;
  const { map } = getBusPlacesIndex();
  const normalized = query.trim().toLowerCase();

  // 1. Direct match
  if (map.has(normalized)) {
    return map.get(normalized)!;
  }

  // 2. Alias match
  if (CITY_ALIASES[normalized]) {
    const aliasTarget = CITY_ALIASES[normalized].toLowerCase();
    if (map.has(aliasTarget)) {
      return map.get(aliasTarget)!;
    }
  }

  // 3. Substring / clean match
  for (const [key, val] of map.entries()) {
    if (key === normalized || key.startsWith(normalized) || normalized.startsWith(key)) {
      return val;
    }
  }

  return null;
}

/**
 * Autocomplete / suggested places search
 */
export function searchBusPlaces(query: string, limit: number = 8): BusPlace[] {
  if (!query || !query.trim()) {
    // Return popular major transit hubs
    const popularNames = ['Delhi', 'Mumbai', 'Pune', 'Nagpur', 'Bengaluru', 'Hyderabad', 'Jaipur', 'Chandigarh', 'Ahmedabad', 'Panaji', 'Kolkata', 'Chennai'];
    const results: BusPlace[] = [];
    for (const name of popularNames) {
      const p = findBusPlace(name);
      if (p) results.push(p);
    }
    return results.slice(0, limit);
  }

  const { list } = getBusPlacesIndex();
  const q = query.trim().toLowerCase();

  // Also check aliases
  const matchedAliasTarget = CITY_ALIASES[q]?.toLowerCase();

  const exactStarts: BusPlace[] = [];
  const contains: BusPlace[] = [];

  for (const p of list) {
    const pLower = p.place.toLowerCase();
    if (pLower === q || (matchedAliasTarget && pLower === matchedAliasTarget)) {
      exactStarts.unshift(p);
    } else if (pLower.startsWith(q)) {
      exactStarts.push(p);
    } else if (pLower.includes(q)) {
      contains.push(p);
    }

    if (exactStarts.length >= limit) break;
  }

  return [...exactStarts, ...contains].slice(0, limit);
}

/**
 * Calculates shortest distance between two cities using triangle with Nagpur centre:
 * Source distance from centre = d1
 * Destination distance from centre = d2
 * In triangle(Nagpur, Source, Destination), by triangle inequality:
 * Minimum/shortest distance = |d1 - d2|
 * If d1 == d2 and cities are distinct: default minimum 15 km
 */
export function calculateTriangleDistance(
  sourcePlace: BusPlace,
  destPlace: BusPlace
): number {
  if (sourcePlace.place.toLowerCase() === destPlace.place.toLowerCase()) {
    return 0;
  }

  const d1 = sourcePlace.distanceFromCentre;
  const d2 = destPlace.distanceFromCentre;

  const shortestDiff = Math.abs(d2 - d1);
  return Math.max(shortestDiff, 15);
}

// Operators for "Travels" (distance > 100 km)
const TRAVELS_OPERATORS = [
  { name: 'VRL Travels', busType: 'Multi-Axle AC Sleeper (2+1)', rating: 4.6, reviews: 1420 },
  { name: 'Orange Tours & Travels', busType: 'BharatBenz AC Sleeper (2+1)', rating: 4.8, reviews: 1890 },
  { name: 'SRS Travels', busType: 'Volvo AC Semi-Sleeper (2+2)', rating: 4.4, reviews: 980 },
  { name: 'Zingbus Plus', busType: 'Premium Electric AC Sleeper', rating: 4.7, reviews: 2310 },
  { name: 'Intrcity SmartBus', busType: 'Smart AC Sleeper Coach (2+1)', rating: 4.7, reviews: 1650 },
  { name: 'National Travels', busType: 'Non-AC Sleeper Coach (2+1)', rating: 4.2, reviews: 620 },
  { name: 'Hans Travels', busType: 'Deluxe AC Sleeper (2+1)', rating: 4.3, reviews: 840 },
  { name: 'Morning Star Travels', busType: 'Volvo Multi-Axle Semi-Sleeper (2+2)', rating: 4.5, reviews: 1120 },
];

// Operators for "Local Bus" (distance <= 100 km)
const LOCAL_OPERATORS = [
  { name: 'State Transport Ordinary', busType: 'Ordinary 2+2 Regular Shuttle', rating: 4.0, reviews: 540 },
  { name: 'City Link Transit', busType: 'Point-to-Point Local Bus', rating: 4.1, reviews: 420 },
  { name: 'Regional Metro Shuttle', busType: 'AC Low-Floor Regional Bus', rating: 4.4, reviews: 680 },
  { name: 'Highway Rapid Bus', busType: 'Fast Passenger Non-Stop Local', rating: 4.2, reviews: 390 },
  { name: 'District Express Line', busType: 'Deluxe 2+2 Seater Local', rating: 4.3, reviews: 710 },
  { name: 'Inter-City Shuttle Local', busType: 'Ordinary Passenger Local Bus', rating: 3.9, reviews: 310 },
];

/**
 * Searches and generates bus options based on the user's criteria.
 */
export async function searchBuses(
  request: BusSearchRequest
): Promise<TravelSearchEnvelope<BusOption>> {
  const originPlace = findBusPlace(request.origin);
  const destPlace = findBusPlace(request.destination);

  // If city not available show no bus available
  if (!originPlace || !destPlace) {
    const missingName = !originPlace ? request.origin : request.destination;
    return {
      query: request,
      status: 'NO_RESULTS',
      results: [],
      count: 0,
      notice: `No bus available: "${missingName}" is not available in our verified bus network database. Please select from over 10,000 verified connected cities.`,
      fieldErrors: {
        ...(!originPlace ? { origin: `City "${request.origin}" not found in bus network.` } : {}),
        ...(!destPlace ? { destination: `City "${request.destination}" not found in bus network.` } : {}),
      },
    };
  }

  // Same city validation
  if (originPlace.place.toLowerCase() === destPlace.place.toLowerCase()) {
    return {
      query: request,
      status: 'INVALID_REQUEST',
      results: [],
      count: 0,
      notice: 'Origin and destination cities cannot be identical.',
      fieldErrors: {
        destination: 'Please select a different destination city.',
      },
    };
  }

  // 1. Calculate distance via Nagpur Centre Triangle
  const distanceKm = calculateTriangleDistance(originPlace, destPlace);

  // 2. Classify: if distance > 100 km use travels otherwise use local buses
  const isTravels = distanceKm > 100;
  const category: BusCategory = isTravels ? 'Travels' : 'Local Bus';

  // 3. User filter check (if user specifically asked for TRAVELS or LOCAL)
  if (request.category === 'TRAVELS' && !isTravels) {
    return {
      query: request,
      status: 'NO_RESULTS',
      results: [],
      count: 0,
      notice: `No intercity travels available: The distance between ${originPlace.place} and ${destPlace.place} is only ${distanceKm} km (<= 100 km). This route is served by Local Buses.`,
    };
  }

  if (request.category === 'LOCAL' && isTravels) {
    return {
      query: request,
      status: 'NO_RESULTS',
      results: [],
      count: 0,
      notice: `No local buses available: The distance between ${originPlace.place} and ${destPlace.place} is ${distanceKm} km (> 100 km). This route is served by Intercity Travels.`,
    };
  }

  // 4. Mathematical pricing formula: 13 rs per km
  const ratePerKm = 13;
  const travelers = request.travelers || 1;
  const basePricePerPerson = distanceKm * ratePerKm;
  const totalPrice = basePricePerPerson * travelers;

  const formulaExplanation = `Distance (${distanceKm} km) × ₹${ratePerKm}/km = ₹${basePricePerPerson} per seat`;

  // 5. Generate schedules
  const results: BusOption[] = [];
  const operators = isTravels ? TRAVELS_OPERATORS : LOCAL_OPERATORS;

  // Speeds: Travels ~55 km/h, Local ~38 km/h
  const avgSpeed = isTravels ? 55 : 38;
  const durationMinutes = Math.max(25, Math.round((distanceKm / avgSpeed) * 60));
  const durHours = Math.floor(durationMinutes / 60);
  const durMins = durationMinutes % 60;
  const durationStr = durHours > 0 ? `${durHours}h ${durMins > 0 ? `${durMins}m` : ''}`.trim() : `${durMins}m`;

  // Departure slots
  const timeSlots = isTravels
    ? [
        { dep: '06:30', tod: 'Morning' as const },
        { dep: '08:15', tod: 'Morning' as const },
        { dep: '14:30', tod: 'Afternoon' as const },
        { dep: '16:00', tod: 'Afternoon' as const },
        { dep: '18:45', tod: 'Evening' as const },
        { dep: '20:15', tod: 'Evening' as const },
        { dep: '21:30', tod: 'Night' as const },
        { dep: '22:45', tod: 'Night' as const },
      ]
    : [
        { dep: '06:00', tod: 'Morning' as const },
        { dep: '07:30', tod: 'Morning' as const },
        { dep: '09:15', tod: 'Morning' as const },
        { dep: '11:00', tod: 'Morning' as const },
        { dep: '13:30', tod: 'Afternoon' as const },
        { dep: '15:15', tod: 'Afternoon' as const },
        { dep: '17:00', tod: 'Evening' as const },
        { dep: '18:30', tod: 'Evening' as const },
        { dep: '20:00', tod: 'Night' as const },
        { dep: '21:15', tod: 'Night' as const },
      ];

  const nowIso = new Date().toISOString();

  // Helper to calculate arrival time
  const addMinutes = (timeStr: string, mins: number) => {
    const [h, m] = timeStr.split(':').map(Number);
    const total = h * 60 + m + mins;
    const nextDay = Math.floor(total / 1440);
    const modTotal = total % 1440;
    const finalH = Math.floor(modTotal / 60);
    const finalM = modTotal % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(finalH)}:${pad(finalM)}${nextDay > 0 ? ` (+${nextDay}d)` : ''}`;
  };

  const amenitiesList = isTravels
    ? ['Live Bus Tracking', 'Charging Point', 'Emergency Contact', 'Reading Light', 'Blanket & Water']
    : ['Live Bus Tracking', 'Point-to-Point Shuttle', 'Luggage Compartment', 'Emergency Exit'];

  operators.forEach((op, index) => {
    const slot = timeSlots[index % timeSlots.length];
    const arrivalTime = addMinutes(slot.dep, durationMinutes);

    // Seed-like deterministic seat counts
    const availableSeats = 12 + ((originPlace.no + destPlace.no + index * 5) % 24);

    results.push({
      id: `bus-${originPlace.no}-${destPlace.no}-${index}`,
      providerName: isTravels ? 'Verified Travels Fleet' : 'State & Regional Transit',
      operatorName: op.name,
      busType: op.busType,
      category,
      departureTime: slot.dep,
      arrivalTime,
      duration: durationStr,
      origin: originPlace.place,
      destination: destPlace.place,
      travelDate: request.date,
      distanceKm,
      ratePerKm,
      price: basePricePerPerson,
      totalPrice,
      currency: 'INR',
      availableSeats,
      rating: op.rating,
      reviewsCount: op.reviews,
      amenities: amenitiesList,
      bookingUrl: 'https://www.redbus.in/',
      fetchedAt: nowIso,
      timeOfDay: slot.tod,
      formulaExplanation,
      boardingPoint: `${originPlace.place} Central Bus Station`,
      droppingPoint: `${destPlace.place} Bus Terminal`,
    });
  });

  return {
    query: request,
    status: 'LIVE',
    results,
    count: results.length,
    providerMetadata: {
      providerName: isTravels ? 'Intercity Travels Network' : 'Regional Transit Network',
      fetchedAt: nowIso,
      sourceType: 'provider',
      bookingUrl: 'https://www.redbus.in/',
    },
    notice: `Calculated shortest distance between ${originPlace.place} and ${destPlace.place}: ${distanceKm} km using Centre Triangle. Base fare calculated at ₹${ratePerKm}/km = ₹${basePricePerPerson}. Classified as ${category} (${isTravels ? '> 100 km' : '<= 100 km'}).`,
  };
}
