import { Router } from 'express';
import * as projects from '../controllers/projectController';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();
router.post('/', authenticate, requireRole('participant'), projects.createProject);
router.get('/my/:eventId', authenticate, projects.getMyProject);
router.get('/:id', authenticate, projects.getProject);
router.patch('/:id', authenticate, projects.updateProject);
router.post('/:id/submit', authenticate, requireRole('participant'), projects.submitProject);
export default router;
