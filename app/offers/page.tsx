'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import {
  OFFERS,
  Offer,
  OfferCategory,
  resolveExpiry,
  formatExpiry,
  getTimeLeft,
  formatTimeLeft,
} from '@/lib/offersData'
import {
  useNow,
  CopyCodeButton,
  CATEGORY_EMOJIS,
  ALL_CATEGORIES,
} from '@/components/OfferBits'

export default function OffersPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const now = useNow(1000)

  // Filter offers based on selected category pill
  const filteredOffers = useMemo(() => {
    if (selectedCategory === 'All') {
      return OFFERS
    }
    return OFFERS.filter((offer) =>
      offer.categories.includes(selectedCategory as OfferCategory)
    )
  }, [selectedCategory])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F1E6' }}>
      {/* Sticky Header */}
      <SiteHeader />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Title Section */}
        <section className="mb-8 sm:mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-[#E1DDD1] bg-white/70 text-[#526B57]">
            <span>🏷️ Exclusive Travel Savings</span>
          </div>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight"
            style={{ fontFamily: 'Playfair Display, serif', color: '#263D32' }}
          >
            Travel offers, deals and codes
          </h1>
          <p className="mt-3 text-base sm:text-lg max-w-2xl leading-relaxed text-[#526B57]">
            Handpicked coupons and instant discounts on flights, hotels, homestays, and holidays.
            Copy promo codes and save on your next journey.
          </p>
        </section>

        {/* Category Filter Pills */}
        <section className="mb-8" aria-label="Filter offers by category">
          <div
            role="tablist"
            className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin no-scrollbar"
          >
            {/* All Offers Pill */}
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === 'All'}
              onClick={() => setSelectedCategory('All')}
              className="px-4 py-2 rounded-full text-sm font-semibold shrink-0 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C6A96B]"
              style={
                selectedCategory === 'All'
                  ? { backgroundColor: '#263D32', color: '#F4F1E6', boxShadow: '0 2px 8px rgba(38,61,50,0.2)' }
                  : {
                      backgroundColor: '#FFFFFF',
                      color: '#292A25',
                      border: '1px solid #E1DDD1',
                    }
              }
            >
              All offers
            </button>

            {/* Individual Categories */}
            {ALL_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat
              const emoji = CATEGORY_EMOJIS[cat]
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedCategory(cat)}
                  className="px-4 py-2 rounded-full text-sm font-semibold shrink-0 transition-all duration-200 flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C6A96B]"
                  style={
                    isSelected
                      ? {
                          backgroundColor: '#263D32',
                          color: '#F4F1E6',
                          boxShadow: '0 2px 8px rgba(38,61,50,0.2)',
                        }
                      : {
                          backgroundColor: '#FFFFFF',
                          color: '#292A25',
                          border: '1px solid #E1DDD1',
                        }
                  }
                >
                  <span aria-hidden="true">{emoji}</span>
                  <span>{cat}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-semibold text-[#526B57]">
            Showing {filteredOffers.length} {filteredOffers.length === 1 ? 'offer' : 'offers'}
          </p>
        </div>

        {/* Offer Cards Grid */}
        <section aria-label="Available offers grid">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} now={now} />
            ))}
          </div>

          {filteredOffers.length === 0 && (
            <div
              className="text-center py-16 px-4 bg-white rounded-2xl border"
              style={{ borderColor: '#E1DDD1' }}
            >
              <div className="text-5xl mb-3">🔍</div>
              <h2
                className="text-xl font-bold mb-2"
                style={{ fontFamily: 'Playfair Display, serif', color: '#263D32' }}
              >
                No offers found in this category
              </h2>
              <p className="text-sm text-[#526B57] mb-6">
                Try switching to &quot;All offers&quot; or selecting another travel category.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
                style={{ backgroundColor: '#263D32', color: '#F4F1E6' }}
              >
                View all offers
              </button>
            </div>
          )}
        </section>

        {/* Footer Note */}
        <footer className="mt-14 pt-6 border-t text-center text-xs" style={{ borderColor: '#E1DDD1', color: '#526B57' }}>
          <p>* Offers are sourced from MakeMyTrip. Terms and conditions apply.</p>
        </footer>
      </main>
    </div>
  )
}

