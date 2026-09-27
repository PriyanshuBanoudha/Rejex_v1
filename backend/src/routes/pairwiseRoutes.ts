import { Router } from 'express';
import * as pairwise from '../controllers/pairwiseController';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();
router.post('/', authenticate, requireRole('judge', 'admin'), pairwise.submitPairwise);
router.get('/next/:eventId', authenticate, requireRole('judge', 'admin'), pairwise.getNextPair);
router.get('/rankings/:eventId', authenticate, pairwise.getPairwiseRankings);
export default router;
