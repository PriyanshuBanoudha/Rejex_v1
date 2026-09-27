import { Router } from 'express';
import * as auth from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { authLimiter } from '../middleware/rateLimiterMiddleware';

const router = Router();
router.post('/register', authLimiter, auth.register);
router.post('/login', authLimiter, auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', authenticate, auth.logout);
router.get('/me', authenticate, auth.getMe);
router.patch('/me', authenticate, auth.updateProfile);
export default router;
