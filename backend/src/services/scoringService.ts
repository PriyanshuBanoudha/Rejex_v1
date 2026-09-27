import { Types } from 'mongoose';
import { Score } from '../models/Score';
import { Rubric, IRubricCriterion } from '../models/Rubric';
import { JudgeAssignment } from '../models/JudgeAssignment';
import { Project } from '../models/Project';

/**
 * Computes the weighted rubric score for a set of criterion scores.
 * normalizedScore = (Σ rawScore_i × weight_i) / (Σ maxScore_i × weight_i) × 100
 */
export function computeWeightedScore(
  criteriaScores: Array<{ criterionId: Types.ObjectId; rawScore: number }>,
  rubricCriteria: IRubricCriterion[]
): { weightedScore: number; normalizedScore: number; totalRawScore: number } {
  let totalRawScore = 0;
  let weightedScore = 0;
  let maxPossible = 0;

  for (const cs of criteriaScores) {
    const criterion = rubricCriteria.find(
      (c) => c._id?.toString() === cs.criterionId.toString()
    );
    if (!criterion) continue;

    totalRawScore += cs.rawScore;
    weightedScore += cs.rawScore * criterion.weight;
    maxPossible += criterion.maxScore * criterion.weight;
  }

  const normalizedScore = maxPossible > 0 ? (weightedScore / maxPossible) * 100 : 0;

  return {
    totalRawScore: Math.round(totalRawScore * 100) / 100,
    weightedScore: Math.round(weightedScore * 100) / 100,
    normalizedScore: Math.round(normalizedScore * 100) / 100,
  };
}

/**
 * Cross-judge Z-score normalisation.
 *
 * For each judge j:
 *   μ_j  = mean of all normalizedScore values given by judge j in this event
 *   σ_j  = std deviation of those scores
 *   z_ij = (score_ij - μ_j) / σ_j     (if σ_j > 0, else 0)
 *
 * Final project score = mean(z_ij) across all judges who scored it.
 * Projects with a single judge use their raw normalizedScore directly.
 */
export async function runZScoreNormalization(eventId: string): Promise<void> {
  const scores = await Score.find({ eventId });
  if (scores.length === 0) return;

  // Group scores by judge
  const byJudge = new Map<string, typeof scores>();
  for (const s of scores) {
    const jid = s.judgeId.toString();
    if (!byJudge.has(jid)) byJudge.set(jid, []);
    byJudge.get(jid)!.push(s);
  }

  // Compute per-judge mean and std-dev
  const judgeStats = new Map<string, { mean: number; std: number }>();
  for (const [judgeId, judgeScores] of byJudge) {
    const vals = judgeScores.map((s) => s.normalizedScore);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / vals.length;
    const std = Math.sqrt(variance);
    judgeStats.set(judgeId, { mean, std });
  }

  // Compute z-score for each score record
  const updates: Promise<any>[] = [];
  for (const s of scores) {
    const jid = s.judgeId.toString();
    const { mean, std } = judgeStats.get(jid)!;
    const zScore = std > 0 ? (s.normalizedScore - mean) / std : 0;
    updates.push(
      Score.updateOne({ _id: s._id }, { $set: { zScore: Math.round(zScore * 10000) / 10000 } })
    );
  }
  await Promise.all(updates);

  // Compute final score per project = mean z-score across judges
  const byProject = new Map<string, number[]>();
  const updatedScores = await Score.find({ eventId });
  for (const s of updatedScores) {
    const pid = s.projectId.toString();
    if (!byProject.has(pid)) byProject.set(pid, []);
    const zScore = s.zScore !== undefined ? s.zScore : s.normalizedScore;
    byProject.get(pid)!.push(zScore);
  }

  const finalUpdates: Promise<any>[] = [];
  for (const [projectId, zScores] of byProject) {
    const finalScore =
      zScores.length === 1
        ? updatedScores.find((s) => s.projectId.toString() === projectId)?.normalizedScore ?? 0
        : zScores.reduce((a, b) => a + b, 0) / zScores.length;

    // Update all score records for this project with the finalScore
    finalUpdates.push(
      Score.updateMany(
        { eventId, projectId: new Types.ObjectId(projectId) },
        { $set: { finalScore: Math.round(finalScore * 10000) / 10000 } }
      )
    );
  }
  await Promise.all(finalUpdates);
}

/**
 * Get ranked projects for an event using normalized final scores.
 * Falls back to normalizedScore if zScore normalization hasn't run.
 * Tiebreaker: community vote count.
 */
export async function getRankedProjects(
  eventId: string,
  trackId?: string
): Promise<Array<{ projectId: string; rank: number; score: number; voteCount?: number }>> {
  const { Vote } = await import('../models/Vote');

  const filter: any = { eventId, projectId: { $exists: true } };

  // Aggregate: get best finalScore per project
  const pipeline: any[] = [
    { $match: { eventId: new Types.ObjectId(eventId) } },
    {
      $group: {
        _id: '$projectId',
        avgFinalScore: { $avg: { $ifNull: ['$finalScore', '$normalizedScore'] } },
        scoreCount: { $sum: 1 },
      },
    },
    { $sort: { avgFinalScore: -1 } },
  ];

  if (trackId) {
    // join with project to filter by track
    pipeline.splice(1, 0, {
      $lookup: { from: 'projects', localField: 'projectId', foreignField: '_id', as: 'proj' },
    });
    pipeline.splice(2, 0, {
      $match: { 'proj.trackId': new Types.ObjectId(trackId) },
    });
  }

  const results = await Score.aggregate(pipeline);

  // Get vote counts
  const projectIds = results.map((r: any) => r._id);
  const voteCounts = await Vote.aggregate([
    { $match: { eventId: new Types.ObjectId(eventId), projectId: { $in: projectIds } } },
    { $group: { _id: '$projectId', count: { $sum: 1 } } },
  ]);
  const voteMap = new Map(voteCounts.map((v: any) => [v._id.toString(), v.count]));

  return results.map((r: any, idx: number) => ({
    projectId: r._id.toString(),
    rank: idx + 1,
    score: Math.round(r.avgFinalScore * 100) / 100,
    voteCount: voteMap.get(r._id.toString()) || 0,
  }));
}
