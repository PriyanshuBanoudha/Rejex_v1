import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Project } from '../models/Project';
import { Vote, hashIp } from '../models/Vote';
import { Comment } from '../models/Comment';
import { Event } from '../models/Event';
import { AuditLog } from '../models/AuditLog';
import { audit } from '../services/auditService';
import { fireWebhook } from '../services/webhookService';

// Public gallery
export const getGallery = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { search, trackId, page: p, limit: l } = req.query;
    const page = parseInt(p as string) || 1;
    const limit = Math.min(parseInt(l as string) || 20, 100);

    const filter: any = { eventId, status: 'submitted' };
    if (trackId) filter.trackId = trackId;
    if (search) filter.$text = { $search: search as string };

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('teamId', 'name')
        .populate('trackId', 'name')
        .sort({ submittedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-editHistory')
        .lean(),
      Project.countDocuments(filter),
    ]);

    // Fisher-Yates shuffle with session seed for randomized ordering
    const seed = req.query.seed ? parseInt(req.query.seed as string) : Date.now();
    const shuffled = [...projects];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(((seed * (i + 1)) % 997) % (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    res.json({ success: true, projects: shuffled, total, page, pages: Math.ceil(total / limit), seed });
  } catch (err) {
    next(err);
  }
};

// Voting
export const castVote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.body;
    const project = await Project.findById(projectId);
    if (!project || project.status !== 'submitted') {
      res.status(404).json({ success: false, message: 'Project not found' }); return;
    }

    const event = await Event.findById(project.eventId);
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    if (!event.votingEnabled || event.status !== 'voting') {
      res.status(400).json({ success: false, message: 'Voting is not currently active' }); return;
    }

    const ip = req.ip || '0.0.0.0';
    const ipHash = hashIp(ip, project.eventId.toString());

    // Duplicate IP detection: flag if >5 votes from same IP hash per event
    const ipVoteCount = await Vote.countDocuments({ ipHash, eventId: project.eventId });
    if (ipVoteCount >= 5) {
      await audit({ actorId: req.user!.id, action: 'vote.suspicious_ip', resource: 'Vote', eventId: project.eventId.toString(), ip });
    }

    try {
      await Vote.create({ voterId: req.user!.id, projectId, eventId: project.eventId, ipHash, userAgent: req.headers['user-agent'] });
    } catch (err: any) {
      if (err.code === 11000) {
        res.status(409).json({ success: false, message: 'You have already voted for this project' }); return;
      }
      throw err;
    }

    await audit({ actorId: req.user!.id, action: 'vote.cast', resource: 'Vote', resourceId: projectId, eventId: project.eventId.toString(), ip });
    await fireWebhook(project.eventId.toString(), 'vote.cast', { projectId, voterId: req.user!.id });

    res.status(201).json({ success: true, message: 'Vote recorded' });
  } catch (err) {
    next(err);
  }
};

export const getVoteCount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) { res.status(404).json({ success: false, message: 'Project not found' }); return; }

    const event = await Event.findById(project.eventId);
    const canSee = req.user?.role === 'admin' ||
      (req.user?.role === 'organizer' && event?.organizerId?.toString() === req.user?.id) ||
      event?.resultsRevealed;

    if (!canSee) {
      res.json({ success: true, count: null, message: 'Voting results hidden until reveal' }); return;
    }

    const count = await Vote.countDocuments({ projectId });
    const userVoted = req.user ? !!(await Vote.findOne({ projectId, voterId: req.user.id })) : false;
    res.json({ success: true, count, userVoted });
  } catch (err) {
    next(err);
  }
};

// Comments
export const addComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, body } = req.body;
    const project = await Project.findById(projectId);
    if (!project || project.status !== 'submitted') {
      res.status(404).json({ success: false, message: 'Project not found' }); return;
    }

    const comment = await Comment.create({ authorId: req.user!.id, projectId, eventId: project.eventId, body });
    await comment.populate('authorId', 'name');
    res.status(201).json({ success: true, comment });
  } catch (err) {
    next(err);
  }
};

export const getComments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const comments = await Comment.find({ projectId, hidden: false })
      .populate('authorId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, comments });
  } catch (err) {
    next(err);
  }
};

export const flagComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) { res.status(404).json({ success: false, message: 'Comment not found' }); return; }
    if (comment.flaggedBy.map((f: any) => f.toString()).includes(req.user!.id)) {
      res.status(409).json({ success: false, message: 'Already flagged' }); return;
    }

    comment.flaggedBy.push(req.user!.id as any);
    comment.flagCount++;
    if (comment.flagCount >= 3) comment.hidden = true;
    await comment.save();

    res.json({ success: true, message: 'Comment flagged' });
  } catch (err) {
    next(err);
  }
};

export const moderateComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { hidden } = req.body;
    const comment = await Comment.findByIdAndUpdate(req.params.id, { hidden }, { new: true });
    if (!comment) { res.status(404).json({ success: false, message: 'Comment not found' }); return; }
    res.json({ success: true, comment });
  } catch (err) {
    next(err);
  }
};

// Audit logs
export const getAuditLogs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const logs = await AuditLog.find({ eventId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const total = await AuditLog.countDocuments({ eventId });

    res.json({ success: true, logs, total, page });
  } catch (err) {
    next(err);
  }
};
