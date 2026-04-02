import { Router } from 'express';
import * as ctrl from '../controllers/prompts.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

router.get('/', authenticate, authorize('admin'), ctrl.list);
router.put('/:id', authenticate, authorize('admin'), ctrl.update);
router.post('/test', authenticate, authorize('admin'), ctrl.testPrompt);

export default router;
