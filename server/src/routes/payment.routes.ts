import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';

const router = Router();

router.get('/config', paymentController.getConfig);
router.post('/create-order', paymentController.createOrder);
router.post('/capture-order', paymentController.captureOrder);

export default router;
