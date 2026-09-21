'use client'

import React, { useState, useEffect } from 'react'
import { OfferCategory } from '@/lib/offersData'

/**
 * Custom hook that returns current time Date object.
 * Returns null on initial SSR / mount render to ensure 0 hydration mismatch.
 * Updates at the specified interval in milliseconds.
 */
export function useNow(intervalMs: number = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => {
      setNow(new Date())
    }, intervalMs)
    return () => clearInterval(interval)
  }, [intervalMs])

  return now
}

export const CATEGORY_EMOJIS: Record<OfferCategory, string> = {
  Flights: '✈️',
  Hotels: '🏨',
  Holidays: '🏖️',
  Homestays: '🏡',
  Buses: '🚌',
  Cabs: '🚕',
  'Special Offers': '🎁',
}

export const ALL_CATEGORIES: OfferCategory[] = [
  'Flights',
  'Hotels',
  'Holidays',
  'Homestays',
  'Buses',
  'Cabs',
  'Special Offers',
]

interface CopyCodeButtonProps {
  code: string
  className?: string
  variant?: 'inline' | 'large'
}

export function CopyCodeButton({
  code,
  className = '',
  variant = 'inline',
}: CopyCodeButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    let success = false
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code)
        success = true
      }
    } catch {
      // Fallback below
    }

    if (!success && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = code
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        success = document.execCommand('copy')
        document.body.removeChild(textarea)
      } catch (err) {
        console.error('Fallback copy failed', err)
      }
    }

    if (success) {
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 1800)
    }
  }

  if (variant === 'large') {
    return (
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? `Copied promo code ${code}` : `Copy promo code ${code}`}
        className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
        style={
          copied
            ? { backgroundColor: '#263D32', color: '#F4F1E6' }
            : { backgroundColor: '#C6A96B', color: '#263D32' }
        }
      >
        {copied ? (
          <>
            <svg
              className="w-4 h-4 text-[#F4F1E6]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>Copied</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4 text-[#263D32]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>Copy Code</span>
          </>
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? `Copied code ${code}` : `Copy coupon code ${code}`}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C6A96B] ${className}`}
      style={
        copied
          ? { backgroundColor: '#263D32', color: '#F4F1E6' }
          : { backgroundColor: '#C6A96B', color: '#263D32' }
      }
    >
      {copied ? (
        <>
          <svg
            className="w-3.5 h-3.5 text-[#F4F1E6]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>Copied</span>
        </>
      ) : (
        <>
          <svg
            className="w-3.5 h-3.5 text-[#263D32]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  )
}
