import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRateLimiter, resetRateLimiter } from '../src/middleware/rateLimiter';

describe('API Security — Rate Limiting Middleware', () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it('attaches rate limiting headers to responses', async () => {
    const testApp = express();
    const limiter = createRateLimiter({ windowMs: 10000, maxRequests: 5 });
    testApp.use(limiter);
    testApp.get('/test', (_req, res) => res.json({ ok: true }));

    const res = await request(testApp)
      .get('/test')
      .set('x-session-token', 'tok_test_headers')
      .expect(200);

    expect(res.headers['x-ratelimit-limit']).toBe('5');
    expect(res.headers['x-ratelimit-remaining']).toBe('4');
    expect(res.headers['x-ratelimit-reset']).toBeDefined();
  });

  it('rejects requests with 429 when threshold is exceeded', async () => {
    const testApp = express();
    const limiter = createRateLimiter({ windowMs: 10000, maxRequests: 3 });
    testApp.use(limiter);
    testApp.get('/test', (_req, res) => res.json({ ok: true }));

    const token = 'tok_test_ratelimit';

    // Request 1, 2, 3 should succeed
    await request(testApp).get('/test').set('x-session-token', token).expect(200);
    await request(testApp).get('/test').set('x-session-token', token).expect(200);
    await request(testApp).get('/test').set('x-session-token', token).expect(200);

    // Request 4 should be rate limited
    const limitedRes = await request(testApp).get('/test').set('x-session-token', token).expect(429);

    expect(limitedRes.body.success).toBe(false);
    expect(limitedRes.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(limitedRes.headers['retry-after']).toBeDefined();
  });
});
