'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { SiteHeader } from '@/components/SiteHeader'
import {
  OFFERS,
  getOfferById,
  resolveExpiry,
  formatExpiry,
  getTimeLeft,
  Offer,
} from '@/lib/offersData'
import {
  useNow,
  CopyCodeButton,
  CATEGORY_EMOJIS,
} from '@/components/OfferBits'

export default function OfferDetailPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)

  const offer = useMemo(() => {
    return id ? getOfferById(id) : undefined
  }, [id])

  const now = useNow(1000)

  // Up to 3 related offers sharing at least one category
  const relatedOffers = useMemo(() => {
    if (!offer) return []
    const matching = OFFERS.filter(
      (o) =>
        o.id !== offer.id &&
        o.categories.some((cat) => offer.categories.includes(cat))
    )
    if (matching.length >= 3) {
      return matching.slice(0, 3)
    }
    // If fewer than 3 matching category, pad with other popular offers
    const otherOffers = OFFERS.filter(
      (o) => o.id !== offer.id && !matching.some((m) => m.id === o.id)
    )
    return [...matching, ...otherOffers].slice(0, 3)
  }, [offer])

  // Not Found State
  if (!offer) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F1E6' }}>
        <SiteHeader />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-16 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-4xl shadow-sm mb-6 border border-[#E1DDD1]">
            🏷️
          </div>
          <h1
            className="text-3xl sm:text-4xl font-black mb-3"
            style={{ fontFamily: 'Playfair Display, serif', color: '#263D32' }}
          >
            Offer Not Found
          </h1>
          <p className="text-base text-[#526B57] max-w-md mb-8">
            The deal you are looking for might have ended, been removed, or the link may be broken.
          </p>
          <Link
            href="/offers"
            className="px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all duration-150 cursor-pointer"
            style={{ backgroundColor: '#263D32', color: '#F4F1E6' }}
          >
            Browse all offers
          </Link>
        </main>
      </div>
    )
  }

  // Calculate live expiry and time left (only after hydration to prevent SSR mismatch)
  const isHydrated = now !== null
  const expiryDate = isHydrated ? resolveExpiry(offer, now) : null
  const formattedExpiry = expiryDate ? formatExpiry(expiryDate) : ''
  const timeLeft = (isHydrated && expiryDate) ? getTimeLeft(expiryDate, now) : null

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F1E6' }}>
      {/* Sticky Header */}
      <SiteHeader />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/offers"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-150 group"
            style={{ color: '#526B57' }}
          >
            <span className="transition-transform duration-150 group-hover:-translate-x-1">←</span>
            <span>Back to all offers</span>
          </Link>
        </div>

        {/* Hero Banner with Gradient */}
        <section
          className="rounded-3xl p-6 sm:p-10 text-white shadow-lg overflow-hidden relative mb-8"
          style={{
            background: 'linear-gradient(135deg, #263D32 0%, #526B57 100%)',
          }}
        >
          {/* Categories row */}
          <div className="flex flex-wrap gap-2 mb-4">
            {offer.categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-xs"
              >
                <span>{CATEGORY_EMOJIS[cat]}</span>
                <span>{cat}</span>
              </span>
            ))}
          </div>

          {/* Emoji & Title */}
          <div className="flex items-start gap-4 sm:gap-6 mt-2">
            <span className="text-4xl sm:text-6xl shrink-0" aria-hidden="true">
              {offer.emoji}
            </span>
            <div>
              <h1
                className="text-2xl sm:text-4xl font-black tracking-tight leading-tight"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {offer.title}
              </h1>
              <p className="mt-3 text-base sm:text-lg text-white/90 leading-relaxed font-normal">
                {offer.description}
              </p>
            </div>
          </div>
        </section>

        {/* Live Countdown Section */}
        <section
          className="bg-white rounded-2xl p-6 sm:p-8 border shadow-sm mb-8 text-center"
          style={{ borderColor: '#E1DDD1' }}
          aria-label="Offer validity and countdown timer"
        >
          <h2
            className="text-lg sm:text-xl font-bold mb-4"
            style={{ fontFamily: 'Playfair Display, serif', color: '#263D32' }}
          >
            {isHydrated && timeLeft?.expired ? 'Offer Status' : 'Limited Time Offer — Grab It Before It Ends!'}
          </h2>

          {isHydrated && timeLeft?.expired ? (
            <div
              className="py-4 px-6 rounded-xl font-bold text-sm sm:text-base inline-flex items-center gap-2"
              style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
            >
              <span>⚠️</span>
              <span>This offer has ended</span>
            </div>
          ) : (
            <>
              {/* Countdown Tiles */}
              <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg mx-auto mb-4">
                <CountdownTile
                  value={isHydrated && timeLeft ? String(timeLeft.days).padStart(2, '0') : '--'}
                  label="Days"
                />
                <CountdownTile
                  value={isHydrated && timeLeft ? String(timeLeft.hours).padStart(2, '0') : '--'}
                  label="Hours"
                />
                <CountdownTile
                  value={isHydrated && timeLeft ? String(timeLeft.minutes).padStart(2, '0') : '--'}
                  label="Minutes"
                />
                <CountdownTile
                  value={isHydrated && timeLeft ? String(timeLeft.seconds).padStart(2, '0') : '--'}
                  label="Seconds"
                />
              </div>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm font-medium text-[#526B57]">
                {isHydrated && formattedExpiry ? (
                  <>
                    Valid until <span className="font-bold text-[#263D32]">{formattedExpiry}</span>
                  </>
                ) : (
                  <span>Checking offer validity...</span>
                )}
              </p>
            </>
          )}
        </section>

        {/* Large Copy Code Box (if offer has code) */}
        {offer.code && (
          <section
            className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-dashed shadow-sm mb-8 relative overflow-hidden"
            style={{ borderColor: '#C6A96B' }}
            aria-label="Promo code redemption box"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-[#526B57]">
                  Use promo code at checkout
                </span>
                <div
                  className="font-mono font-black text-3xl sm:text-4xl tracking-widest my-1"
                  style={{ color: '#263D32' }}
                >
                  {offer.code}
                </div>
                <p className="text-xs text-[#526B57]">
                  Copy this coupon code and paste it on the booking payment screen.
                </p>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                <CopyCodeButton code={offer.code} variant="large" className="w-full sm:w-auto" />
              </div>
            </div>
          </section>
        )}

        {/* 2-Column Info Grid: How to Redeem & Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* How to Redeem Card */}
          <section
            className="bg-white rounded-2xl p-6 sm:p-7 border shadow-sm flex flex-col justify-between"
            style={{ borderColor: '#E1DDD1' }}
          >
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xl">✨</span>
                <h3
                  className="text-lg font-bold"
                  style={{ fontFamily: 'Playfair Display, serif', color: '#263D32' }}
                >
                  How to redeem
                </h3>
              </div>

              <ol className="space-y-4">
                {offer.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5"
                      style={{ backgroundColor: '#263D32', color: '#F4F1E6' }}
                    >
                      {idx + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-[#292A25]">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Terms & Conditions Card */}
          <section
            className="bg-white rounded-2xl p-6 sm:p-7 border shadow-sm flex flex-col justify-between"
            style={{ borderColor: '#E1DDD1' }}
          >
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xl">📜</span>
                <h3
                  className="text-lg font-bold"
                  style={{ fontFamily: 'Playfair Display, serif', color: '#263D32' }}
                >
                  Terms and conditions
                </h3>
              </div>

              <ul className="space-y-3">
                {offer.terms.map((term, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#526B57]">
                    <span className="text-[#C6A96B] font-bold text-base leading-none mt-0.5">•</span>
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* Action Buttons */}
        <section className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Link
            href="/"
            className="w-full sm:w-auto text-center px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 shadow-md hover:opacity-95 active:scale-[0.99] flex items-center justify-center gap-2"
            style={{ backgroundColor: '#263D32', color: '#F4F1E6' }}
          >
            <span>✨</span>
            <span>Plan a trip with Xplora</span>
          </Link>

          <Link
            href="/offers"
            className="w-full sm:w-auto text-center px-8 py-3.5 rounded-xl font-bold text-sm bg-white border transition-all duration-150 hover:bg-[#F4F1E6] shadow-sm flex items-center justify-center gap-2"
            style={{ borderColor: '#E1DDD1', color: '#263D32' }}
          >
            <span>🏷️</span>
            <span>See more offers</span>
          </Link>
        </section>

        {/* More Offers You May Like */}
        {relatedOffers.length > 0 && (
          <section className="pt-8 border-t" style={{ borderColor: '#E1DDD1' }}>
            <div className="flex items-center justify-between mb-6">
              <h3
                className="text-xl sm:text-2xl font-black"
                style={{ fontFamily: 'Playfair Display, serif', color: '#263D32' }}
              >
                More offers you may like
              </h3>
              <Link
                href="/offers"
                className="text-xs sm:text-sm font-bold hover:underline"
                style={{ color: '#526B57' }}
              >
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {relatedOffers.map((item) => (
                <RelatedOfferCard key={item.id} offer={item} now={now} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function CountdownTile({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="p-3 sm:p-4 rounded-xl border flex flex-col items-center justify-center bg-[#F4F1E6]/40"
      style={{ borderColor: '#E1DDD1' }}
    >
      <span
        className="font-mono font-black text-2xl sm:text-4xl tracking-tight leading-none"
        style={{ color: '#263D32' }}
      >
        {value}
      </span>
      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#526B57] mt-1.5">
        {label}
      </span>
    </div>
  )
}

function RelatedOfferCard({ offer, now }: { offer: Offer; now: Date | null }) {
  const isHydrated = now !== null
  const expiryDate = isHydrated ? resolveExpiry(offer, now) : null
  const formattedExpiry = expiryDate ? formatExpiry(expiryDate) : ''

  return (
    <Link
      href={`/offers/${offer.id}`}
      className="rounded-2xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C6A96B]"
      style={{ borderColor: '#E1DDD1' }}
    >
      <div
        className="p-4 text-white"
        style={{
          background: 'linear-gradient(135deg, #263D32 0%, #526B57 100%)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">{offer.emoji}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
            {offer.categories[0]}
          </span>
        </div>
        <h4
          className="text-sm font-bold line-clamp-2 leading-snug group-hover:text-[#F4F1E6] transition-colors"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {offer.title}
        </h4>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <p className="text-xs text-[#526B57] line-clamp-2 leading-relaxed">
          {offer.description}
        </p>

        {offer.code && (
          <div
            className="py-1 px-2.5 rounded-md border border-dashed bg-[#F4F1E6]/70 text-center font-mono text-xs font-black text-[#263D32]"
            style={{ borderColor: '#C6A96B' }}
          >
            {offer.code}
          </div>
        )}

        <div className="pt-2 border-t text-[11px] text-[#526B57] flex items-center justify-between min-h-[28px]" style={{ borderColor: '#E1DDD1' }}>
          <span>{isHydrated && formattedExpiry ? `Expires ${formattedExpiry}` : 'Checking validity...'}</span>
          <span className="font-bold text-[#263D32] group-hover:translate-x-0.5 transition-transform">→</span>
        </div>
      </div>
    </Link>
  )
}
