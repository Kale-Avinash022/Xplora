'use client';

import React from 'react';

interface WeatherSwapBannerProps {
  weatherNotice?: string | null;
  onSwapBack?: () => void;
}

export function WeatherSwapBanner({ weatherNotice, onSwapBack }: WeatherSwapBannerProps) {
  if (!weatherNotice) return null;

  return (
    <div className="mb-6 p-4 rounded-xl bg-amber-50 border-2 border-amber-300 shadow-md text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">☔</span>
        <div>
          <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
            <span>Automated Weather-Swap Safeguard Active</span>
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-extrabold bg-amber-200 text-amber-900 border border-amber-400">
              Rain Protection
            </span>
          </h4>
          <p className="text-xs font-medium text-amber-850 mt-0.5">
            {weatherNotice}
          </p>
        </div>
      </div>

      {onSwapBack && (
        <button
          onClick={onSwapBack}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-amber-900 border border-amber-300 hover:bg-amber-100 transition shrink-0 shadow-xs"
        >
          View Swap Details
        </button>
      )}
    </div>
  );
}
