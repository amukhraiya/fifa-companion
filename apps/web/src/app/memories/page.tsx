'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Activity, CloudSun, Target, Award, PlayCircle, Map, Camera } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchMemory {
  memoryId: string;
  matchName: string;
  venue: string;
  country: string;
  city: string;
  score: string;
  attendanceDate: string;
  weather: string;
  weatherIcon: string;
  temperature: string;
  fanPulseDb: number;
  aiSummary: string;
  travelSummary: string;
  bestPlayer: string;
  turningPoint: string;
  favoriteMetent: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MEMORIES: MatchMemory[] = [
  {
    memoryId: 'MEM-001',
    matchName: 'Brazil vs Spain',
    venue: 'Lusail Iconic Stadium',
    country: 'Qatar',
    city: 'Lusail',
    score: '2 - 1',
    attendanceDate: '2026-07-14T18:00:00Z',
    weather: 'Warm evening breeze',
    weatherIcon: '🌙',
    temperature: '22°C',
    fanPulseDb: 96,
    aiSummary: "A thrilling encounter at Lusail Iconic Stadium where Brazil claimed a hard-fought 2-1 victory. The crowd energy peaked at 96 decibels during Vinicius Jr's decisive strike in the 74th minute. AI analysis indicates Brazil's transition play was the decisive tactical factor, exploiting the space behind Spain's high defensive line with surgical precision.",
    travelSummary: 'Arrived via Metro Gold Line from Hamad Airport. Journey: 34 minutes. Shuttle bus available post-match to avoid taxi queues.',
    bestPlayer: 'Vinicius Jr',
    turningPoint: "Vinicius Jr's clinical finish in the 74th minute shifted the match irreversibly in Brazil's favor, silencing Spain's late comeback attempt.",
    favoriteMetent: 'The roar of 88,966 fans when the final whistle confirmed Brazil had won — an ocean of yellow and green under the floodlights.',
    homeTeam: 'Brazil',
    awayTeam: 'Spain',
    homeScore: 2,
    awayScore: 1,
  },
  {
    memoryId: 'MEM-002',
    matchName: 'Argentina vs France — Final',
    venue: 'MetLife Stadium',
    country: 'USA',
    city: 'New Jersey',
    score: '3 - 3',
    attendanceDate: '2026-07-19T15:00:00Z',
    weather: 'Partly cloudy',
    weatherIcon: '⛅',
    temperature: '24°C',
    fanPulseDb: 99,
    aiSummary: "The greatest World Cup Final in history. MetLife Stadium witnessed an unprecedented 3-3 draw through extra time, with Messi and Mbappé both delivering hat-trick performances. The atmosphere reached 99 decibels — the loudest ever recorded at a FIFA event. A game that transcended sport and became legend.",
    travelSummary: 'NJ Transit from Penn Station, 30 minutes. Stadium reached capacity 3 hours before kickoff. AI predicted the shuttle surge and rerouted via ferry from Weehawken.',
    bestPlayer: 'Lionel Messi',
    turningPoint: "Messi's audacious chip in the 118th minute, only for Mbappé to equalise 60 seconds later — setting up the penalty shootout of the century.",
    favoriteMetent: 'Standing in the stadium holding my breath through 5 penalty kicks. The silence, then the eruption. Pure magic.',
    homeTeam: 'Argentina',
    awayTeam: 'France',
    homeScore: 3,
    awayScore: 3,
  },
];

const COUNTRY_FLAGS: Record<string, string> = {
  Qatar: '🇶🇦', USA: '🇺🇸', Canada: '🇨🇦', Mexico: '🇲🇽',
};

