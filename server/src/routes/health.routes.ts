import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

const router = Router();

router.get('/', healthController.getSystemHealth);
router.get('/db', healthController.getDbHealth);
router.get('/ai', healthController.getAiHealth);

export default router;
