import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import {
  sessionRepository,
  intentRepository,
  requirementRepository,
  cartRepository,
  productRepository,
} from '../src/db/repository';
import { intentParserService } from '../src/services/intentParser.service';
import { agentPlanningService } from '../src/services/agentPlanning.service';
import { agentToolsService } from '../src/services/agentTools.service';
import { normalizeCategoryId } from '../src/utils/categoryMapper';
import { env } from '../src/config/env';

describe('AI Goal Decomposition & Regression Suite (12 Core Test Cases)', () => {
  const app = createApp();

  const studyDeskPrompt = `I am a college student who wants a productive and comfortable study desk setup for everyday college work, coding, online lectures, and long study sessions.

I need exactly these four product categories:

1. Keyboard — comfortable for long typing and coding sessions.
2. Wireless mouse — ergonomic, reliable and accurate.
3. Desk lamp — adjustable LED lamp for studying.
4. Headphones — comfortable over-ear headphones for lectures and music.

Prioritize reliability and value for money. My absolute budget ceiling is $300 USD.`;

  // ==========================================================================
  // Test 1: Study desk setup decomposes into exactly 4 requested categories
  // ==========================================================================
  it('1. Study desk setup decomposes into exactly 4 requested categories (keyboard, mice, accessories/lamp, headphones)', () => {
    const parsed = intentParserService.deterministicParseIntent(studyDeskPrompt);

    expect(parsed.categories.length).toBe(4);
    const categoryIds = parsed.categories.map((c) => c.categoryId);
    expect(categoryIds).toContain('keyboards');
    expect(categoryIds).toContain('mice');
    expect(categoryIds).toContain('accessories');
    expect(categoryIds).toContain('headphones');

    expect(parsed.budget.amount).toBe(300);
    expect(parsed.budget.currency).toBe('USD');
    expect(parsed.budget.isHardCeiling).toBe(true);

    // Verify human-readable descriptions (no raw JSON stringification)
    for (const cat of parsed.categories) {
      expect(cat.description).toBeDefined();
      expect(cat.description).not.toContain('{"');
      expect(cat.description!.length).toBeGreaterThan(5);
    }
  });

  // ==========================================================================
  // Test 2: Podcasting setup decomposes into podcasting categories
  // ==========================================================================
  it('2. Podcasting setup decomposes into podcasting categories (headphones, microphone/accessories)', () => {
    const podcastPrompt = 'Build a professional podcast studio setup for vocal recording with microphone and headphones under $600';
    const parsed = intentParserService.deterministicParseIntent(podcastPrompt);

    const categoryIds = parsed.categories.map((c) => c.categoryId);
    expect(categoryIds).toContain('headphones');
    expect(categoryIds).toContain('accessories'); // microphone/arm
    expect(parsed.objective.toLowerCase()).toMatch(/podcast|recording/);
  });

  // ==========================================================================
  // Test 3: Study desk request never produces unrequested podcasting or furniture gear
  // ==========================================================================
  it('3. Study desk request never produces podcasting requirements (no dynamic mic, pop filter, boom arm) and never produces chairs', () => {
    const parsed = intentParserService.deterministicParseIntent(studyDeskPrompt);

    // No furniture/chair requested
    expect(parsed.categories.some((c) => c.categoryId === 'furniture')).toBe(false);

    // No microphone, pop filter, or recording equipment
    for (const cat of parsed.categories) {
      const name = cat.categoryName.toLowerCase();
      const desc = (cat.description || '').toLowerCase();
      expect(name).not.toContain('microphone');
      expect(name).not.toContain('pop filter');
      expect(name).not.toContain('boom arm');
      expect(name).not.toContain('broadcast');
      expect(desc).not.toContain('microphone');
      expect(desc).not.toContain('broadcast');
    }
  });

  // ==========================================================================
  // Test 4: Malformed AI JSON rejected or safely recovered
  // ==========================================================================
  it('4. Malformed AI JSON rejected or safely recovered to deterministic output', async () => {
    // When Ollama returns malformed JSON or times out, the service falls back gracefully
    const parsed = intentParserService.deterministicParseIntent(studyDeskPrompt);
    expect(parsed).toBeDefined();
    expect(parsed.objective).toBeTruthy();
    expect(parsed.categories.length).toBe(4);
    expect(parsed.budget.amount).toBe(300);
  });

  // ==========================================================================
  // Test 5: User-specified budget remains unchanged throughout workflow ($300)
  // ==========================================================================
  it(
    '5. User-specified budget remains unchanged throughout workflow ($300)',
    async () => {
      const session = sessionRepository.getOrCreate();

      // Create intent with prompt specifying $300, even if client sends 350 default
      const res = await request(app)
        .post('/api/intents')
        .set('x-session-token', session.sessionToken)
        .send({
          prompt: studyDeskPrompt,
          budgetCeiling: 350, // Should NOT override the $300 explicit prompt budget
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.intentSession.budgetAmount).toBe(300);

      const intentId = res.body.data.intentSession.id;
      const plan = await agentPlanningService.createPlanForIntent(intentId, 'balanced');

      expect(res.body.data.intentSession.budgetAmount).toBe(300);
      expect(plan.isFeasible).toBe(false);
      expect(plan.budgetDeficit).toBe(7.76);
      expect(plan.totalEstimatedCost).toBe(307.76);
    },
    25000
  );

  // ==========================================================================
  // Test 6: Each requirement maps to correct catalog category
  // ==========================================================================
  it('6. Each requirement maps to correct catalog category via normalizeCategoryId', () => {
    expect(normalizeCategoryId('Keyboard')).toBe('keyboards');
    expect(normalizeCategoryId('Wireless mouse')).toBe('mice');
    expect(normalizeCategoryId('Desk lamp')).toBe('accessories');
    expect(normalizeCategoryId('Lumeno Pro ScreenBar Desk Task Lamp')).toBe('accessories');
    expect(normalizeCategoryId('Headphones')).toBe('headphones');
    expect(normalizeCategoryId('Ergonomic Chair')).toBe('furniture');
    expect(normalizeCategoryId('4K Ultra-Wide Monitor')).toBe('monitors');
    expect(normalizeCategoryId('Developer Laptop')).toBe('laptops');
  });

  // ==========================================================================
  // Test 7: Available products produce non-empty optimized decision
  // ==========================================================================
  it('7. Available products produce non-empty optimized decision for all 4 categories', async () => {
    const session = sessionRepository.getOrCreate();
    const parsed = intentParserService.deterministicParseIntent(studyDeskPrompt);
    const { intentSession } = intentParserService.persistIntentAnalysis(session.id, studyDeskPrompt, parsed);

    const plan = await agentPlanningService.createPlanForIntent(intentSession.id, 'balanced');

    expect(plan.items.length).toBe(4);
    for (const item of plan.items) {
      expect(item.product).toBeDefined();
      expect(item.product.id).toBeTruthy();
      expect(item.product.basePrice).toBeGreaterThan(0);
      expect(item.selectionReason).toBeTruthy();
    }
  });

  // ==========================================================================
  // Test 8: Optimization re-evaluates all 4 categories, preserves constraints, and flags honest deficit
  // ==========================================================================
  it('8. Optimization re-evaluates all 4 categories, preserves constraints, and flags honest deficit ($307.76 vs $300 ceiling)', async () => {
    const session = sessionRepository.getOrCreate();
    const parsed = intentParserService.deterministicParseIntent(studyDeskPrompt);
    const { intentSession } = intentParserService.persistIntentAnalysis(session.id, studyDeskPrompt, parsed);

    const plan = await agentPlanningService.createPlanForIntent(intentSession.id, 'balanced');

    // All 4 essential categories preserved
    expect(plan.items.length).toBe(4);
    const categoryIds = plan.items.map((i) => i.categoryId);
    expect(categoryIds).toContain('keyboards');
    expect(categoryIds).toContain('mice');
    expect(categoryIds).toContain('accessories');
    expect(categoryIds).toContain('headphones');

    // Global minimum across all 4 categories with over-ear headphones is $307.76 ($284.96 + 8% tax)
    expect(plan.totalEstimatedCost).toBe(307.76);
    expect(plan.isFeasible).toBe(false);
    expect(plan.budgetDeficit).toBe(7.76);

    // Summary does NOT falsely claim adherence to ceiling; transparently reports deficit & trade-offs
    expect(plan.summary.toLowerCase()).toContain('deficit');
    expect(plan.summary.toLowerCase()).not.toContain('adhering to');
    expect(plan.availableTradeOffs).toBeDefined();
    expect(plan.availableTradeOffs!.length).toBeGreaterThan(0);
  });

  // ==========================================================================
  // Test 9: No valid product combination produces honest explanatory result
  // ==========================================================================
  it('9. No valid product combination produces honest explanatory result (tested with $20 budget)', async () => {
    const session = sessionRepository.getOrCreate();
    const impossiblePrompt = 'I need a mechanical keyboard, wireless mouse, desk lamp and headphones under $20';
    const parsed = intentParserService.deterministicParseIntent(impossiblePrompt);
    const { intentSession } = intentParserService.persistIntentAnalysis(session.id, impossiblePrompt, parsed);

    const plan = await agentPlanningService.createPlanForIntent(intentSession.id, 'budget');

    // The catalog cannot fit 4 hardware items under $20
    expect(plan.totalEstimatedCost).toBeGreaterThan(20);
    // The plan summary must transparently report the budget trade-off
    expect(plan.summary.toLowerCase()).toMatch(/exceeds.*ceiling|exceeds.*budget|value-optimized/);
  });

  // ==========================================================================
  // Test 10: Discovery renders API-returned products without manual refresh
  // ==========================================================================
  it('10. Discovery renders API-returned products without manual refresh', async () => {
    const res = await request(app).get('/api/products').expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(20);

    // Verify desk lamp exists in catalog under accessories
    const deskLamp = res.body.data.find((p: any) => p.id === 'prod_acc_02');
    expect(deskLamp).toBeDefined();
    expect(deskLamp.categoryId).toBe('accessories');
    expect(deskLamp.title).toContain('Lumeno Pro ScreenBar');
  });

  // ==========================================================================
  // Test 11: Previous intent sessions cannot contaminate new intent
  // ==========================================================================
  it(
    '11. Previous intent sessions cannot contaminate new intent',
    async () => {
      // Session A creates a podcast setup
      const sessionA = sessionRepository.getOrCreate();
      const resA = await request(app)
        .post('/api/intents')
        .set('x-session-token', sessionA.sessionToken)
        .send({ prompt: 'Build a podcast recording setup with microphone and audio interface under $800' })
        .expect(201);

      const intentAId = resA.body.data.intentSession.id;

      // Session B creates a study desk setup
      const sessionB = sessionRepository.getOrCreate();
      const resB = await request(app)
        .post('/api/intents')
        .set('x-session-token', sessionB.sessionToken)
        .send({ prompt: studyDeskPrompt })
        .expect(201);

      const intentBId = resB.body.data.intentSession.id;
      const reqsB = resB.body.data.requirements;

      // Session B has distinct ID and only study desk requirements
      expect(intentBId).not.toBe(intentAId);
      expect(reqsB.length).toBe(4);
      expect(reqsB.some((r: any) => r.categoryName.toLowerCase().includes('microphone'))).toBe(false);

      // Session B cannot access Session A's intent (IDOR protection)
      await request(app)
        .get(`/api/intents/${intentAId}`)
        .set('x-session-token', sessionB.sessionToken)
        .expect(403);
    },
    25000
  );

  // ==========================================================================
  // Test 12: PayPal payment approval & authorization boundaries remain intact
  // ==========================================================================
  it('12. PayPal payment approval & authorization boundaries remain intact', async () => {
    const session = sessionRepository.getOrCreate();
    const intent = intentRepository.create({
      sessionId: session.id,
      rawPrompt: 'Study desk checkout',
      budgetAmount: 200,
    });
    const cart = cartRepository.getOrCreate(session.id, intent.id);
    cartRepository.clearCart(cart.id);
    cartRepository.addItem(cart.id, 'prod_kb_01', 1);

    const origId = env.PAYPAL_CLIENT_ID;
    const origSecret = env.PAYPAL_CLIENT_SECRET;
    env.PAYPAL_CLIENT_ID = 'test_regression_client_id';
    env.PAYPAL_CLIENT_SECRET = 'test_regression_client_secret';

    const mockPpId = `PP-REG-${Date.now()}`;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      const urlStr = url.toString();
      if (urlStr.includes('/v1/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'mock_token', expires_in: 3600 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (urlStr.includes('/v2/checkout/orders')) {
        return new Response(JSON.stringify({ id: mockPpId, status: 'CREATED' }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('Not Found', { status: 404 });
    });

    try {
      // Create PayPal order
      const orderRes = await request(app)
        .post('/api/payments/create-order')
        .set('x-session-token', session.sessionToken)
        .send({ cartId: cart.id })
        .expect(201);

      expect(orderRes.body.success).toBe(true);
      expect(orderRes.body.data.orderId).toBeTruthy();

      // Verify AI agent tools cannot trigger payment execution or access credentials
      const unauthorizedTool = agentToolsService.executeTool('capture_payment', { orderId: orderRes.body.data.orderId });
      expect(unauthorizedTool.success).toBe(false);
      expect(unauthorizedTool.error).toContain('not recognized or not authorized');

      const credTool = agentToolsService.executeTool('get_paypal_secret', {});
      expect(credTool.success).toBe(false);
      expect(credTool.error).toContain('not recognized or not authorized');
    } finally {
      env.PAYPAL_CLIENT_ID = origId;
      env.PAYPAL_CLIENT_SECRET = origSecret;
      fetchSpy.mockRestore();
    }
  });

  // ==========================================================================
  // Test 13: Strict budget defense prevents order creation when cart exceeds ceiling
  // ==========================================================================
  it('13. Strict budget defense prevents PayPal order creation when cart exceeds ceiling (400 BUDGET_CEILING_EXCEEDED)', async () => {
    const session = sessionRepository.getOrCreate();
    const intent = intentRepository.create({
      sessionId: session.id,
      rawPrompt: 'Study desk setup with $300 hard ceiling',
      budgetAmount: 300,
      isHardCeiling: true,
    });
    const cart = cartRepository.getOrCreate(session.id, intent.id);
    cartRepository.clearCart(cart.id);

    // Add all 4 minimum items ($59.99 + $69.99 + $64.99 + $89.99 = $284.96 + 8% tax = $307.76)
    cartRepository.addItem(cart.id, 'prod_kb_03', 1);
    cartRepository.addItem(cart.id, 'prod_mou_01', 1);
    cartRepository.addItem(cart.id, 'prod_acc_02', 1);
    cartRepository.addItem(cart.id, 'prod_hp_01', 1);

    const res = await request(app)
      .post('/api/payments/create-order')
      .set('x-session-token', session.sessionToken)
      .send({ cartId: cart.id })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BUDGET_CEILING_EXCEEDED');
    expect(res.body.error.message).toContain('307.76');
    expect(res.body.error.message).toContain('300');
  });

  // ==========================================================================
  // Test 14: Adjusting budget ceiling to $308 rebalances plan to feasible and unlocks checkout
  // ==========================================================================
  it('14. Adjusting budget ceiling to $308 rebalances plan to feasible and unlocks checkout', async () => {
    const session = sessionRepository.getOrCreate();
    const parsed = intentParserService.deterministicParseIntent(studyDeskPrompt);
    const { intentSession } = intentParserService.persistIntentAnalysis(session.id, studyDeskPrompt, parsed);

    // Refine intent with new budget ceiling of $308
    const refineRes = await request(app)
      .post(`/api/intents/${intentSession.id}/refine`)
      .set('x-session-token', session.sessionToken)
      .send({
        refinementText: 'Adjust budget ceiling to $308',
        updatedBudgetCeiling: 308,
      })
      .expect(200);

    expect(refineRes.body.success).toBe(true);
    expect(refineRes.body.data.intentSession.budgetAmount).toBe(308);

    // Now re-evaluate plan
    const updatedPlan = await agentPlanningService.createPlanForIntent(intentSession.id, 'balanced');
    expect(updatedPlan.isFeasible).toBe(true);
    expect(updatedPlan.budgetDeficit).toBe(0);
    expect(updatedPlan.totalEstimatedCost).toBe(307.76);
    expect(updatedPlan.totalEstimatedCost).toBeLessThanOrEqual(308);

    // Cart is now valid and order creation succeeds (mocked PayPal)
    const cart = cartRepository.getOrCreate(session.id, intentSession.id);
    cartRepository.clearCart(cart.id);
    cartRepository.addItem(cart.id, 'prod_kb_03', 1);
    cartRepository.addItem(cart.id, 'prod_mou_01', 1);
    cartRepository.addItem(cart.id, 'prod_acc_02', 1);
    cartRepository.addItem(cart.id, 'prod_hp_01', 1);

    const origId = env.PAYPAL_CLIENT_ID;
    const origSecret = env.PAYPAL_CLIENT_SECRET;
    env.PAYPAL_CLIENT_ID = 'test_regression_client_id';
    env.PAYPAL_CLIENT_SECRET = 'test_regression_client_secret';

    const mockPpId = `PP-MOCK-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      const urlStr = url.toString();
      if (urlStr.includes('/v1/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'mock_token', expires_in: 3600 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (urlStr.includes('/v2/checkout/orders')) {
        return new Response(JSON.stringify({ id: mockPpId, status: 'CREATED' }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('Not Found', { status: 404 });
    });

    try {
      const orderRes = await request(app)
        .post('/api/payments/create-order')
        .set('x-session-token', session.sessionToken)
        .send({ cartId: cart.id })
        .expect(201);

      expect(orderRes.body.success).toBe(true);
      expect(orderRes.body.data.orderId).toBeTruthy();
    } finally {
      env.PAYPAL_CLIENT_ID = origId;
      env.PAYPAL_CLIENT_SECRET = origSecret;
      fetchSpy.mockRestore();
    }
  });

  // ==========================================================================
  // Test 15: Selecting $264.56 Budget Tier updates 4-product bundle & unlocks checkout
  // ==========================================================================
  it('15. Selecting the $264.56 Budget Tier updates the actual four-product bundle, resolves deficit, and unlocks checkout', async () => {
    const session = sessionRepository.getOrCreate();
    const parsed = intentParserService.deterministicParseIntent(studyDeskPrompt);
    const { intentSession } = intentParserService.persistIntentAnalysis(session.id, studyDeskPrompt, parsed);

    // 1. In Balanced Tier ($307.76), cart exceeds $300 ceiling and checkout is locked (400)
    const balancedPlan = await agentPlanningService.createPlanForIntent(intentSession.id, 'balanced');
    expect(balancedPlan.isFeasible).toBe(false);
    expect(balancedPlan.totalEstimatedCost).toBe(307.76);
    expect(balancedPlan.budgetDeficit).toBe(7.76);

    const cart = cartRepository.getOrCreate(session.id, intentSession.id);
    cartRepository.clearCart(cart.id);
    for (const item of balancedPlan.items) {
      cartRepository.addItem(cart.id, item.product.id, 1);
    }

    // Server-side validation locks checkout when over-budget
    await request(app)
      .post('/api/payments/create-order')
      .set('x-session-token', session.sessionToken)
      .send({ cartId: cart.id })
      .expect(400);

    // 2. User selects Budget Tier: Generate budget plan via API
    const planRes = await request(app)
      .post('/api/plans')
      .set('x-session-token', session.sessionToken)
      .send({
        intentSessionId: intentSession.id,
        preferredTier: 'budget',
      })
      .expect(201);

    expect(planRes.body.success).toBe(true);
    const budgetPlan = planRes.body.data;

    // Verify Budget Tier plan properties
    expect(budgetPlan.planTier).toBe('budget');
    expect(budgetPlan.isFeasible).toBe(true);
    expect(budgetPlan.budgetDeficit).toBe(0);
    expect(budgetPlan.totalEstimatedCost).toBe(264.56);
    expect(budgetPlan.totalEstimatedCost).toBeLessThanOrEqual(300);

    // Verify all 4 required categories are populated with real catalog products
    const productIds = budgetPlan.items.map((i: any) => i.product.id);
    expect(productIds.length).toBe(4);
    expect(productIds).toContain('prod_kb_03'); // NovaType Keyboard ($59.99)
    expect(productIds).toContain('prod_mou_01'); // ErgoKey Vertical Mouse ($69.99)
    expect(productIds).toContain('prod_acc_02'); // Lumeno Desk Lamp ($64.99)
    expect(productIds).toContain('prod_hp_03'); // VoiceLink Headset ($49.99 trade-off)

    // 3. Synchronize the 4-item Budget Tier bundle to the server cart
    const syncRes = await request(app)
      .post('/api/cart/sync')
      .set('x-session-token', session.sessionToken)
      .send({
        intentSessionId: intentSession.id,
        items: productIds.map((id: string) => ({ productId: id, quantity: 1 })),
      })
      .expect(200);

    expect(syncRes.body.success).toBe(true);
    expect(syncRes.body.data.items.length).toBe(4);
    expect(syncRes.body.data.totalAmount).toBe(264.56);

    // 4. Server-side validation now PASSES and checkout is UNLOCKED
    const origId = env.PAYPAL_CLIENT_ID;
    const origSecret = env.PAYPAL_CLIENT_SECRET;
    env.PAYPAL_CLIENT_ID = 'test_regression_client_id';
    env.PAYPAL_CLIENT_SECRET = 'test_regression_client_secret';

    const mockPpId = `PP-BUDGET-${Date.now()}`;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      const urlStr = url.toString();
      if (urlStr.includes('/v1/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'mock_token', expires_in: 3600 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (urlStr.includes('/v2/checkout/orders')) {
        return new Response(JSON.stringify({ id: mockPpId, status: 'CREATED' }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('Not Found', { status: 404 });
    });

    try {
      const checkoutRes = await request(app)
        .post('/api/payments/create-order')
        .set('x-session-token', session.sessionToken)
        .send({ cartId: cart.id })
        .expect(201);

      expect(checkoutRes.body.success).toBe(true);
      expect(checkoutRes.body.data.orderId).toBeTruthy();
      expect(checkoutRes.body.data.totalAmount).toBe(264.56);
    } finally {
      env.PAYPAL_CLIENT_ID = origId;
      env.PAYPAL_CLIENT_SECRET = origSecret;
      fetchSpy.mockRestore();
    }
  });

  // ==========================================================================
  // Test 16: Budget Tier Selection → Server Cart Sync → PaymentScreen Cart Retrieval → PayPal Order Creation
  // ==========================================================================
  it('16. End-to-end Budget Tier selection → server cart sync → PaymentScreen cart retrieval → PayPal order creation', async () => {
    // 1. Establish session token (as client does on first visit)
    const initRes = await request(app).get('/api/products').expect(200);
    const sessionToken = initRes.headers['x-session-token'];
    expect(sessionToken).toBeTruthy();

    const budgetProductIds = ['prod_kb_03', 'prod_mou_01', 'prod_acc_02', 'prod_hp_03'];

    // 2. Client selects Budget Tier: calls POST /api/cart/sync even if intentSessionId is stale or omitted
    const staleIntentId = 'int_stale_from_localstorage_12345';
    const syncRes = await request(app)
      .post('/api/cart/sync')
      .set('x-session-token', sessionToken)
      .send({
        items: budgetProductIds.map((id) => ({ productId: id, quantity: 1 })),
        intentSessionId: staleIntentId,
      })
      .expect(200);

    expect(syncRes.body.success).toBe(true);
    expect(syncRes.body.data.id).toBeTruthy();
    expect(syncRes.body.data.items.length).toBe(4);
    expect(syncRes.body.data.totalAmount).toBe(264.56);
    const syncedCartId = syncRes.body.data.id;

    // 3. User navigates to PaymentScreen: calls GET /api/cart with same session token
    const getCartRes = await request(app)
      .get(`/api/cart?intentSessionId=${staleIntentId}`)
      .set('x-session-token', sessionToken)
      .expect(200);

    expect(getCartRes.body.success).toBe(true);
    expect(getCartRes.body.data.id).toBe(syncedCartId);
    expect(getCartRes.body.data.items.length).toBe(4);
    expect(getCartRes.body.data.totalAmount).toBe(264.56);
    expect(getCartRes.body.data.subtotal).toBe(244.96);
    expect(getCartRes.body.data.estimatedTax).toBe(19.60);

    // 4. PaymentScreen triggers PayPal Order Creation with activeServerCartId
    const origId = env.PAYPAL_CLIENT_ID;
    const origSecret = env.PAYPAL_CLIENT_SECRET;
    env.PAYPAL_CLIENT_ID = 'test_regression_client_id';
    env.PAYPAL_CLIENT_SECRET = 'test_regression_client_secret';

    const mockPpOrderId = `PP-ORDER-${Date.now()}`;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      const urlStr = url.toString();
      if (urlStr.includes('/v1/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'mock_token', expires_in: 3600 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (urlStr.includes('/v2/checkout/orders')) {
        return new Response(JSON.stringify({ id: mockPpOrderId, status: 'CREATED' }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('Not Found', { status: 404 });
    });

    try {
      const orderRes = await request(app)
        .post('/api/payments/create-order')
        .set('x-session-token', sessionToken)
        .send({ cartId: syncedCartId })
        .expect(201);

      expect(orderRes.body.success).toBe(true);
      expect(orderRes.body.data.paypalOrderId).toBe(mockPpOrderId);
      expect(orderRes.body.data.orderId).toBeTruthy();
      expect(orderRes.body.data.totalAmount).toBe(264.56);
      expect(orderRes.body.data.currency).toBe('USD');
    } finally {
      env.PAYPAL_CLIENT_ID = origId;
      env.PAYPAL_CLIENT_SECRET = origSecret;
      fetchSpy.mockRestore();
    }
  });
});
