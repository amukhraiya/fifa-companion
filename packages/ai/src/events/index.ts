import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { IEventBus } from '../interfaces';

export class EventBus implements IEventBus {
  private emitter = new EventEmitter();

  publish(event: string, payload: unknown): void {
    // Publish asynchronously using setImmediate to avoid blocking the main execution path
    setImmediate(() => {
      this.emitter.emit(event, payload);
    });
  }

  subscribe(event: string, callback: (payload: unknown) => void): void {
    this.emitter.on(event, callback);
  }

  unsubscribe(event: string, callback: (payload: unknown) => void): void {
    this.emitter.off(event, callback);
  }
}

// -------------------------------------------------------------
// Event Logger Subscriber
// -------------------------------------------------------------
export class EventLogger {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  register(eventBus: IEventBus): void {
    const eventsToLog = [
      'UserLoggedIn',
      'FanMemoryUpdated',
      'BookingCompleted',
      'PaymentCompleted',
      'TravelGenerated',
      'MatchStarted',
    ];

    for (const event of eventsToLog) {
      eventBus.subscribe(event, async (payload: unknown) => {
        try {
          const typedPayload = payload as { userId?: string } | null | undefined;
          const userId = typedPayload?.userId || null;
          
          await this.prisma?.event?.create({
            data: {
              userId,
              eventType: event,
              payload: (payload as any) || {},
            },
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`[EventLogger ERROR] Failed to record event ${event}:`, error);
        }
      });
    }
  }
}
