import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Response, NextFunction } from 'express';
import request from 'supertest';
import { chatRouter } from './chat';
import { AuthenticatedRequest } from '../middleware/auth';
import { kernel } from '../lib/di';

vi.mock('@fifa/config', () => ({
  env: {
    JWT_SECRET: 'test_jwt_secret_key_fifa_companion_2026_07_14_xyz',
    NODE_ENV: 'test',
  },
}));

vi.mock('../lib/db', () => ({
  prisma: {
    fanMemory: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'memory-1',
        userId: 'u-100',
        favoriteTeam: 'Brazil',
        favoritePlayers: JSON.stringify(['Neymar']),
        language: 'en',
        budget: 5000,
        travelStyle: 'Luxury',
        foodPreference: 'Halal',
        accessibilityNeeds: 'None',
        seatPreference: 'VIP',
        atmospherePreference: 'Loud',
        matchInterests: JSON.stringify(['Finals']),
        fanProfile: 'Premium Fan',
        groupType: 'Family',
      }),
    },
    conversationTurn: {
      create: vi.fn().mockResolvedValue({}),
    },
    knowledgeChunk: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    event: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'ev-1', eventType: 'SeatLocked', payload: '{}', createdAt: new Date() }
      ]),
    },
  },
}));

vi.mock('../middleware/auth', () => ({
  RequireAuth: vi.fn((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    req.user = { userId: 'u-100', role: 'Fan' };
    next();
  }),
}));

describe('Chat REST Route Tests', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/chat', chatRouter);
    vi.clearAllMocks();
  });

  it('should successfully stream chat message turns', async () => {
    const res = await request(app)
      .post('/api/v1/chat/stream')
      .send({
        message: 'recommend a match tickets seating',
      });

    expect(res.status).toBe(200);
    expect(res.text).toContain('data:');
    expect(res.text).toContain('done');
  });

  it('should successfully retrieve observability traces', async () => {
    // Inject a dummy trace in registry
    const traceId = kernel.observability.startTrace('booking query', 'MasterAgent');

    const res = await request(app).get(`/api/v1/chat/debug/traces/${traceId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trace.executionId).toBe(traceId);
  });

  it('should successfully retrieve live Event Bus timeline events', async () => {
    const res = await request(app).get('/api/v1/chat/debug/events');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].eventType).toBe('SeatLocked');
  });
});
