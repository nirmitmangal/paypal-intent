import { Router } from 'express';
import { cartController } from '../controllers/cart.controller';

const router = Router();

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.patch('/items/:itemId', cartController.updateQuantity);
router.delete('/items/:itemId', cartController.removeItem);
router.delete('/', cartController.clearCart);
router.post('/validate', cartController.validateCart);
router.post('/sync', cartController.syncCart);

export default router;
