import { Router } from 'express';
import * as ctrl from '../controllers/users.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/profile', authenticate, ctrl.getProfile);
router.put('/profile', authenticate, ctrl.updateProfile);
router.put('/onboarding', authenticate, ctrl.updateOnboarding);
router.put('/visited-pages', authenticate, ctrl.updateVisitedPages);

export default router;
