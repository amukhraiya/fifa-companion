import { Router, Response } from 'express';
import { RequireAuth, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/db';
import { kernel, eventBus } from '../lib/di';
import {
  LiveMatchEngine,
  CommentaryEngine,
  FanPulseEngine,
  MatchPredictorEngine,
  MatchEvent,
  StadiumNavigationOutput,
  EmergencyOutput,
  TranslationOutput,
  ReplayGuidanceOutput,
} from '@fifa/ai';
import { logger } from '../lib/logger';

export const matchdayRouter = Router();

matchdayRouter.use(RequireAuth);

/**
 * GET /api/v1/match-day/state
 * Returns simulated match minutes, possession, commentary, and alerts.
 */
matchdayRouter.get('/state', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const minuteParam = parseInt(req.query.minute as string) || 76;
  const targetMinute = Math.min(Math.max(minuteParam, 1), 90);

  try {
    const memory = await prisma.fanMemory.findUnique({ where: { userId } });
    const language = (memory?.language as 'English' | 'Spanish' | 'Portuguese' | 'French' | 'Hindi' | 'Arabic') || 'English';

    // 1. Run LiveMatchEngine to target minute — single execution pipeline
    const engine = new LiveMatchEngine('Brazil', 'Spain');
    engine.startMatch();

    const events: MatchEvent[] = [];
    const rawCommentary: string[] = [];

    for (let m = 1; m <= targetMinute; m++) {
      const ev = engine.tickTo(m);
      if (ev) {
        events.push(ev);
        const comm = CommentaryEngine.generateCommentary(ev, engine.getState());
        rawCommentary.push(`[Min ${m}] ${comm.text}`);
      }
    }

    const finalState = engine.getState();
    const stats = {
      score: `${finalState.homeTeam} ${finalState.score.home} - ${finalState.score.away} ${finalState.awayTeam}`,
      possession: `${finalState.statistics.possessionHome}% - ${finalState.statistics.possessionAway}%`,
      shotsHome: finalState.statistics.shotsHome,
      shotsAway: finalState.statistics.shotsAway,
      cornersHome: finalState.statistics.cornersHome,
      cornersAway: finalState.statistics.cornersAway,
      yellowCardsHome: finalState.statistics.yellowCardsHome,
      yellowCardsAway: finalState.statistics.yellowCardsAway,
      redCardsHome: finalState.statistics.redCardsHome,
      redCardsAway: finalState.statistics.redCardsAway,
      expectedGoalsHome: finalState.statistics.expectedGoalsHome,
      expectedGoalsAway: finalState.statistics.expectedGoalsAway,
      momentum: finalState.momentum.value,
      pressureHome: finalState.momentum.pressureHome,
      pressureAway: finalState.momentum.pressureAway,
      fanEnergy: finalState.momentum.fanEnergy,
    };

    // 3. Localize Commentary Announcements based on user language settings
    const localizedCommentary = await Promise.all(
      rawCommentary.slice(0, 8).map(async (text) => {
        if (language === 'English') return text;
        const cleanText = text.replace(/\[Min \d+\] /, '');
        const minPrefix = text.match(/\[Min \d+\] /)?.[0] || '';
        const translation = (await kernel.toolRegistry.executeTool('TranslateText', {
          text: cleanText,
          targetLanguage: language,
        })) as TranslationOutput;
        return `${minPrefix}${translation.translatedText}`;
      })
    );

    // 4. Generate dynamic AI-enriched insights in Notifications
    const notifications = [];
    if (targetMinute >= 1) {
      notifications.push({
        title: 'Kickoff Started',
        detail: 'Brazil vs Spain kickoff has commenced. AI Insight: Expect high tactical pressing early on both wings as teams establish central blocks.',
      });
    }
    if (targetMinute >= 28) {
      notifications.push({
        title: 'GOAL SCORED!',
        detail: 'Neymar Jr fires Brazil into the lead! (1 - 0). AI Insight: Brazil exploits space behind Spain\'s high defensive line. Transition speed is key.',
      });
      eventBus.publish('GoalScored', { userId, team: 'Brazil', score: '1-0' });
    }
    if (targetMinute >= 74) {
      notifications.push({
        title: 'GOAL SCORED!',
        detail: 'Morata converts penalty for Spain! (1 - 1). AI Insight: Momentum shifts back to Spain. Brazil needs to reinforce block coverage in outer areas.',
      });
      eventBus.publish('GoalScored', { userId, team: 'Spain', score: '1-1' });
    }
    if (targetMinute >= 82) {
      notifications.push({
        title: 'GOAL SCORED!',
        detail: 'Vinicius Jr scores! Brazil lead 2 - 1! AI Insight: Spain pressing left them vulnerable. Brazil counter-attacks prove lethal.',
      });
      eventBus.publish('GoalScored', { userId, team: 'Brazil', score: '2-1' });
    }
    if (targetMinute >= 88) {
      notifications.push({
        title: 'RED CARD!',
        detail: 'Dani Carvajal sent off after second yellow. AI Insight: Spain shifts to 4-4-1 block, lowering threat probability in Morata\'s zones.',
      });
      eventBus.publish('RedCard', { userId, player: 'Dani Carvajal' });
    }

    // 5. Build Decision Timeline (Referee, VAR, Coach)
    const decisionTimeline = [];
    if (targetMinute >= 12) {
      decisionTimeline.push({
        minute: 12,
        authority: 'Referee Decision',
        detail: 'Yellow card Rodri. Correct tactical booking choice to stop Neymar Jr counter-break.',
      });
    }
    if (targetMinute >= 61) {
      decisionTimeline.push({
        minute: 61,
        authority: 'Coaching Change',
        detail: 'Spain sub: Dani Olmo replaces Pedri to enhance interior ball progression.',
      });
    }
    if (targetMinute >= 72) {
      decisionTimeline.push({
        minute: 72,
        authority: 'VAR Review',
        detail: 'Penalty awarded for Brazil handball. Video verification confirmed arm was extended.',
      });
    }
    if (targetMinute >= 88) {
      decisionTimeline.push({
        minute: 88,
        authority: 'Referee Decision',
        detail: 'Red card Dani Carvajal for blocking goalscoring transition opportunity.',
      });
    }

    // 6. Build AI Match Summary at Full Time (Minute 90)
    let matchSummary = '';
    if (targetMinute === 90) {
      matchSummary = 'Full Time Summary: A classic tactical battle where Brazil\'s transition counters outpaced Spain\'s possession play. Dani Carvajal\'s red card in the 88th minute sealed Spain\'s fate, allowing Brazil to defend their 2-1 lead successfully.';
      eventBus.publish('MatchFinished', { userId, score: '2-1', winner: 'Brazil' });
    }

    // 7. Get match predictor and fan pulse telemetry
    const predictor = MatchPredictorEngine.getPrediction(targetMinute, stats.score);
    const pulse = FanPulseEngine.getPulseForMinute(targetMinute, stats.score);

    res.status(200).json({
      success: true,
      data: {
        stats,
        events: events.filter((e) => e.minute <= targetMinute),
        commentary: localizedCommentary,
        notifications,
        decisionTimeline,
        matchSummary,
        predictor,
        pulse,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query matchday state';
    logger.error({ err }, 'Error in matchday state');
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/match-day/preferences
 * Saves accessibility settings and notification rules.
 */
matchdayRouter.post('/preferences', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { accessibilityNeeds, language } = req.body;

  try {
    const memory = await prisma.fanMemory.upsert({
      where: { userId },
      update: {
        accessibilityNeeds,
        language: language || 'en',
      },
      create: {
        userId,
        accessibilityNeeds,
        language: language || 'en',
      },
    });

    res.status(200).json({ success: true, data: memory });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save preferences';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/match-day/navigate
 */
matchdayRouter.post('/navigate', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { from, to, accessibilityMode } = req.body;

  try {
    eventBus.publish('NavigationStarted', { userId, from, to });
    const result = (await kernel.toolRegistry.executeTool('StadiumNavigation', {
      currentPosition: from || 'Gate 3 East',
      destination: to || 'Section 112',
      accessibilityMode: accessibilityMode || false,
    })) as StadiumNavigationOutput;

    eventBus.publish('NavigationCompleted', { userId, from, to, result });
    res.status(200).json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to map stadium navigation';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/match-day/emergency
 */
matchdayRouter.post('/emergency', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { type } = req.body;

  try {
    eventBus.publish('EmergencyRequested', { userId, type });
    const result = (await kernel.toolRegistry.executeTool('EmergencyCheck', {
      type: type || 'medical',
      stadiumId: 'stadium-100',
    })) as EmergencyOutput;

    res.status(200).json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to invoke emergency safety dispatch';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/match-day/translate
 */
matchdayRouter.post('/translate', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { text, targetLanguage } = req.body;

  try {
    eventBus.publish('TranslationRequested', { userId, targetLanguage });
    const result = (await kernel.toolRegistry.executeTool('TranslateText', {
      text,
      targetLanguage: targetLanguage || 'Spanish',
    })) as TranslationOutput;

    res.status(200).json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to run translation';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/match-day/replay
 */
matchdayRouter.post('/replay', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { eventType } = req.body;

  try {
    const result = (await kernel.toolRegistry.executeTool('ReplayGuidance', {
      matchId: 'match-100',
      eventType: eventType || 'Goal',
    })) as ReplayGuidanceOutput;

    res.status(200).json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve camera replay data';
    res.status(500).json({ success: false, error: msg });
  }
});
