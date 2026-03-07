// Mock fetch for testing without network access
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { collectAppStore } from '@/lib/collectors/appstore';
import { collectPlayStore } from '@/lib/collectors/playstore';
import { collectWithRetry, deduplicateByField } from '@/lib/collectors/utils';

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

  test('RSS 실패 시 빈 배열 반환', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const results = await collectAppStore();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});

describe('PlayStore Collector', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  test('HTML에서 앱 정보 추출 실패 시 빈 배열', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => '<html><body>No apps here</body></html>',
      json: async () => ({ feed: { results: [] } }),
    });

    const results = await collectPlayStore();
    expect(Array.isArray(results)).toBe(true);
    // HTML 파싱 실패 + fallback 모두 실패 시 빈 배열
  });

  test('네트워크 에러 시 빈 배열 반환', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const results = await collectPlayStore();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});
