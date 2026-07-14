import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { RequireAuth, AuthenticatedRequest } from '../middleware/auth';
import { memoryService, eventBus } from '../lib/di';
import { SessionContext } from '@fifa/ai';

export const usersRouter: Router = Router();

const UpdateFanMemorySchema = z.object({
  favoriteTeam: z.string().nullable().optional(),
  favoritePlayers: z.array(z.string()).nullable().optional(),
  language: z.string().optional(),
  budget: z.number().nullable().optional(),
  travelStyle: z.string().nullable().optional(),
  foodPreference: z.string().nullable().optional(),
  accessibilityNeeds: z.string().nullable().optional(),
  seatPreference: z.string().nullable().optional(),
  atmospherePreference: z.string().nullable().optional(),
  matchInterests: z.array(z.string()).nullable().optional(),
  groupType: z.string().nullable().optional(),
  pastTicketsSummary: z.string().nullable().optional(),
  travelHistorySummary: z.string().nullable().optional(),
});

// Deterministic Fan Segment Profile Derivation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deriveFanProfile(data: Record<string, any>): string {
  const budget = data.budget ?? 0;
  const seat = data.seatPreference ?? '';
  const group = data.groupType ?? '';

  if (budget >= 4000 || seat.toLowerCase() === 'vip') {
    return 'Premium Fan';
  }
  if (group.toLowerCase() === 'family' || group.toLowerCase() === 'kids') {
    return 'Family Supporter';
  }
  if (budget > 0 && budget < 1000) {
    return 'Budget Traveler';
  }
  return 'Stadium Explorer';
}

// Dynamic Fan DNA Completion Percentage Calculation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateCompletionPercentage(memory: Record<string, any>): number {
  const fields = [
    memory.favoriteTeam,
    memory.favoritePlayers,
    memory.language,
    memory.budget,
    memory.travelStyle,
    memory.foodPreference,
    memory.accessibilityNeeds,
    memory.seatPreference,
    memory.atmospherePreference,
    memory.matchInterests,
  ];

  const filledCount = fields.filter(
    (field) => field !== null && field !== undefined && String(field).trim() !== '',
  ).length;

  return Math.round((filledCount / fields.length) * 100);
}

// -------------------------------------------------------------
// PUT /api/v1/users/me/fan-memory (Save Fan DNA)
// -------------------------------------------------------------
usersRouter.put(
  '/me/fan-memory',
  RequireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User context is missing' },
        });
        return;
      }

      // Validate request details
      const parsedBody = UpdateFanMemorySchema.parse(req.body);

      // Derive profile segment
      const derivedProfile = deriveFanProfile(parsedBody);

      // Map values for Prisma update
      const updateData = {
        ...parsedBody,
        favoritePlayers: parsedBody.favoritePlayers
          ? JSON.stringify(parsedBody.favoritePlayers)
          : null,
        matchInterests: parsedBody.matchInterests
          ? JSON.stringify(parsedBody.matchInterests)
          : null,
        fanProfile: derivedProfile,
      };

      // 1. Save preferences via memoryService
      await memoryService.updateFanMemory(userId, updateData);

      // 2. Fetch full updated record
      const updatedMemory = await prisma.fanMemory.findUnique({
        where: { userId },
      });

      if (!updatedMemory) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Fan DNA profile not initialized' },
        });
        return;
      }

      // 3. Compute completion stats
      const completionPercentage = calculateCompletionPercentage(updatedMemory);

      // 4. Refresh Session Context snapshot cache (Refinement 3)
      const sessionContext = new SessionContext({
        currentUser: req.user ? { id: req.user.userId, email: '', role: req.user.role } : null,
        fanMemory: updatedMemory as unknown as Record<string, unknown>,
      });
      logger.info(
        { userId, profile: derivedProfile, completion: completionPercentage },
        'Refreshed Session Context snapshot cache',
      );

      // 5. Emit Events on EventBus (Refinement 4 & 5)
      eventBus.publish('FanMemoryUpdated', { userId, memory: updatedMemory });

      if (completionPercentage >= 70) {
        eventBus.publish('FanDNACompleted', {
          userId,
          fanProfile: derivedProfile,
          completionPercentage,
        });
      }

      res.status(200).json({
        success: true,
        data: {
          fanMemory: {
            ...updatedMemory,
            favoritePlayers: updatedMemory.favoritePlayers
              ? JSON.parse(updatedMemory.favoritePlayers as string)
              : [],
            matchInterests: updatedMemory.matchInterests
              ? JSON.parse(updatedMemory.matchInterests as string)
              : [],
          },
          completionPercentage,
          sessionCacheActive: !!sessionContext.fanMemory,
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Preferences save failed';
      logger.error(error, 'Failed to save Fan DNA preferences');
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: msg },
      });
    }
  },
);
