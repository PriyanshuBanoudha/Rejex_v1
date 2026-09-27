import { Response, NextFunction, Request } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Certificate } from '../models/Certificate';
import { Event } from '../models/Event';
import { User } from '../models/User';
import { JudgeAssignment } from '../models/JudgeAssignment';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Generate Ed25519 key pair (or load existing)
// In production, keys are stored in a volume. For dev, generate in-memory.
let privateKey: crypto.KeyObject;
let publicKeyHex: string;

function ensureKeys() {
  if (!privateKey) {
    const { privateKey: pk, publicKey: pub } = crypto.generateKeyPairSync('ed25519');
    privateKey = pk;
    publicKeyHex = pub.export({ type: 'spki', format: 'der' }).toString('hex');
  }
}

export const generateCertificates = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    ensureKeys();
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    if (req.user!.role !== 'admin' && req.user!.role !== 'organizer' && event.organizerId.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Not authorized' }); return;
    }

    // Find all judges who completed at least one assignment
    const completedAssignments = await JudgeAssignment.find({ eventId, status: 'completed' })
      .populate('judgeId', 'name email')
      .lean();

    const judgeMap = new Map<string, { name: string; count: number }>();
    for (const a of completedAssignments) {
      const jid = (a.judgeId as any)._id.toString();
      const name = (a.judgeId as any).name || 'Unknown';
      if (!judgeMap.has(jid)) judgeMap.set(jid, { name, count: 0 });
      judgeMap.get(jid)!.count++;
    }

    const certs: any[] = [];
    for (const [judgeId, data] of judgeMap) {
      const certId = uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();
      const issuedAt = new Date();

      const payloadObj = {
        certId,
        judgeId,
        judgeName: data.name,
        eventId: eventId,
        eventTitle: event.title,
        projectsJudged: data.count,
        issuedAt: issuedAt.toISOString(),
        issuer: 'Hackathon Raptors Platform',
      };

      const payloadStr = JSON.stringify(payloadObj);
      const signature = crypto.sign(null, Buffer.from(payloadStr), privateKey).toString('hex');

      const cert = await Certificate.findOneAndUpdate(
        { judgeId, eventId },
        {
          judgeId, eventId,
          recipientName: data.name,
          eventTitle: event.title,
          projectsJudged: data.count,
          issuedAt,
          payload: payloadStr,
          signature,
          publicKey: publicKeyHex,
          certId,
        },
        { upsert: true, new: true }
      );

      certs.push(cert);
    }

    res.json({ success: true, generated: certs.length, certificates: certs.map(c => ({ certId: c.certId, judgeName: c.recipientName })) });
  } catch (err) {
    next(err);
  }
};

export const getCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cert = await Certificate.findOne({ certId: req.params.certId });
    if (!cert) { res.status(404).json({ success: false, message: 'Certificate not found' }); return; }
    res.json({ success: true, certificate: cert });
  } catch (err) {
    next(err);
  }
};

export const verifyCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cert = await Certificate.findOne({ certId: req.params.certId });
    if (!cert) { res.status(200).json({ success: true, valid: false, message: 'Certificate not found' }); return; }

    try {
      const pubKey = crypto.createPublicKey({
        key: Buffer.from(cert.publicKey, 'hex'),
        format: 'der',
        type: 'spki',
      });

      const valid = crypto.verify(
        null,
        Buffer.from(cert.payload),
        pubKey,
        Buffer.from(cert.signature, 'hex')
      );

      res.json({
        success: true,
        valid,
        verified: valid,
        certificate: valid ? JSON.parse(cert.payload) : null,
        message: valid ? 'Certificate is authentic' : 'Certificate signature is invalid',
      });
    } catch {
      res.json({ success: true, valid: false, message: 'Certificate verification failed' });
    }
  } catch (err) {
    next(err);
  }
};

export const getEmbedWidget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId).select('title status').lean();
    if (!event) { res.status(404).send('<p>Event not found</p>'); return; }

    const { Project } = await import('../models/Project');
    const projects = await Project.find({ eventId, status: 'submitted' })
      .populate('teamId', 'name')
      .select('title description repoUrl demoUrl tags')
      .limit(20)
      .lean();

    const projectCards = projects.map((p: any) => `
      <div class="hk-card">
        <h3 class="hk-title">${escapeHtml(p.title)}</h3>
        <p class="hk-team">by ${escapeHtml(p.teamId?.name || 'Unknown Team')}</p>
        <p class="hk-desc">${escapeHtml(p.description.substring(0, 120))}...</p>
        <div class="hk-links">
          ${p.repoUrl ? `<a href="${escapeHtml(p.repoUrl)}" target="_blank" rel="noopener">Repo</a>` : ''}
          ${p.demoUrl ? `<a href="${escapeHtml(p.demoUrl)}" target="_blank" rel="noopener">Demo</a>` : ''}
        </div>
      </div>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml((event as any).title)} - Gallery</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;padding:1rem}
  h1{font-size:1.5rem;margin-bottom:1rem;color:#818cf8}
  .hk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem}
  .hk-card{background:#1e293b;border-radius:8px;padding:1rem;border:1px solid #334155}
  .hk-title{font-size:1rem;font-weight:600;color:#c7d2fe;margin-bottom:.25rem}
  .hk-team{font-size:.8rem;color:#94a3b8;margin-bottom:.5rem}
  .hk-desc{font-size:.85rem;color:#cbd5e1;line-height:1.5;margin-bottom:.75rem}
  .hk-links a{display:inline-block;background:#4f46e5;color:#fff;padding:.25rem .75rem;border-radius:4px;text-decoration:none;font-size:.8rem;margin-right:.5rem}
  .hk-footer{margin-top:1rem;text-align:center;font-size:.75rem;color:#475569}
</style>
</head>
<body>
<h1>🚀 ${escapeHtml((event as any).title)}</h1>
<div class="hk-grid">${projectCards}</div>
<p class="hk-footer">Powered by Hackathon Raptors Platform</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.send(html);
  } catch (err) {
    next(err);
  }
};

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
