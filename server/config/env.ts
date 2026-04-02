import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env from project root (for local dev)
// On Vercel, env vars are already in process.env
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  AI_API_URL: z.string().url().default('https://api.anthropic.com/v1/messages'),
  AI_API_KEY: z.string().min(1),
  AI_MODEL: z.string().default('claude-sonnet-4-20250514'),
  AI_MODEL_LITE: z.string().default('claude-haiku-4-5-20251001'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  GOOGLE_SERVICE_ACCOUNT_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
