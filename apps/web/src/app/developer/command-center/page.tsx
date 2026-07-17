'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Activity, Zap, Server, Cpu, Clock, Code2, Layers, Search, Compass, AlertTriangle, ShieldCheck, Database, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EventLog {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

const AGENT_LIST = [
  { name: 'BookingAgent', version: '1.0.0', capabilities: ['booking'] },
  { name: 'TravelAgent', version: '1.0.0', capabilities: ['travel'] },
  { name: 'MatchCompanionAgent', version: '1.0.0', capabilities: ['companion'] },
];

const TOOL_LIST = [
  { name: 'SearchSeats', description: 'Searches match seating charts', icon: Search },
  { name: 'ReserveSeat', description: 'Locks seat coordinates', icon: ShieldCheck },
  { name: 'WeatherCheck', description: 'Matchday weather preview', icon: Compass },
  { name: 'MapsSearch', description: 'Location POI search', icon: Compass },
  { name: 'RoutePlanning', description: 'Travel path route calculations', icon: Compass },
  { name: 'HotelSearch', description: 'Finds local accommodations', icon: Search },
  { name: 'MedicalCheck', description: 'Checks emergency response bays', icon: AlertTriangle },
  { name: 'CrowdPredictionCheck', description: 'Gate queuing wait predictions', icon: Activity },
  { name: 'RestaurantSearch', description: 'Queries nearby dietary grills', icon: Search },
  { name: 'StadiumGuideCheck', description: 'Facilities gate entry logs', icon: Layers },
];

