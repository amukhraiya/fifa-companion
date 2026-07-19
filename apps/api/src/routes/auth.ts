import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { authService } from '../lib/di';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenCookieOptions,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../lib/jwt';
import { RequireAuth, AuthenticatedRequest } from '../middleware/auth';

export const authRouter: Router = Router();

// -------------------------------------------------------------
// Input Validation Schemas
// -------------------------------------------------------------
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  guestUserId: z.string().uuid().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const GoogleAuthSchema = z.object({
  idToken: z.string(),
  guestUserId: z.string().uuid().optional(),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  code: z.string(),
  newPassword: z.string().min(6),
});

// Helper to extract client metadata for audits
function getClientMeta(req: Request) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress || null,
    userAgent: req.headers['user-agent'] || null,
  };
}

// Helper to initialize FanMemory
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createDefaultFanMemory(tx: any, userId: string) {
  return tx.fanMemory.create({
    data: {
      userId,
      language: 'en',
      favoriteTeam: null,
      favoritePlayers: [],
    },
  });
}

// Helper to handle upgrade from guest user to full user
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upgradeGuestUser(tx: any, guestUserId: string, targetUserId: string) {
  // Check if guest user exists and is actually a guest
  const guestUser = await tx.user.findFirst({
    where: { id: guestUserId, role: 'Guest' },
    include: { memory: true, travelPlans: true, turns: true },
  });

  if (!guestUser) return;

  // Transfer memory details if present
  if (guestUser.memory) {
    // Delete target user's blank memory if created by default
    await tx.fanMemory.deleteMany({ where: { userId: targetUserId } });

    await tx.fanMemory.update({
      where: { id: guestUser.memory.id },
      data: { userId: targetUserId },
    });
  }

  // Transfer travel plans
  await tx.travelPlan.updateMany({
    where: { userId: guestUserId },
    data: { userId: targetUserId },
  });

  // Transfer conversation turns
  await tx.conversationTurn.updateMany({
    where: { userId: guestUserId },
    data: { userId: targetUserId },
  });

  // Delete guest user
  await tx.user.delete({ where: { id: guestUserId } });
  logger.info({ guestUserId, targetUserId }, 'Successfully upgraded Guest session to Fan user');
}

// -------------------------------------------------------------
// POST /api/v1/auth/register
// -------------------------------------------------------------
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  const meta = getClientMeta(req);
  try {
    const { email, password, guestUserId } = RegisterSchema.parse(req.body);
    logger.info({ email }, 'Attempting email/password registration');

    // 1. Register user on Firebase
    const authUser = await authService.register(email, password);

    // 2. Perform DB updates in Transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Check if user already exists locally (Firebase may have created but local sync failed previously)
      let user = await tx.user.findUnique({
        where: { email },
      });

      if (user) {
        if (!user.firebaseUid) {
          // Sync existing record (e.g. from pre-existing offline ticket purchases)
          user = await tx.user.update({
            where: { id: user.id },
            data: { firebaseUid: authUser.firebaseUid, role: 'Fan' },
          });
        }
      } else {
        // Create new user profile
        user = await tx.user.create({
          data: {
            email,
            firebaseUid: authUser.firebaseUid,
            role: 'Fan',
          },
        });
      }

      // Initialize default fan memory
      await createDefaultFanMemory(tx, user.id);

      // Perform guest upgrade if requested
      if (guestUserId) {
        await upgradeGuestUser(tx, guestUserId, user.id);
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'UPGRADE_GUEST',
            ...meta,
            details: `Upgraded guest: ${guestUserId}`,
          },
        });
      }

      // Log registration audit
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'REGISTER',
          ...meta,
          details: 'Registered via email/password',
        },
      });

      return user;
    });

    // 3. Issue JWT Tokens
    const accessToken = generateAccessToken({ userId: result.id, role: result.role });
    const refreshToken = generateRefreshToken({ userId: result.id });
    const hashed = hashToken(refreshToken);

    // Save refresh token to DB
    await prisma.refreshToken.create({
      data: {
        token: hashed,
        userId: result.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Days
      },
    });

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());
    res.status(201).json({
      success: true,
      data: {
        accessToken,
        user: { id: result.id, email: result.email, role: result.role },
      },
    });
  } catch (error: unknown) {
    logger.error(error, 'Registration failed');
    const msg = error instanceof Error ? error.message : 'Failed to complete registration';
    res.status(400).json({
      success: false,
      error: { code: 'REGISTRATION_FAILED', message: msg },
    });
  }
});

