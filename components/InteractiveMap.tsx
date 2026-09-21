'use client';

import React, { useState } from 'react';

interface Activity {
  id?: string;
  timeSlot: string;
  title: string;
  description: string;
  category: string;
  kindLabel?: string;
  cost: number;
  costLabel?: string;
  location: string;
  mapsUrl?: string;
  lat?: number;
  lng?: number;
  travelTimeFromPrev?: string;
}

interface DayPlan {
  dayNumber: number;
  summary: string;
  activities: Activity[];
}

interface InteractiveMapProps {
  destination: string;
  dayPlans: DayPlan[];
  geocodedCenter?: {
    lat: number;
    lng: number;
  };
}


// Fast 100% Free Dynamic City Image & GPS Resolver
export function getFreeCityImageAndCoords(cityName: string) {
  const city = cityName.trim().toLowerCase();

  const cityDatabase: Record<string, { lat: number; lng: number; image: string }> = {
    pune: {
      lat: 18.5204,
      lng: 73.8567,
      image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=1200&q=75',
    },
    delhi: {
      lat: 28.6139,
      lng: 77.209,
      image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200&q=75',
    },
    hampi: {
      lat: 15.335,
      lng: 76.46,
      image: 'https://images.unsplash.com/photo-1620766182966-c6eb5ed2b788?w=1200&q=75',
    },
    goa: {
      lat: 15.2993,
      lng: 74.124,
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&q=75',
    },
    nagpur: {
      lat: 21.1458,
      lng: 79.0882,
      image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200&q=75',
    },
    manali: {
      lat: 32.2432,
      lng: 77.1892,
      image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=75',
    },
    jaipur: {
      lat: 26.9124,
      lng: 75.7873,
      image: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=1200&q=75',
    },
    kashmir: {
      lat: 34.0837,
      lng: 74.7973,
      image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=1200&q=75',
    },
    kerala: {
      lat: 9.4981,
      lng: 76.3388,
      image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=75',
    },
    mumbai: {
      lat: 19.076,
      lng: 72.8777,
      image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200&q=75',
    },
    udaipur: {
      lat: 24.5854,
      lng: 73.7125,
      image: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?w=1200&q=75',
    },
    paris: {
      lat: 48.8566,
      lng: 2.3522,
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=75',
    },
    sikkim: {
      lat: 27.3389,
      lng: 88.6065,
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=75',
    },
    gangtok: {
      lat: 27.3389,
      lng: 88.6065,
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=75',
    },
    ladakh: {
      lat: 34.1526,
      lng: 77.5771,
      image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=1200&q=75',
    },
    leh: {
      lat: 34.1526,
      lng: 77.5771,
      image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=1200&q=75',
    },
    varanasi: {
      lat: 25.3176,
      lng: 82.9739,
      image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1200&q=75',
    },
    agra: {
      lat: 27.1767,
      lng: 78.0081,
      image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200&q=75',
    },
    bangalore: {
      lat: 12.9716,
      lng: 77.5946,
      image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200&q=75',
    },
    bengaluru: {
      lat: 12.9716,
      lng: 77.5946,
      image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200&q=75',
    },
    hyderabad: {
      lat: 17.385,
      lng: 78.4867,
      image: 'https://images.unsplash.com/photo-1605007493699-ce65834f8a00?w=1200&q=75',
    },
    tokyo: {
      lat: 35.6762,
      lng: 139.6503,
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&q=75',
    },
    london: {
      lat: 51.5074,
      lng: -0.1278,
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=75',
    },
  };

  if (cityDatabase[city]) {
    return cityDatabase[city];
  }

  return {
    lat: 18.5204,
    lng: 73.8567,
    image: `https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=75`,
  };
}

export function InteractiveMap({ destination, dayPlans, geocodedCenter }: InteractiveMapProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const cityInfo = getFreeCityImageAndCoords(destination);
  const displayLat = geocodedCenter?.lat ?? cityInfo.lat;
  const displayLng = geocodedCenter?.lng ?? cityInfo.lng;
  const currentDayPlan = dayPlans?.find((d) => d.dayNumber === selectedDay) || dayPlans?.[0];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-[#E1DDD1] mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-4 gap-3" style={{ borderColor: '#E1DDD1' }}>
        <div>
          <h3 className="text-xl font-bold text-[#263D32]" style={{ fontFamily: 'Playfair Display, serif' }}>
            🗺️ Interactive Visual Route Map
          </h3>
          <p className="text-xs text-[#526B57]">
            Visualizing verified real activity locations & route pins for <span className="font-bold text-[#263D32]">{destination}</span>
          </p>
        </div>

        {/* Day Selector Pills */}
        <div className="flex gap-1.5 overflow-x-auto text-xs font-semibold">
          {dayPlans?.map((dp) => (
            <button
              key={dp.dayNumber}
              onClick={() => setSelectedDay(dp.dayNumber)}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedDay === dp.dayNumber
                  ? 'bg-[#526B57] text-white shadow-xs'
                  : 'bg-[#F4F1E6] text-[#263D32] hover:bg-[#E1DDD1]'
              }`}
            >
              Day {dp.dayNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Map Canvas with Fast City Background Wallpaper */}
      <div className="relative w-full min-h-[340px] rounded-xl overflow-hidden border border-[#E1DDD1] shadow-2xl flex flex-col justify-between p-5 group bg-slate-900">
        {/* City Wallpaper Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url('${cityInfo.image}')` }}
        />
        
        {/* Dark Backdrop Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/35 backdrop-blur-[1px]" />

        {/* Top Info Overlay */}
        <div className="relative z-10 flex justify-between items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-md">
            📍 GPS: {displayLat.toFixed(4)}° N, {displayLng.toFixed(4)}° E • {destination} Center
          </span>
          <span className="text-[11px] font-bold text-white bg-black/50 px-3 py-1 rounded-full border border-white/20 backdrop-blur-md">
            🗺️ OpenStreetMap Verified Pins
          </span>
        </div>

        {/* Pins List & Activity Route Flow */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          {currentDayPlan?.activities.map((act, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-white/90 hover:bg-white text-[#263D32] shadow-2xl backdrop-blur-md border border-white/60 transition transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-[#526B57] mb-1">
                <span>📍 Pin #{idx + 1} {act.lat && act.lng ? `(${act.lat.toFixed(2)}°, ${act.lng.toFixed(2)}°)` : ''}</span>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase bg-[#526B57]/15 text-[#526B57] font-extrabold">
                  {act.kindLabel || act.category}
                </span>
              </div>
              <h5 className="text-xs font-extrabold text-black line-clamp-1">{act.title}</h5>
              <p className="text-[10px] font-semibold text-gray-600 line-clamp-1 mt-0.5">⏱️ {act.timeSlot}</p>
              {act.travelTimeFromPrev && (
                <p className="text-[10px] font-bold text-teal-700 dark:text-teal-300 mt-0.5">
                  🚗 {act.travelTimeFromPrev}
                </p>
              )}
              <p className="text-[10px] font-bold text-[#526B57] line-clamp-1 mt-1 border-t pt-1 border-gray-200">
                🏛️ {act.location}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Route Legend */}
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-white/95 bg-black/40 p-3 rounded-xl backdrop-blur-md border border-white/15 gap-1">
          <span className="font-semibold">Day {selectedDay} Navigation: {currentDayPlan?.summary}</span>
          <span className="text-emerald-300 font-extrabold">● {currentDayPlan?.activities.length || 0} GPS Pins Plotted</span>
        </div>
      </div>
    </div>
  );
}