interface OfferCardProps {
  offer: Offer
  now: Date | null
}

function OfferCard({ offer, now }: OfferCardProps) {
  const isHydrated = now !== null
  const expiryDate = isHydrated ? resolveExpiry(offer, now) : null
  const formattedExpiry = expiryDate ? formatExpiry(expiryDate) : ''
  const timeLeft = (isHydrated && expiryDate) ? getTimeLeft(expiryDate, now) : null

  // Check if ending in under 24 hours (only computed after hydration to prevent mismatch)
  const isEndingToday = Boolean(
    isHydrated && timeLeft && !timeLeft.expired && timeLeft.days === 0 && timeLeft.totalMs > 0
  )

  return (
    <div
      className="rounded-2xl border overflow-hidden flex flex-col justify-between bg-white shadow-sm hover:shadow-md transition-all duration-200 group"
      style={{ borderColor: '#E1DDD1' }}
    >
      {/* Top Header with Forest-to-Sage Gradient */}
      <Link
        href={`/offers/${offer.id}`}
        className="p-5 text-white relative overflow-hidden block focus:outline-none focus:ring-2 focus:ring-[#C6A96B]"
        style={{
          background: 'linear-gradient(135deg, #263D32 0%, #526B57 100%)',
        }}
      >
        {/* Chips and Badge Row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-1.5">
            {offer.categories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs"
              >
                <span>{CATEGORY_EMOJIS[category]}</span>
                <span>{category}</span>
              </span>
            ))}
          </div>

          {/* Ends today gold badge (rendered only after hydration) */}
          {isHydrated && isEndingToday && (
            <span
              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs shrink-0 animate-pulse"
              style={{ backgroundColor: '#C6A96B', color: '#263D32' }}
            >
              <span>⚡</span>
              <span>Ends today</span>
            </span>
          )}
        </div>

        {/* Emoji and Title */}
        <div className="flex items-start gap-3 mt-1">
          <span className="text-3xl sm:text-4xl shrink-0" aria-hidden="true">
            {offer.emoji}
          </span>
          <h2
            className="text-lg sm:text-xl font-bold leading-snug tracking-tight text-white group-hover:text-[#F4F1E6] transition-colors"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {offer.title}
          </h2>
        </div>
      </Link>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Description */}
        <p className="text-sm leading-relaxed text-[#526B57] line-clamp-2">
          {offer.description}
        </p>

        {/* Dashed Gold Code Box (if code exists) */}
        {offer.code && (
          <div
            className="flex items-center justify-between px-3.5 py-2 rounded-xl border-2 border-dashed bg-[#F4F1E6]/60"
            style={{ borderColor: '#C6A96B' }}
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#526B57]">
                Coupon Code
              </span>
              <span className="font-mono font-black text-sm sm:text-base text-[#263D32] tracking-wider">
                {offer.code}
              </span>
            </div>
            <CopyCodeButton code={offer.code} />
          </div>
        )}

        {/* Expiry and Live Time Left (zero hydration mismatch) */}
        <div className="pt-2 border-t text-xs space-y-1 min-h-[44px]" style={{ borderColor: '#E1DDD1' }}>
          {isHydrated && formattedExpiry ? (
            <>
              <div className="text-[#526B57] flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 shrink-0 text-[#C6A96B]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Expires {formattedExpiry}</span>
              </div>

              {timeLeft && (
                <div
                  className="flex items-center gap-1.5 font-semibold"
                  style={{ color: timeLeft.expired ? '#B91C1C' : '#263D32' }}
                >
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{formatTimeLeft(timeLeft)}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-[#526B57]/50 text-[11px] py-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#C6A96B]/60 animate-ping" />
              <span>Checking offer validity...</span>
            </div>
          )}
        </div>

        {/* Full-width CTA Button */}
        <Link
          href={`/offers/${offer.id}`}
          className="w-full text-center py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-95 shadow-sm active:scale-[0.99] cursor-pointer"
          style={{ backgroundColor: '#263D32', color: '#F4F1E6' }}
        >
          <span>{offer.cta}</span>
          <svg
            className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
