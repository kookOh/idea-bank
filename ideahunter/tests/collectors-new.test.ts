// Mock google-play-scraper before imports
jest.mock('google-play-scraper', () => ({
  __esModule: true,
  default: {
    list: jest.fn(),
    category: { APPLICATION: 'APPLICATION' },
    collection: { TOP_FREE: 'topselling_free', GROSSING: 'topgrossing' },
  },
}));

// Mock fetch for testing without network access
const mockFetch = jest.fn();
global.fetch = mockFetch;

import gplay from 'google-play-scraper';
import { collectAppStore } from '@/lib/collectors/appstore';
import { collectPlayStore } from '@/lib/collectors/playstore';
import { collectWithRetry, deduplicateByField } from '@/lib/collectors/utils';
import { isMegaApp, isExcludedCategory } from '@/lib/collectors/mega-filter';

const mockGplay = gplay as jest.Mocked<typeof gplay>;

describe('collectWithRetry', () => {
  test('성공 시 즉시 반환', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await collectWithRetry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('실패 후 재시도하여 성공', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockResolvedValueOnce('success');
    const result = await collectWithRetry(fn, 3, 10);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('최대 재시도 후 에러 throw', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fail'));
    await expect(collectWithRetry(fn, 2, 10)).rejects.toThrow('always fail');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('deduplicateByField', () => {
  test('필드 기준 중복 제거', () => {
    const items = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 1, name: 'c' },
    ];
    const result = deduplicateByField(items, 'id');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('a');
    expect(result[1].name).toBe('b');
  });

  test('빈 배열 처리', () => {
    const result = deduplicateByField([] as { id: number }[], 'id');
    expect(result).toHaveLength(0);
  });
});

describe('mega-filter', () => {
  test('대형 앱 패키지 필터링', () => {
    expect(isMegaApp('com.facebook.katana')).toBe(true);
    expect(isMegaApp('com.google.android.gm')).toBe(true);
    expect(isMegaApp('com.smallstartup.app')).toBe(false);
  });

  test('게임 카테고리 필터링', () => {
    expect(isExcludedCategory('GAME')).toBe(true);
    expect(isExcludedCategory('GAME_ACTION')).toBe(true);
    expect(isExcludedCategory('GAME_PUZZLE')).toBe(true);
    expect(isExcludedCategory('GAME_CASUAL')).toBe(true);
    expect(isExcludedCategory('PRODUCTIVITY')).toBe(false);
    expect(isExcludedCategory('FINANCE')).toBe(false);
    expect(isExcludedCategory('HEALTH_AND_FITNESS')).toBe(false);
  });

  test('대소문자 무관하게 게임 카테고리 필터링', () => {
    expect(isExcludedCategory('game_action')).toBe(true);
    expect(isExcludedCategory('Game_Puzzle')).toBe(true);
  });
});

describe('AppStore Collector', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  test('Apple RSS Feed에서 앱 수집', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        feed: {
          results: [
            {
              id: '123',
              name: '카카오톡',
              url: 'https://apps.apple.com/kr/app/id123',
              artistName: 'Kakao',
              genres: [{ genreId: '6005', name: '소셜 네트워킹', url: '' }],
            },
            {
              id: '456',
              name: '네이버',
              url: 'https://apps.apple.com/kr/app/id456',
              artistName: 'Naver',
              genres: [{ genreId: '6002', name: '유틸리티', url: '' }],
            },
          ],
        },
      }),
    });

    const results = await collectAppStore();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(2);
    expect(results[0]).toHaveProperty('title', '카카오톡');
    expect(results[0]).toHaveProperty('source', 'appstore');
    expect(results[0].source_url).toContain('apps.apple.com');
  });

  test('AppStore description에 장르와 개발사 포함', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        feed: {
          results: [
            {
              id: '789',
              name: '테스트 앱',
              url: 'https://apps.apple.com/kr/app/id789',
              artistName: 'TestDev',
              genres: [{ genreId: '6015', name: '금융', url: '' }],
            },
          ],
        },
      }),
    });

    const results = await collectAppStore();
    expect(results[0].description).toContain('금융 앱');
    expect(results[0].description).toContain('TestDev');
    expect(results[0].description).toContain('iOS App Store 인기 무료 앱');
  });

  test('RSS 실패 시 빈 배열 반환', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const results = await collectAppStore();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});