export default function CommandCenterPage() {
  const [events, setEvents] = useState<EventLog[]>([]);
  const [activeContext, setActiveContext] = useState({
    activeUser: 'fan@fifa.com',
    activeRole: 'Fan',
    currentAgent: 'BookingAgent',
    currentTool: 'SearchSeats',
    currentEvent: 'SeatRecommendationGenerated',
    promptVersion: 'v1',
    latency: '82 ms',
  });

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  };

  const fetchEvents = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/chat/debug/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEvents(data.data);
        if (data.data.length > 0) {
          const topEvent = data.data[0];
          setActiveContext((prev) => ({
            ...prev,
            currentEvent: topEvent.eventType,
          }));
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch Event Bus logs:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-background relative overflow-hidden text-white font-sans selection:bg-primary/30 selection:text-primary-foreground">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] bg-emerald-500/5 rounded-full blur-[150px] mix-blend-screen opacity-30"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03]"></div>
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 py-8 space-y-8 h-screen flex flex-col">
        {/* Title */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-6 shrink-0">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-4 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <Terminal className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Developer Mode</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              AI Kernel Command Center
            </h1>
          </div>
          <div className="flex items-center bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full gap-3 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Kernel Online</span>
          </div>
        </header>

        {/* Grid status */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <span className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">
              <UserIcon className="w-3.5 h-3.5" /> Current User
            </span>
            <div className="font-black text-lg text-white mb-1 truncate">{activeContext.activeUser}</div>
            <div className="text-xs text-white/50">Role: <span className="text-white/80">{activeContext.activeRole}</span></div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-primary/20 relative overflow-hidden group shadow-[0_5px_15px_rgba(217,119,6,0.05)]">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <span className="flex items-center gap-2 text-[10px] text-primary/70 uppercase tracking-widest font-bold mb-2">
              <Cpu className="w-3.5 h-3.5" /> Active Agent
            </span>
            <div className="font-black text-lg text-primary mb-1 truncate">{activeContext.currentAgent}</div>
            <div className="text-xs text-white/50">Priority: <span className="text-white/80">10 (High)</span></div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 relative overflow-hidden group shadow-[0_5px_15px_rgba(6,182,212,0.05)]">
            <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <span className="flex items-center gap-2 text-[10px] text-cyan-400/70 uppercase tracking-widest font-bold mb-2">
              <Code2 className="w-3.5 h-3.5" /> Active Tool
            </span>
            <div className="font-black text-lg text-cyan-400 mb-1 truncate">{activeContext.currentTool}</div>
            <div className="text-xs text-white/50">Source: <span className="text-white/80">Registry Resolved</span></div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 relative overflow-hidden group shadow-[0_5px_15px_rgba(16,185,129,0.05)]">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <span className="flex items-center gap-2 text-[10px] text-emerald-400/70 uppercase tracking-widest font-bold mb-2">
              <Activity className="w-3.5 h-3.5" /> Emitted Event
            </span>
            <div className="font-black text-[13px] leading-tight text-emerald-400 mb-2 truncate" title={activeContext.currentEvent}>
              {activeContext.currentEvent}
            </div>
            <div className="text-xs text-white/50">Status: <span className="text-white/80">Logged</span></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Left Columns: Timelines & Traces */}
          <div className="lg:col-span-2 flex flex-col gap-6 h-full">
            {/* Live Event Bus timeline */}
            <section className="glass-card rounded-3xl border border-white/10 flex flex-col flex-1 min-h-[300px] overflow-hidden">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" /> Event Bus Live Timeline
                </h2>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Clock className="w-4 h-4" /> Polling: 3s
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                {events.length > 0 ? (
                  events.map((evt) => (
                    <div key={evt.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-start gap-4 transition-all hover:bg-white/5 animate-fade-in-up">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 rounded bg-primary/20 text-primary font-bold font-mono text-[10px] uppercase tracking-wider shrink-0">
                            {evt.eventType}
                          </span>
                          <span className="text-white/40 text-[10px] font-mono">
                            {new Date(evt.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="bg-black/60 rounded-xl p-3 border border-white/5 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
                          <pre className="text-[10px] text-emerald-400/80 font-mono">
                            {JSON.stringify(evt.payload, null, 2)}
                          </pre>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 shrink-0 h-fit">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="font-bold text-[10px] uppercase tracking-wider">Logged</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-white/30 space-y-3">
                    <Database className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-sm font-medium">Timeline idle</p>
                    <p className="text-xs">Interact with matches and seat bookings to trigger events.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Registries lists */}
            <section className="grid sm:grid-cols-2 gap-6 shrink-0">
              <div className="glass-card rounded-3xl border border-white/10 overflow-hidden flex flex-col h-[280px]">
                <div className="p-5 border-b border-white/5 bg-black/20 shrink-0">
                  <h3 className="font-black text-white text-sm flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary" /> Discovered Agents
                  </h3>
                </div>
                <div className="p-5 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 flex-1">
                  {AGENT_LIST.map((agent) => (
                    <div key={agent.name} className="p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white text-xs">{agent.name}</div>
                        <div className="text-[10px] text-white/40 mt-0.5 font-mono">v{agent.version}</div>
                      </div>
                      <span className="px-2 py-1 rounded bg-white/5 text-primary font-mono text-[9px] uppercase tracking-wider border border-white/10">
                        {agent.capabilities.join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-3xl border border-white/10 overflow-hidden flex flex-col h-[280px]">
                <div className="p-5 border-b border-white/5 bg-black/20 shrink-0">
                  <h3 className="font-black text-white text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" /> Discovered Tools
                  </h3>
                </div>
                <div className="p-5 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 flex-1">
                  {TOOL_LIST.map((tool) => (
                    <div key={tool.name} className="p-3 bg-black/40 rounded-xl border border-white/5 flex gap-3 items-center group hover:bg-white/5 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-cyan-400 group-hover:scale-110 transition-transform">
                        <tool.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs font-mono">{tool.name}()</div>
                        <div className="text-[10px] text-white/50 mt-0.5">{tool.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: AI Kernel Specs */}
          <div className="space-y-6 h-full flex flex-col">
            <section className="glass-card rounded-3xl border border-primary/20 flex-1 min-h-0 flex flex-col">
              <div className="p-6 border-b border-white/5 bg-primary/5 shrink-0">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-primary" /> AI Kernel State
                </h2>
              </div>
              <div className="p-6 space-y-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                <StateRow label="Kernel Runtime" value="ONLINE" valueColor="text-emerald-400" />
                <StateRow label="Event Bus" value="Publish / Subscribe Logger" />
                <StateRow label="Execution Planner" value="Intents & Priorities" />
                <StateRow label="RAG Groundings" value="Knowledge Chunks" />
                <StateRow label="Vector DB Context" value="Initialized" />
                <StateRow label="Memory Manager" value="Active (Session)" />
              </div>
            </section>

            <section className="glass-card rounded-3xl border border-amber-500/20 flex-1 min-h-0 flex flex-col">
              <div className="p-6 border-b border-white/5 bg-amber-500/5 shrink-0">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" /> Live Match State
                </h2>
              </div>
              <div className="p-6 space-y-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                <StateRow label="Match Predictor Win %" value="BRA 95% - DRAW 3% - ESP 2%" valueColor="text-amber-500" />
                <StateRow label="Fan Sentiment" value="Ecstatic (118 dB)" valueColor="text-emerald-400" />
                <StateRow label="Last Live Commentary" value='"Vinicius Jr counters Spain to lead 2-1"' italic />
                <StateRow label="Timeline Decisions Logged" value="4 items" valueColor="text-cyan-400" font="font-mono" />
                <StateRow label="Telemetry Sync" value="OK (42ms ping)" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function StateRow({ label, value, valueColor = "text-white/80", italic = false, font = "font-sans" }: { label: string, value: string, valueColor?: string, italic?: boolean, font?: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{label}</span>
      <span className={`text-sm ${valueColor} ${italic ? 'italic' : ''} ${font} font-medium`}>{value}</span>
    </div>
  );
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
