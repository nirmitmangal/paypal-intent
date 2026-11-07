import { Router } from 'express';
import { agentController } from '../controllers/agent.controller';

const router = Router();

router.post('/tools/execute', agentController.executeTool);
router.get('/health', agentController.getHealth);

export const agentRoutes = router;
export default router;
