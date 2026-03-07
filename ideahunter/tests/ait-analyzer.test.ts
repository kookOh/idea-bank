import { analyzeAitSuitability } from '@/lib/ai/ait-analyzer';

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

describe('analyzeAitSuitability', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    process.env.GROQ_API_KEY = 'test-key';
  });

  test('금지 카테고리 필터링 - 금융', async () => {
    const result = await analyzeAitSuitability({
      title: '주식 투자 추천 앱',
      summary_ko: '금융 상품 투자를 추천하는 서비스',
      tags: ['금융', '투자'],
    });

    expect(result.ait_score).toBe(0);
    expect(result.ait_blocked_reason).toContain('금지 카테고리');
    expect(result.ait_category).toBe('차단됨');
  });

  test('금지 카테고리 필터링 - 암호화폐', async () => {
    const result = await analyzeAitSuitability({
      title: 'Crypto Trading Bot',
      summary_ko: 'crypto 거래 자동화',
      tags: ['crypto'],
    });

    expect(result.ait_score).toBe(0);
    expect(result.ait_blocked_reason).toContain('금지 카테고리');
  });

  test('정상 아이디어 - Groq 분석 성공', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            ait_score: 85,
            ait_category: '유틸리티',
            ait_blocked_reason: null,
            ait_ad_revenue_estimate: '월 200만원',
            ait_target_type: 'webview',
          }),
        },
      }],
    });

    const result = await analyzeAitSuitability({
      title: '할일 관리 앱',
      summary_ko: '간단한 할일 관리 서비스',
      tags: ['유틸리티', 'B2C'],
    });

    expect(result.ait_score).toBe(85);
    expect(result.ait_category).toBe('유틸리티');
    expect(result.ait_blocked_reason).toBeNull();
    expect(result.ait_target_type).toBe('webview');
  });

  test('적합도 점수 0-100 범위 클램핑', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            ait_score: 150,
            ait_category: '게임',
            ait_target_type: 'react-native',
          }),
        },
      }],
    });

    const result = await analyzeAitSuitability({
      title: '모바일 게임',
      summary_ko: '캐주얼 게임',
      tags: ['게임'],
    });

    expect(result.ait_score).toBe(100);
    expect(result.ait_score).toBeLessThanOrEqual(100);
    expect(result.ait_score).toBeGreaterThanOrEqual(0);
  });

  test('적합도 점수 음수 클램핑', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({ ait_score: -10 }),
        },
      }],
    });

    const result = await analyzeAitSuitability({
      title: '테스트',
      summary_ko: '테스트',
    });

    expect(result.ait_score).toBe(0);
  });

  test('react-native 타입 판단', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            ait_score: 70,
            ait_category: '게임',
            ait_target_type: 'react-native',
          }),
        },
      }],
    });

    const result = await analyzeAitSuitability({
      title: '카메라 앱',
      summary_ko: '네이티브 카메라 기능',
      tags: ['카메라'],
    });

    expect(result.ait_target_type).toBe('react-native');
  });

  test('Groq API 에러 시 폴백', async () => {
    mockCreate.mockRejectedValue(new Error('API error'));

    const result = await analyzeAitSuitability({
      title: '테스트 앱',
      summary_ko: '테스트',
    });

    expect(result.ait_score).toBe(50);
    expect(result.ait_category).toBe('기타');
    expect(result.ait_blocked_reason).toBeNull();
    expect(result.ait_target_type).toBe('webview');
  });

  test('비정상 JSON 응답 시 기본값', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'not json at all' } }],
    });

    const result = await analyzeAitSuitability({
      title: '테스트',
      summary_ko: '테스트',
    });

    // JSON 파싱 실패 시 기본값
    expect(result.ait_score).toBe(50);
    expect(result.ait_target_type).toBe('webview');
  });
});
