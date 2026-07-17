import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Response, NextFunction } from 'express';
import request from 'supertest';
import { walletRouter } from './wallet';
import { AuthenticatedRequest } from '../middleware/auth';
import { eventBus } from '../lib/di';
import { ticketService } from '@fifa/ai';

vi.mock('@fifa/config', () => ({
  env: { JWT_SECRET: 'test_jwt_secret_key_fifa_companion_2026_07_14_xyz', NODE_ENV: 'test' },
}));

vi.mock('../middleware/auth', () => ({
  RequireAuth: vi.fn((req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    req.user = { userId: 'u-100', role: 'Fan' };
    next();
  }),
}));

vi.mock('../lib/db', () => ({
  prisma: {
    fanMemory: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

describe('Wallet REST Route Tests', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/wallet', walletRouter);
    vi.clearAllMocks();
  });

  it('should return wallet state with ticket arrays', async () => {
    const res = await request(app).get('/api/v1/wallet');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('upcomingTickets');
    expect(res.body.data).toHaveProperty('pastTickets');
    expect(res.body.data).toHaveProperty('totalSpent');
  });

  it('should return all tickets', async () => {
    const res = await request(app).get('/api/v1/wallet/tickets');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.tickets)).toBe(true);
    expect(res.body.data.count).toBeGreaterThanOrEqual(0);
  });

  it('should admit a valid QR entry', async () => {
    // Generate a fresh ticket and get its QR payload
    const ticket = ticketService.generateTicket({
      userId: 'u-100',
      seatId: `seat-test-${Date.now()}`,
      matchId: 'match-test-valid',
      venueId: 'venue-test',
      venueName: 'Test Stadium',
      matchName: 'Test Match',
      matchDate: new Date(Date.now() + 86400000 * 10).toISOString(),
      gate: 'Gate A',
      section: 'A',
      row: '1',
      seatNumber: '1',
      price: 100,
      currency: 'USD',
      paymentId: 'pay-test-001',
    });

    const res = await request(app)
      .post('/api/v1/wallet/validate')
      .send({ qrPayload: ticket.qrPayload, signature: ticket.signature });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Admitted');
    expect(res.body.data.gate).toBe('Gate A');
  });

  it('should reject an invalid QR payload', async () => {
    const res = await request(app)
      .post('/api/v1/wallet/validate')
      .send({ qrPayload: 'INVALIDPAYLOAD==', signature: 'BADSIG' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Rejected');
    expect(res.body.data.reason).toBe('InvalidSignature');
  });

  it('should reject duplicate entry for same ticket', async () => {
    const ticket = ticketService.generateTicket({
      userId: 'u-100',
      seatId: `seat-dup-${Date.now()}`,
      matchId: 'match-dup-test',
      venueId: 'venue-dup',
      venueName: 'Dup Stadium',
      matchName: 'Dup Match',
      matchDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      gate: 'Gate B',
      section: 'B',
      row: '2',
      seatNumber: '5',
      price: 200,
      currency: 'USD',
      paymentId: 'pay-dup-002',
    });

    // First admission
    await request(app)
      .post('/api/v1/wallet/validate')
      .send({ qrPayload: ticket.qrPayload, signature: ticket.signature });

    // Second attempt — should be rejected
    const res = await request(app)
      .post('/api/v1/wallet/validate')
      .send({ qrPayload: ticket.qrPayload, signature: ticket.signature });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Rejected');
    expect(res.body.data.reason).toBe('DuplicateEntry');
  });

  it('should share a ticket and publish TicketShared event', async () => {
    const publishSpy = vi.spyOn(eventBus, 'publish');

    const ticket = ticketService.generateTicket({
      userId: 'u-100',
      seatId: `seat-share-${Date.now()}`,
      matchId: 'match-share',
      venueId: 'venue-share',
      venueName: 'Share Stadium',
      matchName: 'Share Match',
      matchDate: new Date(Date.now() + 86400000 * 20).toISOString(),
      gate: 'Gate D',
      section: 'D',
      row: '4',
      seatNumber: '8',
      price: 500,
      currency: 'USD',
      paymentId: 'pay-share-003',
    });

    const res = await request(app)
      .post(`/api/v1/wallet/share/${ticket.ticketId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.shareUrl).toContain('https://tickets.fifa-companion.dev/share/');
    expect(publishSpy).toHaveBeenCalledWith('TicketShared', expect.any(Object));
  });

  it('should download a ticket and return pkpass payload', async () => {
    const ticket = ticketService.generateTicket({
      userId: 'u-100',
      seatId: `seat-dl-${Date.now()}`,
      matchId: 'match-dl',
      venueId: 'venue-dl',
      venueName: 'Download Stadium',
      matchName: 'Download Match',
      matchDate: new Date(Date.now() + 86400000 * 25).toISOString(),
      gate: 'Gate E',
      section: 'E',
      row: '6',
      seatNumber: '10',
      price: 700,
      currency: 'USD',
      paymentId: 'pay-dl-004',
    });

    const res = await request(app)
      .post(`/api/v1/wallet/download/${ticket.ticketId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.format).toBe('pkpass');
    expect(res.body.data.offlineToken).toMatch(/^OFT-/);
  });
});
