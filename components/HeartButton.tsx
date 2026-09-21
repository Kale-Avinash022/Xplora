'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ItineraryResponse } from '@/lib/types'
import { useWishlist } from '@/lib/useWishlist'

interface HeartButtonProps {
  plan: ItineraryResponse | any | null
  size?: number
  className?: string
}

export function HeartButton({ plan, size = 22, className = '' }: HeartButtonProps) {
  const { isSaved, toggle, isFull } = useWishlist()
  const [popping, setPopping] = useState(false)
  const [toast, setToast] = useState<{ message: string; showLink: boolean } | null>(null)
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  // The heart must be disabled and hidden while plan is null
  if (!plan) return null

  const saved = isSaved(plan)

  const showToast = (message: string, showLink = true) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast({ message, showLink })
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null)
    }, 2500)
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    // Trigger scale pop animation
    setPopping(true)
    setTimeout(() => setPopping(false), 300)

    if (!saved && isFull) {
      showToast('Wishlist is full. Remove a trip to add another.', false)
      return
    }

    const wasAdded = toggle(plan)
    if (wasAdded) {
      showToast('Added to Wishlist', true)
    } else {
      showToast('Removed from Wishlist', true)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
        className={`relative inline-flex items-center justify-center p-2 rounded-full transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C6A96B] focus:ring-offset-1 select-none hover:bg-black/5 dark:hover:bg-white/10 ${className}`}
        style={{
          transform: popping ? 'scale(1.28)' : 'scale(1)',
          transition: 'transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={saved ? '#C0463A' : 'none'}
          stroke={saved ? '#C0463A' : 'currentColor'}
          strokeWidth={saved ? '0' : '2'}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-colors duration-200"
          style={{
            filter: saved ? 'drop-shadow(0 2px 4px rgba(192, 70, 58, 0.35))' : 'none',
          }}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      {/* Floating Bottom Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200"
          style={{
            backgroundColor: '#263D32',
            color: '#F4F1E6',
            borderColor: '#C6A96B',
          }}
        >
          <span className="text-base">{saved ? '❤️' : '🤍'}</span>
          <span>{toast.message}</span>
          {toast.showLink && (
            <Link
              href="/wishlist"
              className="ml-2 px-2.5 py-1 rounded-lg text-xs font-bold transition-opacity hover:opacity-90 underline underline-offset-2"
              style={{
                backgroundColor: '#C6A96B',
                color: '#263D32',
                textDecoration: 'none',
              }}
            >
              View wishlist →
            </Link>
          )}
        </div>
      )}
    </>
  )
}
