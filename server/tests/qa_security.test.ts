import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import {
  sessionRepository,
  intentRepository,
  cartRepository,
  orderRepository,
  transactionRepository,
  productRepository,
} from '../src/db/repository';
import { aiService } from '../src/services/ai.service';
import { intentParserService } from '../src/services/intentParser.service';
import { agentPlanningService } from '../src/services/agentPlanning.service';
import { env } from '../src/config/env';

describe('Master Prompt 9 — Testing, Security, Reliability & Optimization Suite', () => {
  const app = createApp();

  // ==========================================================================
  // 1. AI SCENARIOS & HALLUCINATION DEFENSE
  // ==========================================================================
  describe('AI Intelligence & Scenario Testing', () => {
    it('handles simple single-product goal without unrequested bundle bloat', () => {
      const parsed = intentParserService.deterministicParseIntent('I just need an ergonomic mouse under $100');
      expect(parsed.budget.amount).toBe(100);
      expect(parsed.categories.length).toBeGreaterThanOrEqual(1);
      // mice should be present
      expect(parsed.categories.some((c) => c.categoryId === 'mice')).toBe(true);
    });

    it('handles complex multi-product goal with strict budget ceiling', () => {
      const parsed = intentParserService.deterministicParseIntent(
        'Dual monitor setup with mechanical keyboard and USB-C dock under $1,200 max hard ceiling'
      );
      expect(parsed.budget.amount).toBe(1200);
      expect(parsed.budget.isHardCeiling).toBe(true);
      expect(parsed.categories.some((c) => c.categoryId === 'monitors')).toBe(true);
      expect(parsed.categories.some((c) => c.categoryId === 'keyboards')).toBe(true);
    });

    it('identifies missing requirements and formulates clarifying questions', () => {
      const parsed = intentParserService.deterministicParseIntent('I want to buy some tech for my office');
      expect(parsed.clarifyingQuestions.length).toBeGreaterThan(0);
      expect(parsed.clarifyingQuestions.some((q) => q.toLowerCase().includes('budget'))).toBe(true);
      expect(parsed.missingInformation.length).toBeGreaterThan(0);
    });

    it('detects and flags contradictory user preferences gracefully', () => {
      const parsed = intentParserService.deterministicParseIntent(
        'I want a silent mechanical keyboard with clicky blue switches, completely wireless but wired only'
      );
      expect(parsed.restrictions.some((r) => r.toLowerCase().includes('conflict'))).toBe(true);
    });

    it('handles out-of-catalog categories gracefully without unhandled exceptions', async () => {
      const session = sessionRepository.getOrCreate();
      const intent = intentRepository.create({
        sessionId: session.id,
        rawPrompt: 'I want a drone and a space rocket under $500',
        budgetAmount: 500,
      });

      // Plan creation must not crash when no catalog products match the requested category
      const plan = await agentPlanningService.createPlanForIntent(intent.id, 'balanced');
      expect(plan).toBeDefined();
      expect(plan.items.length).toBeGreaterThan(0);
      expect(plan.totalEstimatedCost).toBeGreaterThan(0);
    });

    it('guarantees AI does not fabricate product information (Anti-Hallucination)', () => {
      const allCatalog = productRepository.getAll();
      const catalogIds = new Set(allCatalog.map((p) => p.id));

      const session = sessionRepository.getOrCreate();
      const intent = intentRepository.create({
        sessionId: session.id,
        rawPrompt: 'Developer setup under $1000',
        budgetAmount: 1000,
      });

      return agentPlanningService.createPlanForIntent(intent.id, 'balanced').then((plan) => {
        for (const item of plan.items) {
          // Verify every recommended item strictly exists in the real catalog
          expect(catalogIds.has(item.productId)).toBe(true);
          const realProduct = productRepository.getById(item.productId);
          expect(realProduct).toBeDefined();
          expect(item.unitPrice).toBe(realProduct!.basePrice);
        }
      });
    });

    it('enforces Truth-in-Labeling when local Ollama is offline or times out', async () => {
      // Mock Ollama offline
      vi.spyOn(aiService, 'generateStructured').mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/intents')
        .send({ prompt: 'Workstation under $1000' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.meta.isAiGenerated).toBe(false);
      expect(res.body.meta.engine).toBe('deterministic-fallback');
    });

    it('handles user mind changes non-destructively through intent refinement', async () => {
      const session = sessionRepository.getOrCreate();
      const intent = intentRepository.create({
        sessionId: session.id,
        rawPrompt: 'Monitor and keyboard under $500',
        budgetAmount: 500,
      });

      // User refines: adds headphones and bumps budget to $750
      const res = await request(app)
        .post(`/api/intents/${intent.id}/refine`)
        .set('x-session-token', session.sessionToken)
        .send({ refinementText: 'Actually add headphones and increase budget to $750' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.intentSession.budgetAmount).toBe(750);
      expect(res.body.data.intentSession.rawPrompt).toContain('Actually add headphones');
      expect(res.body.data.requirements.some((r: any) => r.categoryId === 'headphones')).toBe(true);
    });
  });

  // ==========================================================================
  // 2. PAYMENT & SESSION SECURITY TESTING (IDOR, CREDENTIALS, TAMPERING)
  // ==========================================================================
  describe('Payment Security & Authorization Boundaries', () => {
    it('strictly prevents client-side price tampering by recalculating authoritative DB prices', async () => {
      const session = sessionRepository.getOrCreate();
      const intent = intentRepository.create({
        sessionId: session.id,
        rawPrompt: 'Shopping goal',
        budgetAmount: 1000,
      });

      const cart = cartRepository.getOrCreate(session.id, intent.id);

      // Attempt to add a product (client cannot pass a unitPrice)
      const res = await request(app)
        .post('/api/cart/items')
        .set('x-session-token', session.sessionToken)
        .send({
          productId: 'prod_mon_01', // Real basePrice is 379.99
          quantity: 1,
          intentSessionId: intent.id,
          unitPrice: 0.01, // Injected malicious price
        })
        .expect(201);

      // Verify server fetched authoritative price from DB
      const addedItem = res.body.data.items.find((i: any) => i.productId === 'prod_mon_01');
      expect(addedItem.unitPrice).toBe(379.99);
      expect(res.body.data.subtotal).toBe(379.99);
    });

    it('supports atomic cart synchronization via POST /api/cart/sync', async () => {
      const session = sessionRepository.getOrCreate();
      const intent = intentRepository.create({
        sessionId: session.id,
        rawPrompt: 'Workstation setup',
        budgetAmount: 1500,
      });

      const res = await request(app)
        .post('/api/cart/sync')
        .set('x-session-token', session.sessionToken)
        .send({
          intentSessionId: intent.id,
          items: [
            { productId: 'prod_mon_01', quantity: 1 },
            { productId: 'prod_kb_01', quantity: 2 },
          ],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(2);
      // 379.99 + (139.99 * 2) = 659.97
      expect(res.body.data.subtotal).toBe(659.97);
      expect(res.body.data.totalAmount).toBe(712.77); // with 8% tax
    });

    it('blocks Insecure Direct Object Reference (IDOR) on Orders (403 Forbidden)', async () => {
      const userA = sessionRepository.getOrCreate();
      const userB = sessionRepository.getOrCreate();

      const intentA = intentRepository.create({
        sessionId: userA.id,
        rawPrompt: 'User A setup',
        budgetAmount: 500,
      });
      const cartA = cartRepository.getOrCreate(userA.id, intentA.id);
      cartRepository.addItem(cartA.id, 'prod_kb_01', 1);

      // Create order for user A
      const createOrderRes = await request(app)
        .post('/api/orders')
        .set('x-session-token', userA.sessionToken)
        .send({ cartId: cartA.id })
        .expect(201);

      const orderAId = createOrderRes.body.data.id;

      // User B attempts to access User A's order
      const idorRes = await request(app)
        .get(`/api/orders/${orderAId}`)
        .set('x-session-token', userB.sessionToken)
        .expect(403);

      expect(idorRes.body.success).toBe(false);
      expect(idorRes.body.error.code).toBe('UNAUTHORIZED_ACCESS');
    });

    it('blocks Insecure Direct Object Reference (IDOR) on Transactions (403 Forbidden)', async () => {
      const userA = sessionRepository.getOrCreate();
      const userB = sessionRepository.getOrCreate();

      const intentA = intentRepository.create({
        sessionId: userA.id,
        rawPrompt: 'User A setup',
        budgetAmount: 500,
      });
      const cartA = cartRepository.getOrCreate(userA.id, intentA.id);
      cartRepository.addItem(cartA.id, 'prod_kb_01', 1);

      const orderA = orderRepository.createFromCart(cartA, userA.id);

      const payAId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const ppOrderId = `PP-IDOR-${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const { getDatabase } = await import('../src/db');
      getDatabase().prepare(`
        INSERT INTO payments (id, order_id, provider, paypal_order_id, status, amount, currency)
        VALUES (?, ?, 'paypal', ?, 'completed', ?, 'USD')
      `).run(payAId, orderA.id, ppOrderId, orderA.totalAmount);

      const txA = transactionRepository.create({
        paymentId: payAId,
        orderId: orderA.id,
        sessionId: userA.id,
        status: 'SUCCESS',
        grossAmount: orderA.totalAmount,
        currency: 'USD',
        intentSummary: 'User A Confidential Order',
        auditSnapshot: {},
      });

      // User B attempts to read User A's transaction
      const idorRes = await request(app)
        .get(`/api/transactions/${txA.id}`)
        .set('x-session-token', userB.sessionToken)
        .expect(403);

      expect(idorRes.body.success).toBe(false);
      expect(idorRes.body.error.code).toBe('UNAUTHORIZED_ACCESS');
    });

    it('blocks Insecure Direct Object Reference (IDOR) on Intent Sessions (403 Forbidden)', async () => {
      const userA = sessionRepository.getOrCreate();
      const userB = sessionRepository.getOrCreate();

      const intentA = intentRepository.create({
        sessionId: userA.id,
        rawPrompt: 'User A Private Goal',
        budgetAmount: 1000,
      });

      // User B attempts to read User A's intent
      const readRes = await request(app)
        .get(`/api/intents/${intentA.id}`)
        .set('x-session-token', userB.sessionToken)
        .expect(403);

      expect(readRes.body.success).toBe(false);

      // User B attempts to refine User A's intent
      const refineRes = await request(app)
        .post(`/api/intents/${intentA.id}/refine`)
        .set('x-session-token', userB.sessionToken)
        .send({ refinementText: 'Malicious modification' })
        .expect(403);

      expect(refineRes.body.success).toBe(false);
    });

    it('blocks Insecure Direct Object Reference (IDOR) on Execution Plans (403 Forbidden)', async () => {
      const userA = sessionRepository.getOrCreate();
      const userB = sessionRepository.getOrCreate();

      const intentA = intentRepository.create({
        sessionId: userA.id,
        rawPrompt: 'User A Secret Setup',
        budgetAmount: 1000,
      });

      // User B attempts to create plan for User A's intent
      const createPlanRes = await request(app)
        .post('/api/plans')
        .set('x-session-token', userB.sessionToken)
        .send({ intentSessionId: intentA.id, preferredTier: 'balanced' })
        .expect(403);

      expect(createPlanRes.body.success).toBe(false);

      // User B attempts to read plans for User A's intent
      const getPlansRes = await request(app)
        .get(`/api/plans/intent/${intentA.id}`)
        .set('x-session-token', userB.sessionToken)
        .expect(403);

      expect(getPlansRes.body.success).toBe(false);
    });

    it('never leaks PAYPAL_CLIENT_SECRET in public config or error responses', async () => {
      const res = await request(app).get('/api/payments/config').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('clientId');
      expect(res.body.data).toHaveProperty('environment');
      expect(res.body.data).not.toHaveProperty('clientSecret');
      expect(res.body.data).not.toHaveProperty('secret');

      const bodyString = JSON.stringify(res.body);
      expect(bodyString).not.toContain(env.PAYPAL_CLIENT_SECRET);
    });

    it('strictly isolates AI agent tools from payment credentials and execution', async () => {
      const session = sessionRepository.getOrCreate();

      const forbiddenTools = [
        'capture_payment',
        'create_order',
        'execute_transaction',
        'get_paypal_secret',
        'bypass_approval',
      ];

      for (const tool of forbiddenTools) {
        const res = await request(app)
          .post('/api/agent/tools/execute')
          .set('x-session-token', session.sessionToken)
          .send({ tool, parameters: {} })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.data.error).toContain('not recognized or not authorized');
      }
    });

    it('strictly prevents duplicate PayPal order capture (409 Conflict)', async () => {
      const session = sessionRepository.getOrCreate();
      const intent = intentRepository.create({
        sessionId: session.id,
        rawPrompt: 'Duplicate capture test',
        budgetAmount: 500,
      });
      const cart = cartRepository.getOrCreate(session.id, intent.id);
      cartRepository.addItem(cart.id, 'prod_kb_01', 1);

      // Mock PayPal credentials
      const origId = env.PAYPAL_CLIENT_ID;
      const origSecret = env.PAYPAL_CLIENT_SECRET;
      env.PAYPAL_CLIENT_ID = 'test_qa_client_id';
      env.PAYPAL_CLIENT_SECRET = 'test_qa_client_secret';

      const mockPpId = `PP-QA-${Date.now()}`;
      const mockCapId = `CAP-QA-${Date.now()}`;

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
        const urlStr = url.toString();
        if (urlStr.includes('/v1/oauth2/token')) {
          return new Response(JSON.stringify({ access_token: 'mock_token', expires_in: 3600 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (urlStr.includes('/v2/checkout/orders') && !urlStr.includes('/capture')) {
          return new Response(JSON.stringify({ id: mockPpId, status: 'CREATED' }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (urlStr.includes('/capture')) {
          return new Response(
            JSON.stringify({
              id: mockCapId,
              status: 'COMPLETED',
              purchase_units: [
                {
                  payments: {
                    captures: [
                      {
                        id: mockCapId,
                        status: 'COMPLETED',
                        amount: { currency_code: 'USD', value: '151.19' }, // 139.99 * 1.08 = 151.1892 -> 151.19
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
        const createOrderRes = await request(app)
          .post('/api/payments/create-order')
          .set('x-session-token', session.sessionToken)
          .send({ cartId: cart.id })
          .expect(201);

        const internalOrderId = createOrderRes.body.data.orderId;

        // First capture: succeeds
        const captureRes = await request(app)
          .post('/api/payments/capture-order')
          .set('x-session-token', session.sessionToken)
          .send({ paypalOrderId: mockPpId, orderId: internalOrderId })
          .expect(200);

        expect(captureRes.body.success).toBe(true);
        expect(captureRes.body.data.status).toBe('completed');

        // Second capture attempt: MUST fail with 409 Conflict
        const duplicateRes = await request(app)
          .post('/api/payments/capture-order')
          .set('x-session-token', session.sessionToken)
          .send({ paypalOrderId: mockPpId, orderId: internalOrderId })
          .expect(409);

        expect(duplicateRes.body.success).toBe(false);
        expect(duplicateRes.body.error.code).toBe('DUPLICATE_CAPTURE_ATTEMPT');
      } finally {
        env.PAYPAL_CLIENT_ID = origId;
        env.PAYPAL_CLIENT_SECRET = origSecret;
        fetchSpy.mockRestore();
      }
    });
  });
});
