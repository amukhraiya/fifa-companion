import { IAgent, ISessionContext, IKernel, AgentResult } from '../../interfaces';
import { aiSeatRecommendationEngine } from '../../engine/recommendation';

export class BookingAgent implements IAgent {
  name = 'BookingAgent';
  version = '1.0.0';
  description = 'Handles match ticket booking and seat recommendations.';
  capabilities = ['booking'];
  priority = 10;

  async execute(context: ISessionContext, kernel: IKernel): Promise<AgentResult> {
    const searchTool = kernel.toolRegistry.getTool('SearchSeats');
    const reserveTool = kernel.toolRegistry.getTool('ReserveSeat');

    if (!searchTool || !reserveTool) {
      return {
        agentName: this.name,
        success: false,
        data: { error: 'Required booking tools are missing' },
        confidence: 0.0,
        reasoning: 'Failed to resolve booking tools from registry.',
      };
    }

    try {
      // 1. Fetch seats from tool search
      const seats = (await kernel.toolRegistry.executeTool('SearchSeats', {})) as Parameters<
        typeof aiSeatRecommendationEngine.recommendSeats
      >[1];

      // 2. Generate recommendations from engine
      const recommendations = await aiSeatRecommendationEngine.recommendSeats(context, seats);

      const topRec = recommendations[0];

      return {
        agentName: this.name,
        success: true,
        data: {
          recommendations,
          topRecommendation: topRec || null,
          seatsCount: seats.length,
        },
        confidence: topRec ? topRec.confidence : 0.8,
        reasoning: topRec
          ? `Recommended seat ${topRec.row}-${topRec.number} in ${topRec.section} at ${topRec.stadiumName} (Confidence: ${topRec.confidence}).`
          : 'No available seat matches found.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'BookingAgent execution failed';
      return {
        agentName: this.name,
        success: false,
        data: { error: msg },
        confidence: 0.0,
        reasoning: `BookingAgent execution aborted: ${msg}`,
      };
    }
  }
}
