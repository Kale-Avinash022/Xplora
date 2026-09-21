// lib/places/categories.ts
// Style-to-kinds mapping, exclusion rules, visit durations, and indoor/outdoor classifications

export interface CategoryTimingConfig {
  defaultDurationHours: number;
  earliestStartHour: number; // e.g., 8 for 08:00
  latestStartHour: number;   // e.g., 15 for 15:00
}

/**
 * EXCLUDED KINDS FROM MAIN SIGHTSEEING POOL:
 * Cinemas, shopping malls, sports facilities, fountains, banks/ATMs,
 * tourist facilities, and unclassified "other" kinds.
 */
export const EXCLUDED_KINDS: string[] = [
  'cinemas',
  'movie_theatres',
  'malls',
  'supermarkets',
  'marketplace',
  'sport',
  'stadiums',
  'swimming_pools',
  'fountains',
  'banks',
  'atm',
  'tourist_facilities',
  'unclassified_objects',
  'other',
  'toilets',
  'fuel',
  'parking',
  'car_wash',
];

/**
 * Kinds permitted ONLY as indoor rainy-day fallbacks
 */
export const RAINY_DAY_INDOOR_KINDS: string[] = [
  'cinemas',
  'malls',
  'theatres_and_entertainments',
];

/**
 * Generic words that should be skipped if the place lacks a wikidata/wikipedia link
 */
export const GENERIC_PLACE_NAMES: string[] = [
  'fountain',
  'statue',
  'park',
  'garden',
  'temple',
  'mandir',
  'shrine',
  'monument',
  'lake',
];

/**
 * Style to OpenTripMap kinds
 */
export const STYLE_TO_KINDS: Record<string, string[]> = {
  Adventure: [
    'natural',
    'caves',
    'mountain_peaks',
    'nature_reserves',
    'historic',
    'amusements',
  ],
  Family: [
    'cultural',
    'museums',
    'historic',
    'parks',
    'religion',
    'natural',
  ],
  'Solo Explorer': [
    'historic',
    'cultural',
    'architecture',
    'religion',
    'natural',
    'museums',
  ],
  Solo: [
    'historic',
    'cultural',
    'architecture',
    'religion',
    'natural',
    'museums',
  ],
  Luxury: [
    'cultural',
    'historic',
    'architecture',
    'museums',
  ],
  'Budget Friendly': [
    'historic',
    'religion',
    'natural',
    'cultural',
    'parks',
  ],
  'Budget-Friendly': [
    'historic',
    'religion',
    'natural',
    'cultural',
    'parks',
  ],
  General: [
    'historic',
    'cultural',
    'religion',
    'natural',
    'architecture',
    'museums',
  ],
};

/**
 * Default visit durations and earliest/latest start hours by place category
 */
export const CATEGORY_TIMINGS: Record<string, CategoryTimingConfig> = {
  fort: { defaultDurationHours: 2.5, earliestStartHour: 8, latestStartHour: 15 },
  caves: { defaultDurationHours: 1.5, earliestStartHour: 8, latestStartHour: 15 },
  nature: { defaultDurationHours: 2.0, earliestStartHour: 8, latestStartHour: 15 },
  viewpoint: { defaultDurationHours: 1.5, earliestStartHour: 8, latestStartHour: 17 },
  museum: { defaultDurationHours: 1.5, earliestStartHour: 10, latestStartHour: 16 },
  temple: { defaultDurationHours: 1.0, earliestStartHour: 7, latestStartHour: 19 },
  cultural: { defaultDurationHours: 1.5, earliestStartHour: 9, latestStartHour: 17 },
  market: { defaultDurationHours: 2.0, earliestStartHour: 16, latestStartHour: 20 },
  food: { defaultDurationHours: 1.5, earliestStartHour: 12, latestStartHour: 21 },
  general: { defaultDurationHours: 1.5, earliestStartHour: 9, latestStartHour: 17 },
};

/**
 * Determine category key for timing rules
 */
