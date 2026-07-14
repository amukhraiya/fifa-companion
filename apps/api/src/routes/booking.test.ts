import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Response, NextFunction } from 'express';
import request from 'supertest';
import { bookingRouter } from './booking';
import { AuthenticatedRequest } from '../middleware/auth';
import { reservationService } from '../services/reservation.service';

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
    match: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'match-1',
          date: new Date('2022-12-18T18:00:00Z'),
          venueId: 'venue-1',
          venue: { name: 'Lusail Stadium' },
          teams: [{ team: { name: 'Argentina' } }, { team: { name: 'France' } }],
        },
      ]),
    },
    fanMemory: {
      findUnique: vi.fn().mockResolvedValue({
        userId: 'u-100',
        favoriteTeam: 'Argentina',
        budget: 5000,
        seatPreference: 'Midfield',
        accessibilityNeeds: 'None',
      }),
    },
    seat: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'seat-1',
          matchId: 'match-1',
          section: 'Category 1',
          row: 'A',
          number: '1',
          price: 250,
          status: 'Available',
          match: {
            venue: { name: 'Lusail Stadium' },
            teams: [{ team: { name: 'Argentina' } }, { team: { name: 'France' } }],
          },
        },
      ]),
    },
  },
}));

describe('Booking REST Route Tests', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/booking', bookingRouter);
    vi.clearAllMocks();
  });

  it('should successfully get seeded matches', async () => {
    const res = await request(app).get('/api/v1/booking/matches');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].venue.name).toBe('Lusail Stadium');
  });

  it('should successfully get AI seat recommendations', async () => {
    const res = await request(app).get('/api/v1/booking/recommendations');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].type).toBe('Best Overall');
    expect(res.body.data[0].justifications).toContain('Supports Argentina');
  });

  it('should transactionally lock a seat selection', async () => {
    const spy = vi.spyOn(reservationService, 'lockSeat').mockResolvedValue({
      success: true,
      lock: { id: 'lock-1', seatId: 'seat-1', expiresAt: new Date() },
    });

    const res = await request(app)
      .post('/api/v1/booking/lock')
      .send({ seatId: 'seat-1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(spy).toHaveBeenCalledWith('u-100', 'seat-1');
  });

  it('should return conflict code when seat is already locked', async () => {
    vi.spyOn(reservationService, 'lockSeat').mockResolvedValue({
      success: false,
      error: 'Seat is already locked or reserved',
    });

    const res = await request(app)
      .post('/api/v1/booking/lock')
      .send({ seatId: 'seat-1' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Seat is already locked or reserved');
  });
});
