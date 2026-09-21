'use client'

import React, { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SiteHeader } from '@/components/SiteHeader'
import { WishlistItem } from '@/lib/types'
import { useWishlist } from '@/lib/useWishlist'
import { slug } from '@/lib/wishlist'
import { HeartButton } from '@/components/HeartButton'
import { WishlistItineraryModal } from '@/components/WishlistItineraryModal'

type SortOption =
  | 'newest'
  | 'budget-asc'
  | 'budget-desc'
  | 'duration-asc'
  | 'duration-desc'

export default function WishlistPage() {
  const router = useRouter()
  const { items, count, remove, toggle, clear, ready } = useWishlist()

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<any | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Undo Toast state
  const [undoItem, setUndoItem] = useState<WishlistItem | null>(null)
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle removing with undo option
  const handleRemoveWithUndo = (item: WishlistItem) => {
    remove(item.itemKey)
    setUndoItem(item)

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    undoTimeoutRef.current = setTimeout(() => {
      setUndoItem(null)
    }, 5000)
  }

  const handleUndo = () => {
    if (undoItem) {
      toggle(undoItem.plan)
      setUndoItem(null)
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    }
  }

  // Open in planner: store in sessionStorage and redirect to home page
  const handleOpenInPlanner = (item: WishlistItem) => {
    try {
      sessionStorage.setItem('xplora_open_plan', JSON.stringify(item.plan))
      router.push('/')
    } catch (err) {
      console.error('Failed to set sessionStorage plan:', err)
      router.push('/')
    }
  }

  // Filter & Sort
  const processedItems = useMemo(() => {
    let result = [...items]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (item) =>
          item.destination.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q)
      )
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'budget-asc':
          return (a.totalBudget || 0) - (b.totalBudget || 0)
        case 'budget-desc':
          return (b.totalBudget || 0) - (a.totalBudget || 0)
        case 'duration-asc':
          return (a.durationDays || 0) - (b.durationDays || 0)
        case 'duration-desc':
          return (b.durationDays || 0) - (a.durationDays || 0)
        case 'newest':
        default: {
          const dateA = new Date(a.savedAt || 0).getTime()
          const dateB = new Date(b.savedAt || 0).getTime()
          return dateB - dateA
        }
      }
    })

    return result
  }, [items, searchQuery, sortBy])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F1E6', color: '#292A25' }}>
      {/* Header */}
      <SiteHeader />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2 bg-white/70 border border-[#E1DDD1] text-[#526B57]">
              <span>❤️ Your Saved Itineraries</span>
            </div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight"
              style={{ fontFamily: 'Playfair Display, serif', color: '#263D32' }}
            >
              Your wishlist
            </h1>
            <p className="mt-2 text-base text-[#526B57]">
              {ready ? `${count} saved ${count === 1 ? 'trip' : 'trips'}` : 'Loading your saved trips...'}
            </p>
          </div>

          {/* Clear All Button */}
          {count > 0 && (
            <div className="flex items-center gap-3">
              {showClearConfirm ? (
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-red-300 shadow-sm animate-in fade-in">
                  <span className="text-xs font-bold text-red-600 px-2">Clear all trips?</span>
                  <button
                    type="button"
                    onClick={() => {
                      clear()
                      setShowClearConfirm(false)
                    }}
                    className="px-3 py-1 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition cursor-pointer"
                  >
                    Yes, clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1 text-xs font-bold text-gray-600 hover:text-black rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-red-200 text-red-700 bg-white hover:bg-red-50 transition shadow-2xs cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filter Controls Row */}
        {count > 0 && (
          <section className="bg-white rounded-2xl p-4 border shadow-xs mb-8" style={{ borderColor: '#E1DDD1' }}>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Search Box */}
              <div className="relative flex-1 w-full">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by destination or title..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border bg-gray-50/50 text-[#292A25] focus:outline-none focus:ring-2 focus:ring-[#C6A96B] transition"
                  style={{ borderColor: '#E1DDD1' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Sort Select */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-[#526B57] shrink-0">
                  Sort by:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full sm:w-auto px-3 py-2 text-sm font-semibold rounded-xl border bg-white text-[#263D32] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#C6A96B] cursor-pointer"
                  style={{ borderColor: '#E1DDD1' }}
                >
                  <option value="newest">Newest first</option>
                  <option value="budget-asc">Budget: Low to High</option>
                  <option value="budget-desc">Budget: High to Low</option>
                  <option value="duration-asc">Duration: Shortest trip</option>
                  <option value="duration-desc">Duration: Longest trip</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* Content: Cards Grid or Empty State */}
        {count === 0 ? (
          <div
            className="text-center py-20 px-6 bg-white rounded-3xl border shadow-sm max-w-2xl mx-auto"
            style={{ borderColor: '#E1DDD1' }}
          >
            <div className="w-20 h-20 rounded-full bg-[#F4F1E6] flex items-center justify-center text-4xl mx-auto mb-4 border border-[#E1DDD1]">
              🤍
            </div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: 'Playfair Display, serif', color: '#263D32' }}
            >
              No saved trips yet
            </h2>
            <p className="text-sm text-[#526B57] max-w-md mx-auto mb-8 leading-relaxed">
              Tap the heart icon on any generated AI itinerary to save it here for later. Your wishlist stays stored across devices and logins.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-md transition-all duration-150 hover:opacity-95 active:scale-[0.99]"
              style={{ backgroundColor: '#263D32', color: '#F4F1E6' }}
            >
              <span>🚀</span>
              <span>Generate a trip</span>
            </Link>
          </div>
        ) : processedItems.length === 0 ? (
          <div
            className="text-center py-16 px-6 bg-white rounded-2xl border"
            style={{ borderColor: '#E1DDD1' }}
          >
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-lg font-bold text-[#263D32] mb-1">No matching trips found</h3>
            <p className="text-xs text-[#526B57] mb-4">
              We couldn&apos;t find any saved trip matching &quot;{searchQuery}&quot;.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 text-xs font-bold rounded-lg border bg-white text-[#263D32] shadow-2xs hover:bg-gray-50"
              style={{ borderColor: '#E1DDD1' }}
            >
              Clear search filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedItems.map((item) => (
              <WishlistCard
                key={item.itemKey}
                item={item}
                onView={() => setSelectedPlanForModal(item.plan)}
                onOpenPlanner={() => handleOpenInPlanner(item)}
                onRemove={() => handleRemoveWithUndo(item)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Undo Toast Notification */}
      {undoItem && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold animate-in fade-in slide-in-from-bottom-4 duration-200"
          style={{
            backgroundColor: '#263D32',
            color: '#F4F1E6',
            borderColor: '#C6A96B',
          }}
        >
          <span>Removed &quot;{undoItem.title}&quot; from wishlist</span>
          <button
            type="button"
            onClick={handleUndo}
            className="px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase transition hover:opacity-90 cursor-pointer"
            style={{
              backgroundColor: '#C6A96B',
              color: '#263D32',
            }}
          >
            Undo
          </button>
        </div>
      )}

      {/* View Itinerary Modal */}
      <WishlistItineraryModal
        plan={selectedPlanForModal}
        isOpen={Boolean(selectedPlanForModal)}
        onClose={() => setSelectedPlanForModal(null)}
      />
    </div>
  )
}

interface WishlistCardProps {
  item: WishlistItem
  onView: () => void
  onOpenPlanner: () => void
  onRemove: () => void
}

function WishlistCard({
  item,
  onView,
  onOpenPlanner,
  onRemove,
}: WishlistCardProps) {
  const destSlug = slug(item.destination)
  const [imageSrc, setImageSrc] = useState(`/images/${destSlug}.jpeg`)

  const formattedDate = useMemo(() => {
    try {
      return new Date(item.savedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }, [item.savedAt])

  return (
    <div
      className="rounded-2xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
      style={{ borderColor: '#E1DDD1' }}
    >
      {/* Top Image + Badges Container */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        <img
          src={imageSrc}
          alt={item.destination}
          onError={() =>
            setImageSrc(
              'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80'
            )
          }
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top-Right Heart Button */}
        <div className="absolute top-3 right-3 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-md">
          <HeartButton plan={item.plan} size={20} />
        </div>

        {/* Bottom overlay text */}
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#263D32]/80 backdrop-blur-xs text-[#F4F1E6]">
            📍 {item.destination}
          </span>
          <h3
            className="text-lg font-bold leading-tight mt-1 line-clamp-1"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {item.title}
          </h3>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#526B57]/10 text-[#263D32]">
              ⏱️ {item.durationDays} Days
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#526B57]/10 text-[#263D32]">
              🎯 {item.travelStyle}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-[#263D32] bg-[#C6A96B]/25">
              💰 ₹{item.totalBudget?.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Saved Date */}
          <p className="text-[11px] text-gray-500">
            Saved on {formattedDate}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t" style={{ borderColor: '#E1DDD1' }}>
          <button
            type="button"
            onClick={onView}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-[#F4F1E6] hover:bg-[#E1DDD1] text-[#263D32] transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>👁️</span>
            <span>View itinerary</span>
          </button>

          <button
            type="button"
            onClick={onOpenPlanner}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white transition hover:opacity-95 shadow-xs flex items-center justify-center gap-1 cursor-pointer"
            style={{ backgroundColor: '#263D32' }}
          >
            <span>🚀</span>
            <span>Open in planner</span>
          </button>
        </div>
      </div>
    </div>
  )
}
