import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Health API Endpoints', () => {
  const app = createApp();

  it('GET /api/health returns 200 and system health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toMatch(/ok|degraded/);
    expect(res.body.data.services.database.status).toBe('connected');
    expect(res.body.data.services.aiEngine).toBeDefined();
    expect(res.body.data.services.paypalGateway).toBeDefined();
  });

  it('GET /api/health/db returns database table counts', async () => {
    const res = await request(app).get('/api/health/db');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('connected');
    expect(res.body.data.tableCount).toBeGreaterThan(0);
  });

  it('GET /api/products returns catalog items', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
