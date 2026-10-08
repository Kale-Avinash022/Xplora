// lib/types.ts
// Shared domain models and contracts for XPLORA

export type BookingArea = 'TRAVEL' | 'STAY';

export type TransportMode = 'FLIGHTS' | 'TRAINS' | 'BUSES';

export type SearchStatus = 'LIVE' | 'NO_RESULTS' | 'UNAVAILABLE' | 'INVALID_REQUEST';

export type CabinClass = 'Economy' | 'Premium Economy' | 'Business' | 'First Class';

export interface FlightSearchRequest {
  origin: string;
  destination: string;
  outboundDate: string; // YYYY-MM-DD
  returnDate?: string;  // YYYY-MM-DD
  travelers: number;    // integer, 1–9
  cabinClass: CabinClass;
  currency: string;
}

export interface StaySearchRequest {
  destination: string;
  checkIn: string;      // YYYY-MM-DD
  checkOut: string;     // YYYY-MM-DD
  guests: number;       // integer, 1–9
  rooms: number;        // integer, 1–9
  currency: string;
}

export interface FlightOption {
  id: string;
  providerName: string;
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: string;
  price: number;
  currency: string;
  priceMeaning?: string;
  cabinClass?: string;
  bookingUrl?: string;
  fetchedAt: string;
  logo?: string;
  isNonStop?: boolean;
  from?: string;
  to?: string;
  timeOfDay?: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
}

export interface StayOption {
  id: string;
  providerName: string;
  name: string;
  imageUrl?: string;
  rating?: number;
  reviewsCount?: number;
  location?: string;
  pricePerNight: number;
  currency: string;
  priceMeaning?: string;
  hotelType?: string;
  amenities?: string[];
  bookingUrl?: string;
  fetchedAt: string;
  image?: string;
  category?: string;
  distanceFromCenter?: string;
  distanceKm?: number;
  nearAirport?: boolean;
  nearBeach?: boolean;
}

export type TrainClassCode = '1A' | '2A' | '3A' | '3E' | 'SL' | 'CC' | 'EC' | '2S' | 'GEN';

export interface TrainClassOption {
  code: TrainClassCode | string;
  name: string;
  fare?: number;
  availableSeats?: number | string;
  statusText?: string;
}

export interface TrainSearchRequest {
  origin: string;
  destination: string;
  date: string; // YYYY-MM-DD
  trainClass?: string;
  quota?: string;
  travelers?: number;
}

export interface TrainOption {
  id: string;
  providerName: string;
  trainNumber: string;
  trainName: string;
  departureStation: string;
  departureStationName?: string;
  arrivalStation: string;
  arrivalStationName?: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  classes: TrainClassOption[];
  runningDays?: string[];
  startingStation?: string;
  terminusStation?: string;
  price?: number;
  currency?: string;
  bookingUrl?: string;
  fetchedAt: string;
  timeOfDay?: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
}

export interface BusSearchRequest {
  origin: string;
  destination: string;
  date: string; // YYYY-MM-DD
  category?: 'ALL' | 'TRAVELS' | 'LOCAL';
  travelers?: number;
}

export type BusCategory = 'Travels' | 'Local Bus';

export interface BusOption {
  id: string;
  providerName: string;
  operatorName: string;
  busType: string;
  category: BusCategory;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  origin: string;
  destination: string;
  travelDate: string;
  distanceKm: number;
  ratePerKm: number;
  price: number;
  totalPrice?: number;
  currency: string;
  availableSeats: number;
  rating?: number;
  reviewsCount?: number;
  amenities?: string[];
  bookingUrl: string;
  fetchedAt: string;
  timeOfDay?: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  formulaExplanation?: string;
  boardingPoint?: string;
  droppingPoint?: string;
}

export interface ProviderMetadata {
  providerName: string;
  fetchedAt: string;
  cacheExpiresAt?: string;
  sourceType: 'provider';
  bookingUrl?: string;
}

export interface TravelSearchEnvelope<T> {
  query: FlightSearchRequest | StaySearchRequest | TrainSearchRequest | BusSearchRequest | Record<string, any>;
  status: SearchStatus;
  results: T[];
  count: number;
  providerMetadata?: ProviderMetadata;
  notice?: string;
  fieldErrors?: Record<string, string>;
  requestId?: string;
}

export interface Activity {
  id?: string;
  timeSlot: string;
  title: string;
  description?: string | null;
  category: string;
  cost: number;
  location?: string | null;
}

export interface DayPlan {
  id?: string;
  dayNumber: number;
  summary: string;
  isDayTrip?: boolean;
  totalTravelKm?: number;
  activities: Activity[];
}

export interface WeatherPreview {
  temp?: string | number;
  condition?: string;
  recommendation?: string;
  icon?: string;
  packingAdvice?: string;
  packingBadge?: string;
  forecast?: any[];
}

export interface ItineraryResponse {
  id?: string;
  title: string;
  destination: string;
  durationDays: number;
  totalBudget: number;
  estimatedCost?: number;
  currency: string;
  travelStyle: string;
  weatherPreview?: WeatherPreview | null;
  weatherSwapNotice?: string | null;
  geocodedCenter?: { lat: number; lng: number };
  hasUnknownPricing?: boolean;
  dayPlans: DayPlan[];
}

export interface WishlistItem {
  itemKey: string;
  title: string;
  destination: string;
  durationDays: number;
  totalBudget: number;
  estimatedCost?: number;
  currency: string;
  travelStyle: string;
  savedAt: string;
  plan: ItineraryResponse;
}

export interface TripProposal {
  destination?: string;
  from?: string;
  durationDays?: number;
  budget?: number;
  travelStyle?: string;
  startDate?: string;
}

export type TrackedTicketType = 'TRAIN' | 'FLIGHT' | 'BUS';

export interface TrackedTicket {
  id: string;
  type: TrackedTicketType;
  title: string;
  operatorOrTrainNumber: string;
  from: string;
  to: string;
  journeyDate: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  travelClass?: string;
  quota?: string;
  travelers?: string | number;
  fare?: number | string;
  currency?: string;
  pnrOrBookingRef: string;
  bookingStatus: string;
  provider: string;
  bookingUrl?: string;
  bookedAt: string;
}

export interface TrackedHotelBooking {
  id: string;
  hotelName: string;
  hotelType?: string;
  location: string;
  checkIn: string;
  checkOut: string;
  guests?: number | string;
  rooms?: number | string;
  pricePerNight?: number;
  totalPrice?: number;
  currency?: string;
  rating?: number;
  reviewsCount?: number;
  amenities?: string[];
  bookingRef: string;
  bookingStatus: string;
  provider: string;
  bookingUrl: string;
  bookedAt: string;
}

