'use client';

import React, { useState } from 'react';
import { FlightOption } from '@/app/api/flights/route';
import { HotelOption } from '@/app/api/hotels/route';

interface FlightHotelResultsProps {
  activeTab: string;
  flights: FlightOption[];
  hotels: HotelOption[];
  isLoading: boolean;
  onBook: (item: any) => void;
}

export function FlightHotelResults({ activeTab, flights, hotels, isLoading, onBook }: FlightHotelResultsProps) {
  // Flight State
  const [flightDisplayCount, setFlightDisplayCount] = useState(6);
  const [flightSortBy, setFlightSortBy] = useState<'price' | 'departure' | 'duration'>('price');
  const [flightNonStopOnly, setFlightNonStopOnly] = useState(false);
  const [flightTimeFilter, setFlightTimeFilter] = useState<'ALL' | 'Morning' | 'Afternoon' | 'Evening' | 'Night'>('ALL');
  const [flightAirlineFilter, setFlightAirlineFilter] = useState<string>('ALL');

  // Hotel State
  const [hotelDisplayCount, setHotelDisplayCount] = useState(6);
  const [hotelSortBy, setHotelSortBy] = useState<'price' | 'rating' | 'distance'>('price');
  const [hotelNearAirport, setHotelNearAirport] = useState(false);
  const [hotelNearBeach, setHotelNearBeach] = useState(false);
  const [hotelMinRating, setHotelMinRating] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8 bg-white rounded-xl shadow-lg border border-[#E1DDD1] mt-6 text-center">
        <div className="w-8 h-8 border-4 border-[#526B57] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-semibold text-[#263D32]">
          Searching live {activeTab.toLowerCase()} recommendations...
        </p>
      </div>
    );
  }

  // --- FLIGHTS RENDERING ---
  if (activeTab === 'FLIGHTS' && flights.length > 0) {
    let filtered = [...flights];

    if (flightNonStopOnly) {
      filtered = filtered.filter((f) => f.stops.toLowerCase().includes('non-stop') || f.isNonStop);
    }
    if (flightTimeFilter !== 'ALL') {
      filtered = filtered.filter((f) => f.timeOfDay === flightTimeFilter);
    }
    if (flightAirlineFilter !== 'ALL') {
      filtered = filtered.filter((f) => f.airline.toLowerCase().includes(flightAirlineFilter.toLowerCase()));
    }

    if (flightSortBy === 'price') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (flightSortBy === 'departure') {
      filtered.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
    }

    const visibleFlights = filtered.slice(0, flightDisplayCount);

    return (
      <div className="bg-white rounded-xl shadow-xl p-6 border border-[#E1DDD1] mt-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-4 gap-3" style={{ borderColor: '#E1DDD1' }}>
          <div>
            <h3 className="text-lg font-bold text-[#263D32]" style={{ fontFamily: 'Playfair Display, serif' }}>
              ✈️ Real-Time Flight Recommendations ({flights.length} Options)
            </h3>
            <p className="text-xs text-[#526B57]">Showing {visibleFlights.length} of {filtered.length} filtered flight options</p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Sort By:</span>
            <select
              value={flightSortBy}
              onChange={(e) => setFlightSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-white text-[#263D32]"
              style={{ borderColor: '#E1DDD1' }}
            >
              <option value="price">💰 Lowest Price</option>
              <option value="departure">⏱️ Departure Time</option>
            </select>
          </div>
        </div>

        {/* Interactive Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-5 p-3 rounded-xl bg-[#F4F1E6]/50 border border-[#E1DDD1]">
          <span className="text-xs font-bold text-[#526B57] mr-1">Filters:</span>

          <button
            onClick={() => setFlightNonStopOnly(!flightNonStopOnly)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
              flightNonStopOnly ? 'bg-[#526B57] text-white border-[#526B57]' : 'bg-white text-[#263D32] border-[#E1DDD1]'
            }`}
          >
            ⚡ Non-Stop Only
          </button>

          {/* Time of Day Pills */}
          {(['ALL', 'Morning', 'Afternoon', 'Evening', 'Night'] as const).map((tod) => (
            <button
              key={tod}
              onClick={() => setFlightTimeFilter(tod)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                flightTimeFilter === tod ? 'bg-[#526B57] text-white border-[#526B57]' : 'bg-white text-[#263D32] border-[#E1DDD1]'
              }`}
            >
              {tod === 'ALL' ? '🕒 Any Time' : tod === 'Morning' ? '🌅 Morning' : tod === 'Afternoon' ? '☀️ Afternoon' : tod === 'Evening' ? '🌆 Evening' : '🌙 Night'}
            </button>
          ))}

          {/* Airline Selector */}
          <select
            value={flightAirlineFilter}
            onChange={(e) => setFlightAirlineFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-white text-[#263D32] ml-auto"
            style={{ borderColor: '#E1DDD1' }}
          >
            <option value="ALL">✈️ All Airlines</option>
            <option value="IndiGo">IndiGo</option>
            <option value="Air India">Air India</option>
            <option value="Vistara">Vistara</option>
            <option value="Akasa">Akasa Air</option>
            <option value="SpiceJet">SpiceJet</option>
          </select>
        </div>

        {/* Flights Cards List */}
        <div className="space-y-3">
          {visibleFlights.map((f) => (
            <div 
              key={f.id}
              className="p-4 rounded-xl border border-[#E1DDD1] bg-[#F4F1E6]/30 hover:bg-[#F4F1E6]/80 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 rounded-xl bg-white border border-[#E1DDD1] shadow-xs">{f.logo}</span>
                <div>
                  <h4 className="font-bold text-[#263D32]">{f.airline} <span className="text-xs font-semibold text-gray-500">({f.flightNumber})</span></h4>
                  <p className="text-xs text-gray-600">{f.from} ➔ {f.to} • <span className="font-semibold text-emerald-700">{f.stops}</span></p>
                </div>
              </div>

              <div className="text-left md:text-center">
                <div className="text-sm font-bold text-[#263D32]">{f.departureTime} — {f.arrivalTime}</div>
                <div className="text-xs text-gray-500">Duration: {f.duration}</div>
              </div>

              <div className="flex items-center justify-between w-full md:w-auto gap-4">
                <div className="text-right">
                  <div className="text-lg font-extrabold text-[#526B57]">₹{f.price.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-gray-500">per traveler</div>
                </div>
                <button
                  onClick={() => onBook(f)}
                  className="px-5 py-2.5 text-xs font-bold text-white rounded-lg shadow-sm transition hover:scale-105"
                  style={{ backgroundColor: '#526B57' }}
                >
                  Select Flight ➔
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {flightDisplayCount < filtered.length && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setFlightDisplayCount((prev) => prev + 6)}
              className="px-6 py-2.5 text-xs font-bold text-[#263D32] bg-[#F4F1E6] hover:bg-[#E1DDD1] border border-[#E1DDD1] rounded-xl transition shadow-xs"
            >
              👇 Load More Flight Recommendations ({filtered.length - flightDisplayCount} remaining)
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- HOTELS RENDERING ---
  if (activeTab === 'HOTELS' && hotels.length > 0) {
    let filtered = [...hotels];

    if (hotelNearAirport) {
      filtered = filtered.filter((h) => h.nearAirport || h.location.toLowerCase().includes('airport'));
    }
    if (hotelNearBeach) {
      filtered = filtered.filter((h) => h.nearBeach || h.location.toLowerCase().includes('beach') || h.name.toLowerCase().includes('ocean') || h.name.toLowerCase().includes('beach'));
    }
    if (hotelMinRating) {
      filtered = filtered.filter((h) => h.rating >= 4.5);
    }

    if (hotelSortBy === 'price') {
      filtered.sort((a, b) => a.pricePerNight - b.pricePerNight);
    } else if (hotelSortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (hotelSortBy === 'distance') {
      filtered.sort((a, b) => (a.distanceKm || 1) - (b.distanceKm || 1));
    }

    const visibleHotels = filtered.slice(0, hotelDisplayCount);

    return (
      <div className="bg-white rounded-xl shadow-xl p-6 border border-[#E1DDD1] mt-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-4 gap-3" style={{ borderColor: '#E1DDD1' }}>
          <div>
            <h3 className="text-lg font-bold text-[#263D32]" style={{ fontFamily: 'Playfair Display, serif' }}>
              🏨 Verified Hotel & Resort Recommendations ({hotels.length} Stays)
            </h3>
            <p className="text-xs text-[#526B57]">Showing {visibleHotels.length} of {filtered.length} filtered hotel stays</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Sort By:</span>
            <select
              value={hotelSortBy}
              onChange={(e) => setHotelSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-white text-[#263D32]"
              style={{ borderColor: '#E1DDD1' }}
            >
              <option value="price">💰 Lowest Price First</option>
              <option value="rating">⭐ Highest User Rating</option>
              <option value="distance">📍 Distance (Nearest First)</option>
            </select>
          </div>
        </div>

        {/* Interactive Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-5 p-3 rounded-xl bg-[#F4F1E6]/50 border border-[#E1DDD1]">
          <span className="text-xs font-bold text-[#526B57] mr-1">Location & Amenities:</span>

          <button
            onClick={() => setHotelNearAirport(!hotelNearAirport)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
              hotelNearAirport ? 'bg-[#526B57] text-white border-[#526B57]' : 'bg-white text-[#263D32] border-[#E1DDD1]'
            }`}
          >
            ✈️ Near Airport
          </button>

          <button
            onClick={() => setHotelNearBeach(!hotelNearBeach)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
              hotelNearBeach ? 'bg-[#526B57] text-white border-[#526B57]' : 'bg-white text-[#263D32] border-[#E1DDD1]'
            }`}
          >
            🌊 Near Beach / Waterfront
          </button>

          <button
            onClick={() => setHotelMinRating(!hotelMinRating)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
              hotelMinRating ? 'bg-[#526B57] text-white border-[#526B57]' : 'bg-white text-[#263D32] border-[#E1DDD1]'
            }`}
          >
            ⭐ 4.5+ Rating Only
          </button>
        </div>

        {/* Hotels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleHotels.map((h) => (
            <div 
              key={h.id}
              className="p-4 rounded-xl border border-[#E1DDD1] bg-white hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <img src={h.image} alt={h.name} className="w-full h-36 object-cover rounded-lg mb-3" />
                <div className="flex justify-between items-start mb-1 gap-2">
                  <div>
                    <h4 className="font-bold text-[#263D32] line-clamp-1">{h.name}</h4>
                    {h.category && (
                      <span className="text-[10px] font-bold text-[#526B57] bg-[#526B57]/10 px-2 py-0.5 rounded">
                        {h.category}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                    ⭐ {h.rating} ({h.reviewsCount})
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">📍 {h.distanceFromCenter}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {h.amenities.map((am, idx) => (
                    <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F4F1E6] text-[#263D32]">
                      {am}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center border-t pt-3 border-[#E1DDD1]">
                <div>
                  <span className="text-base font-extrabold text-[#526B57]">₹{h.pricePerNight.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-gray-500"> / night</span>
                </div>
                <button
                  onClick={() => onBook(h)}
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition hover:scale-105"
                  style={{ backgroundColor: '#526B57' }}
                >
                  Reserve Hotel ➔
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {hotelDisplayCount < filtered.length && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setHotelDisplayCount((prev) => prev + 6)}
              className="px-6 py-2.5 text-xs font-bold text-[#263D32] bg-[#F4F1E6] hover:bg-[#E1DDD1] border border-[#E1DDD1] rounded-xl transition shadow-xs"
            >
              👇 Load More Hotel Recommendations ({filtered.length - hotelDisplayCount} remaining)
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
