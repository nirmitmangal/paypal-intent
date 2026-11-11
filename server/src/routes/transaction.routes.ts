import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller';

const router = Router();

router.get('/', transactionController.getTransactions);
router.get('/:id/verify', transactionController.verifyTransactionHash);
router.get('/:id', transactionController.getTransactionById);

export default router;
