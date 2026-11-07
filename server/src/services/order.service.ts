import { orderRepository, cartRepository } from '../db/repository';
import type { Order } from '@paypal-intent/shared';

export const orderService = {
  createOrderFromCart: (cartId: string, sessionId: string): Order => {
    const cart = cartRepository.getWithItems(cartId);

    // Verify ownership
    if (cart.sessionId !== sessionId) {
      throw new Error('Unauthorized: Cart does not belong to the active session.');
    }

    if (cart.status === 'converted') {
      throw new Error('Duplicate order: Cart has already been converted into an order.');
    }

    if (cart.items.length === 0) {
      throw new Error('Cannot create order from an empty cart.');
    }

    return orderRepository.createFromCart(cart);
  },

  getOrderById: (orderId: string): Order | null => {
    return orderRepository.getById(orderId);
  },

  listOrdersBySession: (sessionId: string): Order[] => {
    return orderRepository.getBySessionId(sessionId);
  },

  updateOrderStatus: (orderId: string, status: Order['status']): void => {
    orderRepository.updateStatus(orderId, status);
  },
};
