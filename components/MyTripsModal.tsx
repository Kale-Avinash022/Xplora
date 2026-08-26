'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface MyTripsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; name: string; email: string } | null;
  onSelectTrip: (trip: any) => void;
}

export function MyTripsModal({ isOpen, onClose, currentUser, onSelectTrip }: MyTripsModalProps) {
  const [trips, setTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/itineraries?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
      } else {
        setError('Failed to fetch your saved trips.');
      }
    } catch (err) {
      console.error('Fetch trips error:', err);
      setError('Unexpected error loading saved trips.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchTrips();
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn">
      <div 
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-[#E1DDD1] flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#263D32] to-[#526B57] text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧳</span>
            <div>
              <h3 className="text-2xl font-bold font-serif">My Saved Trips</h3>
              <p className="text-xs text-white/80">
                {currentUser ? `Manage and view all your saved AI itineraries` : 'Log in to view saved itineraries'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition text-lg"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {!currentUser ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">🔒</div>
              <h4 className="text-xl font-bold text-[#263D32] mb-2">Account Required</h4>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                Please log in or create an account to view and manage your saved trip itineraries.
              </p>
              <Link
                href="/login"
                onClick={onClose}
                className="px-6 py-3 text-white font-bold rounded-xl shadow-md transition inline-block"
                style={{ backgroundColor: '#526B57' }}
              >
                Log In / Sign Up ➔
              </Link>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
              <div className="w-8 h-8 border-4 border-[#526B57] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Loading your saved trips...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center text-sm">
              {error}
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">🌴</div>
              <h4 className="text-lg font-bold text-[#263D32] mb-1">No Saved Trips Yet</h4>
              <p className="text-sm text-gray-500 mb-4">
                Generate an AI trip itinerary and click "Save to My Trips" to see it stored here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trips.map((trip) => (
                <div 
                  key={trip.id}
                  className="p-5 rounded-xl border bg-[#F4F1E6]/40 hover:bg-[#F4F1E6]/80 transition border-[#E1DDD1] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#526B57]/15 text-[#263D32]">
                        {trip.travelStyle || 'General'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(trip.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-[#263D32] mb-1 line-clamp-1">
                      {trip.title}
                    </h4>
                    <p className="text-xs font-semibold text-[#526B57] mb-3">
                      📍 {trip.destination} • ⏱️ {trip.durationDays} Days • 💰 ₹{trip.budget?.toLocaleString('en-IN')} {trip.currency}
                    </p>

                    {trip.dayPlans && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-4">
                        {trip.dayPlans.length} Days Planned with {trip.dayPlans.reduce((acc: number, dp: any) => acc + (dp.activities?.length || 0), 0)} Total Activities
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      onSelectTrip(trip);
                      onClose();
                    }}
                    className="w-full py-2.5 text-xs font-bold text-white rounded-lg shadow-sm transition flex items-center justify-center gap-1"
                    style={{ backgroundColor: '#526B57' }}
                  >
                    🚀 Open & View Itinerary
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-[#E1DDD1] flex justify-between items-center text-xs text-gray-500">
          <span>{trips.length} Saved Trip{trips.length !== 1 ? 's' : ''}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-gray-700 hover:text-black transition"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
