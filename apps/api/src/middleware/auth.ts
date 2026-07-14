import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { logger } from '../lib/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

// Authentication gate: decodes authorization headers
export function RequireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authorization header is missing or malformed' },
    });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      role: payload.role,
    };
    next();
  } catch (error) {
    logger.warn(error, 'JWT access token verification failed');
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Access token is invalid or expired' },
    });
  }
}

// RBAC gate: checks active permissions
export function RequireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication is required' },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        { userId: req.user.userId, role: req.user.role, allowedRoles },
        'RBAC access denied - mismatched permission roles',
      );
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to access this resource' },
      });
      return;
    }

    next();
  };
}
