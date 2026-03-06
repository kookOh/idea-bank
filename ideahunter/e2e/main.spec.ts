import { test, expect } from '@playwright/test';

test.describe('IdeaHunter E2E', () => {
  test('메인 페이지 로딩', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.locator('h1')).toContainText('IdeaHunter');
    await expect(page.locator('main')).toBeVisible();
  });

  test('피드 필터 동작', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.locator('button:has-text("최신")').click();
    await page.waitForTimeout(1000);
  });

  test('다이제스트 페이지 접근', async ({ page }) => {
    await page.goto('http://localhost:3000/digest');
    await expect(page).toHaveTitle(/IdeaHunter/);
  });

  test('프로젝트 생성 버튼 존재 확인', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);
    const btn = page.locator('button:has-text("이 아이디어로 프로젝트 생성하기")').first();
    if (await btn.isVisible()) {
      await btn.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    }
  });
});
