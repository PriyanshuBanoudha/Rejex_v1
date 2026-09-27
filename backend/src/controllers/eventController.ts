import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Event } from '../models/Event';
import { Track } from '../models/Track';
import { audit } from '../services/auditService';

export const createEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      title, description, registrationStart, registrationEnd,
      submissionStart, submissionDeadline, judgingStart, judgingEnd,
      votingStart, votingEnd, maxTeamSize, minTeamSize,
      allowSoloParticipants, tags, prizes,
    } = req.body;

    if (!title || !description || !registrationStart || !registrationEnd || !submissionStart || !submissionDeadline) {
      res.status(400).json({ success: false, message: 'Missing required event fields' });
      return;
    }

    const event = await Event.create({
      title, description, organizerId: req.user!.id,
      registrationStart: new Date(registrationStart),
      registrationEnd: new Date(registrationEnd),
      submissionStart: new Date(submissionStart),
      submissionDeadline: new Date(submissionDeadline),
      ...(judgingStart && { judgingStart: new Date(judgingStart) }),
      ...(judgingEnd && { judgingEnd: new Date(judgingEnd) }),
      ...(votingStart && { votingStart: new Date(votingStart) }),
      ...(votingEnd && { votingEnd: new Date(votingEnd) }),
      maxTeamSize: maxTeamSize || 4,
      minTeamSize: minTeamSize || 1,
      allowSoloParticipants: allowSoloParticipants !== false,
      tags: tags || [],
      prizes: prizes || [],
    });

    await audit({
      actorId: req.user!.id,
      action: 'event.created',
      resource: 'Event',
      resourceId: event._id.toString(),
      eventId: event._id.toString(),
      ip: req.ip,
    });

    res.status(201).json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

export const listEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string;
    const search = req.query.search as string;

    const filter: any = {};
    if (status) filter.status = status;
    if (search) filter.$text = { $search: search };
    // Non-admins only see non-draft events unless they're the organizer
    if (req.user?.role !== 'admin' && req.user?.role !== 'organizer') {
      filter.status = { $ne: 'draft' };
    }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('organizerId', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
    ]);

    res.json({ success: true, events, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

export const getEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizerId', 'name email')
      .populate('rubricId');

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    const tracks = await Track.find({ eventId: event._id });

    res.json({ success: true, event, tracks });
  } catch (err) {
    next(err);
  }
};

export const updateEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // Only event organizer or admin may update
    if (req.user!.role !== 'admin' && event.organizerId.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Not authorized to update this event' });
      return;
    }

    const allowedFields = [
      'title', 'description', 'bannerUrl', 'status',
      'registrationStart', 'registrationEnd', 'submissionStart', 'submissionDeadline',
      'judgingStart', 'judgingEnd', 'votingStart', 'votingEnd',
      'maxTeamSize', 'minTeamSize', 'allowSoloParticipants',
      'prizes', 'rubricId', 'votingEnabled', 'resultsRevealed', 'tags',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        (event as any)[field] = req.body[field];
      }
    }

    await event.save();

    await audit({
      actorId: req.user!.id,
      action: 'event.updated',
      resource: 'Event',
      resourceId: event._id.toString(),
      eventId: event._id.toString(),
      ip: req.ip,
    });

    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    if (req.user!.role !== 'admin' && event.organizerId.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    await Event.deleteOne({ _id: event._id });
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
};

// Track management
export const createTrack = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    if (req.user!.role !== 'admin' && event.organizerId.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { name, description, prizes } = req.body;
    const track = await Track.create({ eventId: event._id, name, description, prizes: prizes || [] });
    res.status(201).json({ success: true, track });
  } catch (err) {
    next(err);
  }
};

export const listTracks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tracks = await Track.find({ eventId: req.params.id });
    res.json({ success: true, tracks });
  } catch (err) {
    next(err);
  }
};
