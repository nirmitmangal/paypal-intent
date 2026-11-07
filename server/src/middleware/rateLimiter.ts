import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale records periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

export interface RateLimiterOptions {
  windowMs?: number;
  maxRequests?: number;
}

export function createRateLimiter(options: RateLimiterOptions = {}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute
  const maxRequests = options.maxRequests || 120; // 120 requests per window

  return (req: Request, res: Response, next: NextFunction): void => {
    // In automated testing environments with supertest, optionally allow higher limit
    if (process.env.NODE_ENV === 'test' && !options.maxRequests) {
      next();
      return;
    }

    const clientKey =
      (req.headers['x-session-token'] as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      'anonymous';

    const now = Date.now();
    let record = rateLimitStore.get(clientKey);

    if (!record || now > record.resetAt) {
      record = {
        count: 1,
        resetAt: now + windowMs,
      };
      rateLimitStore.set(clientKey, record);
    } else {
      record.count++;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', resetSeconds);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests from this client. Please retry after ${resetSeconds} seconds.`,
        },
      });
      return;
    }

    next();
  };
}

export const rateLimiter = createRateLimiter();

export function resetRateLimiter(): void {
  rateLimitStore.clear();
}
