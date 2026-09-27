import { Router } from 'express';
import * as events from '../controllers/eventController';
import { authenticate, requireRole, optionalAuth } from '../middleware/authMiddleware';

const router = Router();
router.get('/', optionalAuth, events.listEvents);
router.post('/', authenticate, requireRole('admin', 'organizer'), events.createEvent);
router.get('/:id', optionalAuth, events.getEvent);
router.patch('/:id', authenticate, requireRole('admin', 'organizer'), events.updateEvent);
router.delete('/:id', authenticate, requireRole('admin', 'organizer'), events.deleteEvent);
router.post('/:id/tracks', authenticate, requireRole('admin', 'organizer'), events.createTrack);
router.get('/:id/tracks', optionalAuth, events.listTracks);
export default router;
