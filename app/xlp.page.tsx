'use client'

import { useState } from 'react'
import Logo from '@/components/Logo'

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
  const [aiTravelDate, setAiTravelDate] = useState('')
  const [aiReturnDate, setAiReturnDate] = useState('')
  const [showFromDropdown, setShowFromDropdown] = useState(false)
  const [showToDropdown, setShowToDropdown] = useState(false)
  const [showHomeCityDropdown, setShowHomeCityDropdown] = useState(false)

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
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-sky-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Logo width={120} className="rounded-lg" />
            </div>
            
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-slate-700 hover:text-sky-600 transition text-sm font-medium">
                My Trips
              </button>
              <button className="px-4 py-2 text-slate-700 hover:text-sky-600 transition text-sm font-medium">
                Offers
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-sky-600 transition text-sm font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
              <button className="px-5 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition font-medium">
                Login / Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Banner with Background Image */}
        <div className="relative rounded-2xl shadow-2xl overflow-hidden mb-8" style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          <div className="absolute inset-0 bg-gradient-to-r from-sky-600/95 to-teal-600/95"></div>
          <div className="relative p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">🤖</div>
              <div>
                <h2 className="text-3xl font-bold">AI Travel Companion</h2>
                <p className="text-sky-100">Let AI plan your perfect trip with flights, hotels & activities</p>
              </div>
            </div>

          <div className="bg-white rounded-xl p-6 mt-6">
            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* Home City Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-2">Your City</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Select your city"
                    value={homeCity}
                    onChange={(e) => {
                      setHomeCity(e.target.value)
                      setShowHomeCityDropdown(true)
                    }}
                    onFocus={() => setShowHomeCityDropdown(true)}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none text-slate-800"
                  />
                  <span className="absolute right-3 top-3 text-slate-400">📍</span>
                  {showHomeCityDropdown && filteredHomeCities.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredHomeCities.map((city) => (
                        <div
                          key={city}
                          onClick={() => handleCitySelect(city, 'home')}
                          className="px-4 py-2 hover:bg-sky-50 cursor-pointer text-slate-700"
                        >
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Travel Dates */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Travel Dates</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Return Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none text-slate-800"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Describe your trip</label>
              <input
                type="text"
                placeholder="e.g., Plan a beach vacation to Goa for 2 people with water sports"
                value={tripInput}
                onChange={(e) => setTripInput(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none text-slate-800"
              />
            </div>

            <button className="w-full py-4 bg-gradient-to-r from-sky-500 to-teal-500 text-white font-bold rounded-lg hover:from-sky-600 hover:to-teal-600 transition shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
              🚀 Generate AI Trip Plan
            </button>
          </div>
          </div>
        </div>

        {/* Booking Tabs */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b-2 border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-base font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-sky-500 text-white border-b-4 border-amber-500'
                    : 'text-slate-600 hover:bg-sky-50'
                }`}
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
                <label className="block text-sm font-medium text-slate-700 mb-2">{labels.from}</label>
                <input
                  type="text"
                  placeholder={`Enter ${labels.from.toLowerCase()}`}
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value)
                    setShowFromDropdown(true)
                  }}
                  onFocus={() => setShowFromDropdown(true)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none font-semibold text-slate-800"
                />
                {showFromDropdown && filteredCitiesFrom.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCitiesFrom.map((city) => (
                      <div
                        key={city}
                        onClick={() => handleCitySelect(city, 'from')}
                        className="px-4 py-2 hover:bg-sky-50 cursor-pointer text-slate-700"
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
                  className="mb-1 p-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition shadow-md"
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">{labels.to}</label>
                  <input
                    type="text"
                    placeholder={`Enter ${labels.to.toLowerCase()}`}
                    value={to}
                    onChange={(e) => {
                      setTo(e.target.value)
                      setShowToDropdown(true)
                    }}
                    onFocus={() => setShowToDropdown(true)}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none font-semibold text-slate-800"
                  />
                  {showToDropdown && filteredCitiesTo.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCitiesTo.map((city) => (
                        <div
                          key={city}
                          onClick={() => handleCitySelect(city, 'to')}
                          className="px-4 py-2 hover:bg-sky-50 cursor-pointer text-slate-700"
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
                <label className="block text-sm font-medium text-slate-700 mb-2">{labels.departure}</label>
                <input
                  type="date"
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none font-semibold text-slate-800"
                />
              </div>

              {/* Return */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{labels.return}</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none font-semibold text-slate-800"
                />
              </div>

              {/* Travelers & Class */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{labels.travelers}</label>
                <select
                  value={travellers}
                  onChange={(e) => setTravellers(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none font-semibold text-slate-800 mb-2"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Traveler' : 'Travelers'}</option>
                  ))}
                </select>
                <select
                  value={classType}
                  onChange={(e) => setClassType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none text-slate-800"
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

            <button className="w-full mt-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:from-amber-600 hover:to-orange-600 transition shadow-lg text-lg hover:shadow-xl transform hover:scale-[1.02]">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()}
              </span>
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-sky-500">
            <div className="text-3xl mb-2">🎫</div>
            <h3 className="font-bold text-lg text-slate-800 mb-1">Track Ticket</h3>
            <p className="text-sm text-slate-600">Check your booking status</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-teal-500">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-bold text-lg text-slate-800 mb-1">Best Deals</h3>
            <p className="text-sm text-slate-600">Save on your bookings</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-amber-500">
            <div className="text-3xl mb-2">📞</div>
            <h3 className="font-bold text-lg text-slate-800 mb-1">Customer Support</h3>
            <p className="text-sm text-slate-600">24/7 assistance available</p>
          </div>
        </div>
      </main>

      <footer className="bg-slate-800 text-white mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-4">
            <Logo width={80} className="rounded-lg opacity-90" />
          </div>
          <p className="text-slate-400">© 2026 XPLORA - Your AI Travel Companion</p>
          <p className="text-slate-500 text-sm mt-2">Explore. Plan. Experience.</p>
        </div>
      </footer>
    </div>
  )
}
