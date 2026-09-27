import { Router } from 'express';
import * as gallery from '../controllers/galleryController';
import { authenticate, requireRole, optionalAuth } from '../middleware/authMiddleware';
import { voteLimiter } from '../middleware/rateLimiterMiddleware';

const router = Router();
// Gallery
router.get('/gallery/:eventId', optionalAuth, gallery.getGallery);
// Voting
router.post('/votes', authenticate, voteLimiter, gallery.castVote);
router.get('/votes/:projectId', optionalAuth, gallery.getVoteCount);
// Comments
router.post('/comments', authenticate, gallery.addComment);
router.get('/comments/:projectId', optionalAuth, gallery.getComments);
router.post('/comments/:id/flag', authenticate, gallery.flagComment);
router.patch('/comments/:id/moderate', authenticate, requireRole('admin', 'organizer'), gallery.moderateComment);
// Audit
router.get('/audit/:eventId', authenticate, requireRole('admin', 'organizer'), gallery.getAuditLogs);
export default router;
