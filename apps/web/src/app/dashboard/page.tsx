'use client';

import React, { useState, useEffect } from 'react';

interface Match {
  id: string;
  venueId: string;
  date: string;
  venue: { name: string; info: string };
  teams: Array<{ team: { name: string } }>;
}

interface SeatingRecommendation {
  type: 'Best Overall' | 'Best Budget' | 'Premium Experience';
  seatId: string;
  matchId: string;
  stadiumName: string;
  teams: string[];
  section: string;
  row: string;
  number: string;
  price: number;
  confidence: number;
  justifications: string[];
  breakdown: {
    favoriteTeamMatch: number;
    budgetMatch: number;
    seatingMatch: number;
    accessibilityMatch: number;
  };
}

interface Seat {
  id: string;
  matchId: string;
  section: string;
  row: string;
  number: string;
  price: number;
  status: 'Available' | 'Locked' | 'Reserved';
}

interface TicketDetails {
  id: string;
  qrCode: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [recommendations, setRecommendations] = useState<SeatingRecommendation[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [activeLock, setActiveLock] = useState<{ id: string; expiresAt: string } | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [bookingStep, setBookingStep] = useState<
    'Match Selected' | 'Seat Recommended' | 'Seat Selected' | 'Seat Locked' | 'Payment' | 'Ticket Generated'
  >('Match Selected');
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});

  // Fan Profile State (static snapshot for UI demonstration)
  const fanDNA = {
    favoriteTeam: 'Argentina',
    budget: 5000,
    seatPreference: 'Midfield',
    accessibilityNeeds: 'None',
  };

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/booking/matches`);
      const data = await res.json();
      if (res.ok && data.success) {
        setMatches(data.data);
        if (data.data.length > 0) {
          setSelectedMatch(data.data[0]);
          fetchSeats(data.data[0].id);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load matches:', err);
    }
  };

  const fetchRecommendations = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/booking/recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecommendations(data.data);
        if (data.data.length > 0) {
          setBookingStep('Seat Recommended');
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch recommendations:', err);
    }
  };

  const fetchSeats = async (matchId: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/booking/seats/${matchId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSeats(data.data);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch seats:', err);
    }
  };

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    fetchSeats(match.id);
    setSelectedSeat(null);
    setBookingStep('Match Selected');
  };

  const handleSelectSeat = (seat: Seat) => {
    if (seat.status !== 'Available') return;
    setSelectedSeat(seat);
    setBookingStep('Seat Selected');
  };

  const handleLockSeat = async () => {
    if (!selectedSeat) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/booking/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ seatId: selectedSeat.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveLock(data.data);
        setCountdown(300); // 5 minutes timer
        setBookingStep('Seat Locked');
      } else {
        alert(data.error?.message || 'Lock failed');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Lock execution failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseLock = async () => {
    if (!selectedSeat) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${getApiUrl()}/api/v1/booking/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ seatId: selectedSeat.id }),
      });
      setActiveLock(null);
      setCountdown(0);
      setBookingStep('Seat Selected');
      fetchSeats(selectedSeat.matchId);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Release lock failed:', err);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSeat) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/booking/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ seatId: selectedSeat.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTicketDetails(data.data);
        setBookingStep('Ticket Generated');
        setActiveLock(null);
        setCountdown(0);
        fetchSeats(selectedSeat.matchId);
      } else {
        alert(data.error?.message || 'Confirmation failed');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Confirm failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && activeLock) {
      handleReleaseLock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, activeLock]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-amber-500 to-emerald-500 bg-clip-text text-transparent">
            FIFA Intelligent Booking Hub
          </h1>
          <p className="text-sm text-slate-400">Intelligent seating recommendations & real-time booking</p>
        </div>
        {/* Fan DNA summary */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs space-y-1">
          <span className="font-bold text-amber-500">Fan DNA Profile:</span>
          <div>⚽ Favorite Team: {fanDNA.favoriteTeam}</div>
          <div>💰 Budget: ${fanDNA.budget}</div>
          <div>💺 Seat: {fanDNA.seatPreference}</div>
        </div>
      </header>

      {/* Match Selector Dropdown */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
        <label htmlFor="match-select" className="text-sm font-bold text-slate-200">
          Selected Match:
        </label>
        <select
          id="match-select"
          aria-label="Select World Cup Match"
          value={selectedMatch?.id || ''}
          onChange={(e) => {
            const m = matches.find((match) => match.id === e.target.value);
            if (m) handleSelectMatch(m);
          }}
          className="px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none"
        >
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.teams.map((t) => t.team.name).join(' vs ')}
            </option>
          ))}
        </select>
      </section>

      {/* Progress Timeline Indicator */}
      <section className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6">
        <h2 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Booking Journey Progression</h2>
        <div className="flex justify-between items-center max-w-4xl mx-auto text-xs">
          {[
            'Match Selected',
            'Seat Recommended',
            'Seat Selected',
            'Seat Locked',
            'Payment',
            'Ticket Generated',
          ].map((step, idx) => {
            const isCompleted =
              idx <=
              [
                'Match Selected',
                'Seat Recommended',
                'Seat Selected',
                'Seat Locked',
                'Payment',
                'Ticket Generated',
              ].indexOf(bookingStep);
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Recommendations & Seat Map */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recommendations Cards */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">AI Seating Recommendations</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.type}
                  className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-500/30 transition-colors"
                >
                  <div className="space-y-3">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-amber-500/10 text-amber-500">
                      {rec.type}
                    </span>
                    <h3 className="font-bold text-sm text-slate-100">{rec.teams.join(' vs ')}</h3>
                    <div className="text-xs text-slate-400">
                      🏟️ {rec.stadiumName} | Row {rec.row} Seat {rec.number}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-extrabold text-emerald-400">${rec.price}</span>
                      <span className="text-slate-400 font-medium">Confidence: {Math.round(rec.confidence * 100)}%</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-850 space-y-3">
                    <button
                      type="button"
                      onClick={() =>
                        setShowExplanation((prev) => ({ ...prev, [rec.type]: !prev[rec.type] }))
                      }
                      className="text-xs text-amber-500 hover:text-amber-400 font-semibold focus:outline-none flex justify-between w-full"
                    >
                      <span>Why this Recommendation?</span>
                      <span>{showExplanation[rec.type] ? '▲' : '▼'}</span>
                    </button>

                    {showExplanation[rec.type] && (
                      <div className="text-[11px] text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-850 space-y-2">
                        <ul className="space-y-1">
                          {rec.justifications.map((just, idx) => (
                            <li key={idx} className="flex items-center space-x-1.5">
                              <span className="text-emerald-500">✓</span>
                              <span>{just}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="border-t border-slate-850 pt-2 space-y-1 text-slate-400">
                          <div className="flex justify-between">
                            <span>Favorite Team Fit:</span>
                            <span>{rec.breakdown.favoriteTeamMatch}/40</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Budget Fit:</span>
                            <span>{rec.breakdown.budgetMatch}/30</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Interactive Seat Map */}
          <section className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Interactive Stadium Seat Map</h2>
                <p className="text-xs text-slate-400">Select an available seat marker to configure booking</p>
              </div>
              {/* Category Legends */}
              <div className="flex space-x-4 text-[10px]">
                <div className="flex items-center space-x-1.5">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span>Category 1</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-3 w-3 rounded-full bg-cyan-500" />
                  <span>Category 2</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <span>Category 3</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-500" />
                  <span>Locked</span>
                </div>
              </div>
            </div>

            {/* Stadium Arena SVG Layout */}
            <div className="relative flex justify-center py-8 bg-slate-950/80 rounded-2xl border border-slate-900">
              <svg width="400" height="200" viewBox="0 0 400 200" className="max-w-full">
                {/* Midfield pitch marker */}
                <rect x="140" y="60" width="120" height="80" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4" />
                <circle cx="200" cy="100" r="20" fill="none" stroke="#334155" strokeWidth="2" />

                {/* Seating Grid */}
                {seats.map((seat, index) => {
                  const x = 40 + (index % 10) * 35;
                  const y = 30 + Math.floor(index / 10) * 35;

                  const isSelected = selectedSeat?.id === seat.id;
                  const color =
                    seat.status === 'Reserved' || seat.status === 'Locked'
                      ? '#ef4444'
                      : seat.section === 'Category 1'
                      ? '#10b981'
                      : seat.section === 'Category 2'
                      ? '#06b6d4'
                      : '#f59e0b';

                  return (
                    <g key={seat.id} className="cursor-pointer" onClick={() => handleSelectSeat(seat)}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? '12' : '9'}
                        fill={color}
                        className="transition-all hover:scale-125"
                        stroke={isSelected ? '#ffffff' : 'none'}
                        strokeWidth="2"
                      />
                      <text x={x} y={y + 3} textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="bold">
                        {seat.row}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </section>
        </div>

        {/* Right Column: Checkout, Summary, and Timeline */}
        <div className="space-y-8">
          {/* Reservation checkout card */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-white">Reservation Summary</h2>

            {selectedSeat ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-900 space-y-3">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Seat ID</span>
                    <span className="font-mono text-slate-200">{selectedSeat.id.substring(0, 8)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Row / Seat</span>
                    <span className="text-slate-200">
                      Row {selectedSeat.row} Seat {selectedSeat.number}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Price</span>
                    <span className="text-emerald-400 font-extrabold text-sm">${selectedSeat.price}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Seating Group</span>
                    <span className="text-slate-200">{selectedSeat.section}</span>
                  </div>
                </div>

                {/* Locks Countdown Timer */}
                {activeLock && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex justify-between items-center text-xs">
                    <span className="text-rose-400 font-bold">🔒 Seat Temporarily Locked</span>
                    <span className="font-mono text-rose-500 font-bold">
                      {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}

                {/* State-based Buttons */}
                {!activeLock ? (
                  <button
                    onClick={handleLockSeat}
                    disabled={loading}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all"
                  >
                    {loading ? 'Locking...' : 'Lock and Reserve Seat'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={handleConfirmBooking}
                      disabled={loading}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all"
                    >
                      {loading ? 'Processing...' : 'Confirm Ticket Payment'}
                    </button>
                    <button
                      onClick={handleReleaseLock}
                      className="w-full py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 text-xs rounded-xl"
                    >
                      Cancel Reservation
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                Select a seat on the map or recommendations to start.
              </div>
            )}
          </section>

          {/* Ticket Confirmation panel */}
          {ticketDetails && (
            <section className="bg-slate-900/60 border border-emerald-500/20 rounded-3xl p-6 space-y-4">
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                ✓ Booking Complete
              </span>
              <h2 className="text-lg font-bold text-slate-100">Ticket Receipt Issued</h2>

              <div className="p-4 bg-slate-950 border border-emerald-500/10 rounded-2xl space-y-4 text-xs font-mono text-slate-300">
                <div>TICKET CODE: {ticketDetails.qrCode}</div>
                <div>CREATED AT: {new Date(ticketDetails.createdAt).toLocaleString()}</div>
                <div className="text-center font-bold text-amber-500 mt-2">QR SIGNATURE VALIDATED</div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
