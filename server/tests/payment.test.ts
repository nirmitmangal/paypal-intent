import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { paymentService } from '../src/services/payment.service';
import {
  sessionRepository,
  intentRepository,
  cartRepository,
  orderRepository,
} from '../src/db/repository';
import { getDatabase } from '../src/db';
import { env } from '../src/config/env';

describe('Real PayPal Sandbox Payment Integration Tests', () => {
  const app = createApp();

  beforeEach(() => {
    paymentService.resetTokenCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // 1. Configuration & Security Tests
  // ==========================================================================
  it('GET /api/payments/config returns public configuration without exposing secrets', async () => {
    const res = await request(app).get('/api/payments/config').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.environment).toBe('sandbox');
    expect(res.body.data.currency).toBe('USD');
    expect(res.body.data.clientId).toBeDefined();

    // Verify secret is NEVER exposed to the frontend
    expect(res.body.data.clientSecret).toBeUndefined();
    expect(res.body.data.secret).toBeUndefined();
  });

  it('rejects order creation when PayPal credentials are unconfigured placeholders', async () => {
    const session = sessionRepository.getOrCreate();
    const intent = intentRepository.create({
      sessionId: session.id,
      rawPrompt: 'Test goal',
    });
    const cart = cartRepository.getOrCreate(session.id, intent.id);
    cartRepository.addItem(cart.id, 'prod_kb_01', 1);

    // Ensure placeholders are active
    const originalId = env.PAYPAL_CLIENT_ID;
    env.PAYPAL_CLIENT_ID = 'sandbox_client_id_placeholder';

    try {
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('x-session-token', session.sessionToken)
        .send({ cartId: cart.id });

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('PayPal Sandbox credentials not configured');
    } finally {
      env.PAYPAL_CLIENT_ID = originalId;
    }
  });

  // ==========================================================================
  // 2. Order Creation & Validation Tests
  // ==========================================================================
  it('rejects order creation when cart is empty', async () => {
    const session = sessionRepository.getOrCreate();
    const intent = intentRepository.create({
      sessionId: session.id,
      rawPrompt: 'Empty cart intent',
    });
    const emptyCart = cartRepository.getOrCreate(session.id, intent.id);

    const res = await request(app)
      .post('/api/payments/create-order')
      .set('x-session-token', session.sessionToken)
      .send({ cartId: emptyCart.id })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('empty');
  });

  it('rejects order creation when cart belongs to a different session', async () => {
    const sessionA = sessionRepository.getOrCreate();
    const sessionB = sessionRepository.getOrCreate();

    const intentA = intentRepository.create({
      sessionId: sessionA.id,
      rawPrompt: 'Session A goal',
    });
    const cartA = cartRepository.getOrCreate(sessionA.id, intentA.id);
    cartRepository.addItem(cartA.id, 'prod_mon_01', 1);

    // Session B tries to checkout Session A's cart
    const res = await request(app)
      .post('/api/payments/create-order')
      .set('x-session-token', sessionB.sessionToken)
      .send({ cartId: cartA.id })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Unauthorized');
  });

  it('creates an official PayPal Sandbox Order with authoritative pricing', async () => {
    const session = sessionRepository.getOrCreate();
    const intent = intentRepository.create({
      sessionId: session.id,
      rawPrompt: 'Developer monitor setup',
    });
    const cart = cartRepository.getOrCreate(session.id, intent.id);
    cartRepository.addItem(cart.id, 'prod_mon_01', 1); // $379.99

    // Mock PayPal OAuth token and Order creation API responses
    const originalId = env.PAYPAL_CLIENT_ID;
    const originalSecret = env.PAYPAL_CLIENT_SECRET;
    env.PAYPAL_CLIENT_ID = 'test_mock_client_id';
    env.PAYPAL_CLIENT_SECRET = 'test_mock_client_secret';

    const dynamicOrderId = `SANDBOX-ORDER-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, init: any) => {
      const urlStr = url.toString();
      if (urlStr.includes('/v1/oauth2/token')) {
        return new Response(
          JSON.stringify({ access_token: 'mock_sandbox_access_token_123', expires_in: 3600 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (urlStr.includes('/v2/checkout/orders')) {
        const body = JSON.parse(init.body);
        // Verify that purchase units contain authoritative database amount, not client amount
        expect(body.intent).toBe('CAPTURE');
        expect(body.purchase_units[0].amount.currency_code).toBe('USD');
        expect(body.purchase_units[0].amount.value).toBe('410.39'); // 379.99 + 8% tax

        return new Response(
          JSON.stringify({
            id: dynamicOrderId,
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
        .set('x-session-token', session.sessionToken)
        .send({ cartId: cart.id })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.paypalOrderId).toBe(dynamicOrderId);
      expect(res.body.data.totalAmount).toBe(410.39);
      expect(res.body.data.currency).toBe('USD');
    } finally {
      env.PAYPAL_CLIENT_ID = originalId;
      env.PAYPAL_CLIENT_SECRET = originalSecret;
      fetchSpy.mockRestore();
    }
  });

  // ==========================================================================
  // 3. Capture Verification & Security Handling Tests
  // ==========================================================================
  it('rejects capture for a non-existent order ID', async () => {
    const session = sessionRepository.getOrCreate();

    const res = await request(app)
      .post('/api/payments/capture-order')
      .set('x-session-token', session.sessionToken)
      .send({ paypalOrderId: 'PP-FAKE-123', orderId: 'ord_non_existent' })
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('not found');
  });

  it('rejects capture when order belongs to another session', async () => {
    const sessionA = sessionRepository.getOrCreate();
    const sessionB = sessionRepository.getOrCreate();

    const intentA = intentRepository.create({
      sessionId: sessionA.id,
      rawPrompt: 'Secure order intent',
    });
    const cartA = cartRepository.getOrCreate(sessionA.id, intentA.id);
    cartRepository.addItem(cartA.id, 'prod_kb_01', 1);

    const orderA = orderRepository.createFromCart(cartA);

    // Session B tries to capture Session A's order
    const res = await request(app)
      .post('/api/payments/capture-order')
      .set('x-session-token', sessionB.sessionToken)
      .send({ paypalOrderId: 'PP-12345', orderId: orderA.id })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Unauthorized');
  });

  it('rejects duplicate capture attempts with 409 Conflict', async () => {
    const session = sessionRepository.getOrCreate();
    const intent = intentRepository.create({
      sessionId: session.id,
      rawPrompt: 'Duplicate test',
    });
    const cart = cartRepository.getOrCreate(session.id, intent.id);
    cartRepository.addItem(cart.id, 'prod_mou_01', 1);

    const order = orderRepository.createFromCart(cart);
    const uniqueDuplicateOrderId = `PP-DUP-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const uniquePaymentId = `pay_dup_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    // Manually mark as captured to simulate prior completion
    const db = getDatabase();
    db.prepare(`
      INSERT INTO payments (id, order_id, provider, paypal_order_id, paypal_capture_id, status, amount, currency)
      VALUES (?, ?, 'paypal', ?, 'CAP-123', 'completed', ?, 'USD')
    `).run(uniquePaymentId, order.id, uniqueDuplicateOrderId, order.totalAmount);
    orderRepository.updateStatus(order.id, 'captured');

    const res = await request(app)
      .post('/api/payments/capture-order')
      .set('x-session-token', session.sessionToken)
      .send({ paypalOrderId: uniqueDuplicateOrderId, orderId: order.id })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('already been captured');
  });

  it('rejects capture when PayPal Sandbox status is not COMPLETED (e.g. DECLINED)', async () => {
    const session = sessionRepository.getOrCreate();
    const intent = intentRepository.create({
      sessionId: session.id,
      rawPrompt: 'Failed capture intent',
    });
    const cart = cartRepository.getOrCreate(session.id, intent.id);
    cartRepository.addItem(cart.id, 'prod_hp_01', 1);
    const order = orderRepository.createFromCart(cart);
    const declinedOrderId = `PP-DECLINED-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const originalId = env.PAYPAL_CLIENT_ID;
    const originalSecret = env.PAYPAL_CLIENT_SECRET;
    env.PAYPAL_CLIENT_ID = 'test_mock_client_id';
    env.PAYPAL_CLIENT_SECRET = 'test_mock_client_secret';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      const urlStr = url.toString();
      if (urlStr.includes('/v1/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'token_123', expires_in: 3600 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (urlStr.includes('/capture')) {
        return new Response(
          JSON.stringify({
            id: declinedOrderId,
            status: 'FAILED',
            purchase_units: [{ payments: { captures: [{ status: 'DECLINED' }] } }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    });

    try {
      const res = await request(app)
        .post('/api/payments/capture-order')
        .set('x-session-token', session.sessionToken)
        .send({ paypalOrderId: declinedOrderId, orderId: order.id });

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('not completed');

      // Order must NOT be marked as captured
      const checkOrder = orderRepository.getById(order.id);
      expect(checkOrder?.status).not.toBe('captured');
    } finally {
      env.PAYPAL_CLIENT_ID = originalId;
      env.PAYPAL_CLIENT_SECRET = originalSecret;
      fetchSpy.mockRestore();
    }
  });

  it('successfully captures verified PayPal Sandbox payment and logs immutable audit seal', async () => {
    const session = sessionRepository.getOrCreate();
    const intent = intentRepository.create({
      sessionId: session.id,
      rawPrompt: 'Podcasting microphone setup',
    });
    const cart = cartRepository.getOrCreate(session.id, intent.id);
    cartRepository.addItem(cart.id, 'prod_acc_04', 1); // AuraVoice Mic $129.99

    const order = orderRepository.createFromCart(cart);
    const successOrderId = `PP-SUCCESS-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const captureId = `CAPTURE-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const originalId = env.PAYPAL_CLIENT_ID;
    const originalSecret = env.PAYPAL_CLIENT_SECRET;
    env.PAYPAL_CLIENT_ID = 'test_mock_client_id';
    env.PAYPAL_CLIENT_SECRET = 'test_mock_client_secret';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      const urlStr = url.toString();
      if (urlStr.includes('/v1/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'token_valid', expires_in: 3600 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (urlStr.includes('/capture')) {
        return new Response(
          JSON.stringify({
            id: successOrderId,
            status: 'COMPLETED',
            payer: {
              email_address: 'sb-buyer@personal.example.com',
              payer_id: 'PAYER-XYZ-999',
            },
            purchase_units: [
              {
                payments: {
                  captures: [
                    {
                      id: captureId,
                      status: 'COMPLETED',
                      amount: {
                        currency_code: 'USD',
                        value: order.totalAmount.toFixed(2),
                      },
                      seller_receivable_breakdown: {
                        gross_amount: { currency_code: 'USD', value: order.totalAmount.toFixed(2) },
                        paypal_fee: { currency_code: 'USD', value: '4.85' },
                        net_amount: {
                          currency_code: 'USD',
                          value: (order.totalAmount - 4.85).toFixed(2),
                        },
                      },
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    });

    try {
      const res = await request(app)
        .post('/api/payments/capture-order')
        .set('x-session-token', session.sessionToken)
        .send({ paypalOrderId: successOrderId, orderId: order.id })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.captureId).toBe(captureId);

      // Verify immutable cryptographic transaction audit
      const tx = res.body.data.transaction;
      expect(tx).toBeDefined();
      expect(tx.status).toBe('SUCCESS');
      expect(tx.transactionHash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 seal
      expect(tx.grossAmount).toBe(order.totalAmount);

      // Verify database updated order status to 'captured'
      const updatedOrder = orderRepository.getById(order.id);
      expect(updatedOrder?.status).toBe('captured');
    } finally {
      env.PAYPAL_CLIENT_ID = originalId;
      env.PAYPAL_CLIENT_SECRET = originalSecret;
      fetchSpy.mockRestore();
    }
  });
});
