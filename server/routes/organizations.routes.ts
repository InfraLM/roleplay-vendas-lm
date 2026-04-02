import { Router } from 'express';
import * as ctrl from '../controllers/organizations.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, ctrl.create);
router.get('/mine', authenticate, ctrl.getMine);

export default router;
