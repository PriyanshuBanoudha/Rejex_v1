import { Router } from 'express';
import * as exportCtrl from '../controllers/exportController';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();
router.get('/scores/:eventId', authenticate, requireRole('admin', 'organizer'), exportCtrl.exportScores);
router.get('/projects/:eventId', authenticate, requireRole('admin', 'organizer'), exportCtrl.exportProjects);
router.post('/import/projects', authenticate, requireRole('admin', 'organizer'), exportCtrl.bulkImportProjects);
export default router;
