import { test, expect } from '@playwright/test';

test.describe('HKids accessibility smoke', () => {
  test('home page has a single main landmark', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main#main-content')).toHaveCount(1);
  });

  test('parent login form fields are keyboard reachable', async ({ page }) => {
    await page.goto('/parent/login');
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase() || '');
    expect(['input', 'button', 'a', 'select', 'textarea']).toContain(focusedTag);
  });

  test('reduced motion stylesheet is present', async ({ page }) => {
    await page.goto('/');
    const reducedMotionRule = await page.evaluate(() => {
      return Array.from(document.styleSheets).some((sheet) => {
        try {
          return Array.from(sheet.cssRules || []).some((rule) =>
            rule.cssText?.includes('prefers-reduced-motion')
          );
        } catch {
          return false;
        }
      });
    });
    expect(reducedMotionRule).toBeTruthy();
  });
});
