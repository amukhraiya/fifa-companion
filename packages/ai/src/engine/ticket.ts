// ─────────────────────────────────────────────────────────────────────────────
// Ticket Service — generate, validate, revoke, share, download
// Milestone 8 — Consumes IQRCodeService via DI (loose coupling)
// ─────────────────────────────────────────────────────────────────────────────

import { IQRCodeService } from './qr';
import { ServiceTrace } from './payment';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TicketStatus = 'Active' | 'Used' | 'Expired' | 'Cancelled' | 'Downloaded' | 'Shared';

export interface TicketPayload {
  ticketId: string;
  userId: string;
  seatId: string;
  matchId: string;
  venueId: string;
  venueName: string;
  matchName: string;
  matchDate: string;
  gate: string;
  section: string;
  row: string;
  seatNumber: string;
  price: number;
  currency: string;
  paymentId: string;
  timestamp: string;
  signature: string;      // mock HMAC-SHA256
  qrPayload: string;      // base64 QR
  barcodePayload: string; // numeric barcode
  offlineToken: string;   // offline verification token
  status: TicketStatus;
  shareUrl?: string;
  downloadUrl?: string;
}

export interface ValidationResult {
  valid: boolean;
  ticketId?: string;
  status?: TicketStatus;
  reason?: string;
  gate?: string;
  seat?: string;
}

export interface ShareResult {
  shareUrl: string;
  shareCode: string;
  expiresAt: string;
  message: string;
}

export interface DownloadPayload {
  downloadUrl: string;
  filename: string;
  format: 'pkpass' | 'pdf' | 'png';
  generatedAt: string;
  offlineToken: string;
}

// ─── TicketService ────────────────────────────────────────────────────────────

export class TicketService {
  private tickets: Map<string, TicketPayload> = new Map();
  private traces: ServiceTrace[] = [];
  private usedTickets: Set<string> = new Set();

  constructor(private readonly qrService: IQRCodeService) {}

  generateTicket(params: {
    userId: string;
    seatId: string;
    matchId: string;
    venueId: string;
    venueName: string;
    matchName: string;
    matchDate: string;
    gate: string;
    section: string;
    row: string;
    seatNumber: string;
    price: number;
    currency: string;
    paymentId: string;
  }): TicketPayload {
    const executionId = `tkt-gen-${Date.now()}`;
    const startTime = new Date().toISOString();
    const t0 = Date.now();

    const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const expiresAt = new Date(params.matchDate).toISOString();

    // Mock HMAC-SHA256 signature — deterministic from key fields
    const signatureInput = `${ticketId}:${params.userId}:${params.seatId}:${params.matchId}`;
    const signature = Buffer.from(signatureInput).toString('base64url').slice(0, 32).toUpperCase();

    const qrResult = this.qrService.generateQR({
      ticketId,
      userId: params.userId,
      matchId: params.matchId,
      seatId: params.seatId,
      signature,
      issuedAt: timestamp,
      expiresAt,
    });

    const ticket: TicketPayload = {
      ticketId,
      userId: params.userId,
      seatId: params.seatId,
      matchId: params.matchId,
      venueId: params.venueId,
      venueName: params.venueName,
      matchName: params.matchName,
      matchDate: params.matchDate,
      gate: params.gate,
      section: params.section,
      row: params.row,
      seatNumber: params.seatNumber,
      price: params.price,
      currency: params.currency,
      paymentId: params.paymentId,
      timestamp,
      signature,
      qrPayload: qrResult.qrPayload,
      barcodePayload: qrResult.barcodePayload,
      offlineToken: qrResult.offlineToken,
      status: 'Active',
    };

    this.tickets.set(ticketId, ticket);

    this.traces.push({
      executionId,
      serviceName: 'TicketService',
      startTime,
      endTime: new Date().toISOString(),
      latencyMs: Date.now() - t0,
      status: 'success',
      warnings: [],
      errors: [],
      meta: { ticketId, matchId: params.matchId },
    });

    return ticket;
  }