const TEAM_FLAGS: Record<string, string> = {
  Brazil: '🇧🇷', Spain: '🇪🇸', Argentina: '🇦🇷', France: '🇫🇷',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Photo Placeholder Grid ───────────────────────────────────────────────────

function PhotoGrid() {
  const photos = [
    { icon: '🏟️', label: 'Stadium Exterior' },
    { icon: '⚽', label: 'Match Action' },
    { icon: '🎉', label: 'Celebration' },
    { icon: '🎫', label: 'My Ticket' },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {photos.map(({ icon, label }) => (
        <div key={label} className="aspect-4/3 rounded-xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 hover:border-primary/50 transition-all group">
          <span className="text-3xl group-hover:scale-110 transition-transform">{icon}</span>
          <span className="text-white/40 text-xs">{label}</span>
          <span className="text-primary text-[10px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <Camera className="w-3 h-3" /> Add Photo
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Memory Card ──────────────────────────────────────────────────────────────

function MemoryCard({ memory, index }: { memory: MatchMemory; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<'summary' | 'timeline' | 'photos'>('summary');

  const accentClass = memory.homeTeam === 'Brazil' ? 'from-emerald-500/20' : 'from-sky-500/20';
  const borderClass = memory.homeTeam === 'Brazil' ? 'border-emerald-500/30' : 'border-sky-500/30';

  const timelineItems = [
    { icon: '🚀', time: 'T-3h', text: 'Departed for stadium via AI travel plan' },
    { icon: '🎫', time: 'T-1h', text: `QR validated at ${memory.venue}` },
    { icon: '⚽', time: '0\'', text: 'Match kicked off' },
    { icon: '🔥', time: '45+2\'', text: 'Half-time: electrifying atmosphere, 89dB' },
    { icon: '🏆', time: '90+4\'', text: `Final whistle: ${memory.homeTeam} ${memory.score} ${memory.awayTeam}` },
    { icon: '📸', time: 'FT', text: 'Memory card generated by AI' },
  ];

  return (
    <div
      className={`relative glass-card rounded-[2rem] overflow-hidden mb-8 transition-all duration-500 ease-out animate-fade-in-up 
        ${expanded ? `scale-[1.02] shadow-2xl ${borderClass}` : 'scale-100'}`}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className={`cursor-pointer relative overflow-hidden bg-gradient-to-br ${accentClass} to-transparent p-8`}
      >
        {/* Decorative elements */}
        <div className="absolute -top-2 left-10 w-16 h-5 bg-amber-500/30 -rotate-3 rounded-sm backdrop-blur-sm"></div>
        <div className="absolute -top-2 right-12 w-12 h-5 bg-white/20 rotate-2 rounded-sm backdrop-blur-sm"></div>

        <div className="flex items-center gap-2 mb-4 mt-2">
          <span className="text-xl">{COUNTRY_FLAGS[memory.country] ?? '🌍'}</span>
          <span className="text-white/60 text-sm tracking-wide font-medium">{memory.city}, {memory.country}</span>
          <div className="ml-auto flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-3 py-1">
            <span className="text-sm">{memory.weatherIcon}</span>
            <span className="text-white/70 text-xs font-bold">{memory.temperature}</span>
          </div>
        </div>

        <h2 className="text-2xl font-black text-white mb-4">{memory.matchName}</h2>

        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl drop-shadow-md">{TEAM_FLAGS[memory.homeTeam] ?? '🏳️'}</span>
            <span className="text-white font-bold">{memory.homeTeam}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 shadow-inner">
            <span className="text-amber-400 font-black text-2xl tracking-[0.2em]">{memory.score}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white font-bold">{memory.awayTeam}</span>
            <span className="text-3xl drop-shadow-md">{TEAM_FLAGS[memory.awayTeam] ?? '🏳️'}</span>
          </div>
        </div>

        <div className="flex gap-4 flex-wrap text-white/60 text-sm font-medium">
          <span className="flex items-center gap-2"><Calendar className="w-4 h-4"/> {formatDate(memory.attendanceDate)}</span>
          <span className="flex items-center gap-2 text-emerald-400"><Activity className="w-4 h-4"/> {memory.fanPulseDb}dB pulse</span>
          <span className="flex items-center gap-2"><MapPin className="w-4 h-4"/> {memory.venue}</span>
        </div>

        <div className={`absolute bottom-6 right-8 text-white/30 transition-transform duration-300 ${expanded ? 'rotate-180' : 'rotate-0'}`}>
          ▼
        </div>
      </div>

      {expanded && (
        <div className="bg-black/60 backdrop-blur-md border-t border-white/10 animate-fade-in">
          <div className="flex border-b border-white/10">
            {(['summary', 'timeline', 'photos'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${
                  activeSection === s 
                    ? 'text-primary border-b-2 border-primary bg-primary/5' 
                    : 'text-white/40 hover:text-white hover:bg-white/5 border-b-2 border-transparent'
                }`}
              >
                {s === 'summary' && '🤖 AI Summary'}
                {s === 'timeline' && '⏱️ Timeline'}
                {s === 'photos' && '📸 Photos'}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeSection === 'summary' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                  <div className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <BotIcon /> AI Match Summary
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{memory.aiSummary}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Best Player', value: memory.bestPlayer, icon: Award, color: 'text-amber-400' },
                    { label: 'Fan Pulse', value: `${memory.fanPulseDb}dB`, icon: Activity, color: 'text-emerald-400' },
                    { label: 'Weather', value: `${memory.weatherIcon} ${memory.temperature}`, icon: CloudSun, color: 'text-sky-400' },
                    { label: 'Venue', value: memory.venue, icon: MapPin, color: 'text-purple-400' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-center">
                      <div className="text-white/40 text-[10px] uppercase tracking-widest mb-2">{label}</div>
                      <div className={`text-sm font-bold flex items-center gap-2 ${color}`}>
                        <Icon className="w-4 h-4" />
                        <span className="truncate">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-5">
                    <div className="text-sky-400 text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" /> Turning Point
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed">{memory.turningPoint}</p>
                  </div>
                  <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-5">
                    <div className="text-purple-400 text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                      <PlayCircle className="w-4 h-4" /> Favorite Moment
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed italic">&ldquo;{memory.favoriteMetent}&rdquo;</p>
                  </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
                  <div className="text-emerald-500 text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                    <Map className="w-4 h-4" /> Travel Summary
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">{memory.travelSummary}</p>
                </div>
              </div>
            )}

            {activeSection === 'timeline' && (
              <div className="animate-fade-in-up pl-6 relative">
                <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent"></div>
                {timelineItems.map(({ icon, time, text }, i) => (
                  <div key={i} className="relative pb-8 last:pb-0">
                    <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-sm shadow-[0_0_10px_rgba(217,119,6,0.5)]">
                      {icon}
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 ml-4">
                      <div className="text-primary text-[10px] font-bold tracking-widest mb-1">{time}</div>
                      <div className="text-white/80 text-sm">{text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'photos' && (
              <div className="animate-fade-in-up">
                <p className="text-white/50 text-sm mb-6">Add your photos from this match to complete your scrapbook memory.</p>
                <PhotoGrid />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BotIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MemoriesPage() {
  return (
    <main className="min-h-screen bg-background relative pb-24 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-8 relative z-10">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-amber-300 bg-clip-text text-transparent mb-3 drop-shadow-sm">
            Fan Scrapbook
          </h1>
          <p className="text-white/60 text-base">
            Your personal FIFA World Cup 2026 memory collection, curated by AI.
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap gap-4 mb-12">
          {[
            { icon: '📖', label: `${MEMORIES.length} Memories`, color: 'text-purple-400' },
            { icon: '⚽', label: '5 Goals witnessed', color: 'text-amber-400' },
            { icon: '🌍', label: '2 Countries', color: 'text-emerald-400' },
            { icon: '🔊', label: '97.5dB avg pulse', color: 'text-sky-400' },
          ].map(({ icon, label, color }) => (
            <div key={label} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2.5 backdrop-blur-sm">
              <span className="text-lg">{icon}</span>
              <span className={`text-sm font-bold ${color}`}>{label}</span>
            </div>
          ))}
        </div>

        {/* Memory cards */}
        <div className="space-y-8">
          {MEMORIES.map((memory, i) => (
            <MemoryCard key={memory.memoryId} memory={memory} index={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
