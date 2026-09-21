// components/ActivityCard.tsx
'use client';

import React, { useState } from 'react';
import { ImagePhoto } from '@/lib/images/types';

export interface ActivityCardProps {
  activity: {
    id: string;
    timeSlot: string;
    timeSlotNote?: string;
    title: string;
    description: string;
    category?: string;
    kindLabel?: string;
    cost?: number;
    costLabel?: string;
    feeState?: string;
    osmSource?: boolean;
    website?: string;
    phone?: string;
    openingHours?: string;
    location?: string;
    address?: string;
    mapsUrl?: string;
    isIndoor?: boolean;
    isIndoorOption?: boolean;
    travelTimeFromPrev?: string;
    travelDistanceKm?: number;
    image?: ImagePhoto;
  };
  destination: string;
}

export function ActivityCard({ activity, destination }: ActivityCardProps) {
  const [imgError, setImgError] = useState(false);

  const imgData = activity.image;
  const isPlaceholder = !imgData?.url || imgData?.isPlaceholder || imgError;
  const emoji = imgData?.categoryEmoji || '📍';
  const bgColor = imgData?.color || '#263D32';

  return (
    <div className="p-4 rounded-xl bg-[#F4F1E6]/30 border border-[#E1DDD1] flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        {/* Header slot & kind badge */}
        <div className="flex justify-between items-start mb-3 gap-2 flex-wrap">
          <div className="flex flex-col">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-[#526B57] border border-[#E1DDD1]">
              {activity.timeSlot}
            </span>
            {activity.timeSlotNote && (
              <span className="text-[10px] text-gray-500 mt-0.5">{activity.timeSlotNote}</span>
            )}
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
            {activity.kindLabel || activity.category || 'Sightseeing'}
          </span>
        </div>

        {/* Media & Content Row (Desktop 160x120, Mobile 96x96 thumbnail on the left) */}
        <div className="flex flex-col sm:flex-row gap-3 items-start mb-3">
          {/* Thumbnail Container */}
          <div className="shrink-0 w-full sm:w-[160px] h-[120px] max-sm:h-[96px] rounded-lg overflow-hidden border border-[#E1DDD1] relative flex flex-col justify-between"
            style={{ backgroundColor: bgColor }}
          >
            {isPlaceholder ? (
              <div
                className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none"
                style={{
                  background: `linear-gradient(135deg, ${bgColor} 0%, #1c2b23 100%)`,
                }}
              >
                <span className="text-3xl mb-1">{emoji}</span>
                <span className="text-[10px] font-semibold text-white/90 truncate max-w-[140px] px-1">
                  {activity.title}
                </span>
              </div>
            ) : (
              <img
                src={imgData.url}
                alt={imgData.alt || activity.title}
                loading="lazy"
                width={160}
                height={120}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            )}

            {/* Caption badge overlaid at bottom */}
            {imgData?.caption && !isPlaceholder && (
              <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs py-0.5 px-1.5 text-center">
                <span className="text-[9px] text-white/95 font-medium block truncate" title={imgData.caption}>
                  {imgData.caption}
                </span>
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <h5 className="font-bold text-sm text-[#292A25] mb-1 leading-snug">{activity.title}</h5>
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">{activity.description}</p>
          </div>
        </div>

        {/* Photo Attribution / Credit Link */}
        {imgData && !isPlaceholder && imgData.credit && (
          <div className="mb-2 text-[11px] text-gray-500 truncate" title={`Photo by ${imgData.credit.photographer} on ${imgData.provider === 'pexels' ? 'Pexels' : 'Unsplash'}`}>
            {imgData.provider === 'pexels' ? (
              <span>
                Photo by{' '}
                <a
                  href={imgData.credit.photographerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[#263D32] font-medium"
                >
                  {imgData.credit.photographer}
                </a>{' '}
                on{' '}
                <a
                  href={imgData.credit.photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[#263D32] font-medium"
                >
                  Pexels
                </a>
              </span>
            ) : (
              <span>
                Photo by{' '}
                <a
                  href={imgData.credit.photographerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[#263D32] font-medium"
                >
                  {imgData.credit.photographer}
                </a>{' '}
                on{' '}
                <a
                  href="https://unsplash.com?utm_source=xplora&utm_medium=referral"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[#263D32] font-medium"
                >
                  Unsplash
                </a>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Meta: Location, Maps, Hours, Pricing, Transit */}
      <div className="space-y-1.5 border-t pt-2 mt-2" style={{ borderColor: '#E1DDD1' }}>
        <div className="text-[11px] font-medium text-gray-500 flex items-center justify-between gap-1 flex-wrap">
          <span className="truncate max-w-[190px]">📍 {activity.location || activity.address || destination}</span>
          {activity.mapsUrl && (
            <a
              href={activity.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-700 hover:text-teal-900 dark:text-teal-300 font-bold underline flex items-center gap-0.5 shrink-0"
            >
              Open in Maps ↗
            </a>
          )}
        </div>

        {/* Price State Display */}
        <div className="flex justify-between items-center text-[11px]">
          <div className="flex items-center gap-1">
            {activity.openingHours ? (
              <span className="text-gray-600 font-medium">🕒 Hours (OpenStreetMap): {activity.openingHours}</span>
            ) : (
              <span className="text-amber-800 dark:text-amber-300 font-medium">🕒 Check timings locally</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-right">
            <span className="font-bold text-[#263D32] dark:text-slate-200">
              {activity.costLabel || 'Price not available'}
            </span>
            {activity.osmSource && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 border border-gray-200">
                Source: OpenStreetMap
              </span>
            )}
          </div>
        </div>

        {/* Website Confirmation Link */}
        {activity.website && (
          <div className="text-[10px] text-teal-800 dark:text-teal-300 flex items-center gap-1">
            <span>🔗</span>
            <a
              href={activity.website.startsWith('http') ? activity.website : `https://${activity.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-teal-900 truncate"
            >
              Confirm on the official website before visiting ↗
            </a>
          </div>
        )}

        {activity.travelTimeFromPrev && (
          <div className="text-[10px] font-bold text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
            🚗 {activity.travelTimeFromPrev}
          </div>
        )}
      </div>
    </div>
  );
}
