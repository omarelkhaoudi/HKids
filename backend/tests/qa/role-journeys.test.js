/**
 * QA Lead — parcours utilisateurs réels (API + DB locale)
 * Exécution : node --test tests/qa/role-journeys.test.js (depuis backend/)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { initDatabase } from '../../database/init.js';

process.env.NODE_ENV = 'development';
process.env.SKIP_SERVER_START = '1';
process.env.JWT_SECRET ||= 'hkids-test-jwt-secret-with-32-characters-minimum';

await initDatabase();
const { app } = await import('../../server.js');

const runId = Date.now();
const password = 'SecurePass123!';
const parentUsername = `qa_parent_${runId}`;
const kidUsername = `qa_kid_${runId}`;

const state = {
  parentToken: null,
  parentUser: null,
  kidId: null,
  kidToken: null,
  kidUser: null,
  adminToken: null,
  ticketId: null,
};

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

// ─── PARENT ───────────────────────────────────────────────────────────────

test('[PARENT][Critique] Création de compte parent', async () => {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ username: parentUsername, password, role: 'parent' });

  assert.equal(res.status, 201, res.body?.error || JSON.stringify(res.body));
  assert.equal(res.body.user.role, 'parent');
  state.parentUser = res.body.user;
});

test('[PARENT][Critique] Connexion parent', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: parentUsername, password });

  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.user.role, 'parent');
  state.parentToken = res.body.token;
  state.parentUser = res.body.user;
});

test('[PARENT][Critique] Création profil enfant', async () => {
  const res = await request(app)
    .post('/api/parental/kids')
    .set(auth(state.parentToken))
    .send({
      name: 'Léa QA',
      age: 6,
      preferred_language: 'fr',
      interests: ['dinosaurs', 'space'],
    });

  assert.equal(res.status, 201, res.body?.error || '');
  assert.ok(res.body.id);
  state.kidId = res.body.id;
});

test('[PARENT][Haute] Règles parentales (temps écran)', async () => {
  const res = await request(app)
    .put(`/api/parental/kids/${state.kidId}/rules`)
    .set(auth(state.parentToken))
    .send({
      daily_screen_time_minutes: 45,
      quiet_start_time: '21:00',
      quiet_end_time: '07:00',
      allowed_languages: ['fr', 'en'],
    });

  assert.equal(res.status, 200, res.body?.error || '');
  assert.equal(res.body.daily_screen_time_minutes, 45);
});

test('[PARENT][Haute] Approbations catégories', async () => {
  const cats = await request(app).get('/api/categories');
  assert.equal(cats.status, 200);
  assert.ok(cats.body?.length > 0, 'Aucune categorie disponible');

  for (const category of cats.body) {
    const res = await request(app)
      .post(`/api/parental/kids/${state.kidId}/approvals`)
      .set(auth(state.parentToken))
      .send({ category_id: category.id, approved: true });

    assert.ok([200, 201].includes(res.status), res.body?.error || '');
  }
});

test('[PARENT][Critique] Création compte enfant', async () => {
  const res = await request(app)
    .post(`/api/parental/kids/${state.kidId}/create-account`)
    .set(auth(state.parentToken))
    .send({ username: kidUsername, password });

  assert.equal(res.status, 201, res.body?.error || JSON.stringify(res.body));
});

test('[PARENT][Haute] Dashboard parent / overview', async () => {
  const res = await request(app)
    .get(`/api/parental/kids/${state.kidId}/dashboard`)
    .set(auth(state.parentToken));

  assert.equal(res.status, 200, res.body?.error || '');
  assert.ok(res.body.kid || res.body.profile || res.body.summary);
});

test('[PARENT][Haute] Plans abonnement accessibles', async () => {
  const res = await request(app).get('/api/subscriptions/plans');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.plans) || Array.isArray(res.body));
});

test('[PARENT][Moyenne] Ticket support', async () => {
  const res = await request(app)
    .post('/api/support/tickets')
    .set(auth(state.parentToken))
    .send({
      subject: 'QA test support',
      message: 'Message de validation automatique QA.',
      category: 'general',
    });

  assert.equal(res.status, 201, res.body?.error || '');
  state.ticketId = res.body.ticket?.id || res.body.id;
});

test('[PARENT][Haute] Voix — liste profils (sans clé ElevenLabs)', async () => {
  const res = await request(app)
    .get('/api/voices/profiles')
    .set(auth(state.parentToken));

  assert.equal(res.status, 200, res.body?.error || '');
  assert.ok(Array.isArray(res.body));
});

// ─── ENFANT ───────────────────────────────────────────────────────────────

test('[KID][Critique] Connexion enfant', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: kidUsername, password });

  assert.equal(res.status, 200);
  assert.equal(res.body.user.role, 'kid');
  assert.equal(res.body.user.kid_profile_id, state.kidId);
  state.kidToken = res.body.token;
  state.kidUser = res.body.user;
});

test('[KID][Critique] Livres publiés accessibles', async () => {
  const res = await request(app)
    .get('/api/books/published')
    .set(auth(state.kidToken));

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length > 0, 'Aucun livre demo seedé');
});

test('[KID][Haute] Recommandations', async () => {
  const res = await request(app)
    .post('/api/recommendations')
    .set(auth(state.kidToken))
    .send({ language: 'fr' });

  assert.equal(res.status, 200, res.body?.error || '');
  assert.ok(Array.isArray(res.body.sections));
});

test('[KID][Haute] Contenus learning / quiz seedés', async () => {
  const res = await request(app)
    .get('/api/learning/contents')
    .set(auth(state.kidToken));

  assert.equal(res.status, 200, res.body?.error || '');
  assert.ok(res.body.length > 0, 'Aucun contenu learning seedé');
});

test('[KID][Haute] Overview enfant connecté', async () => {
  const res = await request(app)
    .get('/api/parental/me/overview')
    .set(auth(state.kidToken));

  assert.equal(res.status, 200, res.body?.error || '');
});

test('[KID][Haute] Politique parentale (access-policy)', async () => {
  const res = await request(app)
    .get('/api/parental/me/access-policy')
    .set(auth(state.kidToken));

  assert.equal(res.status, 200, res.body?.error || '');
  assert.equal(res.body.applies, true);
});

test('[KID][Haute] Messages vocaux disponibles', async () => {
  const res = await request(app)
    .get('/api/voices/messages/available')
    .set(auth(state.kidToken));

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
});

test('[KID][Moyenne] Manifest offline', async () => {
  const res = await request(app)
    .get('/api/offline/manifest')
    .set(auth(state.kidToken));

  assert.equal(res.status, 200);
  assert.equal(res.body.capabilities.offline_downloads, true);
});

test('[KID][Haute] Assistant vocal sans clé IA — mode démonstration', async () => {
  const res = await request(app)
    .post('/api/ai/voice-assistant')
    .set(auth(state.kidToken))
    .send({ transcript: 'Bonjour Le Lit', language: 'fr' });

  assert.equal(res.status, 200, res.body?.error || '');
  assert.equal(res.body.demo_mode, true);
  assert.equal(res.body.provider, 'demo');
  assert.ok(res.body.reply_text);
});

test('[KID][Moyenne] Historique activité sync', async () => {
  const res = await request(app)
    .post('/api/parental/me/screen-time')
    .set(auth(state.kidToken))
    .send({
      client_session_id: `qa-${runId}`,
      duration_seconds: 120,
      started_at: new Date().toISOString(),
    });

  assert.equal(res.status, 201, res.body?.error || '');
});

// ─── ADMIN ────────────────────────────────────────────────────────────────

test('[ADMIN][Critique] Connexion admin seed', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });

  assert.equal(res.status, 200, res.body?.error || 'Admin seed absent — lancer initDatabase en dev');
  state.adminToken = res.body.token;
});

test('[ADMIN][Critique] Overview dashboard', async () => {
  const res = await request(app)
    .get('/api/admin/overview')
    .set(auth(state.adminToken));

  assert.equal(res.status, 200, res.body?.error || '');
});

test('[ADMIN][Haute] Liste utilisateurs', async () => {
  const res = await request(app)
    .get('/api/admin/users')
    .set(auth(state.adminToken));

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.items) || Array.isArray(res.body.users) || Array.isArray(res.body));
});

test('[ADMIN][Haute] Statistiques', async () => {
  const res = await request(app)
    .get('/api/admin/statistics')
    .set(auth(state.adminToken));

  assert.equal(res.status, 200, res.body?.error || '');
});

test('[ADMIN][Haute] Modération', async () => {
  const res = await request(app)
    .get('/api/admin/moderation')
    .set(auth(state.adminToken));

  assert.equal(res.status, 200, res.body?.error || '');
});

test('[ADMIN][Haute] Signalements', async () => {
  const res = await request(app)
    .get('/api/admin/reports')
    .set(auth(state.adminToken));

  assert.equal(res.status, 200, res.body?.error || '');
});

test('[ADMIN][Haute] Support tickets', async () => {
  const res = await request(app)
    .get('/api/admin/support-tickets')
    .set(auth(state.adminToken));

  assert.equal(res.status, 200, res.body?.error || '');
});

test('[ADMIN][Haute] Abonnements gérés', async () => {
  const res = await request(app)
    .get('/api/admin/managed-subscriptions')
    .set(auth(state.adminToken));

  assert.equal(res.status, 200, res.body?.error || '');
});

test('[ADMIN][Moyenne] Permissions admin', async () => {
  const res = await request(app)
    .get('/api/admin/permissions/me')
    .set(auth(state.adminToken));

  assert.equal(res.status, 200, res.body?.error || '');
});
