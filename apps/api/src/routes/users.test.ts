import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Response, NextFunction } from 'express';
import request from 'supertest';
import { usersRouter } from './users';
import { AuthenticatedRequest } from '../middleware/auth';
import { eventBus } from '../lib/di';

// Mock Config and DB
vi.mock('@fifa/config', () => ({
  env: {
    JWT_SECRET: 'test_jwt_secret_key_fifa_companion_2026_07_14_xyz',
    NODE_ENV: 'test',
  },
}));

vi.mock('../lib/db', () => ({
  prisma: {
    fanMemory: {
      update: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue({
        id: 'memory-1',
        userId: 'u-100',
        favoriteTeam: 'Argentina',
        favoritePlayers: JSON.stringify(['Messi']),
        language: 'es',
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
  },
}));

vi.mock('../middleware/auth', () => ({
  RequireAuth: vi.fn((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    req.user = { userId: 'u-100', role: 'Fan' };
    next();
  }),
}));

describe('Users REST Route Tests', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/users', usersRouter);
    vi.clearAllMocks();
  });

  it('should successfully update preferences and return derived profile and completion details', async () => {
    const publishSpy = vi.spyOn(eventBus, 'publish');

    const res = await request(app)
      .put('/api/v1/users/me/fan-memory')
      .send({
        favoriteTeam: 'Argentina',
        favoritePlayers: ['Messi'],
        language: 'es',
        budget: 5000,
        travelStyle: 'Luxury',
        foodPreference: 'Halal',
        accessibilityNeeds: 'None',
        seatPreference: 'VIP',
        atmospherePreference: 'Loud',
        matchInterests: ['Finals'],
        groupType: 'Family',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fanMemory.fanProfile).toBe('Premium Fan');
    expect(res.body.data.completionPercentage).toBe(100);
    expect(res.body.data.sessionCacheActive).toBe(true);

    // Verify events were published onto the Event Bus
    expect(publishSpy).toHaveBeenCalledWith('FanMemoryUpdated', expect.any(Object));
    expect(publishSpy).toHaveBeenCalledWith('FanDNACompleted', {
      userId: 'u-100',
      fanProfile: 'Premium Fan',
      completionPercentage: 100,
    });
  });

  it('should reject invalid schema inputs', async () => {
    const res = await request(app)
      .put('/api/v1/users/me/fan-memory')
      .send({
        budget: 'invalid-number-type',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});
