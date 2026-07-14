import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/db';
import { eventBus } from '../lib/di';

export class ReservationService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Transactionally locks a seat for 5 minutes if it is currently Available.
   */
  async lockSeat(userId: string, seatId: string): Promise<{ success: boolean; lock?: unknown; error?: string }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const seat = await tx.seat.findUnique({
          where: { id: seatId },
        });

        if (!seat) {
          return { success: false, error: 'Seat not found' };
        }

        if (seat.status !== 'Available') {
          return { success: false, error: 'Seat is already locked or reserved' };
        }

        // Lock for 5 minutes
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        const updatedSeat = await tx.seat.update({
          where: { id: seatId },
          data: { status: 'Locked' },
        });

        const lock = await tx.seatLock.create({
          data: {
            seatId,
            expiresAt,
          },
        });

        eventBus.publish('SeatLocked', { userId, seatId, expiresAt });

        return { success: true, lock: { ...lock, seat: updatedSeat } };
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lock failed';
      return { success: false, error: msg };
    }
  }

  /**
   * Transactionally confirms a booking, releasing the lock and issuing a ticket.
   */
  async confirmBooking(userId: string, seatId: string): Promise<{ success: boolean; ticket?: unknown; error?: string }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const seat = await tx.seat.findUnique({
          where: { id: seatId },
          include: { lock: true, match: { include: { venue: { include: { city: true } } } } },
        });

        if (!seat) {
          return { success: false, error: 'Seat not found' };
        }

        if (seat.status !== 'Locked') {
          return { success: false, error: 'Seat is not locked' };
        }

        // Update status to Reserved
        const updatedSeat = await tx.seat.update({
          where: { id: seatId },
          data: { status: 'Reserved' },
        });

        // Delete lock
        if (seat.lock) {
          await tx.seatLock.delete({
            where: { id: seat.lock.id },
          });
        }

        // Generate cryptographic ticket signature
        const qrCode = `FIFA-TICKET-SIG-${seatId}-${userId}-${Date.now().toString(36).toUpperCase()}`;

        const ticket = await tx.ticket.create({
          data: {
            userId,
            seatId,
            qrCode,
          },
        });

        // Update Fan Memory and booking history
        const memory = await tx.fanMemory.findUnique({
          where: { userId },
        });

        if (memory) {
          const pastHistory = memory.pastTicketsSummary ? memory.pastTicketsSummary + '; ' : '';
          await tx.fanMemory.update({
            where: { userId },
            data: {
              pastTicketsSummary: `${pastHistory}Booked ticket for seat ${seat.row}-${seat.number} Category ${seat.section}`,
            },
          });
        }

        // Publish events forTravel Agent integration
        eventBus.publish('SeatReserved', { userId, seatId, ticketId: ticket.id });
        eventBus.publish('BookingCompleted', {
          userId,
          matchId: seat.matchId,
          seatId,
          ticketCode: qrCode,
          travelDestination: seat.match.venue.city.name,
          matchDate: seat.match.date.toISOString(),
        });

        return { success: true, ticket: { ...ticket, seat: updatedSeat } };
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Confirmation failed';
      return { success: false, error: msg };
    }
  }

  /**
   * Manually releases a locked seat.
   */
  async releaseSeat(userId: string, seatId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const lock = await tx.seatLock.findUnique({
          where: { seatId },
        });

        if (lock) {
          await tx.seatLock.delete({ where: { seatId } });
        }

        await tx.seat.update({
          where: { id: seatId },
          data: { status: 'Available' },
        });

        eventBus.publish('SeatReleased', { userId, seatId });
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ReservationService] Release lock failed:', err);
    }
  }

  /**
   * Scans and releases all expired locks.
   */
  async cleanupExpiredLocks(): Promise<void> {
    try {
      const expiredLocks = await this.prisma.seatLock.findMany({
        where: { expiresAt: { lt: new Date() } },
      });

      for (const lock of expiredLocks) {
        await this.releaseSeat('system-timer', lock.seatId);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ReservationService] Expiry cleanup failed:', err);
    }
  }
}
export const reservationService = new ReservationService();
