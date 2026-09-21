'use client'

import React, { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ItineraryResponse, DayPlan, Activity } from '@/lib/types'
import { exportItineraryToPDF } from '@/lib/exportUtils'

interface WishlistItineraryModalProps {
  plan: ItineraryResponse | null
  isOpen: boolean
  onClose: () => void
}

export function WishlistItineraryModal({
  plan,
  isOpen,
  onClose,
}: WishlistItineraryModalProps) {
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  // Escape key listener & focus management
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    // Focus close button on mount
    setTimeout(() => closeBtnRef.current?.focus(), 50)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !plan) return null

  const handleOpenInPlanner = () => {
    try {
      sessionStorage.setItem('xplora_open_plan', JSON.stringify(plan))
      router.push('/')
      onClose()
    } catch (err) {
      console.error('Failed to set session plan:', err)
      router.push('/')
    }
  }

  const handleExportPDF = () => {
    exportItineraryToPDF(plan)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wishlist-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        style={{ borderColor: '#E1DDD1' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-6 text-white flex justify-between items-start shrink-0 relative"
          style={{
            background: 'linear-gradient(135deg, #263D32 0%, #526B57 100%)',
          }}
        >
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white mb-2 backdrop-blur-xs">
              <span>📍 {plan.destination}</span>
              <span>•</span>
              <span>{plan.durationDays} Days</span>
              <span>•</span>
              <span>{plan.travelStyle}</span>
            </div>
            <h2
              id="wishlist-modal-title"
              className="text-2xl sm:text-3xl font-black tracking-tight"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {plan.title}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 mt-1">
              Estimated Budget: ₹{plan.totalBudget?.toLocaleString('en-IN')} {plan.currency || 'INR'}
            </p>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition text-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-white shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Content Body: Day-by-Day Plan */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          <h3
            className="text-lg sm:text-xl font-bold text-[#263D32] dark:text-white flex items-center gap-2"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            <span>🗓️</span>
            <span>Day-by-Day Itinerary Details</span>
          </h3>

          {plan.dayPlans && plan.dayPlans.length > 0 ? (
            <div className="space-y-6">
              {plan.dayPlans.map((dp: DayPlan) => (
                <div
                  key={dp.dayNumber}
                  className="rounded-2xl border p-5 sm:p-6 bg-[#F4F1E6]/30 dark:bg-slate-800/50 shadow-xs"
                  style={{ borderColor: '#E1DDD1' }}
                >
                  <div
                    className="flex items-center justify-between pb-3 mb-4 border-b flex-wrap gap-2"
                    style={{ borderColor: '#E1DDD1' }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white"
                        style={{ backgroundColor: '#263D32' }}
                      >
                        {dp.dayNumber}
                      </span>
                      <h4 className="text-base font-bold text-[#263D32] dark:text-white">
                        Day {dp.dayNumber}: {dp.summary}
                      </h4>
                    </div>

                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-[#526B57]/10 text-[#526B57]">
                      {dp.activities?.length || 0} Activities
                    </span>
                  </div>

                  {/* Activities list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dp.activities?.map((act: Activity, aIdx: number) => (
                      <div
                        key={act.id || aIdx}
                        className="p-3.5 rounded-xl border bg-white dark:bg-slate-800 flex flex-col justify-between shadow-2xs"
                        style={{ borderColor: '#E1DDD1' }}
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                            <span className="text-[#526B57]">{act.timeSlot}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold">
                              {act.category}
                            </span>
                          </div>
                          <h5 className="text-sm font-bold text-[#263D32] dark:text-white mb-1">
                            {act.title}
                          </h5>
                          {act.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                              {act.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-2.5 pt-2 border-t flex items-center justify-between text-[11px] text-gray-500" style={{ borderColor: '#E1DDD1' }}>
                          <span>📍 {act.location || plan.destination}</span>
                          <span className="font-bold text-[#263D32] dark:text-white">
                            {act.cost > 0 ? `₹${act.cost.toLocaleString('en-IN')}` : 'Free / Included'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No day-by-day activities available for this itinerary.</p>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-800/80 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0"
          style={{ borderColor: '#E1DDD1' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-black transition order-3 sm:order-1 cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={handleExportPDF}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-700 border transition hover:bg-gray-100 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ borderColor: '#E1DDD1', color: '#263D32' }}
            >
              <span>📄</span>
              <span>Export PDF</span>
            </button>

            <button
              type="button"
              onClick={handleOpenInPlanner}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-md hover:opacity-95 flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: '#263D32' }}
            >
              <span>🚀</span>
              <span>Open in Planner</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
