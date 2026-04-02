import { Router } from 'express';
import * as ctrl from '../controllers/evaluation.controller';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/:roleplayId', authenticate, aiLimiter, ctrl.evaluate);

export default router;
