import { generateDailyDigest } from '@/lib/digest-generator';

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

// Mock supabase
const mockUpsert = jest.fn();
const mockSupabaseFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: jest.fn(() => ({
    from: mockSupabaseFrom,
  })),
}));

const makeIdea = (i: number) => ({
  id: `id-${i}`,
  title: `아이디어 ${i}`,
  summary_ko: `요약 ${i}`,
  trend_score: 100 - i,
  source: 'hackernews',
  source_url: `https://example.com/${i}`,
});

const setupSupabaseMock = (ideas: ReturnType<typeof makeIdea>[]) => {
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'ideas') {
      return {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: ideas, error: null }),
      };
    }
    if (table === 'daily_digests') {
      return {
        upsert: mockUpsert,
      };
    }
    return {};
  });
};

describe('generateDailyDigest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GROQ_API_KEY = 'test-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  test('아이디어가 3개 미만이면 null 반환', async () => {
    setupSupabaseMock([makeIdea(1), makeIdea(2)]);

    const result = await generateDailyDigest();

    expect(result).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('아이디어가 0개이면 null 반환', async () => {
    setupSupabaseMock([]);

    const result = await generateDailyDigest();

    expect(result).toBeNull();
  });

  test('정상 데이터로 digest 생성 후 결과 반환', async () => {
    const ideas = Array.from({ length: 5 }, (_, i) => makeIdea(i + 1));
    setupSupabaseMock(ideas);
    mockUpsert.mockResolvedValue({ error: null });
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            hot_topics: ['AI', 'SaaS', '자동화'],
            market_insights: '시장이 빠르게 성장하고 있습니다.',
          }),
        },
      }],
    });

    const result = await generateDailyDigest();

    expect(result).not.toBeNull();
    expect(result!.ideas_count).toBe(5);
    expect(result!.hot_topics_count).toBe(3);
    expect(typeof result!.date).toBe('string');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        top_ideas: ideas,
        hot_topics: ['AI', 'SaaS', '자동화'],
        market_insights: '시장이 빠르게 성장하고 있습니다.',
      }),
      { onConflict: 'date' }
    );
  });

  test('Groq API 오류 시 hot_topics 빈 배열로 upsert', async () => {
    const ideas = Array.from({ length: 4 }, (_, i) => makeIdea(i + 1));
    setupSupabaseMock(ideas);
    mockUpsert.mockResolvedValue({ error: null });
    mockCreate.mockRejectedValue(new Error('Groq API rate limited'));

    const result = await generateDailyDigest();

    expect(result).not.toBeNull();
    expect(result!.hot_topics_count).toBe(0);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ hot_topics: [], market_insights: '' }),
      { onConflict: 'date' }
    );
  });

  test('Supabase upsert 오류 시 null 반환', async () => {
    const ideas = Array.from({ length: 4 }, (_, i) => makeIdea(i + 1));
    setupSupabaseMock(ideas);
    mockUpsert.mockResolvedValue({ error: { message: 'DB error' } });
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({ hot_topics: ['AI'], market_insights: '분석' }),
        },
      }],
    });

    const result = await generateDailyDigest();

    expect(result).toBeNull();
  });
});
