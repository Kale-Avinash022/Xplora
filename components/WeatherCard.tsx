'use client';

import React from 'react';

export interface WeatherPreviewData {
  temp?: string;
  condition?: string;
  recommendation?: string;
  packingAdvice?: string;
  packingBadge?: string;
  icon?: string;
}

interface WeatherCardProps {
  destination: string;
  weather: WeatherPreviewData;
}

export function WeatherCard({ destination, weather }: WeatherCardProps) {
  const icon = weather.icon || '🌧️';
  const temp = weather.temp || '29°C';
  const condition = weather.condition || 'Light Rain';
  const packingAdvice = weather.packingAdvice || weather.recommendation || `🌧️ Rain expected. Pack an umbrella and plan indoor museum/cafe visits.`;
  const packingBadge = weather.packingBadge || '🎒 Travel Ready';

  return (
    <div 
      className="p-4 rounded-xl border bg-gradient-to-br from-[#F4F1E6]/80 via-white to-[#F4F1E6]/50 shadow-sm"
      style={{ borderColor: '#E1DDD1' }}
    >
      {/* Header Line */}
      <div className="flex items-center justify-between gap-2 border-b pb-2.5 mb-2.5" style={{ borderColor: '#E1DDD1' }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#526B57]">
              Trip Packing & Weather Guide
            </h4>
            <p className="text-sm font-bold text-[#263D32]">
              Destination: {destination} <span className="text-xs font-semibold text-gray-600">({temp} • {condition})</span>
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#526B57] text-white shrink-0">
          {packingBadge}
        </span>
      </div>

      {/* Small Advice Box */}
      <div className="p-3 rounded-lg bg-white border border-[#526B57]/20">
        <div className="text-[11px] uppercase tracking-wider font-bold text-[#526B57] mb-0.5">
          💡 What to Pack & Prepare
        </div>
        <p className="text-sm font-medium text-[#263D32] leading-snug">
          {packingAdvice}
        </p>
      </div>
    </div>
  );
}
