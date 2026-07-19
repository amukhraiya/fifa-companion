import { Router, Response } from 'express';
import { RequireAuth, AuthenticatedRequest } from '../middleware/auth';
import { kernel, eventBus } from '../lib/di';
import {
  memoryEngine,
  achievementEngine,
  fanStatsEngine,
  shareCardEngine,
  paymentService,
  LiveMatchEngine,
} from '@fifa/ai';
import { logger } from '../lib/logger';

export const postMatchRouter = Router();

postMatchRouter.use(RequireAuth);

/**
 * GET /api/v1/post-match/summary
 * Returns AI-generated post-match summary for Brazil vs Spain.
 */
postMatchRouter.get('/summary', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }

  try {
    const engine = new LiveMatchEngine('Brazil', 'Spain');
    engine.startMatch();
    for (let m = 1; m <= 90; m++) engine.tickTo(m);
    const finalState = engine.getState();

    const summary = memoryEngine.generatePostMatchSummary(finalState);
    eventBus.publish('MatchSummaryGenerated', { userId, result: summary.result, score: summary.score });

    res.status(200).json({ success: true, data: summary });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate match summary';
    logger.error({ err }, 'Error in post-match summary');
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/post-match/memories
 * Returns fan memory cards for the user.
 */
postMatchRouter.get('/memories', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }

  try {
    const memories = memoryEngine.getMemories('demo-user');
    eventBus.publish('MemoryCreated', { userId, count: memories.length });

    res.status(200).json({ success: true, data: { memories, count: memories.length } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve memories';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/post-match/timeline
 * Returns the personal AI memory timeline for the user.
 */
postMatchRouter.get('/timeline', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }

  try {
    const timeline = memoryEngine.generateTimeline(userId);
    res.status(200).json({ success: true, data: { timeline } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate timeline';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/post-match/achievements
 * Returns all unlocked and locked achievements for the user.
 */
postMatchRouter.get('/achievements', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }

  try {
    const stats = fanStatsEngine.computeStats(userId);
    const achievements = achievementEngine.evaluateAchievements(stats);
    const unlocked = achievements.filter((a: any) => a.unlocked);

    if (unlocked.length > 0) {
      eventBus.publish('AchievementUnlocked', { userId, count: unlocked.length, achievements: unlocked.map((a: any) => a.id) });
    }

    res.status(200).json({ success: true, data: { achievements, unlocked: unlocked.length, total: achievements.length } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load achievements';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/post-match/statistics
 * Returns fan statistics for the user.
 */
postMatchRouter.get('/statistics', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }

  try {
    const stats = fanStatsEngine.computeStats(userId);
    const achievements = achievementEngine.evaluateAchievements(stats);
    stats.achievementsUnlocked = achievements.filter((a: any) => a.unlocked).length;

    res.status(200).json({ success: true, data: stats });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to compute statistics';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/post-match/share-card
 * Generates a shareable match card from the most recent memory.
 */
postMatchRouter.get('/share-card', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }

  try {
    const memories = memoryEngine.getMemories('demo-user');
    if (memories.length === 0) {
      res.status(404).json({ success: false, error: 'No memories found — generate a memory first' });
      return;
    }

    const card = shareCardEngine.generateShareCard(memories[0]);
    res.status(200).json({ success: true, data: card });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate share card';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/post-match/payment/charge
 * Mock payment charge — Demo Mode only.
 * Body: { userId, amount, currency, method, description }
 */
postMatchRouter.post('/payment/charge', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }

  const { amount, currency, method, description } = req.body as {
    amount?: number;
    currency?: string;
    method?: string;
    description?: string;
  };

  try {
    const result = await paymentService.charge({
      userId,
      amount: amount ?? 350,
      currency: currency ?? 'USD',
      method: (method as 'creditCard') ?? 'creditCard',
      description: description ?? 'FIFA World Cup 2026 Ticket',
    });

    if (result.success) {
      eventBus.publish('PaymentCompleted', { userId, transactionId: result.transactionId, amount: result.amount });
      eventBus.publish('TicketGenerated', { userId, paymentId: result.transactionId });
    }

    res.status(result.success ? 200 : 402).json({ success: result.success, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Payment processing failed';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/post-match/traces
 * Returns observability traces for all post-match engines.
 */
postMatchRouter.get('/traces', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const traces = [
    ...memoryEngine.getTraces(),
    ...achievementEngine.getTraces(),
    ...fanStatsEngine.getTraces(),
    ...shareCardEngine.getTraces(),
    ...paymentService.getTraces(),
  ];
  res.status(200).json({ success: true, data: { traces } });
});

void kernel;
