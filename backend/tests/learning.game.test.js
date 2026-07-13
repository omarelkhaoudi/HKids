import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { initDatabase } from '../database/init.js';

process.env.NODE_ENV = 'development';
process.env.SKIP_SERVER_START = '1';
process.env.JWT_SECRET ||= 'hkids-test-jwt-secret-with-32-characters-minimum';

await initDatabase();
const { app } = await import('../server.js');

test('memory game attempt records score and success', async () => {
  const suffix = Date.now();
  const password = 'SecurePass123!';

  await request(app)
    .post('/api/auth/signup')
    .send({ username: `game_parent_${suffix}`, password, role: 'parent' });

  const parentLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: `game_parent_${suffix}`, password });

  const parentToken = parentLogin.body.token;
  const kidRes = await request(app)
    .post('/api/parental/kids')
    .set('Authorization', `Bearer ${parentToken}`)
    .send({ name: 'Game Kid', age: 6, preferred_language: 'fr' });

  const kidUser = `game_kid_${suffix}`;
  await request(app)
    .post(`/api/parental/kids/${kidRes.body.id}/create-account`)
    .set('Authorization', `Bearer ${parentToken}`)
    .send({ username: kidUser, password });

  const kidLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: kidUser, password });

  const kidToken = kidLogin.body.token;
  const contents = await request(app)
    .get('/api/learning/contents')
    .set('Authorization', `Bearer ${kidToken}`);

  const game = contents.body.find((content) => content.content_type === 'game');
  assert.ok(game, 'memory game seed missing');

  const attempt = await request(app)
    .post(`/api/learning/contents/${game.id}/attempts`)
    .set('Authorization', `Bearer ${kidToken}`)
    .send({
      answers: [{ question_id: 0, answer: { value: ['1', '2', '3', '4'] } }],
      time_spent_seconds: 25,
    });

  assert.equal(attempt.status, 201, attempt.body?.error || '');
  assert.equal(attempt.body.attempt.success, true);
  assert.equal(attempt.body.attempt.score, 4);
  assert.equal(attempt.body.attempt.max_score, 4);
  assert.ok(Array.isArray(attempt.body.attempt.answers));
  assert.equal(attempt.body.attempt.answers[0]?.correct, true);
});
