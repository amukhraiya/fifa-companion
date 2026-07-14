import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
} from '../lib/jwt';
import { RequireAuth, RequireRole, AuthenticatedRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';

vi.mock('@fifa/config', () => ({
  env: {
    JWT_SECRET: 'test_secret_key_12345678901234567890',
    NODE_ENV: 'test',
  },
}));

describe('1. JWT Utility Tests', () => {
  it('should generate and verify access tokens successfully', () => {
    const payload = { userId: 'user-1', role: 'Fan' };
    const token = generateAccessToken(payload);
    expect(token).toBeDefined();

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
  });

  it('should generate and verify refresh tokens successfully', () => {
    const payload = { userId: 'user-2' };
    const token = generateRefreshToken(payload);
    expect(token).toBeDefined();

    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(payload.userId);
  });

  it('should throw error when verifying tampered tokens', () => {
    const token = generateAccessToken({ userId: 'user-1', role: 'Fan' });
    const tampered = token + 'tamper';
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('should compute consistent SHA-256 hashes of tokens', () => {
    const token = 'my-sample-refresh-token';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex string size
  });
});

describe('2. Authentication Middleware Tests', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = { headers: {} };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    nextFunction = vi.fn();
  });

  it('should pass RequireAuth given a valid Bearer token', () => {
    const token = generateAccessToken({ userId: 'user-123', role: 'Fan' });
    mockRequest.headers = { authorization: `Bearer ${token}` };

    RequireAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.user).toBeDefined();
    expect(mockRequest.user?.userId).toBe('user-123');
    expect(mockRequest.user?.role).toBe('Fan');
  });

  it('should return 401 given an invalid Bearer token', () => {
    mockRequest.headers = { authorization: 'Bearer invalidtoken' };

    RequireAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(401);
  });

  it('should return 401 if authorization header is missing', () => {
    RequireAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(401);
  });
});

describe('3. Role Based Access Control Middleware Tests', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    nextFunction = vi.fn();
  });

  it('should allow user if their role matches authorized list', () => {
    mockRequest.user = { userId: 'u-1', role: 'Fan' };
    const guard = RequireRole(['Fan', 'Admin']);

    guard(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should block user if their role is not authorized', () => {
    mockRequest.user = { userId: 'u-2', role: 'Guest' };
    const guard = RequireRole(['Fan', 'Admin']);

    guard(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(403);
  });

  it('should return 401 if user session context is missing', () => {
    const guard = RequireRole(['Fan']);

    guard(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(401);
  });
});
