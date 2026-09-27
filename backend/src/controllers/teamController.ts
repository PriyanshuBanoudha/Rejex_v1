import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Team } from '../models/Team';
import { Event } from '../models/Event';
import { audit } from '../services/auditService';

export const createTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId, name, description } = req.body;
    if (!eventId || !name) {
      res.status(400).json({ success: false, message: 'eventId and name are required' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    if (event.status !== 'open' && event.status !== 'draft') {
      res.status(400).json({ success: false, message: 'Event is not accepting teams' });
      return;
    }

    // Check user isn't already in a team for this event
    const existing = await Team.findOne({ eventId, members: req.user!.id });
    if (existing) {
      res.status(409).json({ success: false, message: 'You are already in a team for this event' });
      return;
    }

    const team = await Team.create({
      eventId,
      name,
      description,
      leaderId: req.user!.id,
      members: [req.user!.id],
    });

    await audit({
      actorId: req.user!.id,
      action: 'team.created',
      resource: 'Team',
      resourceId: team._id.toString(),
      eventId,
      ip: req.ip,
    });

    res.status(201).json({ success: true, team });
  } catch (err) {
    next(err);
  }
};

export const joinTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const inviteCode = req.params.inviteCode as string;
    const team = await Team.findOne({ inviteCode: inviteCode.toUpperCase() });

    if (!team) {
      res.status(404).json({ success: false, message: 'Invalid invite code' });
      return;
    }
    if (team.status === 'locked') {
      res.status(400).json({ success: false, message: 'This team is locked' });
      return;
    }

    const event = await Event.findById(team.eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // Max team size check
    if (team.members.length >= event.maxTeamSize) {
      res.status(400).json({ success: false, message: 'Team is full' });
      return;
    }

    // Already in this team?
    if (team.members.map((m:any) => m.toString()).includes(req.user!.id)) {
      res.status(409).json({ success: false, message: 'Already in this team' });
      return;
    }

    // Already in another team for this event?
    const otherTeam = await Team.findOne({
      eventId: team.eventId,
      members: req.user!.id,
      _id: { $ne: team._id },
    });
    if (otherTeam) {
      res.status(409).json({ success: false, message: 'Already in another team for this event' });
      return;
    }

    team.members.push(req.user!.id as any);
    await team.save();

    await audit({
      actorId: req.user!.id,
      action: 'team.joined',
      resource: 'Team',
      resourceId: team._id.toString(),
      eventId: team.eventId.toString(),
      ip: req.ip,
    });

    res.json({ success: true, message: 'Joined team successfully', team });
  } catch (err) {
    next(err);
  }
};

export const getTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const team = await Team.findById(req.params.id).populate('members', 'name email role');
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }
    res.json({ success: true, team });
  } catch (err) {
    next(err);
  }
};

export const lockTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }
    if (team.leaderId.toString() !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only the team leader can lock the team' });
      return;
    }

    team.status = 'locked';
    await team.save();
    res.json({ success: true, message: 'Team locked', team });
  } catch (err) {
    next(err);
  }
};

export const leaveTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }
    if (!team.members.map((m: any) => m.toString()).includes(req.user!.id)) {
      res.status(400).json({ success: false, message: 'Not in this team' });
      return;
    }
    if (team.leaderId.toString() === req.user!.id && team.members.length > 1) {
      res.status(400).json({ success: false, message: 'Transfer leadership before leaving' });
      return;
    }

    team.members = team.members.filter((m: any) => m.toString() !== req.user!.id) as any;
    await team.save();
    res.json({ success: true, message: 'Left team' });
  } catch (err) {
    next(err);
  }
};

export const getUserTeams = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teams = await Team.find({ members: req.user!.id }).populate('eventId', 'title status');
    res.json({ success: true, teams });
  } catch (err) {
    next(err);
  }
};
