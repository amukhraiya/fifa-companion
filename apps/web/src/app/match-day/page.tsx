'use client';

import React, { useState, useEffect } from 'react';

interface LiveMatchStats {
  currentMinute: number;
  score: string;
  possession: string;
  shotsHome: number;
  shotsAway: number;
  cornersHome: number;
  cornersAway: number;
  yellowCardsHome: number;
  yellowCardsAway: number;
  redCardsHome: number;
  redCardsAway: number;
  expectedGoalsHome: number;
  expectedGoalsAway: number;
  momentum: number;
  pressureHome: number;
  pressureAway: number;
  fanEnergy: number;
}

interface MatchEvent {
  id: string;
  minute: number;
  eventType: string;
  team: string;
  player?: string;
  detail: string;
}

interface StadiumNavigationOutput {
  routeDescription: string;
  distanceMeters: number;
  estimatedMinutes: number;
  pathCoordinates: Array<{ x: number; y: number }>;
  accessibleElevatorUsed: boolean;
}

interface EmergencyOutput {
  boothName: string;
  locationDetails: string;
  status: string;
  emergencyContact: string;
  urgentInstructions: string;
}

interface MatchPrediction {
  homeWinProbability: number;
  awayWinProbability: number;
  drawProbability: number;
}

interface FanPulseState {
  sentiment: string;
  decibels: number;
  chantText: string;
  energyIndex: number;
}

interface ReplayOutput {
  cameraAngles: string[];
  replayAvailable: boolean;
  bestSeatAngle: string;
  clipDurationSeconds: number;
}

interface DecisionItem {
  minute: number;
  authority: string;
  detail: string;
}

