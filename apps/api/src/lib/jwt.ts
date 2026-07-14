import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '@fifa/config';
import { CookieOptions } from 'express';

export interface AccessTokenPayload {
  userId: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

// Access Token lifetime: 20 minutes
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '20m' });
}

// Refresh Token lifetime: 30 days
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '30d' });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as RefreshTokenPayload;
}

// SHA-256 Hash token for secure DB storage
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// HTTP-Only Secure Cookie settings
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

export function getRefreshTokenCookieOptions(): CookieOptions {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction, // Served only over HTTPS in production
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Days matching the refresh token lifetime
    path: '/api/v1/auth', // Scoped to auth endpoints only for security
  };
}
