import { Router } from 'express';
import * as ctrl from '../controllers/goals.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

router.get('/', authenticate, ctrl.getGoal);
router.get('/:userId', authenticate, ctrl.getGoal);
router.get('/:userId/progress', authenticate, ctrl.getProgress);
router.post('/', authenticate, authorize('admin', 'coach'), ctrl.setGoal);
router.delete('/:userId', authenticate, authorize('admin', 'coach'), ctrl.clearGoal);

export default router;
