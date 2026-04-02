import { Router } from 'express';
import * as ctrl from '../controllers/ninja.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/ranks', authenticate, ctrl.listRanks);
router.get('/progress', authenticate, ctrl.getProgress);
router.post('/progress/update', authenticate, ctrl.updateProgress);
router.post('/progress/recalculate', authenticate, ctrl.recalculate);

export default router;
