// ─────────────────────────────────────────────────────────────────────────────
// Share Card Engine — generates premium exportable match share card
// Milestone 8 — World Cup theme, AI summary, QR badge
// ─────────────────────────────────────────────────────────────────────────────

import { ServiceTrace } from './payment';
import { MatchMemory } from './memory';

export interface ShareCard {
  cardId: string;
  match: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  venue: string;
  city: string;
  country: string;
  date: string;
  seat: string;
  aiSummary: string;
  qrBadge: string;          // base64 QR-like badge string
  theme: 'world-cup-gold' | 'world-cup-dark' | 'world-cup-gradient';
  hashtags: string[];
  shareCaption: string;
  exportPayload: {
    title: string;
    subtitle: string;
    backgroundGradient: string[];
    accentColor: string;
  };
  generatedAt: string;
}

export class ShareCardEngine {
  private traces: ServiceTrace[] = [];

  generateShareCard(memory: MatchMemory, seat?: string): ShareCard {
    const executionId = `share-${Date.now()}`;
    const startTime = new Date().toISOString();
    const t0 = Date.now();

    const cardId = `SC-${Date.now().toString(36).toUpperCase()}`;
    const qrBadge = Buffer.from(`${cardId}:${memory.matchId}`).toString('base64url').slice(0, 20).toUpperCase();

    const themes: ShareCard['theme'][] = ['world-cup-gold', 'world-cup-dark', 'world-cup-gradient'];
    const theme = themes[memory.matchId.length % themes.length];

    const gradients: Record<ShareCard['theme'], string[]> = {
      'world-cup-gold': ['#1a1a2e', '#c9a84c', '#f5c518'],
      'world-cup-dark': ['#0a0a0a', '#1e3a5f', '#2980b9'],
      'world-cup-gradient': ['#0f2027', '#203a43', '#2c5364'],
    };

    const accents: Record<ShareCard['theme'], string> = {
      'world-cup-gold': '#f5c518',
      'world-cup-dark': '#2980b9',
      'world-cup-gradient': '#00d2ff',
    };

    const card: ShareCard = {
      cardId,
      match: memory.matchName,
      homeTeam: memory.homeTeam,
      awayTeam: memory.awayTeam,
      score: memory.score,
      venue: memory.venue,
      city: memory.city,
      country: memory.country,
      date: memory.attendanceDate,
      seat: seat ?? `Section ${memory.memoryId.slice(-3)} Row 12 Seat 14`,
      aiSummary: memory.aiSummary,
      qrBadge,
      theme,
      hashtags: [
        `#FIFA2026`,
        `#${memory.homeTeam.replace(/\s/g, '')}vs${memory.awayTeam.replace(/\s/g, '')}`,
        `#WorldCup2026`,
        `#${memory.venue.replace(/\s/g, '')}`,
        `#FIFAAICompanion`,
      ],
      shareCaption: `I was there! ${memory.matchName} | ${memory.score} | ${memory.venue}, ${memory.city} 🏆 #FIFA2026 #WorldCup2026`,
      exportPayload: {
        title: memory.matchName,
        subtitle: `${memory.score} • ${memory.venue}`,
        backgroundGradient: gradients[theme],
        accentColor: accents[theme],
      },
      generatedAt: new Date().toISOString(),
    };

    this.traces.push({
      executionId,
      serviceName: 'ShareCardEngine',
      startTime,
      endTime: new Date().toISOString(),
      latencyMs: Date.now() - t0,
      status: 'success',
      warnings: [],
      errors: [],
      meta: { cardId, theme, match: memory.matchName },
    });

    return card;
  }

  getTraces(): ServiceTrace[] {
    return [...this.traces];
  }
}

export const shareCardEngine = new ShareCardEngine();
