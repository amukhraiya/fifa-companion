// ─────────────────────────────────────────────────────────────────────────────
// PostMatchAgent — memories, achievements, statistics, summary, share card
// Milestone 8 — IAgent implementation, DI-integrated
// ─────────────────────────────────────────────────────────────────────────────

import { IAgent, ISessionContext, IKernel, AgentResult } from '../../interfaces';
import { memoryEngine } from '../../engine/memory';
import { achievementEngine } from '../../engine/achievement';
import { fanStatsEngine } from '../../engine/fanStats';
import { shareCardEngine } from '../../engine/shareCard';
import { LiveMatchEngine } from '../../engine/liveMatch';

export class PostMatchAgent implements IAgent {
  name = 'PostMatchAgent';
  version = '1.0.0';
  description = 'Generates post-match summaries, fan memories, achievements, personal statistics, AI timelines, and shareable match cards.';
  capabilities = ['post-match', 'memories', 'achievements', 'statistics', 'timeline', 'summary', 'share-card'];
  priority = 9;

  async execute(context: ISessionContext, _kernel: IKernel): Promise<AgentResult> {
    const userId = context.currentUser?.id ?? 'demo-user';

    try {
      // Fan statistics
      const stats = fanStatsEngine.computeStats(userId);

      // Achievements
      const achievements = achievementEngine.evaluateAchievements(stats);
      stats.achievementsUnlocked = achievements.filter((a) => a.unlocked).length;

      // Memories
      const memories = memoryEngine.getMemories('demo-user');

      // Timeline
      const timeline = memoryEngine.generateTimeline(userId);

      // Post-match summary from live engine at minute 90
      const engine = new LiveMatchEngine('Brazil', 'Spain');
      engine.startMatch();
      for (let m = 1; m <= 90; m++) engine.tickTo(m);
      const finalState = engine.getState();
      const postMatchSummary = memoryEngine.generatePostMatchSummary(finalState);

      // Share card from first memory
      const shareCard = memories.length > 0
        ? shareCardEngine.generateShareCard(memories[0])
        : null;

      return {
        agentName: this.name,
        success: true,
        data: {
          postMatchSummary,
          memories,
          timeline,
          achievements,
          stats,
          shareCard,
        },
        confidence: 0.98,
        reasoning: `PostMatch data generated for ${userId}. ${memories.length} memories, ${achievements.filter((a) => a.unlocked).length} achievements unlocked, prediction accuracy: ${stats.predictionAccuracy}%.`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'PostMatchAgent execution failed';
      return {
        agentName: this.name,
        success: false,
        data: { error: msg },
        confidence: 0.0,
        reasoning: msg,
      };
    }
  }
}
