import { calcTrendScore, analyzeIdea } from '@/lib/ai/analyzer';

// Mock groq-sdk
const mockCreate = jest.fn();
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

describe('calcTrendScore', () => {
  test('점수 계산 정확성', () => {
    const analysis = { revenue_potential: 5, difficulty: 2 };
    const score = calcTrendScore(100, 50, analysis);
    expect(score).toBeGreaterThan(0);
    expect(typeof score).toBe('number');
  });

  test('낮은 점수', () => {
    const analysis = { revenue_potential: 1, difficulty: 5 };
    const score = calcTrendScore(1, 0, analysis);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test('높은 점수', () => {
    const analysis = { revenue_potential: 5, difficulty: 1 };
    const score = calcTrendScore(1000, 500, analysis);
    expect(score).toBeGreaterThan(50);
  });
});

describe('analyzeIdea', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    process.env.GROQ_API_KEY = 'test-key';
  });

  test('정상 JSON 응답 파싱', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            summary_ko: '테스트 요약',
            market_size: '글로벌 $10B',
            difficulty: 3,
            revenue_potential: 4,
            competition: 2,
            recommended_stack: ['Next.js', 'Supabase'],
            mvp_days: 14,
            tags: ['SaaS', 'AI'],
          }),
        },
      }],
    });

    const result = await analyzeIdea('Test Idea', 'A test description');
    expect(result.summary_ko).toBe('테스트 요약');
    expect(result.market_size).toBe('글로벌 $10B');
    expect(result.difficulty).toBe(3);
    expect(result.revenue_potential).toBe(4);
    expect(result.recommended_stack).toEqual(['Next.js', 'Supabase']);
    expect(result.tags).toEqual(['SaaS', 'AI']);
  });

  test('비정상 JSON 응답 시 기본값 반환', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: { content: 'Here is my analysis: not json at all' },
      }],
    });

    const result = await analyzeIdea('Test', 'desc');
    expect(result.difficulty).toBe(3);
    expect(result.revenue_potential).toBe(3);
    expect(result.recommended_stack).toEqual(['Next.js', 'Supabase']);
  });

  test('Groq API 에러 시 폴백 반환', async () => {
    mockCreate.mockRejectedValue(new Error('API rate limited'));

    const result = await analyzeIdea('Test', 'description text');
    expect(result.difficulty).toBe(3);
    expect(result.revenue_potential).toBe(3);
    expect(result.summary_ko).toBe('description text'.slice(0, 100));
    expect(result.market_size).toBe('추정 불가');
  });

  test('경계값 클램핑 (difficulty/revenue_potential)', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            difficulty: 10,
            revenue_potential: -1,
            competition: 99,
          }),
        },
      }],
    });

    const result = await analyzeIdea('Test', 'desc');
    expect(result.difficulty).toBe(5);
    expect(result.revenue_potential).toBe(1);
    expect(result.competition).toBe(5);
  });
});
