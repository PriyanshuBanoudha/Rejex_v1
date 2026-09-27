import { describe, it, expect } from 'vitest';
import { computeWeightedScore, runZScoreNormalization } from '../../src/services/scoringService';

describe('Scoring Service Unit Tests', () => {
  it('computes weighted score correctly', () => {
    const criteria = [
      { _id: 'c1', maxScore: 10, weight: 2.0 },
      { _id: 'c2', maxScore: 10, weight: 3.0 },
    ];
    const scores = [
      { criterionId: 'c1', rawScore: 8 },
      { criterionId: 'c2', rawScore: 9 },
    ];

    const res = computeWeightedScore(scores, criteria);
    // (8*2 + 9*3) = 16 + 27 = 43
    expect(res.weightedScore).toBe(43);
    expect(res.totalRawScore).toBe(17);
    // max possible = 10*2 + 10*3 = 50 => normalized = (43/50)*100 = 86
    expect(res.normalizedScore).toBe(86);
  });

  it('handles zero weight gracefully', () => {
    const criteria = [{ _id: 'c1', maxScore: 10, weight: 0 }];
    const scores = [{ criterionId: 'c1', rawScore: 5 }];
    const res = computeWeightedScore(scores, criteria);
    expect(res.weightedScore).toBe(0);
    expect(res.normalizedScore).toBe(0);
  });
});
