// ─────────────────────────────────────────────────────────────────────────────
// Entry Validation Engine — QR scan → signature verify → admit/reject
// Milestone 8 — full workflow with observability
// ─────────────────────────────────────────────────────────────────────────────

import { ServiceTrace } from './payment';
import { IQRCodeService } from './qr';
import { TicketService } from './ticket';

export type EntryStatus = 'Admitted' | 'Rejected';
export type RejectionReason = 'ExpiredTicket' | 'DuplicateEntry' | 'InvalidSignature' | 'CancelledTicket' | 'NotFound';

export interface EntryValidationResult {
  status: EntryStatus;
  ticketId?: string;
  gate?: string;
  seat?: string;
  welcomeMessage?: string;
  reason?: RejectionReason;
  validatedAt: string;
  processingSteps: string[];
}

export class EntryValidationEngine {
  private traces: ServiceTrace[] = [];
  private admittedSet: Set<string> = new Set();

  constructor(
    private readonly qrService: IQRCodeService,
    private readonly ticketSvc: TicketService,
  ) {}

  validateEntry(qrPayload: string, expectedSignature: string): EntryValidationResult {
    const executionId = `entry-${Date.now()}`;
    const startTime = new Date().toISOString();
    const t0 = Date.now();
    const steps: string[] = [];
    const validatedAt = new Date().toISOString();

    steps.push('Step 1: QR payload received — initiating signature verification');

    // Step 1: validate QR signature
    const qrResult = this.qrService.validateQR(qrPayload, expectedSignature);
    if (!qrResult.valid || !qrResult.ticketId) {
      steps.push('Step 2: Signature validation FAILED — InvalidSignature');
      this.recordTrace(executionId, startTime, t0, 'error', { reason: 'InvalidSignature' });
      return { status: 'Rejected', reason: 'InvalidSignature', validatedAt, processingSteps: steps };
    }

    steps.push(`Step 2: Signature valid — ticketId: ${qrResult.ticketId.slice(0, 12)}…`);

    // Step 2: check for duplicate entry
    if (this.admittedSet.has(qrResult.ticketId)) {
      steps.push('Step 3: Duplicate entry detected — ticket already scanned');
      this.recordTrace(executionId, startTime, t0, 'warning', { reason: 'DuplicateEntry' });
      return { status: 'Rejected', reason: 'DuplicateEntry', ticketId: qrResult.ticketId, validatedAt, processingSteps: steps };
    }

    // Step 3: validate ticket state in service
    const validation = this.ticketSvc.validateTicket(qrResult.ticketId);
    steps.push(`Step 3: Ticket service validation — ${validation.valid ? 'PASSED' : `FAILED (${validation.reason})`}`);

    if (!validation.valid) {
      const reason = (validation.reason as RejectionReason) ?? 'NotFound';
      this.recordTrace(executionId, startTime, t0, 'error', { reason });
      return { status: 'Rejected', reason, ticketId: qrResult.ticketId, validatedAt, processingSteps: steps };
    }

    // Admit
    this.admittedSet.add(qrResult.ticketId);
    this.ticketSvc.markUsed(qrResult.ticketId);
    steps.push('Step 4: Entry ADMITTED — Welcome to the stadium!');

    this.recordTrace(executionId, startTime, t0, 'success', {
      ticketId: qrResult.ticketId,
      gate: validation.gate,
    });

    return {
      status: 'Admitted',
      ticketId: qrResult.ticketId,
      gate: validation.gate,
      seat: validation.seat,
      welcomeMessage: `Welcome! Proceed to ${validation.gate}. ${validation.seat}. Enjoy the match!`,
      validatedAt,
      processingSteps: steps,
    };
  }

  getTraces(): ServiceTrace[] {
    return [...this.traces];
  }

  private recordTrace(
    executionId: string,
    startTime: string,
    t0: number,
    status: ServiceTrace['status'],
    meta: Record<string, unknown>,
  ): void {
    this.traces.push({
      executionId,
      serviceName: 'EntryValidationEngine',
      startTime,
      endTime: new Date().toISOString(),
      latencyMs: Date.now() - t0,
      status,
      warnings: status === 'warning' ? ['Duplicate entry attempt'] : [],
      errors: status === 'error' ? [String(meta.reason)] : [],
      meta,
    });
  }
}

import { qrCodeService } from './qr';
import { ticketService } from './ticket';

export const entryValidationEngine = new EntryValidationEngine(qrCodeService, ticketService);
