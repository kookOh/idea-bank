import { test, expect } from '@playwright/test';

const mockIdea = {
  id: '00000000-0000-0000-0000-000000000001',
  title: 'Test Idea',
  description: 'A test idea',
  source: 'hackernews',
  source_url: 'https://example.com',
  score: 100,
  comment_count: 50,
  collected_at: new Date().toISOString(),
  summary_ko: '테스트 아이디어 요약',
  market_size: '중형',
  difficulty: 3,
  revenue_potential: 4,
  competition: 2,
  recommended_stack: ['Next.js', 'Supabase'],
  mvp_days: 14,
  tags: ['SaaS', 'AI'],
  trend_score: 85.5,
  generated_prompts: null,
  implementation_status: 'pending',
  raw_data: null,
  platform_analysis: null,
};

test.describe('메인 피드 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/ideas*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ideas: [mockIdea] }),
      });
    });
    await page.route('/api/digest', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ date: '2026-03-10', top_ideas: [] }),
      });
    });
  });

  test('헤더에 IdeaHunter 타이틀이 표시된다', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('IdeaHunter');
  });

  test('네비게이션 링크 3개가 존재한다', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('nav a', { hasText: '피드' })).toBeVisible();
    await expect(page.locator('nav a', { hasText: '오늘의 TOP 10' })).toBeVisible();
    await expect(page.locator('nav a', { hasText: '앱인토스' })).toBeVisible();
  });

  test('FilterBar에 정렬 버튼과 소스/태그 셀렉트가 렌더된다', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('button', { hasText: '트렌딩' })).toBeVisible();
    await expect(page.locator('button', { hasText: '최신' })).toBeVisible();
    await expect(page.locator('select[aria-label="소스 필터"]')).toBeVisible();
    await expect(page.locator('select[aria-label="태그 필터"]')).toBeVisible();
  });

  test('IdeaCard에 제목, 소스 아이콘, 트렌드 점수가 표시된다', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Test Idea')).toBeVisible();
    await expect(page.locator('text=hackernews')).toBeVisible();
    // trend_score 85.5 -> Math.round = 86
    await expect(page.locator('text=86')).toBeVisible();
  });

  test('아이디어가 있을 때 "더 보기" 버튼이 표시된다', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('button', { hasText: '더 보기' })).toBeVisible();
  });

  test('아이디어가 없을 때 빈 상태 메시지가 표시된다', async ({ page }) => {
    await page.route('/api/ideas*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ideas: [] }),
      });
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=아직 수집된 아이디어가 없습니다')).toBeVisible();
  });
});
