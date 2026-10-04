// lib/travel/validation.ts
// Reusable validation layer for Flights, Stays, and Provider URLs

import { CabinClass, FlightSearchRequest, StaySearchRequest, TrainSearchRequest, BusSearchRequest } from '@/lib/types';

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: Record<string, string>;
}

const ALLOWED_CABIN_CLASSES: CabinClass[] = [
  'Economy',
  'Premium Economy',
  'Business',
  'First Class',
];

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates whether a date string is valid YYYY-MM-DD
 */
export function isValidIsoDate(dateStr: string): boolean {
  if (!dateStr || !ISO_DATE_REGEX.test(dateStr)) return false;
  const d = new Date(`${dateStr}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
}

/**
 * Returns today's date in YYYY-MM-DD format (UTC)
 */
export function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Validates a FlightSearchRequest according to XPLORA strict truthfulness rules:
 * - Origin and Destination required and distinct
 * - Outbound date required, valid ISO, not in the past
 * - Return date (if provided) valid ISO and after outbound date
 * - Travelers between 1 and 9
 * - Cabin class from allowed list
 */
export function validateFlightQuery(raw: Partial<FlightSearchRequest>): ValidationResult<FlightSearchRequest> {
  const errors: Record<string, string> = {};

  const origin = (raw.origin || '').trim();
  const destination = (raw.destination || '').trim();

  if (!origin) {
    errors.origin = 'Departure city is required.';
  }

  if (!destination) {
    errors.destination = 'Destination city is required.';
  }

  if (origin && destination && origin.toLowerCase() === destination.toLowerCase()) {
    errors.destination = 'Origin and destination cities cannot be the same.';
  }

  const outboundDate = (raw.outboundDate || '').trim();
  if (!outboundDate) {
    errors.outboundDate = 'Departure date is required.';
  } else if (!isValidIsoDate(outboundDate)) {
    errors.outboundDate = 'Departure date must be in YYYY-MM-DD format.';
  } else {
    const today = getTodayIsoDate();
    if (outboundDate < today) {
      errors.outboundDate = 'Departure date cannot be in the past.';
    }
  }

  let returnDate: string | undefined = undefined;
  if (raw.returnDate && raw.returnDate.trim()) {
    const cleanReturn = raw.returnDate.trim();
    if (!isValidIsoDate(cleanReturn)) {
      errors.returnDate = 'Return date must be in YYYY-MM-DD format.';
    } else if (outboundDate && cleanReturn <= outboundDate) {
      errors.returnDate = 'Return date must be strictly after the departure date.';
    } else {
      returnDate = cleanReturn;
    }
  }

  const rawTravelers = Number(raw.travelers);
  const travelers = isNaN(rawTravelers) ? 1 : Math.floor(rawTravelers);
  if (travelers < 1 || travelers > 9) {
    errors.travelers = 'Traveler count must be between 1 and 9.';
  }

  const rawCabin = raw.cabinClass as CabinClass;
  const cabinClass = ALLOWED_CABIN_CLASSES.includes(rawCabin) ? rawCabin : 'Economy';

  const currency = (raw.currency || 'INR').trim().toUpperCase();

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    data: isValid
      ? {
          origin,
          destination,
          outboundDate,
          returnDate,
          travelers,
          cabinClass,
          currency,
        }
      : undefined,
  };
}

/**
 * Validates a StaySearchRequest according to XPLORA strict truthfulness rules:
 * - Destination required
 * - Check-in and Check-out required, valid ISO dates
 * - Check-in not in the past
 * - Check-out strictly after check-in
 * - Guests between 1 and 9
 * - Rooms between 1 and 9, and rooms <= guests
 */
export function validateStayQuery(raw: Partial<StaySearchRequest>): ValidationResult<StaySearchRequest> {
  const errors: Record<string, string> = {};

  const destination = (raw.destination || '').trim();
  if (!destination) {
    errors.destination = 'Destination is required.';
  }

  const checkIn = (raw.checkIn || '').trim();
  if (!checkIn) {
    errors.checkIn = 'Check-in date is required.';
  } else if (!isValidIsoDate(checkIn)) {
    errors.checkIn = 'Check-in date must be in YYYY-MM-DD format.';
  } else {
    const today = getTodayIsoDate();
    if (checkIn < today) {
      errors.checkIn = 'Check-in date cannot be in the past.';
    }
  }

  const checkOut = (raw.checkOut || '').trim();
  if (!checkOut) {
    errors.checkOut = 'Check-out date is required.';
  } else if (!isValidIsoDate(checkOut)) {
    errors.checkOut = 'Check-out date must be in YYYY-MM-DD format.';
  } else if (checkIn && checkOut <= checkIn) {
    errors.checkOut = 'Check-out date must be strictly after the check-in date.';
  }

  const rawGuests = Number(raw.guests);
  const guests = isNaN(rawGuests) ? 2 : Math.floor(rawGuests);
  if (guests < 1 || guests > 9) {
    errors.guests = 'Guest count must be between 1 and 9.';
  }

  const rawRooms = Number(raw.rooms);
  const rooms = isNaN(rawRooms) ? 1 : Math.floor(rawRooms);
  if (rooms < 1 || rooms > 9) {
    errors.rooms = 'Room count must be between 1 and 9.';
  } else if (rooms > guests) {
    errors.rooms = 'Number of rooms cannot exceed the number of guests.';
  }

  const currency = (raw.currency || 'INR').trim().toUpperCase();

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    data: isValid
      ? {
          destination,
          checkIn,
          checkOut,
          guests,
          rooms,
          currency,
        }
      : undefined,
  };
}

/**
 * Approved domain suffixes for live provider links
 */
const APPROVED_PROVIDER_DOMAINS = [
  'google.com',
  'google.co.in',
  'serpapi.com',
  'booking.com',
  'agoda.com',
  'makemytrip.com',
  'goibibo.com',
  'cleartrip.com',
  'expedia.com',
  'hotels.com',
  'tripadvisor.com',
  'tripadvisor.in',
  'kayak.com',
  'skyscanner.net',
  'skyscanner.com',
  'ixigo.com',
  'easemytrip.com',
  'irctc.co.in',
  'qrail.in',
  'www.qrail.in',
  'api.qrail.in',
  'redbus.in',
  'www.redbus.in',
];

/**
 * Validates a TrainSearchRequest according to XPLORA strict truthfulness rules:
 * - Origin and Destination required and distinct
 * - Date required, valid ISO, not in the past
 * - Travelers between 1 and 9 (default 1)
 */
export function validateTrainQuery(raw: Partial<TrainSearchRequest>): ValidationResult<TrainSearchRequest> {
  const errors: Record<string, string> = {};

  const origin = (raw.origin || '').trim();
  const destination = (raw.destination || '').trim();

  if (!origin) {
    errors.origin = 'Departure station or city is required.';
  }

  if (!destination) {
    errors.destination = 'Destination station or city is required.';
  }

  if (origin && destination && origin.toLowerCase() === destination.toLowerCase()) {
    errors.destination = 'Departure and arrival stations cannot be the same.';
  }

  const date = (raw.date || '').trim();
  if (!date) {
    errors.date = 'Journey date is required.';
  } else if (!isValidIsoDate(date)) {
    errors.date = 'Journey date must be in YYYY-MM-DD format.';
  } else {
    const today = getTodayIsoDate();
    if (date < today) {
      errors.date = 'Journey date cannot be in the past.';
    }
  }

  const rawTravelers = Number(raw.travelers);
  const travelers = isNaN(rawTravelers) ? 1 : Math.max(1, Math.min(9, Math.floor(rawTravelers)));

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    data: isValid
      ? {
          origin,
          destination,
          date,
          trainClass: raw.trainClass?.trim() || undefined,
          quota: raw.quota?.trim() || 'GN',
          travelers,
        }
      : undefined,
  };
}

/**
 * Validates a BusSearchRequest according to XPLORA strict truthfulness rules:
 * - Origin and Destination required and distinct
 * - Date required, valid ISO, not in the past
 * - Category: 'ALL' | 'TRAVELS' | 'LOCAL'
 * - Travelers between 1 and 9 (default 1)
 */
export function validateBusQuery(raw: Partial<BusSearchRequest>): ValidationResult<BusSearchRequest> {
  const errors: Record<string, string> = {};

  const origin = (raw.origin || '').trim();
  const destination = (raw.destination || '').trim();

  if (!origin) {
    errors.origin = 'Departure city is required.';
  }

  if (!destination) {
    errors.destination = 'Destination city is required.';
  }

  if (origin && destination && origin.toLowerCase() === destination.toLowerCase()) {
    errors.destination = 'Origin and destination cities cannot be the same.';
  }

  const date = (raw.date || '').trim();
  if (!date) {
    errors.date = 'Traveler date is required.';
  } else if (!isValidIsoDate(date)) {
    errors.date = 'Traveler date must be in YYYY-MM-DD format.';
  } else {
    const today = getTodayIsoDate();
    if (date < today) {
      errors.date = 'Traveler date cannot be in the past.';
    }
  }

  const rawTravelers = Number(raw.travelers);
  const travelers = isNaN(rawTravelers) ? 1 : Math.max(1, Math.min(9, Math.floor(rawTravelers)));
  const category = (raw.category === 'TRAVELS' || raw.category === 'LOCAL') ? raw.category : 'ALL';

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    data: isValid
      ? {
          origin,
          destination,
          date,
          category,
          travelers,
        }
      : undefined,
  };
}

/**
 * Validates a provider booking or offer deep-link:
 * - Must be valid HTTPS URL
 * - Must match approved provider domain allowlist
 * - Must reject javascript:, data:, file:, and malformed URLs
 */
export function validateProviderUrl(rawUrl?: string | null): string | undefined {
  if (!rawUrl || typeof rawUrl !== 'string') return undefined;

  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = new URL(trimmed);

    // 1. Must be HTTPS
    if (parsed.protocol !== 'https:') {
      return undefined;
    }

    // 2. Validate hostname against approved domains
    const hostname = parsed.hostname.toLowerCase();
    const isApproved = APPROVED_PROVIDER_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (!isApproved) {
      return undefined;
    }

    return parsed.toString();
  } catch {
    return undefined;
  }
}
