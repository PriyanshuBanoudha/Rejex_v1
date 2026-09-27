import { Router } from 'express';
import * as judging from '../controllers/judgingController';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();
// Rubric
router.post('/rubrics', authenticate, requireRole('admin', 'organizer'), judging.createRubric);
router.get('/rubrics/:id', authenticate, judging.getRubric);
// Invites
router.post('/invites', authenticate, requireRole('admin', 'organizer'), judging.createInviteToken);
router.post('/invites/use/:token', authenticate, judging.useInviteToken);
// Assignment
router.post('/assign/:eventId', authenticate, requireRole('admin', 'organizer'), judging.bulkAssignJudges);
router.post('/assign-manual', authenticate, requireRole('admin', 'organizer'), judging.manualAssign);
router.get('/assignments', authenticate, requireRole('judge', 'admin'), judging.getAssignments);
router.get('/progress/:eventId', authenticate, requireRole('admin', 'organizer'), judging.getProgress);
// Scoring
router.post('/scores', authenticate, requireRole('judge', 'admin'), judging.submitScore);
router.get('/scores/project/:projectId', authenticate, requireRole('judge', 'admin'), judging.getMyScore);
router.post('/normalize/:eventId', authenticate, requireRole('admin', 'organizer'), judging.normalizeScores);
// Results
router.get('/results/:eventId', authenticate, judging.getResults);
export default router;
