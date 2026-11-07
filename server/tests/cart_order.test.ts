import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { cartService } from '../src/services/cart.service';
import { orderService } from '../src/services/order.service';
import { sessionRepository, intentRepository, cartRepository } from '../src/db/repository';
import { getDatabase } from '../src/db';

describe('Commerce Engine — Cart Management, Pricing & Order Creation', () => {
  const app = createApp();

  const session = sessionRepository.getOrCreate();
  const intent = intentRepository.create({
    sessionId: session.id,
    rawPrompt: 'Dual monitor developer desk setup under $1000',
    budgetAmount: 1000.0,
  });

  it('creates an active shopping cart for an intent session', async () => {
    const res = await request(app)
      .get('/api/cart')
      .set('x-session-token', session.sessionToken)
      .query({ intentSessionId: intent.id })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toMatch(/^crt_/);
    expect(res.body.data.status).toBe('active');
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.totalAmount).toBe(0.0);
  });

  it('adds items to the cart and calculates subtotals in minor units', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('x-session-token', session.sessionToken)
      .send({
        productId: 'prod_mon_01', // $379.99
        quantity: 2,
        intentSessionId: intent.id,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    const cart = res.body.data;
    expect(cart.items.length).toBe(1);
    expect(cart.items[0].quantity).toBe(2);

    // Subtotal: 379.99 * 2 = 759.98
    // Tax (8%): 759.98 * 0.08 = 60.7984 -> 60.80
    // Total: 759.98 + 60.80 = 820.78
    expect(cart.subtotal).toBe(759.98);
    expect(cart.estimatedTax).toBe(60.8);
    expect(cart.totalAmount).toBe(820.78);
  });

  it('updates item quantity via PATCH and recalculates exact totals', async () => {
    const cart = cartService.getCart(session.id, intent.id);
    const firstItem = cart.items[0];

    const res = await request(app)
      .patch(`/api/cart/items/${firstItem.id}`)
      .set('x-session-token', session.sessionToken)
      .send({ quantity: 1 })
      .expect(200);

    expect(res.body.success).toBe(true);
    const updatedCart = res.body.data;
    expect(updatedCart.items[0].quantity).toBe(1);

    // 1 item @ 379.99
    // Tax (8%): 379.99 * 0.08 = 30.3992 -> 30.40
    // Total: 379.99 + 30.40 = 410.39
    expect(updatedCart.subtotal).toBe(379.99);
    expect(updatedCart.estimatedTax).toBe(30.4);
    expect(updatedCart.totalAmount).toBe(410.39);
  });

  it('validates cart items against catalog inventory and authoritative prices', async () => {
    const res = await request(app)
      .post('/api/cart/validate')
      .set('x-session-token', session.sessionToken)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.isValid).toBe(true);
    expect(res.body.data.errors).toEqual([]);
  });

  it('detects and corrects tampered prices in cart upon validation', () => {
    const cart = cartService.getCart(session.id, intent.id);
    const db = getDatabase();

    // Maliciously tamper with price in cart_items table directly
    db.prepare('UPDATE cart_items SET unit_price = 1.00 WHERE cart_id = ?').run(cart.id);

    const validation = cartService.validateCart(cart.id);
    expect(validation.isValid).toBe(true);
    expect(validation.warnings.length).toBeGreaterThan(0);
    expect(validation.warnings[0]).toContain('authoritative catalog price');

    // Cart unit_price should be restored to $379.99
    const restoredCart = cartRepository.getWithItems(cart.id);
    expect(restoredCart.items[0].unitPrice).toBe(379.99);
    expect(restoredCart.subtotal).toBe(379.99);
  });

  let checkedOutCartId: string;

  it('creates an order from validated cart with server-side recalculated totals', async () => {
    const cart = cartService.getCart(session.id, intent.id);
    checkedOutCartId = cart.id;

    const res = await request(app)
      .post('/api/orders')
      .set('x-session-token', session.sessionToken)
      .send({ cartId: cart.id })
      .expect(201);

    expect(res.body.success).toBe(true);
    const order = res.body.data;
    expect(order.id).toMatch(/^ord_/);
    expect(order.orderNumber).toMatch(/^PI-\d{4}-/);
    expect(order.status).toBe('pending');
    expect(order.subtotal).toBe(379.99);
    expect(order.totalAmount).toBe(410.39);
  });

  it('prevents duplicate order creation by locking converted cart', async () => {
    // Attempt to checkout the same converted cart again
    const res = await request(app)
      .post('/api/orders')
      .set('x-session-token', session.sessionToken)
      .send({ cartId: checkedOutCartId })
      .expect(409); // Conflict

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('already been converted');
  });

  it('retrieves orders for the active session', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('x-session-token', session.sessionToken)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('clears items from a fresh cart', async () => {
    const freshSession = sessionRepository.getOrCreate();
    const freshIntent = intentRepository.create({
      sessionId: freshSession.id,
      rawPrompt: 'Clean desk',
    });

    const cart = cartService.getCart(freshSession.id, freshIntent.id);
    cartService.addItem(cart.id, 'prod_kb_01', 1);

    const res = await request(app)
      .delete('/api/cart')
      .set('x-session-token', freshSession.sessionToken)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.totalAmount).toBe(0.0);
  });
});
