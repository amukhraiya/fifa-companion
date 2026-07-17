// ─────────────────────────────────────────────────────────────────────────────
// WalletAgent — handles wallet, tickets, QR, share, download intents
// Milestone 8 — IAgent implementation, DI-integrated
// ─────────────────────────────────────────────────────────────────────────────

import { IAgent, ISessionContext, IKernel, AgentResult } from '../../interfaces';
import { walletEngine } from '../../engine/wallet';
import { ticketService } from '../../engine/ticket';
import { entryValidationEngine } from '../../engine/validation';

export class WalletAgent implements IAgent {
  name = 'WalletAgent';
  version = '1.0.0';
  description = 'Manages digital wallet state, ticket lifecycle, QR generation, entry validation, share, and download operations.';
  capabilities = ['wallet', 'tickets', 'qr', 'download', 'share', 'entry-validation'];
  priority = 8;

  async execute(context: ISessionContext, _kernel: IKernel): Promise<AgentResult> {
    const userId = context.currentUser?.id ?? 'demo-user';

    try {
      const tickets = ticketService.getUserTickets(userId).length > 0
        ? ticketService.getUserTickets(userId)
        : ticketService.getUserTickets('demo-user');

      const walletState = walletEngine.getWalletState(userId, tickets);

      // Summarize validation traces
      const validationTraces = entryValidationEngine.getTraces();
      const admissions = validationTraces.filter((t) => t.status === 'success').length;
      const rejections = validationTraces.filter((t) => t.status === 'error').length;

      return {
        agentName: this.name,
        success: true,
        data: {
          wallet: walletState,
          summary: {
            upcomingCount: walletState.upcomingTickets.length,
            pastCount: walletState.pastTickets.length,
            downloadedCount: walletState.downloadedTickets.length,
            totalSpent: walletState.totalSpent,
            currency: walletState.currency,
            validationAdmissions: admissions,
            validationRejections: rejections,
          },
        },
        confidence: 0.99,
        reasoning: `Retrieved digital wallet for user ${userId}. ${walletState.upcomingTickets.length} upcoming, ${walletState.pastTickets.length} past tickets. Total spent: ${walletState.currency} ${walletState.totalSpent.toFixed(2)}.`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'WalletAgent execution failed';
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
