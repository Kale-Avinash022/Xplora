'use client';

import React, { useState, useEffect } from 'react';

interface ParsedDetails {
  destination: string;
  startDate: string;
  durationDays: number;
  budget: number;
  numTravelers: number;
  interests: string[];
}

interface ConfirmParsedDetailsModalProps {
  isOpen: boolean;
  parsedDetails: ParsedDetails | null;
  onClose: () => void;
  onConfirm: (confirmed: ParsedDetails) => void;
}

export function ConfirmParsedDetailsModal({
  isOpen,
  parsedDetails,
  onClose,
  onConfirm,
}: ConfirmParsedDetailsModalProps) {
  const [destination, setDestination] = useState('Goa');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState(3);
  const [budget, setBudget] = useState(25000);
  const [numTravelers, setNumTravelers] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Adventure']);

  useEffect(() => {
    if (parsedDetails) {
      setDestination(parsedDetails.destination || 'Goa');
      setStartDate(parsedDetails.startDate || new Date().toISOString().split('T')[0]);
      setDurationDays(parsedDetails.durationDays || 3);
      setBudget(parsedDetails.budget || 25000);
      setNumTravelers(parsedDetails.numTravelers || 1);
      setSelectedInterests(parsedDetails.interests?.length > 0 ? parsedDetails.interests : ['Adventure']);
    }
  }, [parsedDetails]);

  if (!isOpen || !parsedDetails) return null;

  const availableInterests = ['Adventure', 'Beach', 'Culinary', 'Heritage', 'Relaxation'];

  const toggleInterest = (tag: string) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter((t) => t !== tag));
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const handleFormConfirm = () => {
    onConfirm({
      destination,
      startDate,
      durationDays,
      budget,
      numTravelers,
      interests: selectedInterests.length > 0 ? selectedInterests : ['Adventure'],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#E1DDD1]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 text-white flex justify-between items-center" style={{ backgroundColor: '#263D32' }}>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 text-white mb-1">
              <span>Screen 2 of 3</span>
              <span>• AI Entity Verification</span>
            </div>
            <h3 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
              Confirm Parsed Trip Details
            </h3>
            <p className="text-xs text-white/80">Review & edit what AI extracted before generating your itinerary</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Editable Form */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Destination */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Destination City
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border text-sm font-semibold text-[#263D32] bg-gray-50 focus:bg-white focus:outline-none"
              style={{ borderColor: '#E1DDD1' }}
            />
          </div>

          {/* Dates & Duration Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold text-[#263D32] bg-gray-50 focus:bg-white focus:outline-none"
                style={{ borderColor: '#E1DDD1' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Duration (Days)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={durationDays}
                onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold text-[#263D32] bg-gray-50 focus:bg-white focus:outline-none"
                style={{ borderColor: '#E1DDD1' }}
              />
            </div>
          </div>

          {/* Budget & Travelers Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Max Budget (₹)
              </label>
              <input
                type="number"
                step={1000}
                value={budget}
                onChange={(e) => setBudget(Math.max(1000, Number(e.target.value)))}
                className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold text-[#263D32] bg-gray-50 focus:bg-white focus:outline-none"
                style={{ borderColor: '#E1DDD1' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Travelers Count
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={numTravelers}
                onChange={(e) => setNumTravelers(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold text-[#263D32] bg-gray-50 focus:bg-white focus:outline-none"
                style={{ borderColor: '#E1DDD1' }}
              />
            </div>
          </div>

          {/* Interest Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Interest Tags & Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {availableInterests.map((tag) => {
                const isSelected = selectedInterests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                      isSelected
                        ? 'bg-[#526B57] text-white border-[#526B57]'
                        : 'bg-gray-50 text-[#263D32] border-[#E1DDD1]'
                    }`}
                  >
                    {tag === 'Adventure' ? '🧗 Adventure' : tag === 'Beach' ? '🏖️ Beach' : tag === 'Culinary' ? '🥗 Culinary' : tag === 'Heritage' ? '🏛️ Heritage' : '✨ Relaxation'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3" style={{ borderColor: '#E1DDD1' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleFormConfirm}
            className="px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition hover:scale-105"
            style={{ backgroundColor: '#526B57' }}
          >
            🚀 Confirm & Generate Itinerary ➔
          </button>
        </div>
      </div>
    </div>
  );
}
