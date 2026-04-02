import { Router } from 'express';
import * as ctrl from '../controllers/sheets.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/fetch', authenticate, ctrl.fetchSheet);

export default router;
