import { Types } from 'mongoose';
import { PairwiseComparison } from '../models/PairwiseComparison';
import { Project } from '../models/Project';

/**
 * Bradley-Terry model for pairwise ranking.
 *
 * For each project i, we estimate a "strength" rating r_i such that:
 *   P(i beats j) = r_i / (r_i + r_j)
 *
 * We use iterative maximum likelihood estimation (MLE):
 *   r_i(new) = wins_i / Σ_j (comparisons_ij / (r_i + r_j))
 * until convergence (|delta| < epsilon or max iterations).
 *
 * References: Bradley & Terry (1952), Hunter (2004) MM algorithm.
 */
export async function computeBradleyTerryRankings(
  eventId: string,
  trackId?: string
): Promise<Array<{ projectId: string; rating: number; rank: number }>> {
  const filter: any = { eventId: new Types.ObjectId(eventId) };
  if (trackId) filter.trackId = new Types.ObjectId(trackId);

  const comparisons = await PairwiseComparison.find(filter).lean();
  if (comparisons.length === 0) return [];

  // Gather all project IDs that appeared in comparisons
  const projectIds = new Set<string>();
  for (const c of comparisons) {
    projectIds.add(c.projectAId.toString());
    projectIds.add(c.projectBId.toString());
  }
  const ids = Array.from(projectIds);

  // Initialize ratings
  const ratings = new Map<string, number>();
  for (const id of ids) ratings.set(id, 1.0);

  // Count wins per project
  const wins = new Map<string, number>();
  for (const id of ids) wins.set(id, 0);
  for (const c of comparisons) {
    const winner = c.winnerId.toString();
    wins.set(winner, (wins.get(winner) || 0) + 1);
  }

  // MM (Minorization-Maximization) iteration
  const MAX_ITER = 500;
  const EPSILON = 1e-6;

  for (let iter = 0; iter < MAX_ITER; iter++) {
    let maxDelta = 0;

    for (const i of ids) {
      const w_i = wins.get(i) || 0;

      let denominator = 0;
      for (const c of comparisons) {
        const a = c.projectAId.toString();
        const b = c.projectBId.toString();
        if (a === i || b === i) {
          const r_i = ratings.get(i) || 1;
          const other = a === i ? b : a;
          const r_j = ratings.get(other) || 1;
          denominator += 1 / (r_i + r_j);
        }
      }

      const newRating = denominator > 0 ? w_i / denominator : ratings.get(i)!;
      const delta = Math.abs(newRating - (ratings.get(i) || 1));
      if (delta > maxDelta) maxDelta = delta;
      ratings.set(i, newRating);
    }

    // Normalize so max = 1
    const maxR = Math.max(...Array.from(ratings.values()));
    if (maxR > 0) {
      for (const [id, r] of ratings) ratings.set(id, r / maxR);
    }

    if (maxDelta < EPSILON) break;
  }

  // Sort by rating descending
  const sorted = Array.from(ratings.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([projectId, rating], idx) => ({
      projectId,
      rating: Math.round(rating * 10000) / 10000,
      rank: idx + 1,
    }));

  return sorted;
}
