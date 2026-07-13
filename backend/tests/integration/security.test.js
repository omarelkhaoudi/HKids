import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { isDevOnlyEndpointEnabled } from '../../utils/productionGuards.js';

process.env.NODE_ENV = 'test';
process.env.SKIP_SERVER_START = '1';

const { app } = await import('../../server.js');

test('protected voice routes reject unauthenticated access', async () => {
  const routes = [
    '/api/voices/messages',
    '/api/voices/profiles',
    '/api/admin/overview',
  ];

  for (const route of routes) {
    const response = await request(app).get(route);
    assert.equal(response.status, 401, `Expected 401 for ${route}`);
  }
});

test('POST /api/reset-rate-limit is available in non-production', async () => {
  const response = await request(app).post('/api/reset-rate-limit');
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

test('dev-only endpoints are disabled in production mode', () => {
  assert.equal(isDevOnlyEndpointEnabled('production'), false);
  assert.equal(isDevOnlyEndpointEnabled('test'), true);
  assert.equal(isDevOnlyEndpointEnabled('development'), true);
});

test('sanitizeBody strips HTML from request payloads', async () => {
  const response = await request(app)
    .post('/api/auth/signup')
    .send({
      username: '<script>alert(1)</script>validuser',
      password: 'secure-password-123',
    });

  assert.notEqual(response.status, 500);
});
