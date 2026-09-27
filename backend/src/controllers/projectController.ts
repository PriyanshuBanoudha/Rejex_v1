import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Project } from '../models/Project';
import { Team } from '../models/Team';
import { Event } from '../models/Event';
import { audit } from '../services/auditService';
import { fireWebhook } from '../services/webhookService';

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId, title, description, repoUrl, demoUrl, videoUrl, slideUrl, trackId, tags } = req.body;
    if (!eventId || !title || !description) {
      res.status(400).json({ success: false, message: 'eventId, title, and description are required' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // Find user's team for this event
    const team = await Team.findOne({ eventId, members: req.user!.id });
    if (!team) {
      res.status(400).json({ success: false, message: 'You must be in a team to submit a project' });
      return;
    }

    // One project per team per event
    const existing = await Project.findOne({ eventId, teamId: team._id });
    if (existing) {
      res.status(409).json({ success: false, message: 'Your team already has a project for this event', project: existing });
      return;
    }

    const project = await Project.create({
      eventId, teamId: team._id, title, description,
      repoUrl, demoUrl, videoUrl, slideUrl, trackId, tags: tags || [],
      status: 'draft',
    });

    await audit({ actorId: req.user!.id, action: 'project.created', resource: 'Project', resourceId: project._id.toString(), eventId, ip: req.ip });
    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

export const getProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('teamId', 'name members leaderId')
      .populate('trackId', 'name');
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id).populate('teamId');
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const team = project.teamId as any;
    const isTeamMember = team.members.map((m: any) => m.toString()).includes(req.user!.id);
    if (!isTeamMember && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized to edit this project' });
      return;
    }

    // Deadline enforcement
    const event = await Event.findById(project.eventId);
    if (event && new Date() > event.submissionDeadline && project.status === 'submitted' && req.user!.role !== 'admin') {
      res.status(400).json({ success: false, message: 'Submission deadline has passed' });
      return;
    }

    const allowedFields = ['title', 'description', 'repoUrl', 'demoUrl', 'videoUrl', 'slideUrl', 'coverImageUrl', 'trackId', 'tags'];
    const changes: string[] = [];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if ((project as any)[field] !== req.body[field]) changes.push(field);
        (project as any)[field] = req.body[field];
      }
    }

    if (changes.length > 0) {
      project.editHistory.push({
        editedAt: new Date(),
        editedBy: req.user!.id as any,
        changeDescription: `Updated: ${changes.join(', ')}`,
      });
    }

    await project.save();
    await audit({ actorId: req.user!.id, action: 'project.updated', resource: 'Project', resourceId: project._id.toString(), eventId: project.eventId.toString(), ip: req.ip });
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

export const submitProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id).populate('teamId');
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const team = project.teamId as any;
    const isLeader = team.leaderId.toString() === req.user!.id;
    const isTeamMember = team.members.map((m: any) => m.toString()).includes(req.user!.id);
    if (!isTeamMember && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    const event = await Event.findById(project.eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    const now = new Date();
    if (now > event.submissionDeadline) {
      res.status(400).json({ success: false, message: 'Submission deadline has passed' });
      return;
    }
    if (now < event.submissionStart) {
      res.status(400).json({ success: false, message: 'Submissions are not open yet' });
      return;
    }

    project.status = 'submitted';
    project.submittedAt = now;
    await project.save();

    await audit({ actorId: req.user!.id, action: 'project.submitted', resource: 'Project', resourceId: project._id.toString(), eventId: project.eventId.toString(), ip: req.ip });
    await fireWebhook(project.eventId.toString(), 'project.submitted', { projectId: project._id, title: project.title });

    res.json({ success: true, message: 'Project submitted successfully', project });
  } catch (err) {
    next(err);
  }
};

export const getMyProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params;
    const team = await Team.findOne({ eventId, members: req.user!.id });
    if (!team) {
      res.json({ success: true, project: null });
      return;
    }
    const project = await Project.findOne({ eventId, teamId: team._id });
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};