export default function MatchDayPage() {
  const [minute, setMinute] = useState(76);
  const [stats, setStats] = useState<LiveMatchStats | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [commentary, setCommentary] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Array<{ title: string; detail: string }>>([]);
  const [decisionTimeline, setDecisionTimeline] = useState<DecisionItem[]>([]);
  const [matchSummary, setMatchSummary] = useState<string>('');
  const [predictor, setPredictor] = useState<MatchPrediction | null>(null);
  const [pulse, setPulse] = useState<FanPulseState | null>(null);

  const [language, setLanguage] = useState<'English' | 'Spanish' | 'Portuguese' | 'French' | 'Hindi' | 'Arabic'>('English');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState<string>('None');
  const [navigation, setNavigation] = useState<StadiumNavigationOutput | null>(null);
  const [emergency, setEmergency] = useState<EmergencyOutput | null>(null);
  const [replay, setReplay] = useState<ReplayOutput | null>(null);
  const [sosActive, setSosActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  // Fan challenge states
  const [predHomeScore, setPredHomeScore] = useState('');
  const [predAwayScore, setPredAwayScore] = useState('');
  const [predScorer, setPredScorer] = useState('striker');
  const [votedMvp, setVotedMvp] = useState('');
  const [challengeSubmitted, setChallengeSubmitted] = useState(false);

  // Mock voice command state
  const [voiceInput, setVoiceInput] = useState('');
  const [voiceResponse, setVoiceResponse] = useState('');

  // Map layer controls
  const [layers, setLayers] = useState({
    seat: true,
    food: true,
    restrooms: true,
    medical: true,
    merchandise: true,
    security: true,
    emergencyExits: true,
    crowdHeat: true,
    navigationPath: true,
    heatmapAnimation: true,
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
        console.error('Failed auto-login guest session:', err);
      }
    }
    return token;
  };

  const loadMatchDayState = async (currentMin: number) => {
    const token = await ensureSession();
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/match-day/state?minute=${currentMin}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.data.stats);
        setEvents(data.data.events);
        setCommentary(data.data.commentary);
        setNotifications(data.data.notifications);
        setDecisionTimeline(data.data.decisionTimeline);
        setMatchSummary(data.data.matchSummary);
        setPredictor(data.data.predictor);
        setPulse(data.data.pulse);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load matchday telemetry state:', err);
    } finally {
      setLoading(false);
    }
  };

  // Simulating live ticks
  useEffect(() => {
    loadMatchDayState(minute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minute]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setMinute((prev) => {
        if (prev >= 90) {
          setIsPlaying(false);
          return 90;
        }
        return prev + 1;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Auto transition mode notification
  useEffect(() => {
    if (minute === 1) {
      alert('📢 Auto Transition: Match day has begun! Portal shifting into Live Match Companion Mode.');
    }
  }, [minute]);

  // Handle translation change
  const handleLanguageChange = async (lang: typeof language) => {
    setLanguage(lang);
    const token = await ensureSession();
    if (!token) return;

    try {
      await fetch(`${getApiUrl()}/api/v1/match-day/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accessibilityNeeds,
          language: lang,
        }),
      });
      loadMatchDayState(minute);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to save preferences:', err);
    }
  };

  // Handle accessibility change
  const handleAccessibilityChange = async (needs: string) => {
    setAccessibilityNeeds(needs);
    const token = await ensureSession();
    if (!token) return;

    try {
      await fetch(`${getApiUrl()}/api/v1/match-day/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accessibilityNeeds: needs,
          language,
        }),
      });
      // Compute accessible route dynamically
      const navRes = await fetch(`${getApiUrl()}/api/v1/match-day/navigate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from: 'Gate 3 East',
          to: 'Section 112',
          accessibilityMode: needs !== 'None',
        }),
      });
      const navData = await navRes.json();
      if (navRes.ok && navData.success) {
        setNavigation(navData.data);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to update accessibility criteria:', err);
    }
  };

  const triggerSOS = async (type: 'medical' | 'security') => {
    setSosActive(true);
    const token = await ensureSession();
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/match-day/emergency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmergency(data.data);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to dispatch emergency SOS:', err);
    }
  };

  const loadCameraReplay = async () => {
    const token = await ensureSession();
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/match-day/replay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventType: 'Goal' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReplay(data.data);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch camera replay feeds:', err);
    }
  };

  // Mock voice commands handler
  const handleVoiceCommand = () => {
    const query = voiceInput.toLowerCase();
    if (query.includes('restroom') || query.includes('toilet')) {
      setVoiceResponse('🎙️ Voice Command: "Restroom found in Section 112 & Section 204. Walk along main concourse block 112."');
    } else if (query.includes('seat')) {
      setVoiceResponse('🎙️ Voice Command: "Your seat is Block 112 Aisle C. Follow the yellow path indicators on the map."');
    } else if (query.includes('first aid') || query.includes('medical') || query.includes('doctor')) {
      setVoiceResponse('🎙️ Voice Command: "First Aid Trauma Center Section 115 coordinates highlighted. Urgent dispatch team notified."');
    } else if (query.includes('merchandise') || query.includes('shop')) {
      setVoiceResponse('🎙️ Voice Command: "Official FIFA Shop is located behind Section 106."');
    } else {
      setVoiceResponse(`🎙️ Voice Command: "Command '${voiceInput}' registered. Searching stadium registry..."`);
    }
    setVoiceInput('');
  };

  const toggleLayer = (layerName: keyof typeof layers) => {
    setLayers((prev) => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center animate-pulse">
        <div className="text-sm font-bold text-slate-400">Loading live World Cup telemetry...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Live scoreboard header */}
      {stats ? (
        <header className="bg-gradient-to-tr from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="flex items-center space-x-6">
            <span className="text-sm font-mono font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 animate-pulse">
              ⏱️ Min {stats.currentMinute}&apos;
            </span>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-amber-500 to-emerald-400 bg-clip-text text-transparent">
                {stats.score}
              </h1>
              <p className="text-xs text-slate-400 mt-1">FIFA World Cup Live Matchday Companion</p>
            </div>
          </div>

          {/* Expected Goals & possession dial */}
          <div className="flex space-x-8 text-xs font-mono">
            <div className="text-center">
              <span className="block text-slate-500 uppercase text-[9px] font-bold">Possession</span>
              <span className="text-sm font-black text-slate-200">{stats.possession}</span>
            </div>
            <div className="text-center">
              <span className="block text-slate-500 uppercase text-[9px] font-bold">xG Ratio</span>
              <span className="text-sm font-black text-emerald-400">
                {stats.expectedGoalsHome} - {stats.expectedGoalsAway}
              </span>
            </div>
            <div className="text-center">
              <span className="block text-slate-500 uppercase text-[9px] font-bold">Fan Energy</span>
              <span className="text-sm font-black text-amber-400">{stats.fanEnergy}%</span>
            </div>
          </div>

          {/* Simulator control settings */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                isPlaying
                  ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                  : 'bg-slate-950 border-slate-880 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isPlaying ? '⏸️ Pause Sim' : '▶️ Play Sim'}
            </button>
            <input
              type="range"
              min="1"
              max="90"
              value={minute}
              onChange={(e) => setMinute(parseInt(e.target.value))}
              className="w-24 accent-amber-500"
            />
          </div>
        </header>
      ) : (
        <div className="h-28 bg-slate-900/40 rounded-3xl animate-pulse" />
      )}

      {/* Predictor bar and Fan Sentiment */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Match predictor win probabilities */}
        {predictor && (
          <section className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">📊 Live Match Predictor</span>
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Brazil: {predictor.homeWinProbability}%</span>
              <span>Draw: {predictor.drawProbability}%</span>
              <span>Spain: {predictor.awayWinProbability}%</span>
            </div>
            <div className="h-4.5 w-full bg-slate-950 rounded-full overflow-hidden flex">
              <div style={{ width: `${predictor.homeWinProbability}%` }} className="bg-emerald-500 h-full transition-all duration-500" />
              <div style={{ width: `${predictor.drawProbability}%` }} className="bg-slate-700 h-full transition-all duration-500" />
              <div style={{ width: `${predictor.awayWinProbability}%` }} className="bg-red-500 h-full transition-all duration-500" />
            </div>
          </section>
        )}

        {/* Fan Pulse state */}
        {pulse && (
          <section className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">🔊 Fan Sentiment Pulse</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">
                {pulse.sentiment}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <div>Decibels: <span className="text-amber-400 font-bold">{pulse.decibels} dB</span></div>
              <div>Energy Index: <span className="text-emerald-400 font-bold">{pulse.energyIndex}%</span></div>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl text-center text-xs italic font-semibold text-slate-300">
              &ldquo;{pulse.chantText}&rdquo;
            </div>
          </section>
        )}
      </div>

      {/* Main Grid View */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Interactive Map & timeline */}
        <div className="lg:col-span-2 space-y-8">
          {/* Interactive SVG stadium map */}
          <section className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Live Stadium Ground Map</h2>
                <p className="text-xs text-slate-400">Your Seat: Block 112 Aisle C</p>
              </div>

              {/* Layer toggles */}
              <div className="flex flex-wrap gap-2 justify-end max-w-md">
                {Object.keys(layers).map((l) => (
                  <button
                    key={l}
                    onClick={() => toggleLayer(l as keyof typeof layers)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] uppercase font-bold border transition-colors ${
                      layers[l as keyof typeof layers]
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                        : 'bg-slate-950 border-slate-850 text-slate-500'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Stadium SVG with heatmap animation */}
            <div className="relative flex justify-center py-6 bg-slate-950/80 rounded-2xl border border-slate-900">
              <svg width="500" height="280" viewBox="0 0 500 280" className="max-w-full">
                {/* Outermost pitch ring */}
                <ellipse cx="250" cy="140" rx="200" ry="110" fill="none" stroke="#334155" strokeWidth="2" />
                <ellipse cx="250" cy="140" rx="160" ry="85" fill="none" stroke="#1e293b" strokeWidth="1.5" />

                {/* Animated Stadium Heatmap layers */}
                {layers.heatmapAnimation && (
                  <g className="animate-pulse">
                    <ellipse cx="250" cy="140" rx="220" ry="120" fill="none" stroke="#ef4444" strokeWidth="6" strokeOpacity="0.08" />
                    <ellipse cx="250" cy="140" rx="180" ry="95" fill="none" stroke="#ef4444" strokeWidth="4" strokeOpacity="0.05" />
                  </g>
                )}

                {/* Seating Sectors */}
                <path d="M 120,80 Q 250,30 380,80" fill="none" stroke="#475569" strokeWidth="6" strokeDasharray="4" />
                <path d="M 120,200 Q 250,250 380,200" fill="none" stroke="#475569" strokeWidth="6" strokeDasharray="4" />

                {/* Seat marker */}
                {layers.seat && (
                  <g>
                    <circle cx="200" cy="70" r="7" fill="#fbbf24" />
                    <text x="200" y="58" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="black">YOUR SEAT</text>
                  </g>
                )}

                {/* Restrooms */}
                {layers.restrooms && (
                  <g>
                    <circle cx="150" cy="190" r="5" fill="#38bdf8" />
                    <text x="150" y="182" textAnchor="middle" fill="#7dd3fc" fontSize="7">Restroom</text>
                  </g>
                )}

                {/* Food Court */}
                {layers.food && (
                  <g>
                    <circle cx="340" cy="190" r="6" fill="#10b981" />
                    <text x="340" y="181" textAnchor="middle" fill="#34d399" fontSize="7">Food</text>
                  </g>
                )}

                {/* Medical Station */}
                {layers.medical && (
                  <g>
                    <rect x="240" y="210" width="12" height="12" fill="#ef4444" rx="2" />
                    <text x="246" y="219" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">+</text>
                    <text x="246" y="232" textAnchor="middle" fill="#fca5a5" fontSize="7">First Aid</text>
                  </g>
                )}

                {/* Merchandise */}
                {layers.merchandise && (
                  <g>
                    <circle cx="280" cy="65" r="5" fill="#a855f7" />
                    <text x="280" y="58" textAnchor="middle" fill="#d8b4fe" fontSize="7">Merch</text>
                  </g>
                )}

                {/* Security Desk */}
                {layers.security && (
                  <g>
                    <rect x="360" y="100" width="10" height="10" fill="#f97316" rx="2" />
                    <text x="365" y="93" textAnchor="middle" fill="#ffedd5" fontSize="7">Security</text>
                  </g>
                )}

                {/* Emergency Exits */}
                {layers.emergencyExits && (
                  <g>
                    <line x1="80" y1="140" x2="60" y2="140" stroke="#f43f5e" strokeWidth="3" />
                    <text x="50" y="143" textAnchor="middle" fill="#fda4af" fontSize="8" fontWeight="bold">EXIT</text>
                  </g>
                )}

                {/* Navigation Routing path */}
                {layers.navigationPath && navigation && (
                  <path d="M 90,140 Q 200,90 200,70" fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray="4" />
                )}

                {/* Crowd Density Heatmaps */}
                {layers.crowdHeat && (
                  <g>
                    <circle cx="90" cy="140" r="15" fill="#f43f5e" fillOpacity="0.2" />
                    <circle cx="90" cy="140" r="3" fill="#f43f5e" />
                    <text x="90" y="122" textAnchor="middle" fill="#fda4af" fontSize="7">Gate A (Critical)</text>
                  </g>
                )}
              </svg>
            </div>

            {/* Path description summary */}
            {navigation && (
              <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl text-xs space-y-1">
                <span className="font-extrabold text-amber-500">🗺️ Guided Route Directions:</span>
                <p className="text-slate-300">{navigation.routeDescription}</p>
                <div className="flex space-x-3 text-[10px] text-slate-500 font-mono pt-1">
                  <span>🚶 Proximity: {navigation.distanceMeters}m</span>
                  <span>•</span>
                  <span>⏱️ Commute time: {navigation.estimatedMinutes} mins</span>
                  {navigation.accessibleElevatorUsed && (
                    <span className="text-emerald-400 font-bold">♿ Wheelchair lift route integrated</span>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Event Timeline progression */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">Live Match Timeline</h2>
            <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6 text-xs">
              {events.map((evt) => (
                <div key={evt.id} className="relative">
                  {/* Timeline point dot */}
                  <span className="absolute -left-[31px] top-0.5 h-4.5 w-4.5 rounded-full border-2 border-slate-950 bg-amber-500 flex items-center justify-center text-[8px] text-slate-950 font-black">
                    {evt.minute}&apos;
                  </span>
                  <div className="bg-slate-950/50 border border-slate-900 rounded-xl p-3.5 space-y-1">
                    <span className="font-extrabold text-amber-500 uppercase text-[9px] tracking-wider">
                      {evt.eventType}
                    </span>
                    <p className="text-slate-200">{evt.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AI Decision Timeline (Ref, VAR, Coach) */}
          {decisionTimeline.length > 0 && (
            <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
              <h2 className="text-lg font-bold text-white">🛡️ AI Decision timeline (Referee/VAR/Coach)</h2>
              <div className="space-y-4">
                {decisionTimeline.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl flex items-start space-x-4 text-xs">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold font-mono">
                      {item.minute}&apos;
                    </span>
                    <div className="space-y-1">
                      <span className="block font-bold text-slate-200">{item.authority}</span>
                      <p className="text-slate-400 leading-relaxed">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* AI Match Summary at Full Time (Minute 90) */}
          {minute === 90 && matchSummary && (
            <section className="bg-gradient-to-tr from-amber-500/10 to-emerald-500/10 border border-amber-500/20 rounded-3xl p-6 space-y-3">
              <span className="px-2 py-1 bg-amber-500/15 text-amber-400 rounded-lg text-[9px] font-extrabold uppercase tracking-wider">
                🏆 AI Match Summary
              </span>
              <p className="text-sm font-semibold text-slate-100 leading-relaxed">{matchSummary}</p>
            </section>
          )}
        </div>

        {/* Right Column: AI Commentary, preferences, challenges, SOS */}
        <div className="space-y-8">
          {/* Mock Speech Voice commands */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
            <span className="text-xs uppercase font-bold text-amber-500 tracking-wider">🎙️ Voice Commands (Accessibility Mock)</span>
            <p className="text-[10px] text-slate-500">
              Speak or type query (e.g. &apos;Where is my seat?&apos;, &apos;Call first aid&apos;, &apos;Find restroom&apos;)
            </p>
            <div className="flex space-x-2">
              <input
                type="text"
                value={voiceInput}
                onChange={(e) => setVoiceInput(e.target.value)}
                placeholder="Ask match companion..."
                className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs outline-none"
              />
              <button
                type="button"
                onClick={handleVoiceCommand}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Send
              </button>
            </div>
            {voiceResponse && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 italic">
                {voiceResponse}
              </div>
            )}
          </section>

          {/* Fan Challenges card */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
            <span className="text-xs uppercase font-bold text-amber-500 tracking-wider">🎮 Fan Challenges</span>

            {challengeSubmitted ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 text-center font-bold">
                ✓ Challenge prediction details locked! Good luck!
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-450 uppercase font-bold">Predict Final Score</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="BRA"
                      value={predHomeScore}
                      onChange={(e) => setPredHomeScore(e.target.value)}
                      className="w-1/2 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-center"
                    />
                    <input
                      type="number"
                      placeholder="ESP"
                      value={predAwayScore}
                      onChange={(e) => setPredAwayScore(e.target.value)}
                      className="w-1/2 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-center"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-450 uppercase font-bold">Predict Next Scorer</label>
                  <select
                    value={predScorer}
                    onChange={(e) => setPredScorer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2"
                  >
                    <option value="striker">Striker (Neymar / Morata)</option>
                    <option value="midfielder">Midfielder (Rodri / Pedri)</option>
                    <option value="winger">Winger (Vinicius Jr / Nico Williams)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-450 uppercase font-bold">Vote MVP</label>
                  <select
                    value={votedMvp}
                    onChange={(e) => setVotedMvp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2"
                  >
                    <option value="">Select player...</option>
                    <option value="Neymar Jr">Neymar Jr (Brazil)</option>
                    <option value="Alvaro Morata">Alvaro Morata (Spain)</option>
                    <option value="Vinicius Jr">Vinicius Jr (Brazil)</option>
                    <option value="Rodri">Rodri (Spain)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setChallengeSubmitted(true)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:opacity-90 font-bold text-slate-950 text-xs"
                >
                  Submit Challenge Picks
                </button>
              </div>
            )}
          </section>

          {/* Camera Replay Guidance */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase font-bold text-amber-500 tracking-wider">🎥 Stadium Camera Guide</span>
              <button
                type="button"
                onClick={loadCameraReplay}
                className="text-[10px] text-amber-500 font-bold hover:underline"
              >
                Load Cam Angles
              </button>
            </div>

            {replay ? (
              <div className="space-y-3 text-xs">
                <div>Best viewing angle for seat: <span className="font-bold text-emerald-400">{replay.bestSeatAngle}</span></div>
                <div className="space-y-1.5 pt-1.5 border-t border-slate-900">
                  <span className="block text-[9px] uppercase font-bold text-slate-500">Available Feed Channels</span>
                  <div className="flex flex-wrap gap-1.5">
                    {replay.cameraAngles.map((cam) => (
                      <span key={cam} className="px-2 py-1 bg-slate-950 border border-slate-900 rounded-lg text-[9px] font-semibold text-slate-350">
                        {cam}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500">Load instant multi-angle replay clip coordinates.</p>
            )}
          </section>

          {/* AI Commentary scrolls */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Live AI Commentary</h2>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
                Real-Time feeds
              </span>
            </div>

            <div className="overflow-y-auto max-h-[250px] space-y-3 pr-2">
              {commentary.map((line, idx) => (
                <div key={idx} className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-2xl text-xs leading-relaxed text-slate-300 font-medium">
                  {line}
                </div>
              ))}
            </div>
          </section>

          {/* Multilingual translations */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
            <span className="text-xs uppercase font-bold text-amber-500 tracking-wider">🗣_ Language Assistant</span>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 block uppercase font-bold">Select Language</label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as typeof language)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none font-bold"
              >
                {['English', 'Spanish', 'Portuguese', 'French', 'Hindi', 'Arabic'].map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Accessibility Settings */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
            <span className="text-xs uppercase font-bold text-amber-500 tracking-wider">♿ Accessibility Controls</span>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span>Wheelchair Route Optimization</span>
                <input
                  type="checkbox"
                  checked={accessibilityNeeds === 'Wheelchair'}
                  onChange={(e) => handleAccessibilityChange(e.target.checked ? 'Wheelchair' : 'None')}
                  className="accent-amber-500 h-4 w-4"
                />
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Voice Guidance & Audio Description</span>
                <input type="checkbox" className="accent-amber-500 h-4 w-4" />
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Subtitles & Caption Mode</span>
                <input type="checkbox" className="accent-amber-500 h-4 w-4" />
              </div>
            </div>
          </section>

          {/* Emergency SOS Button */}
          <section className="bg-rose-950/20 border border-rose-500/10 rounded-3xl p-6 space-y-4">
            <span className="text-xs uppercase font-bold text-rose-500 tracking-wider">🚨 Safety Dispatch Center</span>
            <p className="text-xs text-rose-300/80 leading-relaxed">
              If you require urgent medical aid or security assistance, click below to ping stadium stewards.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => triggerSOS('medical')}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-slate-950 font-black text-xs transition-all shadow-lg focus:outline-none"
              >
                🏥 Request Medical SOS
              </button>
              <button
                onClick={() => triggerSOS('security')}
                className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-550 text-slate-950 font-black text-xs transition-all shadow-lg focus:outline-none"
              >
                👮 Request Security SOS
              </button>
            </div>

            {sosActive && emergency && (
              <div className="p-4 bg-slate-950/80 border border-rose-500/20 rounded-2xl text-xs space-y-2">
                <span className="block font-bold text-rose-400">🏥 Emergency Center Status: {emergency.status}</span>
                <p className="text-slate-300">{emergency.boothName}</p>
                <p className="text-[10px] text-slate-500">📍 Details: {emergency.locationDetails}</p>
                <div className="p-2.5 bg-rose-500/10 border border-rose-550/10 rounded-lg text-[10px] text-rose-300 leading-relaxed animate-pulse">
                  📢 Instructions: {emergency.urgentInstructions}
                </div>
              </div>
            )}
          </section>

          {/* Smart Notification Center with AI Insights */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
            <span className="text-xs uppercase font-bold text-amber-500 tracking-wider">🔔 Smart Notification Alerts</span>
            <div className="space-y-3.5">
              {notifications.map((n, idx) => (
                <div key={idx} className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-2xl text-xs space-y-1">
                  <h4 className="font-extrabold text-amber-500">{n.title}</h4>
                  <p className="text-slate-400 leading-relaxed font-medium">{n.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
