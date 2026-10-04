// lib/travel/providers/qrail/types.ts
// Domain and external payload definitions for Qrail Railway API

export interface QrailStationRef {
  code: string;
  name: string;
}

export interface QrailTrainClassAvailability {
  class_code: string;
  class_name?: string;
  fare?: number;
  status?: string;
  seats?: number | string;
}

export interface QrailTrainBetweenItem {
  train_number: string;
  train_name: string;
  from_station_code: string;
  to_station_code: string;
  from_station_name?: string;
  to_station_name?: string;
  from_time?: string;
  to_time?: string;
  departure_time?: string;
  arrival_time?: string;
  duration?: string;
  classes?: string[] | QrailTrainClassAvailability[];
  run_days?: string[] | Record<string, boolean>;
  starting_station_code?: string;
  terminus_station_code?: string;
}

export interface QrailTrainsBetweenResponse {
  success?: boolean;
  status?: string | number;
  message?: string;
  error?: string;
  data?: QrailTrainBetweenItem[];
  trains?: QrailTrainBetweenItem[];
}

export interface QrailErrorResponse {
  error?: string;
  message?: string;
  success?: boolean;
}
