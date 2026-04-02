import { Router } from 'express';
import * as ctrl from '../controllers/system.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

router.get('/initialized', ctrl.isInitialized);
router.post('/initialize', authenticate, ctrl.initialize);
router.get('/settings', ctrl.getSettings);
router.put('/settings', authenticate, authorize('admin'), ctrl.updateSettings);

export default router;
