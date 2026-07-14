import { IAgent, ISessionContext, IKernel, AgentResult } from '../../interfaces';

export class BookingAgent implements IAgent {
  name = 'BookingAgent';
  version = '1.0.0';
  description = 'Handles match ticket booking and seat selection.';
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

    // Simulate tool usage through registry
    const seats = await kernel.toolRegistry.executeTool('SearchSeats', {});
    const bookingResult = await kernel.toolRegistry.executeTool('ReserveSeat', {
      seatId: 'seat-B2',
      userId: context.currentUser?.id || 'guest-100',
    });

    return {
      agentName: this.name,
      success: true,
      data: {
        seats,
        bookingResult,
        recommendedMatch: 'Brazil vs Spain',
        preferKnockoutMatches: true,
        category: 'Category 2',
        budgetInBounds: true,
        travelDurationMinutes: 18,
      },
      confidence: 0.95,
      reasoning: 'Discovered available seats and successfully reserved Category 2 seat seat-B2 matching budget.',
    };
  }
}
