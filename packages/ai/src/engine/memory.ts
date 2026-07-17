// ─────────────────────────────────────────────────────────────────────────────
// Memory Engine — fan match memories, post-match summaries, AI timeline
// Milestone 8 — mock providers, no external APIs
// ─────────────────────────────────────────────────────────────────────────────

import { ServiceTrace } from './payment';
import { MatchState } from './types';

export interface MatchMemory {
  memoryId: string;
  userId: string;
  matchId: string;
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
  photos: string[];        // placeholder paths
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

export interface PostMatchSummary {
  result: 'HomeWin' | 'AwayWin' | 'Draw';
  homeTeam: string;
  awayTeam: string;
  score: string;
  bestPlayer: string;
  turningPoint: string;
  possessionHome: number;
  possessionAway: number;
  keyEvents: Array<{ minute: number; type: string; description: string }>;
  fanPulseDb: number;
  aiSummary: string;
  momentum: number;
}

export interface TimelineEvent {
  id: string;
  date: string;
  type: 'register' | 'memory' | 'booking' | 'travel' | 'entry' | 'match' | 'achievement';
  title: string;
  description: string;
  icon: string;
  matchId?: string;
}

// ─── MemoryEngine ─────────────────────────────────────────────────────────────

export class MemoryEngine {
  private memories: Map<string, MatchMemory[]> = new Map();
  private traces: ServiceTrace[] = [];

  generateMatchMemory(params: {
    userId: string;
    matchId: string;
    matchName: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    venue: string;
    country: string;
    city: string;
    attendanceDate: string;
  }): MatchMemory {
    const executionId = `mem-${Date.now()}`;
    const startTime = new Date().toISOString();
    const t0 = Date.now();

    const result = params.homeScore > params.awayScore
      ? `${params.homeTeam} win`
      : params.homeScore < params.awayScore
      ? `${params.awayTeam} win`
      : 'Draw';

    const weatherOptions = [
      { w: 'Sunny, clear skies', icon: '☀️', temp: '29°C' },
      { w: 'Partly cloudy', icon: '⛅', temp: '24°C' },
      { w: 'Warm evening breeze', icon: '🌙', temp: '22°C' },
      { w: 'Hot and humid', icon: '🌡️', temp: '34°C' },
    ];
    const wx = weatherOptions[Math.abs(params.matchId.charCodeAt(0)) % weatherOptions.length];

    const bestPlayers: Record<string, string[]> = {
      Brazil: ['Vinicius Jr', 'Neymar Jr', 'Rodrygo', 'Paquetá'],
      Spain: ['Pedri', 'Morata', 'Yamal', 'Rodri'],
      Argentina: ['Messi', 'Di María', 'De Paul', 'Álvarez'],
      France: ['Mbappé', 'Griezmann', 'Camavinga', 'Tchouaméni'],
    };
    const homePlayers = bestPlayers[params.homeTeam] ?? ['Player A', 'Player B'];
    const bestPlayer = homePlayers[0];

    const aiSummaries = [
      `A thrilling encounter at ${params.venue} where ${result}. The crowd energy peaked at 94 decibels during the second half, creating an electric atmosphere unlike any other. AI analysis indicates ${params.homeTeam}'s pressing intensity was the decisive tactical factor.`,
      `${params.venue} witnessed an unforgettable clash. ${params.homeTeam}'s transition play dismantled ${params.awayTeam}'s defensive structure with surgical precision. The momentum shifted three times before ${result}.`,
      `What a night at ${params.city}! The ${params.matchName} delivered everything: drama, skill, and passion. AI tactical analysis shows this was decided by set-piece dominance and exceptional goalkeeper performance.`,
    ];
    const aiSummary = aiSummaries[Math.abs(params.matchId.length) % aiSummaries.length];

    const memory: MatchMemory = {
      memoryId: `MEM-${Date.now()}-${params.matchId.slice(0, 6)}`,
      userId: params.userId,
      matchId: params.matchId,
      matchName: params.matchName,
      venue: params.venue,
      country: params.country,
      city: params.city,
      score: `${params.homeScore} - ${params.awayScore}`,
      attendanceDate: params.attendanceDate,
      weather: wx.w,
      weatherIcon: wx.icon,
      temperature: wx.temp,
      fanPulseDb: 88 + (Math.abs(params.homeScore - params.awayScore) * 2),
      aiSummary,
      travelSummary: `Arrived via Metro Line 2 from City Centre. Journey: 38 minutes. Seat Row 12, Block C — excellent sightlines. Departed post-match using shuttle bus.`,
      bestPlayer,
      turningPoint: `${bestPlayer}'s decisive action in the 67th minute changed the momentum completely.`,
      favoriteMetent: `The roar of the crowd when the final whistle blew at ${params.venue}.`,
      photos: [
        '/photos/stadium-exterior.jpg',
        '/photos/match-action.jpg',
        '/photos/crowd-celebration.jpg',
        '/photos/ticket-memory.jpg',
      ],
      homeTeam: params.homeTeam,
      awayTeam: params.awayTeam,
      homeScore: params.homeScore,
      awayScore: params.awayScore,
    };

    const existing = this.memories.get(params.userId) ?? [];
    existing.push(memory);
    this.memories.set(params.userId, existing);

    this.traces.push({
      executionId,
      serviceName: 'MemoryEngine',
      startTime,
      endTime: new Date().toISOString(),
      latencyMs: Date.now() - t0,
      status: 'success',
      warnings: [],
      errors: [],
      meta: { memoryId: memory.memoryId, matchId: params.matchId },
    });

    return memory;
  }

