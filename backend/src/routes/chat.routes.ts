import { Router } from 'express';
import * as ctrl from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/send', authenticate, aiLimiter, ctrl.sendMessage);

export default router;
