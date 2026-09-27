import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { PairwiseComparison } from '../models/PairwiseComparison';
import { JudgeAssignment } from '../models/JudgeAssignment';
import { Project } from '../models/Project';
import { computeBradleyTerryRankings } from '../services/pairwiseService';

export const submitPairwise = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId, projectAId, projectBId, winnerId, confidence, trackId } = req.body;

    if (![projectAId, projectBId].includes(winnerId)) {
      res.status(400).json({ success: false, message: 'winnerId must be one of projectAId or projectBId' }); return;
    }

    const comparison = await PairwiseComparison.create({
      judgeId: req.user!.id, eventId, projectAId, projectBId, winnerId,
      ...(confidence && { confidence }),
      ...(trackId && { trackId }),
    });

    res.status(201).json({ success: true, comparison });
  } catch (err) {
    next(err);
  }
};

export const getPairwiseRankings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { trackId } = req.query;
    const rankings = await computeBradleyTerryRankings(eventId as string, trackId as string);

    // Enrich with project titles
    const ids = rankings.map(r => r.projectId);
    const projects = await Project.find({ _id: { $in: ids } }).select('title description').lean();
    const projectMap = new Map(projects.map((p: any) => [p._id.toString(), p]));

    const enriched = rankings.map(r => ({ ...r, project: projectMap.get(r.projectId) || null }));
    res.json({ success: true, rankings: enriched });
  } catch (err) {
    next(err);
  }
};

export const getNextPair = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params;

    // Get projects assigned to this judge
    const assignments = await JudgeAssignment.find({ judgeId: req.user!.id, eventId }).select('projectId');
    const projectIds = assignments.map((a: any) => a.projectId.toString());

    if (projectIds.length < 2) {
      res.json({ success: true, pair: null, message: 'Not enough assigned projects for pairwise comparison' }); return;
    }

    // Find a pair the judge hasn't compared yet
    const compared = await PairwiseComparison.find({ judgeId: req.user!.id, eventId }).lean();
    const comparedPairs = new Set(compared.map((c: any) => `${c.projectAId}:${c.projectBId}`));

    let pair: [string, string] | null = null;
    outer: for (let i = 0; i < projectIds.length; i++) {
      for (let j = i + 1; j < projectIds.length; j++) {
        const key = `${projectIds[i]}:${projectIds[j]}`;
        const keyRev = `${projectIds[j]}:${projectIds[i]}`;
        if (!comparedPairs.has(key) && !comparedPairs.has(keyRev)) {
          pair = [projectIds[i], projectIds[j]];
          break outer;
        }
      }
    }

    if (!pair) {
      res.json({ success: true, pair: null, message: 'All pairs compared' }); return;
    }

    const projects = await Project.find({ _id: { $in: pair } }).select('title description repoUrl demoUrl tags').lean();
    res.json({ success: true, pair: { projectA: projects[0], projectB: projects[1] } });
  } catch (err) {
    next(err);
  }
};