export function getCategoryTimingKey(kindsStr: string, name: string): string {
  const k = (kindsStr || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (k.includes('fort') || n.includes('fort')) return 'fort';
  if (k.includes('cave') || n.includes('cave')) return 'caves';
  if (k.includes('museum') || n.includes('museum') || k.includes('gallery')) return 'museum';
  if (k.includes('viewpoint') || k.includes('view_points') || n.includes('hill') || n.includes('tekdi')) return 'viewpoint';
  if (k.includes('temple') || k.includes('mandir') || k.includes('church') || k.includes('mosque') || k.includes('religion')) return 'temple';
  if (k.includes('natural') || k.includes('park') || k.includes('garden')) return 'nature';
  if (k.includes('market') || k.includes('shop')) return 'market';
  if (k.includes('food') || k.includes('cafe') || k.includes('restaurant')) return 'food';
  if (k.includes('cultural') || k.includes('theatre')) return 'cultural';

  return 'general';
}

/**
 * Check whether a place's kinds match any excluded kinds for main sightseeing
 */
export function isExcludedForMainSightseeing(kindsStr: string): boolean {
  if (!kindsStr) return false;
  const kinds = kindsStr.toLowerCase().split(',');
  return kinds.some((k) => EXCLUDED_KINDS.some((ex) => k.trim() === ex || k.trim().startsWith(ex)));
}

/**
 * Check whether a place name is a generic non-distinctive name without wikidata
 */
export function isGenericPlaceName(name: string, hasWikidata: boolean): boolean {
  if (hasWikidata) return false;
  const clean = name.trim().toLowerCase();

  // e.g. "Fountain in Park", "Park", "Temple", "Garden", "Statue", "Fountain"
  for (const gen of GENERIC_PLACE_NAMES) {
    if (clean === gen) return true;
    if (clean.startsWith(`${gen} in `) || clean.endsWith(` ${gen}`) || clean.includes(`${gen} in park`)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if kind is indoor
 */
export function isIndoorKind(kindsStr: string): boolean {
  if (!kindsStr) return false;
  const kinds = kindsStr.toLowerCase().split(',');

  const indoorMarkers = [
    'museums',
    'museum',
    'art_galleries',
    'theatres_and_entertainments',
    'theatres',
    'theatre',
    'cinemas',
    'concert_halls',
    'opera_houses',
    'malls',
    'shops',
    'religion',
    'churches',
    'cathedrals',
    'mosques',
    'hindu_temples',
    'buddhist_temples',
    'other_temples',
  ];

  const outdoorMarkers = [
    'natural',
    'nature_reserves',
    'parks',
    'gardens',
    'beaches',
    'caves',
    'mountain_peaks',
    'geological_formations',
    'view_points',
    'viewpoints',
    'fortifications',
    'forts',
    'castles',
    'ruins',
    'archaeological_sites',
    'water_parks',
  ];

  const hasOutdoor = kinds.some((k) => outdoorMarkers.some((om) => k.includes(om)));
  if (hasOutdoor) return false;

  return kinds.some((k) => indoorMarkers.some((im) => k.includes(im)));
}

/**
 * Clean friendly label
 */
export function getFriendlyKindLabel(kindsStr: string): string {
  if (!kindsStr) return 'Sightseeing';
  const kinds = kindsStr.toLowerCase().split(',');

  if (kinds.some((k) => k.includes('fort') || k.includes('castle'))) return 'Historic Fort';
  if (kinds.some((k) => k.includes('cave'))) return 'Historic Cave';
  if (kinds.some((k) => k.includes('museum') || k.includes('gallery'))) return 'Museum';
  if (kinds.some((k) => k.includes('temple') || k.includes('church') || k.includes('mosque') || k.includes('religion'))) return 'Spiritual & Heritage';
  if (kinds.some((k) => k.includes('natural') || k.includes('mountain'))) return 'Nature & Scenic';
  if (kinds.some((k) => k.includes('park') || k.includes('garden'))) return 'Botanical Park';
  if (kinds.some((k) => k.includes('viewpoint') || k.includes('view_points'))) return 'Scenic Viewpoint';
  if (kinds.some((k) => k.includes('theatre') || k.includes('cultural'))) return 'Cultural Arts';
  if (kinds.some((k) => k.includes('cinema') || k.includes('movie'))) return 'Cinema (Indoor Option)';
  if (kinds.some((k) => k.includes('mall') || k.includes('shopping'))) return 'Shopping Mall (Indoor Option)';

  return 'Sightseeing';
}
