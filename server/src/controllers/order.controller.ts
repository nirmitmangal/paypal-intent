import { Request, Response } from 'express';
import { orderService } from '../services/order.service';
import type { ApiResponse, Order } from '@paypal-intent/shared';

export const orderController = {
  createOrder: (req: Request, res: Response): void => {
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

      const order = orderService.createOrderFromCart(cartId, sessionId);

      const response: ApiResponse<Order> = {
        success: true,
        data: order,
        meta: { timestamp: new Date().toISOString() },
      };

      res.status(201).json(response);
    } catch (err) {
      const message = (err as Error).message;
      const status = message.includes('Duplicate order')
        ? 409
        : message.includes('Unauthorized')
        ? 403
        : message.includes('empty')
        ? 400
        : 500;

      res.status(status).json({
        success: false,
        error: { code: 'ORDER_CREATION_FAILED', message },
      });
    }
  },

  getOrderById: (req: Request, res: Response): void => {
    try {
      const sessionId = (req as any).sessionId || 'ses_default';
      const orderId = String(req.params.id);
      const order = orderService.getOrderById(orderId);

      if (!order) {
        res.status(404).json({
          success: false,
          error: { code: 'ORDER_NOT_FOUND', message: `Order with ID "${orderId}" not found` },
        });
        return;
      }

      if (order.sessionId && order.sessionId !== sessionId) {
        res.status(403).json({
          success: false,
          error: { code: 'UNAUTHORIZED_ACCESS', message: 'Unauthorized: Order belongs to a different session' },
        });
        return;
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'ORDER_FETCH_FAILED', message: (err as Error).message },
      });
    }
  },

  getOrders: (req: Request, res: Response): void => {
    try {
      const sessionId = (req as any).sessionId || 'ses_default';
      const orders = orderService.listOrdersBySession(sessionId);

      res.json({
        success: true,
        data: orders,
        meta: { count: orders.length, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'ORDERS_LIST_FAILED', message: (err as Error).message },
      });
    }
  },
};
