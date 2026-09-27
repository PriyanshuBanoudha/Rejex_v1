import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Score } from '../models/Score';
import { Project } from '../models/Project';
import { Event } from '../models/Event';
import { stringify } from 'csv-stringify';

function sendCsv(res: Response, filename: string, columns: string[], rows: any[][]): void {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  stringify([columns, ...rows], (err, output) => {
    if (err) {
      res.status(500).json({ success: false, message: 'CSV generation failed' });
      return;
    }
    res.send(output);
  });
}

export const exportScores = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    if (req.user!.role !== 'admin' && req.user!.role !== 'organizer' && event.organizerId.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Not authorized' }); return;
    }

    const scores = await Score.find({ eventId })
      .populate('judgeId', 'name email')
      .populate('projectId', 'title')
      .lean();

    const columns = ['Judge Name', 'Judge Email', 'Project Title', 'Total Raw Score', 'Weighted Score', 'Normalized Score (0-100)', 'Z-Score', 'Final Score', 'Submitted At'];
    const rows = scores.map((s: any) => [
      s.judgeId?.name || '',
      s.judgeId?.email || '',
      s.projectId?.title || '',
      s.totalRawScore,
      s.weightedScore,
      s.normalizedScore,
      s.zScore ?? '',
      s.finalScore ?? '',
      s.submittedAt?.toISOString() || '',
    ]);

    sendCsv(res, `scores-${eventId}.csv`, columns, rows);
  } catch (err) {
    next(err);
  }
};

export const exportProjects = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    if (req.user!.role !== 'admin' && req.user!.role !== 'organizer' && event.organizerId.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Not authorized' }); return;
    }

    const projects = await Project.find({ eventId })
      .populate('teamId', 'name')
      .populate('trackId', 'name')
      .lean();

    const columns = ['Project ID', 'Title', 'Team', 'Track', 'Status', 'Repo URL', 'Demo URL', 'Tags', 'Submitted At'];
    const rows = projects.map((p: any) => [
      p._id.toString(),
      p.title,
      p.teamId?.name || '',
      p.trackId?.name || '',
      p.status,
      p.repoUrl || '',
      p.demoUrl || '',
      (p.tags || []).join('; '),
      p.submittedAt?.toISOString() || '',
    ]);

    sendCsv(res, `projects-${eventId}.csv`, columns, rows);
  } catch (err) {
    next(err);
  }
};

export const bulkImportProjects = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId, projects } = req.body;
    if (!Array.isArray(projects) || projects.length === 0) {
      res.status(400).json({ success: false, message: 'projects array required' }); return;
    }

    const event = await Event.findById(eventId);
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    if (req.user!.role !== 'admin' && req.user!.role !== 'organizer' && event.organizerId.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Not authorized' }); return;
    }

    const created = await Project.insertMany(
      projects.map((p: any) => ({ ...p, eventId, status: p.status || 'draft' })),
      { ordered: false }
    );
    res.status(201).json({ success: true, created: created.length });
  } catch (err) {
    next(err);
  }
};
