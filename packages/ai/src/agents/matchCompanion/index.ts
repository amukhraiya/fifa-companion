import { IAgent, ISessionContext, IKernel, AgentResult } from '../../interfaces';
import { MatchEvent } from '../../engine/types';
import { LiveMatchEngine } from '../../engine/liveMatch';
import { CommentaryEngine } from '../../engine/commentary';
import { FanPulseEngine } from '../../engine/fanPulse';
import { MatchPredictorEngine } from '../../engine/matchPredictor';
import { StadiumNavigationOutput, EmergencyOutput, TranslationOutput, ReplayGuidanceOutput } from '../../tools';

export class MatchCompanionAgent implements IAgent {
  name = 'MatchCompanionAgent';
  version = '1.0.0';
  description = 'Coordinates live match scores, timelines, commentary feeds, translations, accessibility preferences, and emergency guidance.';
  capabilities = ['match-companion', 'commentary', 'navigation', 'emergency', 'translation', 'pulse', 'predictor', 'replay'];
  priority = 10;

  async execute(context: ISessionContext, kernel: IKernel): Promise<AgentResult> {
    const memory = context.fanMemory as Record<string, unknown> | null;
    const accessibilityNeeds = typeof memory?.accessibilityNeeds === 'string' ? memory.accessibilityNeeds : 'None';
    const language = context.language || 'English';

    try {
      // 1. Get Live Match telemetry state for minute 76
      const currentMinute = 76;
      const engine = new LiveMatchEngine('Brazil', 'Spain');
      engine.startMatch();

      const events: MatchEvent[] = [];
      const rawCommentary: string[] = [];

      for (let m = 1; m <= currentMinute; m++) {
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

      // 2. Fetch predictor and sentiment pulse telemetry
      const predictor = MatchPredictorEngine.getPrediction(currentMinute, stats.score);
      const pulse = FanPulseEngine.getPulseForMinute(currentMinute, stats.score);

      // 3. Fetch nearest emergency points
      const emergency = (await kernel.toolRegistry.executeTool('EmergencyCheck', {
        type: 'medical',
        stadiumId: 'stadium-100',
      })) as EmergencyOutput;

      // 4. Compute seat navigation path
      const isAccessible = accessibilityNeeds !== 'None';
      const navigation = (await kernel.toolRegistry.executeTool('StadiumNavigation', {
        currentPosition: 'Gate 3 East',
        destination: 'Seat Row 12 Block C',
        accessibilityMode: isAccessible,
      })) as StadiumNavigationOutput;

      // 5. Query camera replay options
      const replay = (await kernel.toolRegistry.executeTool('ReplayGuidance', {
        matchId: 'match-100',
        eventType: 'Goal',
      })) as ReplayGuidanceOutput;

      // 6. Localize announcement if user language is not English
      const targetLang = language as 'English' | 'Spanish' | 'Portuguese' | 'French' | 'Hindi' | 'Arabic';
      const announcement = 'Brazil are moving the ball efficiently across the midfield line.';
      const translation = (await kernel.toolRegistry.executeTool('TranslateText', {
        text: announcement,
        targetLanguage: targetLang,
      })) as TranslationOutput;

      // Translate the live commentaries array
      const localizedCommentary = await Promise.all(
        rawCommentary.slice(0, 5).map(async (text: string) => {
          if (targetLang === 'English') return text;
          const cleanText = text.replace(/\[Min \d+\] /, '');
          const minPrefix = text.match(/\[Min \d+\] /)?.[0] || '';
          const res = (await kernel.toolRegistry.executeTool('TranslateText', {
            text: cleanText,
            targetLanguage: targetLang,
          })) as TranslationOutput;
          return `${minPrefix}${res.translatedText}`;
        })
      );

      return {
        agentName: this.name,
        success: true,
        data: {
          currentMinute,
          stats,
          events,
          commentary: localizedCommentary,
          emergency,
          navigation,
          replay,
          predictor,
          pulse,
          announcement: translation.translatedText,
          accessibilityNeeds,
          language,
        },
        confidence: 0.97,
        reasoning: `Retrieved live matchday companion telemetry (Score: ${stats.score}, Home Win Prob: ${predictor.homeWinProbability}%, decibels: ${pulse.decibels}dB). Provided navigation path (elevator: ${isAccessible}) and translated announcements to ${language}.`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'MatchCompanion Agent execution failed';
      return {
        agentName: this.name,
        success: false,
        data: { error: msg },
        confidence: 0.0,
        reasoning: `Encountered execution error: ${msg}`,
      };
    }
  }
}
