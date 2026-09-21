'use client'

import { Deal, formatINR, formatDuration, formatDealDate } from '@/lib/deals'

interface DealCardProps {
  deal: Deal
  onSelect: (deal: Deal) => void
}

export function DealCard({ deal, onSelect }: DealCardProps) {
  const isHotel = deal.category === 'hotel'
  const isFlight = deal.category === 'flight'
  const categoryIcon = isFlight ? '✈️' : deal.category === 'train' ? '🚆' : '🏨'
  const categoryLabel = isFlight ? 'Flight' : deal.category === 'train' ? 'Train' : 'Hotel'
  const isLowAvailability = deal.availability <= 5

  return (
    <article
      className="group relative flex flex-col rounded-xl border bg-white shadow-sm
        hover:-translate-y-1 hover:shadow-lg transition-all duration-200
        focus-within:ring-2 focus-within:ring-teal-700 focus-within:ring-offset-2
        dark:bg-slate-800 dark:border-slate-700"
      style={{ borderColor: 'var(--soft-border)' }}
    >
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Top row: provider + tag */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0" aria-hidden="true">{categoryIcon}</span>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: 'var(--forest-green)' }}>
                {deal.provider}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{categoryLabel}</p>
            </div>
          </div>
          {deal.tag && (
            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-700 text-white">
              {deal.tag}
            </span>
          )}
        </div>

        {/* Route / Hotel info */}
        {isHotel ? (
          <div className="space-y-1">
            <p className="font-bold text-base leading-tight" style={{ color: 'var(--main-text)' }}>
              {deal.title}
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400">{deal.to}</p>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-amber-500">★</span>
              <span className="font-semibold" style={{ color: 'var(--main-text)' }}>
                {deal.rating?.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">{deal.classLabel}</p>
            <p className="text-xs font-medium" style={{ color: 'var(--sage-green)' }}>
              {deal.nights} night{deal.nights !== 1 ? 's' : ''} · {deal.travellers} guest{deal.travellers !== 1 ? 's' : ''}
            </p>
            {deal.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {deal.amenities.slice(0, 3).map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black tracking-tight" style={{ color: 'var(--main-text)' }}>
                {deal.fromCode}
              </span>
              <span className="text-gray-400 text-sm">→</span>
              <span className="text-xl font-black tracking-tight" style={{ color: 'var(--main-text)' }}>
                {deal.toCode}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {deal.from} → {deal.to}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold" style={{ color: 'var(--main-text)' }}>{deal.departTime}</span>
              <div className="flex-1 flex flex-col items-center gap-0.5">
                <span className="text-[10px] text-gray-400">{formatDuration(deal.durationMins!)}</span>
                <div className="w-full h-px bg-gray-300 dark:bg-slate-600" />
                {isFlight && (
                  <span className="text-[10px] text-gray-400">
                    {deal.stops === 0 ? 'Non-stop' : `${deal.stops} stop`}
                  </span>
                )}
              </div>
              <span className="font-bold" style={{ color: 'var(--main-text)' }}>
                {deal.arriveTime}
                {(deal.arriveDayOffset ?? 0) > 0 && (
                  <sup className="text-[10px] text-orange-500 ml-0.5">+{deal.arriveDayOffset}</sup>
                )}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {formatDealDate(deal.date)} · {deal.classLabel} · {deal.travellers} traveller{deal.travellers !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Footer: pricing */}
        <div className="mt-auto pt-3 border-t border-dashed space-y-2" style={{ borderColor: 'var(--soft-border)' }}>
          <div className="flex items-end justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black bg-green-50 text-green-700 border border-green-200">
                {deal.discountPct}% OFF
              </span>
              <span className="text-xs text-gray-400 line-through">{formatINR(deal.originalPrice)}</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-black leading-none" style={{ color: 'var(--forest-green)' }}>
                {formatINR(deal.price)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {formatINR(deal.unitPrice)}{' '}
                {isHotel ? 'per night' : 'per person'}
              </p>
            </div>
          </div>

          {isLowAvailability && (
            <p className="text-[11px] font-bold text-red-600 flex items-center gap-1">
              <span>⚠️</span>
              Only {deal.availability} {isHotel ? 'room' : 'seat'}{deal.availability !== 1 ? 's' : ''} left
            </p>
          )}

          <p className="text-[10px] text-gray-400">
            Valid till {formatDealDate(deal.validTill)}
          </p>
        </div>
      </div>

      {/* Book now button */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => onSelect(deal)}
          className="w-full py-2.5 rounded-lg text-sm font-bold text-white
            bg-teal-700 hover:bg-teal-800 active:bg-teal-900
            focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2
            transition-colors duration-150"
        >
          Book now
        </button>
      </div>
    </article>
  )
}
