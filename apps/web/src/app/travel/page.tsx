'use client';

import React, { useState, useEffect } from 'react';

interface WeatherOutput {
  temperature: number;
  rainProbability: number;
  humidity: number;
  windSpeed: number;
  icon: string;
  advice: string[];
}

interface TravelRoute {
  routeName: string;
  mode: 'walking' | 'driving' | 'metro' | 'bus' | 'taxi';
  estimatedTimeMinutes: number;
  costEstimate: number;
  walkingDistanceMeters: number;
  transfers: number;
  confidence: number;
  reason: string;
}

interface TravelRecommendations {
  bestRoute: TravelRoute;
  cheapestRoute: TravelRoute;
  fastestRoute: TravelRoute;
  accessibleRoute: TravelRoute;
}

interface Restaurant {
  name: string;
  rating: number;
  distanceMeters: number;
  estimatedWaitMinutes: number;
  priceRange: string;
  tags: string[];
}

interface StadiumGuide {
  entryGate: string;
  restrooms: string;
  foodCourt: string;
  medical: string;
  parkingZone: string;
  emergencyExit: string;
  accessibilityRoutes: string[];
}

interface Hotel {
  name: string;
  rating: number;
  distanceMeters: number;
  pricePerNight: number;
  tags: string[];
}

interface Medical {
  nearestMedicalBay: string;
  contactNumber: string;
  distanceMeters: number;
  emergencyResponseTimeMinutes: number;
}

interface Crowd {
  crowdDensity: 'Low' | 'Medium' | 'High' | 'Critical';
  waitTimeMinutes: number;
  recommendedGate: string;
  advice: string;
}

interface DayPlannerItem {
  time: string;
  title: string;
  description: string;
}

