import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Score } from '../models/Score';
import { JudgeAssignment } from '../models/JudgeAssignment';
import { Rubric } from '../models/Rubric';
import { Event } from '../models/Event';
import { User } from '../models/User';
import { InviteToken } from '../models/InviteToken';
import { computeWeightedScore, runZScoreNormalization, getRankedProjects } from '../services/scoringService';
import { assignJudgesRoundRobin, getJudgeProgress } from '../services/judgingService';
import { audit } from '../services/auditService';
import { fireWebhook } from '../services/webhookService';
import crypto from 'crypto';

// Rubric management
export const createRubric = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId, name, description, criteria } = req.body;
    if (!eventId || !name || !criteria?.length) {
      res.status(400).json({ success: false, message: 'eventId, name, and criteria are required' });
      return;
    }
    const event = await Event.findById(eventId);
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    if (req.user!.role !== 'admin' && event.organizerId.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Not authorized' }); return;
    }

    const rubric = await Rubric.create({ eventId, name, description, criteria });
    await Event.findByIdAndUpdate(eventId, { rubricId: rubric._id });
    res.status(201).json({ success: true, rubric });
  } catch (err) { next(err); }
};

export const getRubric = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rubric = await Rubric.findById(req.params.id);
    if (!rubric) { res.status(404).json({ success: false, message: 'Rubric not found' }); return; }
    res.json({ success: true, rubric });
  } catch (err) { next(err); }
};

// Judge invitation
export const createInviteToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId, role, maxUses, expiresInHours } = req.body;
    const event = await Event.findById(eventId);
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    if (req.user!.role !== 'admin' && event.organizerId.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Not authorized' }); return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + (expiresInHours || 72) * 60 * 60 * 1000);

    const invite = await InviteToken.create({
      token, eventId, role: role || 'judge',
      createdBy: req.user!.id,
      expiresAt, maxUses: maxUses || 1,
    });

    res.status(201).json({ success: true, invite, inviteUrl: `/join/${token}` });
  } catch (err) { next(err); }
};

export const useInviteToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;
    const invite = await InviteToken.findOne({ token });

    if (!invite) { res.status(404).json({ success: false, message: 'Invalid invite token' }); return; }
    if (new Date() > invite.expiresAt) { res.status(400).json({ success: false, message: 'Invite token expired' }); return; }
    if (invite.useCount >= invite.maxUses) { res.status(400).json({ success: false, message: 'Invite token fully used' }); return; }

    // Update user role
    await User.findByIdAndUpdate(req.user!.id, { role: invite.role });
    invite.useCount++;
    invite.usedBy = req.user!.id as any;
    invite.usedAt = new Date();
    await invite.save();

    await audit({ actorId: req.user!.id, action: 'invite.used', resource: 'InviteToken', resourceId: invite._id.toString(), eventId: invite.eventId.toString(), ip: req.ip });
    res.json({ success: true, message: `Role updated to ${invite.role}`, role: invite.role });
  } catch (err) { next(err); }
};

// Judge assignments
export const bulkAssignJudges = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const eventId = req.params.eventId as string;
    const { judgesPerProject, trackId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    if (req.user!.role !== 'admin' && event.organizerId.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Not authorized' }); return;
    }

    const judges = await User.find({ role: 'judge' }).select('_id');
    const judgeIds = judges.map((j: any) => j._id.toString());

    const result = await assignJudgesRoundRobin(eventId, judgeIds, judgesPerProject || 2, trackId as string);
    await fireWebhook(eventId, 'judge.assigned', { assigned: result.assigned, skipped: result.skipped });

    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const manualAssign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { judgeId, projectId, eventId } = req.body;
    const event = await Event.findById(eventId);
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    if (req.user!.role !== 'admin' && event.organizerId.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Not authorized' }); return;
    }

    const assignment = await JudgeAssignment.create({ eventId, judgeId, projectId, status: 'pending' });
    res.status(201).json({ success: true, assignment });
  } catch (err) { next(err); }
};

export const getAssignments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const assignments = await JudgeAssignment.find({ judgeId: req.user!.id })
      .populate({ path: 'projectId', select: 'title description status trackId teamId' })
      .populate({ path: 'eventId', select: 'title status' })
      .lean();
    res.json({ success: true, assignments });
  } catch (err) { next(err); }
};

