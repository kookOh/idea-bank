import { test, expect } from '@playwright/test';

const mockIdea = {
  id: '00000000-0000-0000-0000-000000000001',
  title: 'Top Idea',
  description: 'A top idea',
  source: 'hackernews',
  source_url: 'https://example.com',
  score: 200,
  comment_count: 80,
  collected_at: new Date().toISOString(),
  summary_ko: '탑 아이디어 요약',
  market_size: '대형',
  difficulty: 2,
  revenue_potential: 5,
  competition: 2,
  recommended_stack: ['Next.js', 'Supabase'],
  mvp_days: 10,
  tags: ['AI'],
  trend_score: 95.0,
  generated_prompts: null,
  implementation_status: 'pending',
  raw_data: null,
  platform_analysis: null,
};

test.describe('다이제스트 페이지', () => {
  test('/digest 페이지가 로드된다', async ({ page }) => {
    await page.route('/api/digest', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ date: '2026-03-10', top_ideas: [mockIdea] }),
      });
    });
    await page.goto('/digest');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/digest');
    await expect(page.locator('main')).toBeVisible();
  });

  test('페이지 타이틀에 IdeaHunter가 포함된다', async ({ page }) => {
    await page.route('/api/digest', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ date: '2026-03-10', top_ideas: [] }),
      });
    });
    await page.goto('/digest');
    await expect(page).toHaveTitle(/IdeaHunter/);
  });

  test('TOP 10 관련 헤딩이 표시된다', async ({ page }) => {
    await page.route('/api/digest', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ date: '2026-03-10', top_ideas: [mockIdea] }),
      });
    });
    await page.goto('/digest');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h2', { hasText: '오늘의 Hot 아이디어' })).toBeVisible();
  });

  test('다이제스트에 아이디어 목록이 표시된다', async ({ page }) => {
    await page.route('/api/digest', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ date: '2026-03-10', top_ideas: [mockIdea] }),
      });
    });
    await page.goto('/digest');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Top Idea')).toBeVisible();
    // 순위 표시 확인
    await expect(page.locator('text=#1')).toBeVisible();
  });

  test('다이제스트가 없을 때 빈 상태 메시지가 표시된다', async ({ page }) => {
    await page.route('/api/digest', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ date: '2026-03-10', top_ideas: [] }),
      });
    });
    await page.goto('/digest');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=오늘의 다이제스트가 아직 없습니다')).toBeVisible();
  });

  test('날짜와 아이디어 수가 표시된다', async ({ page }) => {
    await page.route('/api/digest', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ date: '2026-03-10', top_ideas: [mockIdea] }),
      });
    });
    await page.goto('/digest');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=2026-03-10')).toBeVisible();
    await expect(page.locator('text=TOP 1')).toBeVisible();
  });
});
