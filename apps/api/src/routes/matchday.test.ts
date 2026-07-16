import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Response, NextFunction } from 'express';
import request from 'supertest';
import { matchdayRouter } from './matchday';
import { AuthenticatedRequest } from '../middleware/auth';
import { eventBus } from '../lib/di';
import { LiveMatchEngine, CommentaryEngine } from '@fifa/ai';

vi.mock('@fifa/config', () => ({
  env: {
    JWT_SECRET: 'test_jwt_secret_key_fifa_companion_2026_07_14_xyz',
    NODE_ENV: 'test',
  },
}));

vi.mock('../middleware/auth', () => ({
  RequireAuth: vi.fn((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    req.user = { userId: 'u-100', role: 'Fan' };
    next();
  }),
}));

vi.mock('../lib/db', () => ({
  prisma: {
    fanMemory: {
      findUnique: vi.fn().mockResolvedValue({
        userId: 'u-100',
        language: 'Spanish',
        accessibilityNeeds: 'Wheelchair',
      }),
      upsert: vi.fn().mockResolvedValue({
        userId: 'u-100',
        language: 'Spanish',
        accessibilityNeeds: 'Wheelchair',
      }),
    },
  },
}));

describe('Match Day REST Route Tests', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/match-day', matchdayRouter);
    vi.clearAllMocks();
  });

  it('should successfully compute live match stats and comments', () => {
    const engine = new LiveMatchEngine('Brazil', 'Spain');
    engine.startMatch();
    const event = engine.tickTo(28);
    const state = engine.getState();
    expect(state.score.home).toBe(1);
    expect(state.score.away).toBe(0);
    expect(state.statistics.expectedGoalsHome).toBeGreaterThan(0.5);

    expect(event).toBeDefined();
    const commentary = CommentaryEngine.generateCommentary(event!, state);
    expect(commentary.text.length).toBeGreaterThan(0);
  });

  it('should successfully get match day live state', async () => {
    const res = await request(app).get('/api/v1/match-day/state?minute=76');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stats.score).toBeDefined();
    expect(res.body.data.commentary.length).toBeGreaterThan(0);
  });

  it('should successfully calculate interior seat navigation', async () => {
    const publishSpy = vi.spyOn(eventBus, 'publish');

    const res = await request(app)
      .post('/api/v1/match-day/navigate')
      .send({
        from: 'Gate 3 East',
        to: 'Section 112',
        accessibilityMode: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessibleElevatorUsed).toBe(true);
    expect(publishSpy).toHaveBeenCalledWith('NavigationStarted', expect.any(Object));
    expect(publishSpy).toHaveBeenCalledWith('NavigationCompleted', expect.any(Object));
  });

  it('should successfully request security/medical SOS dispatch', async () => {
    const publishSpy = vi.spyOn(eventBus, 'publish');

    const res = await request(app)
      .post('/api/v1/match-day/emergency')
      .send({ type: 'medical' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.boothName).toContain('Section 115');
    expect(publishSpy).toHaveBeenCalledWith('EmergencyRequested', expect.any(Object));
  });
});