export const getProgress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const eventId = req.params.eventId as string;
    const event = await Event.findById(eventId);
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    if (req.user!.role !== 'admin' && event.organizerId.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Not authorized' }); return;
    }
    const progress = await getJudgeProgress(eventId);
    res.json({ success: true, progress });
  } catch (err) { next(err); }
};

// Scoring
export const submitScore = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { assignmentId, criteriaScores } = req.body;

    const assignment = await JudgeAssignment.findById(assignmentId);
    if (!assignment) { res.status(404).json({ success: false, message: 'Assignment not found' }); return; }
    if (assignment.judgeId.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'This assignment is not yours' }); return;
    }

    const event = await Event.findById(assignment.eventId).populate('rubricId');
    if (!event?.rubricId) { res.status(400).json({ success: false, message: 'No rubric configured for this event' }); return; }

    const rubric = await Rubric.findById(event.rubricId);
    if (!rubric) { res.status(404).json({ success: false, message: 'Rubric not found' }); return; }

    // Validate scores against rubric
    for (const cs of criteriaScores) {
      const criterion = rubric.criteria.find((c: any) => c._id.toString() === cs.criterionId);
      if (!criterion) { res.status(400).json({ success: false, message: `Criterion ${cs.criterionId} not found in rubric` }); return; }
      if (cs.rawScore < 0 || cs.rawScore > criterion.maxScore) {
        res.status(400).json({ success: false, message: `Score for "${criterion.name}" must be 0-${criterion.maxScore}` }); return;
      }
    }

    const { weightedScore, normalizedScore, totalRawScore } = computeWeightedScore(criteriaScores, rubric.criteria);

    const score = await Score.findOneAndUpdate(
      { judgeId: req.user!.id, projectId: assignment.projectId },
      {
        judgeId: req.user!.id, projectId: assignment.projectId,
        eventId: assignment.eventId, rubricId: rubric._id,
        assignmentId, criteriaScores, totalRawScore, weightedScore,
        normalizedScore, submittedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Mark assignment complete
    assignment.status = 'completed';
    assignment.completedAt = new Date();
    await assignment.save();

    await audit({ actorId: req.user!.id, action: 'score.submitted', resource: 'Score', resourceId: score._id.toString(), eventId: assignment.eventId.toString(), ip: req.ip });
    await fireWebhook(assignment.eventId.toString(), 'score.submitted', { judgeId: req.user!.id, projectId: assignment.projectId });

    res.json({ success: true, score });
  } catch (err) { next(err); }
};

export const getMyScore = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const score = await Score.findOne({ judgeId: req.user!.id, projectId });
    res.json({ success: true, score });
  } catch (err) { next(err); }
};

export const normalizeScores = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const eventId = req.params.eventId as string;
    const event = await Event.findById(eventId);
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    if (req.user!.role !== 'admin' && req.user!.role !== 'organizer' && event.organizerId.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Not authorized' }); return;
    }

    await runZScoreNormalization(eventId);
    res.json({ success: true, message: 'Z-score normalization completed' });
  } catch (err) { next(err); }
};

export const getResults = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const eventId = req.params.eventId as string;
    const event = await Event.findById(eventId);
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }

    // Results only visible if revealed or user is admin/organizer
    const canSeeResults = req.user?.role === 'admin' ||
      (req.user?.role === 'organizer' && event.organizerId.toString() === req.user?.id) ||
      event.resultsRevealed;

    if (!canSeeResults) {
      res.status(403).json({ success: false, message: 'Results not yet revealed' }); return;
    }

    const { trackId } = req.query;
    const rankings = await getRankedProjects(eventId, trackId as string);

    // Enrich with project titles
    const { Project } = await import('../models/Project');
    const projectIds = rankings.map((r) => r.projectId);
    const projects = await Project.find({ _id: { $in: projectIds } }).select('title description trackId teamId').lean();
    const projectMap = new Map(projects.map((p: any) => [p._id.toString(), p]));

    const enriched = rankings.map((r) => ({
      ...r,
      project: projectMap.get(r.projectId) || null,
    }));

    res.json({ success: true, rankings: enriched });
  } catch (err) { next(err); }
};
