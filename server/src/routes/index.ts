import { Router } from 'express';
import healthRoutes from './health.routes';
import intentRoutes from './intent.routes';
import productRoutes from './product.routes';
import cartRoutes from './cart.routes';
import orderRoutes from './order.routes';
import paymentRoutes from './payment.routes';
import transactionRoutes from './transaction.routes';
import planRoutes from './plan.routes';
import agentRoutes from './agent.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/intents', intentRoutes);
router.use('/plans', planRoutes);
router.use('/agent', agentRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/transactions', transactionRoutes);

export default router;
