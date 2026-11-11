import { transactionRepository } from '../db/repository';
import type { TransactionRecord, Payment, Order } from '@paypal-intent/shared';

export const transactionService = {
  recordSuccessfulTransaction: (
    payment: Payment,
    order: Order,
    sessionId: string,
    intentSummary: string,
    cartSnapshot: Record<string, unknown>
  ): TransactionRecord => {
    return transactionRepository.create({
      paymentId: payment.id,
      orderId: order.id,
      sessionId,
      status: 'SUCCESS',
      grossAmount: payment.amount,
      currency: payment.currency,
      intentSummary,
      auditSnapshot: {
        payment,
        order,
        cartSnapshot,
        timestamp: new Date().toISOString(),
      },
    });
  },

  getTransactionById: (id: string): TransactionRecord | null => {
    return transactionRepository.getById(id);
  },

  getTransactionsForSession: (sessionId: string): TransactionRecord[] => {
    return transactionRepository.getAllBySession(sessionId);
  },

  verifyTransactionHash: (tx: TransactionRecord): boolean => {
    return transactionRepository.verifyTransactionHash(tx);
  },
};
