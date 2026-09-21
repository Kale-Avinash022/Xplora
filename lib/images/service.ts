import { prisma } from '@/lib/prisma';
import { PexelsProvider } from './pexels';
import { UnsplashProvider } from './unsplash';
import { ImagePhoto, ImageProviderName, PlaceCategoryType } from './types';
import { getOrSet, normalizeKey } from '@/lib/cache';
import { CACHE_TTLS } from '@/lib/cache/ttls';

const CATEGORY_POOL_KEYS: PlaceCategoryType[] = [
  'landmark',
  'temple',
  'fort',
  'garden',
  'market',
  'museum',
  'nature',
];

const CATEGORY_EMOJIS: Record<PlaceCategoryType, string> = {
  landmark: '🏛️',
  temple: '🛕',
  fort: '🏰',
  garden: '🌳',
  market: '🛍️',
  museum: '🖼️',
  nature: '🌄',
};

/**
 * Map place kinds string or title to category key
 */
export function mapPlaceToCategory(kindsStr: string = '', title: string = ''): PlaceCategoryType {
  const lowerKinds = (kindsStr + ' ' + title).toLowerCase();

  if (lowerKinds.includes('fort') || lowerKinds.includes('castle') || lowerKinds.includes('fortification')) {
    return 'fort';
  }
  if (lowerKinds.includes('temple') || lowerKinds.includes('mandir') || lowerKinds.includes('religion') || lowerKinds.includes('church') || lowerKinds.includes('mosque')) {
    return 'temple';
  }
  if (lowerKinds.includes('museum') || lowerKinds.includes('gallery') || lowerKinds.includes('art')) {
    return 'museum';
  }
  if (lowerKinds.includes('garden') || lowerKinds.includes('park') || lowerKinds.includes('baug')) {
    return 'garden';
  }
  if (lowerKinds.includes('market') || lowerKinds.includes('bazaar') || lowerKinds.includes('mall') || lowerKinds.includes('shop')) {
    return 'market';
  }
  if (lowerKinds.includes('mountain') || lowerKinds.includes('lake') || lowerKinds.includes('cave') || lowerKinds.includes('tekdi') || lowerKinds.includes('nature') || lowerKinds.includes('view_point')) {
    return 'nature';
  }
  return 'landmark';
}

export class ImageService {
  /**
   * Determine primary and backup providers from config
   */
  private static getProvidersOrder(): { primary: ImageProviderName; backup: ImageProviderName } {
    const configured = (process.env.IMAGE_PRIMARY_PROVIDER || 'pexels').toLowerCase().trim();
    if (configured === 'unsplash') {
      return { primary: 'unsplash', backup: 'pexels' };
    }
    return { primary: 'pexels', backup: 'unsplash' };
  }

  /**
   * Call a provider by name
   */
  private static async queryProvider(
    provider: ImageProviderName,
    query: string,
    perPage: number = 30,
    page: number = 1
  ): Promise<ImagePhoto[]> {
    if (provider === 'pexels') {
      return await PexelsProvider.searchPhotos(query, perPage, page);
    } else {
      return await UnsplashProvider.searchPhotos(query, perPage, page);
    }
  }

  /**
   * Fetch with primary, falling back to backup if primary returns empty or fails
   */
  private static async searchWithFailover(
    query: string,
    perPage: number = 30
  ): Promise<ImagePhoto[]> {
    const { primary, backup } = this.getProvidersOrder();

    let photos = await this.queryProvider(primary, query, perPage);
    if (photos.length === 0) {
      photos = await this.queryProvider(backup, query, perPage);
    }
    return photos;
  }

