import { test, expect } from '@playwright/test';

test.describe('HKids production smoke', () => {
  test('home page loads with branding', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/HKids/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('parent login route is reachable', async ({ page }) => {
    await page.goto('/parent/login');
    await expect(page).toHaveURL(/\/parent\/login/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('offline fallback page is served', async ({ page }) => {
    const response = await page.goto('/offline.html');
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('body')).toContainText(/hors connexion|offline/i);
  });
});
