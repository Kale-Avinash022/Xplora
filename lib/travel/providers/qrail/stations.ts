// lib/travel/providers/qrail/stations.ts
// Comprehensive mapping for Indian Railway Stations & Cities (IRCTC station codes)

export interface StationDetail {
  code: string;
  name: string;
  city: string;
  state?: string;
}

export const POPULAR_STATIONS: Record<string, StationDetail> = {
  // National Capital Region
  NDLS: { code: 'NDLS', name: 'New Delhi Railway Station', city: 'Delhi' },
  DLI: { code: 'DLI', name: 'Old Delhi Railway Station', city: 'Delhi' },
  NZM: { code: 'NZM', name: 'Hazrat Nizamuddin Railway Station', city: 'Delhi' },
  ANVT: { code: 'ANVT', name: 'Anand Vihar Terminal', city: 'Delhi' },

  // Maharashtra
  CSMT: { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai' },
  BCT: { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai' },
  MMCT: { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai' },
  LTT: { code: 'LTT', name: 'Lokmanya Tilak Terminus', city: 'Mumbai' },
  BDTS: { code: 'BDTS', name: 'Bandra Terminus', city: 'Mumbai' },
  PUNE: { code: 'PUNE', name: 'Pune Junction', city: 'Pune' },
  NGP: { code: 'NGP', name: 'Nagpur Junction', city: 'Nagpur' },

  // Karnataka
  SBC: { code: 'SBC', name: 'KSR Bengaluru City Junction', city: 'Bengaluru' },
  YPR: { code: 'YPR', name: 'Yesvantpur Junction', city: 'Bengaluru' },
  SMVB: { code: 'SMVB', name: 'Sir M. Visvesvaraya Terminal', city: 'Bengaluru' },
  MYS: { code: 'MYS', name: 'Mysuru Junction', city: 'Mysore' },

  // Telangana & Andhra Pradesh
  SC: { code: 'SC', name: 'Secunderabad Junction', city: 'Hyderabad' },
  HYB: { code: 'HYB', name: 'Hyderabad Deccan (Nampally)', city: 'Hyderabad' },
  KCG: { code: 'KCG', name: 'Kacheguda Railway Station', city: 'Hyderabad' },
  BZA: { code: 'BZA', name: 'Vijayawada Junction', city: 'Vijayawada' },
  VSKP: { code: 'VSKP', name: 'Visakhapatnam Junction', city: 'Visakhapatnam' },

  // Tamil Nadu
  MAS: { code: 'MAS', name: 'MGR Chennai Central', city: 'Chennai' },
  MS: { code: 'MS', name: 'Chennai Egmore', city: 'Chennai' },
  CBE: { code: 'CBE', name: 'Coimbatore Main Junction', city: 'Coimbatore' },
  MDU: { code: 'MDU', name: 'Madurai Junction', city: 'Madurai' },

  // West Bengal
  HWH: { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata' },
  SDAH: { code: 'SDAH', name: 'Sealdah Railway Station', city: 'Kolkata' },
  KOAA: { code: 'KOAA', name: 'Kolkata Railway Station', city: 'Kolkata' },
  NJP: { code: 'NJP', name: 'New Jalpaiguri Junction', city: 'Siliguri' },

  // Gujarat
  ADI: { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad' },
  ST: { code: 'ST', name: 'Surat Railway Station', city: 'Surat' },
  BRC: { code: 'BRC', name: 'Vadodara Junction', city: 'Vadodara' },

  // Rajasthan
  JP: { code: 'JP', name: 'Jaipur Junction', city: 'Jaipur' },
  JU: { code: 'JU', name: 'Jodhpur Junction', city: 'Jodhpur' },
  UDZ: { code: 'UDZ', name: 'Udaipur City Railway Station', city: 'Udaipur' },
  AII: { code: 'AII', name: 'Ajmer Junction', city: 'Ajmer' },

  // Uttar Pradesh
  LKO: { code: 'LKO', name: 'Lucknow Charbagh NR', city: 'Lucknow' },
  LJN: { code: 'LJN', name: 'Lucknow Junction NER', city: 'Lucknow' },
  CNB: { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur' },
  BSB: { code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi' },
  DDU: { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya Junction', city: 'Varanasi' },
  AGC: { code: 'AGC', name: 'Agra Cantt', city: 'Agra' },

  // Goa
  MAO: { code: 'MAO', name: 'Madgaon Junction', city: 'Goa' },
  THVM: { code: 'THVM', name: 'Thivim Railway Station', city: 'Goa' },
  KRMI: { code: 'KRMI', name: 'Karmali Railway Station', city: 'Goa' },

  // Kerala
  ERS: { code: 'ERS', name: 'Ernakulam Junction (South)', city: 'Kochi' },
  ERN: { code: 'ERN', name: 'Ernakulam Town (North)', city: 'Kochi' },
  TVC: { code: 'TVC', name: 'Thiruvananthapuram Central', city: 'Thiruvananthapuram' },
  CLT: { code: 'CLT', name: 'Kozhikode Railway Station', city: 'Kozhikode' },

  // Punjab & Haryana & Chandigarh
  CDG: { code: 'CDG', name: 'Chandigarh Junction', city: 'Chandigarh' },
  ASR: { code: 'ASR', name: 'Amritsar Junction', city: 'Amritsar' },
  LDH: { code: 'LDH', name: 'Ludhiana Junction', city: 'Ludhiana' },

  // Madhya Pradesh
  BPL: { code: 'BPL', name: 'Bhopal Junction', city: 'Bhopal' },
  RKMP: { code: 'RKMP', name: 'Rani Kamlapati (Habibganj)', city: 'Bhopal' },
  INDB: { code: 'INDB', name: 'Indore Junction', city: 'Indore' },
  JBP: { code: 'JBP', name: 'Jabalpur Junction', city: 'Jabalpur' },

  // Bihar & Jharkhand
  PNBE: { code: 'PNBE', name: 'Patna Junction', city: 'Patna' },
  RNC: { code: 'RNC', name: 'Ranchi Junction', city: 'Ranchi' },
  DHN: { code: 'DHN', name: 'Dhanbad Junction', city: 'Dhanbad' },
  GAYA: { code: 'GAYA', name: 'Gaya Junction', city: 'Gaya' },

  // Odisha
  BBS: { code: 'BBS', name: 'Bhubaneswar Railway Station', city: 'Bhubaneswar' },
  PURI: { code: 'PURI', name: 'Puri Railway Station', city: 'Puri' },

  // Assam
  GHY: { code: 'GHY', name: 'Guwahati Railway Station', city: 'Guwahati' },

  // Uttarakhand
  DDN: { code: 'DDN', name: 'Dehradun Railway Station', city: 'Dehradun' },
  HW: { code: 'HW', name: 'Haridwar Junction', city: 'Haridwar' },
};

// Normalized lowercase city to primary station code
const CITY_TO_PRIMARY_STATION: Record<string, string> = {
  delhi: 'NDLS',
  'new delhi': 'NDLS',
  'old delhi': 'DLI',
  mumbai: 'CSMT',
  bombay: 'CSMT',
  pune: 'PUNE',
  nagpur: 'NGP',
  bangalore: 'SBC',
  bengaluru: 'SBC',
  mysore: 'MYS',
  mysuru: 'MYS',
  hyderabad: 'SC',
  secunderabad: 'SC',
  chennai: 'MAS',
  madras: 'MAS',
  kolkata: 'HWH',
  calcutta: 'HWH',
  howrah: 'HWH',
  goa: 'MAO',
  madgaon: 'MAO',
  ahmedabad: 'ADI',
  surat: 'ST',
  vadodara: 'BRC',
  baroda: 'BRC',
  jaipur: 'JP',
  jodhpur: 'JU',
  udaipur: 'UDZ',
  lucknow: 'LKO',
  varanasi: 'BSB',
  banaras: 'BSB',
  kanpur: 'CNB',
  agra: 'AGC',
  kochi: 'ERS',
  cochin: 'ERS',
  ernakulam: 'ERS',
  thiruvananthapuram: 'TVC',
  trivandrum: 'TVC',
  chandigarh: 'CDG',
  amritsar: 'ASR',
  bhopal: 'BPL',
  indore: 'INDB',
  patna: 'PNBE',
  ranchi: 'RNC',
  bhubaneswar: 'BBS',
  puri: 'PURI',
  guwahati: 'GHY',
  dehradun: 'DDN',
  haridwar: 'HW',
  visakhapatnam: 'VSKP',
  vizag: 'VSKP',
  vijayawada: 'BZA',
};

/**
 * Resolves a city name or station code into an IRCTC station code.
 * Accepts:
 * - Direct codes: "NDLS", "PUNE", "CSMT", "NGP"
 * - City names: "Nagpur", "Mumbai", "New Delhi", "Pune"
 * - Descriptive strings: "Nagpur (NGP)", "Goa, India"
 */
export function resolveStationCode(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const clean = input.trim();
  const upper = clean.toUpperCase();

  // 1. Direct valid station code check (2 to 5 alphanumeric characters)
  if (POPULAR_STATIONS[upper]) {
    return upper;
  }

  // 2. City dictionary lookup
  const lower = clean.toLowerCase();
  if (CITY_TO_PRIMARY_STATION[lower]) {
    return CITY_TO_PRIMARY_STATION[lower];
  }

  // 3. Parenthetical code extraction: "Nagpur (NGP)" -> "NGP"
  const parentheticalMatch = clean.match(/\(([A-Za-z0-9]{2,5})\)/);
  if (parentheticalMatch && parentheticalMatch[1]) {
    const code = parentheticalMatch[1].toUpperCase();
    if (POPULAR_STATIONS[code] || /^[A-Z0-9]{2,5}$/.test(code)) {
      return code;
    }
  }

  // 4. Prefix match in city dictionary: "Nagpur, Maharashtra"
  for (const [cityName, stationCode] of Object.entries(CITY_TO_PRIMARY_STATION)) {
    if (lower.startsWith(cityName) || lower.includes(cityName)) {
      return stationCode;
    }
  }

  // 5. If it looks like a valid 2-5 letter station code, return uppercase
  if (/^[A-Z]{2,5}$/.test(upper)) {
    return upper;
  }

  return null;
}

/**
 * Returns station human readable name or falls back to station code.
 */
export function getStationName(code: string): string {
  const upper = (code || '').trim().toUpperCase();
  const station = POPULAR_STATIONS[upper];
  if (station) {
    return station.name;
  }
  return upper;
}