  /**
   * Get or populate category pool for destination
   * Cache pool in PlaceCache for 30 days. Top up from backup if < 8 photos.
   */
  /**
   * Get or populate category pool for destination
   * Cache pool in PlaceCache/Redis for 30 days. Top up from backup if < 8 photos.
   */
  public static async getCategoryPool(
    destination: string,
    category: PlaceCategoryType
  ): Promise<ImagePhoto[]> {
    const cleanDest = destination.trim().toLowerCase();
    const cacheKey = normalizeKey('imgpool', `${cleanDest}:${category}`);

    return getOrSet(cacheKey, CACHE_TTLS.PHOTO_POOL_PER_CITY, async () => {
      const { primary, backup } = this.getProvidersOrder();
      const query = `${destination} ${category}`;
      let pool = await this.queryProvider(primary, query, 30);

      // If fewer than 8 photos, top up with backup provider
      if (pool.length < 8) {
        const backupPhotos = await this.queryProvider(backup, query, 30);
        const existingIds = new Set(pool.map((p) => p.id));
        for (const bp of backupPhotos) {
          if (!existingIds.has(bp.id)) {
            pool.push(bp);
            existingIds.add(bp.id);
          }
        }
      }

      // Fallback: search just destination if category search returned too few
      if (pool.length < 4) {
        const generalPhotos = await this.searchWithFailover(destination, 20);
        const existingIds = new Set(pool.map((p) => p.id));
        for (const gp of generalPhotos) {
          if (!existingIds.has(gp.id)) {
            pool.push(gp);
            existingIds.add(gp.id);
          }
        }
      }

      return pool;
    });
  }