export default function TravelPage() {
  const [routes, setRoutes] = useState<TravelRecommendations | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<TravelRoute | null>(null);
  const [weather, setWeather] = useState<WeatherOutput | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [stadiumGuide, setStadiumGuide] = useState<StadiumGuide | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [medical, setMedical] = useState<Medical | null>(null);
  const [crowd, setCrowd] = useState<Crowd | null>(null);
  const [dayPlanner, setDayPlanner] = useState<DayPlannerItem[]>([]);
  const [journeyStep, setJourneyStep] = useState<
    'Booking Complete' | 'Travel Planned' | 'Commute Started' | 'Arrived at Stadium' | 'Entered Gate' | 'Seat Reached'
  >('Travel Planned');
  const [loading, setLoading] = useState(true);

  // Map layer toggles
  const [layers, setLayers] = useState({
    parking: true,
    restaurants: true,
    hotels: true,
    metro: true,
    medical: true,
    crowd: true,
    restrooms: true,
  });

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  };

  const ensureSession = async (): Promise<string | null> => {
    let token = localStorage.getItem('accessToken');
    if (!token) {
      try {
        const res = await fetch(`${getApiUrl()}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'fan@fifa.com', password: 'password123' }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.data.accessToken) {
          const accessToken = data.data.accessToken as string;
          localStorage.setItem('accessToken', accessToken);
          return accessToken;
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to auto-login guest session:', err);
      }
    }
    return token;
  };

  const loadTravelData = async () => {
    setLoading(true);
    const token = await ensureSession();
    if (!token) return;

    try {
      // 1. Get Route recommendations
      const routeRes = await fetch(`${getApiUrl()}/api/v1/travel/recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const routeData = await routeRes.json();
      if (routeRes.ok && routeData.success) {
        setRoutes(routeData.data);
        setSelectedRoute(routeData.data.bestRoute);
      }

      // 2. Get Restaurants
      const restRes = await fetch(`${getApiUrl()}/api/v1/travel/restaurants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const restData = await restRes.json();
      if (restRes.ok && restData.success) {
        setRestaurants(restData.data);
      }

      // 3. Get Stadium Guide
      const guideRes = await fetch(`${getApiUrl()}/api/v1/travel/stadium-guide`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const guideData = await guideRes.json();
      if (guideRes.ok && guideData.success) {
        setStadiumGuide(guideData.data);
      }

      // 4. Get Hotels
      const hotelRes = await fetch(`${getApiUrl()}/api/v1/travel/hotels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const hotelData = await hotelRes.json();
      if (hotelRes.ok && hotelData.success) {
        setHotels(hotelData.data);
      }

      // 5. Get Medical Bay info
      const medRes = await fetch(`${getApiUrl()}/api/v1/travel/medical`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const medData = await medRes.json();
      if (medRes.ok && medData.success) {
        setMedical(medData.data);
      }

      // 6. Get Crowd predictions
      const crowdRes = await fetch(`${getApiUrl()}/api/v1/travel/crowd`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const crowdData = await crowdRes.json();
      if (crowdRes.ok && crowdData.success) {
        setCrowd(crowdData.data);
      }

      // 7. Mock weather details
      setWeather({
        temperature: 24,
        rainProbability: 10,
        humidity: 60,
        windSpeed: 12,
        icon: 'sunny',
        advice: ['Carry sunscreen', 'Wear lightweight fabrics', 'Stay hydrated'],
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load travel recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTravelData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update visual day planner schedule and leave time recommendation dynamically
  useEffect(() => {
    if (!selectedRoute || !crowd || !stadiumGuide) return;

    const kickoffTime = '18:30';
    const totalBufferMinutes = selectedRoute.estimatedTimeMinutes + crowd.waitTimeMinutes + 30; // Travel + Queue + Buffer
    const leaveHour = 18;
    let leaveMin = 30 - totalBufferMinutes;
    let adjustedHour = leaveHour;
    if (leaveMin < 0) {
      adjustedHour -= 1;
      leaveMin += 60;
    }
    const leaveTimeStr = `${adjustedHour.toString().padStart(2, '0')}:${leaveMin.toString().padStart(2, '0')}`;

    const planner: DayPlannerItem[] = [
      { time: leaveTimeStr, title: 'Depart Home / Hotel', description: `Commute via ${selectedRoute.routeName} (${selectedRoute.mode}).` },
      { time: '17:30', title: 'Local Dinner', description: `Dine at Al Lusail Grill near the stadium.` },
      { time: '18:00', title: 'Stadium Security Checkpoint', description: `Clear gate entry at ${stadiumGuide.entryGate}.` },
      { time: '18:20', title: 'Find Seats', description: `Navigate to Section ${stadiumGuide.restrooms.split(' ')[0]}.` },
      { time: kickoffTime, title: 'Match Starts', description: 'Kickoff!' },
    ];
    setDayPlanner(planner);
  }, [selectedRoute, crowd, stadiumGuide]);

  const handleStartCommute = async () => {
    if (!selectedRoute) return;
    const token = await ensureSession();
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/travel/start-journey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: selectedRoute.mode,
          routeName: selectedRoute.routeName,
          durationMinutes: selectedRoute.estimatedTimeMinutes,
        }),
      });
      if (res.ok) {
        setJourneyStep('Commute Started');
        alert('Commute successfully registered! Journey timeline started.');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to start commute:', err);
    }
  };

  const toggleLayer = (layerName: keyof typeof layers) => {
    setLayers((prev) => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 bg-clip-text text-transparent">
            FIFA AI Travel Companion
          </h1>
          <p className="text-sm text-slate-400">Personalized Commute Itineraries & Ground Facility Maps</p>
        </div>
        {selectedRoute && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs space-y-1 text-right">
            <span className="font-bold text-amber-500">🛡️ Travel Confidence:</span>
            <div className="text-lg font-extrabold text-emerald-400">
              {Math.round(selectedRoute.confidence * 100)}% Match
            </div>
          </div>
        )}
      </header>

      {/* Progress Timeline Stepper */}
      <section className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6">
        <h2 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Journey Timeline</h2>
        <div className="flex justify-between items-center max-w-4xl mx-auto text-xs">
          {[
            'Booking Complete',
            'Travel Planned',
            'Commute Started',
            'Arrived at Stadium',
            'Entered Gate',
            'Seat Reached',
          ].map((step, idx) => {
            const isCompleted =
              idx <=
              [
                'Booking Complete',
                'Travel Planned',
                'Commute Started',
                'Arrived at Stadium',
                'Entered Gate',
                'Seat Reached',
              ].indexOf(journeyStep);
            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center space-y-2">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                      isCompleted ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className={isCompleted ? 'text-amber-500 font-semibold' : 'text-slate-500'}>{step}</span>
                </div>
                {idx < 5 && (
                  <div className={`flex-1 h-[2px] mx-4 ${isCompleted ? 'bg-amber-500' : 'bg-slate-900'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {/* Main Grid Section */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Itinerary Centerpiece & Interactive map */}
        <div className="lg:col-span-2 space-y-8">
          {/* Day Planner Centerpiece */}
          <section className="bg-gradient-to-tr from-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 bg-gradient-to-r from-amber-500 to-emerald-500 bg-clip-text text-transparent">
              🕒 AI Day Planner & Itinerary
            </h2>

            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex space-x-4">
                    <div className="h-6 w-16 bg-slate-800 rounded" />
                    <div className="flex-1 h-12 bg-slate-800 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {dayPlanner.map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-6 relative">
                    {/* Visual Vertical Connectors */}
                    {idx < dayPlanner.length - 1 && (
                      <div className="absolute left-[29px] top-6 w-[2px] h-[calc(100%+12px)] bg-slate-850" />
                    )}

                    <div className="w-16 text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg text-center">
                      {item.time}
                    </div>
                    <div className="flex-1 p-4 rounded-2xl bg-slate-900/40 border border-slate-850 space-y-1">
                      <h3 className="font-bold text-sm text-slate-100">{item.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}

                {selectedRoute && (
                  <div className="pt-4 border-t border-slate-900 flex justify-between items-center">
                    <p className="text-xs text-slate-400">
                      🔔 Suggested leave time includes a total commute of {selectedRoute.estimatedTimeMinutes} mins and {crowd?.waitTimeMinutes || 20} mins crowd wait at checkpoint.
                    </p>
                    <button
                      onClick={handleStartCommute}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-slate-950 font-extrabold text-xs transition-all shadow-md focus:outline-none"
                    >
                      Start Commute Now
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Interactive Layer Map */}
          <section className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Interactive Stadium City Map</h2>
                <p className="text-xs text-slate-400">Toggle layers to view transit routes and local services</p>
              </div>

              {/* Layer Toggles checkboxes */}
              <div className="flex flex-wrap gap-2.5 max-w-md justify-end">
                {Object.keys(layers).map((layer) => (
                  <button
                    key={layer}
                    type="button"
                    onClick={() => toggleLayer(layer as keyof typeof layers)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold border transition-colors ${
                      layers[layer as keyof typeof layers]
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                        : 'bg-slate-950 border-slate-850 text-slate-500'
                    }`}
                  >
                    {layer}
                  </button>
                ))}
              </div>
            </div>

            {/* Map Canvas */}
            <div className="relative flex justify-center py-8 bg-slate-950/80 rounded-2xl border border-slate-900">
              <svg width="600" height="300" viewBox="0 0 600 300" className="max-w-full">
                {/* Stadium boundary circle */}
                <circle cx="300" cy="150" r="50" fill="none" stroke="#334155" strokeWidth="3" strokeDasharray="6" />
                <text x="300" y="155" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">Stadium</text>

                {/* Metro Layer */}
                {layers.metro && (
                  <g>
                    {/* Route line */}
                    <path d="M 50,250 Q 200,200 250,150" fill="none" stroke="#0ea5e9" strokeWidth="4" />
                    <circle cx="50" cy="250" r="8" fill="#0ea5e9" />
                    <text x="50" y="270" textAnchor="middle" fill="#38bdf8" fontSize="8">Metro Station</text>
                  </g>
                )}

                {/* Parking Layer */}
                {layers.parking && (
                  <g>
                    <rect x="420" y="180" width="16" height="16" fill="#f59e0b" rx="2" />
                    <text x="428" y="192" textAnchor="middle" fill="#0f172a" fontSize="9" fontWeight="bold">P</text>
                    <text x="428" y="210" textAnchor="middle" fill="#cbd5e1" fontSize="8">Parking Lot C</text>
                  </g>
                )}

                {/* Restaurants Layer */}
                {layers.restaurants && (
                  <g>
                    <circle cx="380" cy="80" r="7" fill="#10b981" />
                    <text x="380" y="73" textAnchor="middle" fill="#cbd5e1" fontSize="8">Al Lusail Grill</text>
                  </g>
                )}

                {/* Hotels Layer */}
                {layers.hotels && (
                  <g>
                    <polygon points="120,60 130,80 110,80" fill="#a855f7" />
                    <text x="120" y="93" textAnchor="middle" fill="#cbd5e1" fontSize="8">Grand Plaza Hotel</text>
                  </g>
                )}

                {/* Medical Layer */}
                {layers.medical && (
                  <g>
                    <rect x="230" y="220" width="14" height="14" fill="#ef4444" rx="2" />
                    <text x="237" y="231" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">+</text>
                    <text x="237" y="245" textAnchor="middle" fill="#fca5a5" fontSize="8">Medical Center</text>
                  </g>
                )}

                {/* Restrooms Layer */}
                {layers.restrooms && (
                  <g>
                    <circle cx="280" cy="110" r="5" fill="#e2e8f0" />
                    <text x="280" y="103" textAnchor="middle" fill="#94a3b8" fontSize="8">Restrooms</text>
                  </g>
                )}

                {/* Crowd Density Heat Layer */}
                {layers.crowd && (
                  <g>
                    {/* Gate queue warning indicator */}
                    <circle cx="250" cy="150" r="18" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="1" strokeDasharray="3" />
                    <circle cx="250" cy="150" r="4" fill="#ef4444" />
                    <text x="250" y="138" textAnchor="middle" fill="#fca5a5" fontSize="8">Gate Queue (High)</text>
                  </g>
                )}
              </svg>
            </div>
          </section>
        </div>

        {/* Right Column: Transit Options, Weather, dining, and emergency details */}
        <div className="space-y-8">
          {/* Transit Route options */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Transit Route Options</h2>

            {routes ? (
              <div className="space-y-3">
                {[
                  { key: 'bestRoute', label: 'Best Route', icon: '🌟' },
                  { key: 'cheapestRoute', label: 'Cheapest Route', icon: '💰' },
                  { key: 'fastestRoute', label: 'Fastest Route', icon: '⚡' },
                  { key: 'accessibleRoute', label: 'Accessible Route', icon: '♿' },
                ].map((item) => {
                  const route = routes[item.key as keyof TravelRecommendations];
                  const isSelected = selectedRoute?.mode === route.mode;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSelectedRoute(route)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex justify-between items-center ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/40 text-slate-100 shadow-md'
                          : 'bg-slate-950/60 border-slate-900 hover:border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="block text-xs font-extrabold uppercase text-amber-500">
                          {item.icon} {item.label}
                        </span>
                        <span className="block text-[10px] text-slate-400">{route.routeName}</span>
                        <div className="flex space-x-2 text-[10px] font-mono text-slate-400 mt-1">
                          <span>⏱️ {route.estimatedTimeMinutes}m</span>
                          <span>•</span>
                          <span>💵 ${route.costEstimate}</span>
                          <span>•</span>
                          <span>🚶 {route.walkingDistanceMeters}m walk</span>
                        </div>
                      </div>
                      <span className="text-lg">➔</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="h-40 bg-slate-950/60 rounded-2xl animate-pulse" />
            )}
          </section>

          {/* Weather card */}
          {weather && (
            <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
              <span className="text-xs uppercase font-bold text-amber-500 tracking-wider">🌡️ Stadium Weather</span>
              <div className="flex justify-between items-center">
                <div className="text-3xl font-extrabold">{weather.temperature}°C</div>
                <div className="text-right text-xs text-slate-400">
                  <div>💧 Humidity: {weather.humidity}%</div>
                  <div>💨 Wind: {weather.windSpeed} km/h</div>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-3 space-y-2">
                <span className="block text-[10px] text-slate-500 uppercase font-bold">AI Safety Advice</span>
                <div className="flex flex-wrap gap-1.5">
                  {weather.advice.map((adv) => (
                    <span key={adv} className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[9px] font-semibold">
                      {adv}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Dining card */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Local Dining Spots</h2>
            <div className="space-y-3">
              {restaurants.slice(0, 3).map((rest) => (
                <div key={rest.name} className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">{rest.name}</span>
                    <span className="text-amber-500 font-bold">★ {rest.rating}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>📍 {rest.distanceMeters}m away</span>
                    <span>⏱️ Wait: {rest.estimatedWaitMinutes}m</span>
                    <span className="font-extrabold text-emerald-400">{rest.priceRange}</span>
                  </div>
                  <div className="flex gap-1">
                    {rest.tags.map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 bg-slate-900 text-slate-500 rounded text-[8px] uppercase font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Accommodations Card */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Accommodations Near Stadium</h2>
            <div className="space-y-3">
              {hotels.slice(0, 3).map((hotel) => (
                <div key={hotel.name} className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">{hotel.name}</span>
                    <span className="text-amber-500 font-bold">★ {hotel.rating}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>📍 {hotel.distanceMeters}m away</span>
                    <span className="font-extrabold text-emerald-400">${hotel.pricePerNight} / night</span>
                  </div>
                  <div className="flex gap-1">
                    {hotel.tags.map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 bg-slate-900 text-slate-500 rounded text-[8px] uppercase font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Emergency & medical check */}
          {medical && (
            <section className="bg-rose-950/20 border border-rose-500/10 rounded-3xl p-6 space-y-3">
              <span className="px-2 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                🚨 Emergency & Medical info
              </span>
              <h3 className="font-bold text-sm text-slate-200">{medical.nearestMedicalBay}</h3>
              <div className="text-xs text-slate-400 space-y-1">
                <div>📞 Hotline: <span className="font-mono text-slate-200">{medical.contactNumber}</span></div>
                <div>⏱️ Emergency Response: <span className="font-mono text-slate-200">{medical.emergencyResponseTimeMinutes} mins</span></div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
