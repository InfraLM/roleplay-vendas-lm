import { Router } from 'express';
import * as ctrl from '../controllers/vouchers.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, ctrl.list);
router.put('/redeem', authenticate, ctrl.redeem);

export default router;