  /**
   * Search place-specific photo for strong stops (rate >= 3 or has wikidata)
   * Cache hits for 30 days, misses for 7 days
   */
  public static async searchPlaceSpecificPhoto(
    placeName: string,
    destination: string
  ): Promise<ImagePhoto | null> {
    const cleanPlace = placeName.trim().toLowerCase();
    const cleanDest = destination.trim().toLowerCase();
    const cacheKey = normalizeKey('imgplace', `${cleanDest}:${cleanPlace.replace(/[^a-z0-9]/g, '')}`);

    return getOrSet(cacheKey, CACHE_TTLS.PHOTO_POOL_PER_CITY, async () => {
      const { primary, backup } = this.getProvidersOrder();
      const query = `${placeName} ${destination}`;

      // Search primary with per_page=5
      let candidates = await this.queryProvider(primary, query, 5);

      // If primary returned nothing relevant, try backup
      if (candidates.length === 0) {
        candidates = await this.queryProvider(backup, query, 5);
      }

      // Filter candidate: accept only if alt, description, or credit mentions place name tokens or destination city
      const placeTokens = placeName
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 3 && !['temple', 'fort', 'park', 'garden', 'palace', 'caves'].includes(t));

      const destToken = destination.toLowerCase();

      const matchedPhoto = candidates.find((c) => {
        const text = (c.alt || '').toLowerCase();
        const hasDest = text.includes(destToken);
        const hasPlaceToken = placeTokens.some((token) => text.includes(token));
        return hasPlaceToken || (hasDest && placeTokens.length === 0);
      });

      return matchedPhoto || null;
    });
  }

  /**
   * Create a styled placeholder when both providers or pool are exhausted
   */
  public static createPlaceholder(
    placeName: string,
    destination: string,
    category: PlaceCategoryType
  ): ImagePhoto {
    const emoji = CATEGORY_EMOJIS[category] || '📍';
    return {
      id: `placeholder:${category}:${encodeURIComponent(placeName)}`,
      provider: 'pexels', // dummy
      url: '',
      width: 480,
      height: 320,
      color: '#263D32',
      alt: `${placeName}, ${destination}`,
      credit: {
        photographer: 'Xplora',
        photographerUrl: 'https://www.pexels.com',
        photoUrl: 'https://www.pexels.com',
      },
      captionType: 'destination',
      caption: `Photo of ${destination}`,
      isPlaceholder: true,
      categoryEmoji: emoji,
    };
  }

  /**
   * Assign unique images across all stops in an itinerary
   * Strictly guarantees NO two activities share an image
   */
  public static async assignImagesToTrip(
    destination: string,
    dayPlans: {
      dayNumber: number;
      activities: {
        id: string;
        title: string;
        kindsStr?: string;
        rate?: number;
        hasWiki?: boolean;
      }[];
    }[]
  ): Promise<{
    photoMap: Map<string, ImagePhoto>;
    usedProviders: ImageProviderName[];
  }> {
    const photoMap = new Map<string, ImagePhoto>();
    const usedPhotoIds = new Set<string>();
    const usedProviders = new Set<ImageProviderName>();

    // Load category pools for this destination in parallel
    const poolsByCategory = new Map<PlaceCategoryType, ImagePhoto[]>();
    const poolResults = await Promise.all(
      CATEGORY_POOL_KEYS.map(async (cat) => {
        const pool = await this.getCategoryPool(destination, cat);
        return { cat, pool: [...pool] };
      })
    );
    for (const res of poolResults) {
      poolsByCategory.set(res.cat, res.pool);
    }

    // Identify candidate stops for place-specific match (rate >= 3 or hasWiki, max 6 per trip)
    const allActivities = dayPlans.flatMap((dp) => dp.activities);
    const strongCandidates = allActivities
      .filter((a) => (a.rate !== undefined && a.rate >= 3) || a.hasWiki)
      .slice(0, 6);
    const strongCandidateIds = new Set(strongCandidates.map((c) => c.id));

    // Place-specific searches in parallel (max 6)
    const placeSpecificPhotos = new Map<string, ImagePhoto>();
    const specificResults = await Promise.all(
      strongCandidates.map(async (strong) => {
        const photo = await this.searchPlaceSpecificPhoto(strong.title, destination);
        return { id: strong.id, title: strong.title, photo };
      })
    );

    for (const res of specificResults) {
      if (res.photo && !usedPhotoIds.has(res.photo.id)) {
        res.photo.captionType = 'place';
        res.photo.caption = `Photo related to ${res.title}`;
        placeSpecificPhotos.set(res.id, res.photo);
      }
    }

    // Now assign images to all activities
    for (const dp of dayPlans) {
      for (const act of dp.activities) {
        const category = mapPlaceToCategory(act.kindsStr, act.title);

        let chosenPhoto: ImagePhoto | null = null;

        // 1. Check if we have an unused place-specific photo
        if (strongCandidateIds.has(act.id)) {
          const specific = placeSpecificPhotos.get(act.id);
          if (specific && !usedPhotoIds.has(specific.id)) {
            chosenPhoto = specific;
          }
        }

        // 2. Unused pool photo whose alt matches the category
        if (!chosenPhoto) {
          const categoryPool = poolsByCategory.get(category) || [];
          const categoryAltMatch = categoryPool.find(
            (p) =>
              !usedPhotoIds.has(p.id) &&
              p.alt.toLowerCase().includes(category)
          );
          if (categoryAltMatch) {
            chosenPhoto = {
              ...categoryAltMatch,
              captionType: 'destination',
              caption: `Photo of ${destination}`,
            };
          }
        }

        // 3. Any unused pool photo from that category
        if (!chosenPhoto) {
          const categoryPool = poolsByCategory.get(category) || [];
          const anyCategoryPhoto = categoryPool.find((p) => !usedPhotoIds.has(p.id));
          if (anyCategoryPhoto) {
            chosenPhoto = {
              ...anyCategoryPhoto,
              captionType: 'destination',
              caption: `Photo of ${destination}`,
            };
          }
        }

        // 4. Any unused pool photo from any category in destination
        if (!chosenPhoto) {
          for (const pool of Array.from(poolsByCategory.values())) {
            const anyPhoto = pool.find((p) => !usedPhotoIds.has(p.id));
            if (anyPhoto) {
              chosenPhoto = {
                ...anyPhoto,
                captionType: 'destination',
                caption: `Photo of ${destination}`,
              };
              break;
            }
          }
        }

        // 5. If everything exhausted or budget cap hit, create styled placeholder
        if (!chosenPhoto) {
          chosenPhoto = this.createPlaceholder(act.title, destination, category);
        } else {
          usedPhotoIds.add(chosenPhoto.id);
          if (!chosenPhoto.isPlaceholder) {
            usedProviders.add(chosenPhoto.provider);
          }
        }

        photoMap.set(act.id, chosenPhoto);
      }
    }

    return {
      photoMap,
      usedProviders: Array.from(usedProviders),
    };
  }
}
