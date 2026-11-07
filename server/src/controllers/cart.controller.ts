import { Request, Response } from 'express';
import { cartService } from '../services/cart.service';
import { cartRepository } from '../db/repository';
import type { ApiResponse, ShoppingCart } from '@paypal-intent/shared';

export const cartController = {
  getCart: (req: Request, res: Response): void => {
    try {
      const sessionId = (req as any).sessionId || 'ses_default';
      const intentSessionId = (req.query.intentSessionId as string) || '';

      let cart: ShoppingCart;
      const activeCart = cartRepository.getActiveCartBySessionId(sessionId);
      if (activeCart) {
        cart = activeCart;
      } else if (intentSessionId) {
        cart = cartService.getCart(sessionId, intentSessionId);
      } else {
        // Return empty structure when no cart or intent exists yet
        res.json({
          success: true,
          data: {
            id: `crt_${sessionId.slice(0, 12)}`,
            sessionId,
            intentSessionId: '',
            status: 'active',
            subtotal: 0,
            estimatedTax: 0,
            shippingFee: 0,
            totalAmount: 0,
            currency: 'USD',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          meta: { timestamp: new Date().toISOString() },
        });
        return;
      }

      const response: ApiResponse<ShoppingCart> = {
        success: true,
        data: cart,
        meta: { timestamp: new Date().toISOString() },
      };

      res.json(response);
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'CART_FETCH_FAILED', message: (err as Error).message },
      });
    }
  },

  addItem: (req: Request, res: Response): void => {
    try {
      const sessionId = (req as any).sessionId || 'ses_default';
      const { productId, quantity, intentSessionId } = req.body;

      if (!productId) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Field "productId" is required' },
        });
        return;
      }

      let activeCart = cartRepository.getActiveCartBySessionId(sessionId);
      if (!activeCart) {
        if (!intentSessionId) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_INPUT', message: 'intentSessionId is required to initialize a new cart' },
          });
          return;
        }
        activeCart = cartService.getCart(sessionId, intentSessionId);
      }

      const updatedCart = cartService.addItem(activeCart.id, productId, quantity || 1);

      res.status(201).json({
        success: true,
        data: updatedCart,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'CART_ADD_FAILED', message: (err as Error).message },
      });
    }
  },

  updateQuantity: (req: Request, res: Response): void => {
    try {
      const sessionId = (req as any).sessionId || 'ses_default';
      const itemId = String(req.params.itemId);
      const { quantity } = req.body;

      if (quantity === undefined || typeof quantity !== 'number') {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Field "quantity" must be a valid number' },
        });
        return;
      }

      const activeCart = cartRepository.getActiveCartBySessionId(sessionId);
      if (!activeCart) {
        res.status(404).json({
          success: false,
          error: { code: 'CART_NOT_FOUND', message: 'Active cart not found for this session' },
        });
        return;
      }

      const updatedCart = cartService.updateQuantity(activeCart.id, itemId, quantity);

      res.json({
        success: true,
        data: updatedCart,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'CART_UPDATE_FAILED', message: (err as Error).message },
      });
    }
  },

  removeItem: (req: Request, res: Response): void => {
    try {
      const sessionId = (req as any).sessionId || 'ses_default';
      const itemId = String(req.params.itemId);
      const activeCart = cartRepository.getActiveCartBySessionId(sessionId);
      if (!activeCart) {
        res.status(404).json({
          success: false,
          error: { code: 'CART_NOT_FOUND', message: 'Active cart not found for this session' },
        });
        return;
      }

      const updatedCart = cartService.removeItem(activeCart.id, itemId);

      res.json({
        success: true,
        data: updatedCart,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'CART_REMOVE_FAILED', message: (err as Error).message },
      });
    }
  },

  clearCart: (req: Request, res: Response): void => {
    try {
      const sessionId = (req as any).sessionId || 'ses_default';
      const activeCart = cartRepository.getActiveCartBySessionId(sessionId);
      if (!activeCart) {
        res.json({
          success: true,
          data: {
            id: '',
            sessionId,
            intentSessionId: '',
            status: 'active',
            subtotal: 0,
            estimatedTax: 0,
            shippingFee: 0,
            totalAmount: 0,
            currency: 'USD',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
        return;
      }

      const updatedCart = cartService.clearCart(activeCart.id);

      res.json({
        success: true,
        data: updatedCart,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'CART_CLEAR_FAILED', message: (err as Error).message },
      });
    }
  },

  validateCart: (req: Request, res: Response): void => {
    try {
      const sessionId = (req as any).sessionId || 'ses_default';
      const activeCart = cartRepository.getActiveCartBySessionId(sessionId);
      if (!activeCart) {
        res.status(400).json({
          success: false,
          error: { code: 'CART_NOT_FOUND', message: 'No active cart found for this session' },
        });
        return;
      }

      const validation = cartService.validateCart(activeCart.id);

      res.json({
        success: true,
        data: validation,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'CART_VALIDATE_FAILED', message: (err as Error).message },
      });
    }
  },

  syncCart: (req: Request, res: Response): void => {
    try {
      const sessionId = (req as any).sessionId || 'ses_default';
      const { items, intentSessionId } = req.body;

      if (!Array.isArray(items)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Field "items" must be an array' },
        });
        return;
      }

      const activeCart = cartRepository.getOrCreate(sessionId, intentSessionId || '');
      const updatedCart = cartRepository.syncItems(activeCart.id, items);

      res.json({
        success: true,
        data: updatedCart,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'CART_SYNC_FAILED', message: (err as Error).message },
      });
    }
  },
};
