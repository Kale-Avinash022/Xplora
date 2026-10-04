// lib/cache/ttls.ts
// Standard TTL definitions across Xplora caching layer

export const CACHE_TTLS = {
  GEOCODE: 90 * 24 * 60 * 60,         // City geocoding: 90 days
  PLACES_PER_CITY: 7 * 24 * 60 * 60,   // Places per city: 7 days
  PLACE_DETAILS: 30 * 24 * 60 * 60,    // Place details: 30 days
  OVERPASS_FEES_HOURS: 30 * 24 * 60 * 60, // Overpass fees/hours: 30 days
  PHOTO_POOL_PER_CITY: 30 * 24 * 60 * 60, // Photo pool per city: 30 days
  WEATHER_FORECAST: 2 * 60 * 60,       // Weather forecast: 2 hours
  EXCHANGE_RATES: 6 * 60 * 60,         // Exchange rates: 6 hours
  FINISHED_ITINERARY: 6 * 60 * 60,     // Finished itinerary: 6 hours
  NEGATIVE_CACHE: 7 * 24 * 60 * 60,    // Negative cache (no results): 7 days
  TRAIN_SEARCH: 30 * 60,               // Train schedules & routes: 30 minutes
  TRAIN_AVAILABILITY: 10 * 60,         // Live seat availability: 10 minutes
} as const;
