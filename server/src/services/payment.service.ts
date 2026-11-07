import { env } from '../config/env';
import { logger } from '../utils/logger';
import { cartRepository, orderRepository } from '../db/repository';
import { getDatabase } from '../db';
import { v4 as uuidv4 } from 'uuid';
import type { Order, Payment } from '@paypal-intent/shared';

interface PayPalAccessToken {
  token: string;
  expiresAt: number;
}

let cachedToken: PayPalAccessToken | null = null;

export const paymentService = {
  /**
   * Resets cached token (useful for test suites)
   */
  resetTokenCache: (): void => {
    cachedToken = null;
  },

  /**
   * Fetches an OAuth2 Client Credentials Bearer Token from PayPal Sandbox
   */
  getAccessToken: async (): Promise<string> => {
    // Return cached token if valid for at least 60 seconds
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
      return cachedToken.token;
    }

    // Check if real or placeholder credentials
    if (
      !env.PAYPAL_CLIENT_ID ||
      env.PAYPAL_CLIENT_ID === 'sandbox_client_id_placeholder' ||
      !env.PAYPAL_CLIENT_SECRET ||
      env.PAYPAL_CLIENT_SECRET === 'sandbox_client_secret_placeholder'
    ) {
      logger.warn('PayPal credentials are placeholders. Sandbox OAuth will require configured credentials.');
      const err = new Error(
        'PayPal Sandbox credentials not configured. Please supply PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.'
      );
      (err as any).code = 'PAYPAL_CREDENTIALS_MISSING';
      throw err;
    }

    const auth = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    const tokenUrl = `${env.PAYPAL_API_BASE}/v1/oauth2/token`;

    logger.info(`Requesting PayPal OAuth token from: ${tokenUrl}`);
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error(`PayPal OAuth failed (${res.status}): ${errText}`);
      throw new Error(`Failed to obtain PayPal Sandbox access token: ${res.statusText}`);
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return cachedToken.token;
  },

  /**
   * Creates an official PayPal Sandbox Order v2
   */
  createOrder: async (cartId: string, sessionId?: string): Promise<{ paypalOrderId: string; order: Order }> => {
    const cart = cartRepository.getWithItems(cartId);
    if (!cart || cart.items.length === 0) {
      const err = new Error('Cannot create order for an empty cart');
      (err as any).code = 'CART_EMPTY';
      throw err;
    }

    if (sessionId && cart.sessionId !== sessionId) {
      const err = new Error('Unauthorized: Cart does not belong to the active session');
      (err as any).code = 'UNAUTHORIZED_CART';
      (err as any).statusCode = 403;
      throw err;
    }

    // Validate cart items against database catalog and authoritative prices
    const validation = cartRepository.validateCart(cartId);
    if (!validation.isValid) {
      const err = new Error(`Cart validation failed: ${validation.errors.join('; ')}`);
      (err as any).code = 'CART_INVALID';
      throw err;
    }

    const freshCart = validation.cart;

    // Create or retrieve pending order for this cart
    const db = getDatabase();
    let order: Order;

    const existingOrder = db
      .prepare("SELECT * FROM orders WHERE cart_id = ? AND status = 'pending'")
      .get(cartId) as any;

    if (existingOrder) {
      order = {
        id: existingOrder.id,
        cartId: existingOrder.cart_id,
        sessionId: existingOrder.session_id,
        intentSessionId: existingOrder.intent_session_id,
        orderNumber: existingOrder.order_number,
        status: existingOrder.status,
        currency: existingOrder.currency,
        subtotal: existingOrder.subtotal,
        taxAmount: existingOrder.tax_amount,
        shippingAmount: existingOrder.shipping_amount,
        totalAmount: existingOrder.total_amount,
        createdAt: existingOrder.created_at,
        updatedAt: existingOrder.updated_at,
      };
    } else {
      order = orderRepository.createFromCart(freshCart);
    }

    // Call PayPal Orders v2 API with idempotency header
    const token = await paymentService.getAccessToken();
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: order.id,
          custom_id: freshCart.intentSessionId,
          description: `PayPal Intent Order ${order.orderNumber}`,
          amount: {
            currency_code: order.currency,
            value: order.totalAmount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: order.currency,
                value: order.subtotal.toFixed(2),
              },
              tax_total: {
                currency_code: order.currency,
                value: order.taxAmount.toFixed(2),
              },
            },
          },
          items: freshCart.items.map((item) => ({
            name: item.product?.title || 'Catalog Item',
            sku: item.product?.sku || 'SKU',
            unit_amount: {
              currency_code: order.currency,
              value: item.unitPrice.toFixed(2),
            },
            quantity: item.quantity.toString(),
            category: 'PHYSICAL_GOODS',
          })),
        },
      ],
      application_context: {
        brand_name: 'PayPal Intent Demo Store',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
      },
    };

    const res = await fetch(`${env.PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `order_${order.id}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      logger.error(`PayPal Order creation failed (${res.status}): ${errorText}`);
      throw new Error(`PayPal Order creation failed (${res.status}): ${errorText}`);
    }

    const paypalOrder = (await res.json()) as { id: string };

    // Persist pending payment record in DB
    const existingPayment = db
      .prepare('SELECT id FROM payments WHERE order_id = ?')
      .get(order.id) as { id: string } | undefined;

    if (!existingPayment) {
      const paymentId = `pay_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      db.prepare(`
        INSERT INTO payments (id, order_id, provider, paypal_order_id, status, amount, currency)
        VALUES (?, ?, 'paypal', ?, 'created', ?, ?)
      `).run(paymentId, order.id, paypalOrder.id, order.totalAmount, order.currency);
    } else {
      db.prepare(`
        UPDATE payments
        SET paypal_order_id = ?, status = 'created', updated_at = datetime('now')
        WHERE id = ?
      `).run(paypalOrder.id, existingPayment.id);
    }

    return {
      paypalOrderId: paypalOrder.id,
      order,
    };
  },

  /**
   * Captures an authorized PayPal Sandbox Order v2 with full security verifications
   */
  captureOrder: async (paypalOrderId: string, orderId: string, sessionId?: string): Promise<Payment> => {
    const db = getDatabase();

    // 1. Verify order exists
    const order = orderRepository.getById(orderId);
    if (!order) {
      const err = new Error(`Order with ID "${orderId}" not found`);
      (err as any).statusCode = 404;
      throw err;
    }

    // 2. Verify order belongs to the checkout session
    if (sessionId && order.sessionId && order.sessionId !== sessionId) {
      const err = new Error('Unauthorized: Order does not belong to the active checkout session');
      (err as any).statusCode = 403;
      throw err;
    }

    // 3. Verify currency
    if (order.currency !== 'USD') {
      const err = new Error(`Invalid currency "${order.currency}". PayPal Sandbox integration requires USD`);
      (err as any).statusCode = 400;
      throw err;
    }

    // 4. Verify order has not already been captured (prevent duplicate capture)
    const existingPayment = db
      .prepare('SELECT * FROM payments WHERE paypal_order_id = ?')
      .get(paypalOrderId) as any;

    if (existingPayment && existingPayment.status === 'completed') {
      const err = new Error(`Order ${orderId} has already been captured and processed.`);
      (err as any).statusCode = 409;
      (err as any).code = 'DUPLICATE_CAPTURE_ATTEMPT';
      throw err;
    }

    if (order.status === 'captured') {
      const err = new Error(`Order ${orderId} is already marked as captured.`);
      (err as any).statusCode = 409;
      (err as any).code = 'DUPLICATE_CAPTURE_ATTEMPT';
      throw err;
    }

    // 5. Execute PayPal capture against official Sandbox API
    const token = await paymentService.getAccessToken();
    const captureUrl = `${env.PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`;

    logger.info(`Executing PayPal capture at: ${captureUrl} for order ${orderId}`);
    const res = await fetch(captureUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `cap_${order.id}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error(`PayPal Sandbox capture failed (${res.status}): ${errText}`);
      throw new Error(`PayPal Sandbox capture failed (${res.status}): ${errText}`);
    }

    const captureData = (await res.json()) as any;

    // 6. Verify the capture response indicates actual successful payment
    const captureStatus = captureData.status;
    const captureUnit = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    const unitStatus = captureUnit?.status;

    if (captureStatus !== 'COMPLETED' && unitStatus !== 'COMPLETED') {
      if (existingPayment) {
        db.prepare("UPDATE payments SET status = 'failed', raw_response = ?, updated_at = datetime('now') WHERE id = ?").run(
          JSON.stringify(captureData),
          existingPayment.id
        );
      }
      throw new Error(`PayPal payment capture was not completed. Received status: "${captureStatus || unitStatus}"`);
    }

    // 7. Verify captured amount matches the expected authoritative order amount
    const capturedAmountStr = captureUnit?.amount?.value || captureData.purchase_units?.[0]?.amount?.value;
    if (capturedAmountStr) {
      const capturedAmount = parseFloat(capturedAmountStr);
      if (Math.abs(capturedAmount - order.totalAmount) > 0.01) {
        throw new Error(
          `Captured amount ($${capturedAmount.toFixed(2)}) does not match authoritative order total ($${order.totalAmount.toFixed(2)})`
        );
      }
    }

    // 8. Extract transaction details
    const captureId = captureUnit?.id || captureData.id;
    const payer = captureData.payer;
    const payerEmail = payer?.email_address || null;
    const payerId = payer?.payer_id || null;

    // 9. Update payment record to completed
    if (existingPayment) {
      db.prepare(`
        UPDATE payments
        SET paypal_capture_id = ?, status = 'completed', payer_email = ?, payer_id = ?, raw_response = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(captureId, payerEmail, payerId, JSON.stringify(captureData), existingPayment.id);
    } else {
      const paymentId = `pay_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      db.prepare(`
        INSERT INTO payments (id, order_id, provider, paypal_order_id, paypal_capture_id, status, amount, currency, payer_email, payer_id, raw_response)
        VALUES (?, ?, 'paypal', ?, ?, 'completed', ?, ?, ?, ?, ?)
      `).run(
        paymentId,
        order.id,
        paypalOrderId,
        captureId,
        order.totalAmount,
        order.currency,
        payerEmail,
        payerId,
        JSON.stringify(captureData)
      );
    }

    // 10. Mark order as captured ONLY after verified successful payment
    orderRepository.updateStatus(order.id, 'captured');

    const paymentRow = db.prepare('SELECT * FROM payments WHERE paypal_order_id = ?').get(paypalOrderId) as any;

    return {
      id: paymentRow.id,
      orderId: paymentRow.order_id,
      provider: 'paypal',
      paypalOrderId: paymentRow.paypal_order_id,
      paypalCaptureId: paymentRow.paypal_capture_id,
      status: 'completed',
      amount: paymentRow.amount,
      currency: paymentRow.currency,
      payerEmail: paymentRow.payer_email,
      payerId: paymentRow.payer_id,
      rawResponse: JSON.parse(paymentRow.raw_response || '{}'),
      createdAt: paymentRow.created_at,
      updatedAt: paymentRow.updated_at,
    };
  },
};
