import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { transactionService } from '../services/transaction.service';
import { orderRepository, cartRepository } from '../db/repository';
import { env } from '../config/env';

export const paymentController = {
  getConfig: (_req: Request, res: Response): void => {
    const isConfigured = Boolean(
      env.PAYPAL_CLIENT_ID &&
      env.PAYPAL_CLIENT_ID !== 'sandbox_client_id_placeholder' &&
      env.PAYPAL_CLIENT_SECRET &&
      env.PAYPAL_CLIENT_SECRET !== 'sandbox_client_secret_placeholder'
    );

    res.json({
      success: true,
      data: {
        clientId: env.PAYPAL_CLIENT_ID,
        environment: env.PAYPAL_MODE || 'sandbox',
        currency: 'USD',
        isConfigured,
      },
    });
  },

  createOrder: async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = (req as any).sessionId || 'ses_default';
      const { cartId } = req.body;

      if (!cartId || typeof cartId !== 'string') {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Field "cartId" is required and must be a string' },
        });
        return;
      }

      const result = await paymentService.createOrder(cartId, sessionId);

      res.status(201).json({
        success: true,
        data: {
          paypalOrderId: result.paypalOrderId,
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          totalAmount: result.order.totalAmount,
          currency: result.order.currency,
        },
      });
    } catch (err) {
      const error = err as any;
      const status =
        error.statusCode ||
        (error.message?.includes('Unauthorized')
          ? 403
          : error.message?.includes('not found')
          ? 404
          : error.message?.includes('empty')
          ? 400
          : 500);

      res.status(status).json({
        success: false,
        error: { code: error.code || 'ORDER_CREATION_FAILED', message: error.message },
      });
    }
  },

  captureOrder: async (req: Request, res: Response): Promise<void> => {
    try {
      const { paypalOrderId, orderId } = req.body;
      const sessionId = (req as any).sessionId || 'ses_default';

      if (!paypalOrderId || !orderId) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Fields "paypalOrderId" and "orderId" are required' },
        });
        return;
      }

      const payment = await paymentService.captureOrder(paypalOrderId, orderId, sessionId);
      const order = orderRepository.getById(orderId);
      const cart = order?.cartId ? cartRepository.getWithItems(order.cartId) : null;

      // Record immutable transaction audit with SHA-256 seal
      const transaction = transactionService.recordSuccessfulTransaction(
        payment,
        order!,
        sessionId,
        `PayPal Sandbox Checkout (${order?.orderNumber})`,
        { cart, order }
      );

      res.json({
        success: true,
        data: {
          captureId: payment.paypalCaptureId,
          status: payment.status,
          transaction,
        },
      });
    } catch (err) {
      const error = err as any;
      const status =
        error.statusCode ||
        (error.message?.includes('already')
          ? 409
          : error.message?.includes('Unauthorized')
          ? 403
          : error.message?.includes('not found')
          ? 404
          : 500);

      res.status(status).json({
        success: false,
        error: { code: error.code || 'PAYMENT_CAPTURE_FAILED', message: error.message },
      });
    }
  },
};
