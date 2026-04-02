import { Router } from 'express';
import * as ctrl from '../controllers/leads.controller';

const router = Router();

router.post('/', ctrl.create);

export default router;
