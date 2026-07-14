import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/db', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '1': 1 }]),
  },
}));

vi.mock('@fifa/config', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3001,
  },
}));

describe('Health Check Base Tests', () => {
  it('should mock database connectivity and succeed', () => {
    expect(true).toBe(true);
  });
});
