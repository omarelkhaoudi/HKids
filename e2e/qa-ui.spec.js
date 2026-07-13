import { test, expect } from '@playwright/test';

const API = process.env.QA_API_URL || 'http://localhost:3000';

async function apiLogin(request, username, password) {
  const response = await request.post(`${API}/api/auth/login`, {
    data: { username, password },
  });
  if (!response.ok()) return null;
  const body = await response.json();
  return body;
}

async function seedParentAccount(request) {
  const suffix = Date.now();
  const username = `qa_ui_parent_${suffix}`;
  const password = 'SecurePass123!';
  const signup = await request.post(`${API}/api/auth/signup`, {
    data: { username, password, role: 'parent' },
  });
  if (!signup.ok()) return null;
  const login = await apiLogin(request, username, password);
  return login ? { ...login, password, username } : null;
}

async function injectSession(page, session) {
  await page.goto('/parent/login');
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token: session.token, user: session.user });
}

test.describe('QA UI — routes publiques', () => {
  test('[PUBLIC][Critique] Accueil marketing', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page).toHaveTitle(/HKids/i);
  });

  test('[PUBLIC][Critique] Login parent formulaire', async ({ page }) => {
    await page.goto('/parent/login');
    await expect(page.locator('input[type="text"], input[name="username"], input').first()).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('[PUBLIC][Haute] Page abonnements', async ({ page }) => {
    await page.goto('/abonnements');
    await expect(page.locator('body')).toContainText(/abonnement|plan|essai/i);
  });

  test('[PUBLIC][Haute] Admin login', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

test.describe('QA UI — garde auth', () => {
  test('[AUTH][Critique] /kids redirige sans session', async ({ page }) => {
    await page.goto('/kids');
    await expect(page).toHaveURL(/\/parent\/login/);
  });

  test('[AUTH][Critique] /parent/dashboard redirige sans session', async ({ page }) => {
    await page.goto('/parent/dashboard');
    await expect(page).toHaveURL(/\/parent\/login/);
  });

  test('[AUTH][Critique] /admin redirige sans session', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe('QA UI — parcours authentifié (API requise)', () => {
  test('[PARENT][Critique] Dashboard parent charge', async ({ page, request }) => {
    const session = await seedParentAccount(request);
    test.skip(!session, 'Backend indisponible pour seed parent');

    await injectSession(page, session);
    await page.goto('/parent/dashboard');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    await expect(page).not.toHaveURL(/\/parent\/login/);
  });

  test('[ADMIN][Critique] Dashboard admin charge', async ({ page, request }) => {
    const session = await apiLogin(request, 'admin', 'admin123');
    test.skip(!session, 'Admin seed indisponible');

    await page.goto('/admin/login');
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, { token: session.token, user: session.user });

    await page.goto('/admin');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/admin/);
  });
});

test.describe('QA UI — enfant (structure)', () => {
  test('[KID][Haute] Pages kids lazy — shell visible si session kid', async ({ page, request }) => {
    const parent = await seedParentAccount(request);
    test.skip(!parent, 'Backend indisponible');

    const kidRes = await request.post(`${API}/api/parental/kids`, {
      headers: { Authorization: `Bearer ${parent.token}` },
      data: { name: 'UI Kid', age: 5, preferred_language: 'fr' },
    });
    test.skip(!kidRes.ok(), 'Création profil échouée');
    const kid = await kidRes.json();

    const kidUser = `qa_ui_kid_${Date.now()}`;
    const accountRes = await request.post(`${API}/api/parental/kids/${kid.id}/create-account`, {
      headers: { Authorization: `Bearer ${parent.token}` },
      data: { username: kidUser, password: 'SecurePass123!' },
    });
    test.skip(!accountRes.ok(), 'Création compte kid échouée');

    const kidSession = await apiLogin(request, kidUser, 'SecurePass123!');
    test.skip(!kidSession, 'Login kid échoué');

    await injectSession(page, kidSession);
    await page.goto('/kids');
    await expect(page.locator('body')).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(/\/kids/);
  });

  test('[KID][Haute] Kids home — navigation pictogrammes présente', async ({ page, request }) => {
    const parent = await seedParentAccount(request);
    test.skip(!parent, 'Backend indisponible');

    const kidRes = await request.post(`${API}/api/parental/kids`, {
      headers: { Authorization: `Bearer ${parent.token}` },
      data: { name: 'Picto Kid', age: 4, preferred_language: 'fr' },
    });
    const kid = await kidRes.json();
    const kidUser = `qa_picto_${Date.now()}`;
    await request.post(`${API}/api/parental/kids/${kid.id}/create-account`, {
      headers: { Authorization: `Bearer ${parent.token}` },
      data: { username: kidUser, password: 'SecurePass123!' },
    });
    const kidSession = await apiLogin(request, kidUser, 'SecurePass123!');
    test.skip(!kidSession, 'Login kid échoué');

    await injectSession(page, kidSession);
    await page.goto('/kids');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /écouter|jouer|listen|play/i }).first()).toBeVisible({ timeout: 20000 });
  });
});
