'use client';

import React, { useState } from 'react';

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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {photos.map(({ icon, label }) => (
        <div key={label} style={{
          aspectRatio: '4/3', borderRadius: 12, background: 'rgba(255,255,255,0.04)',
          border: '1px dashed rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}>
          <span style={{ fontSize: 28 }}>{icon}</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{label}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>+ Add photo</span>
        </div>
      ))}
    </div>
  );
}

// ─── Memory Card ──────────────────────────────────────────────────────────────

function MemoryCard({ memory, index }: { memory: MatchMemory; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<'summary' | 'timeline' | 'photos'>('summary');

  const accentColor = memory.homeTeam === 'Brazil' ? '#009C3B' : '#74acdf';
  const isHighScore = memory.homeScore + memory.awayScore >= 5;

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
      id={`memory-${memory.memoryId}`}
      style={{
        borderRadius: 24, overflow: 'hidden', marginBottom: 28,
        boxShadow: expanded ? `0 24px 80px ${accentColor}30` : '0 8px 40px rgba(0,0,0,0.5)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: `scrapFadeIn 0.5s ease ${index * 0.15}s both`,
        border: `1px solid ${expanded ? accentColor + '40' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      {/* Card header — the scrapbook cover */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          cursor: 'pointer', position: 'relative', overflow: 'hidden',
          background: `linear-gradient(135deg, ${accentColor}22 0%, #0a0a1a 60%, ${isHighScore ? '#f9b80022' : '#1a1a2e22'} 100%)`,
          padding: '28px 28px 24px',
        }}
      >
        {/* Decorative tape effect */}
        <div style={{ position: 'absolute', top: -8, left: 40, width: 60, height: 18, background: 'rgba(249,184,0,0.25)', borderRadius: 2, transform: 'rotate(-2deg)' }} />
        <div style={{ position: 'absolute', top: -8, right: 60, width: 50, height: 18, background: 'rgba(255,255,255,0.1)', borderRadius: 2, transform: 'rotate(1.5deg)' }} />

        {/* Country & flags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 12 }}>
          <span style={{ fontSize: 20 }}>{COUNTRY_FLAGS[memory.country] ?? '🌍'}</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: 1 }}>{memory.city}, {memory.country}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '4px 10px' }}>
            <span style={{ fontSize: 14 }}>{memory.weatherIcon}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{memory.temperature}</span>
          </div>
        </div>

        {/* Match heading */}
        <h2 style={{ fontSize: 20, fontWeight: 900, color: 'white', marginBottom: 12 }}>{memory.matchName}</h2>

        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>{TEAM_FLAGS[memory.homeTeam] ?? '🏳️'}</span>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{memory.homeTeam}</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '6px 16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ color: '#f9b800', fontWeight: 900, fontSize: 20, letterSpacing: 2 }}>{memory.score}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{memory.awayTeam}</span>
            <span style={{ fontSize: 24 }}>{TEAM_FLAGS[memory.awayTeam] ?? '🏳️'}</span>
          </div>
        </div>

        {/* Metadata row */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>📅 {formatDate(memory.attendanceDate)}</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>🔊 {memory.fanPulseDb}dB fan pulse</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>🏟️ {memory.venue}</span>
        </div>

        {/* Expand indicator */}
        <div style={{ position: 'absolute', bottom: 16, right: 20, color: 'rgba(255,255,255,0.3)', fontSize: 18, transition: 'transform 0.3s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ⌄
        </div>
      </div>

      {/* Expanded scrapbook content */}
      {expanded && (
        <div style={{ background: '#080814', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Section tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {(['summary', 'timeline', 'photos'] as const).map((s) => (
              <button
                key={s}
                id={`mem-tab-${memory.memoryId}-${s}`}
                onClick={() => setActiveSection(s)}
                style={{
                  flex: 1, padding: '14px 0', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textTransform: 'capitalize', transition: 'all 0.2s',
                  background: 'transparent',
                  color: activeSection === s ? '#f9b800' : 'rgba(255,255,255,0.35)',
                  borderBottom: activeSection === s ? '2px solid #f9b800' : '2px solid transparent',
                }}
              >
                {s === 'summary' ? '🤖 AI Summary' : s === 'timeline' ? '⏱️ Timeline' : '📸 Photos'}
              </button>
            ))}
          </div>

          <div style={{ padding: '24px 28px 28px' }}>
            {activeSection === 'summary' && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                {/* AI Summary */}
                <div style={{ background: 'rgba(249,184,0,0.05)', border: '1px solid rgba(249,184,0,0.15)', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
                  <div style={{ color: '#f9b800', fontSize: 11, letterSpacing: 1.5, fontWeight: 700, marginBottom: 10 }}>🤖 AI MATCH SUMMARY</div>
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.7 }}>{memory.aiSummary}</p>
                </div>

                {/* Key info grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Best Player', value: `⭐ ${memory.bestPlayer}`, color: '#f9b800' },
                    { label: 'Fan Pulse', value: `🔊 ${memory.fanPulseDb}dB`, color: '#00d084' },
                    { label: 'Weather', value: `${memory.weatherIcon} ${memory.temperature}`, color: '#64b5f6' },
                    { label: 'Venue', value: `🏟️ ${memory.venue}`, color: '#ce93d8' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>{label.toUpperCase()}</div>
                      <div style={{ color, fontSize: 13, fontWeight: 600 }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Turning point */}
                <div style={{ background: 'rgba(100,181,246,0.05)', border: '1px solid rgba(100,181,246,0.15)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ color: '#64b5f6', fontSize: 10, letterSpacing: 1.5, fontWeight: 700, marginBottom: 8 }}>⚡ TURNING POINT</div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6 }}>{memory.turningPoint}</p>
                </div>

                {/* Favorite moment */}
                <div style={{ background: 'rgba(206,147,216,0.05)', border: '1px solid rgba(206,147,216,0.15)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ color: '#ce93d8', fontSize: 10, letterSpacing: 1.5, fontWeight: 700, marginBottom: 8 }}>💜 FAVORITE MOMENT</div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6 }}>&ldquo;{memory.favoriteMetent}&rdquo;</p>
                </div>

                {/* Travel */}
                <div style={{ background: 'rgba(0,208,132,0.05)', border: '1px solid rgba(0,208,132,0.15)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ color: '#00d084', fontSize: 10, letterSpacing: 1.5, fontWeight: 700, marginBottom: 8 }}>🚇 TRAVEL SUMMARY</div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6 }}>{memory.travelSummary}</p>
                </div>
              </div>
            )}

            {activeSection === 'timeline' && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <div style={{ position: 'relative', paddingLeft: 32 }}>
                  <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #f9b800, rgba(249,184,0,0.1))' }} />
                  {timelineItems.map(({ icon, time, text }, i) => (
                    <div key={i} style={{ position: 'relative', paddingBottom: 20 }}>
                      <div style={{ position: 'absolute', left: -26, top: 0, width: 22, height: 22, borderRadius: '50%', background: '#0a0a1a', border: '2px solid #f9b800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                        {icon}
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ color: '#f9b800', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{time}</div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'photos' && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 16 }}>Add your photos from this match to complete your scrapbook memory.</p>
                <PhotoGrid />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MemoriesPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050510; font-family: 'Inter', sans-serif; }
        @keyframes scrapFadeIn { from { opacity:0; transform:translateY(24px) rotate(-0.5deg); } to { opacity:1; transform:translateY(0) rotate(0deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 30% 10%, #0d1b3a18, transparent), #050510', color: 'white' }}>
        {/* Header */}
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 0' }}>
          <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
            ← Dashboard
          </a>

          <div style={{ marginBottom: 12 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, background: 'linear-gradient(135deg, #ce93d8, #f9b800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Fan Scrapbook
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 6 }}>
              Your personal FIFA World Cup 2026 memory collection
            </p>
          </div>

          {/* Stats bar */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
            {[
              { icon: '📖', label: `${MEMORIES.length} Memories`, color: '#ce93d8' },
              { icon: '⚽', label: '5 Goals witnessed', color: '#f9b800' },
              { icon: '🌍', label: '2 Countries', color: '#00d084' },
              { icon: '🔊', label: '97.5dB avg pulse', color: '#64b5f6' },
            ].map(({ icon, label, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '8px 14px' }}>
                <span>{icon}</span>
                <span style={{ color, fontSize: 12, fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Memory cards */}
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 60px' }}>
          {MEMORIES.map((memory, i) => (
            <MemoryCard key={memory.memoryId} memory={memory} index={i} />
          ))}
        </div>
      </div>
    </>
  );
}
