import { Router } from 'express';
import * as ctrl from '../controllers/roleplay.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, ctrl.create);
router.get('/mine', authenticate, ctrl.listUserRoleplays);
router.get('/:id', authenticate, ctrl.getById);
router.get('/:id/messages', authenticate, ctrl.getMessages);
router.put('/:id/pause', authenticate, ctrl.pause);
router.put('/:id/resume', authenticate, ctrl.resume);

export default router;
