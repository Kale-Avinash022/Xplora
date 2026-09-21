// lib/images/types.ts
// Image types for Pexels and Unsplash providers

export type ImageProviderName = 'pexels' | 'unsplash';

export interface ImageCredit {
  photographer: string;
  photographerUrl: string;
  photoUrl: string;
}

export interface ImagePhoto {
  id: string; // "<provider>:<nativeId>"
  provider: ImageProviderName;
  url: string;
  width: number;
  height: number;
  color: string;
  alt: string;
  credit: ImageCredit;
  downloadLocation?: string; // Unsplash download tracking URL
  captionType?: 'place' | 'destination';
  caption?: string;
  isPlaceholder?: boolean;
  categoryEmoji?: string;
}

export type PlaceCategoryType = 'landmark' | 'temple' | 'fort' | 'garden' | 'market' | 'museum' | 'nature';
