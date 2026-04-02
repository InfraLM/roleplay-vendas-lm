import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory (for local dev)
// On Vercel, env vars are already in process.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  AI_API_URL: z.string().url(),
  AI_API_KEY: z.string().min(1),
  AI_MODEL: z.string().default('gpt-4o-mini'),
  AI_MODEL_LITE: z.string().default('gpt-4o-mini'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  GOOGLE_SERVICE_ACCOUNT_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
