import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Only load and validate env if we are not explicitly skipping it (e.g. during build-time on some CI environments)
if (process.env.SKIP_ENV_VALIDATION !== 'true') {
  dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().default('default_jwt_secret_change_me_in_production'),
  FIREBASE_PROJECT_ID: z.string().default('mock-project-id'),
  FIREBASE_CLIENT_EMAIL: z.string().default('mock-client-email'),
  FIREBASE_PRIVATE_KEY: z.string().default('mock-private-key'),
  FIREBASE_API_KEY: z.string().default('mock-api-key'),
  AUTH_PROVIDER: z.enum(['firebase', 'mock']).default('mock'),
});

// For build-time compilation where env vars might not be present, we can bypass strict validation
const isBuilding = process.env.SKIP_ENV_VALIDATION === 'true';

const parsed = isBuilding 
  ? envSchema.safeParse({
      DATABASE_URL: 'postgresql://localhost:5432/placeholder',
      PORT: '3001',
      NODE_ENV: 'development',
      JWT_SECRET: 'placeholder',
    })
  : envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
