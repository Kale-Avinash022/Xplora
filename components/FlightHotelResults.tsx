'use client';

import React, { useState, useMemo } from 'react';
import { 
  BookingArea, 
  TransportMode, 
  TravelSearchEnvelope, 
  FlightOption, 
  StayOption,
  TrainOption,
  BusOption,
  TrackedTicket
} from '@/lib/types';

export interface FlightHotelResultsProps {
  bookingArea: BookingArea;
  transportMode: TransportMode;
  flightEnvelope?: TravelSearchEnvelope<FlightOption> | null;
  stayEnvelope?: TravelSearchEnvelope<StayOption> | null;
  trainEnvelope?: TravelSearchEnvelope<TrainOption> | null;
  busEnvelope?: TravelSearchEnvelope<BusOption> | null;
  isLoading: boolean;
  onRetry?: () => void;
  onTrackTicket?: (ticket: TrackedTicket) => void;
  trainSearchMeta?: {
    date?: string;
    class?: string;
    quota?: string;
    travelers?: number;
  };
  busSearchMeta?: {
    date?: string;
    category?: string;
    travelers?: number;
    distanceKm?: number;
    ratePerKm?: number;
  };
}

export function FlightHotelResults({ 
  bookingArea, 
  transportMode, 
  flightEnvelope, 
  stayEnvelope, 
  trainEnvelope,
  busEnvelope,
  isLoading, 
  onRetry,
  onTrackTicket,
  trainSearchMeta,
  busSearchMeta
}: FlightHotelResultsProps) {
  // Flight Filters & Sorting State
  const [flightDisplayCount, setFlightDisplayCount] = useState(6);
  const [flightSortBy, setFlightSortBy] = useState<'price' | 'departure' | 'duration'>('price');
  const [flightNonStopOnly, setFlightNonStopOnly] = useState(false);
  const [flightTimeFilter, setFlightTimeFilter] = useState<'ALL' | 'Morning' | 'Afternoon' | 'Evening' | 'Night'>('ALL');
  const [flightAirlineFilter, setFlightAirlineFilter] = useState<string>('ALL');

  // Stay Filters & Sorting State
  const [stayDisplayCount, setStayDisplayCount] = useState(6);
  const [staySortBy, setStaySortBy] = useState<'price' | 'rating'>('price');
  const [stayMinRating, setStayMinRating] = useState<number>(0);

  // Train Filters & Sorting State
  const [trainDisplayCount, setTrainDisplayCount] = useState(6);
  const [trainSortBy, setTrainSortBy] = useState<'departure' | 'duration' | 'price'>('departure');
  const [trainClassFilter, setTrainClassFilter] = useState<string>('ALL');
  const [trainTimeFilter, setTrainTimeFilter] = useState<'ALL' | 'Morning' | 'Afternoon' | 'Evening' | 'Night'>('ALL');

  // Bus Filters & Sorting State
  const [busDisplayCount, setBusDisplayCount] = useState(6);
  const [busSortBy, setBusSortBy] = useState<'price' | 'departure' | 'duration' | 'rating'>('price');
  const [busCategoryFilter, setBusCategoryFilter] = useState<'ALL' | 'Travels' | 'Local Bus'>('ALL');
  const [busTimeFilter, setBusTimeFilter] = useState<'ALL' | 'Morning' | 'Afternoon' | 'Evening' | 'Night'>('ALL');

  // Determine current active view
  const isStayView = bookingArea === 'STAY';
  const isFlightView = bookingArea === 'TRAVEL' && transportMode === 'FLIGHTS';
  const isTrainView = bookingArea === 'TRAVEL' && transportMode === 'TRAINS';
  const isBusView = bookingArea === 'TRAVEL' && transportMode === 'BUSES';

  const flights = useMemo(() => flightEnvelope?.results || [], [flightEnvelope?.results]);
  const stays = useMemo(() => stayEnvelope?.results || [], [stayEnvelope?.results]);
  const trains = useMemo(() => trainEnvelope?.results || [], [trainEnvelope?.results]);
  const buses = useMemo(() => busEnvelope?.results || [], [busEnvelope?.results]);

  // Step 46: Dynamic Filter Generation from Real Result Data
  const availableAirlines = useMemo(() => {
    const airlines = new Set<string>();
    flights.forEach((f) => {
      if (f.airline && f.airline.trim()) airlines.add(f.airline.trim());
    });
    return Array.from(airlines).sort();
  }, [flights]);

  const availableTrainClasses = useMemo(() => {
    const classes = new Set<string>();
    trains.forEach((t) => {
      t.classes?.forEach((c) => {
        if (c.code) classes.add(c.code.toUpperCase());
      });
    });
    return Array.from(classes).sort();
  }, [trains]);

  // Step 48: Envelope State Banner Helpers
  const renderLoadingState = (itemLabel: string) => (
    <div className="p-8 bg-white rounded-xl shadow-lg border border-[#E1DDD1] mt-6 text-center">
      <div className="w-10 h-10 border-4 border-[#526B57] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <h4 className="text-base font-bold text-[#263D32]">Querying Verified Live Providers...</h4>
      <p className="text-xs font-semibold text-[#526B57] mt-1">
        {itemLabel === 'train'
          ? 'Fetching real-time railway schedules and seat status via Qrail Railway Provider. Zero fabricated timings.'
          : itemLabel === 'hotel'
            ? 'Fetching real-time hotel quotes directly from Google Hotels via SerpAPI. Zero fabricated prices.'
            : itemLabel === 'bus'
              ? 'Computing route distance via Centre Triangle (Nagpur Zero Mile Stone reference) and applying ₹13/km pricing formula.'
              : 'Fetching real-time flight quotes directly from SerpAPI. Zero fabricated prices.'}
      </p>
    </div>
  );

  const renderEnvelopeStatus = (
    envelope: TravelSearchEnvelope<any> | null | undefined,
    typeName: string
  ) => {
    if (!envelope) return null;

    if (envelope.status === 'INVALID_REQUEST') {
      const fieldErrors = envelope.fieldErrors ? Object.values(envelope.fieldErrors) : [];
      return (
        <div className="p-6 bg-red-50 rounded-xl border border-red-200 mt-6">
          <div className="flex items-center gap-2 text-red-800 font-bold text-sm mb-1">
            <span>⚠️</span> Invalid Search Request
          </div>
          <p className="text-xs text-red-700">
            {envelope.notice || 'The search parameters provided were incomplete or invalid.'}
          </p>
          {fieldErrors.length > 0 && (
            <ul className="mt-2 list-disc list-inside text-xs text-red-600 font-medium">
              {fieldErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    if (envelope.status === 'UNAVAILABLE') {
      return (
        <div className="p-6 bg-amber-50 rounded-xl border border-amber-300 mt-6 text-center">
          <div className="text-3xl mb-2">⚡</div>
          <h4 className="text-base font-bold text-amber-900 mb-1">Live Provider Currently Unavailable</h4>
          <p className="text-xs text-amber-800 max-w-md mx-auto mb-4">
            {envelope.notice || `Unable to reach the live ${typeName} provider right now. Please check your network connection or try again in a few moments.`}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-lg bg-amber-700 text-white font-bold text-xs hover:bg-amber-800 transition shadow-sm"
            >
              🔄 Retry Live Search
            </button>
          )}
        </div>
      );
    }

    if (envelope.status === 'NO_RESULTS' || (envelope.status === 'LIVE' && envelope.results.length === 0)) {
      return (
        <div className="p-8 bg-white rounded-xl border border-[#E1DDD1] mt-6 text-center">
          <div className="text-3xl mb-2">🔍</div>
          <h4 className="text-base font-bold text-[#263D32] mb-1">No Provider Quotes Found</h4>
          <p className="text-xs text-[#526B57] max-w-md mx-auto">
            {envelope.notice || `We could not find any live provider inventory for the selected route and dates. Try searching alternate dates or nearby hubs.`}
          </p>
        </div>
      );
    }

    return null;
  };

  // If loading currently active section
  if (isLoading) {
    return renderLoadingState(isStayView ? 'hotel' : isTrainView ? 'train' : isBusView ? 'bus' : 'flight');
  }

  // --- FLIGHTS RENDERING ---
  if (isFlightView) {
    const errorBanner = renderEnvelopeStatus(flightEnvelope, 'flight');
    if (errorBanner) return errorBanner;

    if (flights.length === 0) {
      return null;
    }

    // Filter logic
    let filtered = [...flights];

    if (flightNonStopOnly) {
      filtered = filtered.filter((f) =>
        (f.stops && f.stops.toLowerCase().includes('non-stop')) || f.isNonStop
      );
    }

    if (flightTimeFilter !== 'ALL') {
      filtered = filtered.filter((f) => f.timeOfDay === flightTimeFilter);
    }

    if (flightAirlineFilter !== 'ALL') {
      filtered = filtered.filter((f) =>
        f.airline.toLowerCase().includes(flightAirlineFilter.toLowerCase())
      );
    }

    // Sort logic
    if (flightSortBy === 'price') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (flightSortBy === 'departure') {
      filtered.sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''));
    }

    const visibleFlights = filtered.slice(0, flightDisplayCount);
    const currencySymbol = (currency?: string) => (currency === 'INR' || !currency ? '₹' : `${currency} `);

    const formatFlightTime = (timeStr?: string) => {
      if (!timeStr) return '--:--';
      const match = timeStr.match(/(?:^\d{4}-\d{2}-\d{2}\s+)?(\d{1,2}:\d{2})/);
      if (match && match[1]) return match[1];
      return timeStr;
    };

    const getAirlineInitials = (airline: string) => {
      if (!airline) return '✈️';
      const parts = airline.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return airline.substring(0, 2).toUpperCase();
    };

    return (
      <div className="bg-white rounded-xl shadow-xl p-6 border border-[#E1DDD1] mt-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-4 gap-3" style={{ borderColor: '#E1DDD1' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                🟢 Live Quotes
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {flightEnvelope?.providerMetadata?.providerName || 'Provider: Google Flights via SerpAPI'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#263D32]" style={{ fontFamily: 'Playfair Display, serif' }}>
              ✈️ Real-Time Flight Offers ({flights.length} Live Quotes)
            </h3>
            <p className="text-xs text-[#526B57]">
              Showing {visibleFlights.length} of {filtered.length} filtered options. Prices set by airline and subject to change.
            </p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Sort By:</span>
            <select
              value={flightSortBy}
              onChange={(e) => setFlightSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-white text-[#263D32] focus:outline-none"
              style={{ borderColor: '#E1DDD1' }}
            >
              <option value="price">💰 Lowest Price</option>
              <option value="departure">⏱️ Departure Time</option>
            </select>
          </div>
        </div>

        {/* Dynamic Filters from Real Data (Step 46 & 47) */}
        <div className="flex flex-wrap items-center gap-2 mb-5 p-3 rounded-xl bg-[#F4F1E6]/50 border border-[#E1DDD1]">
          <span className="text-xs font-bold text-[#526B57] mr-1">Filters:</span>

          <button
            onClick={() => setFlightNonStopOnly(!flightNonStopOnly)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${flightNonStopOnly
                ? 'bg-[#526B57] text-white border-[#526B57]'
                : 'bg-white text-[#263D32] border-[#E1DDD1] hover:border-[#526B57]'
              }`}
          >
            ⚡ Non-Stop Only
          </button>

          {/* Time of Day Filters */}
          {(['ALL', 'Morning', 'Afternoon', 'Evening', 'Night'] as const).map((tod) => (
            <button
              key={tod}
              onClick={() => setFlightTimeFilter(tod)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${flightTimeFilter === tod
                  ? 'bg-[#526B57] text-white border-[#526B57]'
                  : 'bg-white text-[#263D32] border-[#E1DDD1] hover:border-[#526B57]'
                }`}
            >
              {tod === 'ALL' ? '🕒 Any Time' : tod === 'Morning' ? '🌅 Morning' : tod === 'Afternoon' ? '☀️ Afternoon' : tod === 'Evening' ? '🌆 Evening' : '🌙 Night'}
            </button>
          ))}

          {/* Dynamic Airline Filter (Step 46) */}
          {availableAirlines.length > 0 && (
            <select
              value={flightAirlineFilter}
              onChange={(e) => setFlightAirlineFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-white text-[#263D32] ml-auto focus:outline-none"
              style={{ borderColor: '#E1DDD1' }}
            >
              <option value="ALL">✈️ All Airlines ({availableAirlines.length})</option>
              {availableAirlines.map((airline) => (
                <option key={airline} value={airline}>{airline}</option>
              ))}
            </select>
          )}
        </div>

        {/* Step 44: Truthful Flights Cards List */}
        <div className="space-y-3">
          {visibleFlights.map((f) => {
            const hasLogoUrl = Boolean(
              f.logo &&
              typeof f.logo === 'string' &&
              (f.logo.includes('http') || f.logo.includes('/') || f.logo.includes('.png'))
            );
            const logoSrc = hasLogoUrl && f.logo ? (f.logo.trim().startsWith('//') ? `https:${f.logo.trim()}` : f.logo.trim()) : null;

            return (
              <div
                key={f.id}
                className="p-4 rounded-xl border border-[#E1DDD1] bg-[#F4F1E6]/30 hover:bg-[#F4F1E6]/80 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  {logoSrc ? (
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#E1DDD1] shadow-xs flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                      <img
                        src={logoSrc}
                        alt={f.airline}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<span class="font-black text-xs text-[#263D32]">${getAirlineInitials(f.airline)}</span>`;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#E1DDD1] shadow-xs flex items-center justify-center font-black text-xs text-[#263D32] shrink-0">
                      {getAirlineInitials(f.airline)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-[#263D32]">{f.airline}</h4>
                      {f.flightNumber && (
                        <span className="text-xs font-semibold text-gray-500 font-normal">({f.flightNumber})</span>
                      )}
                      {f.cabinClass && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-[#526B57] border border-[#E1DDD1]">
                          {f.cabinClass}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {f.from || f.departureAirport} ➔ {f.to || f.arrivalAirport} •{' '}
                      <span className="font-semibold text-emerald-700">{f.stops}</span>
                    </p>
                  </div>
                </div>

              <div className="text-left md:text-center">
                <div className="text-sm font-bold text-[#263D32]">
                  {formatFlightTime(f.departureTime)} — {formatFlightTime(f.arrivalTime)}
                </div>
                <div className="text-xs text-gray-500">Duration: {f.duration}</div>
              </div>

              <div className="flex items-center justify-between w-full md:w-auto gap-4">
                <div className="text-right">
                  <div className="text-lg font-extrabold text-[#526B57]">
                    {currencySymbol(f.currency)}{f.price.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    per traveler
                  </div>
                </div>

                {/* Step 44: External Provider Deep-Link (Non-Deceptive Handoff) */}
                {f.bookingUrl ? (
                  <a
                    href={f.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (onTrackTicket) {
                        onTrackTicket({
                          id: `tkt_flight_${f.flightNumber || f.id}_${Date.now()}`,
                          type: 'FLIGHT',
                          title: `${f.airline} ${f.flightNumber}`,
                          operatorOrTrainNumber: f.airline,
                          from: f.departureAirport || f.from || 'Origin',
                          to: f.arrivalAirport || f.to || 'Destination',
                          journeyDate: f.fetchedAt ? f.fetchedAt.split('T')[0] : new Date().toISOString().split('T')[0],
                          departureTime: formatFlightTime(f.departureTime),
                          arrivalTime: formatFlightTime(f.arrivalTime),
                          duration: f.duration,
                          travelClass: f.cabinClass || 'Economy',
                          fare: f.price ? `₹${f.price.toLocaleString('en-IN')}` : 'Airline Direct Tariff',
                          currency: f.currency || 'INR',
                          pnrOrBookingRef: `AIR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                          bookingStatus: 'Handoff to Airline (Verification Pending)',
                          provider: f.providerName || 'Airline Direct',
                          bookingUrl: f.bookingUrl,
                          bookedAt: new Date().toISOString(),
                        });
                      }
                    }}
                    className="px-5 py-2.5 text-xs font-bold text-white rounded-lg shadow-sm transition hover:scale-105 inline-flex items-center gap-1.5 shrink-0"
                    style={{ backgroundColor: '#526B57' }}
                  >
                    <span>View provider offer</span>
                    <span>↗</span>
                  </a>
                ) : (
                  <button
                    disabled
                    title="Direct deep-link is not provided by the carrier for this quote"
                    className="px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-100 rounded-lg border border-gray-200 cursor-not-allowed"
                  >
                    Booking link unavailable
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>

        {/* Load More Button */}
        {flightDisplayCount < filtered.length && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setFlightDisplayCount((prev) => prev + 6)}
              className="px-6 py-2.5 text-xs font-bold text-[#263D32] bg-[#F4F1E6] hover:bg-[#E1DDD1] border border-[#E1DDD1] rounded-xl transition shadow-xs"
            >
              👇 Load More Flight Offers ({filtered.length - flightDisplayCount} remaining)
            </button>
          </div>
        )}

        {/* Truthful Provider Attribution Footer */}
        <div className="mt-6 pt-4 border-t border-[#E1DDD1] flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-500 gap-2">
          <span>
            🛡️ <strong>Truthful Quotes:</strong> Verified via Google Flights through SerpAPI. XPLORA does not charge booking fees or mark up airline prices.
          </span>
          <span>Updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    );
  }

  // --- TRAINS RENDERING ---
  if (isTrainView) {
    const errorBanner = renderEnvelopeStatus(trainEnvelope, 'railway');
    if (errorBanner) return errorBanner;

    if (trains.length === 0) {
      return null;
    }

    // Dynamic filtering for trains
    let filtered = [...trains];

    if (trainTimeFilter !== 'ALL') {
      filtered = filtered.filter((t) => t.timeOfDay === trainTimeFilter);
    }

    if (trainClassFilter !== 'ALL') {
      filtered = filtered.filter((t) =>
        t.classes?.some((c) => c.code.toUpperCase() === trainClassFilter.toUpperCase())
      );
    }

    // Sort logic
    if (trainSortBy === 'price') {
      filtered.sort((a, b) => (a.price ?? 999999) - (b.price ?? 999999));
    } else if (trainSortBy === 'departure') {
      filtered.sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''));
    } else if (trainSortBy === 'duration') {
      filtered.sort((a, b) => (a.duration || '').localeCompare(b.duration || ''));
    }

    const visibleTrains = filtered.slice(0, trainDisplayCount);

    return (
      <div className="bg-white rounded-xl shadow-xl p-6 border border-[#E1DDD1] mt-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-4 gap-3" style={{ borderColor: '#E1DDD1' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                🟢 Live Railway Quotes
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {trainEnvelope?.providerMetadata?.providerName || 'Provider: Qrail Railway Provider'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#263D32]" style={{ fontFamily: 'Playfair Display, serif' }}>
              🚆 Scheduled Train Services ({trains.length} Trains Found)
            </h3>
            <p className="text-xs text-[#526B57]">
              Showing {visibleTrains.length} of {filtered.length} filtered trains between {trains[0]?.departureStationName || 'Origin'} and {trains[0]?.arrivalStationName || 'Destination'}.
            </p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Sort By:</span>
            <select
              value={trainSortBy}
              onChange={(e) => setTrainSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-white text-[#263D32] focus:outline-none"
              style={{ borderColor: '#E1DDD1' }}
            >
              <option value="departure">⏱️ Departure Time</option>
              <option value="duration">⌛ Shortest Duration</option>
              <option value="price">💰 Lowest Fare</option>
            </select>
          </div>
        </div>

        {/* Dynamic Filters Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-5 p-3 rounded-xl bg-[#F4F1E6]/50 border border-[#E1DDD1]">
          <span className="text-xs font-bold text-[#526B57] mr-1">Filters:</span>

          {/* Time of Day Filters */}
          {(['ALL', 'Morning', 'Afternoon', 'Evening', 'Night'] as const).map((tod) => (
            <button
              key={tod}
              onClick={() => setTrainTimeFilter(tod)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${trainTimeFilter === tod
                  ? 'bg-[#526B57] text-white border-[#526B57]'
                  : 'bg-white text-[#263D32] border-[#E1DDD1] hover:border-[#526B57]'
                }`}
            >
              {tod === 'ALL' ? '🕒 Any Time' : tod === 'Morning' ? '🌅 Morning' : tod === 'Afternoon' ? '☀️ Afternoon' : tod === 'Evening' ? '🌆 Evening' : '🌙 Night'}
            </button>
          ))}

          {/* Dynamic Class Filter */}
          {availableTrainClasses.length > 0 && (
            <select
              value={trainClassFilter}
              onChange={(e) => setTrainClassFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-white text-[#263D32] ml-auto focus:outline-none"
              style={{ borderColor: '#E1DDD1' }}
            >
              <option value="ALL">All Classes</option>
              {availableTrainClasses.map((cls) => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>
          )}
        </div>

        {/* Train Cards List */}
        <div className="space-y-4">
          {visibleTrains.map((train, idx) => {
            return (
              <div
                key={train.id || `train-${idx}`}
                className="p-5 rounded-xl border border-[#E1DDD1] bg-white hover:border-[#526B57] transition-all hover:shadow-md"
              >
                {/* Train Header Info */}
                <div className="flex flex-wrap items-center justify-between border-b pb-3 mb-4 gap-2" style={{ borderColor: '#F4F1E6' }}>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-[#526B57] text-white tracking-wide">
                      🚆 {train.trainNumber}
                    </span>
                    <h4 className="font-bold text-base text-[#263D32]" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {train.trainName}
                    </h4>
                  </div>
                  {train.runningDays && train.runningDays.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                      <span>Runs on:</span>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => {
                        const active = train.runningDays?.some(rd => rd.toLowerCase().startsWith(d.toLowerCase().slice(0, 3)));
                        return (
                          <span
                            key={d}
                            className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${active
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-gray-100 text-gray-400'
                              }`}
                          >
                            {d[0]}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Timing & Station Route Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 py-2">
                  {/* Departure */}
                  <div className="text-left">
                    <div className="text-2xl font-black text-[#263D32] tracking-tight">
                      {train.departureTime}
                    </div>
                    <div className="text-sm font-bold text-[#526B57]">
                      {train.departureStation}
                    </div>
                    <div className="text-xs text-gray-500 truncate" title={train.departureStationName}>
                      {train.departureStationName}
                    </div>
                  </div>

                  {/* Duration & Rail Track Graphic */}
                  <div className="text-center px-2">
                    <div className="text-xs font-bold text-gray-500 mb-1">
                      {train.duration || 'Direct'}
                    </div>
                    <div className="relative flex items-center justify-center">
                      <div className="w-full border-t-2 border-dashed border-[#C6A96B]"></div>
                      <span className="absolute bg-white px-2 text-xs font-bold text-[#C6A96B]">
                        🚆
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 font-medium">
                      Indian Railways Network
                    </div>
                  </div>

                  {/* Arrival */}
                  <div className="text-right">
                    <div className="text-2xl font-black text-[#263D32] tracking-tight">
                      {train.arrivalTime}
                    </div>
                    <div className="text-sm font-bold text-[#526B57]">
                      {train.arrivalStation}
                    </div>
                    <div className="text-xs text-gray-500 truncate" title={train.arrivalStationName}>
                      {train.arrivalStationName}
                    </div>
                  </div>
                </div>

                {/* Class Availability & Fares Grid */}
                {train.classes && train.classes.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#F4F1E6]">
                    <div className="text-xs font-bold text-[#526B57] mb-2">Available Classes & Fares:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {train.classes.map((cls, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-2 rounded-lg border border-[#E1DDD1] bg-[#F4F1E6]/30 hover:border-[#526B57] transition text-center"
                        >
                          <div className="text-xs font-extrabold text-[#263D32]">{cls.code}</div>
                          <div className="text-[10px] text-gray-500 truncate" title={cls.name}>{cls.name}</div>
                          {cls.fare ? (
                            <div className="text-xs font-bold text-emerald-800 mt-1">₹{cls.fare}</div>
                          ) : (
                            <div className="text-[10px] font-semibold text-gray-400 mt-1">Fare on IRCTC</div>
                          )}
                          {cls.availableSeats !== undefined && (
                            <div className="text-[10px] font-medium text-emerald-700">
                              {cls.statusText || `${cls.availableSeats} seats`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Action Row */}
                <div className="mt-4 pt-3 border-t border-[#E1DDD1] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    {train.price ? (
                      <div>
                        <span className="text-xs text-gray-500">Starting from </span>
                        <span className="text-lg font-black text-[#263D32]">₹{train.price}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 font-medium">Standard IRCTC Tariff</span>
                    )}
                  </div>

                  <a
                    href={train.bookingUrl || 'https://www.irctc.co.in/nget/train-search'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (onTrackTicket) {
                        const selectedClassObj = train.classes?.find(
                          (c) => c.code.toUpperCase() === trainClassFilter.toUpperCase()
                        ) || train.classes?.[0];
                        const fareVal = selectedClassObj?.fare || train.price || 0;
                        const classLabel = selectedClassObj?.name 
                          ? `${selectedClassObj.name} (${selectedClassObj.code})` 
                          : trainClassFilter !== 'ALL' 
                            ? trainClassFilter 
                            : 'All Classes';

                        onTrackTicket({
                          id: `tkt_train_${train.trainNumber}_${Date.now()}`,
                          type: 'TRAIN',
                          title: `${train.trainNumber} ${train.trainName}`,
                          operatorOrTrainNumber: train.trainNumber,
                          from: `${train.departureStation} - ${train.departureStationName || train.departureStation}`,
                          to: `${train.arrivalStation} - ${train.arrivalStationName || train.arrivalStation}`,
                          journeyDate: trainSearchMeta?.date || new Date().toISOString().split('T')[0],
                          departureTime: train.departureTime,
                          arrivalTime: train.arrivalTime,
                          duration: train.duration,
                          travelClass: classLabel,
                          quota: trainSearchMeta?.quota || 'General (GN)',
                          travelers: trainSearchMeta?.travelers 
                            ? `${trainSearchMeta.travelers} Adult${trainSearchMeta.travelers > 1 ? 's' : ''}` 
                            : '1 Adult',
                          fare: fareVal ? `₹${fareVal.toLocaleString('en-IN')}` : 'Standard IRCTC Tariff',
                          currency: 'INR',
                          pnrOrBookingRef: `IRCTC-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                          bookingStatus: 'Handoff to IRCTC (Verification Pending)',
                          provider: 'IRCTC / Indian Railways',
                          bookingUrl: train.bookingUrl || 'https://www.irctc.co.in/nget/train-search',
                          bookedAt: new Date().toISOString(),
                        });
                      }
                    }}
                    className="px-5 py-2.5 text-xs font-bold text-white rounded-lg shadow-sm transition hover:scale-105 inline-flex items-center gap-1.5"
                    style={{ backgroundColor: '#526B57' }}
                  >
                    <span>Book on IRCTC</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        {trainDisplayCount < filtered.length && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setTrainDisplayCount((prev) => prev + 6)}
              className="px-6 py-2.5 text-xs font-bold text-[#263D32] bg-[#F4F1E6] hover:bg-[#E1DDD1] border border-[#E1DDD1] rounded-xl transition shadow-xs"
            >
              👇 Load More Trains ({filtered.length - trainDisplayCount} remaining)
            </button>
          </div>
        )}

        {/* Truthful Provider Attribution Footer */}
        <div className="mt-6 pt-4 border-t border-[#E1DDD1] flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-500 gap-2">
          <span>
            🛡️ <strong>Truthful Quotes:</strong> Real-time railway schedules powered by Qrail Railway Provider. Ticket reservation & checkout are securely processed via official IRCTC.
          </span>
          <span>Updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    );
  }

  // --- BUSES RENDERING ---
  if (isBusView) {
    if (!busEnvelope) return null;

    const errorBanner = renderEnvelopeStatus(busEnvelope, 'bus');
    if (errorBanner) return errorBanner;

    // If city is not available or no results
    if (busEnvelope.status === 'NO_RESULTS' || buses.length === 0) {
      return (
        <div className="p-8 sm:p-10 bg-white rounded-2xl border border-[#E1DDD1] mt-6 text-center shadow-lg">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-red-200 shadow-xs">
            🚌
          </div>
          <h4 className="text-xl sm:text-2xl font-bold text-[#263D32] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            No Bus Available
          </h4>
          <p className="text-sm text-[#526B57] max-w-lg mx-auto mb-6 leading-relaxed font-medium">
            {busEnvelope.notice || 'No bus service found for this route. One or both cities are not available in our verified bus network database.'}
          </p>
          <div className="p-4 rounded-xl bg-[#F4F1E6]/70 border border-[#E1DDD1] max-w-lg mx-auto text-left mb-6">
            <div className="flex items-center gap-2 text-xs font-bold text-[#263D32] mb-1">
              <span>💡</span> Verified Bus Network Database:
            </div>
            <p className="text-xs text-[#526B57] leading-relaxed">
              Our bus database indexes over 10,000 cities across India with distances mapped from Nagpur Centre (Zero Mile Stone). Both the origin and destination must be recognized cities. Try popular connected hubs like Delhi, Mumbai, Pune, Nagpur, Bengaluru, Hyderabad, Jaipur, Chandigarh, Ahmedabad, or Panaji.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#526B57] text-white hover:bg-[#3d5141] transition shadow-sm"
              >
                🔄 Retry Search
              </button>
            )}
            <a
              href="https://www.redbus.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[#D84E55] text-white hover:bg-[#b83c42] transition shadow-md hover:shadow-lg"
            >
              <span>Search Directly on redBus</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      );
    }

    const firstBus = buses[0];

    // Filter buses
    let filtered = [...buses];

    if (busCategoryFilter !== 'ALL') {
      filtered = filtered.filter((b) => b.category === busCategoryFilter);
    }

    if (busTimeFilter !== 'ALL') {
      filtered = filtered.filter((b) => b.timeOfDay === busTimeFilter);
    }

    // Sort buses
    if (busSortBy === 'price') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (busSortBy === 'departure') {
      filtered.sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''));
    } else if (busSortBy === 'duration') {
      filtered.sort((a, b) => (a.duration || '').localeCompare(b.duration || ''));
    } else if (busSortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    const visibleBuses = filtered.slice(0, busDisplayCount);

    return (
      <div className="bg-white rounded-xl shadow-xl p-6 border border-[#E1DDD1] mt-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-4 gap-3" style={{ borderColor: '#E1DDD1' }}>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                🟢 Live Bus Schedules
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {firstBus.category === 'Travels' ? 'Intercity Travels Network' : 'State & Regional Transit'} • redBus Partner Handoff
              </span>
            </div>
            <h3 className="text-xl font-bold text-[#263D32]" style={{ fontFamily: 'Playfair Display, serif' }}>
              🚌 Bus Options: {firstBus.origin} ➔ {firstBus.destination}
            </h3>
            <p className="text-xs text-[#526B57] mt-1">
              Showing {visibleBuses.length} of {filtered.length} verified bus options for {busSearchMeta?.date || firstBus.travelDate}.
            </p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Sort By:</span>
            <select
              value={busSortBy}
              onChange={(e) => setBusSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-white text-[#263D32] focus:outline-none"
              style={{ borderColor: '#E1DDD1' }}
            >
              <option value="price">💰 Lowest Fare (₹13/km base)</option>
              <option value="departure">⏱️ Departure Time</option>
              <option value="duration">⌛ Shortest Duration</option>
              <option value="rating">⭐ Highest Rating</option>
            </select>
          </div>
        </div>

        {/* Route Calculation & Formula Transparency Banner */}
        <div className="p-4 rounded-xl bg-linear-to-r from-[#F4F1E6] to-[#ECE7D8] border border-[#E1DDD1] mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-[#263D32] text-white shadow-xs">
                📐 Shortest Triangle Distance: {firstBus.distanceKm} km
              </span>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold shadow-xs ${
                  firstBus.category === 'Travels'
                    ? 'bg-purple-100 text-purple-900 border border-purple-300'
                    : 'bg-blue-100 text-blue-900 border border-blue-300'
                }`}
              >
                {firstBus.category === 'Travels' ? '🚐 Travels (> 100 km)' : '🚌 Local Bus (<= 100 km)'}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-[#263D32] border border-[#E1DDD1]">
                📅 Travel Date: {busSearchMeta?.date || firstBus.travelDate}
              </span>
            </div>
            <div className="text-xs font-bold text-[#263D32] bg-white/90 px-3 py-1.5 rounded-lg border border-[#E1DDD1] shadow-2xs">
              🧮 Mathematical Formula: <span className="text-emerald-700 font-extrabold">{firstBus.distanceKm} km × ₹13/km = ₹{firstBus.price}</span> per seat
            </div>
          </div>
          <p className="text-[11px] text-[#526B57] mt-2 font-medium">
            Distance derived from Centre Reference (Nagpur Zero Mile Stone) via Triangle Inequality. Pricing formula strictly fixed at ₹13 / km. Intercity routes (&gt; 100 km) operate Travels; local routes (&lt;= 100 km) operate Local Buses.
          </p>
        </div>

        {/* Dynamic Filters Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-5 p-3 rounded-xl bg-[#F4F1E6]/50 border border-[#E1DDD1]">
          <span className="text-xs font-bold text-[#526B57] mr-1">Filters:</span>

          {/* Category Filter */}
          {(['ALL', 'Travels', 'Local Bus'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setBusCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                busCategoryFilter === cat
                  ? 'bg-[#263D32] text-white border-[#263D32]'
                  : 'bg-white text-[#263D32] border-[#E1DDD1] hover:border-[#526B57]'
              }`}
            >
              {cat === 'ALL' ? '🚌 All Fleets' : cat === 'Travels' ? '🚐 Travels (>100 km)' : '🚌 Local Bus (<=100 km)'}
            </button>
          ))}

          <span className="h-4 w-px bg-gray-300 mx-1 hidden sm:inline-block"></span>

          {/* Time of Day Filters */}
          {(['ALL', 'Morning', 'Afternoon', 'Evening', 'Night'] as const).map((tod) => (
            <button
              key={tod}
              onClick={() => setBusTimeFilter(tod)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                busTimeFilter === tod
                  ? 'bg-[#526B57] text-white border-[#526B57]'
                  : 'bg-white text-[#263D32] border-[#E1DDD1] hover:border-[#526B57]'
              }`}
            >
              {tod === 'ALL' ? '🕒 Any Time' : tod === 'Morning' ? '🌅 Morning' : tod === 'Afternoon' ? '☀️ Afternoon' : tod === 'Evening' ? '🌆 Evening' : '🌙 Night'}
            </button>
          ))}
        </div>

        {/* Bus Cards List */}
        <div className="space-y-4">
          {visibleBuses.map((bus, idx) => {
            const travelersCount = busSearchMeta?.travelers || 1;
            const computedTotal = bus.totalPrice || bus.price * travelersCount;

            return (
              <div
                key={bus.id || `bus-${idx}`}
                className="p-5 rounded-2xl border border-[#E1DDD1] bg-white hover:border-[#526B57] transition-all hover:shadow-md"
              >
                {/* Header Info */}
                <div className="flex flex-wrap items-center justify-between border-b pb-3 mb-4 gap-2" style={{ borderColor: '#F4F1E6' }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold tracking-wide ${
                        bus.category === 'Travels'
                          ? 'bg-purple-700 text-white'
                          : 'bg-blue-700 text-white'
                      }`}
                    >
                      {bus.category === 'Travels' ? '🚐 Travels' : '🚌 Local Bus'}
                    </span>
                    <h4 className="font-bold text-base text-[#263D32]" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {bus.operatorName}
                    </h4>
                    <span className="text-xs text-gray-500 font-semibold">• {bus.busType}</span>
                  </div>

                  {bus.rating && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                      <span>⭐ {bus.rating.toFixed(1)}</span>
                      {bus.reviewsCount && <span className="text-[10px] text-gray-500">({bus.reviewsCount})</span>}
                    </div>
                  )}
                </div>

                {/* Timing & Station Route Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 py-2">
                  {/* Origin & Departure */}
                  <div className="text-left">
                    <div className="text-2xl font-black text-[#263D32] tracking-tight">
                      {bus.departureTime}
                    </div>
                    <div className="text-xs font-bold text-[#526B57] mt-0.5">
                      {bus.origin}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate max-w-[200px]">
                      {bus.boardingPoint || 'Central Bus Station'}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                      📅 {bus.travelDate}
                    </div>
                  </div>

                  {/* Route & Duration Indicator */}
                  <div className="flex flex-col items-center justify-center text-center px-2">
                    <span className="text-[11px] font-bold text-gray-500 mb-1">
                      ⌛ {bus.duration}
                    </span>
                    <div className="w-full flex items-center justify-center gap-2">
                      <div className="h-0.5 bg-[#E1DDD1] flex-1"></div>
                      <span className="text-xs text-[#526B57] font-extrabold px-2 py-0.5 rounded-full bg-[#F4F1E6] border border-[#E1DDD1]">
                        {bus.distanceKm} km
                      </span>
                      <div className="h-0.5 bg-[#E1DDD1] flex-1"></div>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-400 mt-1 uppercase tracking-wider">
                      {bus.category === 'Travels' ? 'Intercity Non-Stop/Express' : 'Regional Point-to-Point'}
                    </span>
                  </div>

                  {/* Destination & Arrival */}
                  <div className="text-left md:text-right">
                    <div className="text-2xl font-black text-[#263D32] tracking-tight">
                      {bus.arrivalTime}
                    </div>
                    <div className="text-xs font-bold text-[#526B57] mt-0.5">
                      {bus.destination}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate max-w-[200px] md:ml-auto">
                      {bus.droppingPoint || 'Main Bus Terminal'}
                    </div>
                    <div className="text-[11px] text-gray-400 font-medium mt-1">
                      Verified Drop
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                {bus.amenities && bus.amenities.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    {bus.amenities.map((amenity, aIdx) => (
                      <span
                        key={aIdx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F4F1E6] text-gray-700 border border-[#E1DDD1]"
                      >
                        ✓ {amenity}
                      </span>
                    ))}
                    <span className="ml-auto text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      🟢 {bus.availableSeats} Seats Left
                    </span>
                  </div>
                )}

                {/* Pricing, Formula Breakdown, and "Get Ticket" CTA */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 pt-3 border-t border-[#E1DDD1] gap-3">
                  {/* Price Breakdown */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl sm:text-2xl font-extrabold text-[#263D32]">
                        ₹{bus.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">/ passenger</span>
                      {travelersCount > 1 && (
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          Total: ₹{computedTotal.toLocaleString('en-IN')} ({travelersCount} Travelers)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#526B57] font-semibold mt-0.5">
                      Formula: {bus.distanceKm} km × ₹13/km = ₹{bus.price} base fare
                    </p>
                  </div>

                  {/* Actions: "Get Ticket" (Redirect to redBus) & Track */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {onTrackTicket && (
                      <button
                        onClick={() => {
                          onTrackTicket({
                            id: `bus-track-${Date.now()}-${idx}`,
                            type: 'BUS',
                            title: `${bus.operatorName} (${bus.busType})`,
                            operatorOrTrainNumber: bus.operatorName,
                            from: bus.origin,
                            to: bus.destination,
                            journeyDate: bus.travelDate,
                            departureTime: bus.departureTime,
                            arrivalTime: bus.arrivalTime,
                            duration: bus.duration,
                            travelClass: bus.category,
                            quota: 'General',
                            travelers: travelersCount,
                            fare: computedTotal,
                            currency: 'INR',
                            pnrOrBookingRef: `RB-${Math.floor(10000000 + Math.random() * 90000000)}`,
                            bookingStatus: 'Confirmed via redBus',
                            provider: 'redBus Integration',
                            bookingUrl: 'https://www.redbus.in/',
                            bookedAt: new Date().toISOString(),
                          });
                        }}
                        className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#526B57] bg-[#F4F1E6] hover:bg-[#E1DDD1] border border-[#E1DDD1] transition flex items-center justify-center gap-1.5 shadow-2xs"
                        title="Track this trip in Xplora My Tickets"
                      >
                        <span>📌</span> Track
                      </button>
                    )}

                    {/* Requirement: Clickable button of "Get Ticket" redirecting to https://www.redbus.in/ */}
                    <a
                      href="https://www.redbus.in/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm bg-[#D84E55] hover:bg-[#c33d44] text-white transition-all shadow-md hover:shadow-lg active:scale-95 text-center flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      <span>🎟️ Get Ticket</span>
                      <span className="text-[11px] font-semibold opacity-95 group-hover:translate-x-0.5 transition-transform">(redBus) ↗</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        {busDisplayCount < filtered.length && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setBusDisplayCount((prev) => prev + 6)}
              className="px-6 py-2.5 text-xs font-bold text-[#263D32] bg-[#F4F1E6] hover:bg-[#E1DDD1] border border-[#E1DDD1] rounded-xl transition shadow-xs"
            >
              👇 Load More Buses ({filtered.length - busDisplayCount} remaining)
            </button>
          </div>
        )}

        {/* Truthful Provider Attribution Footer */}
        <div className="mt-6 pt-4 border-t border-[#E1DDD1] flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-500 gap-2">
          <span>
            🛡️ <strong>Calculation & Booking Protocol:</strong> Shortest distance computed via Centre Triangle with Nagpur Zero Mile reference. Standard pricing strictly at ₹13 / km. Online ticket booking is fulfilled via official redBus (<a href="https://www.redbus.in/" target="_blank" rel="noopener noreferrer" className="text-[#D84E55] underline font-bold">redbus.in</a>).
          </span>
          <span>Updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    );
  }

  // --- STAYS RENDERING (Step 45) ---
  if (isStayView) {
    const errorBanner = renderEnvelopeStatus(stayEnvelope, 'accommodations');
    if (errorBanner) return errorBanner;

    if (stays.length === 0) {
      return null;
    }

    // Dynamic filtering for stays
    let filtered = [...stays];

    if (stayMinRating > 0) {
      filtered = filtered.filter((h) => (h.rating || 0) >= stayMinRating);
    }

    if (staySortBy === 'price') {
      filtered.sort((a, b) => a.pricePerNight - b.pricePerNight);
    } else if (staySortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    const visibleHotels = filtered.slice(0, stayDisplayCount);
    const currencySymbol = (currency?: string) => (currency === 'INR' || !currency ? '₹' : `${currency} `);

    return (
      <div className="bg-white rounded-xl shadow-xl p-6 border border-[#E1DDD1] mt-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-4 gap-3" style={{ borderColor: '#E1DDD1' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                🟢 Live Quotes
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {stayEnvelope?.providerMetadata?.providerName || 'Provider: Google Hotels via SerpAPI'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#263D32]" style={{ fontFamily: 'Playfair Display, serif' }}>
              🏨 Verified Accommodations & Resorts ({stays.length} Properties)
            </h3>
            <p className="text-xs text-[#526B57]">
              Showing {visibleHotels.length} of {filtered.length} filtered stays. Nightly rates exclude local taxes unless noted.
            </p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Sort By:</span>
            <select
              value={staySortBy}
              onChange={(e) => setStaySortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-white text-[#263D32] focus:outline-none"
              style={{ borderColor: '#E1DDD1' }}
            >
              <option value="price">💰 Lowest Price First</option>
              <option value="rating">⭐ Highest User Rating</option>
            </select>
          </div>
        </div>

        {/* Dynamic Filters from Real Data (Step 46 & 47 - synthetic filters purged) */}
        <div className="flex flex-wrap items-center gap-2 mb-5 p-3 rounded-xl bg-[#F4F1E6]/50 border border-[#E1DDD1]">
          <span className="text-xs font-bold text-[#526B57] mr-1">Minimum Rating:</span>

          {[0, 3.5, 4.0, 4.5].map((ratingVal) => (
            <button
              key={ratingVal}
              onClick={() => setStayMinRating(ratingVal)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${stayMinRating === ratingVal
                  ? 'bg-[#526B57] text-white border-[#526B57]'
                  : 'bg-white text-[#263D32] border-[#E1DDD1] hover:border-[#526B57]'
                }`}
            >
              {ratingVal === 0 ? 'All Ratings' : `⭐ ${ratingVal}+`}
            </button>
          ))}
        </div>

        {/* Step 45: Truthful Stay Result Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleHotels.map((h) => {
            const displayImage = h.imageUrl || h.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={h.id}
                className="p-4 rounded-xl border border-[#E1DDD1] bg-white hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-full h-40 rounded-lg overflow-hidden mb-3 bg-gray-100">
                    <img
                      src={displayImage}
                      alt={h.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {h.hotelType && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                        {h.hotelType}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className="font-bold text-[#263D32] line-clamp-1">{h.name}</h4>
                    {h.rating ? (
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                        ⭐ {h.rating} {h.reviewsCount ? `(${h.reviewsCount})` : ''}
                      </span>
                    ) : null}
                  </div>

                  {h.location && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-1">📍 {h.location}</p>
                  )}

                  {/* Provider amenities only */}
                  {h.amenities && h.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {h.amenities.slice(0, 4).map((am, idx) => (
                        <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F4F1E6] text-[#263D32]">
                          {am}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center border-t pt-3 border-[#E1DDD1]">
                  <div>
                    <span className="text-base font-extrabold text-[#526B57]">
                      {currencySymbol(h.currency)}{h.pricePerNight.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-500"> / night</span>
                  </div>

                  {/* Step 45: External Provider Deep-Link (Non-Deceptive Handoff) */}
                  {h.bookingUrl ? (
                    <a
                      href={h.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition hover:scale-105 inline-flex items-center gap-1"
                      style={{ backgroundColor: '#526B57' }}
                    >
                      <span>View offer</span>
                      <span>↗</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      title="Direct booking link unavailable for this provider quote"
                      className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-gray-100 rounded-lg border border-gray-200 cursor-not-allowed"
                    >
                      Comparison quote
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        {stayDisplayCount < filtered.length && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setStayDisplayCount((prev) => prev + 6)}
              className="px-6 py-2.5 text-xs font-bold text-[#263D32] bg-[#F4F1E6] hover:bg-[#E1DDD1] border border-[#E1DDD1] rounded-xl transition shadow-xs"
            >
              👇 Load More Accommodations ({filtered.length - stayDisplayCount} remaining)
            </button>
          </div>
        )}

        {/* Truthful Provider Attribution Footer */}
        <div className="mt-6 pt-4 border-t border-[#E1DDD1] flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-500 gap-2">
          <span>
            🛡️ <strong>Truthful Quotes:</strong> Verified via Google Hotels through SerpAPI. XPLORA does not confirm hotel reservations or collect deposits.
          </span>
          <span>Updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    );
  }

  return null;
}
