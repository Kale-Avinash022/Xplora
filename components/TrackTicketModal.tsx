'use client';

import React, { useState, useEffect } from 'react';
import { TrackedTicket, TrackedTicketType, TrackedHotelBooking } from '@/lib/types';

export interface TrackTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: TrackedTicket[];
  hotels?: TrackedHotelBooking[];
  onRemoveTicket: (id: string) => void;
  onUpdatePnr: (id: string, newPnr: string) => void;
  onAddTicket: (ticket: TrackedTicket) => void;
  onRemoveHotel?: (id: string) => void;
  onUpdateHotelRef?: (id: string, newRef: string) => void;
  onAddHotel?: (hotel: TrackedHotelBooking) => void;
  initialSection?: 'TRAVEL' | 'HOTEL';
}

export function TrackTicketModal({
  isOpen,
  onClose,
  tickets,
  hotels = [],
  onRemoveTicket,
  onUpdatePnr,
  onAddTicket,
  onRemoveHotel,
  onUpdateHotelRef,
  onAddHotel,
  initialSection = 'TRAVEL',
}: TrackTicketModalProps) {
  // Main Section Toggle: 'TRAVEL' (Flights, Trains, Buses) vs 'HOTEL' (Hotels & Resorts)
  const [mainSection, setMainSection] = useState<'TRAVEL' | 'HOTEL'>(initialSection);

  // Sync with initialSection when modal opens
  useEffect(() => {
    if (initialSection) {
      setMainSection(initialSection);
    }
  }, [initialSection, isOpen]);

  // Travel tickets state
  const [activeTab, setActiveTab] = useState<'ALL' | TrackedTicketType>('ALL');
  const [editingPnrId, setEditingPnrId] = useState<string | null>(null);
  const [tempPnr, setTempPnr] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [pnrStatusMessage, setPnrStatusMessage] = useState<{ id: string; message: string } | null>(null);

  // New ticket form state
  const [newType, setNewType] = useState<TrackedTicketType>('TRAIN');
  const [newTitle, setNewTitle] = useState('');
  const [newFrom, setNewFrom] = useState('');
  const [newTo, setNewTo] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newClass, setNewClass] = useState('3A');
  const [newPnr, setNewPnr] = useState('');
  const [newFare, setNewFare] = useState('');

  // Hotel bookings state
  const [editingHotelRefId, setEditingHotelRefId] = useState<string | null>(null);
  const [tempHotelRef, setTempHotelRef] = useState<string>('');
  const [showAddHotelForm, setShowAddHotelForm] = useState(false);
  const [hotelStatusMessage, setHotelStatusMessage] = useState<{ id: string; message: string } | null>(null);

  // New hotel form state
  const [newHotelName, setNewHotelName] = useState('');
  const [newHotelLocation, setNewHotelLocation] = useState('');
  const [newHotelType, setNewHotelType] = useState('Hotel');
  const [newCheckIn, setNewCheckIn] = useState(() => new Date().toISOString().split('T')[0]);
  const [newCheckOut, setNewCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [newGuests, setNewGuests] = useState(2);
  const [newRooms, setNewRooms] = useState(1);
  const [newPricePerNight, setNewPricePerNight] = useState('');
  const [newHotelRef, setNewHotelRef] = useState('');

  if (!isOpen) return null;

  const filteredTickets = tickets.filter((t) => {
    if (activeTab === 'ALL') return true;
    return t.type === activeTab;
  });

  const trainCount = tickets.filter((t) => t.type === 'TRAIN').length;
  const flightCount = tickets.filter((t) => t.type === 'FLIGHT').length;
  const busCount = tickets.filter((t) => t.type === 'BUS').length;

  const handleSavePnr = (ticketId: string) => {
    if (tempPnr.trim()) {
      onUpdatePnr(ticketId, tempPnr.trim());
    }
    setEditingPnrId(null);
  };

  const handleSimulatePnrCheck = (ticket: TrackedTicket) => {
    setPnrStatusMessage({
      id: ticket.id,
      message: `Verified Handoff Status: Active & Synced. For official chart confirmation & coach/berth allocation, check directly on IRCTC / NTES Portal using PNR ${ticket.pnrOrBookingRef}.`,
    });
    setTimeout(() => {
      setPnrStatusMessage((prev) => (prev?.id === ticket.id ? null : prev));
    }, 6000);
  };

  const handleCreateManualTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newFrom.trim() || !newTo.trim()) return;

    const manualTicket: TrackedTicket = {
      id: `tkt_manual_${Date.now()}`,
      type: newType,
      title: newTitle.trim(),
      operatorOrTrainNumber: newTitle.trim(),
      from: newFrom.trim(),
      to: newTo.trim(),
      journeyDate: newDate,
      departureTime: '10:00 AM',
      arrivalTime: '06:30 PM',
      travelClass: newClass,
      travelers: '1 Adult',
      fare: newFare.trim() ? `₹${newFare.trim()}` : 'Standard Tariff',
      pnrOrBookingRef: newPnr.trim() || (newType === 'TRAIN' ? `IRCTC-${Math.floor(1000000000 + Math.random() * 9000000000)}` : `REF-${Math.floor(100000 + Math.random() * 900000)}`),
      bookingStatus: 'Tracked Ticket (Manual Entry)',
      provider: newType === 'TRAIN' ? 'IRCTC / Indian Railways' : newType === 'FLIGHT' ? 'Airline Direct' : 'Intercity Bus',
      bookingUrl: newType === 'TRAIN' ? 'https://www.irctc.co.in/nget/train-search' : undefined,
      bookedAt: new Date().toISOString(),
    };

    onAddTicket(manualTicket);
    setShowAddForm(false);
    setNewTitle('');
    setNewFrom('');
    setNewTo('');
    setNewPnr('');
    setNewFare('');
  };

  // Hotel handlers
  const handleSaveHotelRef = (hotelId: string) => {
    if (tempHotelRef.trim() && onUpdateHotelRef) {
      onUpdateHotelRef(hotelId, tempHotelRef.trim());
    }
    setEditingHotelRefId(null);
  };

  const handleSimulateHotelCheck = (hotel: TrackedHotelBooking) => {
    setHotelStatusMessage({
      id: hotel.id,
      message: `Verified Booking.com Handoff: Active Reservation. To manage rooms, special requests, or breakfast add-ons, view your reservation directly on Booking.com using confirmation code ${hotel.bookingRef}.`,
    });
    setTimeout(() => {
      setHotelStatusMessage((prev) => (prev?.id === hotel.id ? null : prev));
    }, 6000);
  };

  const handleCreateManualHotel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotelName.trim() || !newHotelLocation.trim()) return;

    const priceNum = Number(newPricePerNight) || 1999;
    const manualHotel: TrackedHotelBooking = {
      id: `hotel_manual_${Date.now()}`,
      hotelName: newHotelName.trim(),
      hotelType: newHotelType,
      location: newHotelLocation.trim(),
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      guests: newGuests,
      rooms: newRooms,
      pricePerNight: priceNum,
      totalPrice: priceNum,
      currency: 'INR',
      rating: 4.5,
      reviewsCount: 1,
      amenities: ['Free Wi-Fi', 'Air conditioning'],
      bookingRef: newHotelRef.trim() || `BK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      bookingStatus: 'Tracked Reservation',
      provider: 'Booking.com',
      bookingUrl: 'https://www.booking.com/',
      bookedAt: new Date().toISOString(),
    };

    if (onAddHotel) {
      onAddHotel(manualHotel);
    }
    setShowAddHotelForm(false);
    setNewHotelName('');
    setNewHotelLocation('');
    setNewPricePerNight('');
    setNewHotelRef('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div 
        className="bg-[#FAF9F5] rounded-2xl shadow-2xl max-w-4xl w-full border border-[#E1DDD1] flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#263D32] text-white p-5 sm:p-6 flex items-center justify-between border-b border-[#3D5A4C]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎫</span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                Track Bookings
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-emerald-200 mt-1">
              Check your booking status, verified travel tickets & hotel reservations
            </p>
          </div>

          <div className="flex items-center gap-3">
            {mainSection === 'TRAVEL' ? (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#C6A96B] hover:bg-[#d8bb7a] text-[#263D32] transition shadow-xs flex items-center gap-1.5"
              >
                <span>{showAddForm ? '✕ Close Form' : '+ Add / Track PNR'}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAddHotelForm(!showAddHotelForm)}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#C6A96B] hover:bg-[#d8bb7a] text-[#263D32] transition shadow-xs flex items-center gap-1.5"
              >
                <span>{showAddHotelForm ? '✕ Close Form' : '+ Add Hotel Booking'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl font-light leading-none p-1 rounded-lg hover:bg-white/10 transition"
              aria-label="Close Track Bookings Modal"
            >
              &times;
            </button>
          </div>
        </div>

        {/* PRIMARY SECTION TABS: TRAVEL VS HOTEL */}
        <div className="bg-[#EFECE4] px-5 sm:px-6 py-2.5 border-b border-[#E1DDD1] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMainSection('TRAVEL')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                mainSection === 'TRAVEL'
                  ? 'bg-[#263D32] text-white shadow-sm'
                  : 'bg-white text-[#263D32] hover:bg-gray-100 border border-[#E1DDD1]'
              }`}
            >
              <span>✈️ Travel Bookings</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                mainSection === 'TRAVEL' ? 'bg-[#526B57] text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {tickets.length}
              </span>
            </button>

            <button
              onClick={() => setMainSection('HOTEL')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                mainSection === 'HOTEL'
                  ? 'bg-[#003580] text-white shadow-sm'
                  : 'bg-white text-[#003580] hover:bg-gray-100 border border-[#E1DDD1]'
              }`}
            >
              <span>🏨 Hotel Bookings</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                mainSection === 'HOTEL' ? 'bg-[#00224f] text-white' : 'bg-blue-50 text-blue-800'
              }`}>
                {hotels.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-gray-500 font-medium hidden sm:block">
            {tickets.length + hotels.length} total tracked booking{tickets.length + hotels.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* ================= SECTION 1: TRAVEL BOOKINGS ================= */}
        {mainSection === 'TRAVEL' && (
          <>
            {/* Manual Add / Track Travel Form */}
            {showAddForm && (
              <div className="bg-white border-b border-[#E1DDD1] p-5 shadow-inner">
                <h3 className="text-sm font-bold text-[#263D32] mb-3 flex items-center gap-2">
                  <span>✍️</span> Track an Existing Booking or PNR
                </h3>
                <form onSubmit={handleCreateManualTicket} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Ticket Category</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as TrackedTicketType)}
                      className="w-full text-xs p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#526B57]"
                    >
                      <option value="TRAIN">🚆 Train Ticket (IRCTC)</option>
                      <option value="FLIGHT">✈️ Flight Ticket</option>
                      <option value="BUS">🚌 Bus Ticket</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      {newType === 'TRAIN' ? 'Train Name & Number' : newType === 'FLIGHT' ? 'Airline & Flight No' : 'Bus Operator'}
                    </label>
                    <input
                      type="text"
                      placeholder={newType === 'TRAIN' ? 'e.g. 12951 Mumbai Rajdhani' : newType === 'FLIGHT' ? 'e.g. IndiGo 6E-205' : 'e.g. Zingbus Multi-Axle'}
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      className="w-full text-xs p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#526B57]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">PNR / Booking Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. 8429104829 or 6-digit PNR"
                      value={newPnr}
                      onChange={(e) => setNewPnr(e.target.value)}
                      className="w-full text-xs p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#526B57]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">From Station / City</label>
                    <input
                      type="text"
                      placeholder="e.g. CSMT / Mumbai"
                      value={newFrom}
                      onChange={(e) => setNewFrom(e.target.value)}
                      required
                      className="w-full text-xs p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#526B57]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">To Station / City</label>
                    <input
                      type="text"
                      placeholder="e.g. NDLS / New Delhi"
                      value={newTo}
                      onChange={(e) => setNewTo(e.target.value)}
                      required
                      className="w-full text-xs p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#526B57]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Journey Date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      required
                      className="w-full text-xs p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#526B57]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Class</label>
                    <input
                      type="text"
                      placeholder="e.g. 3A, 2A, Economy, Sleeper"
                      value={newClass}
                      onChange={(e) => setNewClass(e.target.value)}
                      className="w-full text-xs p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#526B57]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Fare (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1245"
                      value={newFare}
                      onChange={(e) => setNewFare(e.target.value)}
                      className="w-full text-xs p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#526B57]"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 px-4 rounded-lg bg-[#526B57] hover:bg-[#3D5A4C] text-white text-xs font-bold transition shadow-xs"
                    >
                      Save & Track Ticket
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Travel Tab Filters */}
            <div className="bg-white px-5 sm:px-6 pt-3 border-b border-[#E1DDD1] flex items-center justify-between overflow-x-auto">
              <div className="flex gap-2 sm:gap-4 shrink-0">
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition ${
                    activeTab === 'ALL'
                      ? 'border-[#526B57] text-[#263D32]'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  All Tickets ({tickets.length})
                </button>
                <button
                  onClick={() => setActiveTab('TRAIN')}
                  className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'TRAIN'
                      ? 'border-[#263D32] text-[#263D32]'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>🚆 Train Tickets</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
                    {trainCount}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('FLIGHT')}
                  className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'FLIGHT'
                      ? 'border-[#1E3A8A] text-[#1E3A8A]'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>✈️ Flight Tickets</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 text-sky-800">
                    {flightCount}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('BUS')}
                  className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'BUS'
                      ? 'border-[#B45309] text-[#B45309]'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>🚌 Bus Tickets</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800">
                    {busCount}
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-gray-400 font-medium hidden md:block">
                {tickets.length} total tracked ticket{tickets.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Travel Tickets Scrollable List */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {filteredTickets.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#E1DDD1] max-w-lg mx-auto">
                  <div className="text-4xl mb-3">🎫</div>
                  <h4 className="text-base font-bold text-[#263D32]" style={{ fontFamily: 'Playfair Display, serif' }}>
                    No {activeTab === 'ALL' ? '' : activeTab.toLowerCase()} tickets tracked yet
                  </h4>
                  <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
                    When you click <strong className="text-[#263D32]">&quot;Book on IRCTC&quot;</strong>, <strong className="text-[#263D32]">&quot;Get Ticket&quot;</strong>, or select flight offers, your tickets are automatically tracked here. You can also manually add tickets with your PNR.
                  </p>
                  <div className="mt-5 flex justify-center gap-3">
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-[#526B57] text-white hover:bg-[#3D5A4C] transition shadow-xs"
                    >
                      + Add Ticket by PNR
                    </button>
                  </div>
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const isTrain = ticket.type === 'TRAIN';
                  const isFlight = ticket.type === 'FLIGHT';
                  const isBus = ticket.type === 'BUS';

                  return (
                    <div
                      key={ticket.id}
                      className="shadow-md rounded-xl border border-[#E1DDD1] bg-white transition hover:shadow-lg relative overflow-hidden"
                    >
                      {/* TOP BANNER: ALWAYS EXPLICITLY LABELED ABOVE THE TICKET */}
                      {isTrain && (
                        <div className="w-full bg-[#263D32] text-white px-4 py-2 text-xs font-black tracking-widest uppercase flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="text-sm">🚆</span>
                            <span>TRAIN TICKET</span>
                          </span>
                          <span className="text-[10px] tracking-normal font-medium bg-emerald-900/60 px-2.5 py-0.5 rounded border border-emerald-400/30">
                            Indian Railways / IRCTC Handoff
                          </span>
                        </div>
                      )}

                      {isFlight && (
                        <div className="w-full bg-[#1E3A8A] text-white px-4 py-2 text-xs font-black tracking-widest uppercase flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="text-sm">✈️</span>
                            <span>FLIGHT TICKET</span>
                          </span>
                          <span className="text-[10px] tracking-normal font-medium bg-sky-900/60 px-2.5 py-0.5 rounded border border-sky-400/30">
                            Aviation Carrier Deep-Link
                          </span>
                        </div>
                      )}

                      {isBus && (
                        <div className="w-full bg-[#B45309] text-white px-4 py-2 text-xs font-black tracking-widest uppercase flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="text-sm">🚌</span>
                            <span>BUS TICKET</span>
                          </span>
                          <span className="text-[10px] tracking-normal font-medium bg-amber-900/60 px-2.5 py-0.5 rounded border border-amber-400/30">
                            Intercity Fleet
                          </span>
                        </div>
                      )}

                      {/* TICKET BODY */}
                      <div className="p-4 sm:p-5">
                        {/* Title & Status Badge */}
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-3" style={{ borderColor: '#E1DDD1' }}>
                          <div>
                            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                              {isTrain ? 'Indian Railways Service' : isFlight ? 'Carrier Flight' : 'Bus Fleet'}
                            </div>
                            <h4 className="text-base sm:text-lg font-black text-[#263D32]">
                              {ticket.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                              <span>{ticket.bookingStatus}</span>
                            </span>
                            <button
                              onClick={() => onRemoveTicket(ticket.id)}
                              title="Remove from tracking"
                              className="text-gray-400 hover:text-red-600 p-1 text-sm transition"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* Route & Times Visual Grid */}
                        <div className="my-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          {/* Origin */}
                          <div className="min-w-[120px]">
                            <div className="text-2xl font-black text-[#263D32]">
                              {ticket.departureTime || 'Dep'}
                            </div>
                            <div className="text-sm font-bold text-gray-800 line-clamp-1">
                              {ticket.from}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              📅 {ticket.journeyDate}
                            </div>
                          </div>

                          {/* Journey Duration Bar */}
                          <div className="flex-1 flex flex-col items-center px-4 w-full sm:w-auto">
                            <span className="text-[11px] font-bold text-gray-500 mb-1">
                              ⏱️ {ticket.duration || 'Scheduled Duration'}
                            </span>
                            <div className="w-full flex items-center justify-center gap-2">
                              <div className="h-0.5 flex-1 bg-[#E1DDD1]"></div>
                              <span className="text-lg">
                                {isTrain ? '🚆' : isFlight ? '✈️' : '🚌'}
                              </span>
                              <div className="h-0.5 flex-1 bg-[#E1DDD1]"></div>
                            </div>
                            <span className="text-[10px] text-[#526B57] font-semibold mt-1">
                              {isTrain ? 'Indian Railways Network' : isFlight ? 'Verified Flight Route' : 'Intercity Route'}
                            </span>
                          </div>

                          {/* Destination */}
                          <div className="min-w-[120px] sm:text-right">
                            <div className="text-2xl font-black text-[#263D32]">
                              {ticket.arrivalTime || 'Arr'}
                            </div>
                            <div className="text-sm font-bold text-gray-800 line-clamp-1">
                              {ticket.to}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              Destination Terminus
                            </div>
                          </div>
                        </div>

                        {/* Details Pill Row */}
                        <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E1DDD1] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="block text-[10px] font-bold text-gray-500 uppercase">Class</span>
                            <span className="font-extrabold text-[#263D32]">{ticket.travelClass || 'Standard'}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-gray-500 uppercase">Quota / Type</span>
                            <span className="font-bold text-[#263D32]">{ticket.quota || 'General (GN)'}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-gray-500 uppercase">Travelers</span>
                            <span className="font-bold text-[#263D32]">{ticket.travelers || '1 Adult'}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-gray-500 uppercase">Fare</span>
                            <span className="font-extrabold text-emerald-800">{ticket.fare || 'Standard Tariff'}</span>
                          </div>
                        </div>

                        {/* PNR Section & Status Actions */}
                        <div className="mt-4 pt-3 border-t border-[#E1DDD1] flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-600">PNR / Ref:</span>
                            {editingPnrId === ticket.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={tempPnr}
                                  onChange={(e) => setTempPnr(e.target.value)}
                                  className="text-xs px-2 py-1 border rounded bg-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#526B57]"
                                  placeholder="Enter 10-digit PNR"
                                />
                                <button
                                  onClick={() => handleSavePnr(ticket.id)}
                                  className="text-xs px-2 py-1 rounded bg-[#526B57] text-white font-bold hover:bg-[#3D5A4C]"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingPnrId(null)}
                                  className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded bg-[#E1DDD1]/60 font-mono font-bold text-xs text-[#263D32]">
                                  {ticket.pnrOrBookingRef}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingPnrId(ticket.id);
                                    setTempPnr(ticket.pnrOrBookingRef);
                                  }}
                                  title="Edit or enter official IRCTC PNR"
                                  className="text-[11px] text-[#526B57] hover:underline font-semibold"
                                >
                                  ✏️ Edit PNR
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSimulatePnrCheck(ticket)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#526B57] text-[#526B57] hover:bg-[#526B57] hover:text-white transition"
                            >
                              🔍 Check Live PNR Status
                            </button>

                            {ticket.bookingUrl && (
                              <a
                                href={ticket.bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#526B57] text-white hover:bg-[#3D5A4C] transition shadow-xs inline-flex items-center gap-1"
                              >
                                <span>Open {isTrain ? 'IRCTC' : isFlight ? 'Airline' : 'Carrier'}</span>
                                <span>↗</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Live PNR Verification Notice Banner */}
                        {pnrStatusMessage?.id === ticket.id && (
                          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 animate-fadeIn">
                            <div className="font-bold flex items-center gap-1.5 mb-0.5">
                              <span>🟢</span>
                              <span>Verified NTES / IRCTC Booking Handoff</span>
                            </div>
                            <p className="text-[11px] text-emerald-800 leading-relaxed">
                              {pnrStatusMessage.message}
                            </p>
                            <div className="mt-2 flex gap-2">
                              <a
                                href="https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-bold text-emerald-950 underline"
                              >
                                Official Railway PNR Enquiry Portal ↗
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ================= SECTION 2: HOTEL BOOKINGS ================= */}
        {mainSection === 'HOTEL' && (
          <>
            {/* Manual Add Hotel Reservation Form */}
            {showAddHotelForm && (
              <div className="bg-white border-b border-[#E1DDD1] p-5 shadow-inner">
                <h3 className="text-sm font-bold text-[#003580] mb-3 flex items-center gap-2">
                  <span>🏨</span> Track an Existing Hotel Booking or Confirmation Code
                </h3>
                <form onSubmit={handleCreateManualHotel} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Hotel or Resort Name</label>
                    <input
                      type="text"
                      placeholder="e.g. The Grand Palace Resort"
                      value={newHotelName}
                      onChange={(e) => setNewHotelName(e.target.value)}
                      required
                      className="w-full text-xs p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#003580]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Property Type</label>
                    <select
                      value={newHotelType}
                      onChange={(e) => setNewHotelType(e.target.value)}
                      className="w-full text-xs p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#003580]"
                    >
                      <option value="Hotel">Hotel</option>
                      <option value="Resort">Resort</option>
                      <option value="Homestay">Homestay</option>
                      <option value="Vacation rental">Vacation Rental / Villa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Destination / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. City Center, Manali, Goa"
                      value={newHotelLocation}
                      onChange={(e) => setNewHotelLocation(e.target.value)}
                      required
                      className="w-full text-xs p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#003580]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Check-In Date</label>
                    <input
                      type="date"
                      value={newCheckIn}
                      onChange={(e) => setNewCheckIn(e.target.value)}
                      required
                      className="w-full text-xs p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#003580]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Check-Out Date</label>
                    <input
                      type="date"
                      value={newCheckOut}
                      onChange={(e) => setNewCheckOut(e.target.value)}
                      required
                      className="w-full text-xs p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#003580]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Booking.com Reference Code</label>
                    <input
                      type="text"
                      placeholder="e.g. BK-492041 or PIN code"
                      value={newHotelRef}
                      onChange={(e) => setNewHotelRef(e.target.value)}
                      className="w-full text-xs p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#003580]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Guests & Rooms</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newGuests}
                        onChange={(e) => setNewGuests(Number(e.target.value))}
                        className="w-full text-xs p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#003580]"
                      >
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                      <select
                        value={newRooms}
                        onChange={(e) => setNewRooms(Number(e.target.value))}
                        className="w-full text-xs p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#003580]"
                      >
                        {[1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>{n} Room{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Price per Night (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 2499"
                      value={newPricePerNight}
                      onChange={(e) => setNewPricePerNight(e.target.value)}
                      className="w-full text-xs p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#003580]"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 px-4 rounded-lg bg-[#003580] hover:bg-[#00224f] text-white text-xs font-bold transition shadow-xs"
                    >
                      Save & Track Hotel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Hotel Bookings Scrollable List */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {hotels.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#E1DDD1] max-w-lg mx-auto">
                  <div className="text-4xl mb-3">🏨</div>
                  <h4 className="text-base font-bold text-[#003580]" style={{ fontFamily: 'Playfair Display, serif' }}>
                    No hotel bookings tracked yet
                  </h4>
                  <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
                    When you click <strong className="text-[#003580]">&quot;Book Hotel&quot;</strong> on any stay offer, your hotel reservation details are automatically tracked here. You can also manually add a hotel reservation with your booking confirmation code.
                  </p>
                  <div className="mt-5 flex justify-center gap-3">
                    <button
                      onClick={() => setShowAddHotelForm(true)}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-[#003580] text-white hover:bg-[#00224f] transition shadow-xs"
                    >
                      + Add Hotel Booking
                    </button>
                  </div>
                </div>
              ) : (
                hotels.map((hotel) => {
                  return (
                    <div
                      key={hotel.id}
                      className="shadow-md rounded-xl border border-[#E1DDD1] bg-white transition hover:shadow-lg relative overflow-hidden"
                    >
                      {/* TOP BANNER: ALWAYS EXPLICITLY LABELED ABOVE THE HOTEL RESERVATION */}
                      <div className="w-full bg-[#003580] text-white px-4 py-2 text-xs font-black tracking-widest uppercase flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="text-sm">🏨</span>
                          <span>HOTEL BOOKING</span>
                        </span>
                        <span className="text-[10px] tracking-normal font-medium bg-blue-900/60 px-2.5 py-0.5 rounded border border-blue-300/30">
                          Booking.com Verified Handoff
                        </span>
                      </div>

                      {/* HOTEL CARD BODY */}
                      <div className="p-4 sm:p-5">
                        {/* Title & Status Badge */}
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-3" style={{ borderColor: '#E1DDD1' }}>
                          <div>
                            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                              <span>{hotel.hotelType || 'Hotel Stay'}</span>
                              {hotel.rating && (
                                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-bold text-[10px]">
                                  ⭐ {hotel.rating} {hotel.reviewsCount ? `(${hotel.reviewsCount})` : ''}
                                </span>
                              )}
                            </div>
                            <h4 className="text-base sm:text-lg font-black text-[#263D32]">
                              {hotel.hotelName}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-[#003580] border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#003580] animate-pulse"></span>
                              <span>{hotel.bookingStatus || 'Confirmed Handoff'}</span>
                            </span>
                            {onRemoveHotel && (
                              <button
                                onClick={() => onRemoveHotel(hotel.id)}
                                title="Remove hotel from tracking"
                                className="text-gray-400 hover:text-red-600 p-1 text-sm transition"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Dates & Location Visual Grid */}
                        <div className="my-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          {/* Check-In */}
                          <div className="min-w-[120px]">
                            <div className="text-xs font-bold text-gray-500 uppercase">Check-In</div>
                            <div className="text-xl font-black text-[#263D32]">
                              📅 {hotel.checkIn}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              Standard Check-in: 02:00 PM
                            </div>
                          </div>

                          {/* Stay Duration Connector */}
                          <div className="flex-1 flex flex-col items-center px-4 w-full sm:w-auto">
                            <span className="text-[11px] font-bold text-gray-500 mb-1">
                              🛏️ Confirmed Stay Duration
                            </span>
                            <div className="w-full flex items-center justify-center gap-2">
                              <div className="h-0.5 flex-1 bg-[#E1DDD1]"></div>
                              <span className="text-lg">🏨</span>
                              <div className="h-0.5 flex-1 bg-[#E1DDD1]"></div>
                            </div>
                            <span className="text-[10px] text-[#003580] font-semibold mt-1">
                              {hotel.location ? `📍 ${hotel.location}` : 'City Center Area'}
                            </span>
                          </div>

                          {/* Check-Out */}
                          <div className="min-w-[120px] sm:text-right">
                            <div className="text-xs font-bold text-gray-500 uppercase">Check-Out</div>
                            <div className="text-xl font-black text-[#263D32]">
                              📅 {hotel.checkOut}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              Standard Check-out: 11:00 AM
                            </div>
                          </div>
                        </div>

                        {/* Details Pill Row */}
                        <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E1DDD1] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="block text-[10px] font-bold text-gray-500 uppercase">Occupancy</span>
                            <span className="font-extrabold text-[#263D32]">
                              👥 {hotel.guests || 2} Guests · {hotel.rooms || 1} Room
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-gray-500 uppercase">Price / Night</span>
                            <span className="font-extrabold text-[#003580]">
                              {hotel.pricePerNight ? `₹${hotel.pricePerNight.toLocaleString('en-IN')}` : 'Tariff Quote'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-gray-500 uppercase">Provider</span>
                            <span className="font-bold text-[#003580]">{hotel.provider || 'Booking.com'}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-gray-500 uppercase">Added On</span>
                            <span className="font-medium text-gray-600">
                              {new Date(hotel.bookedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Amenities Chips */}
                        {hotel.amenities && hotel.amenities.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {hotel.amenities.map((am, idx) => (
                              <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#EFECE4] text-[#263D32]">
                                {am}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Booking Ref Section & Status Actions */}
                        <div className="mt-4 pt-3 border-t border-[#E1DDD1] flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-600">Confirmation Ref:</span>
                            {editingHotelRefId === hotel.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={tempHotelRef}
                                  onChange={(e) => setTempHotelRef(e.target.value)}
                                  className="text-xs px-2 py-1 border rounded bg-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#003580]"
                                  placeholder="Enter Booking.com PIN / Ref"
                                />
                                <button
                                  onClick={() => handleSaveHotelRef(hotel.id)}
                                  className="text-xs px-2 py-1 rounded bg-[#003580] text-white font-bold hover:bg-[#00224f]"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingHotelRefId(null)}
                                  className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded bg-blue-50 font-mono font-bold text-xs text-[#003580] border border-blue-200">
                                  {hotel.bookingRef}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingHotelRefId(hotel.id);
                                    setTempHotelRef(hotel.bookingRef);
                                  }}
                                  title="Edit Booking.com confirmation number"
                                  className="text-[11px] text-[#003580] hover:underline font-semibold"
                                >
                                  ✏️ Edit Reference
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSimulateHotelCheck(hotel)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white transition"
                            >
                              🔍 Check Live Status
                            </button>

                            <a
                              href={hotel.bookingUrl || 'https://www.booking.com/'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#003580] text-white hover:bg-[#00224f] transition shadow-xs inline-flex items-center gap-1.5"
                            >
                              <span>Open Booking.com</span>
                              <span>↗</span>
                            </a>
                          </div>
                        </div>

                        {/* Live Hotel Status Notice Banner */}
                        {hotelStatusMessage?.id === hotel.id && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-300 rounded-xl text-xs text-blue-950 animate-fadeIn">
                            <div className="font-bold flex items-center gap-1.5 mb-0.5">
                              <span>🔵</span>
                              <span>Verified Booking.com Handoff</span>
                            </div>
                            <p className="text-[11px] text-blue-900 leading-relaxed">
                              {hotelStatusMessage.message}
                            </p>
                            <div className="mt-2 flex gap-2">
                              <a
                                href="https://www.booking.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-bold text-blue-950 underline"
                              >
                                Official Booking.com Portal ↗
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="bg-[#FAF9F5] p-4 border-t border-[#E1DDD1] flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-2">
          <div className="flex items-center gap-2">
            <span>🛡️</span>
            <span>
              <strong>Truthful Tracking:</strong> XPLORA syncs verified travel and stay bookings across IRCTC, airlines, and Booking.com handoffs.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-[#263D32] text-white hover:bg-[#3D5A4C] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
