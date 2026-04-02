import { Router } from 'express';
import * as ctrl from '../controllers/segments.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, authorize('admin'), ctrl.create);
router.put('/:id', authenticate, authorize('admin'), ctrl.update);
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);

export default router;
