/**
 * MASTER CONFIGURATION: 2026 REALISTIC TRIP COST ESTIMATOR
 *
 * Single source of truth for all pricing rates, geographic coordinates,
 * tier baselines, and multipliers used by the XPLORA Realistic Cost Estimator.
 * All monetary amounts are in Indian Rupees (INR).
 */
export const TRIP_COST_CONFIG = {
  // 1. Coordinates Table: 30+ Major Indian Origin Cities & 20+ Key Destinations
  coordinates: {
    // 30 Major Indian Origin Cities
    mumbai: { name: 'Mumbai', lat: 18.9220, lng: 72.8347 },
    delhi: { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
    bangalore: { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
    hyderabad: { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    chennai: { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    kolkata: { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    pune: { name: 'Pune', lat: 18.5204, lng: 73.8567 },
    ahmedabad: { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    jaipur: { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    surat: { name: 'Surat', lat: 21.1702, lng: 72.8311 },
    lucknow: { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
    kanpur: { name: 'Kanpur', lat: 26.4499, lng: 80.3319 },
    nagpur: { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
    indore: { name: 'Indore', lat: 22.7196, lng: 75.8577 },
    thane: { name: 'Thane', lat: 19.2183, lng: 72.9781 },
    bhopal: { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
    visakhapatnam: { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
    patna: { name: 'Patna', lat: 25.5941, lng: 85.1376 },
    vadodara: { name: 'Vadodara', lat: 22.3072, lng: 73.1812 },
    ghaziabad: { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538 },
    ludhiana: { name: 'Ludhiana', lat: 30.9010, lng: 75.8573 },
    agra: { name: 'Agra', lat: 27.1767, lng: 78.0081 },
    nashik: { name: 'Nashik', lat: 19.9975, lng: 73.7898 },
    kochi: { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
    varanasi: { name: 'Varanasi', lat: 25.3176, lng: 82.9739 },
    amritsar: { name: 'Amritsar', lat: 31.6340, lng: 74.8723 },
    udaipur: { name: 'Udaipur', lat: 24.5854, lng: 73.7125 },
    mysore: { name: 'Mysore', lat: 12.2958, lng: 76.6394 },
    coimbatore: { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
    chandigarh: { name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
    goa: { name: 'Goa', lat: 15.2993, lng: 74.1240 },

    // Primary Supported Destinations (DestinationsKnowledge + Major Hubs)
    shirdi: { name: 'Shirdi', lat: 19.7667, lng: 74.4762 },
    sikkim: { name: 'Sikkim', lat: 27.5330, lng: 88.5122 },
    gangtok: { name: 'Gangtok', lat: 27.3389, lng: 88.6065 },
    manali: { name: 'Manali', lat: 32.2432, lng: 77.1892 },
    kerala: { name: 'Kerala', lat: 9.9312, lng: 76.2673 },
    munnar: { name: 'Munnar', lat: 10.0889, lng: 77.0595 },
    alleppey: { name: 'Alleppey', lat: 9.4981, lng: 76.3388 },
    ladakh: { name: 'Ladakh', lat: 34.1526, lng: 77.5771 },
    leh: { name: 'Leh', lat: 34.1526, lng: 77.5771 },
    kashmir: { name: 'Kashmir', lat: 34.0837, lng: 74.7973 },
    srinagar: { name: 'Srinagar', lat: 34.0837, lng: 74.7973 },
    gulmarg: { name: 'Gulmarg', lat: 34.0484, lng: 74.3805 },
    spiti: { name: 'Spiti Valley', lat: 32.2461, lng: 78.0349 },
    meghalaya: { name: 'Meghalaya', lat: 25.5788, lng: 91.8933 },
    shillong: { name: 'Shillong', lat: 25.5788, lng: 91.8933 },
    coorg: { name: 'Coorg', lat: 12.3375, lng: 75.8069 },
    andaman: { name: 'Andaman & Nicobar', lat: 11.6234, lng: 92.7265 },
    rishikesh: { name: 'Rishikesh', lat: 30.0869, lng: 78.2676 },
    rajasthan: { name: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
    jaisalmer: { name: 'Jaisalmer', lat: 26.9157, lng: 70.9083 },
    hampi: { name: 'Hampi', lat: 15.3350, lng: 76.4600 },
    pondicherry: { name: 'Pondicherry', lat: 11.9416, lng: 79.8083 },
  } as Record<string, { name: string; lat: number; lng: number }>,

  // 2. Intercity Transport Rates (round-trip km * rate per person)
  transport: {
    distanceThresholdKm: 800,
    underThreshold: {
      mode: 'Bus / Express Train',
      minRatePerKm: 1.5,     // Sleeper train / State AC bus round-trip rate
      recRatePerKm: 2.5,     // 3AC train / Volvo AC bus round-trip rate
      minFloor: 600,         // Minimum round-trip floor per traveler (INR)
      recFloor: 1200,
    },
    overThreshold: {
      mode: 'Train (3AC/2AC) / Flight',
      minRatePerKm: 2.2,     // Long distance 3AC train round-trip
      recRatePerKm: 5.5,     // Economy flight / Rajdhani 2AC round-trip
      minFloor: 2000,        // Minimum round-trip floor per traveler (INR)
      recFloor: 5000,
    },
    defaultOrigin: 'Mumbai',
  },

  // 3. Stay Rates per ROOM per Night (ceil(travelers / 2) * nights)
  stayRatesPerRoomPerNight: {
    PILGRIMAGE_SMALL_TOWN: {
      minimum: 1200,       // Clean dharamshala / budget guesthouse
      recommended: 2400,   // Quality 3-star AC hotel near temple
      comfortable: 4500,   // Premium 4-star / boutique resort
    },
    HILL_BEACH: {
      minimum: 1800,       // Budget homestay / beach shack / hostel
      recommended: 3800,   // Boutique cottage / 3-4 star resort
      comfortable: 7500,   // Luxury sea/mountain-view 5-star
    },
    METRO_HERITAGE: {
      minimum: 2200,       // Budget business hotel / Oyo townhouse
      recommended: 4800,   // 4-star city center / heritage haveli
      comfortable: 9500,   // 5-star luxury palace / luxury chain
    },
  },

  // 4. Daily Per-Person Rates (excluding intercity transport)
  // Approximate 2026 INR ranges:
  // - Pilgrimage / Small Towns: Budget tier ~₹1,500 - ₹2,500/day
  // - Hill / Beach: Budget tier ~₹2,500 - ₹4,000/day
  // - Metros / Heritage: Budget tier ~₹4,000 - ₹6,000/day
  // Standard is ~2x budget, Luxury is ~4x or more
  dailyPerPersonRates: {
    PILGRIMAGE_SMALL_TOWN: {
      food: { min: 700, rec: 1300 },
      localTransport: { min: 450, rec: 850 },
      activities: { min: 350, rec: 650 },
      // Sum: min = ₹1,500/day, rec = ₹2,800/day (~1.87x)
    },
    HILL_BEACH: {
      food: { min: 1100, rec: 2000 },
      localTransport: { min: 800, rec: 1500 },
      activities: { min: 700, rec: 1300 },
      // Sum: min = ₹2,600/day, rec = ₹4,800/day (~1.85x)
    },
    METRO_HERITAGE: {
      food: { min: 1700, rec: 3200 },
      localTransport: { min: 1200, rec: 2200 },
      activities: { min: 1100, rec: 2000 },
      // Sum: min = ₹4,000/day, rec = ₹7,400/day (~1.85x)
    },
  },

  // 5. Destination Class Mapping
  destinationClass: {
    shirdi: 'PILGRIMAGE_SMALL_TOWN',
    varanasi: 'PILGRIMAGE_SMALL_TOWN',
    kashi: 'PILGRIMAGE_SMALL_TOWN',
    benaras: 'PILGRIMAGE_SMALL_TOWN',
    rishikesh: 'PILGRIMAGE_SMALL_TOWN',
    amritsar: 'PILGRIMAGE_SMALL_TOWN',
    hampi: 'PILGRIMAGE_SMALL_TOWN',
    puri: 'PILGRIMAGE_SMALL_TOWN',
    madurai: 'PILGRIMAGE_SMALL_TOWN',
    tirupati: 'PILGRIMAGE_SMALL_TOWN',

    goa: 'HILL_BEACH',
    manali: 'HILL_BEACH',
    kullu: 'HILL_BEACH',
    solang: 'HILL_BEACH',
    kerala: 'HILL_BEACH',
    munnar: 'HILL_BEACH',
    alleppey: 'HILL_BEACH',
    sikkim: 'HILL_BEACH',
    gangtok: 'HILL_BEACH',
    ladakh: 'HILL_BEACH',
    leh: 'HILL_BEACH',
    kashmir: 'HILL_BEACH',
    srinagar: 'HILL_BEACH',
    gulmarg: 'HILL_BEACH',
    pahalgam: 'HILL_BEACH',
    spiti: 'HILL_BEACH',
    meghalaya: 'HILL_BEACH',
    shillong: 'HILL_BEACH',
    coorg: 'HILL_BEACH',
    andaman: 'HILL_BEACH',
    pondicherry: 'HILL_BEACH',
    puducherry: 'HILL_BEACH',

    mumbai: 'METRO_HERITAGE',
    bombay: 'METRO_HERITAGE',
    delhi: 'METRO_HERITAGE',
    'new delhi': 'METRO_HERITAGE',
    bangalore: 'METRO_HERITAGE',
    bengaluru: 'METRO_HERITAGE',
    hyderabad: 'METRO_HERITAGE',
    jaipur: 'METRO_HERITAGE',
    'pink city': 'METRO_HERITAGE',
    udaipur: 'METRO_HERITAGE',
    jaisalmer: 'METRO_HERITAGE',
    rajasthan: 'METRO_HERITAGE',
    agra: 'METRO_HERITAGE',
    kolkata: 'METRO_HERITAGE',
    chennai: 'METRO_HERITAGE',
    pune: 'METRO_HERITAGE',
    nagpur: 'METRO_HERITAGE',
    ahmedabad: 'METRO_HERITAGE',
  } as Record<string, 'PILGRIMAGE_SMALL_TOWN' | 'HILL_BEACH' | 'METRO_HERITAGE'>,

  // 6. Travel Style to Tier & Multiplier Mapping
  styleTierMapping: {
    budget: { tier: 'Budget', foodMult: 1.0, stayMult: 1.0, actMult: 1.0 },
    'budget friendly': { tier: 'Budget', foodMult: 1.0, stayMult: 1.0, actMult: 1.0 },
    'budget-friendly': { tier: 'Budget', foodMult: 1.0, stayMult: 1.0, actMult: 1.0 },
    backpacking: { tier: 'Budget', foodMult: 1.0, stayMult: 1.0, actMult: 1.0 },

    adventure: { tier: 'Standard', foodMult: 1.0, stayMult: 1.0, actMult: 1.25 },
    family: { tier: 'Standard', foodMult: 1.1, stayMult: 1.1, actMult: 1.0 },
    'solo explorer': { tier: 'Standard', foodMult: 0.95, stayMult: 1.0, actMult: 1.0 },
    cultural: { tier: 'Standard', foodMult: 1.0, stayMult: 1.0, actMult: 1.1 },
    heritage: { tier: 'Standard', foodMult: 1.0, stayMult: 1.0, actMult: 1.1 },
    relaxation: { tier: 'Standard', foodMult: 1.1, stayMult: 1.2, actMult: 0.8 },
    general: { tier: 'Standard', foodMult: 1.0, stayMult: 1.0, actMult: 1.0 },

    luxury: { tier: 'Luxury', foodMult: 2.2, stayMult: 2.2, actMult: 2.2 },
    premium: { tier: 'Luxury', foodMult: 2.2, stayMult: 2.2, actMult: 2.2 },
  } as Record<string, { tier: 'Budget' | 'Standard' | 'Luxury'; foodMult: number; stayMult: number; actMult: number }>,

  // 7. Contingency / Emergency Buffer (10%)
  bufferPercent: 0.10,
} as const;

export type DestinationClass = 'PILGRIMAGE_SMALL_TOWN' | 'HILL_BEACH' | 'METRO_HERITAGE';
export type TravelTier = 'Budget' | 'Standard' | 'Luxury';

/**
 * Calculates great-circle distance between two geographic coordinates using the Haversine formula.
 * @returns distance in rounded kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Normalizes destination string and returns coordinate data.
 */
export function resolveDestinationCoordinates(destination: string): {
  key: string;
  name: string;
  lat: number;
  lng: number;
} | null {
  const clean = destination.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  if (TRIP_COST_CONFIG.coordinates[clean]) {
    return { key: clean, ...TRIP_COST_CONFIG.coordinates[clean] };
  }
  // Try sub-token matching
  for (const [k, v] of Object.entries(TRIP_COST_CONFIG.coordinates)) {
    if (clean.includes(k) || k.includes(clean)) {
      return { key: k, ...v };
    }
  }
  return null;
}

/**
 * Resolves origin coordinates, falling back to default origin (Mumbai) if unknown.
 */
export function resolveOriginCoordinates(fromCity?: string): {
  key: string;
  name: string;
  lat: number;
  lng: number;
  isDefault: boolean;
} {
  if (fromCity && fromCity.trim()) {
    const matched = resolveDestinationCoordinates(fromCity);
    if (matched) {
      return { ...matched, isDefault: false };
    }
  }
  const defaultKey = TRIP_COST_CONFIG.transport.defaultOrigin.toLowerCase();
  const def = TRIP_COST_CONFIG.coordinates[defaultKey];
  return { key: defaultKey, ...def, isDefault: true };
}
