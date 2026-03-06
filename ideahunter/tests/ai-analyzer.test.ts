import { calcTrendScore } from '@/lib/ai/analyzer';

describe('AI Analyzer', () => {
  test('calcTrendScore: 점수 계산 정확성', () => {
    const analysis = { revenue_potential: 5, difficulty: 2 };
    const score = calcTrendScore(100, 50, analysis);
    expect(score).toBeGreaterThan(0);
    expect(typeof score).toBe('number');
  });

  test('calcTrendScore: 낮은 점수', () => {
    const analysis = { revenue_potential: 1, difficulty: 5 };
    const score = calcTrendScore(1, 0, analysis);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test('calcTrendScore: 높은 점수', () => {
    const analysis = { revenue_potential: 5, difficulty: 1 };
    const score = calcTrendScore(1000, 500, analysis);
    expect(score).toBeGreaterThan(50);
  });
});
