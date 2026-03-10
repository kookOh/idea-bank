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

const mockPrompts = {
  project_name: 'Test Project',
  overview: '테스트 프로젝트 개요',
  master_prompt: '이 아이디어를 구현하기 위한 마스터 프롬프트입니다.',
  phases: [
    { step: 1, title: '기초 설정', prompt: 'Phase 1 prompt content' },
    { step: 2, title: 'API 개발', prompt: 'Phase 2 prompt content' },
  ],
  tech_stack: ['Next.js', 'Supabase'],
  free_services: ['Vercel', 'Supabase Free'],
};

test.describe('프롬프트 생성 모달', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/ideas*', (route) => {
      const url = route.request().url();
      // generate-prompts 엔드포인트
      if (url.includes('generate-prompts')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPrompts),
        });
        return;
      }
      // 아이디어 목록
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
    // 로컬 브릿지는 사용 불가 처리
    await page.route('http://localhost:3100/**', (route) => {
      route.abort();
    });
  });

  test('"프로젝트 생성하기" 버튼 클릭 시 모달이 열린다', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: '프로젝트 생성하기' }).first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('모달 타이틀이 "프로젝트 자동 생성"이다', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: '프로젝트 생성하기' }).first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"]').locator('text=프로젝트 자동 생성')).toBeVisible();
  });

  test('모달 내에 "프롬프트 생성" 버튼이 존재한다', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: '프로젝트 생성하기' }).first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(
      page.locator('[role="dialog"]').locator('button', { hasText: '프롬프트 생성' })
    ).toBeVisible();
  });

  test('닫기 버튼(✕) 클릭 시 모달이 닫힌다', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: '프로젝트 생성하기' }).first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.locator('[role="dialog"]').locator('[aria-label="닫기"]').click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('프롬프트 생성 후 탭 네비게이션이 동작한다 (마스터 프롬프트, 단계별)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: '프로젝트 생성하기' }).first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // 프롬프트 생성 버튼 클릭
    await page.locator('[role="dialog"]').locator('button', { hasText: '프롬프트 생성' }).click();
    await page.waitForLoadState('networkidle');

    // 탭이 나타날 때까지 대기
    const masterTab = page.locator('[role="dialog"]').locator('button', { hasText: '마스터 프롬프트' });
    await expect(masterTab).toBeVisible({ timeout: 10000 });

    const phasesTab = page.locator('[role="dialog"]').locator('button', { hasText: '단계별' });
    await expect(phasesTab).toBeVisible();

    // 단계별 탭 클릭
    await phasesTab.click();
    await expect(page.locator('[role="dialog"]').locator('text=기초 설정')).toBeVisible();
  });
});
