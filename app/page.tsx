'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { ConfirmParsedDetailsModal } from '@/components/ConfirmParsedDetailsModal'
import { WeatherSwapBanner } from '@/components/WeatherSwapBanner'

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
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null)

  // AI Itinerary Generator State
  const [aiDestination, setAiDestination] = useState('Goa')
  const [aiDuration, setAiDuration] = useState(3)
  const [aiBudget, setAiBudget] = useState(25000)
  const [aiTravelStyle, setAiTravelStyle] = useState('Adventure')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<any>(null)
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
  const [nlQueryPrompt, setNlQueryPrompt] = useState('Plan a 4-day trip to Goa for 2 people under ₹30,000')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [parsedDetailsData, setParsedDetailsData] = useState<any>(null)
  const [clarifyingQuestionMsg, setClarifyingQuestionMsg] = useState<string | null>(null)
  const [isParsingNL, setIsParsingNL] = useState(false)

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('xplora_user') : null
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr))
      } catch (e) {
        console.error('Failed to parse user session:', e)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('xplora_user')
    setCurrentUser(null)
    setSaveSuccess(false)
  }

  const handleGeneratePlan = async (overrideDest?: string, overrideBudget?: number) => {
    const targetDest = overrideDest || aiDestination || tripInput || 'Goa'
    const targetBudget = overrideBudget || Number(aiBudget) || 25000
    const requestedDays = Math.min(Math.max(Number(aiDuration) || 3, 1), 30)
    setIsGenerating(true)
    setGeneratedPlan(null)
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
      }
    } catch (err) {
      console.error('Failed to generate plan:', err)
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

  const handleParseNLQuery = async () => {
    if (!nlQueryPrompt.trim() || isParsingNL) return
    setIsParsingNL(true)
    setClarifyingQuestionMsg(null)

    try {
      const res = await fetch('/api/parse-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: nlQueryPrompt }),
      })
      const data = await res.json()

      if (res.ok) {
        if (data.hasMissingFields) {
          setClarifyingQuestionMsg(data.clarifyingQuestion)
        } else {
          setParsedDetailsData(data.entities)
          setShowConfirmModal(true) // Activates Screen 2 in-page section
        }
      }
    } catch (e) {
      console.error('NLP Parse error:', e)
    } finally {
      setIsParsingNL(false)
    }
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
      <header className="bg-white/95 backdrop-blur-sm shadow-sm" style={{ borderBottom: '2px solid #E1DDD1' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img src="/logo.png" alt="XPLORA" className="h-16 w-16 rounded-full object-cover" />
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowMyTripsModal(true)}
                className="px-4 py-2 hover:text-[#C6A96B] transition text-sm font-medium flex items-center gap-1.5" 
                style={{ color: '#263D32' }}
              >
                🧳 My Trips
              </button>
              <button className="px-4 py-2 hover:text-[#C6A96B] transition text-sm font-medium" style={{ color: '#263D32' }}>
                Offers
              </button>
              <button className="flex items-center gap-2 px-4 py-2 hover:text-[#C6A96B] transition text-sm font-medium" style={{ color: '#263D32' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#263D32]">
                    👤 Welcome, <span className="text-[#526B57]">{currentUser.name}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-1.5 text-xs font-semibold border rounded-lg transition hover:bg-red-50 text-red-600 border-red-200"
                  >
                    Logout
                  </button>
                  <DarkModeToggle />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link 
                    href="/login" 
                    className="px-5 py-2 text-white rounded-lg transition font-medium inline-block"
                    style={{ backgroundColor: '#526B57' }} 
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#263D32'} 
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#526B57'}
                  >
                    Login / Sign Up
                  </Link>
                  <DarkModeToggle />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 px-4">
          <div id="ai-trip-planner" className="max-w-4xl mx-auto">
            {/* Card Container */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border p-8 md:p-10" style={{ borderColor: '#E1DDD1' }}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-[#263D32] text-white shadow-xs mb-3 border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse"></span>
                  <span>XPLORA Intelligence Engine v2.4</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#263D32' }}>
                  Intelligent Itinerary Generator
                </h1>
                <p className="text-sm md:text-base font-medium max-w-xl mx-auto" style={{ color: '#526B57' }}>
                  Architect personalized travel itineraries with real-time weather forecasts, verified flight options, hotel bookings, and interactive visual route mapping.
                </p>
              </div>

              {/* Screen 1: Natural Language Query Input Box */}
              <div className="mb-6 p-4 rounded-xl bg-[#F4F1E6]/60 border border-[#E1DDD1]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#526B57] mb-2">
                  🧠 Screen 1 of 3: AI Natural Language Query
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nlQueryPrompt}
                    onChange={(e) => setNlQueryPrompt(e.target.value)}
                    placeholder="e.g. Plan a 4-day trip to Goa for 2 people under ₹30,000..."
                    className="flex-1 px-4 py-3 rounded-xl border bg-white font-medium text-sm text-[#263D32] focus:outline-none shadow-xs"
                    style={{ borderColor: '#E1DDD1' }}
                  />
                  <button
                    onClick={handleParseNLQuery}
                    disabled={isParsingNL || !nlQueryPrompt.trim()}
                    className="px-6 py-3 text-xs font-bold text-white rounded-xl shadow-md transition hover:scale-105 disabled:opacity-50 shrink-0"
                    style={{ backgroundColor: '#526B57' }}
                  >
                    {isParsingNL ? 'AI Parsing...' : 'Parse & Confirm ➔'}
                  </button>
                </div>

                {clarifyingQuestionMsg && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
                    <span>🤔 AI Follow-up:</span>
                    <span>{clarifyingQuestionMsg}</span>
                  </div>
                )}
              </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                {/* Destination Input */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Destination</label>
                  <input
                    type="text"
                    placeholder="e.g. Paris, Goa, Tokyo"
                    value={aiDestination}
                    onChange={(e) => setAiDestination(e.target.value)}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none bg-white font-medium"
                    style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                  />
                </div>

                {/* Schedule Date */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Schedule Date</label>
                  <input
                    type="date"
                    value={aiTravelDate}
                    onChange={(e) => setAiTravelDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none bg-white font-medium"
                    style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                  />
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
                    onChange={(e) => setAiDuration(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none bg-white font-medium"
                    style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                    placeholder="e.g. 3"
                  />
                </div>

                {/* Budget Typing Input */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>
                    Max Budget (₹)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={aiBudget}
                    onChange={(e) => setAiBudget(Math.max(1000, Number(e.target.value)))}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none bg-white font-medium"
                    style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                    placeholder="e.g. 25000"
                  />
                </div>

                {/* Travel Style */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>Travel Style</label>
                  <select
                    value={aiTravelStyle}
                    onChange={(e) => setAiTravelStyle(e.target.value)}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none bg-white font-medium"
                    style={{ borderColor: '#E1DDD1', color: '#292A25' }}
                  >
                    <option value="Adventure">🧗 Adventure</option>
                    <option value="Family">👨‍👩‍👧 Family</option>
                    <option value="Solo">🎒 Solo Explorer</option>
                    <option value="Luxury">✨ Luxury</option>
                    <option value="Budget-Friendly">🌿 Budget Friendly</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={() => handleGeneratePlan()}
                disabled={isGenerating}
                className="w-full py-4 text-white font-bold rounded-lg transition shadow-lg hover:shadow-xl transform hover:scale-[1.01] flex items-center justify-center gap-2"
                style={{ backgroundColor: '#526B57' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#263D32'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#526B57'}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>AI Agent Crafting your Itinerary...</span>
                  </>
                ) : (
                  <span>🚀 Generate AI Trip Itinerary</span>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Generated Itinerary Section (Screen 3) */}
        {generatedPlan && (
          <section className="mt-12 bg-white rounded-2xl shadow-xl p-8 border" style={{ borderColor: '#E1DDD1' }}>
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
                        Budget Calculator Tracker
                      </h4>
                      <p className="text-sm font-bold text-[#263D32]">
                        Est. Cost: <span className="text-sm font-bold text-[#526B57]">₹{generatedPlan.estimatedCost?.toLocaleString('en-IN')}</span> / ₹{generatedPlan.totalBudget?.toLocaleString('en-IN')} {generatedPlan.currency}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                    generatedPlan.estimatedCost <= generatedPlan.totalBudget 
                      ? 'bg-[#526B57] text-white' 
                      : 'bg-red-600 text-white'
                  }`}>
                    {generatedPlan.estimatedCost <= generatedPlan.totalBudget ? '✓ Within Budget' : '⚠️ Over Budget'}
                  </span>
                </div>

                {/* Progress Bar & Summary Box */}
                <div className="p-3 rounded-lg bg-white border border-[#526B57]/20">
                  <div className="flex justify-between items-center text-[11px] uppercase tracking-wider font-bold text-[#526B57] mb-1.5">
                    <span>Budget Utilization</span>
                    <span>{Math.min(100, Math.round((generatedPlan.estimatedCost / generatedPlan.totalBudget) * 100))}% Used</span>
                  </div>

                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, Math.round((generatedPlan.estimatedCost / generatedPlan.totalBudget) * 100))}%`,
                        backgroundColor: generatedPlan.estimatedCost <= generatedPlan.totalBudget ? '#526B57' : '#ef4444'
                      }}
                    />
                  </div>

                  <div className="text-xs font-medium text-[#263D32]">
                    {generatedPlan.estimatedCost <= generatedPlan.totalBudget 
                      ? `🎉 Saved ₹${(generatedPlan.totalBudget - generatedPlan.estimatedCost)?.toLocaleString('en-IN')} within your maximum budget limit.`
                      : '⚠️ Estimated cost exceeds max budget limit.'}
                  </div>
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
              />
            )}

            {/* Day-by-Day Timeline */}
            <h3 className="text-xl font-bold mb-4 text-[#263D32]" style={{ fontFamily: 'Playfair Display, serif' }}>
              🗓️ Day-by-Day Detailed Itinerary
            </h3>

            <div className="space-y-6">
              {generatedPlan.dayPlans?.map((dp: any) => (
                <div key={dp.dayNumber} className="border rounded-xl p-6 bg-white shadow-sm" style={{ borderColor: '#E1DDD1' }}>
                  <div className="flex justify-between items-center mb-4 border-b pb-3" style={{ borderColor: '#E1DDD1' }}>
                    <h4 className="text-lg font-bold text-[#263D32]">
                      Day {dp.dayNumber}: {dp.summary}
                    </h4>
                    <span className="text-xs px-3 py-1 rounded-full font-medium bg-[#526B57]/10 text-[#526B57]">
                      {dp.activities.length} Activities
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dp.activities?.map((act: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-lg bg-[#F4F1E6]/30 border border-[#E1DDD1] flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-[#526B57] border border-[#E1DDD1]">
                              {act.timeSlot}
                            </span>
                            <span className="text-xs font-bold text-[#C6A96B]">₹{act.cost?.toLocaleString('en-IN')}</span>
                          </div>
                          <h5 className="font-bold text-sm text-[#292A25] mb-1">{act.title}</h5>
                          <p className="text-xs text-gray-600 mb-2">{act.description}</p>
                        </div>
                        <div className="text-[11px] font-medium text-gray-500 flex items-center gap-1 mt-2 border-t pt-2" style={{ borderColor: '#E1DDD1' }}>
                          <span>📍 {act.location}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Popular Destinations - True Continuous Marquee */}
        <section className="py-12 overflow-hidden" style={{ background: 'linear-gradient(to bottom, transparent, rgba(82, 107, 87, 0.05), transparent)' }}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#263D32' }}>
              Popular Destinations
            </h2>
            <p style={{ color: '#526B57' }}>Explore India's most beautiful destinations • Click any card to plan a trip with AI!</p>
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
          <div className="flex" style={{ borderBottom: '2px solid #E1DDD1' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-base font-semibold transition ${
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
                <span className="text-2xl">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Booking Form */}
          <div className="p-8">
            <div className={`grid ${showToField ? 'grid-cols-[1fr,auto,1fr,1fr,1fr,1fr]' : 'grid-cols-4'} gap-4 items-end`}>
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
                <button
                  onClick={swapCities}
                  className="mb-1 p-3 text-white rounded-xl transition shadow-md"
                  style={{ backgroundColor: '#C6A96B' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#526B57'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C6A96B'}
                  title="Swap cities"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>
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
        <div className="grid grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4" style={{ borderColor: '#526B57' }}>
            <div className="text-3xl mb-2">🎫</div>
            <h3 className="font-bold text-lg mb-1" style={{ fontFamily: 'Playfair Display, serif', color: '#292A25' }}>Track Ticket</h3>
            <p className="text-sm" style={{ color: '#526B57' }}>Check your booking status</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4" style={{ borderColor: '#C6A96B' }}>
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-bold text-lg mb-1" style={{ fontFamily: 'Playfair Display, serif', color: '#292A25' }}>Best Deals</h3>
            <p className="text-sm" style={{ color: '#526B57' }}>Save on your bookings</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4" style={{ borderColor: '#526B57' }}>
            <div className="text-3xl mb-2">📞</div>
            <h3 className="font-bold text-lg mb-1" style={{ fontFamily: 'Playfair Display, serif', color: '#292A25' }}>Customer Support</h3>
            <p className="text-sm" style={{ color: '#526B57' }}>24/7 assistance available</p>
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
