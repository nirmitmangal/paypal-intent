import { Request, Response } from 'express';
import { transactionService } from '../services/transaction.service';
import type { ApiResponse, TransactionRecord } from '@paypal-intent/shared';

export const transactionController = {
  getTransactions: (req: Request, res: Response): void => {
    try {
      const sessionId = (req as any).sessionId || 'ses_default';
      const transactions = transactionService.getTransactionsForSession(sessionId);

      const response: ApiResponse<TransactionRecord[]> = {
        success: true,
        data: transactions,
        meta: { count: transactions.length, timestamp: new Date().toISOString() },
      };

      res.json(response);
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_TRANSACTIONS_FAILED', message: (err as Error).message },
      });
    }
  },

  getTransactionById: (req: Request, res: Response): void => {
    try {
      const sessionId = (req as any).sessionId || 'ses_default';
      const id = String(req.params.id);
      const transaction = transactionService.getTransactionById(id);

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: { code: 'TRANSACTION_NOT_FOUND', message: `Transaction ${id} not found` },
        });
        return;
      }

      if (transaction.sessionId && transaction.sessionId !== sessionId) {
        res.status(403).json({
          success: false,
          error: { code: 'UNAUTHORIZED_ACCESS', message: 'Unauthorized: Transaction belongs to a different session' },
        });
        return;
      }

      res.json({
        success: true,
        data: transaction,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_TRANSACTION_FAILED', message: (err as Error).message },
      });
    }
  },
};
