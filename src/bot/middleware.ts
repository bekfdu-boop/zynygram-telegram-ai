import { Context, MiddlewareFn } from 'telegraf';
import config from '../config/env';
import logger from '../utils/logger';

export interface IRateLimiter {
  checkLimit(key: string): Promise<{ isAllowed: boolean; retryAfterSeconds: number }>;
}

/**
 * In-memory sliding-window rate limiter.
 * Designed with a clean interface so Redis or another store can be swapped in.
 */
export class InMemoryRateLimiter implements IRateLimiter {
  private timestamps: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = config.rateLimit.maxRequests, windowMs = config.rateLimit.windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Periodic cleanup of expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  public async checkLimit(key: string): Promise<{ isAllowed: boolean; retryAfterSeconds: number }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const userTimestamps = this.timestamps.get(key) || [];
    // Keep only timestamps within current window
    const validTimestamps = userTimestamps.filter((ts) => ts > windowStart);

    if (validTimestamps.length >= this.maxRequests) {
      const oldestTimestamp = validTimestamps[0];
      const retryAfterSeconds = Math.max(1, Math.ceil((oldestTimestamp + this.windowMs - now) / 1000));
      return { isAllowed: false, retryAfterSeconds };
    }

    validTimestamps.push(now);
    this.timestamps.set(key, validTimestamps);

    return { isAllowed: true, retryAfterSeconds: 0 };
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, timestamps] of this.timestamps.entries()) {
      const valid = timestamps.filter((ts) => ts > windowStart);
      if (valid.length === 0) {
        this.timestamps.delete(key);
      } else {
        this.timestamps.set(key, valid);
      }
    }
  }
}

export const defaultRateLimiter = new InMemoryRateLimiter();

export const RATE_LIMIT_USER_MESSAGE =
  'Juda ko‘p so‘rov yuborildi. Iltimos, birozdan keyin qayta urinib ko‘ring.';

export const ERROR_FALLBACK_USER_MESSAGE =
  'Kechirasiz, hozir javob berishda texnik muammo yuz berdi. Iltimos, birozdan keyin qayta urinib ko‘ring.';

/**
 * Telegraf middleware for rate limiting per Telegram user ID
 */
export function createRateLimitMiddleware(limiter: IRateLimiter = defaultRateLimiter): MiddlewareFn<Context> {
  return async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) {
      return next();
    }

    // Admins bypass normal rate limits for operations
    const isAdmin = config.adminIds.includes(userId.toString());
    if (isAdmin) {
      return next();
    }

    const { isAllowed } = await limiter.checkLimit(userId.toString());
    if (!isAllowed) {
      logger.warn({ userId }, 'Rate limit exceeded for user');
      await ctx.reply(RATE_LIMIT_USER_MESSAGE);
      return;
    }

    return next();
  };
}

/**
 * Checks if the caller is an authorized admin
 */
export function isAuthorizedAdmin(ctx: Context): boolean {
  const userId = ctx.from?.id?.toString();
  if (!userId) return false;
  return config.adminIds.includes(userId);
}

/**
 * Telegraf error handler middleware to prevent unhandled rejections from crashing the bot
 */
export async function botErrorHandler(error: unknown, ctx: Context): Promise<void> {
  logger.error(
    {
      updateId: ctx.update?.update_id,
      userId: ctx.from?.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    'Error caught in Telegram bot update handler',
  );

  try {
    if (ctx.chat) {
      await ctx.reply(ERROR_FALLBACK_USER_MESSAGE);
    }
  } catch (replyErr) {
    logger.error({ error: replyErr }, 'Failed to send error fallback response to user');
  }
}

