import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  AI_API_KEY: z.string().min(1, 'AI_API_KEY is required'),
  AI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  AI_MODEL: z.string().min(1).default('gpt-4o-mini'),
  AI_TEMPERATURE: z
    .string()
    .optional()
    .default('0.3')
    .transform((val) => parseFloat(val))
    .pipe(z.number().min(0).max(2)),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ADMIN_TELEGRAM_IDS: z
    .string()
    .optional()
    .default('')
    .transform((val) =>
      val
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    ),
  SUPPORT_GROUP_ID: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined)),
  MAX_MESSAGE_LENGTH: z
    .string()
    .optional()
    .default('4000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .optional()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .optional()
    .default('60000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  ADMIN_PANEL_PASSWORD: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  ADMIN_SESSION_TTL_MS: z
    .string()
    .optional()
    .default('28800000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(60_000).max(7 * 24 * 60 * 60 * 1000)),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formattedErrors = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${formattedErrors}`);
  }
  return result.data;
};

// Parse environment variables
const parsed = parseEnv();

export const config = {
  botToken: parsed.BOT_TOKEN,
  ai: {
    apiKey: parsed.AI_API_KEY,
    baseUrl: parsed.AI_BASE_URL,
    model: parsed.AI_MODEL,
    temperature: parsed.AI_TEMPERATURE,
  },
  databaseUrl: parsed.DATABASE_URL,
  adminIds: parsed.ADMIN_TELEGRAM_IDS,
  supportGroupId: parsed.SUPPORT_GROUP_ID,
  maxMessageLength: parsed.MAX_MESSAGE_LENGTH,
  // A deterministic password is available only to the isolated Vitest process; production never has a default.
  adminPassword: parsed.ADMIN_PANEL_PASSWORD ?? (process.env.VITEST ? 'vitest-admin-password' : undefined),
  adminSessionTtlMs: parsed.ADMIN_SESSION_TTL_MS,
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT,
  rateLimit: {
    maxRequests: parsed.RATE_LIMIT_MAX_REQUESTS,
    windowMs: parsed.RATE_LIMIT_WINDOW_MS,
  },
  isProduction: parsed.NODE_ENV === 'production',
  isDevelopment: parsed.NODE_ENV === 'development',
  isTest: parsed.NODE_ENV === 'test',
} as const;

export type Config = typeof config;
export default config;
