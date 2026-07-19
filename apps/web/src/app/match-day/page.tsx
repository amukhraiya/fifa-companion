'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Pause, Activity, TrendingUp, Mic, Map as MapIcon, ShieldAlert, MapPin, Zap, MessageSquare, Globe, ArrowLeft, Layers } from 'lucide-react';

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
  const [decisionTimeline, setDecisionTimeline] = useState<DecisionItem[]>([]);
  const [predictor, setPredictor] = useState<MatchPrediction | null>(null);
  const [pulse, setPulse] = useState<FanPulseState | null>(null);

  const [language, setLanguage] = useState<'English' | 'Spanish' | 'Portuguese' | 'French' | 'Hindi' | 'Arabic'>('English');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState<string>('None');
  const [navigation, setNavigation] = useState<StadiumNavigationOutput | null>(null);
  const [emergency, setEmergency] = useState<EmergencyOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

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
        if (res.ok && data.success && data.data?.accessToken) {
          const accessToken = data.data.accessToken as string;
          localStorage.setItem('accessToken', accessToken);
          return accessToken;
        }

        const guestRes = await fetch(`${getApiUrl()}/api/v1/auth/guest-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const guestData = await guestRes.json();
        if (guestRes.ok && guestData.success && guestData.data?.accessToken) {
          const accessToken = guestData.data.accessToken as string;
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
        setDecisionTimeline(data.data.decisionTimeline);
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

  const handleLanguageChange = async (lang: typeof language) => {
    setLanguage(lang);
    const token = await ensureSession();
    if (!token) return;

    try {
      await fetch(`${getApiUrl()}/api/v1/match-day/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accessibilityNeeds, language: lang }),
      });
      loadMatchDayState(minute);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to save preferences:', err);
    }
  };

  const handleAccessibilityChange = async (needs: string) => {
    setAccessibilityNeeds(needs);
    const token = await ensureSession();
    if (!token) return;

    try {
      await fetch(`${getApiUrl()}/api/v1/match-day/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accessibilityNeeds: needs, language }),
      });
      
      const navRes = await fetch(`${getApiUrl()}/api/v1/match-day/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ from: 'Gate 3 East', to: 'Section 112', accessibilityMode: needs !== 'None' }),
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
    const token = await ensureSession();
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/match-day/emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

  const handleVoiceCommand = () => {
    const query = voiceInput.toLowerCase();
    if (query.includes('restroom') || query.includes('toilet')) {
      setVoiceResponse('🎙️ "Restroom found in Section 112 & Section 204. Walk along main concourse block 112."');
    } else if (query.includes('seat')) {
      setVoiceResponse('🎙️ "Your seat is Block 112 Aisle C. Follow the yellow path indicators on the map."');
    } else if (query.includes('first aid') || query.includes('medical') || query.includes('doctor')) {
      setVoiceResponse('🎙️ "First Aid Trauma Center Section 115 coordinates highlighted. Urgent dispatch team notified."');
    } else if (query.includes('merchandise') || query.includes('shop')) {
      setVoiceResponse('🎙️ "Official FIFA Shop is located behind Section 106."');
    } else {
      setVoiceResponse(`🎙️ "Command '${voiceInput}' registered. Searching stadium registry..."`);
    }
    setVoiceInput('');
  };

  const toggleLayer = (layerName: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layerName]: !prev[layerName] }));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 mix-blend-overlay"></div>
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin z-10 mb-4"></div>
        <div className="text-sm font-bold text-white/50 z-10 tracking-widest uppercase">Connecting to Stadium Network...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background relative pb-24 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 pt-8 relative z-10 space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Live scoreboard header */}
        {stats && (
          <header className="glass-card rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row justify-between items-center gap-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-t border-primary/20">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="bg-black/60 border border-primary/30 px-6 py-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px]">
                <div className="text-primary font-black text-2xl flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  {stats.currentMinute}&apos;
                </div>
                <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1">Live Match</div>
              </div>
              
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary via-amber-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-sm tracking-tight mb-2">
                  {stats.score}
                </h1>
                <p className="text-sm font-medium text-white/60 flex items-center gap-2 justify-center md:justify-start">
                  <MapPin className="w-4 h-4 text-emerald-400" /> Lusail Iconic Stadium
                </p>
              </div>
            </div>

            {/* Expected Goals & possession dial */}
            <div className="flex gap-6 lg:gap-10">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Possession</span>
                <span className="text-xl font-black text-white">{stats.possession}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">xG Ratio</span>
                <span className="text-xl font-black text-emerald-400">{stats.expectedGoalsHome} - {stats.expectedGoalsAway}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Fan Energy</span>
                <span className="text-xl font-black text-amber-400">{stats.fanEnergy}%</span>
              </div>
            </div>

            {/* Simulator control settings */}
            <div className="flex flex-col items-center gap-3 w-full lg:w-auto bg-black/40 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 w-full">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">1&apos;</span>
                <input
                  type="range"
                  min="1"
                  max="90"
                  value={minute}
                  onChange={(e) => setMinute(parseInt(e.target.value))}
                  className="w-full lg:w-32 accent-primary h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
                />
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">90&apos;</span>
              </div>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  isPlaying ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isPlaying ? <><Pause className="w-4 h-4"/> Pause Sim</> : <><Play className="w-4 h-4"/> Play Sim</>}
              </button>
            </div>
          </header>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {predictor && (
            <section className="glass-card rounded-3xl p-6 border-t border-amber-500/20">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-bold uppercase tracking-widest text-amber-500">Live Predictor</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-white mb-3">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Brazil {predictor.homeWinProbability}%</span>
                <span className="flex items-center gap-2 text-white/50">Draw {predictor.drawProbability}%</span>
                <span className="flex items-center gap-2">Spain {predictor.awayWinProbability}%<span className="w-2 h-2 rounded-full bg-rose-500"></span></span>
              </div>
              <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden flex">
                <div style={{ width: `${predictor.homeWinProbability}%` }} className="bg-emerald-500 h-full transition-all duration-1000" />
                <div style={{ width: `${predictor.drawProbability}%` }} className="bg-white/20 h-full transition-all duration-1000" />
                <div style={{ width: `${predictor.awayWinProbability}%` }} className="bg-rose-500 h-full transition-all duration-1000" />
              </div>
            </section>
          )}

          {pulse && (
            <section className="glass-card rounded-3xl p-6 border-t border-primary/20">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <span className="text-sm font-bold uppercase tracking-widest text-primary">Fan Pulse</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                  {pulse.sentiment}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold mb-4">
                <div>Decibels: <span className="text-amber-400 text-lg ml-2">{pulse.decibels} dB</span></div>
                <div>Energy Index: <span className="text-emerald-400 text-lg ml-2">{pulse.energyIndex}%</span></div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center text-xs font-semibold text-white/80 italic">
                &ldquo;{pulse.chantText}&rdquo;
              </div>
            </section>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="glass-panel rounded-3xl p-6 border border-white/10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-primary" /> Live Stadium Map
                  </h2>
                  <p className="text-xs text-white/50 mt-1">Your Seat: Block 112 Aisle C</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  {Object.keys(layers).map((l) => (
                    <button
                      key={l}
                      onClick={() => toggleLayer(l as keyof typeof layers)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all ${
                        layers[l as keyof typeof layers]
                          ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(217,119,6,0.2)]'
                          : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {l.replace(/([A-Z])/g, ' $1').trim()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative flex justify-center py-8 bg-black/60 rounded-2xl border border-white/5 overflow-hidden">
                <svg width="500" height="280" viewBox="0 0 500 280" className="max-w-full drop-shadow-2xl">
                  <ellipse cx="250" cy="140" rx="200" ry="110" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                  <ellipse cx="250" cy="140" rx="160" ry="85" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />

                  {layers.heatmapAnimation && (
                    <g className="animate-pulse-slow">
                      <ellipse cx="250" cy="140" rx="220" ry="120" fill="none" stroke="#ef4444" strokeWidth="6" strokeOpacity="0.15" />
                      <ellipse cx="250" cy="140" rx="180" ry="95" fill="none" stroke="#ef4444" strokeWidth="4" strokeOpacity="0.1" />
                    </g>
                  )}

                  <path d="M 120,80 Q 250,30 380,80" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" strokeDasharray="4 8" />
                  <path d="M 120,200 Q 250,250 380,200" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" strokeDasharray="4 8" />

                  {layers.seat && (
                    <g>
                      <circle cx="200" cy="70" r="8" fill="#d97706" className="animate-pulse" />
                      <circle cx="200" cy="70" r="4" fill="#fff" />
                      <text x="200" y="55" textAnchor="middle" fill="#d97706" fontSize="10" fontWeight="bold" letterSpacing="1">SEAT</text>
                    </g>
                  )}

                  {layers.restrooms && (
                    <g>
                      <circle cx="150" cy="190" r="6" fill="#38bdf8" />
                      <text x="150" y="180" textAnchor="middle" fill="#7dd3fc" fontSize="8">Restroom</text>
                    </g>
                  )}

                  {layers.food && (
                    <g>
                      <circle cx="340" cy="190" r="6" fill="#10b981" />
                      <text x="340" y="180" textAnchor="middle" fill="#34d399" fontSize="8">Food</text>
                    </g>
                  )}

                  {layers.medical && (
                    <g>
                      <rect x="238" y="210" width="16" height="16" fill="#ef4444" rx="4" />
                      <text x="246" y="222" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">+</text>
                    </g>
                  )}

                  {layers.merchandise && (
                    <g>
                      <circle cx="280" cy="65" r="6" fill="#a855f7" />
                      <text x="280" y="55" textAnchor="middle" fill="#d8b4fe" fontSize="8">Merch</text>
                    </g>
                  )}

                  {layers.security && (
                    <g>
                      <rect x="360" y="100" width="12" height="12" fill="#f97316" rx="3" />
                      <text x="366" y="93" textAnchor="middle" fill="#ffedd5" fontSize="8">Security</text>
                    </g>
                  )}

                  {layers.emergencyExits && (
                    <g>
                      <line x1="80" y1="140" x2="50" y2="140" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
                      <text x="40" y="143" textAnchor="middle" fill="#fda4af" fontSize="10" fontWeight="bold">EXIT</text>
                    </g>
                  )}

                  {layers.navigationPath && navigation && (
                    <path d="M 90,140 Q 200,90 200,70" fill="none" stroke="#d97706" strokeWidth="4" strokeDasharray="6" className="animate-pulse" />
                  )}

                  {layers.crowdHeat && (
                    <g>
                      <circle cx="90" cy="140" r="20" fill="#f43f5e" fillOpacity="0.3" />
                      <circle cx="90" cy="140" r="4" fill="#f43f5e" />
                      <text x="90" y="115" textAnchor="middle" fill="#fda4af" fontSize="8" fontWeight="bold">Gate A (Busy)</text>
                    </g>
                  )}
                </svg>
              </div>

              {navigation && (
                <div className="mt-4 p-5 bg-white/5 border border-primary/20 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="space-y-1">
                    <span className="font-bold text-primary text-sm flex items-center gap-2"><MapPin className="w-4 h-4"/> Guided Route</span>
                    <p className="text-white/80 text-xs">{navigation.routeDescription}</p>
                  </div>
                  <div className="flex gap-4 text-xs font-bold">
                    <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">{navigation.distanceMeters}m</span>
                    <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">{navigation.estimatedMinutes} mins</span>
                    {navigation.accessibleElevatorUsed && (
                      <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30">♿ Accessible</span>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className="glass-panel rounded-3xl p-6">
              <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> Live Match Timeline</h2>
              <div className="relative pl-6 space-y-6">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary to-transparent"></div>
                {events.map((evt) => (
                  <div key={evt.id} className="relative animate-fade-in-up">
                    <div className="absolute -left-10 top-0.5 h-7 w-7 rounded-full bg-background border-2 border-primary flex items-center justify-center text-[10px] text-primary font-bold shadow-lg shadow-primary/20">
                      {evt.minute}&apos;
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 ml-2 hover:bg-white/10 transition-colors">
                      <span className="font-bold text-primary uppercase text-[10px] tracking-widest block mb-1">
                        {evt.eventType}
                      </span>
                      <p className="text-white/80 text-sm">{evt.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {decisionTimeline.length > 0 && (
              <section className="glass-panel rounded-3xl p-6 border-t border-cyan-500/30">
                <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2"><Layers className="w-5 h-5 text-cyan-400" /> AI Decision Timeline</h2>
                <div className="space-y-4">
                  {decisionTimeline.map((item, idx) => (
                    <div key={idx} className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex items-start gap-4">
                      <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs font-mono shrink-0">
                        {item.minute}&apos;
                      </span>
                      <div>
                        <span className="block font-bold text-white mb-1">{item.authority}</span>
                        <p className="text-white/60 text-sm leading-relaxed">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <section className="glass-card rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-black text-white">Live AI Commentary</h2>
              </div>
              <div className="overflow-y-auto max-h-[250px] space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {commentary.map((line, idx) => (
                  <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-sm leading-relaxed text-white/80 font-medium">
                    {line}
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-card rounded-3xl p-6 border-t border-purple-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-purple-400" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-purple-400">Language & Accessibility</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-2 block">Language Feed</label>
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value as typeof language)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-purple-500 transition-colors appearance-none"
                  >
                    {['English', 'Spanish', 'Portuguese', 'French', 'Hindi', 'Arabic'].map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-2 block">Accessibility Routing</label>
                  <select
                    value={accessibilityNeeds}
                    onChange={(e) => handleAccessibilityChange(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-purple-500 transition-colors appearance-none"
                  >
                    <option value="None">Standard Routing</option>
                    <option value="Wheelchair">Wheelchair Access (Elevators)</option>
                    <option value="LowMobility">Low Mobility (Fewer Stairs)</option>
                    <option value="Visual">Visual Impairment (High Contrast/Audio)</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="glass-card rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Mic className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-amber-500">Voice Assistant</h2>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voiceInput}
                  onChange={(e) => setVoiceInput(e.target.value)}
                  placeholder="Ask match companion..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleVoiceCommand}
                  className="px-6 py-3 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition-colors"
                >
                  Send
                </button>
              </div>
              {voiceResponse && (
                <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm font-medium text-amber-400 animate-fade-in">
                  {voiceResponse}
                </div>
              )}
            </section>

            <section className="glass-card rounded-3xl p-6 border-t border-rose-500/30">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-rose-500">Emergency & SOS</h2>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => triggerSOS('medical')}
                  className="flex-1 py-3 bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-colors"
                >
                  Medical Emergency
                </button>
                <button
                  onClick={() => triggerSOS('security')}
                  className="flex-1 py-3 bg-orange-500/20 text-orange-400 font-bold text-xs rounded-xl border border-orange-500/30 hover:bg-orange-500 hover:text-white transition-colors"
                >
                  Security Issue
                </button>
              </div>
              {emergency && (
                <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl animate-fade-in-up">
                  <div className="text-rose-500 font-black text-sm mb-1 uppercase tracking-wider">Dispatch Confirmed</div>
                  <div className="text-white/80 text-xs mb-2">Team en route to your location.</div>
                  <div className="text-white/60 text-[10px] font-mono">{emergency.urgentInstructions}</div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
