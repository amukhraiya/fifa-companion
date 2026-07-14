import { Router, Response } from 'express';
import { z } from 'zod';
import { RequireAuth, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/db';
import { reservationService } from '../services/reservation.service';
import { SessionContext, aiSeatRecommendationEngine, matchDiscoveryEngine } from '@fifa/ai';

export const bookingRouter = Router();

// Validation Schemas
const LockSeatSchema = z.object({
  seatId: z.string(),
});

const ConfirmBookingSchema = z.object({
  seatId: z.string(),
});

// -------------------------------------------------------------
// GET /api/v1/booking/matches
// -------------------------------------------------------------
bookingRouter.get('/matches', async (_req, res: Response): Promise<void> => {
  try {
    const matches = await prisma.match.findMany({
      include: {
        venue: {
          include: { city: true },
        },
        teams: {
          include: { team: true },
        },
      },
    });

    res.status(200).json({ success: true, data: matches });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Matches fetch failed';
    res.status(400).json({ success: false, error: { message: msg } });
  }
});

// -------------------------------------------------------------
// GET /api/v1/booking/match-discovery
// -------------------------------------------------------------
bookingRouter.get(
  '/match-discovery',
  RequireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      // Load User FanMemory snapshot
      const fanMemory = await prisma.fanMemory.findUnique({
        where: { userId },
      });

      const context = new SessionContext({
        currentUser: { id: userId, email: '', role: 'Fan' },
        fanMemory: fanMemory || undefined,
      });

      const matches = await prisma.match.findMany({
        include: {
          venue: true,
          teams: {
            include: { team: true },
          },
        },
      });

      const discovered = await matchDiscoveryEngine.discoverMatches(context, matches);
      res.status(200).json({ success: true, data: discovered });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Match discovery failed';
      res.status(400).json({ success: false, error: { message: msg } });
    }
  },
);

// -------------------------------------------------------------
// GET /api/v1/booking/recommendations
// -------------------------------------------------------------
bookingRouter.get(
  '/recommendations',
  RequireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      // Load User FanMemory
      const fanMemory = await prisma.fanMemory.findUnique({
        where: { userId },
      });

      const context = new SessionContext({
        currentUser: { id: userId, email: '', role: 'Fan' },
        fanMemory: fanMemory || undefined,
      });

      // Load all available seats in database
      const seats = await prisma.seat.findMany({
        include: {
          match: {
            include: {
              venue: true,
              teams: {
                include: { team: true },
              },
            },
          },
        },
      });

      const recommendations = await aiSeatRecommendationEngine.recommendSeats(context, seats);
      res.status(200).json({ success: true, data: recommendations });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Seating recommendation failed';
      res.status(400).json({ success: false, error: { message: msg } });
    }
  },
);

// -------------------------------------------------------------
// POST /api/v1/booking/lock
// -------------------------------------------------------------
bookingRouter.post(
  '/lock',
  RequireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const parsed = LockSeatSchema.parse(req.body);
      const result = await reservationService.lockSeat(userId, parsed.seatId);

      if (!result.success) {
        res.status(409).json({ success: false, error: { message: result.error } });
        return;
      }

      res.status(200).json({ success: true, data: result.lock });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lock failed';
      res.status(400).json({ success: false, error: { message: msg } });
    }
  },
);

// -------------------------------------------------------------
// POST /api/v1/booking/confirm
// -------------------------------------------------------------
bookingRouter.post(
  '/confirm',
  RequireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const parsed = ConfirmBookingSchema.parse(req.body);
      const result = await reservationService.confirmBooking(userId, parsed.seatId);

      if (!result.success) {
        res.status(400).json({ success: false, error: { message: result.error } });
        return;
      }

      res.status(200).json({ success: true, data: result.ticket });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Confirmation failed';
      res.status(400).json({ success: false, error: { message: msg } });
    }
  },
);

// -------------------------------------------------------------
// POST /api/v1/booking/release
// -------------------------------------------------------------
bookingRouter.post(
  '/release',
  RequireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const parsed = LockSeatSchema.parse(req.body);
      await reservationService.releaseSeat(userId, parsed.seatId);

      res.status(200).json({ success: true, message: 'Seat lock released' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Release failed';
      res.status(400).json({ success: false, error: { message: msg } });
    }
  },
);

// -------------------------------------------------------------
// GET /api/v1/booking/seats/:matchId
// -------------------------------------------------------------
bookingRouter.get('/seats/:matchId', async (req, res: Response): Promise<void> => {
  try {
    const seats = await prisma.seat.findMany({
      where: { matchId: req.params.matchId },
    });

    res.status(200).json({ success: true, data: seats });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Seats fetch failed';
    res.status(400).json({ success: false, error: { message: msg } });
  }
});
