/**
 * Event Bus (ARCHITECTURE_V2.md §6). In-process EventEmitter for the MVP,
 * intentionally behind an interface narrow enough to swap for a real queue
 * (BullMQ/SQS) later without touching any publisher or subscriber code.
 */
import { EventEmitter } from 'node:events';

export type DomainEventType =
  | 'BookingCompleted'
  | 'PaymentFailed'
  | 'TicketGenerated'
  | 'TravelPlanGenerated'
  | 'SeatLockExpired';

export interface DomainEvent<TPayload = Record<string, unknown>> {
  type: DomainEventType;
  userId: string;
  payload: TPayload;
  occurredAt: Date;
}

export interface EventDb {
  event: {
    create(args: { data: { type: string; userId: string; payload: unknown } }): Promise<unknown>;
  };
}

export class EventBus {
  private emitter = new EventEmitter();

  constructor(private db?: EventDb) {
    // Cap listeners generously — many independent subscribers is expected by design.
    this.emitter.setMaxListeners(50);
  }

  on<T = Record<string, unknown>>(type: DomainEventType, handler: (event: DomainEvent<T>) => void | Promise<void>) {
    this.emitter.on(type, (event: DomainEvent<T>) => {
      // Each handler is isolated — one throwing must never block another or the publisher.
      Promise.resolve(handler(event)).catch((err) =>
        console.error(`[EventBus] handler for "${type}" failed`, err),
      );
    });
  }

  async emit(type: DomainEventType, userId: string, payload: Record<string, unknown>): Promise<void> {
    const event: DomainEvent = { type, userId, payload, occurredAt: new Date() };
    this.emitter.emit(type, event);
    if (this.db) {
      try {
        await this.db.event.create({ data: { type, userId, payload } });
      } catch (err) {
        console.error('[EventBus] failed to persist event', err);
      }
    }
  }
}

/**
 * Wires the two example flows from the spec. ANTIGRAVITY: call this once at
 * app startup (e.g. in apps/api/src/lib/masterAgent.instance.ts) after the
 * real tool implementations from T016-T018 exist to plug into the TODOs below.
 */
export function registerCoreEventFlows(bus: EventBus) {
  bus.on('BookingCompleted', async (event) => {
    // TODO(T027): generate ticket → bus.emit('TicketGenerated', event.userId, {...})
    // TODO(T029): offer a travel plan → bus.emit('TravelPlanGenerated', event.userId, {...})
    // TODO(T087): send notification via NotificationTool
    console.log('[EventBus] BookingCompleted', event.payload);
  });

  bus.on('PaymentFailed', async (event) => {
    // TODO(T024): release the seat lock referenced in event.payload.lockId
    // TODO(T087): notify the user of the failed payment
    console.log('[EventBus] PaymentFailed', event.payload);
  });
}
