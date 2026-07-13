import { test, expect } from '@playwright/test';

test.describe('HKids critical routes', () => {
  test('subscriptions page loads', async ({ page }) => {
    await page.goto('/abonnements');
    await expect(page).toHaveURL(/\/abonnements/);
    await expect(page.locator('main, body')).toBeVisible();
  });

  test('admin login route is reachable', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('kids route redirects unauthenticated users to parent login', async ({ page }) => {
    await page.goto('/kids');
    await expect(page).toHaveURL(/\/parent\/login/);
  });

  test('skip link targets main content landmark', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.getByRole('link', { name: /skip to main content|aller au contenu/i });
    await expect(skipLink).toHaveAttribute('href', '#main-content');
  });
});
