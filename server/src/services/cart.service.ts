import { cartRepository } from '../db/repository';
import type { ShoppingCart } from '@paypal-intent/shared';

export const cartService = {
  getCart: (sessionId: string, intentSessionId: string): ShoppingCart => {
    return cartRepository.getOrCreate(sessionId, intentSessionId);
  },

  addItem: (cartId: string, productId: string, quantity = 1): ShoppingCart => {
    return cartRepository.addItem(cartId, productId, quantity);
  },

  updateQuantity: (cartId: string, itemId: string, quantity: number): ShoppingCart => {
    return cartRepository.updateItemQuantity(cartId, itemId, quantity);
  },

  removeItem: (cartId: string, itemId: string): ShoppingCart => {
    return cartRepository.removeItem(cartId, itemId);
  },

  clearCart: (cartId: string): ShoppingCart => {
    return cartRepository.clearCart(cartId);
  },

  validateCart: (
    cartId: string
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    cart: ShoppingCart;
  } => {
    return cartRepository.validateCart(cartId);
  },
};
