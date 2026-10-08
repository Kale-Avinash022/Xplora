'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ActivityCard } from '@/components/ActivityCard'

// ─── Interactive Hero Heading Component (Task B) ──────────────────────────────
interface FeatureItem {
  id: string
  phrase: string
  tooltip: string
}

const HERO_FEATURES: FeatureItem[] = [
  {
    id: 'weather',
    phrase: 'real-time weather forecasts',
    tooltip: 'Live forecasts are checked for every day of your trip. If rain is likely, outdoor plans are swapped for indoor ones.',
  },
  {
    id: 'flights',
    phrase: 'verified flight options',
    tooltip: 'Flight options are fetched live from connected services, with prices converted to your currency.',
  },
  {
    id: 'hotels',
    phrase: 'hotel bookings',
    tooltip: 'Hotel options are fetched live and filtered to fit your budget and dates.',
  },
  {
    id: 'mapping',
    phrase: 'interactive visual route mapping',
    tooltip: 'Each day\'s stops are grouped by location so you spend less time in transit, then drawn on a map.',
  },
]

function HeroHeading() {
  const [activeIdx, setActiveIdx] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Auto spotlight: advances every 2.5s when not paused and reduced motion is false
  useEffect(() => {
    if (isPaused || prefersReducedMotion) return
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % HERO_FEATURES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [isPaused, prefersReducedMotion])

  // Close tooltip on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenTooltipId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close tooltip on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenTooltipId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePhraseHover = (id: string, index: number) => {
    setIsPaused(true)
    setActiveIdx(index)
    setOpenTooltipId(id)
  }

  const handlePhraseLeave = () => {
    setIsPaused(false)
    setOpenTooltipId(null)
  }

  const handlePhraseFocus = (id: string, index: number) => {
    setIsPaused(true)
    setActiveIdx(index)
    setOpenTooltipId(id)
  }

  const handlePhraseBlur = () => {
    setIsPaused(false)
    setOpenTooltipId(null)
  }

  const handlePhraseClick = (id: string, index: number) => {
    setActiveIdx(index)
    setOpenTooltipId((prev) => (prev === id ? null : id))
  }

  return (
    <div ref={containerRef} className="text-center mb-8">
      {/* 1. Badge with softly pulsing green dot */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-[#263D32] dark:bg-slate-800 text-white shadow-xs mb-3 border border-white/20 dark:border-slate-700">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>XPLORA Intelligence Engine v2.4</span>
      </div>

      {/* 2. Title with gradient and entrance animation */}
      <h1
        className={`text-4xl md:text-5xl font-extrabold tracking-tight mb-3 ${
          prefersReducedMotion ? '' : 'animate-hero-entrance'
        }`}
        style={{
          fontFamily: 'Playfair Display, serif',
          background: 'linear-gradient(135deg, var(--forest-green, #263D32) 0%, var(--sage-green, #526B57) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Intelligent Itinerary Generator
      </h1>

      {/* 3. Interactive Sentence with Accessible Spotlight & Tooltip */}
      <p
        className="text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed relative"
        style={{ color: 'var(--sage-green, #526B57)' }}
      >
        Architect personalized travel itineraries with{' '}
        {HERO_FEATURES.map((feat, idx) => {
          const isHighlighted = activeIdx === idx
          const isTooltipOpen = openTooltipId === feat.id

          return (
            <span key={feat.id} className="relative inline-block">
              <button
                type="button"
                aria-describedby={isTooltipOpen ? `hero-tooltip-${feat.id}` : undefined}
                aria-expanded={isTooltipOpen}
                onMouseEnter={() => handlePhraseHover(feat.id, idx)}
                onMouseLeave={handlePhraseLeave}
                onFocus={() => handlePhraseFocus(feat.id, idx)}
                onBlur={handlePhraseBlur}
                onClick={() => handlePhraseClick(feat.id, idx)}
                className={`inline font-semibold transition-all duration-300 rounded px-1 -mx-0.5 border-b-2 border-dotted text-inherit text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-1 ${
                  isHighlighted
                    ? 'bg-teal-100/70 dark:bg-teal-900/50 border-teal-700 dark:border-teal-400 text-[#263D32] dark:text-teal-200 shadow-xs'
                    : 'border-[#526B57]/40 dark:border-slate-500 hover:border-teal-700'
                }`}
              >
                {feat.phrase}
              </button>
              {idx < HERO_FEATURES.length - 1 ? (idx === 2 ? ', and ' : ', ') : '.'}

              {/* 5. Tooltip Popover */}
              {isTooltipOpen && (
                <div
                  id={`hero-tooltip-${feat.id}`}
                  role="tooltip"
                  className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 max-w-[calc(100vw-2.5rem)] p-3 rounded-xl bg-[#263D32] dark:bg-slate-900 text-white text-xs font-normal text-center shadow-xl border border-white/20 dark:border-slate-700 animate-in fade-in zoom-in-95 pointer-events-none"
                >
                  <p className="leading-snug">{feat.tooltip}</p>
                  {/* Arrow tip */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#263D32] dark:border-t-slate-900" />
                </div>
              )}
            </span>
          )
        })}
      </p>
    </div>
  )
}
import { WeatherCard } from '@/components/WeatherCard'
import { MyTripsModal } from '@/components/MyTripsModal'
import { FlightHotelResults } from '@/components/FlightHotelResults'
import { TrackTicketModal } from '@/components/TrackTicketModal'
import { AIChatDrawer } from '@/components/AIChatDrawer'
import { InteractiveMap } from '@/components/InteractiveMap'
import { FlightOption } from '@/app/api/flights/route'
import { HotelOption } from '@/app/api/hotels/route'
import { BookingArea, TransportMode, CabinClass, TravelSearchEnvelope, StayOption, TripProposal, TrainOption, BusOption, TrackedTicket, TrackedHotelBooking } from '@/lib/types'
import { validateFlightQuery, validateStayQuery, validateTrainQuery, validateBusQuery, getTodayIsoDate } from '@/lib/travel/validation'
import { exportItineraryToPDF, exportToGoogleCalendar, exportToICS } from '@/lib/exportUtils'
import { SUPPORTED_CURRENCIES, convertAmount } from '@/lib/currencyUtils'
import { ExpenseTracker } from '@/components/ExpenseTracker'
import { estimateTripCost } from '@/lib/costEstimator'
import { WeatherSwapBanner } from '@/components/WeatherSwapBanner'
import { SiteHeader } from '@/components/SiteHeader'
import { HeartButton } from '@/components/HeartButton'
import { useWishlist } from '@/lib/useWishlist'

// Destination Card Component for Continuous Marquee
function DestinationCard({ 
  name, 
  location, 
  image, 
  onSelect 
}: { 
  name: string; 
  location: string; 
  image: string; 
  onSelect: (destinationName: string) => void;
}) {
  const [imageSrc, setImageSrc] = useState(image)

  return (
    <div 
      className="marquee-card cursor-pointer group"
      onClick={() => onSelect(name)}
    >
      <div 
        className="relative rounded-xl overflow-hidden shadow-lg transition-all duration-300 ease-in-out"
        style={{ 
          width: '280px',
          height: '320px',
          border: '1px solid #E1DDD1',
          flexShrink: 0,
          boxShadow: '0 12px 30px rgba(38, 61, 50, 0.10)',
          transform: 'translateY(0)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-6px) scale(1.03)'
          e.currentTarget.style.boxShadow = '0 20px 36px rgba(38, 61, 50, 0.22)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(38, 61, 50, 0.10)'
        }}
      >
        <img 
          src={imageSrc} 
          alt={name}
          onError={() => setImageSrc('https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80')}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            display: 'block',
            transform: 'scale(1.02)',
            transition: 'transform 0.5s ease'
          }}
        />
        <div 
          style={{ 
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(38, 61, 50, 0.92) 0%, rgba(38, 61, 50, 0.35) 50%, transparent 100%)'
          }}
        />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px' }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: 'white', 
            marginBottom: '4px',
            fontFamily: 'Playfair Display, serif'
          }}>
            {name}
          </h3>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>{location}</p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 group-hover:bg-white/35 backdrop-blur-md text-white text-xs font-bold transition border border-white/30">
            🚀 Click to Plan {name} Trip ➔
          </div>
        </div>
      </div>
    </div>
  )
}


export default function Home() {
  const [activeTab, setActiveTab] = useState('FLIGHTS')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [departure, setDeparture] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [travellers, setTravellers] = useState('1')
  const [classType, setClassType] = useState('Economy')
  const [tripInput, setTripInput] = useState('')
  const [homeCity, setHomeCity] = useState('')
  // AI Itinerary Generator State
  const [aiTravelDate, setAiTravelDate] = useState(() => new Date().toISOString().split('T')[0])
  const [aiReturnDate, setAiReturnDate] = useState('')
  const [showFromDropdown, setShowFromDropdown] = useState(false)
  const [showToDropdown, setShowToDropdown] = useState(false)
  const [showHomeCityDropdown, setShowHomeCityDropdown] = useState(false)
  // Phase 4: Booking Area & Transport Modes (Steps 32, 33, 34)
  const [bookingArea, setBookingArea] = useState<BookingArea>('TRAVEL')
  const [transportMode, setTransportMode] = useState<TransportMode>('FLIGHTS')

  // Step 35: Isolated React State for Flights
  const [flightOrigin, setFlightOrigin] = useState('')
  const [flightDestination, setFlightDestination] = useState('')
  const [flightOutboundDate, setFlightOutboundDate] = useState(() => getTodayIsoDate())
  const [flightReturnDate, setFlightReturnDate] = useState('')
  const [flightTravelers, setFlightTravelers] = useState(1)
  const [flightCabinClass, setFlightCabinClass] = useState<CabinClass>('Economy')
  const [flightEnvelope, setFlightEnvelope] = useState<TravelSearchEnvelope<FlightOption> | null>(null)
  const [flightIsLoading, setFlightIsLoading] = useState(false)
  const [flightErrors, setFlightErrors] = useState<Record<string, string>>({})
  const flightRequestId = useRef(0)
  const flightAbortRef = useRef<AbortController | null>(null)
  const [showFlightOriginDropdown, setShowFlightOriginDropdown] = useState(false)
  const [showFlightDestDropdown, setShowFlightDestDropdown] = useState(false)

  // Step 36: Isolated React State for Stays
  const [stayDestination, setStayDestination] = useState('')
  const [stayCheckIn, setStayCheckIn] = useState(() => getTodayIsoDate())
  const [stayCheckOut, setStayCheckOut] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [stayGuests, setStayGuests] = useState(2)
  const [stayRooms, setStayRooms] = useState(1)
  const [stayEnvelope, setStayEnvelope] = useState<TravelSearchEnvelope<StayOption> | null>(null)
  const [stayIsLoading, setStayIsLoading] = useState(false)
  const [stayErrors, setStayErrors] = useState<Record<string, string>>({})
  const stayRequestId = useRef(0)
  const stayAbortRef = useRef<AbortController | null>(null)
  const [showStayDestDropdown, setShowStayDestDropdown] = useState(false)

  // Step 38: Isolated React State for Trains
  const [trainOrigin, setTrainOrigin] = useState('')
  const [trainDestination, setTrainDestination] = useState('')
  const [trainDate, setTrainDate] = useState(() => getTodayIsoDate())
  const [trainTravelers, setTrainTravelers] = useState(1)
  const [trainClass, setTrainClass] = useState('ALL')
  const [trainQuota, setTrainQuota] = useState('GN')
  const [trainEnvelope, setTrainEnvelope] = useState<TravelSearchEnvelope<TrainOption> | null>(null)
  const [trainIsLoading, setTrainIsLoading] = useState(false)
  const [trainErrors, setTrainErrors] = useState<Record<string, string>>({})
  const trainRequestId = useRef(0)
  const trainAbortRef = useRef<AbortController | null>(null)
  const [showTrainOriginDropdown, setShowTrainOriginDropdown] = useState(false)
  const [showTrainDestDropdown, setShowTrainDestDropdown] = useState(false)

  // Isolated React State for Buses (Triangle Distance + ₹13/km + redBus redirect)
  const [busOrigin, setBusOrigin] = useState('')
  const [busDestination, setBusDestination] = useState('')
  const [busDate, setBusDate] = useState(() => getTodayIsoDate())
  const [busTravelers, setBusTravelers] = useState(1)
  const [busCategory, setBusCategory] = useState<'ALL' | 'TRAVELS' | 'LOCAL'>('ALL')
  const [busEnvelope, setBusEnvelope] = useState<TravelSearchEnvelope<BusOption> | null>(null)
  const [busIsLoading, setBusIsLoading] = useState(false)
  const [busErrors, setBusErrors] = useState<Record<string, string>>({})
  const busRequestId = useRef(0)
  const busAbortRef = useRef<AbortController | null>(null)
  const [showBusOriginDropdown, setShowBusOriginDropdown] = useState(false)
  const [showBusDestDropdown, setShowBusDestDropdown] = useState(false)
  const [busOriginSuggestions, setBusOriginSuggestions] = useState<any[]>([])
  const [busDestSuggestions, setBusDestSuggestions] = useState<any[]>([])
  const busOriginRef = useRef<HTMLDivElement>(null)
  const busDestRef = useRef<HTMLDivElement>(null)

  // Close bus dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (busOriginRef.current && !busOriginRef.current.contains(e.target as Node)) {
        setShowBusOriginDropdown(false)
      }
      if (busDestRef.current && !busDestRef.current.contains(e.target as Node)) {
        setShowBusDestDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Auth User Session State
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; image?: string | null } | null>(null)

  // AI Itinerary Generator State
  const [aiDestination, setAiDestination] = useState('')
  const [aiDuration, setAiDuration] = useState(3)
  const [aiBudget, setAiBudget] = useState(25000)
  const [aiTravelStyle, setAiTravelStyle] = useState('Adventure')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<any>(null)
  const [planErrorMsg, setPlanErrorMsg] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null)
  const [showMyTripsModal, setShowMyTripsModal] = useState(false)

  // Service Tab Search State
  const [flightsResults, setFlightsResults] = useState<FlightOption[]>([])
  const [hotelsResults, setHotelsResults] = useState<HotelOption[]>([])
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState('INR')

  // Screen 2 & NLP Query State
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [parsedDetailsData, setParsedDetailsData] = useState<any>(null)

  // Screen 1 Form Validation State
  const [formErrors, setFormErrors] = useState<{
    destination?: string
    travelDate?: string
    duration?: string
    budget?: string
  }>({})
  const [chatProposalNotice, setChatProposalNotice] = useState<string | null>(null)
  const [highlightPlanner, setHighlightPlanner] = useState(false)

  // Track Ticket & Hotel State (Phase 7 Ticket & Hotel Tracking)
  const [showTrackTicketModal, setShowTrackTicketModal] = useState(false)
  const [trackModalSection, setTrackModalSection] = useState<'TRAVEL' | 'HOTEL'>('TRAVEL')
  const [trackedTickets, setTrackedTickets] = useState<TrackedTicket[]>([])
  const [trackedHotels, setTrackedHotels] = useState<TrackedHotelBooking[]>([])
  const [ticketToast, setTicketToast] = useState<{ message: string; type: string } | null>(null)

  // Load tracked tickets and hotels from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTickets = localStorage.getItem('xplora_tracked_tickets')
        if (savedTickets) {
          const parsedTickets = JSON.parse(savedTickets)
          if (Array.isArray(parsedTickets)) {
            setTrackedTickets(parsedTickets)
          }
        }

        const savedHotels = localStorage.getItem('xplora_tracked_hotels')
        if (savedHotels) {
          const parsedHotels = JSON.parse(savedHotels)
          if (Array.isArray(parsedHotels)) {
            setTrackedHotels(parsedHotels)
          }
        }
      } catch (err) {
        console.error('Failed to parse tracked bookings from storage:', err)
      }
    }
  }, [])

  // Handlers for Tracked Tickets
  const handleTrackTicket = useCallback((ticket: TrackedTicket) => {
    setTrackedTickets((prev) => {
      const filtered = prev.filter((t) => t.id !== ticket.id && t.pnrOrBookingRef !== ticket.pnrOrBookingRef)
      const updated = [ticket, ...filtered]
      if (typeof window !== 'undefined') {
        localStorage.setItem('xplora_tracked_tickets', JSON.stringify(updated))
      }
      return updated
    })

    const typeLabel = ticket.type === 'TRAIN' ? '🚆 Train Ticket' : ticket.type === 'FLIGHT' ? '✈️ Flight Ticket' : '🚌 Bus Ticket'
    setTicketToast({
      message: `${typeLabel} added to Track Bookings! (${ticket.title})`,
      type: ticket.type,
    })

    setTimeout(() => {
      setTicketToast((current) => (current?.message.includes(ticket.title) ? null : current))
    }, 6000)
  }, [])

  const handleRemoveTicket = useCallback((id: string) => {
    setTrackedTickets((prev) => {
      const updated = prev.filter((t) => t.id !== id)
      if (typeof window !== 'undefined') {
        localStorage.setItem('xplora_tracked_tickets', JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  const handleUpdatePnr = useCallback((id: string, newPnr: string) => {
    setTrackedTickets((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, pnrOrBookingRef: newPnr } : t))
      if (typeof window !== 'undefined') {
        localStorage.setItem('xplora_tracked_tickets', JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  const handleAddManualTicket = useCallback((ticket: TrackedTicket) => {
    setTrackedTickets((prev) => {
      const updated = [ticket, ...prev]
      if (typeof window !== 'undefined') {
        localStorage.setItem('xplora_tracked_tickets', JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  // Handlers for Tracked Hotels (Booking.com Handoff & Manual Tracking)
  const handleTrackHotel = useCallback((hotel: TrackedHotelBooking) => {
    setTrackedHotels((prev) => {
      const filtered = prev.filter((h) => h.id !== hotel.id && h.bookingRef !== hotel.bookingRef)
      const updated = [hotel, ...filtered]
      if (typeof window !== 'undefined') {
        localStorage.setItem('xplora_tracked_hotels', JSON.stringify(updated))
      }
      return updated
    })

    setTicketToast({
      message: `🏨 Hotel booking tracked! (${hotel.hotelName})`,
      type: 'HOTEL',
    })

    setTimeout(() => {
      setTicketToast((current) => (current?.message.includes(hotel.hotelName) ? null : current))
    }, 6000)
  }, [])

  const handleRemoveHotel = useCallback((id: string) => {
    setTrackedHotels((prev) => {
      const updated = prev.filter((h) => h.id !== id)
      if (typeof window !== 'undefined') {
        localStorage.setItem('xplora_tracked_hotels', JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  const handleUpdateHotelRef = useCallback((id: string, newRef: string) => {
    setTrackedHotels((prev) => {
      const updated = prev.map((h) => (h.id === id ? { ...h, bookingRef: newRef } : h))
      if (typeof window !== 'undefined') {
        localStorage.setItem('xplora_tracked_hotels', JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  const handleAddManualHotel = useCallback((hotel: TrackedHotelBooking) => {
    setTrackedHotels((prev) => {
      const updated = [hotel, ...prev]
      if (typeof window !== 'undefined') {
        localStorage.setItem('xplora_tracked_hotels', JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  useEffect(() => {
    // 1. Immediate local session load
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('xplora_user') : null
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr))
      } catch (e) {
        console.error('Failed to parse user session:', e)
      }
    }

    // 2. Fetch fresh user data from server (reads DB, refreshes image even 100+ days later)
    fetch('/api/user/me')
      .then((res) => {
        if (res.ok) return res.json()
        return null
      })
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user)
          localStorage.setItem('xplora_user', JSON.stringify(data.user))
        }
      })
      .catch((err) => console.error('Failed to verify session:', err))

    // 3. Restore itinerary from sessionStorage if "Open in planner" was clicked
    if (typeof window !== 'undefined') {
      const openPlanStr = sessionStorage.getItem('xplora_open_plan')
      if (openPlanStr) {
        try {
          const plan = JSON.parse(openPlanStr)
          if (plan) {
            setGeneratedPlan(plan)
            if (plan.destination) setAiDestination(plan.destination)
            if (plan.durationDays) setAiDuration(Number(plan.durationDays))
            if (plan.totalBudget || plan.budget) setAiBudget(Number(plan.totalBudget || plan.budget))
            if (plan.travelStyle) setAiTravelStyle(plan.travelStyle)
            sessionStorage.removeItem('xplora_open_plan')
            setTimeout(() => {
              const el = document.getElementById('generated-itinerary-results')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }, 150)
          }
        } catch (e) {
          console.error('Failed to parse open plan from session:', e)
        }
      }
    }

    // 4. Open My Trips modal if redirected with ?myTrips=true
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('myTrips') === 'true') {
        setShowMyTripsModal(true)
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('xplora_user')
    setCurrentUser(null)
    setSaveSuccess(false)
  }

  const validatePlanInputs = (): boolean => {
    const errors: {
      destination?: string
      travelDate?: string
      duration?: string
      budget?: string
    } = {}

    // 1. Destination is required
    if (!aiDestination || !aiDestination.trim()) {
      errors.destination = 'Destination is required.'
    }

    // 2. Schedule Date cannot be in the past
    if (!aiTravelDate) {
      errors.travelDate = 'Schedule date is required.'
    } else {
      const todayStr = new Date().toISOString().split('T')[0]
      if (aiTravelDate < todayStr) {
        errors.travelDate = 'Date cannot be in the past.'
      }
    }

    // 3. Duration is a whole number from 1 to 30
    const durationNum = Number(aiDuration)
    if (!Number.isInteger(durationNum) || durationNum < 1 || durationNum > 30) {
      errors.duration = 'Duration must be a whole number between 1 and 30.'
    }

    // 4. Budget is a positive number
    const budgetNum = Number(aiBudget)
    if (isNaN(budgetNum) || budgetNum <= 0) {
      errors.budget = 'Max budget must be a positive number.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleGeneratePlan = async (overrideDest?: string, overrideBudget?: number) => {
    // If not overriding programmatically, run form validation
    if (!overrideDest) {
      const isValid = validatePlanInputs()
      if (!isValid) return
    }

    const targetDest = (overrideDest || aiDestination).trim()
    const targetBudget = overrideBudget || Number(aiBudget) || 25000
    const requestedDays = Math.min(Math.max(Math.round(Number(aiDuration)) || 3, 1), 30)
    setIsGenerating(true)
    setGeneratedPlan(null)
    setPlanErrorMsg(null)
    setSaveSuccess(false)
    setAuthErrorMsg(null)
    try {
      const res = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: targetDest,
          durationDays: requestedDays,
          budget: targetBudget,
          travelStyle: aiTravelStyle,
          startDate: aiTravelDate,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setGeneratedPlan(data)
      } else {
        setPlanErrorMsg(data?.error || `We couldn't find verified places for ${targetDest}. Please try again.`)
      }
    } catch (err) {
      console.error('Failed to generate plan:', err)
      setPlanErrorMsg('An unexpected network error occurred while generating the itinerary. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Step 51: Preserve User Selections on Destination Selection
  const handleSelectPopularDestination = (destName: string) => {
    setAiDestination(destName)
    if (formErrors.destination) {
      setFormErrors((prev) => ({ ...prev, destination: undefined }))
    }
    const formElem = document.getElementById('ai-trip-planner')
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' })
    }
    // Preserves existing user choices for budget, travel style, duration, and dates
  }

  // Step 53: Implement Apply Trip Details Callback & Form Scroll
  const handleApplyTripProposal = (proposal: TripProposal) => {
    if (proposal.destination) {
      setAiDestination(proposal.destination)
      setTo(proposal.destination)
    }
    if (proposal.from) setFrom(proposal.from)
    if (proposal.durationDays) setAiDuration(proposal.durationDays)
    if (proposal.budget) setAiBudget(proposal.budget)
    if (proposal.travelStyle) setAiTravelStyle(proposal.travelStyle)
    if (proposal.startDate) setAiTravelDate(proposal.startDate)

    // Clear previous form validation errors
    setFormErrors({})

    // Step 53: Display confirmation notification and highlight updated fields
    setChatProposalNotice('Trip details applied to planner. Review and click Generate to create itinerary.')
    setHighlightPlanner(true)
    setTimeout(() => setHighlightPlanner(false), 3000)

    const formElem = document.getElementById('ai-trip-planner')
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Step 52: Eliminate Autonomous Chat Generation & Searches
  const handleCreateTripFromChat = (params: TripProposal) => {
    handleApplyTripProposal(params)
  }

  const handleConfirmModalSubmit = (confirmed: any) => {
    setShowConfirmModal(false)
    setAiDestination(confirmed.destination)
    setAiTravelDate(confirmed.startDate)
    setAiDuration(confirmed.durationDays)
    setAiBudget(confirmed.budget)
    setAiTravelStyle(confirmed.interests?.[0] || 'Adventure')

    // Trigger verified plan generation for confirmed parameters
    handleGeneratePlan(confirmed.destination, confirmed.budget)
  }

  const handleExecuteActionCommand = (command: 'EXPORT_PDF' | 'SAVE_TRIP' | 'EXPORT_CALENDAR') => {
    if (command === 'EXPORT_PDF' && generatedPlan) {
      exportItineraryToPDF(generatedPlan)
    } else if (command === 'SAVE_TRIP') {
      handleSaveItinerary()
    } else if (command === 'EXPORT_CALENDAR' && generatedPlan) {
      exportToGoogleCalendar(generatedPlan)
    }
  }

  // Step 37 & 41: Dedicated Flight Search with Local Validation and AbortController Protection
  const handleSearchFlights = async () => {
    if (flightAbortRef.current) {
      flightAbortRef.current.abort()
    }
    const controller = new AbortController()
    flightAbortRef.current = controller

    flightRequestId.current += 1
    const currentReqId = flightRequestId.current

    const origin = flightOrigin.trim()
    const destination = flightDestination.trim()
    const outboundDate = flightOutboundDate.trim() || departure.trim() || getTodayIsoDate()
    const returnD = flightReturnDate.trim() || undefined
    const travelers = flightTravelers || Number(travellers) || 1
    const cabin = flightCabinClass || 'Economy'

    const validation = validateFlightQuery({
      origin,
      destination,
      outboundDate,
      returnDate: returnD,
      travelers,
      cabinClass: cabin,
      currency: selectedCurrency,
    })

    if (!validation.isValid) {
      setFlightErrors(validation.errors)
      return
    }

    setFlightErrors({})
    setFlightIsLoading(true)

    try {
      const params = new URLSearchParams({
        origin,
        destination,
        outboundDate,
        travelers: String(travelers),
        cabinClass: cabin,
        currency: selectedCurrency,
      })
      if (returnD) params.set('returnDate', returnD)

      const res = await fetch(`/api/flights?${params.toString()}`, {
        signal: controller.signal,
      })
      const data: TravelSearchEnvelope<FlightOption> = await res.json()

      if (flightRequestId.current === currentReqId) {
        setFlightEnvelope(data)
        setFlightsResults(data.results || (data as any).flights || [])
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Flight search error:', err)
        if (flightRequestId.current === currentReqId) {
          setFlightEnvelope({
            query: { origin, destination, outboundDate, travelers, cabinClass: cabin, currency: selectedCurrency },
            status: 'UNAVAILABLE',
            results: [],
            count: 0,
            notice: 'Unable to reach flight search service. Please check your connection and try again.',
          })
        }
      }
    } finally {
      if (flightRequestId.current === currentReqId) {
        setFlightIsLoading(false)
      }
    }
  }

  // Step 40 & 41: Dedicated Stay Search with Local Validation and AbortController Protection
  const handleSearchStays = async () => {
    if (stayAbortRef.current) {
      stayAbortRef.current.abort()
    }
    const controller = new AbortController()
    stayAbortRef.current = controller

    stayRequestId.current += 1
    const currentReqId = stayRequestId.current

    const destination = stayDestination.trim()
    const checkIn = stayCheckIn.trim() || departure.trim() || getTodayIsoDate()
    let checkOut = stayCheckOut.trim() || returnDate.trim()
    if (!checkOut) {
      const d = new Date(checkIn)
      d.setDate(d.getDate() + 1)
      checkOut = d.toISOString().split('T')[0]
    }
    const guests = stayGuests || Number(travellers) || 2
    const rooms = stayRooms || 1

    const validation = validateStayQuery({
      destination,
      checkIn,
      checkOut,
      guests,
      rooms,
      currency: selectedCurrency,
    })

    if (!validation.isValid) {
      setStayErrors(validation.errors)
      return
    }

    setStayErrors({})
    setStayIsLoading(true)

    try {
      const params = new URLSearchParams({
        destination,
        checkIn,
        checkOut,
        guests: String(guests),
        rooms: String(rooms),
        currency: selectedCurrency,
      })

      const res = await fetch(`/api/hotels?${params.toString()}`, {
        signal: controller.signal,
      })
      const data: TravelSearchEnvelope<StayOption> = await res.json()

      if (stayRequestId.current === currentReqId) {
        setStayEnvelope(data)
        setHotelsResults((data.results as any) || (data as any).hotels || [])
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Stay search error:', err)
        if (stayRequestId.current === currentReqId) {
          setStayEnvelope({
            query: { destination, checkIn, checkOut, guests, rooms, currency: selectedCurrency },
            status: 'UNAVAILABLE',
            results: [],
            count: 0,
            notice: 'Unable to reach accommodations service. Please check your connection and try again.',
          })
        }
      }
    } finally {
      if (stayRequestId.current === currentReqId) {
        setStayIsLoading(false)
      }
    }
  }

  // Step 38 & 41: Dedicated Train Search with Local Validation and AbortController Protection
  const handleSearchTrains = async () => {
    if (trainAbortRef.current) {
      trainAbortRef.current.abort()
    }
    const controller = new AbortController()
    trainAbortRef.current = controller

    trainRequestId.current += 1
    const currentReqId = trainRequestId.current

    const origin = trainOrigin.trim()
    const destination = trainDestination.trim()
    const date = trainDate.trim() || departure.trim() || getTodayIsoDate()
    const quota = trainQuota || 'GN'
    const travelers = trainTravelers || 1
    const trainClassVal = trainClass === 'ALL' ? undefined : trainClass

    const validation = validateTrainQuery({
      origin,
      destination,
      date,
      quota,
      travelers,
      trainClass: trainClassVal,
    })

    if (!validation.isValid) {
      setTrainErrors(validation.errors)
      return
    }

    setTrainErrors({})
    setTrainIsLoading(true)

    try {
      const params = new URLSearchParams({
        origin,
        destination,
        date,
        quota,
        travelers: String(travelers),
      })
      if (trainClassVal) params.set('trainClass', trainClassVal)

      const res = await fetch(`/api/trains?${params.toString()}`, {
        signal: controller.signal,
      })
      const data: TravelSearchEnvelope<TrainOption> = await res.json()

      if (trainRequestId.current === currentReqId) {
        setTrainEnvelope(data)
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Train search error:', err)
        if (trainRequestId.current === currentReqId) {
          setTrainEnvelope({
            query: { origin, destination, date, quota, travelers, trainClass: trainClassVal },
            status: 'UNAVAILABLE',
            results: [],
            count: 0,
            notice: 'Live railway service is temporarily experiencing connectivity issues. Please try again shortly.',
          })
        }
      }
    } finally {
      if (trainRequestId.current === currentReqId) {
        setTrainIsLoading(false)
      }
    }
  }

  const fetchBusSuggestions = async (query: string, field: 'origin' | 'dest') => {
    try {
      const res = await fetch(`/api/buses/cities?q=${encodeURIComponent(query)}&limit=8`)
      if (res.ok) {
        const data = await res.json()
        if (field === 'origin') {
          setBusOriginSuggestions(data.cities || [])
        } else {
          setBusDestSuggestions(data.cities || [])
        }
      }
    } catch {
      // Fallback cleanly
    }
  }

  const handleSearchBuses = async () => {
    if (busAbortRef.current) {
      busAbortRef.current.abort()
    }
    const controller = new AbortController()
    busAbortRef.current = controller
    const currentReqId = ++busRequestId.current

    const origin = busOrigin.trim()
    const destination = busDestination.trim()
    const date = busDate.trim() || getTodayIsoDate()
    const travelers = busTravelers || 1
    const category = busCategory || 'ALL'

    const validation = validateBusQuery({
      origin,
      destination,
      date,
      category,
      travelers,
    })

    if (!validation.isValid) {
      setBusErrors(validation.errors)
      return
    }

    setBusErrors({})
    setBusIsLoading(true)

    try {
      const params = new URLSearchParams({
        origin,
        destination,
        date,
        category,
        travelers: String(travelers),
      })

      const res = await fetch(`/api/buses?${params.toString()}`, {
        signal: controller.signal,
      })
      const data: TravelSearchEnvelope<BusOption> = await res.json()

      if (busRequestId.current === currentReqId) {
        setBusEnvelope(data)
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Bus search error:', err)
        if (busRequestId.current === currentReqId) {
          setBusEnvelope({
            query: { origin, destination, date, category, travelers },
            status: 'UNAVAILABLE',
            results: [],
            count: 0,
            notice: 'Bus route calculation is temporarily experiencing issues. Please try again shortly.',
          })
        }
      }
    } finally {
      if (busRequestId.current === currentReqId) {
        setBusIsLoading(false)
      }
    }
  }

  const handleSearchServices = async () => {
    if (bookingArea === 'STAY') {
      await handleSearchStays()
    } else if (transportMode === 'TRAINS') {
      await handleSearchTrains()
    } else if (transportMode === 'BUSES') {
      await handleSearchBuses()
    } else {
      await handleSearchFlights()
    }
  }

  const handleSaveItinerary = async () => {
    if (!generatedPlan) return
    setAuthErrorMsg(null)

    if (!currentUser) {
      setAuthErrorMsg('⚠️ Account Required: Please log in or sign up to save itineraries to your account.')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/itineraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedPlan.title,
          destination: generatedPlan.destination,
          durationDays: generatedPlan.durationDays,
          budget: generatedPlan.totalBudget,
          currency: generatedPlan.currency,
          travelStyle: generatedPlan.travelStyle,
          dayPlans: generatedPlan.dayPlans,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.itinerary?.id) {
        if (res.status === 401) {
          setAuthErrorMsg('⚠️ Session expired or required. Please log in to save itineraries.')
        } else {
          setAuthErrorMsg(data.error || 'Failed to save itinerary.')
        }
      } else {
        setSaveSuccess(true)
        setTimeout(() => {
          setShowMyTripsModal(true)
        }, 600)
      }
    } catch (err) {
      console.error('Failed to save itinerary:', err)
      setAuthErrorMsg('Unexpected error while saving itinerary.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSelectSavedTrip = (savedTrip: any) => {
    setGeneratedPlan({
      title: savedTrip.title,
      destination: savedTrip.destination,
      durationDays: savedTrip.durationDays,
      totalBudget: savedTrip.budget,
      estimatedCost: savedTrip.budget,
      currency: savedTrip.currency || 'INR',
      travelStyle: savedTrip.travelStyle || 'General',
      weatherPreview: {
        temp: '26°C',
        condition: 'Pleasant',
        recommendation: `Enjoy your trip to ${savedTrip.destination}!`,
        icon: '🌤️',
        packingAdvice: `🎒 Travel Ready — pack light layers and comfortable walking shoes for ${savedTrip.destination}!`,
        packingBadge: '🎒 Travel Ready',
      },
      dayPlans: savedTrip.dayPlans || [],
    })
    setSaveSuccess(true)
  }

  const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
    'Goa', 'Kochi', 'Varanasi', 'Amritsar', 'Udaipur', 'Mysore'
  ]

  const trainStations = [
    { code: 'NDLS', name: 'New Delhi (NDLS)' },
    { code: 'CSMT', name: 'Mumbai CSMT (CSMT)' },
    { code: 'MMCT', name: 'Mumbai Central (MMCT)' },
    { code: 'PUNE', name: 'Pune Junction (PUNE)' },
    { code: 'NGP', name: 'Nagpur Junction (NGP)' },
    { code: 'SBC', name: 'KSR Bengaluru (SBC)' },
    { code: 'MAS', name: 'Chennai Central (MAS)' },
    { code: 'HWH', name: 'Howrah Junction (HWH)' },
    { code: 'ADI', name: 'Ahmedabad Junction (ADI)' },
    { code: 'JP', name: 'Jaipur Junction (JP)' },
    { code: 'SC', name: 'Secunderabad (SC)' },
    { code: 'MAO', name: 'Goa Madgaon (MAO)' },
    { code: 'LKO', name: 'Lucknow Charbagh (LKO)' },
    { code: 'BSB', name: 'Varanasi Junction (BSB)' },
    { code: 'ERS', name: 'Kochi Ernakulam (ERS)' },
    { code: 'CDG', name: 'Chandigarh (CDG)' },
    { code: 'BPL', name: 'Bhopal Junction (BPL)' },
    { code: 'PNBE', name: 'Patna Junction (PNBE)' },
    { code: 'ASR', name: 'Amritsar (ASR)' },
    { code: 'GHY', name: 'Guwahati (GHY)' },
  ]

  const tabs = [
    { id: 'FLIGHTS', icon: '✈️', label: 'Flights' },
    { id: 'HOTELS', icon: '🏨', label: 'Hotels' },
    { id: 'TRAINS', icon: '🚆', label: 'Trains' },
    { id: 'BUSES', icon: '🚌', label: 'Buses' }
  ]

  const destinationSequence = [
    { name: 'Ladakh', location: 'Jammu & Kashmir', slug: 'ladakh' },
    { name: 'Kashmir', location: 'Jammu & Kashmir', slug: 'kashmir' },
    { name: 'Manali', location: 'Himachal Pradesh', slug: 'manali' },
    { name: 'Sikkim', location: 'Northeast India', slug: 'sikkim' },
    { name: 'Spiti Valley', location: 'Himachal Pradesh', slug: 'spiti' },
    { name: 'Meghalaya', location: 'Northeast India', slug: 'meghalaya' },
    { name: 'Kerala', location: 'South India', slug: 'kerala' },
    { name: 'Munnar', location: 'Kerala', slug: 'munnar' },
    { name: 'Coorg', location: 'Karnataka', slug: 'coorg' },
    { name: 'Goa', location: 'West India', slug: 'goa' },
    { name: 'Andaman & Nicobar', location: 'Bay of Bengal', slug: 'andaman' },
    { name: 'Rishikesh', location: 'Uttarakhand', slug: 'rishikesh' },
    { name: 'Rajasthan', location: 'Northwest India', slug: 'rajasthan' },
    { name: 'Jaipur', location: 'Rajasthan', slug: 'jaipur' },
    { name: 'Udaipur', location: 'Rajasthan', slug: 'udaipur' },
    { name: 'Jaisalmer', location: 'Rajasthan', slug: 'jaisalmer' },
    { name: 'Agra', location: 'Uttar Pradesh', slug: 'agra' },
    { name: 'Varanasi', location: 'Uttar Pradesh', slug: 'varanasi' },
    { name: 'Hampi', location: 'Karnataka', slug: 'hampi' },
    { name: 'Pondicherry', location: 'South India', slug: 'pondicherry' }
  ]

  const destinations = destinationSequence.map((destination) => ({
    ...destination,
    image: `/images/${destination.slug}.jpeg`
  }))

  const marqueeDestinations = [...destinations, ...destinations]

  const getLabels = () => {
    switch(activeTab) {
      case 'FLIGHTS':
        return { from: 'From', to: 'To', departure: 'Departure', return: 'Return', travelers: 'Travelers', class: 'Class' }
      case 'TRAINS':
        return { from: 'From Station', to: 'To Station', departure: 'Departure', return: 'Return', travelers: 'Travelers', class: 'Class' }
      case 'BUSES':
        return { from: 'From City', to: 'To City', departure: 'Departure', return: 'Return', travelers: 'Travelers', class: 'Seat Type' }
      case 'HOTELS':
        return { from: 'City/Destination', to: '', departure: 'Check-In', return: 'Check-Out', travelers: 'Guests', class: 'Rooms' }
      default:
        return { from: 'From', to: 'To', departure: 'Departure', return: 'Return', travelers: 'Travelers', class: 'Class' }
    }
  }

  const labels = getLabels()
  const showToField = activeTab !== 'HOTELS'

  const handleCitySelect = (city: string, field: 'from' | 'to' | 'home') => {
    if (field === 'from') {
      setFrom(city)
      setShowFromDropdown(false)
    } else if (field === 'to') {
      setTo(city)
      setShowToDropdown(false)
    } else {
      setHomeCity(city)
      setShowHomeCityDropdown(false)
    }
  }

  const swapCities = () => {
    const temp = from
    setFrom(to)
    setTo(temp)
  }

  const filteredCitiesFrom = cities.filter(city => 
    city.toLowerCase().includes(from.toLowerCase())
  )
  const filteredCitiesTo = cities.filter(city => 
    city.toLowerCase().includes(to.toLowerCase())
  )
  const filteredHomeCities = cities.filter(city => 
    city.toLowerCase().includes(homeCity.toLowerCase())
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F1E6' }}>
      {/* Header */}
      <SiteHeader
        currentUser={currentUser}
        onLogout={handleLogout}
        onMyTrips={() => setShowMyTripsModal(true)}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 px-4">
          <div id="ai-trip-planner" className="max-w-4xl mx-auto">
            {/* Card Container */}
            <div 
              className={`bg-white rounded-2xl shadow-2xl overflow-hidden border p-8 md:p-10 transition-all duration-500 ${
                highlightPlanner ? 'ring-4 ring-[#526B57] shadow-[0_0_35px_rgba(82,107,87,0.35)] scale-[1.01]' : ''
              }`} 
              style={{ borderColor: '#E1DDD1' }}
            >
              {/* Task B: Interactive Hero Heading */}
              <HeroHeading />

              {/* Step 53: Confirmation Notification after Applying Proposal from Chat */}
              {chatProposalNotice && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📋</span>
                    <span>{chatProposalNotice}</span>
                  </div>
                  <button
                    onClick={() => setChatProposalNotice(null)}
                    className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 px-1.5 py-0.5 rounded hover:bg-emerald-100 transition"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Screen 2: Confirm Parsed Details In-Page Section */}
              {showConfirmModal && parsedDetailsData && (
                <div className="mb-6 p-6 rounded-2xl bg-white border-2 border-[#526B57] shadow-xl text-left animate-fadeIn">
                  <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: '#E1DDD1' }}>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#526B57]/10 text-[#526B57] mb-1">
                        <span>📋 Screen 2 of 3</span>
                        <span>• Confirm LLM Parsed Entities</span>
                      </div>
                      <h3 className="text-xl font-bold text-[#263D32]" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Confirm Parsed Trip Details
                      </h3>
                      <p className="text-xs text-[#526B57]">Verify or edit what AI parsed from your prompt before generating</p>
                    </div>
                    <button
                      onClick={() => setShowConfirmModal(false)}
                      className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2 py-1 border rounded-lg"
                    >
                      ✕ Hide Section
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Destination</label>
                      <input
                        type="text"
                        value={aiDestination}
                        onChange={(e) => setAiDestination(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl font-semibold text-xs text-[#263D32] bg-gray-50"
                        style={{ borderColor: '#E1DDD1' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={aiTravelDate}
                        onChange={(e) => setAiTravelDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl font-semibold text-xs text-[#263D32] bg-gray-50"
                        style={{ borderColor: '#E1DDD1' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Duration (Days)</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={aiDuration}
                        onChange={(e) => setAiDuration(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 border rounded-xl font-semibold text-xs text-[#263D32] bg-gray-50"
                        style={{ borderColor: '#E1DDD1' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Max Budget (₹)</label>
                      <input
                        type="number"
                        step={1000}
                        value={aiBudget}
                        onChange={(e) => setAiBudget(Math.max(1000, Number(e.target.value)))}
                        className="w-full px-3 py-2 border rounded-xl font-semibold text-xs text-[#263D32] bg-gray-50"
                        style={{ borderColor: '#E1DDD1' }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleConfirmModalSubmit({
                      destination: aiDestination,
                      startDate: aiTravelDate,
                      durationDays: aiDuration,
                      budget: aiBudget,
                      travelStyle: aiTravelStyle,
                    })}
                    className="w-full py-3.5 text-xs font-bold text-white rounded-xl shadow-lg transition hover:scale-[1.01]"
                    style={{ backgroundColor: '#526B57' }}
                  >
                    🚀 Confirm Entities & Generate Screen 3 Itinerary ➔
                  </button>
                </div>
              )}

              {/* Screen 1 Inputs: Destination, Schedule Date, Duration, Max Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                {/* Destination Input */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Destination</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter destination city"
                      value={aiDestination}
                      onChange={(e) => {
                        setAiDestination(e.target.value)
                        if (formErrors.destination) setFormErrors((prev) => ({ ...prev, destination: undefined }))
                      }}
                      className={`w-full px-4 py-3 pr-8 border-2 rounded-lg focus:outline-none bg-white font-medium ${
                        formErrors.destination ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      style={{ borderColor: formErrors.destination ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                    />
                    {aiDestination ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAiDestination('')
                          if (formErrors.destination) setFormErrors((prev) => ({ ...prev, destination: undefined }))
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold"
                        title="Clear destination"
                      >
                        ✕
                      </button>
                    ) : null}
                  </div>
                  {formErrors.destination && (
                    <p className="text-xs text-red-600 mt-1 font-semibold">{formErrors.destination}</p>
                  )}
                </div>

                {/* Schedule Date */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Schedule Date</label>
                  <input
                    type="date"
                    value={aiTravelDate}
                    onChange={(e) => {
                      setAiTravelDate(e.target.value)
                      if (formErrors.travelDate) setFormErrors((prev) => ({ ...prev, travelDate: undefined }))
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none bg-white font-medium ${
                      formErrors.travelDate ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    style={{ borderColor: formErrors.travelDate ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                  />
                  {formErrors.travelDate && (
                    <p className="text-xs text-red-600 mt-1 font-semibold">{formErrors.travelDate}</p>
                  )}
                </div>

                {/* Duration Typing Input */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={aiDuration}
                    onChange={(e) => {
                      setAiDuration(Number(e.target.value))
                      if (formErrors.duration) setFormErrors((prev) => ({ ...prev, duration: undefined }))
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none bg-white font-medium ${
                      formErrors.duration ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    style={{ borderColor: formErrors.duration ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                    placeholder="e.g. 3"
                  />
                  {formErrors.duration && (
                    <p className="text-xs text-red-600 mt-1 font-semibold">{formErrors.duration}</p>
                  )}
                </div>

                {/* Budget Typing Input */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>
                    Max Budget (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1000}
                    value={aiBudget}
                    onChange={(e) => {
                      setAiBudget(Number(e.target.value))
                      if (formErrors.budget) setFormErrors((prev) => ({ ...prev, budget: undefined }))
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none bg-white font-medium ${
                      formErrors.budget ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    style={{ borderColor: formErrors.budget ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                    placeholder="e.g. 25000"
                  />
                  {formErrors.budget && (
                    <p className="text-xs text-red-600 mt-1 font-semibold">{formErrors.budget}</p>
                  )}
                  {(() => {
                    if (!aiDestination || !aiBudget) return null;
                    try {
                      const est = estimateTripCost({
                        destination: aiDestination,
                        from: from || homeCity,
                        durationDays: Number(aiDuration) || 2,
                        travelers: Number(travellers) || 2,
                        travelStyle: aiTravelStyle,
                      });
                      if (Number(aiBudget) < est.minimumRequired) {
                        return (
                          <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-300 text-[11px] text-amber-900 font-medium">
                            <span className="font-bold">⚠️ Budget Advisory: </span>
                            ₹{Number(aiBudget).toLocaleString('en-IN')} is below the realistic minimum of ₹{est.minimumRequired.toLocaleString('en-IN')} for {Number(aiDuration) || 2}d ({Number(travellers) || 2} traveler{Number(travellers) > 1 ? 's' : ''}). Rec: ₹{est.recommended.toLocaleString('en-IN')}.
                          </div>
                        );
                      }
                    } catch {
                      return null;
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Travel Style Chips: Adventure, Family, Solo Explorer, Luxury, Budget Friendly */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Travel Style</label>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { key: 'Adventure', label: '🧗 Adventure' },
                    { key: 'Family', label: '👨‍👩‍👧 Family' },
                    { key: 'Solo Explorer', label: '🎒 Solo Explorer' },
                    { key: 'Luxury', label: '✨ Luxury' },
                    { key: 'Budget Friendly', label: '🌿 Budget Friendly' },
                  ].map((style) => {
                    const isSelected = aiTravelStyle === style.key || (style.key === 'Budget Friendly' && aiTravelStyle === 'Budget-Friendly')
                    return (
                      <button
                        key={style.key}
                        type="button"
                        onClick={() => setAiTravelStyle(style.key)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border ${
                          isSelected
                            ? 'bg-[#263D32] text-white border-[#263D32] shadow-sm scale-105'
                            : 'bg-white text-[#526B57] border-[#E1DDD1] hover:border-[#526B57] hover:bg-[#F4F1E6]/40'
                        }`}
                      >
                        {style.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Generate AI Trip Itinerary Button */}
              <button 
                onClick={() => handleGeneratePlan()}
                disabled={isGenerating}
                className="w-full py-4 text-white font-bold rounded-lg transition shadow-lg hover:shadow-xl transform hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                style={{ backgroundColor: '#526B57' }}
                onMouseEnter={(e) => {
                  if (!isGenerating) e.currentTarget.style.backgroundColor = '#263D32'
                }}
                onMouseLeave={(e) => {
                  if (!isGenerating) e.currentTarget.style.backgroundColor = '#526B57'
                }}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  <span>🚀 Generate AI Trip Itinerary</span>
                )}
              </button>

              {/* Verified Place Generation Error Banner */}
              {planErrorMsg && (
                <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 text-sm font-semibold flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <span>{planErrorMsg}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Generated Itinerary Section (Screen 3) */}
        {generatedPlan && (
          <section id="generated-itinerary-results" className="mt-12 bg-white rounded-2xl shadow-xl p-8 border" style={{ borderColor: '#E1DDD1' }}>
            {/* Weather-Swap Banner Notice */}
            <WeatherSwapBanner weatherNotice={generatedPlan.weatherSwapNotice} />

            {authErrorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="text-sm font-medium">{authErrorMsg}</div>
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg transition shrink-0"
                  style={{ backgroundColor: '#526B57' }}
                >
                  Log In Now ➔
                </Link>
              </div>
            )}

            {/* Header & Save Action */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b pb-6 mb-6 gap-4" style={{ borderColor: '#E1DDD1' }}>
              <div>
                <div className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-[#526B57]/10 text-[#526B57] mb-2">
                  ✨ AI Agent Generated Plan
                </div>
                <h2 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#263D32' }}>
                  {generatedPlan.title}
                </h2>
                <p className="text-sm mt-1" style={{ color: '#526B57' }}>
                  Destination: <span className="font-semibold text-black">{generatedPlan.destination}</span> • Style: <span className="font-semibold text-black">{generatedPlan.travelStyle}</span>
                </p>
              </div>

              {/* Action Buttons & Currency Selector */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Currency Switcher */}
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="px-3 py-2 text-xs font-bold border rounded-xl bg-white text-[#263D32] shadow-xs"
                  style={{ borderColor: '#E1DDD1' }}
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code} ({c.name})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => exportItineraryToPDF(generatedPlan)}
                  className="px-4 py-2 text-xs font-bold text-[#263D32] bg-[#F4F1E6] hover:bg-[#E1DDD1] border border-[#E1DDD1] rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  📄 Export PDF
                </button>

                <button
                  onClick={() => exportToGoogleCalendar(generatedPlan)}
                  className="px-4 py-2 text-xs font-bold text-[#263D32] bg-[#F4F1E6] hover:bg-[#E1DDD1] border border-[#E1DDD1] rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  📅 Google Calendar
                </button>

                <button
                  onClick={() => exportToICS(generatedPlan)}
                  className="px-4 py-2 text-xs font-bold text-[#263D32] bg-[#F4F1E6] hover:bg-[#E1DDD1] border border-[#E1DDD1] rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  📥 Download .ICS
                </button>

                <button
                  onClick={handleSaveItinerary}
                  disabled={isSaving || saveSuccess}
                  className="px-5 py-2.5 text-xs text-white font-bold rounded-xl transition shadow-md flex items-center gap-1.5"
                  style={{ backgroundColor: saveSuccess ? '#16a34a' : '#263D32' }}
                >
                  {saveSuccess ? (
                    <span>✓ Saved to Database</span>
                  ) : isSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <span>💾 Save to My Trips</span>
                  )}
                </button>

                {/* Wishlist Heart Button */}
                <HeartButton plan={generatedPlan} size={22} className="bg-[#F4F1E6] border border-[#E1DDD1] shadow-xs" />
              </div>
            </div>

            {/* Weather & Budget Tracker Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Weather Widget */}
              <WeatherCard 
                destination={generatedPlan.destination} 
                weather={generatedPlan.weatherPreview || {}} 
              />

              {/* Budget Tracker Widget */}
              <div 
                className="p-4 rounded-xl border bg-gradient-to-br from-[#F4F1E6]/80 via-white to-[#F4F1E6]/50 shadow-sm flex flex-col justify-between"
                style={{ borderColor: '#E1DDD1' }}
              >
                {/* Header Line */}
                <div className="flex items-center justify-between gap-2 border-b pb-2.5 mb-2.5" style={{ borderColor: '#E1DDD1' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#526B57]">
                        Budget Allocation & Limit
                      </h4>
                      <p className="text-sm font-bold text-[#263D32]">
                        Known Fees: <span className="text-sm font-bold text-[#526B57]">
                          ₹{generatedPlan.estimatedCost?.toLocaleString('en-IN') || 0}
                          {generatedPlan.hasUnknownPricing ? ' + unknown' : ''}
                        </span> / Max ₹{generatedPlan.totalBudget?.toLocaleString('en-IN')} {generatedPlan.currency}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 bg-[#526B57] text-white">
                    Target: ₹{Math.round(generatedPlan.totalBudget / (generatedPlan.durationDays || 1)).toLocaleString('en-IN')} / Day
                  </span>
                </div>

                {/* Summary Box */}
                <div className="p-3 rounded-lg bg-white border border-[#526B57]/20">
                  <div className="flex justify-between items-center text-[11px] uppercase tracking-wider font-bold text-[#526B57] mb-1">
                    <span>Venue Entry Pricing</span>
                    <span>{generatedPlan.estimatedCost > 0 ? `₹${generatedPlan.estimatedCost} Known` : 'OSM / Local Rates'}</span>
                  </div>
                  <p className="text-xs font-medium text-[#263D32]">
                    Trip planned within your ₹{generatedPlan.totalBudget?.toLocaleString('en-IN')} limit. Verified entry fees are sourced from OpenStreetMap where available; other places show &quot;Price not available&quot;.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4.2 Interactive Expense Tracker */}
            {generatedPlan.totalBudget && (
              <ExpenseTracker 
                plannedBudget={generatedPlan.totalBudget} 
                currencyCode={selectedCurrency}
                destination={generatedPlan.destination}
                dayPlans={generatedPlan.dayPlans}
                from={from || homeCity}
                travelers={Number(travellers) || 2}
                travelStyle={generatedPlan.travelStyle || aiTravelStyle}
                durationDays={generatedPlan.durationDays || aiDuration}
              />
            )}

            {/* Step 3.4 Interactive Route Map */}
            {generatedPlan.dayPlans && (
              <InteractiveMap 
                destination={generatedPlan.destination} 
                dayPlans={generatedPlan.dayPlans} 
                geocodedCenter={generatedPlan.geocodedCenter}
              />
            )}

            {/* Day-by-Day Timeline */}
            <h3 className="text-xl font-bold mb-4 text-[#263D32]" style={{ fontFamily: 'Playfair Display, serif' }}>
              🗓️ Day-by-Day Detailed Itinerary
            </h3>

            <div className="space-y-6">
              {generatedPlan.dayPlans?.map((dp: any) => (
                <div key={dp.dayNumber} className="border rounded-xl p-6 bg-white shadow-sm" style={{ borderColor: '#E1DDD1' }}>
                  <div className="flex justify-between items-center mb-4 border-b pb-3 gap-2 flex-wrap" style={{ borderColor: '#E1DDD1' }}>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-[#263D32]">
                        Day {dp.dayNumber}: {dp.summary}
                      </h4>
                      {dp.isDayTrip && (
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                          Day Trip
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {dp.totalTravelKm ? (
                        <span className="text-xs text-gray-500 font-medium">
                          🚗 ~{dp.totalTravelKm} km transit
                        </span>
                      ) : null}
                      <span className="text-xs px-3 py-1 rounded-full font-medium bg-[#526B57]/10 text-[#526B57]">
                        {dp.activities.length} Activities
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dp.activities?.map((act: any, idx: number) => (
                      <ActivityCard
                        key={act.id || idx}
                        activity={act}
                        destination={generatedPlan.destination}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Photo Provider Attribution & OpenTripMap / OpenStreetMap Attribution */}
            <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500 dark:text-gray-400 space-y-1.5" style={{ borderColor: '#E1DDD1' }}>
              {/* Show only providers actually used in that trip */}
              {generatedPlan.usedImageProviders && generatedPlan.usedImageProviders.length > 0 && (
                <p className="font-medium text-gray-600 dark:text-gray-300">
                  Photos provided by{' '}
                  {generatedPlan.usedImageProviders.includes('pexels') && generatedPlan.usedImageProviders.includes('unsplash') ? (
                    <>
                      <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#263D32]">Pexels</a>
                      {' and '}
                      <a href="https://unsplash.com?utm_source=xplora&utm_medium=referral" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#263D32]">Unsplash</a>
                    </>
                  ) : generatedPlan.usedImageProviders.includes('pexels') ? (
                    <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#263D32]">Pexels</a>
                  ) : generatedPlan.usedImageProviders.includes('unsplash') ? (
                    <a href="https://unsplash.com?utm_source=xplora&utm_medium=referral" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#263D32]">Unsplash</a>
                  ) : null}
                </p>
              )}
              <p>
                Places data: <a href="https://opentripmap.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">OpenTripMap</a>, © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">OpenStreetMap contributors</a> (ODbL)
              </p>
            </div>
          </section>
        )}

        {/* Popular Destinations - True Continuous Marquee */}
        <section className="py-12 overflow-hidden" style={{ background: 'linear-gradient(to bottom, transparent, rgba(82, 107, 87, 0.05), transparent)' }}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#263D32' }}>
              Popular Destinations
            </h2>
            <p style={{ color: '#526B57' }}>Explore India&apos;s most beautiful destinations • Click any card to plan a trip with AI!</p>
          </div>
          
          {/* Continuous Marquee Container */}
          <div className="marquee-viewport">
            <div className="marquee-track">
              {marqueeDestinations.map((destination, index) => (
                <DestinationCard
                  key={`${destination.name}-${index}`}
                  name={destination.name}
                  location={destination.location}
                  image={destination.image}
                  onSelect={handleSelectPopularDestination}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Step 32: Top-Level Booking Area Split (Travel vs Stay) */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ border: '1px solid #E1DDD1' }}>
          {/* Primary Booking Area Header */}
          <div className="flex border-b-2" style={{ borderColor: '#E1DDD1' }}>
            <button
              onClick={() => {
                setBookingArea('TRAVEL')
                setActiveTab(transportMode)
              }}
              className={`flex-1 py-4 px-4 text-center font-bold text-sm sm:text-base transition flex items-center justify-center gap-2 border-b-4 ${
                bookingArea === 'TRAVEL'
                  ? 'text-[#263D32] border-[#526B57] bg-[#F4F1E6]/50'
                  : 'text-gray-500 border-transparent hover:text-[#263D32] hover:bg-[#F4F1E6]/20'
              }`}
            >
              <span className="text-xl">✈️</span>
              <span>Travel Transport</span>
            </button>
            <button
              onClick={() => {
                setBookingArea('STAY')
                setActiveTab('HOTELS')
              }}
              className={`flex-1 py-4 px-4 text-center font-bold text-sm sm:text-base transition flex items-center justify-center gap-2 border-b-4 ${
                bookingArea === 'STAY'
                  ? 'text-[#263D32] border-[#526B57] bg-[#F4F1E6]/50'
                  : 'text-gray-500 border-transparent hover:text-[#263D32] hover:bg-[#F4F1E6]/20'
              }`}
            >
              <span className="text-xl">🏨</span>
              <span>Hotels & Resorts (Stay)</span>
            </button>
          </div>

          {/* Step 33: Travel Sub-Tabs (Flights, Trains, Buses) */}
          {bookingArea === 'TRAVEL' && (
            <div className="flex gap-2 p-3 sm:p-4 bg-[#F4F1E6]/40 border-b overflow-x-auto" style={{ borderColor: '#E1DDD1' }}>
              <button
                onClick={() => {
                  setTransportMode('FLIGHTS')
                  setActiveTab('FLIGHTS')
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 border ${
                  transportMode === 'FLIGHTS'
                    ? 'bg-[#526B57] text-white border-[#526B57] shadow-sm'
                    : 'bg-white text-[#263D32] border-[#E1DDD1] hover:border-[#526B57]'
                }`}
              >
                <span>✈️</span> Flights
              </button>
              <button
                onClick={() => {
                  setTransportMode('TRAINS')
                  setActiveTab('TRAINS')
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 border ${
                  transportMode === 'TRAINS'
                    ? 'bg-[#526B57] text-white border-[#526B57] shadow-sm'
                    : 'bg-white text-[#263D32] border-[#E1DDD1] hover:border-[#526B57]'
                }`}
              >
                <span>🚆</span> Trains
              </button>
              <button
                onClick={() => {
                  setTransportMode('BUSES')
                  setActiveTab('BUSES')
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 border ${
                  transportMode === 'BUSES'
                    ? 'bg-[#526B57] text-white border-[#526B57] shadow-sm'
                    : 'bg-white text-[#263D32] border-[#E1DDD1] hover:border-[#526B57]'
                }`}
              >
                <span>🚌</span> Buses
              </button>
            </div>
          )}

          {/* Form Content Area */}
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Step 37: Dedicated Flights Search Form UI */}
            {bookingArea === 'TRAVEL' && transportMode === 'FLIGHTS' && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.2fr,auto,1.2fr,1fr,1fr,1fr,1fr] gap-4 items-end">
                  {/* Origin */}
                  <div className="relative">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>From City / Airport</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter departure city or airport"
                        value={flightOrigin}
                        onChange={(e) => {
                          setFlightOrigin(e.target.value)
                          setShowFlightOriginDropdown(Boolean(e.target.value.trim()))
                          if (flightErrors.origin) setFlightErrors((prev) => ({ ...prev, origin: '' }))
                        }}
                        onFocus={() => {
                          if (flightOrigin.trim()) setShowFlightOriginDropdown(true)
                        }}
                        className={`w-full px-4 py-3 pr-8 border-2 rounded-lg focus:outline-none font-semibold ${
                          flightErrors.origin ? 'border-red-500' : ''
                        }`}
                        style={{ borderColor: flightErrors.origin ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                      />
                      {flightOrigin ? (
                        <button
                          type="button"
                          onClick={() => {
                            setFlightOrigin('')
                            setShowFlightOriginDropdown(false)
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold"
                          title="Clear departure city"
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                    {flightErrors.origin && (
                      <p className="text-xs text-red-600 mt-1 font-semibold">{flightErrors.origin}</p>
                    )}
                    {showFlightOriginDropdown && flightOrigin.trim() && (
                      <div className="absolute z-20 w-full mt-1 bg-white border-2 rounded-lg shadow-lg max-h-56 overflow-y-auto" style={{ borderColor: '#E1DDD1' }}>
                        {cities.filter(c => c.toLowerCase().includes(flightOrigin.toLowerCase())).slice(0, 8).map((city) => (
                          <div
                            key={city}
                            onClick={() => {
                              setFlightOrigin(city)
                              setShowFlightOriginDropdown(false)
                              if (flightErrors.origin) setFlightErrors((prev) => ({ ...prev, origin: '' }))
                            }}
                            className="px-4 py-2 cursor-pointer hover:bg-[#F4F1E6] text-sm font-medium text-[#292A25]"
                          >
                            {city}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center items-center py-1 xl:py-0">
                    <button
                      type="button"
                      onClick={() => {
                        const curOrigin = flightOrigin
                        const curDest = flightDestination
                        setFlightOrigin(curDest)
                        setFlightDestination(curOrigin)
                      }}
                      className="p-3 text-white rounded-xl transition shadow-md hover:scale-105"
                      style={{ backgroundColor: '#C6A96B' }}
                      title="Swap departure and arrival cities"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </button>
                  </div>

                  {/* Destination */}
                  <div className="relative">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>To City / Airport</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter destination city or airport"
                        value={flightDestination}
                        onChange={(e) => {
                          setFlightDestination(e.target.value)
                          setShowFlightDestDropdown(Boolean(e.target.value.trim()))
                          if (flightErrors.destination) setFlightErrors((prev) => ({ ...prev, destination: '' }))
                        }}
                        onFocus={() => {
                          if (flightDestination.trim()) setShowFlightDestDropdown(true)
                        }}
                        className={`w-full px-4 py-3 pr-8 border-2 rounded-lg focus:outline-none font-semibold ${
                          flightErrors.destination ? 'border-red-500' : ''
                        }`}
                        style={{ borderColor: flightErrors.destination ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                      />
                      {flightDestination ? (
                        <button
                          type="button"
                          onClick={() => {
                            setFlightDestination('')
                            setShowFlightDestDropdown(false)
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold"
                          title="Clear destination city"
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                    {flightErrors.destination && (
                      <p className="text-xs text-red-600 mt-1 font-semibold">{flightErrors.destination}</p>
                    )}
                    {showFlightDestDropdown && flightDestination.trim() && (
                      <div className="absolute z-20 w-full mt-1 bg-white border-2 rounded-lg shadow-lg max-h-56 overflow-y-auto" style={{ borderColor: '#E1DDD1' }}>
                        {cities.filter(c => c.toLowerCase().includes(flightDestination.toLowerCase())).slice(0, 8).map((city) => (
                          <div
                            key={city}
                            onClick={() => {
                              setFlightDestination(city)
                              setShowFlightDestDropdown(false)
                              if (flightErrors.destination) setFlightErrors((prev) => ({ ...prev, destination: '' }))
                            }}
                            className="px-4 py-2 cursor-pointer hover:bg-[#F4F1E6] text-sm font-medium text-[#292A25]"
                          >
                            {city}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Departure Date */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Departure Date</label>
                    <input
                      type="date"
                      min={getTodayIsoDate()}
                      value={flightOutboundDate || departure}
                      onChange={(e) => {
                        setFlightOutboundDate(e.target.value)
                        setDeparture(e.target.value)
                        if (flightErrors.outboundDate) setFlightErrors((prev) => ({ ...prev, outboundDate: '' }))
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold ${
                        flightErrors.outboundDate ? 'border-red-500' : ''
                      }`}
                      style={{ borderColor: flightErrors.outboundDate ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                    />
                    {flightErrors.outboundDate && (
                      <p className="text-xs text-red-600 mt-1 font-semibold">{flightErrors.outboundDate}</p>
                    )}
                  </div>

                  {/* Return Date */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Return Date (Optional)</label>
                    <input
                      type="date"
                      min={flightOutboundDate || getTodayIsoDate()}
                      value={flightReturnDate || returnDate}
                      onChange={(e) => {
                        setFlightReturnDate(e.target.value)
                        setReturnDate(e.target.value)
                        if (flightErrors.returnDate) setFlightErrors((prev) => ({ ...prev, returnDate: '' }))
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold ${
                        flightErrors.returnDate ? 'border-red-500' : ''
                      }`}
                      style={{ borderColor: flightErrors.returnDate ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                    />
                    {flightErrors.returnDate && (
                      <p className="text-xs text-red-600 mt-1 font-semibold">{flightErrors.returnDate}</p>
                    )}
                  </div>

                  {/* Travelers */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Travelers</label>
                    <select
                      value={flightTravelers}
                      onChange={(e) => setFlightTravelers(Number(e.target.value))}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold"
                      style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Adult' : 'Adults'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cabin Class */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Class</label>
                    <select
                      value={flightCabinClass}
                      onChange={(e) => setFlightCabinClass(e.target.value as CabinClass)}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold"
                      style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                    >
                      <option value="Economy">Economy</option>
                      <option value="Premium Economy">Premium Economy</option>
                      <option value="Business">Business</option>
                      <option value="First Class">First Class</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSearchFlights}
                  disabled={flightIsLoading}
                  className="w-full mt-6 py-4 text-white font-bold rounded-lg transition shadow-lg text-lg hover:shadow-xl transform hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: '#526B57' }}
                >
                  {flightIsLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Searching Verified Flights...</span>
                    </>
                  ) : (
                    <span>🔍 Search Flights</span>
                  )}
                </button>

                {flightEnvelope?.notice && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold">
                    ℹ️ {flightEnvelope.notice}
                  </div>
                )}
              </div>
            )}

            {/* Step 38: Dedicated Trains Search Form UI */}
            {bookingArea === 'TRAVEL' && transportMode === 'TRAINS' && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.2fr,auto,1.2fr,1fr,1fr,1fr,1fr] gap-4 items-end">
                  {/* Origin */}
                  <div className="relative">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>From Station / City</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter departure station or city"
                        value={trainOrigin}
                        onChange={(e) => {
                          setTrainOrigin(e.target.value)
                          setShowTrainOriginDropdown(Boolean(e.target.value.trim()))
                          if (trainErrors.origin) setTrainErrors((prev) => ({ ...prev, origin: '' }))
                        }}
                        onFocus={() => {
                          if (trainOrigin.trim()) setShowTrainOriginDropdown(true)
                        }}
                        className={`w-full px-4 py-3 pr-8 border-2 rounded-lg focus:outline-none font-semibold ${
                          trainErrors.origin ? 'border-red-500' : ''
                        }`}
                        style={{ borderColor: trainErrors.origin ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                      />
                      {trainOrigin ? (
                        <button
                          type="button"
                          onClick={() => {
                            setTrainOrigin('')
                            setShowTrainOriginDropdown(false)
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold"
                          title="Clear departure station"
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                    {trainErrors.origin && (
                      <p className="text-xs text-red-600 mt-1 font-semibold">{trainErrors.origin}</p>
                    )}
                    {showTrainOriginDropdown && trainOrigin.trim() && (
                      <div className="absolute z-20 w-full mt-1 bg-white border-2 rounded-lg shadow-lg max-h-56 overflow-y-auto" style={{ borderColor: '#E1DDD1' }}>
                        {trainStations.filter(s => s.name.toLowerCase().includes(trainOrigin.toLowerCase()) || s.code.toLowerCase().includes(trainOrigin.toLowerCase())).slice(0, 8).map((stn) => (
                          <div
                            key={stn.code}
                            onClick={() => {
                              setTrainOrigin(stn.code)
                              setShowTrainOriginDropdown(false)
                              if (trainErrors.origin) setTrainErrors((prev) => ({ ...prev, origin: '' }))
                            }}
                            className="px-4 py-2 cursor-pointer hover:bg-[#F4F1E6] text-sm font-medium text-[#292A25]"
                          >
                            {stn.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center items-center py-1 xl:py-0">
                    <button
                      type="button"
                      onClick={() => {
                        const curOrigin = trainOrigin
                        const curDest = trainDestination
                        setTrainOrigin(curDest)
                        setTrainDestination(curOrigin)
                      }}
                      className="p-3 text-white rounded-xl transition shadow-md hover:scale-105"
                      style={{ backgroundColor: '#C6A96B' }}
                      title="Swap departure and arrival stations"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </button>
                  </div>

                  {/* Destination */}
                  <div className="relative">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>To Station / City</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter destination station or city"
                        value={trainDestination}
                        onChange={(e) => {
                          setTrainDestination(e.target.value)
                          setShowTrainDestDropdown(Boolean(e.target.value.trim()))
                          if (trainErrors.destination) setTrainErrors((prev) => ({ ...prev, destination: '' }))
                        }}
                        onFocus={() => {
                          if (trainDestination.trim()) setShowTrainDestDropdown(true)
                        }}
                        className={`w-full px-4 py-3 pr-8 border-2 rounded-lg focus:outline-none font-semibold ${
                          trainErrors.destination ? 'border-red-500' : ''
                        }`}
                        style={{ borderColor: trainErrors.destination ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                      />
                      {trainDestination ? (
                        <button
                          type="button"
                          onClick={() => {
                            setTrainDestination('')
                            setShowTrainDestDropdown(false)
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold"
                          title="Clear destination station"
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                    {trainErrors.destination && (
                      <p className="text-xs text-red-600 mt-1 font-semibold">{trainErrors.destination}</p>
                    )}
                    {showTrainDestDropdown && trainDestination.trim() && (
                      <div className="absolute z-20 w-full mt-1 bg-white border-2 rounded-lg shadow-lg max-h-56 overflow-y-auto" style={{ borderColor: '#E1DDD1' }}>
                        {trainStations.filter(s => s.name.toLowerCase().includes(trainDestination.toLowerCase()) || s.code.toLowerCase().includes(trainDestination.toLowerCase())).slice(0, 8).map((stn) => (
                          <div
                            key={stn.code}
                            onClick={() => {
                              setTrainDestination(stn.code)
                              setShowTrainDestDropdown(false)
                              if (trainErrors.destination) setTrainErrors((prev) => ({ ...prev, destination: '' }))
                            }}
                            className="px-4 py-2 cursor-pointer hover:bg-[#F4F1E6] text-sm font-medium text-[#292A25]"
                          >
                            {stn.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Journey Date */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Journey Date</label>
                    <input
                      type="date"
                      min={getTodayIsoDate()}
                      value={trainDate || departure}
                      onChange={(e) => {
                        setTrainDate(e.target.value)
                        setDeparture(e.target.value)
                        if (trainErrors.date) setTrainErrors((prev) => ({ ...prev, date: '' }))
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold ${
                        trainErrors.date ? 'border-red-500' : ''
                      }`}
                      style={{ borderColor: trainErrors.date ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                    />
                    {trainErrors.date && (
                      <p className="text-xs text-red-600 mt-1 font-semibold">{trainErrors.date}</p>
                    )}
                  </div>

                  {/* Travelers */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Travelers</label>
                    <select
                      value={trainTravelers}
                      onChange={(e) => setTrainTravelers(Number(e.target.value))}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold"
                      style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Adult' : 'Adults'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Class */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Class</label>
                    <select
                      value={trainClass}
                      onChange={(e) => setTrainClass(e.target.value)}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold"
                      style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                    >
                      <option value="ALL">All Classes</option>
                      <option value="1A">AC First Class (1A)</option>
                      <option value="2A">AC 2 Tier (2A)</option>
                      <option value="3A">AC 3 Tier (3A)</option>
                      <option value="3E">AC 3 Economy (3E)</option>
                      <option value="SL">Sleeper Class (SL)</option>
                      <option value="CC">AC Chair Car (CC)</option>
                      <option value="2S">Second Sitting (2S)</option>
                    </select>
                  </div>

                  {/* Quota */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Quota</label>
                    <select
                      value={trainQuota}
                      onChange={(e) => setTrainQuota(e.target.value)}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold"
                      style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                    >
                      <option value="GN">General (GN)</option>
                      <option value="TQ">Tatkal (TQ)</option>
                      <option value="LD">Ladies (LD)</option>
                      <option value="SS">Senior Citizen (SS)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSearchTrains}
                  disabled={trainIsLoading}
                  className="w-full mt-6 py-4 text-white font-bold rounded-lg transition shadow-lg text-lg hover:shadow-xl transform hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: '#526B57' }}
                >
                  {trainIsLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Searching Verified Trains...</span>
                    </>
                  ) : (
                    <span>🔍 Search Trains</span>
                  )}
                </button>

                {trainEnvelope?.notice && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold">
                    ℹ️ {trainEnvelope.notice}
                  </div>
                )}

                <div className="mt-4 p-3 rounded-lg bg-[#F4F1E6]/60 border border-[#E1DDD1] text-xs text-gray-600">
                  <span className="font-bold text-[#263D32]">Truthfulness Policy: </span>
                  Live train searches are queried directly via the Qrail Railway Provider. If provider credentials are offline or restricted, Train search is currently unavailable and will honestly report provider status. XPLORA never invents fake train timings, unverified seat availability, or fictitious booking confirmations. Real-time booking handoffs link directly to official IRCTC.
                </div>
              </div>
            )}

            {/* Dedicated Bus Search Form UI (Triangle Distance + ₹13/km + redBus redirect) */}
            {bookingArea === 'TRAVEL' && transportMode === 'BUSES' && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.3fr,auto,1.3fr,1fr,0.8fr,1.1fr,auto] gap-4 items-end">
                  {/* Origin */}
                  <div ref={busOriginRef} className="relative">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>From City</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter departure city"
                        value={busOrigin}
                        onChange={(e) => {
                          const val = e.target.value
                          setBusOrigin(val)
                          if (val.trim()) {
                            setShowBusOriginDropdown(true)
                            fetchBusSuggestions(val, 'origin')
                          } else {
                            setShowBusOriginDropdown(false)
                            setBusOriginSuggestions([])
                          }
                          if (busErrors.origin) setBusErrors((prev) => ({ ...prev, origin: '' }))
                        }}
                        onFocus={() => {
                          if (busOrigin.trim()) {
                            setShowBusOriginDropdown(true)
                            fetchBusSuggestions(busOrigin, 'origin')
                          }
                        }}
                        className={`w-full px-4 py-3 pr-8 border-2 rounded-lg focus:outline-none font-semibold ${
                          busErrors.origin ? 'border-red-500' : ''
                        }`}
                        style={{ borderColor: busErrors.origin ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                      />
                      {busOrigin ? (
                        <button
                          type="button"
                          onClick={() => {
                            setBusOrigin('')
                            setShowBusOriginDropdown(false)
                            setBusOriginSuggestions([])
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold"
                          title="Clear from city"
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                    {busErrors.origin && (
                      <p className="text-xs text-red-600 mt-1 font-semibold">{busErrors.origin}</p>
                    )}
                    {showBusOriginDropdown && busOriginSuggestions.length > 0 && (
                      <div className="absolute z-30 w-full mt-1 bg-white border-2 rounded-xl shadow-xl max-h-60 overflow-y-auto" style={{ borderColor: '#E1DDD1' }}>
                        {busOriginSuggestions.map((item) => (
                          <div
                            key={item.place}
                            onClick={() => {
                              setBusOrigin(item.place)
                              setShowBusOriginDropdown(false)
                              if (busErrors.origin) setBusErrors((prev) => ({ ...prev, origin: '' }))
                            }}
                            className="px-4 py-2.5 cursor-pointer hover:bg-[#F4F1E6] flex items-center justify-between border-b last:border-0 border-gray-100 transition"
                          >
                            <div>
                              <span className="text-sm font-bold text-[#263D32]">{item.place}</span>
                              <span className="text-xs text-gray-500 ml-1.5">({item.state})</span>
                            </div>
                            <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                              {item.distanceFromCentre} km to centre
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Swap Button */}
                  <div className="hidden xl:flex items-center justify-center pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        const curOrigin = busOrigin
                        const curDest = busDestination
                        setBusOrigin(curDest)
                        setBusDestination(curOrigin)
                      }}
                      className="p-3 rounded-full hover:bg-[#F4F1E6] text-gray-500 hover:text-[#263D32] transition border border-[#E1DDD1]"
                      title="Swap Source and Destination"
                    >
                      🔄
                    </button>
                  </div>

                  {/* Destination */}
                  <div ref={busDestRef} className="relative">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>To Destination City</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter destination city"
                        value={busDestination}
                        onChange={(e) => {
                          const val = e.target.value
                          setBusDestination(val)
                          if (val.trim()) {
                            setShowBusDestDropdown(true)
                            fetchBusSuggestions(val, 'dest')
                          } else {
                            setShowBusDestDropdown(false)
                            setBusDestSuggestions([])
                          }
                          if (busErrors.destination) setBusErrors((prev) => ({ ...prev, destination: '' }))
                        }}
                        onFocus={() => {
                          if (busDestination.trim()) {
                            setShowBusDestDropdown(true)
                            fetchBusSuggestions(busDestination, 'dest')
                          }
                        }}
                        className={`w-full px-4 py-3 pr-8 border-2 rounded-lg focus:outline-none font-semibold ${
                          busErrors.destination ? 'border-red-500' : ''
                        }`}
                        style={{ borderColor: busErrors.destination ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                      />
                      {busDestination ? (
                        <button
                          type="button"
                          onClick={() => {
                            setBusDestination('')
                            setShowBusDestDropdown(false)
                            setBusDestSuggestions([])
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold"
                          title="Clear destination city"
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                    {busErrors.destination && (
                      <p className="text-xs text-red-600 mt-1 font-semibold">{busErrors.destination}</p>
                    )}
                    {showBusDestDropdown && busDestSuggestions.length > 0 && (
                      <div className="absolute z-30 w-full mt-1 bg-white border-2 rounded-xl shadow-xl max-h-60 overflow-y-auto" style={{ borderColor: '#E1DDD1' }}>
                        {busDestSuggestions.map((item) => (
                          <div
                            key={item.place}
                            onClick={() => {
                              setBusDestination(item.place)
                              setShowBusDestDropdown(false)
                              if (busErrors.destination) setBusErrors((prev) => ({ ...prev, destination: '' }))
                            }}
                            className="px-4 py-2.5 cursor-pointer hover:bg-[#F4F1E6] flex items-center justify-between border-b last:border-0 border-gray-100 transition"
                          >
                            <div>
                              <span className="text-sm font-bold text-[#263D32]">{item.place}</span>
                              <span className="text-xs text-gray-500 ml-1.5">({item.state})</span>
                            </div>
                            <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                              {item.distanceFromCentre} km to centre
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Traveler Date */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Traveler Date</label>
                    <input
                      type="date"
                      min={getTodayIsoDate()}
                      value={busDate}
                      onChange={(e) => {
                        setBusDate(e.target.value)
                        if (busErrors.date) setBusErrors((prev) => ({ ...prev, date: '' }))
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold ${
                        busErrors.date ? 'border-red-500' : ''
                      }`}
                      style={{ borderColor: busErrors.date ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                    />
                    {busErrors.date && (
                      <p className="text-xs text-red-600 mt-1 font-semibold">{busErrors.date}</p>
                    )}
                  </div>

                  {/* Travelers / Seats */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Seats</label>
                    <select
                      value={busTravelers}
                      onChange={(e) => setBusTravelers(Number(e.target.value))}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold"
                      style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Seat' : 'Seats'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Preference */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Fleet Type</label>
                    <select
                      value={busCategory}
                      onChange={(e) => setBusCategory(e.target.value as any)}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold"
                      style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                    >
                      <option value="ALL">Auto (&gt;100km Travels, &le;100km Local)</option>
                      <option value="TRAVELS">Travels (Intercity &gt;100 km)</option>
                      <option value="LOCAL">Local Bus (Regional &le;100 km)</option>
                    </select>
                  </div>

                  {/* Search Button */}
                  <div>
                    <button
                      onClick={handleSearchBuses}
                      disabled={busIsLoading}
                      className="w-full px-6 py-3 text-white font-bold rounded-lg shadow-md transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      style={{ backgroundColor: '#263D32' }}
                    >
                      {busIsLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Calculating...</span>
                        </>
                      ) : (
                        <>
                          <span>🔍</span>
                          <span>Search Buses</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Popular Transit Hub Quick Pills */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[#526B57]">Popular Hubs:</span>
                  {['Delhi', 'Mumbai', 'Pune', 'Nagpur', 'Chandigarh', 'Bengaluru', 'Jaipur', 'Ahmedabad', 'Manali'].map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        if (!busOrigin.trim()) {
                          setBusOrigin(city)
                          if (busErrors.origin) setBusErrors((prev) => ({ ...prev, origin: '' }))
                        } else {
                          setBusDestination(city)
                          if (busErrors.destination) setBusErrors((prev) => ({ ...prev, destination: '' }))
                        }
                      }}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F4F1E6] hover:bg-[#E1DDD1] text-[#263D32] transition border border-[#E1DDD1]"
                    >
                      + {city}
                    </button>
                  ))}
                </div>

                {/* Notice & Rule Explanation Card */}
                <div className="mt-4 p-4 rounded-xl bg-linear-to-r from-[#F4F1E6]/80 to-[#ECE7D8]/60 border border-[#E1DDD1] text-xs text-[#263D32]">
                  <div className="flex flex-wrap items-center gap-2 font-bold mb-1">
                    <span className="px-2 py-0.5 rounded bg-[#263D32] text-white text-[10px] uppercase tracking-wider">Formula Protocol</span>
                    <span>Centre Triangle Distance Calculation & ₹13 / km Mathematical Pricing</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Shortest distance between cities is derived from the Centre reference (Nagpur Zero Mile Stone) using the Triangle Inequality. If distance is greater than 100 km, premium <strong>Travels</strong> coaches operate; otherwise, <strong>Local Buses</strong> run for short-haul journeys. Fares are calculated strictly at <strong>₹13 / km</strong>, with instant direct ticket handoff via <strong>redBus (<a href="https://www.redbus.in/" target="_blank" rel="noopener noreferrer" className="text-[#D84E55] underline font-bold">redbus.in</a>)</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Step 40: Dedicated Stay Search Form UI */}
            {bookingArea === 'STAY' && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.5fr,1fr,1fr,1fr,1fr] gap-4 items-end">
                  {/* Destination */}
                  <div className="relative">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Destination City / Area</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter destination city or area"
                        value={stayDestination}
                        onChange={(e) => {
                          setStayDestination(e.target.value)
                          setShowStayDestDropdown(Boolean(e.target.value.trim()))
                          if (stayErrors.destination) setStayErrors((prev) => ({ ...prev, destination: '' }))
                        }}
                        onFocus={() => {
                          if (stayDestination.trim()) setShowStayDestDropdown(true)
                        }}
                        className={`w-full px-4 py-3 pr-8 border-2 rounded-lg focus:outline-none font-semibold ${
                          stayErrors.destination ? 'border-red-500' : ''
                        }`}
                        style={{ borderColor: stayErrors.destination ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                      />
                      {stayDestination ? (
                        <button
                          type="button"
                          onClick={() => {
                            setStayDestination('')
                            setShowStayDestDropdown(false)
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold"
                          title="Clear destination"
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                    {stayErrors.destination && (
                      <p className="text-xs text-red-600 mt-1 font-semibold">{stayErrors.destination}</p>
                    )}
                    {showStayDestDropdown && stayDestination.trim() && (
                      <div className="absolute z-20 w-full mt-1 bg-white border-2 rounded-lg shadow-lg max-h-56 overflow-y-auto" style={{ borderColor: '#E1DDD1' }}>
                        {cities.filter(c => c.toLowerCase().includes(stayDestination.toLowerCase())).slice(0, 8).map((city) => (
                          <div
                            key={city}
                            onClick={() => {
                              setStayDestination(city)
                              setShowStayDestDropdown(false)
                              if (stayErrors.destination) setStayErrors((prev) => ({ ...prev, destination: '' }))
                            }}
                            className="px-4 py-2 cursor-pointer hover:bg-[#F4F1E6] text-sm font-medium text-[#292A25]"
                          >
                            {city}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Check-In Date */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Check-In Date</label>
                    <input
                      type="date"
                      min={getTodayIsoDate()}
                      value={stayCheckIn}
                      onChange={(e) => {
                        setStayCheckIn(e.target.value)
                        if (stayErrors.checkIn) setStayErrors((prev) => ({ ...prev, checkIn: '' }))
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold ${
                        stayErrors.checkIn ? 'border-red-500' : ''
                      }`}
                      style={{ borderColor: stayErrors.checkIn ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                    />
                    {stayErrors.checkIn && (
                      <p className="text-xs text-red-600 mt-1 font-semibold">{stayErrors.checkIn}</p>
                    )}
                  </div>

                  {/* Check-Out Date */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Check-Out Date</label>
                    <input
                      type="date"
                      min={stayCheckIn || getTodayIsoDate()}
                      value={stayCheckOut}
                      onChange={(e) => {
                        setStayCheckOut(e.target.value)
                        if (stayErrors.checkOut) setStayErrors((prev) => ({ ...prev, checkOut: '' }))
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold ${
                        stayErrors.checkOut ? 'border-red-500' : ''
                      }`}
                      style={{ borderColor: stayErrors.checkOut ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                    />
                    {stayErrors.checkOut && (
                      <p className="text-xs text-red-600 mt-1 font-semibold">{stayErrors.checkOut}</p>
                    )}
                  </div>

                  {/* Guests */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Guests</label>
                    <select
                      value={stayGuests}
                      onChange={(e) => setStayGuests(Number(e.target.value))}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold"
                      style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Guest' : 'Guests'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rooms */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Rooms</label>
                    <select
                      value={stayRooms}
                      onChange={(e) => {
                        setStayRooms(Number(e.target.value))
                        if (stayErrors.rooms) setStayErrors((prev) => ({ ...prev, rooms: '' }))
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold ${
                        stayErrors.rooms ? 'border-red-500' : ''
                      }`}
                      style={{ borderColor: stayErrors.rooms ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Room' : 'Rooms'}
                        </option>
                      ))}
                    </select>
                    {stayErrors.rooms && (
                      <p className="text-xs text-red-600 mt-1 font-semibold">{stayErrors.rooms}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSearchStays}
                  disabled={stayIsLoading}
                  className="w-full mt-6 py-4 text-white font-bold rounded-lg transition shadow-lg text-lg hover:shadow-xl transform hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: '#526B57' }}
                >
                  {stayIsLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Searching Verified Hotels...</span>
                    </>
                  ) : (
                    <span>🔍 Search Hotels & Resorts</span>
                  )}
                </button>

                {stayEnvelope?.notice && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold">
                    ℹ️ {stayEnvelope.notice}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results Area (Step 42 & 43: Refactored props, zero fake booking alerts) */}
          <FlightHotelResults 
            bookingArea={bookingArea}
            transportMode={transportMode}
            flightEnvelope={flightEnvelope}
            stayEnvelope={stayEnvelope}
            trainEnvelope={trainEnvelope}
            busEnvelope={busEnvelope}
            isLoading={
              bookingArea === 'STAY' 
                ? stayIsLoading 
                : transportMode === 'TRAINS' 
                  ? trainIsLoading 
                  : transportMode === 'BUSES'
                    ? busIsLoading
                    : flightIsLoading
            }
            onRetry={
              bookingArea === 'STAY' 
                ? handleSearchStays 
                : transportMode === 'TRAINS' 
                  ? handleSearchTrains 
                  : transportMode === 'BUSES'
                    ? handleSearchBuses
                    : handleSearchFlights
            }
            onTrackTicket={handleTrackTicket}
            onTrackHotel={handleTrackHotel}
            staySearchMeta={{
              destination: stayDestination,
              checkIn: stayCheckIn,
              checkOut: stayCheckOut,
              guests: stayGuests,
              rooms: stayRooms,
            }}
            trainSearchMeta={{
              date: trainDate,
              class: trainClass,
              quota: trainQuota,
              travelers: trainTravelers,
            }}
            busSearchMeta={{
              date: busDate,
              category: busCategory,
              travelers: busTravelers,
            }}
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div 
            onClick={() => {
              setTrackModalSection('TRAVEL');
              setShowTrackTicketModal(true);
            }}
            className="bg-white rounded-xl shadow-lg p-6 border-t-4 transition hover:shadow-xl cursor-pointer group hover:scale-[1.02] duration-200 focus:outline-none focus:ring-2 focus:ring-[#526B57]" 
            style={{ borderColor: '#526B57' }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowTrackTicketModal(true);
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div className="text-3xl mb-2 transition-transform duration-200 group-hover:scale-110">🎫</div>
              {(trackedTickets.length > 0 || trackedHotels.length > 0) && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#526B57] text-white shadow-xs">
                  {trackedTickets.length + trackedHotels.length} {trackedTickets.length + trackedHotels.length === 1 ? 'Booking' : 'Bookings'}
                </span>
              )}
            </div>
            <h3 className="font-bold text-lg mb-1 flex items-center justify-between" style={{ fontFamily: 'Playfair Display, serif', color: '#292A25' }}>
              <span>Track Bookings</span>
              <span className="text-xs text-[#526B57] font-sans font-normal group-hover:translate-x-1 transition-transform">Check Status →</span>
            </h3>
            <p className="text-sm" style={{ color: '#526B57' }}>Check your booking status</p>
          </div>
          <Link
            href="/offers"
            className="bg-white rounded-xl shadow-lg p-6 border-t-4 transition hover:shadow-xl block cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#C6A96B]"
            style={{ borderColor: '#C6A96B' }}
          >
            <div className="text-3xl mb-2 transition-transform duration-200 group-hover:scale-110">💰</div>
            <h3 className="font-bold text-lg mb-1 flex items-center justify-between" style={{ fontFamily: 'Playfair Display, serif', color: '#292A25' }}>
              <span>Best Deals</span>
              <span className="text-xs text-[#526B57] font-sans font-normal group-hover:translate-x-1 transition-transform">Explore →</span>
            </h3>
            <p className="text-sm" style={{ color: '#526B57' }}>Save on your bookings with exclusive coupons</p>
          </Link>
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 transition hover:shadow-xl" style={{ borderColor: '#526B57' }}>
            <div className="text-3xl mb-2">📞</div>
            <h3 className="font-bold text-lg mb-1" style={{ fontFamily: 'Playfair Display, serif', color: '#292A25' }}>Customer Support</h3>
            <p className="text-sm font-medium mb-3" style={{ color: '#526B57' }}>24/7 assistance available</p>
            <div className="space-y-1 text-xs border-t pt-2.5" style={{ borderColor: '#E1DDD1' }}>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[#263D32]">✉️ Email:</span>
                <a href="mailto:xploraAI@gmail.com" className="hover:underline text-[#526B57] font-medium">xploraAI@gmail.com</a>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[#263D32]">📱 Contact:</span>
                <a href="tel:+918007595006" className="hover:underline text-[#526B57] font-medium">+91 8007595006</a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#263D32] text-white py-12 border-t border-[#E1DDD1]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm opacity-80">© 2026 XPLORA AI Travel Companion. All rights reserved.</p>
        </div>
      </footer>

      {/* My Saved Trips Window Modal */}
      <MyTripsModal
        isOpen={showMyTripsModal}
        onClose={() => setShowMyTripsModal(false)}
        currentUser={currentUser}
        onSelectTrip={handleSelectSavedTrip}
      />

      {/* Track Bookings Window Modal */}
      <TrackTicketModal
        isOpen={showTrackTicketModal}
        onClose={() => setShowTrackTicketModal(false)}
        tickets={trackedTickets}
        hotels={trackedHotels}
        onRemoveTicket={handleRemoveTicket}
        onUpdatePnr={handleUpdatePnr}
        onAddTicket={handleAddManualTicket}
        onRemoveHotel={handleRemoveHotel}
        onUpdateHotelRef={handleUpdateHotelRef}
        onAddHotel={handleAddManualHotel}
        initialSection={trackModalSection}
      />

      {/* Floating Ticket / Booking Tracked Toast Notification */}
      {ticketToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#263D32] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/40 flex items-center gap-3 animate-slideUp">
          <span className="text-xl">{ticketToast.type === 'HOTEL' ? '🏨' : '🎟️'}</span>
          <div>
            <div className="text-xs font-bold text-emerald-300">
              {ticketToast.type === 'HOTEL' ? 'Hotel Tracked' : 'Ticket Tracked'}
            </div>
            <div className="text-xs text-white">{ticketToast.message}</div>
          </div>
          <button 
            onClick={() => {
              if (ticketToast.type === 'HOTEL') {
                setTrackModalSection('HOTEL');
              } else {
                setTrackModalSection('TRAVEL');
              }
              setShowTrackTicketModal(true);
            }}
            className="ml-2 px-2.5 py-1 text-xs font-bold rounded bg-[#C6A96B] text-[#263D32] hover:bg-[#d8bb7a] transition cursor-pointer"
          >
            View
          </button>
          <button 
            onClick={() => setTicketToast(null)}
            className="text-white/60 hover:text-white text-sm cursor-pointer p-1"
            aria-label="Dismiss toast"
          >
            ✕
          </button>
        </div>
      )}

      {/* Step 3.3 Floating AI Assistant Chatbot */}
      <AIChatDrawer
        currentItinerary={generatedPlan}
        currentUser={currentUser}
        onUpdateItinerary={(newPlan) => setGeneratedPlan(newPlan)}
        onCreateTripFromChat={handleCreateTripFromChat}
        onExecuteActionCommand={handleExecuteActionCommand}
      />
    </div>
  )
}
