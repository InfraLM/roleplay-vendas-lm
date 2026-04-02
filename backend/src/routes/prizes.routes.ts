import { Router } from 'express';
import * as ctrl from '../controllers/prizes.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

router.get('/', authenticate, ctrl.listActive);
router.get('/all', authenticate, authorize('admin'), ctrl.listAll);
router.post('/', authenticate, authorize('admin'), ctrl.create);
router.put('/:id', authenticate, authorize('admin'), ctrl.update);
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);
router.post('/:id/redeem', authenticate, ctrl.redeemPrize);
router.get('/redemptions', authenticate, ctrl.listRedemptions);
router.get('/redemptions/all', authenticate, authorize('admin'), ctrl.listAllRedemptions);
router.put('/redemptions/:id', authenticate, authorize('admin'), ctrl.updateRedemption);

export default router;
