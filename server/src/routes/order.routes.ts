import { Router } from 'express';
import { orderController } from '../controllers/order.controller';

const router = Router();

router.get('/', orderController.getOrders);
router.post('/', orderController.createOrder);
router.get('/:id', orderController.getOrderById);

export default router;
