// ─────────────────────────────────────────────────────────────────────────────
// QR Engine — IQRCodeService / QRCodeService
// Milestone 8 — DI-based (not static), loose coupling via interface
// Supports future NFC integration through IQRScanner
// ─────────────────────────────────────────────────────────────────────────────

import { ServiceTrace } from './payment';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface QRPayload {
  ticketId: string;
  userId: string;
  matchId: string;
  seatId: string;
  signature: string;
  issuedAt: string;
  expiresAt: string;
}

export interface QRGenerateResult {
  qrPayload: string;        // base64-encoded JSON
  barcodePayload: string;   // numeric barcode string
  offlineToken: string;     // offline verification token
  displayData: string;      // human-readable summary
}

export interface QRValidateResult {
  valid: boolean;
  ticketId?: string;
  reason?: string;
}

export interface IQRCodeService {
  generateQR(data: QRPayload): QRGenerateResult;
  validateQR(encodedPayload: string, expectedSignature: string): QRValidateResult;
  generateOfflineToken(ticketId: string, signature: string): string;
  getTraces(): ServiceTrace[];
}

// ─── IQRScanner — Future NFC Integration Hook ─────────────────────────────────

export interface IQRScanner {
  scan(): Promise<string>;           // Returns raw payload string
  isNFCSupported(): boolean;
}

// ─── MockQRScanner ────────────────────────────────────────────────────────────

export class MockQRScanner implements IQRScanner {
  private mockPayload: string;

  constructor(mockPayload: string) {
    this.mockPayload = mockPayload;
  }

  async scan(): Promise<string> {
    await Promise.resolve();
    return this.mockPayload;
  }

  isNFCSupported(): boolean {
    return false; // NFC not supported in demo
  }
}

// ─── QRCodeService (DI-injectable) ───────────────────────────────────────────

export class QRCodeService implements IQRCodeService {
  private traces: ServiceTrace[] = [];

  generateQR(data: QRPayload): QRGenerateResult {
    const executionId = `qr-gen-${Date.now()}`;
    const startTime = new Date().toISOString();
    const t0 = Date.now();

    try {
      // Encode QR payload as base64 JSON
      const json = JSON.stringify(data);
      const qrPayload = Buffer.from(json).toString('base64');

      // Generate numeric barcode from ticketId hash
      const barcodePayload = this.hashToNumeric(data.ticketId, 16);

      // Generate offline verification token
      const offlineToken = this.generateOfflineToken(data.ticketId, data.signature);

      // Human-readable display
      const displayData = `TKT:${data.ticketId.slice(0, 8).toUpperCase()} | SEAT:${data.seatId.slice(0, 6).toUpperCase()} | ${data.issuedAt.slice(0, 10)}`;

      const latencyMs = Date.now() - t0;
      this.traces.push({
        executionId,
        serviceName: 'QRCodeService',
        startTime,
        endTime: new Date().toISOString(),
        latencyMs,
        status: 'success',
        warnings: [],
        errors: [],
        meta: { ticketId: data.ticketId },
      });

      return { qrPayload, barcodePayload, offlineToken, displayData };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'QR generation failed';
      this.traces.push({
        executionId,
        serviceName: 'QRCodeService',
        startTime,
        endTime: new Date().toISOString(),
        latencyMs: Date.now() - t0,
        status: 'error',
        warnings: [],
        errors: [msg],
      });
      throw err;
    }
  }

  validateQR(encodedPayload: string, expectedSignature: string): QRValidateResult {
    try {
      const json = Buffer.from(encodedPayload, 'base64').toString('utf8');
      const data = JSON.parse(json) as QRPayload;

      if (!data.ticketId || !data.signature) {
        return { valid: false, reason: 'InvalidSignature' };
      }

      if (data.signature !== expectedSignature) {
        return { valid: false, reason: 'InvalidSignature' };
      }

      const now = new Date();
      if (new Date(data.expiresAt) < now) {
        return { valid: false, reason: 'ExpiredTicket' };
      }

      return { valid: true, ticketId: data.ticketId };
    } catch {
      return { valid: false, reason: 'InvalidSignature' };
    }
  }

  generateOfflineToken(ticketId: string, signature: string): string {
    // Deterministic offline token — XOR-based mock (not cryptographic, demo only)
    const combined = `${ticketId}::${signature}`;
    const token = Buffer.from(combined).toString('base64url').slice(0, 32).toUpperCase();
    return `OFT-${token}`;
  }

  getTraces(): ServiceTrace[] {
    return [...this.traces];
  }

  private hashToNumeric(input: string, length: number): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash * 31 + input.charCodeAt(i)) & 0xffffffff;
    }
    const raw = Math.abs(hash).toString() + Date.now().toString().slice(-6);
    return raw.slice(0, length).padEnd(length, '0');
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const qrCodeService = new QRCodeService();
