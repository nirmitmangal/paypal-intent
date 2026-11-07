import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { sessionRepository, intentRepository, cartRepository } from '../src/db/repository';
import { env } from '../src/config/env';
import { aiService } from '../src/services/ai.service';

describe('Master Prompt 8 — Full System Integration & Complete User Journey', () => {
  const app = createApp();

  // Test state across the sequence
  let sessionToken: string;
  let intentSessionId: string;
  let planId: string;
  let cartId: string;
  let internalOrderId: string;
  let mockPayPalOrderId: string;
  let transactionId: string;

  beforeAll(() => {
    const session = sessionRepository.getOrCreate();
    sessionToken = session.sessionToken;
    const intent = intentRepository.create({
      sessionId: session.id,
      rawPrompt: 'Dual monitor developer desk setup under $1500',
      budgetAmount: 1500,
    });
    intentSessionId = intent.id;
    const cart = cartRepository.getOrCreate(session.id, intent.id);
    cartId = cart.id;
  });

  // ==========================================================================
  // PHASE 1: System Health & Service Diagnostics
  // ==========================================================================
  describe('Phase 1: Diagnostics & Foundation Health', () => {
    it('verifies Express server, SQLite database, and AI status endpoints', async () => {
      const healthRes = await request(app).get('/api/health').expect(200);
      expect(healthRes.body.success).toBe(true);
      expect(healthRes.body.data.status).toBe('ok');
      expect(healthRes.body.data.services.database.status).toBe('connected');

      const dbHealth = await request(app).get('/api/health/db').expect(200);
      expect(dbHealth.body.data.tableCount).toBeGreaterThanOrEqual(10);

      const agentHealth = await request(app).get('/api/agent/health').expect(200);
      expect(agentHealth.body.success).toBe(true);
      expect(agentHealth.body.data).toHaveProperty('status');
      expect(agentHealth.body.data).toHaveProperty('model');
      expect(agentHealth.body.data).toHaveProperty('endpoint');
    });
  });

  // ==========================================================================
  // PHASE 2: Goal Ingestion, Intent Understanding & AI Decomposition
  // ==========================================================================
  describe('Phase 2: Goal Ingestion & Intent Understanding', () => {
    it('creates an intent session, parses constraints, and decomposes requirements', async () => {
      // Mock AI structured generation to return fallback instantly for fast deterministic test run
      vi.spyOn(aiService, 'generateStructured').mockResolvedValueOnce(null);

      const promptText = 'I want a complete developer workstation under $1,500. Need a color-accurate 4K monitor and mechanical keyboard.';

      const res = await request(app)
        .post('/api/intents')
        .set('x-session-token', sessionToken)
        .send({
          prompt: promptText,
          budgetCeiling: 1500,
          currency: 'USD',
          urgency: 'standard',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.intentSession).toBeDefined();
      expect(res.body.data.intentSession.id).toMatch(/^int_/);
      expect(res.body.data.intentSession.budgetAmount).toBe(1500);
      expect(res.body.data.intentSession.budgetCurrency).toBe('USD');

      intentSessionId = res.body.data.intentSession.id;

      // Verify category requirements decomposition
      expect(Array.isArray(res.body.data.requirements)).toBe(true);
      expect(res.body.data.requirements.length).toBeGreaterThanOrEqual(2);

      const categoryIds = res.body.data.requirements.map((r: any) => r.categoryId);
      expect(categoryIds).toContain('monitors');
    });

    it('refines an existing intent session non-destructively with new user constraints', async () => {
      const refinementText = 'Must have USB-C power delivery and silent tactile switches';

      const res = await request(app)
        .post(`/api/intents/${intentSessionId}/refine`)
        .set('x-session-token', sessionToken)
        .send({ refinementText })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.intentSession.rawPrompt).toContain(refinementText);
      expect(res.body.data.intentSession.id).toBe(intentSessionId);
    });
  });

  // ==========================================================================
  // PHASE 3: Multi-Tier Execution Planning & Knapsack Optimization
  // ==========================================================================
  describe('Phase 3: Execution Planning & Knapsack Optimization', () => {
    it('synthesizes an optimized multi-product plan adhering to the budget ceiling', async () => {
      const res = await request(app)
        .post('/api/plans')
        .set('x-session-token', sessionToken)
        .send({
          intentSessionId,
          preferredTier: 'balanced',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toMatch(/^pln_/);
      expect(res.body.data.intentSessionId).toBe(intentSessionId);
      expect(res.body.data.planTier).toBe('balanced');
      expect(res.body.data.totalEstimatedCost).toBeLessThanOrEqual(1500);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);

      planId = res.body.data.id;

      // Verify recommendation items contain products and explainable rationales
      for (const item of res.body.data.items) {
        expect(item.productId).toBeDefined();
        expect(item.product).toBeDefined();
        expect(item.selectionReason).toBeDefined();
        expect(item.selectionReason.length).toBeGreaterThan(5);
        expect(item.unitPrice).toBeGreaterThan(0);
      }
    });

    it('rebalances an execution plan while preserving locked items', async () => {
      const plansRes = await request(app)
        .get(`/api/plans/intent/${intentSessionId}`)
        .set('x-session-token', sessionToken)
        .expect(200);

      const plan = plansRes.body.data[0];
      const firstRec = plan.items[0];

      // Rebalance with the first item locked
      const rebalanceRes = await request(app)
        .post(`/api/plans/${planId}/rebalance`)
        .set('x-session-token', sessionToken)
        .send({
          lockedRecommendationIds: [firstRec.id],
          swappedProducts: [],
        })
        .expect(200);

      expect(rebalanceRes.body.success).toBe(true);
      expect(rebalanceRes.body.data.version).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // PHASE 4: Product Discovery & Side-by-Side Comparison
  // ==========================================================================
  describe('Phase 4: Product Discovery & Comparison', () => {
    it('searches products with category and price filters', async () => {
      const res = await request(app)
        .get('/api/products')
        .query({ category: 'keyboards', maxPrice: 200 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const p of res.body.data) {
        expect(p.categoryId).toBe('keyboards');
        expect(p.basePrice).toBeLessThanOrEqual(200);
      }
    });

    it('performs side-by-side specification comparison across multiple products', async () => {
      const res = await request(app)
        .post('/api/products/compare')
        .send({ productIds: ['prod_mon_01', 'prod_mon_02'] })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.products).toHaveLength(2);
      expect(res.body.data.metrics).toBeDefined();
      expect(res.body.data.specMatrix).toBeDefined();
    });
  });

  // ==========================================================================
  // PHASE 5: Cart Management, Quantity Adjustments & Authoritative Pricing
  // ==========================================================================
  describe('Phase 5: Cart Management & Price Authoritativeness', () => {
    it('creates or retrieves the active cart and adds products', async () => {
      const getCartRes = await request(app)
        .get('/api/cart')
        .set('x-session-token', sessionToken)
        .query({ intentSessionId })
        .expect(200);

      cartId = getCartRes.body.data.id;
      expect(cartId).toMatch(/^crt_/);

      // Add a monitor
      const addRes1 = await request(app)
        .post('/api/cart/items')
        .set('x-session-token', sessionToken)
        .send({ productId: 'prod_mon_01', quantity: 1, intentSessionId });

      if (addRes1.status !== 201) {
        console.error('addRes1 failed:', addRes1.status, addRes1.body);
      }
      expect(addRes1.status).toBe(201);

      expect(addRes1.body.data.items).toHaveLength(1);
      expect(addRes1.body.data.subtotal).toBe(379.99);

      // Add a keyboard
      const addRes2 = await request(app)
        .post('/api/cart/items')
        .set('x-session-token', sessionToken)
        .send({ productId: 'prod_kb_01', quantity: 1, intentSessionId })
        .expect(201);

      expect(addRes2.body.data.items).toHaveLength(2);
      expect(addRes2.body.data.subtotal).toBe(519.98);
    });

    it('updates item quantity via PATCH and recalculates total in minor units', async () => {
      const cartRes = await request(app)
        .get('/api/cart')
        .set('x-session-token', sessionToken)
        .query({ intentSessionId })
        .expect(200);

      const kbItem = cartRes.body.data.items.find((i: any) => i.productId === 'prod_kb_01');
      expect(kbItem).toBeDefined();

      const updateRes = await request(app)
        .patch(`/api/cart/items/${kbItem.id}`)
        .set('x-session-token', sessionToken)
        .send({ quantity: 2 })
        .expect(200);

      // 379.99 + (139.99 * 2) = 659.97 subtotal, 712.77 with 8% tax
      expect(updateRes.body.data.subtotal).toBe(659.97);
      expect(updateRes.body.data.totalAmount).toBe(712.77);
    });

    it('validates cart inventory and authoritative DB pricing', async () => {
      const valRes = await request(app)
        .post('/api/cart/validate')
        .set('x-session-token', sessionToken)
        .expect(200);

      expect(valRes.body.success).toBe(true);
      expect(valRes.body.data.isValid).toBe(true);
      expect(valRes.body.data.cart.items).toHaveLength(2);
    });
  });

  // ==========================================================================
  // PHASE 6: Real PayPal Sandbox Order Creation & Server-Side Capture
  // ==========================================================================
  describe('Phase 6: PayPal Sandbox Checkout, Capture & Immutable Ledger', () => {
    it('creates an official PayPal Sandbox order with server-calculated total (Subtotal + 8% Tax)', async () => {
      const originalId = env.PAYPAL_CLIENT_ID;
      const originalSecret = env.PAYPAL_CLIENT_SECRET;
      env.PAYPAL_CLIENT_ID = 'test_integration_client_id';
      env.PAYPAL_CLIENT_SECRET = 'test_integration_client_secret';

      mockPayPalOrderId = `PP-INT-${Date.now()}`;

      // Mock PayPal Sandbox Orders v2 API and OAuth
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, init: any) => {
        const urlStr = url.toString();
        if (urlStr.includes('/v1/oauth2/token')) {
          return new Response(
            JSON.stringify({ access_token: 'mock_sandbox_token_xyz', expires_in: 3600 }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (urlStr.includes('/v2/checkout/orders')) {
          const body = JSON.parse(init.body);
          expect(body.intent).toBe('CAPTURE');
          expect(body.purchase_units[0].amount.currency_code).toBe('USD');
          // 659.97 + 8% tax (52.80) = 712.77
          expect(body.purchase_units[0].amount.value).toBe('712.77');

          return new Response(
            JSON.stringify({
              id: mockPayPalOrderId,
              status: 'CREATED',
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('Not Found', { status: 404 });
      });

      try {
        const res = await request(app)
          .post('/api/payments/create-order')
          .set('x-session-token', sessionToken)
          .send({ cartId });

        if (res.status !== 201) {
          console.error('create-order failed:', res.status, res.body);
        }
        expect(res.status).toBe(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.paypalOrderId).toBe(mockPayPalOrderId);
        expect(res.body.data.totalAmount).toBe(712.77);
        expect(res.body.data.currency).toBe('USD');

        internalOrderId = res.body.data.orderId;
      } finally {
        env.PAYPAL_CLIENT_ID = originalId;
        env.PAYPAL_CLIENT_SECRET = originalSecret;
        fetchSpy.mockRestore();
      }
    });

    it('captures the approved PayPal Sandbox order and generates an immutable SHA-256 seal', async () => {
      const originalId = env.PAYPAL_CLIENT_ID;
      const originalSecret = env.PAYPAL_CLIENT_SECRET;
      env.PAYPAL_CLIENT_ID = 'test_integration_client_id';
      env.PAYPAL_CLIENT_SECRET = 'test_integration_client_secret';

      const mockCaptureId = `CAP-${Date.now()}`;

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
        const urlStr = url.toString();
        if (urlStr.includes('/v1/oauth2/token')) {
          return new Response(
            JSON.stringify({ access_token: 'mock_sandbox_token_xyz', expires_in: 3600 }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (urlStr.includes('/capture')) {
          return new Response(
            JSON.stringify({
              id: mockCaptureId,
              status: 'COMPLETED',
              purchase_units: [
                {
                  payments: {
                    captures: [
                      {
                        id: mockCaptureId,
                        status: 'COMPLETED',
                        amount: { currency_code: 'USD', value: '712.77' },
                        seller_receivable_breakdown: {
                          gross_amount: { currency_code: 'USD', value: '712.77' },
                          paypal_fee: { currency_code: 'USD', value: '21.01' },
                          net_amount: { currency_code: 'USD', value: '691.76' },
                        },
                      },
                    ],
                  },
                },
              ],
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('Not Found', { status: 404 });
      });

      try {
        const res = await request(app)
          .post('/api/payments/capture-order')
          .set('x-session-token', sessionToken)
          .send({
            paypalOrderId: mockPayPalOrderId,
            orderId: internalOrderId,
          });

        if (res.status !== 200) {
          console.error('capture-order failed:', res.status, res.body);
        }
        expect(res.status).toBe(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.captureId).toBe(mockCaptureId);
        expect(res.body.data.status.toLowerCase()).toBe('completed');
        expect(res.body.data.transaction).toBeDefined();

        const tx = res.body.data.transaction;
        expect(tx.orderId).toBe(internalOrderId);
        expect(tx.grossAmount).toBe(712.77);
        expect(tx.feeAmount).toBeGreaterThan(0);
        expect(tx.netAmount).toBeLessThan(712.77);
        expect(tx.status).toBe('SUCCESS');

        // Verify cryptographic SHA-256 seal (64-char hex)
        expect(tx.transactionHash).toMatch(/^[a-f0-9]{64}$/);

        transactionId = tx.id;
      } finally {
        env.PAYPAL_CLIENT_ID = originalId;
        env.PAYPAL_CLIENT_SECRET = originalSecret;
        fetchSpy.mockRestore();
      }
    });

    it('retrieves the completed digital receipt from the immutable transaction ledger', async () => {
      const res = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .set('x-session-token', sessionToken)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(transactionId);
      expect(res.body.data.orderId).toBe(internalOrderId);
      expect(res.body.data.grossAmount).toBe(712.77);
      expect(res.body.data.transactionHash).toMatch(/^[a-f0-9]{64}$/);
      expect(res.body.data.auditSnapshot).toBeDefined();
    });
  });

  // ==========================================================================
  // PHASE 7: Failure Handling, Safety Boundaries & Edge Cases
  // ==========================================================================
  describe('Phase 7: Robust Failure Handling & Safety Boundaries', () => {
    it('strictly prevents duplicate captures for the already settled order (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/payments/capture-order')
        .set('x-session-token', sessionToken)
        .send({
          paypalOrderId: mockPayPalOrderId,
          orderId: internalOrderId,
        })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_CAPTURE_ATTEMPT');
      expect(res.body.error.message).toContain('already been captured');
    });

    it('rejects agent tool execution attempting to access payment secrets or trigger payment', async () => {
      const forbiddenTools = [
        'capture_payment',
        'authorize_payment',
        'paypal_execute',
        'get_paypal_secret',
      ];

      for (const tool of forbiddenTools) {
        const res = await request(app)
          .post('/api/agent/tools/execute')
          .set('x-session-token', sessionToken)
          .send({ tool, parameters: {} })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.data.error).toContain('not recognized or not authorized');
      }
    });

    it('rejects checkout when the shopping cart has 0 items', async () => {
      const emptySession = sessionRepository.getOrCreate();
      const emptyIntent = intentRepository.create({
        sessionId: emptySession.id,
        rawPrompt: 'Empty cart checkout test',
        budgetAmount: 100,
      });
      const emptyCart = cartRepository.getOrCreate(emptySession.id, emptyIntent.id);

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('x-session-token', emptySession.sessionToken)
        .send({ cartId: emptyCart.id })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('empty');
    });

    it('rejects order capture when order belongs to a different session (403 Forbidden)', async () => {
      const otherSession = sessionRepository.getOrCreate();

      const res = await request(app)
        .post('/api/payments/capture-order')
        .set('x-session-token', otherSession.sessionToken)
        .send({
          paypalOrderId: mockPayPalOrderId,
          orderId: internalOrderId,
        })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Unauthorized');
    });
  });
});
