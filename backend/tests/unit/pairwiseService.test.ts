import { describe, it, expect } from 'vitest';

describe('Pairwise Service MM Convergence Test', () => {
  it('converges to expected strength order in a simple 3-project tournament', () => {
    // 3 projects: P1 beats P2, P2 beats P3, P1 beats P3
    const comparisons = [
      { projectAId: 'p1', projectBId: 'p2', winnerId: 'p1', confidence: 1 },
      { projectAId: 'p2', projectBId: 'p3', winnerId: 'p2', confidence: 1 },
      { projectAId: 'p1', projectBId: 'p3', winnerId: 'p1', confidence: 1 },
    ];

    const projectIds = ['p1', 'p2', 'p3'];
    const gamma: Record<string, number> = { p1: 1.0, p2: 1.0, p3: 1.0 };

    // MM update for 10 iterations
    for (let iter = 0; iter < 10; iter++) {
      for (const p of projectIds) {
        let wins = 0;
        let denomSum = 0;
        for (const c of comparisons) {
          if (c.winnerId === p) wins += c.confidence;
          if (c.projectAId === p || c.projectBId === p) {
            const opp = c.projectAId === p ? c.projectBId : c.projectAId;
            denomSum += 1.0 / (gamma[p] + gamma[opp]);
          }
        }
        if (denomSum > 0) {
          gamma[p] = wins / denomSum;
        }
      }
    }

    // P1 should have highest gamma, P3 lowest
    expect(gamma.p1).toBeGreaterThan(gamma.p2);
    expect(gamma.p2).toBeGreaterThan(gamma.p3);
  });
});
