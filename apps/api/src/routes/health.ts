import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
import { env } from '@fifa/config';
import { logger } from '../lib/logger';
import { createApiResponseSchema, HealthStatusSchema } from '@fifa/shared-types';

export const healthRouter = Router();

const healthResponseSchema = createApiResponseSchema(HealthStatusSchema);

healthRouter.get('/health', async (req: Request, res: Response) => {
  logger.info({ path: req.path, method: req.method }, 'Handling health check request');

  let dbStatus = 'CONNECTED';
  try {
    // Run a fast raw select query to test Postgres connection
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    logger.error(error, 'Database health check query failed');
    dbStatus = 'DISCONNECTED';
  }

  const statusPayload = {
    status: 'OK',
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    database: dbStatus,
  };

  const responseBody = {
    success: dbStatus === 'CONNECTED',
    data: statusPayload,
    error: dbStatus !== 'CONNECTED' ? { code: 'DATABASE_ERROR', message: 'Failed to connect to the database' } : undefined,
  };

  // Safe parse using our Zod schema to ensure exact structural alignment
  const parseResult = healthResponseSchema.safeParse(responseBody);
  if (!parseResult.success) {
    logger.error({ errors: parseResult.error.format() }, 'Health response schema validation failed');
    res.status(500).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid health status schema' }
    });
    return;
  }

  res.status(dbStatus === 'CONNECTED' ? 200 : 500).json(parseResult.data);
});
