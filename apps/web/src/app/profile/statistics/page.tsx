'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Map, Compass, TrendingUp, DollarSign, PiggyBank, Leaf, Trophy, Target, Medal, Award, Star } from 'lucide-react';

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
    const duration = 1500;
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

// ─── Circular Progress ────────────────────────────────────────────────────────

function CircularProgress({ percent, color, size = 64 }: { percent: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-white/10" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, suffix, color, prefix }: { icon: React.ElementType; label: string; value: number; suffix?: string; color: string; prefix?: string }) {
  return (
    <div className={`glass-card rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-${color}-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`mb-4 inline-flex p-3 rounded-xl bg-white/5 text-${color}-400 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-3xl font-black text-white leading-tight mb-1 tracking-tight">
        <AnimatedCounter target={value} suffix={suffix} prefix={prefix} />
      </div>
      <div className="text-white/50 text-xs font-semibold uppercase tracking-widest">{label}</div>
    </div>
  );
}

// ─── Achievement Badge ────────────────────────────────────────────────────────

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  return (
    <div className={`glass-card rounded-3xl p-6 text-center transition-all duration-300 hover:scale-105 ${achievement.unlocked ? 'border-primary/30 shadow-[0_10px_30px_rgba(217,119,6,0.1)]' : 'grayscale-[0.5] opacity-70'}`}>
      {achievement.unlocked && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl pointer-events-none" />
      )}
      
      <div className={`text-5xl mb-4 transition-transform duration-300 hover:scale-110 ${achievement.unlocked ? '' : 'opacity-50 grayscale'}`}>
        {achievement.icon}
      </div>
      
      <h3 className={`font-bold text-sm mb-2 ${achievement.unlocked ? 'text-white' : 'text-white/50'}`}>
        {achievement.name}
      </h3>
      
      <p className="text-xs text-white/40 mb-4 leading-relaxed line-clamp-2">
        {achievement.description}
      </p>

      {!achievement.unlocked ? (
        <div className="mt-auto">
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-1000"
              style={{ width: `${achievement.progressPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-primary font-bold uppercase tracking-widest">{achievement.progressPercent}% Complete</div>
        </div>
      ) : (
        <div className="mt-auto inline-flex items-center gap-1.5 bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
          <Star className="w-3 h-3 fill-primary" /> Unlocked
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements'>('stats');

  const statItems = [
    { icon: Trophy, label: 'Matches Attended', value: MOCK_STATS.matchesAttended, color: 'amber' },
    { icon: Map, label: 'Countries Visited', value: MOCK_STATS.countriesVisited, color: 'emerald' },
    { icon: Compass, label: 'Cities Explored', value: MOCK_STATS.citiesVisited, color: 'sky' },
    { icon: TrendingUp, label: 'Travel Distance', value: MOCK_STATS.travelDistanceKm, suffix: ' km', color: 'purple' },
    { icon: DollarSign, label: 'Money Invested', value: MOCK_STATS.moneySpent, prefix: '$', color: 'rose' },
    { icon: PiggyBank, label: 'Money Saved', value: MOCK_STATS.moneySaved, prefix: '$', color: 'emerald' },
    { icon: Leaf, label: 'CO₂ Saved', value: MOCK_STATS.co2SavedKg, suffix: ' kg', color: 'emerald' },
    { icon: Award, label: 'Achievements', value: MOCK_STATS.achievementsUnlocked, color: 'amber' },
  ];

  const unlockedCount = MOCK_ACHIEVEMENTS.filter((a) => a.unlocked).length;
  const completionPercentage = (unlockedCount / MOCK_ACHIEVEMENTS.length) * 100;

  return (
    <main className="min-h-screen bg-background relative pb-24 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-8 relative z-10">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent mb-3 drop-shadow-sm">
            Fan Statistics
          </h1>
          <p className="text-white/60 text-base">Your FIFA World Cup 2026 journey in numbers</p>
        </div>

        {/* Highlight row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {/* Prediction accuracy with circular progress */}
          <div className="glass-card rounded-3xl p-6 flex items-center gap-6 border-primary/30 shadow-[0_0_40px_rgba(217,119,6,0.15)] relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5"></div>
            <CircularProgress percent={MOCK_STATS.predictionAccuracy} color="#d97706" size={80} />
            <div className="relative z-10">
              <div className="text-3xl font-black text-primary mb-1">
                <AnimatedCounter target={MOCK_STATS.predictionAccuracy} suffix="%" />
              </div>
              <div className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Prediction Accuracy</div>
              <div className="text-white/40 text-xs">{MOCK_STATS.correctPredictions}/{MOCK_STATS.totalPredictions} correct</div>
            </div>
          </div>

          {/* Favorite team */}
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500/5"></div>
            <div className="text-4xl mb-4 relative z-10">🇧🇷</div>
            <div className="text-white font-bold text-xl mb-1 relative z-10">{MOCK_STATS.favoriteTeam}</div>
            <div className="text-white/50 text-xs font-bold uppercase tracking-widest relative z-10">Favorite Team</div>
          </div>

          {/* Favorite stadium */}
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-sky-500/5"></div>
            <div className="text-4xl mb-4 relative z-10">🏟️</div>
            <div className="text-white font-bold text-lg leading-tight mb-1 relative z-10">{MOCK_STATS.favoriteStadium}</div>
            <div className="text-white/50 text-xs font-bold uppercase tracking-widest relative z-10">Favorite Stadium</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 mb-8 backdrop-blur-sm max-w-md">
          {[
            { key: 'stats' as const, label: 'Statistics', icon: Target },
            { key: 'achievements' as const, label: `Achievements (${unlockedCount})`, icon: Medal },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${
                activeTab === key 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="animate-fade-in-up">
          {activeTab === 'stats' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statItems.map(({ icon, label, value, color, suffix, prefix }, i) => (
                <div key={label} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <StatCard icon={icon} label={label} value={value} color={color} suffix={suffix} prefix={prefix} />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-8 glass-panel p-6 rounded-2xl">
                <div className="text-white/80 font-medium">
                  <span className="text-2xl font-black text-primary mr-2">{unlockedCount}</span> 
                  of {MOCK_ACHIEVEMENTS.length} unlocked
                </div>
                <div className="h-2 w-1/2 max-w-xs bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${completionPercentage}%` }} 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {MOCK_ACHIEVEMENTS.map((achievement, i) => (
                  <div key={achievement.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.07}s` }}>
                    <AchievementBadge achievement={achievement} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
