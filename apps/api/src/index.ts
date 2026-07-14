import { env } from '@fifa/config'; // Fail-fast environment check on startup
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { logger } from './lib/logger';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming HTTP Request');
  next();
});

// Route registration
app.use('/api/v1', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);

// Wildcard 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    },
  });
});

// Global error handling middleware
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err, 'Unhandled Express application error');
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred',
    },
  });
});

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, environment: env.NODE_ENV },
    '🚀 FIFA AI Companion Express API Server successfully started',
  );
});

// Handle graceful termination signals
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Starting graceful shutdown of API server...');
  server.close(() => {
    logger.info('API server closed connections. Exiting process.');
    process.exit(0);
  });
});
