// ─────────────────────────────────────────────────────────────────────────────
// Payment Engine — IPaymentProvider / MockPaymentProvider / PaymentService
// Milestone 8 — Strategy Pattern, DI-ready, Demo Mode only
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentMethod =
  | 'creditCard'
  | 'debitCard'
  | 'upi'
  | 'googlePay'
  | 'applePay'
  | 'wallet';

export interface PaymentInput {
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  description: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  timestamp: string;
  providerRef: string;
  receiptUrl: string;
  error?: string;
}

export interface ServiceTrace {
  executionId: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  latencyMs: number;
  status: 'success' | 'error' | 'warning';
  warnings: string[];
  errors: string[];
  meta?: Record<string, unknown>;
}

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IPaymentProvider {
  readonly providerName: string;
  charge(input: PaymentInput): Promise<PaymentResult>;
}

// ─── Mock Provider ────────────────────────────────────────────────────────────

export class MockPaymentProvider implements IPaymentProvider {
  readonly providerName = 'MockPaymentProvider';

  async charge(input: PaymentInput): Promise<PaymentResult> {
    // Simulate async processing
    await Promise.resolve();
    const transactionId = `mock-txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return {
      success: true,
      transactionId,
      method: input.method,
      amount: input.amount,
      currency: input.currency,
      timestamp: new Date().toISOString(),
      providerRef: `MOCK-REF-${transactionId.toUpperCase()}`,
      receiptUrl: `https://mock-receipts.fifa-companion.dev/${transactionId}`,
    };
  }
}

// ─── Stripe Provider (Architecture Stub — not called in demo) ─────────────────

export class StripePaymentProvider implements IPaymentProvider {
  readonly providerName = 'StripePaymentProvider';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async charge(_input: PaymentInput): Promise<PaymentResult> {
    throw new Error(
      'StripePaymentProvider is an architecture stub. Use MockPaymentProvider in Demo Mode.'
    );
  }
}

// ─── PaymentService (Strategy wrapper) ────────────────────────────────────────

export class PaymentService {
  private traces: ServiceTrace[] = [];

  constructor(private readonly provider: IPaymentProvider) {}

  async charge(input: PaymentInput): Promise<PaymentResult> {
    const executionId = `pay-${Date.now()}`;
    const startTime = new Date().toISOString();
    const t0 = Date.now();
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      if (input.amount <= 0) warnings.push('Amount is zero or negative — demo passthrough.');
      const result = await this.provider.charge(input);
      const latencyMs = Date.now() - t0;

      this.traces.push({
        executionId,
        serviceName: 'PaymentService',
        startTime,
        endTime: new Date().toISOString(),
        latencyMs,
        status: result.success ? 'success' : 'error',
        warnings,
        errors,
        meta: { transactionId: result.transactionId, method: input.method, amount: input.amount },
      });

      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      errors.push(msg);
      const latencyMs = Date.now() - t0;
      this.traces.push({
        executionId,
        serviceName: 'PaymentService',
        startTime,
        endTime: new Date().toISOString(),
        latencyMs,
        status: 'error',
        warnings,
        errors,
      });
      return {
        success: false,
        transactionId: '',
        method: input.method,
        amount: input.amount,
        currency: input.currency,
        timestamp: new Date().toISOString(),
        providerRef: '',
        receiptUrl: '',
        error: msg,
      };
    }
  }

  getTraces(): ServiceTrace[] {
    return [...this.traces];
  }

  getLatestTrace(): ServiceTrace | null {
    return this.traces[this.traces.length - 1] ?? null;
  }
}

// ─── Singleton for Demo Mode ──────────────────────────────────────────────────

export const paymentService = new PaymentService(new MockPaymentProvider());
