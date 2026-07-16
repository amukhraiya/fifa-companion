import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Response, NextFunction } from 'express';
import request from 'supertest';
import { travelRouter } from './travel';
import { AuthenticatedRequest } from '../middleware/auth';
import { eventBus } from '../lib/di';
import { AITravelRecommendationEngine } from '@fifa/ai';

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
        favoriteTeam: 'Argentina',
        budget: 5000,
        seatPreference: 'Midfield',
        accessibilityNeeds: 'Wheelchair',
      }),
    },
    travelHistory: {
      create: vi.fn().mockResolvedValue({
        id: 'h-100',
        userId: 'u-100',
        matchId: 'match-100',
        routeTaken: 'Metro Line 4 Express',
        transport: 'metro',
        duration: 18,
      }),
    },
    $transaction: vi.fn().mockImplementation((callback) => {
      const mockTx = {
        travelHistory: {
          create: vi.fn().mockResolvedValue({
            id: 'h-100',
            userId: 'u-100',
            matchId: 'match-100',
            routeTaken: 'Metro Line 4 Express',
            transport: 'metro',
            duration: 18,
          }),
        },
        fanMemory: {
          findUnique: vi.fn().mockResolvedValue({
            userId: 'u-100',
            favoriteTeam: 'Argentina',
            budget: 5000,
            seatPreference: 'Midfield',
            accessibilityNeeds: 'Wheelchair',
            averageTravelTimeMinutes: 30,
          }),
          update: vi.fn().mockResolvedValue({
            userId: 'u-100',
            preferredTransport: 'metro',
            averageTravelTimeMinutes: 24,
          }),
        },
      };
      return callback(mockTx);
    }),
  },
}));

describe('Travel REST Route Tests', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/travel', travelRouter);
    vi.clearAllMocks();
  });

  it('should successfully get AI route recommendations', async () => {
    const res = await request(app).get('/api/v1/travel/recommendations');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bestRoute).toBeDefined();
    expect(res.body.data.cheapestRoute.costEstimate).toBeLessThanOrEqual(5);
  });

  it('should successfully get local restaurants list near stadium', async () => {
    const res = await request(app).get('/api/v1/travel/restaurants');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].priceRange).toBeDefined();
  });

  it('should successfully calculate travel recommendations for wheelchair users', () => {
    const result = AITravelRecommendationEngine.getRecommendations({
      userId: 'u-100',
      stadiumId: 'stadium-100',
      matchId: 'match-100',
      userLocation: 'Doha Downtown',
      budget: 5000,
      accessibilityNeeds: 'Wheelchair',
    });

    expect(result.accessibleRoute.confidence).toBe(0.99);
    expect(result.accessibleRoute.transfers).toBe(0);
    expect(result.accessibleRoute.walkingDistanceMeters).toBe(20);
  });

  it('should successfully start a journey commute and publish event logs', async () => {
    const publishSpy = vi.spyOn(eventBus, 'publish');

    const res = await request(app)
      .post('/api/v1/travel/start-journey')
      .send({
        mode: 'metro',
        routeName: 'Metro Line 4 Express',
        durationMinutes: 18,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(publishSpy).toHaveBeenCalledWith('JourneyStarted', expect.any(Object));
    expect(publishSpy).toHaveBeenCalledWith('ArrivedAtStadium', expect.any(Object));
  });
});
