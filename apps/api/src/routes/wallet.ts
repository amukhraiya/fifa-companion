import { Router, Response } from 'express';
import { RequireAuth, AuthenticatedRequest } from '../middleware/auth';
import { kernel, eventBus } from '../lib/di';
import {
  walletEngine,
  ticketService,
  entryValidationEngine,
  qrCodeService,
} from '@fifa/ai';
import { logger } from '../lib/logger';

export const walletRouter = Router();

walletRouter.use(RequireAuth);

/**
 * GET /api/v1/wallet
 * Returns full digital wallet state for the authenticated user.
 */
walletRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }

  try {
    // Resolve demo user tickets (seed tickets always use 'demo-user')
    const tickets = ticketService.getUserTickets(userId).length > 0
      ? ticketService.getUserTickets(userId)
      : ticketService.getUserTickets('demo-user');

    const walletState = walletEngine.getWalletState(userId, tickets);
    eventBus.publish('WalletUpdated', { userId });

    res.status(200).json({ success: true, data: walletState });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load wallet';
    logger.error({ err }, 'Error loading wallet');
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/wallet/tickets
 * Returns all tickets for the user with full payload.
 */
walletRouter.get('/tickets', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }

  try {
    const tickets = ticketService.getUserTickets(userId).length > 0
      ? ticketService.getUserTickets(userId)
      : ticketService.getUserTickets('demo-user');

    res.status(200).json({ success: true, data: { tickets, count: tickets.length } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve tickets';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/wallet/validate
 * Entry validation — scans QR payload and validates ticket.
 * Body: { qrPayload: string, signature: string }
 */
walletRouter.post('/validate', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }

  const { qrPayload, signature } = req.body as { qrPayload?: string; signature?: string };

  if (!qrPayload || !signature) {
    res.status(400).json({ success: false, error: 'qrPayload and signature are required' });
    return;
  }

  try {
    const result = entryValidationEngine.validateEntry(qrPayload, signature);
    eventBus.publish(
      result.status === 'Admitted' ? 'TicketValidated' : 'TicketRejected',
      { userId, ...result }
    );

    res.status(200).json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Validation failed';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/wallet/share/:id
 * Shares a ticket and returns shareable URL.
 */
walletRouter.post('/share/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }

  const { id } = req.params;

  try {
    const result = ticketService.shareTicket(id);
    eventBus.publish('TicketShared', { userId, ticketId: id, shareUrl: result.shareUrl });

    res.status(200).json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to share ticket';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/wallet/download/:id
 * Generates download payload for a ticket (pkpass format).
 */
walletRouter.post('/download/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }

  const { id } = req.params;

  try {
    const result = ticketService.downloadTicket(id);
    eventBus.publish('WalletUpdated', { userId, action: 'download', ticketId: id });

    res.status(200).json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate download';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/wallet/qr/:id
 * Returns QR generation data for a specific ticket.
 */
walletRouter.get('/qr/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }

  const { id } = req.params;

  try {
    const ticket = ticketService.getTicket(id);
    if (!ticket) {
      res.status(404).json({ success: false, error: 'Ticket not found' });
      return;
    }

    const qr = qrCodeService.generateQR({
      ticketId: ticket.ticketId,
      userId: ticket.userId,
      matchId: ticket.matchId,
      seatId: ticket.seatId,
      signature: ticket.signature,
      issuedAt: ticket.timestamp,
      expiresAt: ticket.matchDate,
    });

    res.status(200).json({ success: true, data: { ticketId: id, ...qr } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate QR';
    res.status(500).json({ success: false, error: msg });
  }
});

// Expose observability traces for Command Center
walletRouter.get('/traces', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const traces = [
    ...walletEngine.getTraces(),
    ...entryValidationEngine.getTraces(),
    ...qrCodeService.getTraces(),
  ];
  res.status(200).json({ success: true, data: { traces } });
});

// Suppress unused kernel warning — kernel used for DI context
void kernel;
