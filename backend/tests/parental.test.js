import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveChildAge } from '../services/parental/parentalAccessService.js';

test('resolveChildAge prefers stored age when valid', () => {
  assert.equal(resolveChildAge({ age: 7, date_of_birth: '2015-01-01' }), 7);
});

test('resolveChildAge derives age from birth date', () => {
  const birthYear = new Date().getUTCFullYear() - 8;
  const kid = { date_of_birth: `${birthYear}-01-01` };
  const age = resolveChildAge(kid);
  assert.ok(age === 7 || age === 8);
});

test('resolveChildAge returns null for invalid data', () => {
  assert.equal(resolveChildAge({ age: 'invalid' }), null);
  assert.equal(resolveChildAge({ date_of_birth: 'invalid-date' }), null);
  assert.equal(resolveChildAge(null), null);
});
