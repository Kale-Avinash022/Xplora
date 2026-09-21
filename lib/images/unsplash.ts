// lib/images/unsplash.ts
// Unsplash API Provider (Backup / Fallback)
// Documentation: https://unsplash.com/documentation

import { prisma } from '@/lib/prisma';
import { fetchWithPolicy } from '@/lib/http/fetchPolicy';
import { ImagePhoto } from './types';

interface UnsplashUrls {
  raw: string;
  full: string;
  regular: string;
  small: string;
  thumb: string;
}

interface UnsplashLinks {
  self: string;
  html: string;
  download: string;
  download_location: string;
}

interface UnsplashUser {
  id: string;
  username: string;
  name: string;
  links: {
    html: string;
  };
}

interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  color: string;
  alt_description: string | null;
  description: string | null;
  urls: UnsplashUrls;
  links: UnsplashLinks;
  user: UnsplashUser;
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

// In-memory rate limit remaining for fast rejection
let unsplashRemainingThisHour: number | null = null;

export class UnsplashProvider {
  private static readonly API_URL = 'https://api.unsplash.com/search/photos';

  /**
   * Check if Unsplash has available budget for the current hour
   */
  public static async hasAvailableBudget(): Promise<boolean> {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey || accessKey.trim() === '') {
      return false;
    }

    if (unsplashRemainingThisHour !== null && unsplashRemainingThisHour < 5) {
      return false;
    }

    const hourlyCap = parseInt(process.env.UNSPLASH_HOURLY_CAP || '40', 10);
    const dateObj = new Date();
    const currentHourStr = `${dateObj.toISOString().slice(0, 13)}`;

    try {
      const hourlyUsage = await prisma.apiUsage.findUnique({
        where: {
          provider_day: {
            provider: 'unsplash:hourly',
            day: currentHourStr,
          },
        },
      });

      if (hourlyUsage && hourlyUsage.count >= hourlyCap) {
        return false;
      }

      return true;
    } catch (e) {
      return true;
    }
  }

  /**
   * Record API usage after successful call
   */
  private static async recordCall(): Promise<void> {
    const dateObj = new Date();
    const currentHourStr = `${dateObj.toISOString().slice(0, 13)}`;

    try {
      await prisma.apiUsage.upsert({
        where: {
          provider_day: {
            provider: 'unsplash:hourly',
            day: currentHourStr,
          },
        },
        update: { count: { increment: 1 } },
        create: { provider: 'unsplash:hourly', day: currentHourStr, count: 1 },
      });
    } catch (e) {
      // Ignore database tracking errors
    }
  }

  /**
   * Search photos from Unsplash API
   */
  public static async searchPhotos(
    query: string,
    perPage: number = 30,
    page: number = 1
  ): Promise<ImagePhoto[]> {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey || accessKey.trim() === '') {
      return [];
    }

    const hasBudget = await this.hasAvailableBudget();
    if (!hasBudget) {
      return [];
    }

    const url = `${this.API_URL}?query=${encodeURIComponent(
      query
    )}&per_page=${perPage}&page=${page}&orientation=landscape&content_filter=high`;

    try {
      const res = await fetchWithPolicy('unsplash', url, {
        method: 'GET',
        headers: {
          Authorization: `Client-ID ${accessKey.trim()}`,
          'Accept-Version': 'v1',
        },
      });

      await this.recordCall();

      const remainingHeader = res.headers.get('X-Ratelimit-Remaining');
      if (remainingHeader) {
        unsplashRemainingThisHour = parseInt(remainingHeader, 10);
      }

      if (!res.ok) {
        if (res.status === 429) {
          console.warn('[Unsplash] 429 Rate limited. Disabling provider temporarily.');
          unsplashRemainingThisHour = 0;
        }
        return [];
      }

      const data: UnsplashSearchResponse = await res.json();
      if (!data || !Array.isArray(data.results)) {
        return [];
      }

      return data.results.map((p): ImagePhoto => {
        // Keep every query parameter in the returned URL (including ixid) and only append sizing parameters
        const baseRegular = p.urls.regular;
        const separator = baseRegular.includes('?') ? '&' : '?';
        const sizedUrl = `${baseRegular}${separator}w=480&h=320&fit=crop&q=75&auto=format`;

        return {
          id: `unsplash:${p.id}`,
          provider: 'unsplash',
          url: sizedUrl,
          width: p.width,
          height: p.height,
          color: p.color || '#374151',
          alt: p.alt_description || p.description || query,
          credit: {
            photographer: p.user.name,
            photographerUrl: `${p.user.links.html}?utm_source=xplora&utm_medium=referral`,
            photoUrl: `https://unsplash.com?utm_source=xplora&utm_medium=referral`,
          },
          downloadLocation: p.links.download_location,
        };
      });
    } catch (err) {
      console.error(`[Unsplash] Request failed for query "${query}":`, err);
      return [];
    }
  }

  /**
   * Track Unsplash download event on the server
   * Called when user saves trip to My Trips
   */
  public static async trackDownload(downloadLocation: string, photoId: string): Promise<void> {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey || accessKey.trim() === '' || !downloadLocation) {
      return;
    }

    const trackingKey = `unsplash:download:${photoId}`;

    try {
      // Check if already tracked to avoid duplicate pings
      const alreadyTracked = await prisma.placeCache.findUnique({
        where: { key: trackingKey },
      });
      if (alreadyTracked) {
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch(downloadLocation, {
        method: 'GET',
        headers: {
          Authorization: `Client-ID ${accessKey.trim()}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Remember tracked photo in PlaceCache
      await prisma.placeCache.create({
        data: {
          key: trackingKey,
          payload: JSON.stringify({ trackedAt: new Date().toISOString() }),
        },
      });
    } catch (e) {
      // Ignore failures silently as required
    }
  }
}
