import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Response, NextFunction } from 'express';
import request from 'supertest';
import { postMatchRouter } from './postmatch';
import { AuthenticatedRequest } from '../middleware/auth';
import { eventBus } from '../lib/di';

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

describe('Post-Match REST Route Tests', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/post-match', postMatchRouter);
    vi.clearAllMocks();
  });

  it('should generate AI match summary with result and score', async () => {
    const res = await request(app).get('/api/v1/post-match/summary');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('result');
    expect(res.body.data).toHaveProperty('score');
    expect(res.body.data).toHaveProperty('bestPlayer');
    expect(res.body.data).toHaveProperty('aiSummary');
    expect(res.body.data.aiSummary.length).toBeGreaterThan(10);
  });

  it('should return fan memory cards', async () => {
    const res = await request(app).get('/api/v1/post-match/memories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.memories)).toBe(true);
    expect(res.body.data.count).toBeGreaterThanOrEqual(0);
  });

  it('should return personal AI timeline', async () => {
    const res = await request(app).get('/api/v1/post-match/timeline');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.timeline)).toBe(true);
    expect(res.body.data.timeline.length).toBeGreaterThan(0);
    // Timeline should have at minimum a register event
    const registerEvent = res.body.data.timeline.find((e: { type: string }) => e.type === 'register');
    expect(registerEvent).toBeDefined();
  });

  it('should return achievements including FirstMatch unlocked', async () => {
    const publishSpy = vi.spyOn(eventBus, 'publish');

    const res = await request(app).get('/api/v1/post-match/achievements');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.achievements)).toBe(true);
    expect(res.body.data.total).toBe(7);

    const firstMatch = res.body.data.achievements.find(
      (a: { id: string }) => a.id === 'first-match'
    );
    expect(firstMatch).toBeDefined();
    expect(firstMatch.unlocked).toBe(true);
    expect(publishSpy).toHaveBeenCalledWith('AchievementUnlocked', expect.any(Object));
  });

  it('should return fan statistics with all required fields', async () => {
    const res = await request(app).get('/api/v1/post-match/statistics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('matchesAttended');
    expect(res.body.data).toHaveProperty('countriesVisited');
    expect(res.body.data).toHaveProperty('predictionAccuracy');
    expect(res.body.data).toHaveProperty('favoriteTeam');
    expect(res.body.data).toHaveProperty('co2SavedKg');
    expect(res.body.data.matchesAttended).toBeGreaterThanOrEqual(1);
  });

  it('should generate a shareable match card', async () => {
    const res = await request(app).get('/api/v1/post-match/share-card');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('cardId');
    expect(res.body.data).toHaveProperty('qrBadge');
    expect(res.body.data).toHaveProperty('shareCaption');
    expect(res.body.data.hashtags).toContain('#FIFA2026');
  });

  it('should process mock payment and return success', async () => {
    const publishSpy = vi.spyOn(eventBus, 'publish');

    const res = await request(app)
      .post('/api/v1/post-match/payment/charge')
      .send({
        amount: 350,
        currency: 'USD',
        method: 'creditCard',
        description: 'FIFA World Cup 2026 Ticket',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.success).toBe(true);
    expect(res.body.data.transactionId).toMatch(/^mock-txn-/);
    expect(publishSpy).toHaveBeenCalledWith('PaymentCompleted', expect.any(Object));
    expect(publishSpy).toHaveBeenCalledWith('TicketGenerated', expect.any(Object));
  });
});