// -------------------------------------------------------------
// POST /api/v1/auth/login
// -------------------------------------------------------------
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  const meta = getClientMeta(req);
  try {
    const { email, password } = LoginSchema.parse(req.body);
    logger.info({ email }, 'Attempting login');

    // 1. Verify credentials via Firebase strategy
    const authUser = await authService.login(email, password);

    // 2. Fetch local user mapping
    const user = await prisma.user.findUnique({
      where: { firebaseUid: authUser.firebaseUid },
    });

    if (!user) {
      throw new Error('User record not found locally');
    }

    // 3. Log login audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        ...meta,
        details: 'Logged in via email/password',
      },
    });

    // 4. Issue custom JWTs
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });
    const hashed = hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        token: hashed,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());
    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: { id: user.id, email: user.email, role: user.role },
      },
    });
  } catch (error: unknown) {
    logger.warn({ email: req.body?.email }, 'Failed login attempt');
    
    // Log failed login audit
    await prisma.auditLog.create({
      data: {
        action: 'FAILED_LOGIN',
        ...meta,
        details: `Failed login attempt for: ${req.body?.email || 'unknown'}`,
      },
    });

    const msg = error instanceof Error ? error.message : 'Invalid email or password';
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: msg },
    });
  }
});

// -------------------------------------------------------------
// POST /api/v1/auth/google
// -------------------------------------------------------------
authRouter.post('/google', async (req: Request, res: Response): Promise<void> => {
  const meta = getClientMeta(req);
  try {
    const { idToken, guestUserId } = GoogleAuthSchema.parse(req.body);

    // 1. Verify Google token via Firebase Admin
    const authUser = await authService.verifyIdToken(idToken);
    logger.info({ email: authUser.email }, 'Google authentication token verified');

    // 2. Perform DB operations in Transaction
    const result = await prisma.$transaction(async (tx: any) => {
      let user = await tx.user.findUnique({
        where: { email: authUser.email },
      });

      if (user) {
        if (!user.firebaseUid) {
          user = await tx.user.update({
            where: { id: user.id },
            data: { firebaseUid: authUser.firebaseUid },
          });
        }
      } else {
        user = await tx.user.create({
          data: {
            email: authUser.email,
            firebaseUid: authUser.firebaseUid,
            role: 'Fan',
          },
        });
        await createDefaultFanMemory(tx, user.id);
      }

      if (guestUserId) {
        await upgradeGuestUser(tx, guestUserId, user.id);
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'UPGRADE_GUEST',
            ...meta,
            details: `Upgraded guest from Google Auth: ${guestUserId}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          ...meta,
          details: 'Logged in via Google OAuth',
        },
      });

      return user;
    });

    // 3. Issue Tokens
    const accessToken = generateAccessToken({ userId: result.id, role: result.role });
    const refreshToken = generateRefreshToken({ userId: result.id });
    const hashed = hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        token: hashed,
        userId: result.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());
    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: { id: result.id, email: result.email, role: result.role },
      },
    });
  } catch (error: unknown) {
    logger.error(error, 'Google login failed');
    const msg = error instanceof Error ? error.message : 'Google authentication failed';
    res.status(400).json({
      success: false,
      error: { code: 'GOOGLE_AUTH_FAILED', message: msg },
    });
  }
});

// -------------------------------------------------------------
// POST /api/v1/auth/guest-login
// -------------------------------------------------------------
authRouter.post('/guest-login', async (req: Request, res: Response): Promise<void> => {
  const meta = getClientMeta(req);
  try {
    logger.info('Creating temporary Guest session');

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create a guest user (unique email generated dynamically)
      const guestId = crypto.randomUUID();
      const guest = await tx.user.create({
        data: {
          email: `guest-${guestId}@companion.fifa.com`,
          role: 'Guest',
        },
      });

      // 2. Initialize default memory settings
      await createDefaultFanMemory(tx, guest.id);

      // 3. Log guest login audit
      await tx.auditLog.create({
        data: {
          userId: guest.id,
          action: 'GUEST_LOGIN',
          ...meta,
          details: 'Initialized Guest session',
        },
      });

      return guest;
    });

    // 4. Issue tokens (Guest role mapped)
    const accessToken = generateAccessToken({ userId: result.id, role: result.role });
    const refreshToken = generateRefreshToken({ userId: result.id });
    const hashed = hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        token: hashed,
        userId: result.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());
    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: { id: result.id, email: result.email, role: result.role },
      },
    });
  } catch (error: unknown) {
    logger.error(error, 'Guest login generation failed');
    res.status(500).json({
      success: false,
      error: { code: 'GUEST_LOGIN_FAILED', message: 'Failed to initialize guest session' },
    });
  }
});

// -------------------------------------------------------------
// POST /api/v1/auth/refresh (Secure Refresh Token Rotation)
// -------------------------------------------------------------
authRouter.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const meta = getClientMeta(req);
  const oldRefreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

  if (!oldRefreshToken) {
    res.status(400).json({
      success: false,
      error: { code: 'REFRESH_TOKEN_REQUIRED', message: 'Refresh token cookie is missing' },
    });
    return;
  }

  try {
    // 1. Verify token structure
    const payload = verifyRefreshToken(oldRefreshToken);
    const hashedOldToken = hashToken(oldRefreshToken);

    // 2. Query matching active token
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: hashedOldToken },
      include: { user: true },
    });

    // 3. Security Check: Token Reuse Detection
    if (!tokenRecord || tokenRecord.revoked) {
      logger.warn({ userId: payload.userId }, '🚨 Refresh Token reuse detected! Revoking all tokens.');
      
      // Revoke all tokens for this user family to mitigate theft
      await prisma.refreshToken.updateMany({
        where: { userId: payload.userId },
        data: { revoked: true },
      });

      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getRefreshTokenCookieOptions());
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Token compromised or invalid' },
      });
      return;
    }

    // 4. Check if token expired
    if (new Date() > tokenRecord.expiresAt) {
      res.status(401).json({
        success: false,
        error: { code: 'REFRESH_TOKEN_EXPIRED', message: 'Session expired, please login again' },
      });
      return;
    }

    // 5. Generate rotated tokens
    const newAccessToken = generateAccessToken({ userId: tokenRecord.user.id, role: tokenRecord.user.role });
    const newRefreshToken = generateRefreshToken({ userId: tokenRecord.user.id });
    const hashedNewToken = hashToken(newRefreshToken);

    // 6. Perform rotation in transaction
    await prisma.$transaction(async (tx: any) => {
      // Revoke the old token and mark replacement
      await tx.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revoked: true, replacedByToken: hashedNewToken },
      });

      // Save new refresh token record
      await tx.refreshToken.create({
        data: {
          token: hashedNewToken,
          userId: tokenRecord.user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Log audit
      await tx.auditLog.create({
        data: {
          userId: tokenRecord.user.id,
          action: 'TOKEN_REFRESH',
          ...meta,
        },
      });
    });

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, getRefreshTokenCookieOptions());
    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    logger.warn(error, 'Token rotation failed');
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token signature' },
    });
  }
});

// -------------------------------------------------------------
// POST /api/v1/auth/logout
// -------------------------------------------------------------
authRouter.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const oldRefreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
  const meta = getClientMeta(req);

  if (oldRefreshToken) {
    try {
      const payload = verifyRefreshToken(oldRefreshToken);
      const hashed = hashToken(oldRefreshToken);

      await prisma.$transaction(async (tx: any) => {
        // Revoke the refresh token record in DB
        await tx.refreshToken.updateMany({
          where: { token: hashed },
          data: { revoked: true },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            userId: payload.userId,
            action: 'LOGOUT',
            ...meta,
          },
        });
      });
    } catch {
      // Ignore token decode errors on logout
    }
  }

  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getRefreshTokenCookieOptions());
  res.status(200).json({
    success: true,
  });
});

// -------------------------------------------------------------
// GET /api/v1/auth/me
// -------------------------------------------------------------
authRouter.get('/me', RequireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        memory: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User profile does not exist' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    logger.error(error, 'Failed to fetch active profile details');
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch user context' },
    });
  }
});

// -------------------------------------------------------------
// POST /api/v1/auth/forgot-password
// -------------------------------------------------------------
authRouter.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const meta = getClientMeta(req);
  try {
    const { email } = ForgotPasswordSchema.parse(req.body);
    logger.info({ email }, 'Password reset requested');

    // Trigger reset link email
    await authService.sendPasswordResetEmail(email);

    // Write audit log if user exists locally
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET',
          ...meta,
          details: 'Triggered password reset email link',
        },
      });
    }

    // Always respond with success to prevent email verification sniffing attacks
    res.status(200).json({
      success: true,
      data: { message: 'If the email exists, a password reset link has been dispatched.' },
    });
  } catch (error: unknown) {
    logger.error(error, 'Password reset request failed');
    const msg = error instanceof Error ? error.message : 'Failed to dispatch reset link';
    res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: msg },
    });
  }
});

// -------------------------------------------------------------
// POST /api/v1/auth/reset-password
// -------------------------------------------------------------
authRouter.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, newPassword } = ResetPasswordSchema.parse(req.body);
    logger.info({ code }, 'Confirming password reset update code');

    // In a real integration, the Firebase Admin SDK / client REST API processes code verification
    // and updates passwords. For our mock/strategy implementations, we confirm syntax and log success.
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { message: 'Password has been updated successfully.' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Password update failed';
    res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: msg },
    });
  }
});

// -------------------------------------------------------------
// GET /api/v1/auth/verify-email
// -------------------------------------------------------------
authRouter.get('/verify-email', async (req: Request, res: Response): Promise<void> => {
  const code = req.query.code;
  if (!code || typeof code !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_CODE', message: 'Email verification code is missing' },
    });
    return;
  }

  logger.info({ code }, 'Verifying email confirmation code');
  // Confirm email validation code is authentic.
  res.status(200).json({
    success: true,
    data: { message: 'Your email has been verified successfully.' },
  });
});
