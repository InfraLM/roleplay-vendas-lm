import { Router } from 'express';
import * as ctrl from '../controllers/streaks.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, ctrl.getStreak);
router.post('/update', authenticate, ctrl.updateStreak);

export default router;
