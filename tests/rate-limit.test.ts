import { describe, it, expect } from 'vitest';
import { InMemoryRateLimiter } from '../src/bot/middleware';

describe('InMemoryRateLimiter', () => {
  it('should allow requests under the limit', async () => {
    const limiter = new InMemoryRateLimiter(3, 5000);
    const userId = 'user_1';

    const first = await limiter.checkLimit(userId);
    expect(first.isAllowed).toBe(true);

    const second = await limiter.checkLimit(userId);
    expect(second.isAllowed).toBe(true);

    const third = await limiter.checkLimit(userId);
    expect(third.isAllowed).toBe(true);
  });

  it('should block requests when limit is exceeded', async () => {
    const limiter = new InMemoryRateLimiter(2, 5000);
    const userId = 'user_2';

    await limiter.checkLimit(userId);
    await limiter.checkLimit(userId);

    const blocked = await limiter.checkLimit(userId);
    expect(blocked.isAllowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('should track limits independently per user', async () => {
    const limiter = new InMemoryRateLimiter(2, 5000);

    await limiter.checkLimit('user_A');
    await limiter.checkLimit('user_A');
    const blockedA = await limiter.checkLimit('user_A');
    expect(blockedA.isAllowed).toBe(false);

    // user_B should still be allowed
    const allowedB = await limiter.checkLimit('user_B');
    expect(allowedB.isAllowed).toBe(true);
  });
});