describe('PlayStore Collector (google-play-scraper)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    (mockGplay.list as jest.Mock).mockReset();
  });

  test('google-play-scraper로 앱 수집', async () => {
    const mockApps = [
      {
        appId: 'com.test.financeapp',
        title: '가계부 앱',
        summary: '편리한 가계부 관리',
        developer: 'TestDev',
        genre: '금융',
        genreId: 'FINANCE',
        score: 4.5,
        url: 'https://play.google.com/store/apps/details?id=com.test.financeapp',
      },
    ];
    (mockGplay.list as jest.Mock).mockResolvedValue(mockApps);

    const results = await collectPlayStore();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('title', '가계부 앱');
    expect(results[0]).toHaveProperty('source', 'playstore');
    expect(results[0].score).toBe(Math.round(4.5 * 20));
  });

  test('게임 카테고리 앱은 수집에서 제외', async () => {
    const mockApps = [
      {
        appId: 'com.test.gameapp',
        title: '퍼즐 게임',
        summary: '재미있는 퍼즐',
        developer: 'GameDev',
        genre: '게임/퍼즐',
        genreId: 'GAME_PUZZLE',
        score: 4.8,
        url: 'https://play.google.com/store/apps/details?id=com.test.gameapp',
      },
      {
        appId: 'com.test.financeapp',
        title: '가계부',
        summary: '가계부 관리',
        developer: 'FinDev',
        genre: '금융',
        genreId: 'FINANCE',
        score: 4.2,
        url: 'https://play.google.com/store/apps/details?id=com.test.financeapp',
      },
    ];
    (mockGplay.list as jest.Mock).mockResolvedValue(mockApps);

    const results = await collectPlayStore();
    expect(results.every((r) => r.title !== '퍼즐 게임')).toBe(true);
    expect(results.some((r) => r.title === '가계부')).toBe(true);
  });

  test('대형 앱(mega-app)은 수집에서 제외', async () => {
    const mockApps = [
      {
        appId: 'com.facebook.katana',
        title: 'Facebook',
        summary: '소셜 미디어',
        developer: 'Meta',
        genre: '소셜',
        genreId: 'SOCIAL',
        score: 4.0,
        url: 'https://play.google.com/store/apps/details?id=com.facebook.katana',
      },
    ];
    (mockGplay.list as jest.Mock).mockResolvedValue(mockApps);

    const results = await collectPlayStore();
    expect(results.every((r) => r.title !== 'Facebook')).toBe(true);
  });

  test('google-play-scraper 실패 시 AppBrain fallback 시도', async () => {
    (mockGplay.list as jest.Mock).mockRejectedValue(new Error('API error'));
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => '<html><body>No apps here</body></html>',
    });

    const results = await collectPlayStore();
    expect(Array.isArray(results)).toBe(true);
    // AppBrain HTML에 앱 없으면 빈 배열
    expect(results.length).toBe(0);
  });

  test('네트워크 에러 시 빈 배열 반환', async () => {
    (mockGplay.list as jest.Mock).mockRejectedValue(new Error('Network error'));
    mockFetch.mockRejectedValue(new Error('Network error'));

    const results = await collectPlayStore();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});

describe('analyzer source context', () => {
  test('analyzeIdea 함수가 source 파라미터를 받음', async () => {
    // analyzeIdea가 source 파라미터를 받는지 타입 수준에서 확인
    const { analyzeIdea } = await import('@/lib/ai/analyzer');
    expect(analyzeIdea.length).toBeGreaterThanOrEqual(2);
  });
});
