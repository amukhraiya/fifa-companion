// ─────────────────────────────────────────────────────────────────────────────
// Achievement Engine — unlock system based on fan statistics
// Milestone 8 — Deterministic, Demo Mode, full observability
// ─────────────────────────────────────────────────────────────────────────────

import { ServiceTrace } from './payment';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'attendance' | 'travel' | 'prediction' | 'loyalty' | 'collection';
  unlockedAt?: string;
  unlocked: boolean;
  progressPercent: number;
  requirement: string;
}

export interface FanStats {
  matchesAttended: number;
  countriesVisited: number;
  citiesVisited: number;
  travelDistanceKm: number;
  moneySpent: number;
  moneySaved: number;
  co2SavedKg: number;
  favoriteTeam: string;
  favoriteStadium: string;
  predictionAccuracy: number;  // 0–100
  totalPredictions: number;
  correctPredictions: number;
  ticketsOwned: number;
  achievementsUnlocked: number;
}

// ─── Achievement Definitions ──────────────────────────────────────────────────

const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progressPercent'>[] = [
  {
    id: 'first-match',
    name: 'First Match',
    description: 'Attended your very first World Cup match. The journey begins!',
    icon: '🏟️',
    category: 'attendance',
    requirement: 'Attend 1 match',
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Visited matches in 3 or more different cities.',
    icon: '🗺️',
    category: 'travel',
    requirement: 'Visit 3 cities',
  },
  {
    id: 'super-fan',
    name: 'Super Fan',
    description: 'Attended 5 or more matches in a single tournament.',
    icon: '⭐',
    category: 'attendance',
    requirement: 'Attend 5 matches',
  },
  {
    id: 'world-traveler',
    name: 'World Traveler',
    description: 'Traveled to matches in 3 or more countries.',
    icon: '✈️',
    category: 'travel',
    requirement: 'Visit 3 countries',
  },
  {
    id: 'collector',
    name: 'Collector',
    description: 'Accumulated 3 or more tickets in your digital wallet.',
    icon: '🎫',
    category: 'collection',
    requirement: 'Own 3 tickets',
  },
  {
    id: 'prediction-master',
    name: 'Prediction Master',
    description: 'Achieved 75% or above match prediction accuracy.',
    icon: '🔮',
    category: 'prediction',
    requirement: '75% prediction accuracy',
  },
  {
    id: 'support-team-loyalist',
    name: 'Support Team Loyalist',
    description: 'Attended 3 or more matches featuring your favorite team.',
    icon: '🏆',
    category: 'loyalty',
    requirement: 'Attend 3 matches for your favorite team',
  },
];

// ─── AchievementEngine ────────────────────────────────────────────────────────

export class AchievementEngine {
  private traces: ServiceTrace[] = [];

  evaluateAchievements(stats: FanStats): Achievement[] {
    const executionId = `ach-eval-${Date.now()}`;
    const startTime = new Date().toISOString();
    const t0 = Date.now();
    const unlockedAt = new Date().toISOString();

    const achievements: Achievement[] = ACHIEVEMENT_DEFS.map((def) => {
      let unlocked = false;
      let progressPercent = 0;

      switch (def.id) {
        case 'first-match':
          unlocked = stats.matchesAttended >= 1;
          progressPercent = Math.min(100, (stats.matchesAttended / 1) * 100);
          break;
        case 'explorer':
          unlocked = stats.citiesVisited >= 3;
          progressPercent = Math.min(100, (stats.citiesVisited / 3) * 100);
          break;
        case 'super-fan':
          unlocked = stats.matchesAttended >= 5;
          progressPercent = Math.min(100, (stats.matchesAttended / 5) * 100);
          break;
        case 'world-traveler':
          unlocked = stats.countriesVisited >= 3;
          progressPercent = Math.min(100, (stats.countriesVisited / 3) * 100);
          break;
        case 'collector':
          unlocked = stats.ticketsOwned >= 3;
          progressPercent = Math.min(100, (stats.ticketsOwned / 3) * 100);
          break;
        case 'prediction-master':
          unlocked = stats.predictionAccuracy >= 75;
          progressPercent = Math.min(100, (stats.predictionAccuracy / 75) * 100);
          break;
        case 'support-team-loyalist':
          // Approximation — loyalist if attended >= 3 matches total
          unlocked = stats.matchesAttended >= 3;
          progressPercent = Math.min(100, (stats.matchesAttended / 3) * 100);
          break;
      }

      return {
        ...def,
        unlocked,
        unlockedAt: unlocked ? unlockedAt : undefined,
        progressPercent: Math.round(progressPercent),
      };
    });

    this.traces.push({
      executionId,
      serviceName: 'AchievementEngine',
      startTime,
      endTime: new Date().toISOString(),
      latencyMs: Date.now() - t0,
      status: 'success',
      warnings: [],
      errors: [],
      meta: {
        total: achievements.length,
        unlocked: achievements.filter((a) => a.unlocked).length,
      },
    });

    return achievements;
  }

  getTraces(): ServiceTrace[] {
    return [...this.traces];
  }
}

export const achievementEngine = new AchievementEngine();
