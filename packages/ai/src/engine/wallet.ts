// ─────────────────────────────────────────────────────────────────────────────
// Wallet Engine — digital wallet state aggregator
// Milestone 8 — reads from TicketService, enriches with shortcuts
// ─────────────────────────────────────────────────────────────────────────────

import { ServiceTrace } from './payment';
import { TicketPayload, TicketStatus } from './ticket';

export interface WalletTicketEntry extends TicketPayload {
  travelShortcut: string;
  navigationShortcut: string;
  weatherShortcut: string;
  paymentReceipt: string;
}

export interface WalletState {
  userId: string;
  upcomingTickets: WalletTicketEntry[];
  pastTickets: WalletTicketEntry[];
  savedTickets: WalletTicketEntry[];
  downloadedTickets: WalletTicketEntry[];
  totalSpent: number;
  currency: string;
  lastUpdated: string;
}

// ─── WalletEngine ─────────────────────────────────────────────────────────────

export class WalletEngine {
  private traces: ServiceTrace[] = [];

  getWalletState(userId: string, tickets: TicketPayload[]): WalletState {
    const executionId = `wallet-${Date.now()}`;
    const startTime = new Date().toISOString();
    const t0 = Date.now();

    const enrich = (t: TicketPayload): WalletTicketEntry => ({
      ...t,
      travelShortcut: `AI Travel Plan → ${t.venueName}`,
      navigationShortcut: `Navigate: ${t.gate}, ${t.section} Block`,
      weatherShortcut: `Today at ${t.venueName}: ☀️ 29°C, Clear`,
      paymentReceipt: `Receipt #${t.paymentId.slice(0, 10).toUpperCase()} — ${t.currency} ${t.price.toFixed(2)}`,
    });

    const now = new Date();
    const upcoming = tickets
      .filter((t) => t.status === 'Active' && new Date(t.matchDate) > now)
      .map(enrich);

    const past = tickets
      .filter((t) => t.status === 'Used' || new Date(t.matchDate) <= now)
      .map(enrich);

    const saved = tickets.filter((t) => t.status === 'Shared').map(enrich);
    const downloaded = tickets.filter((t) => t.status === 'Downloaded').map(enrich);

    const totalSpent = tickets.reduce((sum, t) => sum + t.price, 0);

    const state: WalletState = {
      userId,
      upcomingTickets: upcoming,
      pastTickets: past,
      savedTickets: saved,
      downloadedTickets: downloaded,
      totalSpent,
      currency: tickets[0]?.currency ?? 'USD',
      lastUpdated: new Date().toISOString(),
    };

    this.traces.push({
      executionId,
      serviceName: 'WalletEngine',
      startTime,
      endTime: new Date().toISOString(),
      latencyMs: Date.now() - t0,
      status: 'success',
      warnings: [],
      errors: [],
      meta: {
        userId,
        totalTickets: tickets.length,
        upcoming: upcoming.length,
        past: past.length,
      },
    });

    return state;
  }

  getTraces(): ServiceTrace[] {
    return [...this.traces];
  }
}

export const walletEngine = new WalletEngine();
