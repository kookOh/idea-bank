import { test, expect } from '@playwright/test';

test.describe('앱인토스 대시보드 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/ideas*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ideas: [] }),
      });
    });
  });

  test('/ait 페이지가 로드된다', async ({ page }) => {
    await page.goto('/ait');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/ait');
    await expect(page.locator('main')).toBeVisible();
  });

  test('앱인토스 관련 텍스트가 페이지에 존재한다', async ({ page }) => {
    await page.goto('/ait');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=앱인토스')).toBeVisible();
  });

  test('헤더에 앱인토스 대시보드 타이틀이 표시된다', async ({ page }) => {
    await page.goto('/ait');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('앱인토스 대시보드');
  });

  test('/ait 페이지에서 네비게이션 링크가 동작한다', async ({ page }) => {
    await page.goto('/ait');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('nav a', { hasText: '피드' })).toBeVisible();
    await expect(page.locator('nav a', { hasText: '오늘의 TOP 10' })).toBeVisible();
    await expect(page.locator('nav a', { hasText: '앱인토스' })).toBeVisible();
  });

  test('피드 링크를 클릭하면 메인 페이지로 이동한다', async ({ page }) => {
    await page.route('/api/digest', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ date: '2026-03-10', top_ideas: [] }),
      });
    });
    await page.goto('/ait');
    await page.waitForLoadState('networkidle');
    await page.locator('nav a', { hasText: '피드' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/');
  });

  test('앱인토스 분석된 아이디어가 없을 때 빈 상태 메시지가 표시된다', async ({ page }) => {
    await page.goto('/ait');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=앱인토스 분석된 아이디어가 없습니다')).toBeVisible();
  });
});
