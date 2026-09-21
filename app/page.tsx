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
import { AIChatDrawer } from '@/components/AIChatDrawer'
import { InteractiveMap } from '@/components/InteractiveMap'
import { FlightOption } from '@/app/api/flights/route'
import { HotelOption } from '@/app/api/hotels/route'
import { exportItineraryToPDF, exportToGoogleCalendar, exportToICS } from '@/lib/exportUtils'
import { SUPPORTED_CURRENCIES, convertAmount } from '@/lib/currencyUtils'
import { ExpenseTracker } from '@/components/ExpenseTracker'
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

  // Auth User Session State
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; image?: string | null } | null>(null)

  // AI Itinerary Generator State
  const [aiDestination, setAiDestination] = useState('Goa')
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

    const targetDest = (overrideDest || aiDestination || 'Goa').trim()
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

  const handleSelectPopularDestination = (destName: string) => {
    setAiDestination(destName)
    const formElem = document.getElementById('ai-trip-planner')
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' })
    }
    handleGeneratePlan(destName)
  }

  const handleCreateTripFromChat = (params: {
    destination: string;
    from: string;
    durationDays: number;
    budget?: number;
    travelStyle: string;
    startDate: string;
  }) => {
    setAiDestination(params.destination)
    setFrom(params.from)
    setTo(params.destination)
    setAiDuration(params.durationDays)
    if (params.budget) setAiBudget(params.budget)
    setAiTravelStyle(params.travelStyle)
    if (params.startDate) setAiTravelDate(params.startDate)

    const formElem = document.getElementById('ai-trip-planner')
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' })
    }

    // 1. Generate AI Itinerary using updated destination AND updated budget!
    handleGeneratePlan(params.destination, params.budget)

    // 2. Fetch Flights & Hotels for the route
    setIsSearchLoading(true)
    fetch(`/api/flights?from=${encodeURIComponent(params.from)}&to=${encodeURIComponent(params.destination)}&date=${params.startDate || '2026-09-01'}`)
      .then((r) => r.json())
      .then((data) => setFlightsResults(data.flights || []))
      .catch((e) => console.error('Flight search error:', e))

    fetch(`/api/hotels?destination=${encodeURIComponent(params.destination)}&checkIn=${params.startDate || '2026-09-01'}`)
      .then((r) => r.json())
      .then((data) => setHotelsResults(data.hotels || []))
      .catch((e) => console.error('Hotel search error:', e))
      .finally(() => setIsSearchLoading(false))
  }

  const handleConfirmModalSubmit = (confirmed: any) => {
    setShowConfirmModal(false)
    setAiDestination(confirmed.destination)
    setAiTravelDate(confirmed.startDate)
    setAiDuration(confirmed.durationDays)
    setAiBudget(confirmed.budget)
    setAiTravelStyle(confirmed.interests?.[0] || 'Adventure')

    // Trigger Itinerary & Flights/Hotels Search for confirmed parameters
    handleCreateTripFromChat({
      destination: confirmed.destination,
      from: from || 'Pune',
      durationDays: confirmed.durationDays,
      budget: confirmed.budget,
      travelStyle: confirmed.interests?.[0] || 'Adventure',
      startDate: confirmed.startDate,
    })
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

  const handleSearchServices = async () => {
    setIsSearchLoading(true)
    try {
      if (activeTab === 'FLIGHTS') {
        const res = await fetch(`/api/flights?from=${encodeURIComponent(from || 'Delhi')}&to=${encodeURIComponent(to || 'Goa')}&date=${departure || '2026-09-01'}`)
        const data = await res.json()
        setFlightsResults(data.flights || [])
      } else if (activeTab === 'HOTELS') {
        const res = await fetch(`/api/hotels?destination=${encodeURIComponent(from || 'Goa')}&checkIn=${departure || '2026-09-01'}`)
        const data = await res.json()
        setHotelsResults(data.hotels || [])
      }
    } catch (err) {
      console.error('Service search error:', err)
    } finally {
      setIsSearchLoading(false)
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
          userId: currentUser.id,
          dayPlans: generatedPlan.dayPlans,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setAuthErrorMsg(data.error || 'Failed to save itinerary.')
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
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border p-8 md:p-10" style={{ borderColor: '#E1DDD1' }}>
              {/* Task B: Interactive Hero Heading */}
              <HeroHeading />

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
                  <input
                    type="text"
                    placeholder="e.g. Paris, Goa, Tokyo"
                    value={aiDestination}
                    onChange={(e) => {
                      setAiDestination(e.target.value)
                      if (formErrors.destination) setFormErrors((prev) => ({ ...prev, destination: undefined }))
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none bg-white font-medium ${
                      formErrors.destination ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    style={{ borderColor: formErrors.destination ? '#EF4444' : '#E1DDD1', color: '#292A25' }}
                  />
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

        {/* Booking Tabs */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ border: '1px solid #E1DDD1' }}>
          {/* Tab Headers */}
          <div className="flex overflow-x-auto no-scrollbar" style={{ borderBottom: '2px solid #E1DDD1' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[110px] sm:min-w-[130px] flex items-center justify-center gap-2 py-3.5 sm:py-4 px-3 text-sm sm:text-base font-semibold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-white border-b-4'
                    : 'hover:bg-[#F4F1E6]'
                }`}
                style={activeTab === tab.id ? { 
                  backgroundColor: '#526B57',
                  borderColor: '#C6A96B',
                  color: '#FFFFFF'
                } : { 
                  color: '#292A25'
                }}
              >
                <span className="text-xl sm:text-2xl">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Booking Form */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${showToField ? 'lg:grid-cols-3 xl:grid-cols-[1.2fr,auto,1.2fr,1fr,1fr,1.2fr]' : 'lg:grid-cols-4'} gap-4 items-end`}>
              {/* From */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>{labels.from}</label>
                <input
                  type="text"
                  placeholder={`Enter ${labels.from.toLowerCase()}`}
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value)
                    setShowFromDropdown(true)
                  }}
                  onFocus={() => setShowFromDropdown(true)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold"
                  style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                  onFocusCapture={(e) => e.target.style.borderColor = '#526B57'}
                  onBlurCapture={(e) => e.target.style.borderColor = '#E1DDD1'}
                />
                {showFromDropdown && filteredCitiesFrom.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 rounded-lg shadow-lg max-h-60 overflow-y-auto" style={{ borderColor: '#E1DDD1' }}>
                    {filteredCitiesFrom.map((city) => (
                      <div
                        key={city}
                        onClick={() => handleCitySelect(city, 'from')}
                        className="px-4 py-2 cursor-pointer"
                        style={{ color: '#292A25' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F4F1E6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {city}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Swap Button - Centered between From and To */}
              {showToField && (
                <div className="flex justify-center items-center sm:col-span-2 lg:col-span-3 xl:col-span-1 py-1 xl:py-0">
                  <button
                    type="button"
                    onClick={swapCities}
                    className="p-3 text-white rounded-xl transition shadow-md hover:scale-105"
                    style={{ backgroundColor: '#C6A96B' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#526B57'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C6A96B'}
                    title="Swap cities"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                </div>
              )}

              {/* To */}
              {showToField && (
                <div className="relative">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>{labels.to}</label>
                  <input
                    type="text"
                    placeholder={`Enter ${labels.to.toLowerCase()}`}
                    value={to}
                    onChange={(e) => {
                      setTo(e.target.value)
                      setShowToDropdown(true)
                    }}
                    onFocus={() => setShowToDropdown(true)}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold"
                    style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                    onFocusCapture={(e) => e.target.style.borderColor = '#526B57'}
                    onBlurCapture={(e) => e.target.style.borderColor = '#E1DDD1'}
                  />
                  {showToDropdown && filteredCitiesTo.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 rounded-lg shadow-lg max-h-60 overflow-y-auto" style={{ borderColor: '#E1DDD1' }}>
                      {filteredCitiesTo.map((city) => (
                        <div
                          key={city}
                          onClick={() => handleCitySelect(city, 'to')}
                          className="px-4 py-2 cursor-pointer"
                          style={{ color: '#292A25' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F4F1E6'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Departure */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>{labels.departure}</label>
                <input
                  type="date"
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold"
                  style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                  onFocusCapture={(e) => e.target.style.borderColor = '#526B57'}
                  onBlurCapture={(e) => e.target.style.borderColor = '#E1DDD1'}
                />
              </div>

              {/* Return */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>{labels.return}</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold"
                  style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                  onFocusCapture={(e) => e.target.style.borderColor = '#526B57'}
                  onBlurCapture={(e) => e.target.style.borderColor = '#E1DDD1'}
                />
              </div>

              {/* Travelers & Class */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>{labels.travelers}</label>
                <select
                  value={travellers}
                  onChange={(e) => setTravellers(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-semibold mb-2"
                  style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                  onFocusCapture={(e) => e.target.style.borderColor = '#526B57'}
                  onBlurCapture={(e) => e.target.style.borderColor = '#E1DDD1'}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Traveler' : 'Travelers'}</option>
                  ))}
                </select>
                <select
                  value={classType}
                  onChange={(e) => setClassType(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none"
                  style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                  onFocusCapture={(e) => e.target.style.borderColor = '#526B57'}
                  onBlurCapture={(e) => e.target.style.borderColor = '#E1DDD1'}
                >
                  {activeTab === 'HOTELS' ? (
                    <>
                      <option>1 Room</option>
                      <option>2 Rooms</option>
                      <option>3 Rooms</option>
                    </>
                  ) : activeTab === 'BUSES' ? (
                    <>
                      <option>Seater</option>
                      <option>Sleeper</option>
                      <option>AC</option>
                    </>
                  ) : (
                    <>
                      <option>Economy</option>
                      <option>Premium Economy</option>
                      <option>Business</option>
                      <option>First Class</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <button 
              onClick={handleSearchServices}
              className="w-full mt-6 py-4 text-white font-bold rounded-lg transition shadow-lg text-lg hover:shadow-xl transform hover:scale-[1.02]"
              style={{ backgroundColor: '#526B57' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#263D32'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#526B57'}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()}
              </span>
            </button>
          </div>

          {/* Step 3.2 Service Search Results */}
          <FlightHotelResults 
            activeTab={activeTab}
            flights={flightsResults}
            hotels={hotelsResults}
            isLoading={isSearchLoading}
            onBook={(item) => alert(`🎉 Booking Confirmed for ${item.airline || item.name}! Details saved.`)}
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 transition hover:shadow-xl" style={{ borderColor: '#526B57' }}>
            <div className="text-3xl mb-2">🎫</div>
            <h3 className="font-bold text-lg mb-1" style={{ fontFamily: 'Playfair Display, serif', color: '#292A25' }}>Track Ticket</h3>
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

      {/* Step 3.3 Floating AI Assistant Chatbot */}
      <AIChatDrawer
        currentItinerary={generatedPlan}
        onUpdateItinerary={(newPlan) => setGeneratedPlan(newPlan)}
        onCreateTripFromChat={handleCreateTripFromChat}
        onExecuteActionCommand={handleExecuteActionCommand}
      />
    </div>
  )
}
