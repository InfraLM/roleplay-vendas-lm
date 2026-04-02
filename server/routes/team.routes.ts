import { Router } from 'express';
import * as ctrl from '../controllers/team.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

router.get('/members', authenticate, authorize('admin', 'coach'), ctrl.listMembers);
router.get('/members/goals', authenticate, authorize('admin', 'coach'), ctrl.listMemberGoals);
router.post('/invite', authenticate, authorize('admin'), ctrl.inviteUser);
router.put('/:userId/role', authenticate, authorize('admin'), ctrl.updateRole);
router.delete('/:userId', authenticate, authorize('admin'), ctrl.removeMember);

export default router;