  validateTicket(ticketId: string): ValidationResult {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      return { valid: false, reason: 'InvalidSignature' };
    }
    if (ticket.status === 'Cancelled') {
      return { valid: false, ticketId, reason: 'CancelledTicket' };
    }
    if (ticket.status === 'Expired') {
      return { valid: false, ticketId, reason: 'ExpiredTicket' };
    }
    if (this.usedTickets.has(ticketId)) {
      return { valid: false, ticketId, reason: 'DuplicateEntry' };
    }
    return {
      valid: true,
      ticketId,
      status: ticket.status,
      gate: ticket.gate,
      seat: `Section ${ticket.section} Row ${ticket.row} Seat ${ticket.seatNumber}`,
    };
  }

  revokeTicket(ticketId: string): void {
    const ticket = this.tickets.get(ticketId);
    if (ticket) {
      ticket.status = 'Cancelled';
      this.tickets.set(ticketId, ticket);
    }
  }

  markUsed(ticketId: string): void {
    this.usedTickets.add(ticketId);
    const ticket = this.tickets.get(ticketId);
    if (ticket) {
      ticket.status = 'Used';
      this.tickets.set(ticketId, ticket);
    }
  }

  shareTicket(ticketId: string): ShareResult {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    const shareCode = `SHARE-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const shareUrl = `https://tickets.fifa-companion.dev/share/${shareCode}`;
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    ticket.shareUrl = shareUrl;
    ticket.status = 'Shared';
    this.tickets.set(ticketId, ticket);

    return {
      shareUrl,
      shareCode,
      expiresAt,
      message: `Your ticket for ${ticket.matchName} has been shared. Code: ${shareCode}`,
    };
  }

  downloadTicket(ticketId: string): DownloadPayload {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    const downloadUrl = `https://tickets.fifa-companion.dev/download/${ticketId}.pkpass`;
    ticket.downloadUrl = downloadUrl;
    ticket.status = 'Downloaded';
    this.tickets.set(ticketId, ticket);

    return {
      downloadUrl,
      filename: `${ticketId}.pkpass`,
      format: 'pkpass',
      generatedAt: new Date().toISOString(),
      offlineToken: ticket.offlineToken,
    };
  }

  getTicket(ticketId: string): TicketPayload | null {
    return this.tickets.get(ticketId) ?? null;
  }

  getUserTickets(userId: string): TicketPayload[] {
    return Array.from(this.tickets.values()).filter((t) => t.userId === userId);
  }

  getTraces(): ServiceTrace[] {
    return [...this.traces];
  }
}

// ─── Singleton (populated with demo seed data on init) ───────────────────────

import { qrCodeService } from './qr';

export const ticketService = new TicketService(qrCodeService);

// Seed two demo tickets
const _demo1 = ticketService.generateTicket({
  userId: 'demo-user',
  seatId: 'seat-brazilspain-c12',
  matchId: 'match-brazil-spain',
  venueId: 'venue-lusail',
  venueName: 'Lusail Iconic Stadium',
  matchName: 'Brazil vs Spain',
  matchDate: '2026-07-28T18:00:00Z',
  gate: 'Gate C',
  section: 'C',
  row: '12',
  seatNumber: '14',
  price: 350,
  currency: 'USD',
  paymentId: 'mock-txn-demo-001',
});

const _demo2 = ticketService.generateTicket({
  userId: 'demo-user',
  seatId: 'seat-argfra-a05',
  matchId: 'match-argentina-france',
  venueId: 'venue-metlife',
  venueName: 'MetLife Stadium',
  matchName: 'Argentina vs France — Final',
  matchDate: '2026-07-19T15:00:00Z',
  gate: 'Gate A',
  section: 'A',
  row: '5',
  seatNumber: '22',
  price: 950,
  currency: 'USD',
  paymentId: 'mock-txn-demo-002',
});

// Mark second ticket as used (past match)
ticketService.markUsed(_demo2.ticketId);
