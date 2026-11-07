import { Router } from 'express';
import { intentController } from '../controllers/intent.controller';

const router = Router();

router.post('/', intentController.createIntent);
router.get('/:id', intentController.getIntent);
router.post('/:id/refine', intentController.refineIntent);

export const intentRoutes = router;
export default router;
