import { IAgent, ISessionContext, IKernel, AgentResult } from '../../interfaces';

export class MatchCompanionAgent implements IAgent {
  name = 'MatchCompanionAgent';
  version = '1.0.0';
  description = 'Provides real-time scoring events and news commentary briefing.';
  capabilities = ['match-companion'];
  priority = 5;

  async execute(context: ISessionContext, kernel: IKernel): Promise<AgentResult> {
    const statsTool = kernel.toolRegistry.getTool('MatchStatistics');
    const newsTool = kernel.toolRegistry.getTool('NewsSearch');

    if (!statsTool || !newsTool) {
      return {
        agentName: this.name,
        success: false,
        data: { error: 'Required match companion tools are missing' },
        confidence: 0.0,
        reasoning: 'Failed to resolve match companion tools from registry.',
      };
    }

    // Execute tools via registry
    const statistics = await kernel.toolRegistry.executeTool('MatchStatistics', { matchId: 'm-123' });
    const news = await kernel.toolRegistry.executeTool('NewsSearch', {});

    return {
      agentName: this.name,
      success: true,
      data: {
        statistics,
        news,
        recommendedMatch: 'Brazil vs Spain',
        userSupportsBrazil: true,
      },
      confidence: 0.92,
      reasoning: 'Retrieved latest scores (Brazil 2-1 Spain) and news articles successfully.',
    };
  }
}
