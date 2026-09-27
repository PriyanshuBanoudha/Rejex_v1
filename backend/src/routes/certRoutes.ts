import { Router } from 'express';
import * as certs from '../controllers/certController';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();
router.post('/generate/:eventId', authenticate, requireRole('admin', 'organizer'), certs.generateCertificates);
router.get('/verify/:certId', certs.verifyCertificate);
router.get('/embed/:eventId', certs.getEmbedWidget);
router.get('/:certId', certs.getCertificate);
export default router;