  generatePostMatchSummary(state: MatchState): PostMatchSummary {
    const executionId = `summary-${Date.now()}`;
    const startTime = new Date().toISOString();
    const t0 = Date.now();

    const result: PostMatchSummary['result'] =
      state.score.home > state.score.away
        ? 'HomeWin'
        : state.score.home < state.score.away
        ? 'AwayWin'
        : 'Draw';

    const summary: PostMatchSummary = {
      result,
      homeTeam: state.homeTeam,
      awayTeam: state.awayTeam,
      score: `${state.score.home} - ${state.score.away}`,
      bestPlayer: result === 'HomeWin' ? 'Vinicius Jr' : result === 'AwayWin' ? 'Morata' : 'Pedri',
      turningPoint:
        result === 'HomeWin'
          ? "Brazil's clinical counter-attack in the 74th minute shifted the match irreversibly"
          : result === 'AwayWin'
          ? "Spain's high press forced three turnovers in the final quarter"
          : 'Both teams neutralized each other — a tactical masterclass from both coaching staffs',
      possessionHome: state.statistics.possessionHome,
      possessionAway: state.statistics.possessionAway,
      keyEvents: [
        { minute: 28, type: 'Goal', description: `${state.homeTeam} open the scoring` },
        { minute: 61, type: 'Substitution', description: `Tactical switch changes the game` },
        { minute: 74, type: 'Goal', description: `${state.awayTeam} equalize from the penalty spot` },
        { minute: 88, type: 'RedCard', description: `Dani Carvajal dismissed — 10 men` },
      ],
      fanPulseDb: 94,
      aiSummary: `Full Time: ${state.homeTeam} ${state.score.home} - ${state.score.away} ${state.awayTeam}. A classic tactical battle. ${result === 'HomeWin' ? `${state.homeTeam}'s transition counters proved decisive` : result === 'AwayWin' ? `${state.awayTeam} dominated the second half` : 'An even contest decided by fine margins'}. Expected Goals: ${state.statistics.expectedGoalsHome.toFixed(2)} vs ${state.statistics.expectedGoalsAway.toFixed(2)}.`,
      momentum: state.momentum.value,
    };

    this.traces.push({
      executionId,
      serviceName: 'MemoryEngine',
      startTime,
      endTime: new Date().toISOString(),
      latencyMs: Date.now() - t0,
      status: 'success',
      warnings: [],
      errors: [],
      meta: { result, score: summary.score },
    });

    return summary;
  }

  generateTimeline(userId: string): TimelineEvent[] {
    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

    return [
      {
        id: 'tl-register',
        date: daysAgo(45),
        type: 'register',
        title: 'Registered',
        description: 'Created FIFA AI Companion account and completed Fan DNA setup.',
        icon: '🎉',
      },
      {
        id: 'tl-booking',
        date: daysAgo(30),
        type: 'booking',
        title: 'First Booking',
        description: 'Reserved seat for Brazil vs Spain — Lusail Iconic Stadium, Gate C, Row 12.',
        icon: '🎫',
        matchId: 'match-brazil-spain',
      },
      {
        id: 'tl-travel',
        date: daysAgo(15),
        type: 'travel',
        title: 'Travel Completed',
        description: 'AI-planned journey: Metro Line 2, 38 minutes from City Centre to stadium.',
        icon: '✈️',
      },
      {
        id: 'tl-entry',
        date: daysAgo(14),
        type: 'entry',
        title: 'Entered Stadium',
        description: 'QR validated at Gate C. Welcome to Lusail Iconic Stadium!',
        icon: '🏟️',
        matchId: 'match-brazil-spain',
      },
      {
        id: 'tl-match',
        date: daysAgo(14),
        type: 'match',
        title: 'Watched Brazil vs Spain',
        description: 'Brazil 2 – 1 Spain. 94 decibels of crowd energy. Unforgettable.',
        icon: '⚽',
        matchId: 'match-brazil-spain',
      },
      {
        id: 'tl-memory',
        date: daysAgo(13),
        type: 'memory',
        title: 'Memory Created',
        description: 'AI generated your personal match memory and scrapbook entry.',
        icon: '📸',
        matchId: 'match-brazil-spain',
      },
      {
        id: 'tl-achievement',
        date: daysAgo(13),
        type: 'achievement',
        title: 'Achievement Unlocked: First Match',
        description: 'You attended your very first FIFA World Cup match. The journey begins!',
        icon: '🏆',
      },
    ];
  }

  getMemories(userId: string): MatchMemory[] {
    return this.memories.get(userId) ?? [];
  }

  getTraces(): ServiceTrace[] {
    return [...this.traces];
  }
}

export const memoryEngine = new MemoryEngine();

// Seed demo memories
memoryEngine.generateMatchMemory({
  userId: 'demo-user',
  matchId: 'match-brazil-spain',
  matchName: 'Brazil vs Spain',
  homeTeam: 'Brazil',
  awayTeam: 'Spain',
  homeScore: 2,
  awayScore: 1,
  venue: 'Lusail Iconic Stadium',
  country: 'Qatar',
  city: 'Lusail',
  attendanceDate: '2026-07-14T18:00:00Z',
});

memoryEngine.generateMatchMemory({
  userId: 'demo-user',
  matchId: 'match-argentina-france',
  matchName: 'Argentina vs France — Final',
  homeTeam: 'Argentina',
  awayTeam: 'France',
  homeScore: 3,
  awayScore: 3,
  venue: 'MetLife Stadium',
  country: 'USA',
  city: 'New Jersey',
  attendanceDate: '2026-07-19T15:00:00Z',
});
