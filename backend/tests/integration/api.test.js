import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.SKIP_SERVER_START = '1';

const { app } = await import('../../server.js');

test('GET /api/health returns service status', async () => {
  const response = await request(app).get('/api/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.message, 'HKids API is running');
  assert.ok(response.body.timestamp);
});

test('GET / returns API metadata', async () => {
  const response = await request(app).get('/');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.endpoints.health, '/api/health');
});

test('POST /api/auth/signup validates required fields', async () => {
  const response = await request(app)
    .post('/api/auth/signup')
    .send({ username: 'ab' });

  assert.equal(response.status, 400);
  assert.match(response.body.error, /required/i);
});

test('POST /api/auth/signup rejects invalid username pattern', async () => {
  const response = await request(app)
    .post('/api/auth/signup')
    .send({ username: 'bad name!', password: 'secure-password' });

  assert.equal(response.status, 400);
  assert.match(response.body.error, /Username must be/);
});

test('unknown API route returns 404', async () => {
  const response = await request(app).get('/api/does-not-exist');

  assert.equal(response.status, 404);
});

test('security headers are present on API responses', async () => {
  const response = await request(app).get('/api/health');

  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['x-frame-options'], 'DENY');
});
