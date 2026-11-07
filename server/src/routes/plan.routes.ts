import { Router } from 'express';
import { planController } from '../controllers/plan.controller';

const router = Router();

router.post('/', planController.createPlan);
router.get('/intent/:intentId', planController.getPlansForIntent);
router.post('/:planId/rebalance', planController.rebalancePlan);

export const planRoutes = router;
export default router;
