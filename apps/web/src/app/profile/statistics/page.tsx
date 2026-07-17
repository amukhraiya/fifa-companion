'use client';

import React, { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  progressPercent: number;
  requirement: string;
  unlockedAt?: string;
}

interface FanStats {
  matchesAttended: number;
  countriesVisited: number;
  citiesVisited: number;
  travelDistanceKm: number;
  moneySpent: number;
  moneySaved: number;
  co2SavedKg: number;
  favoriteTeam: string;
  favoriteStadium: string;
  predictionAccuracy: number;
  totalPredictions: number;
  correctPredictions: number;
  achievementsUnlocked: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_STATS: FanStats = {
  matchesAttended: 4,
  countriesVisited: 2,
  citiesVisited: 3,
  travelDistanceKm: 7840,
  moneySpent: 4200,
  moneySaved: 420,
  co2SavedKg: 112,
  favoriteTeam: 'Brazil',
  favoriteStadium: 'Lusail Iconic Stadium',
  predictionAccuracy: 73,
  totalPredictions: 22,
  correctPredictions: 16,
  achievementsUnlocked: 4,
};

const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-match', name: 'First Match', description: 'Attended your very first World Cup match.', icon: '🏟️', category: 'attendance', unlocked: true, progressPercent: 100, requirement: 'Attend 1 match', unlockedAt: '2026-07-14T20:00:00Z' },
  { id: 'explorer', name: 'Explorer', description: 'Visited matches in 3 or more different cities.', icon: '🗺️', category: 'travel', unlocked: true, progressPercent: 100, requirement: 'Visit 3 cities', unlockedAt: '2026-07-16T14:00:00Z' },
  { id: 'super-fan', name: 'Super Fan', description: 'Attended 5 or more matches in a single tournament.', icon: '⭐', category: 'attendance', unlocked: false, progressPercent: 80, requirement: 'Attend 5 matches' },
  { id: 'world-traveler', name: 'World Traveler', description: 'Traveled to matches in 3 or more countries.', icon: '✈️', category: 'travel', unlocked: false, progressPercent: 67, requirement: 'Visit 3 countries' },
  { id: 'collector', name: 'Collector', description: 'Accumulated 3 or more tickets in your digital wallet.', icon: '🎫', category: 'collection', unlocked: true, progressPercent: 100, requirement: 'Own 3 tickets', unlockedAt: '2026-07-15T10:00:00Z' },
  { id: 'prediction-master', name: 'Prediction Master', description: 'Achieved 75%+ match prediction accuracy.', icon: '🔮', category: 'prediction', unlocked: false, progressPercent: 97, requirement: '75% prediction accuracy' },
  { id: 'support-team-loyalist', name: 'Support Team Loyalist', description: 'Attended 3+ matches for your favorite team.', icon: '🏆', category: 'loyalty', unlocked: true, progressPercent: 100, requirement: 'Attend 3 matches for fav team', unlockedAt: '2026-07-16T18:00:00Z' },
];

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ target, suffix = '', prefix = '', decimals = 0 }: { target: number; suffix?: string; prefix?: string; decimals?: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(start);
    }, step);
    return () => clearInterval(timer);
  }, [target]);

  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();
  return <span>{prefix}{display}{suffix}</span>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, suffix, color, prefix }: { icon: string; label: string; value: number; suffix?: string; color: string; prefix?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}22`,
      borderRadius: 16, padding: '20px 18px', position: 'relative', overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div style={{ color, fontSize: 26, fontWeight: 900, lineHeight: 1 }}>
        <AnimatedCounter target={value} suffix={suffix} prefix={prefix} />
      </div>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 6 }}>{label}</div>
    </div>
  );
}

// ─── Circular Progress ────────────────────────────────────────────────────────

function CircularProgress({ percent, color, size = 64 }: { percent: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
    </svg>
  );
}

// ─── Achievement Badge ────────────────────────────────────────────────────────

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const [hovered, setHovered] = useState(false);
  const glowColor = achievement.unlocked ? '#f9b800' : 'rgba(255,255,255,0.2)';

  return (
    <div
      id={`achievement-${achievement.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', borderRadius: 18, padding: '20px 16px', textAlign: 'center',
        background: achievement.unlocked
          ? 'linear-gradient(135deg, rgba(249,184,0,0.12), rgba(249,184,0,0.04))'
          : 'rgba(255,255,255,0.02)',
        border: `1px solid ${achievement.unlocked ? 'rgba(249,184,0,0.3)' : 'rgba(255,255,255,0.07)'}`,
        transition: 'all 0.3s',
        transform: hovered ? 'scale(1.04)' : 'scale(1)',
        boxShadow: hovered && achievement.unlocked ? `0 8px 32px ${glowColor}33` : 'none',
        filter: achievement.unlocked ? 'none' : 'grayscale(60%)',
        cursor: 'default',
      }}
    >
      {/* Unlock glow */}
      {achievement.unlocked && (
        <div style={{ position: 'absolute', inset: -1, borderRadius: 18, background: `linear-gradient(135deg, ${glowColor}22, transparent)`, pointerEvents: 'none' }} />
      )}

      <div style={{ fontSize: 36, marginBottom: 10, filter: achievement.unlocked ? 'none' : 'grayscale(100%) opacity(0.4)' }}>
        {achievement.icon}
      </div>

      <div style={{ color: achievement.unlocked ? 'white' : 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
        {achievement.name}
      </div>

      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 12, lineHeight: 1.4 }}>
        {achievement.description}
      </div>

      {/* Progress bar */}
      {!achievement.unlocked && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${achievement.progressPercent}%`, background: 'linear-gradient(90deg, #f9b800, #ff6b35)', borderRadius: 2, transition: 'width 1.2s ease' }} />
          </div>
          <div style={{ color: '#f9b800', fontSize: 10, marginTop: 4 }}>{achievement.progressPercent}%</div>
        </div>
      )}

      {achievement.unlocked ? (
        <div style={{ background: 'rgba(249,184,0,0.15)', borderRadius: 20, padding: '4px 10px', display: 'inline-block' }}>
          <span style={{ color: '#f9b800', fontSize: 10, fontWeight: 700 }}>✓ UNLOCKED</span>
        </div>
      ) : (
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{achievement.requirement}</div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements'>('stats');

  const statItems = [
    { icon: '🏟️', label: 'Matches Attended', value: MOCK_STATS.matchesAttended, color: '#f9b800' },
    { icon: '🌍', label: 'Countries Visited', value: MOCK_STATS.countriesVisited, color: '#00d084' },
    { icon: '🏙️', label: 'Cities Explored', value: MOCK_STATS.citiesVisited, color: '#64b5f6' },
    { icon: '✈️', label: 'Travel Distance', value: MOCK_STATS.travelDistanceKm, suffix: ' km', color: '#ce93d8' },
    { icon: '💰', label: 'Money Invested', value: MOCK_STATS.moneySpent, prefix: '$', color: '#ff8a65' },
    { icon: '💚', label: 'Money Saved', value: MOCK_STATS.moneySaved, prefix: '$', color: '#00d084' },
    { icon: '🌱', label: 'CO₂ Saved', value: MOCK_STATS.co2SavedKg, suffix: ' kg', color: '#66bb6a' },
    { icon: '🏆', label: 'Achievements', value: MOCK_STATS.achievementsUnlocked, color: '#f9b800' },
  ];

  const unlockedCount = MOCK_ACHIEVEMENTS.filter((a) => a.unlocked).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050510; font-family: 'Inter', sans-serif; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 20px rgba(249,184,0,0.2); } 50% { box-shadow: 0 0 40px rgba(249,184,0,0.5); } }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 60% 10%, #0d1b3a18, transparent), #050510', color: 'white' }}>
        {/* Header */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 0' }}>
          <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
            ← Dashboard
          </a>

          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, background: 'linear-gradient(135deg, #f9b800, #00d084)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Fan Statistics
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 6 }}>Your FIFA World Cup 2026 journey in numbers</p>
          </div>

          {/* Highlight row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 28 }}>
            {/* Prediction accuracy with circular progress */}
            <div style={{ background: 'linear-gradient(135deg, rgba(249,184,0,0.12), rgba(249,184,0,0.04))', border: '1px solid rgba(249,184,0,0.25)', borderRadius: 20, padding: '20px', display: 'flex', alignItems: 'center', gap: 16, animation: 'glow 3s ease-in-out infinite' }}>
              <CircularProgress percent={MOCK_STATS.predictionAccuracy} color="#f9b800" size={68} />
              <div>
                <div style={{ color: '#f9b800', fontSize: 28, fontWeight: 900 }}>
                  <AnimatedCounter target={MOCK_STATS.predictionAccuracy} suffix="%" />
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Prediction Accuracy</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 }}>{MOCK_STATS.correctPredictions}/{MOCK_STATS.totalPredictions} correct</div>
              </div>
            </div>

            {/* Favorite team */}
            <div style={{ background: 'rgba(0,156,59,0.08)', border: '1px solid rgba(0,156,59,0.2)', borderRadius: 20, padding: '20px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🇧🇷</div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>{MOCK_STATS.favoriteTeam}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>Favorite Team</div>
            </div>

            {/* Favorite stadium */}
            <div style={{ background: 'rgba(100,181,246,0.06)', border: '1px solid rgba(100,181,246,0.18)', borderRadius: 20, padding: '20px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🏟️</div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>{MOCK_STATS.favoriteStadium}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>Favorite Stadium</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 28 }}>
            {[
              { key: 'stats' as const, label: '📊 Statistics' },
              { key: 'achievements' as const, label: `🏆 Achievements (${unlockedCount}/${MOCK_ACHIEVEMENTS.length})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                id={`tab-${key}`}
                onClick={() => setActiveTab(key)}
                style={{
                  flex: 1, padding: '11px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                  background: activeTab === key ? 'linear-gradient(135deg, #f9b800, #ff6b35)' : 'transparent',
                  color: activeTab === key ? '#0a0a1a' : 'rgba(255,255,255,0.5)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px', animation: 'fadeUp 0.4s ease' }}>
          {activeTab === 'stats' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {statItems.map(({ icon, label, value, color, suffix, prefix }, i) => (
                <div key={label} style={{ animation: `fadeUp 0.4s ease ${i * 0.05}s both` }}>
                  <StatCard icon={icon} label={label} value={value} color={color} suffix={suffix} prefix={prefix} />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'achievements' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                  {unlockedCount} of {MOCK_ACHIEVEMENTS.length} achievements unlocked
                </div>
                <div style={{ height: 6, width: 160, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(unlockedCount / MOCK_ACHIEVEMENTS.length) * 100}%`, background: 'linear-gradient(90deg, #f9b800, #ff6b35)', borderRadius: 3, transition: 'width 1s ease' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
                {MOCK_ACHIEVEMENTS.map((achievement, i) => (
                  <div key={achievement.id} style={{ animation: `fadeUp 0.4s ease ${i * 0.07}s both` }}>
                    <AchievementBadge achievement={achievement} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
