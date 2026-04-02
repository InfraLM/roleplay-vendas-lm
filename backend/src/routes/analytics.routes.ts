import { Router } from 'express';
import * as ctrl from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/report', authenticate, ctrl.generateReport);
router.post('/pdf', authenticate, ctrl.generatePdf);
router.get('/saved', authenticate, ctrl.listSaved);
router.post('/saved', authenticate, ctrl.saveReport);

export default router;
