// lib/images/pexels.ts
// Pexels API Provider (Primary)
// Documentation: https://www.pexels.com/api/documentation/

import { prisma } from '@/lib/prisma';
import { fetchWithPolicy } from '@/lib/http/fetchPolicy';
import { ImagePhoto } from './types';

interface PexelsPhotoSrc {
  original: string;
  large2x: string;
  large: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
}

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: PexelsPhotoSrc;
  liked: boolean;
  alt: string;
}

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

// In-memory rate limit tracking for fast rejection
let pexelsRemainingThisHour: number | null = null;
let pexelsResetTime: number = 0;

export class PexelsProvider {
  private static readonly API_URL = 'https://api.pexels.com/v1/search';

  /**
   * Check if Pexels has available budget for the current hour and month
   */
  public static async hasAvailableBudget(): Promise<boolean> {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return false;
    }

    // Check in-memory rate limit remaining if not reset yet
    const now = Date.now();
    if (pexelsRemainingThisHour !== null && now < pexelsResetTime && pexelsRemainingThisHour < 5) {
      return false;
    }

    const hourlyCap = parseInt(process.env.PEXELS_HOURLY_CAP || '150', 10);
    const dateObj = new Date();
    const currentHourStr = `${dateObj.toISOString().slice(0, 13)}`; // YYYY-MM-DDTHH
    const currentMonthStr = `${dateObj.toISOString().slice(0, 7)}`; // YYYY-MM

    try {
      // Check hourly usage
      const hourlyUsage = await prisma.apiUsage.findUnique({
        where: {
          provider_day: {
            provider: 'pexels:hourly',
            day: currentHourStr,
          },
        },
      });

      if (hourlyUsage && hourlyUsage.count >= hourlyCap) {
        return false;
      }

      // Check monthly counter and log warning if >= 80% of 20,000 (16,000)
      const monthlyUsage = await prisma.apiUsage.findUnique({
        where: {
          provider_day: {
            provider: 'pexels:monthly',
            day: currentMonthStr,
          },
        },
      });

      if (monthlyUsage) {
        if (monthlyUsage.count >= 20000) {
          return false;
        }
        if (monthlyUsage.count >= 16000) {
          console.warn(`[Pexels] Warning: Monthly quota reached ${monthlyUsage.count}/20,000 (>=80%)`);
        }
      }

      return true;
    } catch (e) {
      // If DB check fails, proceed cautiously
      return true;
    }
  }

  /**
   * Record API usage after successful call
   */
  private static async recordCall(): Promise<void> {
    const dateObj = new Date();
    const currentHourStr = `${dateObj.toISOString().slice(0, 13)}`;
    const currentMonthStr = `${dateObj.toISOString().slice(0, 7)}`;

    try {
      await prisma.$transaction([
        prisma.apiUsage.upsert({
          where: {
            provider_day: {
              provider: 'pexels:hourly',
              day: currentHourStr,
            },
          },
          update: { count: { increment: 1 } },
          create: { provider: 'pexels:hourly', day: currentHourStr, count: 1 },
        }),
        prisma.apiUsage.upsert({
          where: {
            provider_day: {
              provider: 'pexels:monthly',
              day: currentMonthStr,
            },
          },
          update: { count: { increment: 1 } },
          create: { provider: 'pexels:monthly', day: currentMonthStr, count: 1 },
        }),
      ]);
    } catch (e) {
      // Ignore database tracking errors
    }
  }

  /**
   * Search photos from Pexels API
   */
  public static async searchPhotos(
    query: string,
    perPage: number = 30,
    page: number = 1
  ): Promise<ImagePhoto[]> {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return [];
    }

    const hasBudget = await this.hasAvailableBudget();
    if (!hasBudget) {
      return [];
    }

    const url = `${this.API_URL}?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=landscape`;

    try {
      const res = await fetchWithPolicy('pexels', url, {
        method: 'GET',
        headers: {
          Authorization: apiKey.trim(),
        },
      });

      // Record call
      await this.recordCall();

      // Read rate limit headers
      const remainingHeader = res.headers.get('X-Ratelimit-Remaining');
      const resetHeader = res.headers.get('X-Ratelimit-Reset');
      if (remainingHeader) {
        pexelsRemainingThisHour = parseInt(remainingHeader, 10);
      }
      if (resetHeader) {
        pexelsResetTime = parseInt(resetHeader, 10) * 1000;
      }

      if (!res.ok) {
        if (res.status === 429) {
          console.warn('[Pexels] 429 Rate limited. Disabling provider temporarily.');
          pexelsRemainingThisHour = 0;
        }
        return [];
      }

      const data: PexelsSearchResponse = await res.json();
      if (!data || !Array.isArray(data.photos)) {
        return [];
      }

      return data.photos.map((p): ImagePhoto => ({
        id: `pexels:${p.id}`,
        provider: 'pexels',
        url: p.src.landscape || p.src.large || p.src.medium,
        width: p.width,
        height: p.height,
        color: p.avg_color || '#374151',
        alt: p.alt || query,
        credit: {
          photographer: p.photographer,
          photographerUrl: p.photographer_url,
          photoUrl: p.url,
        },
      }));
    } catch (err) {
      console.error(`[Pexels] Request failed for query "${query}":`, err);
      return [];
    }
  }
}
