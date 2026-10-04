// lib/travel/providers/qrail/mapper.ts
// Normalization and mapping of raw Qrail API records into standard XPLORA TrainOption models

import { TrainOption, TrainClassOption } from '@/lib/types';
import { getStationName } from './stations';
import { QrailTrainBetweenItem, QrailTrainClassAvailability } from './types';
import { validateProviderUrl } from '@/lib/travel/validation';

const CLASS_DESCRIPTIONS: Record<string, string> = {
  '1A': 'AC First Class (1A)',
  '2A': 'AC 2 Tier (2A)',
  '3A': 'AC 3 Tier (3A)',
  '3E': 'AC 3 Economy (3E)',
  'SL': 'Sleeper Class (SL)',
  'CC': 'AC Chair Car (CC)',
  'EC': 'Executive Chair Car (EC)',
  '2S': 'Second Sitting (2S)',
  'GN': 'General Unreserved (GN)',
};

/**
 * Calculates time of day category from HH:MM string
 */
export function getTimeOfDay(timeStr?: string): 'Morning' | 'Afternoon' | 'Evening' | 'Night' | undefined {
  if (!timeStr) return undefined;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return undefined;
  const hour = parseInt(match[1], 10);
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

/**
 * Normalizes duration string or formats minutes into "Xh Ym"
 */
export function formatDuration(rawDuration?: string): string {
  if (!rawDuration) return 'Scheduled';
  const clean = rawDuration.trim();
  if (/^\d+h\s*\d+m$/i.test(clean)) return clean;

  // Format "HH:MM"
  const colonMatch = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    const h = parseInt(colonMatch[1], 10);
    const m = parseInt(colonMatch[2], 10);
    return `${h}h ${m}m`;
  }

  // Format numeric minutes
  const num = Number(clean);
  if (!isNaN(num) && num > 0) {
    const hours = Math.floor(num / 60);
    const mins = num % 60;
    return `${hours}h ${mins}m`;
  }

  return clean;
}

/**
 * Normalizes train class items into TrainClassOption[]
 */
export function mapClasses(rawClasses?: any): TrainClassOption[] {
  if (!rawClasses) return [];

  if (Array.isArray(rawClasses)) {
    return rawClasses.map((item) => {
      if (typeof item === 'string') {
        const code = item.toUpperCase().trim();
        return {
          code,
          name: CLASS_DESCRIPTIONS[code] || code,
        };
      }
      if (item && typeof item === 'object') {
        const code = String(item.class_code || item.class || item.code || '').toUpperCase().trim();
        return {
          code,
          name: item.class_name || CLASS_DESCRIPTIONS[code] || code,
          fare: item.fare ? Number(item.fare) : undefined,
          availableSeats: item.seats || item.availableSeats || undefined,
          statusText: item.status || item.statusText || undefined,
        };
      }
      return { code: String(item), name: String(item) };
    }).filter(c => c.code.length > 0);
  }

  return [];
}

/**
 * Normalizes running days array
 */
export function mapRunningDays(rawDays?: any): string[] | undefined {
  if (!rawDays) return undefined;
  if (Array.isArray(rawDays)) {
    return rawDays.map(d => String(d).slice(0, 3));
  }
  if (typeof rawDays === 'object') {
    return Object.entries(rawDays)
      .filter(([_, active]) => active === true || active === 'Y' || active === 1)
      .map(([day]) => day.slice(0, 3));
  }
  return undefined;
}

/**
 * Normalizes raw Qrail train item into standard TrainOption model
 */
export function normalizeQrailTrain(
  item: QrailTrainBetweenItem,
  index: number,
  fallbackDate?: string
): TrainOption {
  const trainNumber = String(item.train_number || '').trim();
  const trainName = String(item.train_name || `Express Train ${trainNumber}`).trim();

  const departureStation = (item.from_station_code || '').trim().toUpperCase();
  const arrivalStation = (item.to_station_code || '').trim().toUpperCase();

  const departureStationName = item.from_station_name || getStationName(departureStation);
  const arrivalStationName = item.to_station_name || getStationName(arrivalStation);

  const departureTime = item.departure_time || item.from_time || 'Scheduled';
  const arrivalTime = item.arrival_time || item.to_time || 'Scheduled';
  const duration = formatDuration(item.duration);

  const classes = mapClasses(item.classes);
  const runningDays = mapRunningDays(item.run_days);

  // Derive lowest fare if available in any class
  let price: number | undefined = undefined;
  for (const c of classes) {
    if (c.fare && c.fare > 0) {
      if (price === undefined || c.fare < price) {
        price = c.fare;
      }
    }
  }

  const rawBookingUrl = 'https://www.irctc.co.in/nget/train-search';
  const bookingUrl = validateProviderUrl(rawBookingUrl);

  const nowIso = new Date().toISOString();

  return {
    id: `qrail-${trainNumber || index}-${departureStation}-${arrivalStation}`,
    providerName: 'Qrail Railway Provider',
    trainNumber,
    trainName,
    departureStation,
    departureStationName,
    arrivalStation,
    arrivalStationName,
    departureTime,
    arrivalTime,
    duration,
    classes,
    runningDays,
    startingStation: item.starting_station_code,
    terminusStation: item.terminus_station_code,
    price,
    currency: 'INR',
    bookingUrl,
    fetchedAt: nowIso,
    timeOfDay: getTimeOfDay(departureTime),
  };
}
