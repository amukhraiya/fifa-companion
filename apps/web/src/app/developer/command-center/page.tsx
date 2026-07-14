'use client';

import React, { useState, useEffect } from 'react';

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
  { name: 'SearchSeats', description: 'Searches match seating charts' },
  { name: 'ReserveSeat', description: 'Locks seat coordinates' },
  { name: 'WeatherCheck', description: 'Matchday weather preview' },
  { name: 'MapsSearch', description: 'Location POI search' },
  { name: 'RoutePlanning', description: 'Travel path route calculations' },
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
    // Poll every 3 seconds to update timeline dynamically
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Title */}
      <header className="flex justify-between items-center border-b border-slate-900 pb-6">
        <div>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Developer Mode Control Center</span>
          <h1 className="text-3xl font-extrabold text-white">AI Kernel Command Center</h1>
        </div>
        <div className="flex space-x-3">
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center space-x-1.5">
            <span className="h-2 w-2 bg-emerald-400 rounded-full animate-ping" />
            <span>AI Kernel: Active</span>
          </span>
        </div>
      </header>

      {/* Grid status */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Current User</span>
          <div className="font-bold text-sm text-slate-200">{activeContext.activeUser}</div>
          <div className="text-xs text-slate-500">Role: {activeContext.activeRole}</div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Current Active Agent</span>
          <div className="font-bold text-sm text-amber-500">{activeContext.currentAgent}</div>
          <div className="text-xs text-slate-500">Priority: 10</div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Current Active Tool</span>
          <div className="font-bold text-sm text-cyan-400">{activeContext.currentTool}</div>
          <div className="text-xs text-slate-500">Resolved via registry</div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Latest Emitted Event</span>
          <div className="font-bold text-xs text-emerald-400 truncate">{activeContext.currentEvent}</div>
          <div className="text-xs text-slate-500">Event Bus subscriber logger synced</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Columns: Timelines & Traces */}
        <div className="lg:col-span-2 space-y-8">
          {/* Live Event Bus timeline */}
          <section className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Event Bus Live Timeline</h2>
            <div className="overflow-y-auto max-h-[40vh] space-y-4 pr-2">
              {events.length > 0 ? (
                events.map((evt) => (
                  <div key={evt.id} className="p-4 bg-slate-950/80 border border-slate-900 rounded-2xl flex justify-between items-center text-xs">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold font-mono mr-2">
                        {evt.eventType}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(evt.createdAt).toLocaleTimeString()}
                      </span>
                      <pre className="text-[10px] text-slate-500 font-mono mt-1 overflow-x-auto max-w-lg">
                        {JSON.stringify(evt.payload, null, 2)}
                      </pre>
                    </div>
                    <span className="text-emerald-500 font-bold font-mono text-[10px]">✓ EventLogger Logged</span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Timeline idle. Interact with matches and seat bookings to trigger events.
                </div>
              )}
            </div>
          </section>

          {/* Registries lists */}
          <section className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-slate-200">Discovered Agents Registry</h3>
              <div className="space-y-3">
                {AGENT_LIST.map((agent) => (
                  <div key={agent.name} className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-200">{agent.name}</div>
                      <div className="text-[10px] text-slate-500">v{agent.version}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[9px]">
                      {agent.capabilities.join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-slate-200">Discovered Tools Registry</h3>
              <div className="space-y-3">
                {TOOL_LIST.map((tool) => (
                  <div key={tool.name} className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-1 text-xs">
                    <div className="font-bold text-slate-200 font-mono">⚙ {tool.name}</div>
                    <div className="text-[10px] text-slate-500">{tool.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: AI Kernel Specs */}
        <div className="space-y-8">
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-white">AI Kernel State</h2>
            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span>Kernel Runtime:</span>
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span>Event Bus:</span>
                <span className="text-slate-400">Publish / Subscribe Logger</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span>Execution Planner:</span>
                <span className="text-slate-400">Intents & Priorities</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span>RAG groundings:</span>
                <span className="text-slate-400">Knowledge Chunks</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
