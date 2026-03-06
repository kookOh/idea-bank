// Mock fetch for testing without network access
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { collectHackerNews } from '@/lib/collectors/hackernews';
import { collectReddit } from '@/lib/collectors/reddit';
import { collectGitHub } from '@/lib/collectors/github';

describe('Data Collectors', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  test('HackerNews: 결과 반환 및 구조 검증', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        hits: [
          {
            title: 'Show HN: My SaaS tool',
            story_text: 'A description of the tool',
            url: 'https://example.com',
            objectID: '123',
            points: 100,
            num_comments: 50,
          },
        ],
      }),
    });

    const results = await collectHackerNews();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('title', 'Show HN: My SaaS tool');
    expect(results[0]).toHaveProperty('source', 'hackernews');
    expect(results[0]).toHaveProperty('score', 100);
  });

  test('Reddit: 결과 반환 및 구조 검증', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        data: {
          children: [
            {
              data: {
                title: 'My side project',
                selftext: 'Description here',
                permalink: '/r/SideProject/comments/abc/my-side-project/',
                score: 25,
                num_comments: 10,
              },
            },
          ],
        },
      }),
    });

    const results = await collectReddit();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('source', 'reddit');
    expect(typeof results[0].score).toBe('number');
  });

  test('GitHub: 결과 반환 및 구조 검증', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        items: [
          {
            full_name: 'user/repo',
            description: 'A SaaS boilerplate',
            html_url: 'https://github.com/user/repo',
            stargazers_count: 500,
            open_issues_count: 10,
          },
        ],
      }),
    });

    const results = await collectGitHub();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('source', 'github');
    expect(results[0].score).toBe(500);
  });

  test('Reddit: 낮은 점수 필터링', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        data: {
          children: [
            { data: { title: 'Low score', selftext: '', permalink: '/r/test/', score: 2, num_comments: 0 } },
          ],
        },
      }),
    });

    const results = await collectReddit();
    expect(results.length).toBe(0);
  });
});
