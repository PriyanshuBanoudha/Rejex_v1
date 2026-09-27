import { Router } from 'express';
import * as teams from '../controllers/teamController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();
router.post('/', authenticate, teams.createTeam);
router.get('/mine', authenticate, teams.getUserTeams);
router.get('/:id', authenticate, teams.getTeam);
router.post('/join/:inviteCode', authenticate, teams.joinTeam);
router.patch('/:id/lock', authenticate, teams.lockTeam);
router.post('/:id/leave', authenticate, teams.leaveTeam);
export default router;
