// ─────────────────────────────────────────────────────────────────────────────
// Fan Stats Engine — aggregates personal statistics from mock data
// Milestone 8 — Deterministic, seeded from userId
// ─────────────────────────────────────────────────────────────────────────────

import { ServiceTrace } from './payment';
import { FanStats } from './achievement';

export class FanStatsEngine {
  private traces: ServiceTrace[] = [];

  computeStats(userId: string): FanStats {
    const executionId = `stats-${Date.now()}`;
    const startTime = new Date().toISOString();
    const t0 = Date.now();

    // Deterministic seed from userId
    const seed = this.hashCode(userId);
    const r = (min: number, max: number) => min + (Math.abs(seed) % (max - min + 1));

    const matchesAttended = r(1, 8);
    const countriesVisited = Math.min(matchesAttended, r(1, 4));
    const citiesVisited = Math.min(matchesAttended + 1, r(2, 6));
    const totalPredictions = r(10, 40);
    const correctPredictions = Math.floor(totalPredictions * (r(55, 95) / 100));
    const predictionAccuracy = Math.round((correctPredictions / totalPredictions) * 100);
    const ticketsOwned = matchesAttended + r(0, 2);

    const stats: FanStats = {
      matchesAttended,
      countriesVisited,
      citiesVisited,
      travelDistanceKm: r(800, 12000),
      moneySpent: r(1200, 8500),
      moneySaved: r(150, 800),
      co2SavedKg: r(40, 320),
      favoriteTeam: 'Brazil',
      favoriteStadium: 'Lusail Iconic Stadium',
      predictionAccuracy,
      totalPredictions,
      correctPredictions,
      ticketsOwned,
      achievementsUnlocked: 0, // populated by AchievementEngine
    };

    this.traces.push({
      executionId,
      serviceName: 'FanStatsEngine',
      startTime,
      endTime: new Date().toISOString(),
      latencyMs: Date.now() - t0,
      status: 'success',
      warnings: [],
      errors: [],
      meta: { userId, matchesAttended, predictionAccuracy },
    });

    return stats;
  }

  getTraces(): ServiceTrace[] {
    return [...this.traces];
  }

  private hashCode(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0;
  }
}

export const fanStatsEngine = new FanStatsEngine();
