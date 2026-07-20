import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdminSignupCodeValid } from '../utils/adminSignupPolicy.js';

test('isAdminSignupCodeValid passes when no code is configured', () => {
  delete process.env.ADMIN_SIGNUP_CODE;
  assert.equal(isAdminSignupCodeValid(undefined), true);
  assert.equal(isAdminSignupCodeValid(''), true);
});

test('isAdminSignupCodeValid requires matching code when configured', () => {
  process.env.ADMIN_SIGNUP_CODE = 'secret-code';
  assert.equal(isAdminSignupCodeValid('secret-code'), true);
  assert.equal(isAdminSignupCodeValid('wrong'), false);
  delete process.env.ADMIN_SIGNUP_CODE;
});
