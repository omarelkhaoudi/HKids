import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveChildAge, getContentAccessViolation } from '../services/parental/parentalAccessService.js';

const contentTypePolicy = {
  applies: true,
  rules: { allowed_content_types: ['story', 'audio_story'] },
  allowedCategoryIds: [],
  allowedCategoryNames: [],
  premiumUnlockedBookIds: [],
  hasActiveSubscription: false,
  child: { age: 8 }
};

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

test('getContentAccessViolation blocks disallowed content types', () => {
  const violation = getContentAccessViolation(contentTypePolicy, { content_type: 'quiz', id: 1 });
  assert.equal(violation?.code, 'CONTENT_TYPE_NOT_ALLOWED');
});

test('getContentAccessViolation allows listed content types', () => {
  const violation = getContentAccessViolation(contentTypePolicy, { content_type: 'story', id: 1 });
  assert.equal(violation, null);
});

test('getContentAccessViolation skips category filter without explicit approvals', () => {
  const policy = {
    applies: true,
    child: { age: 6 },
    rules: {},
    explicitCategoryApprovals: false,
    allowedCategoryIds: [],
    allowedCategoryNames: [],
    premiumUnlockedBookIds: [],
    hasActiveSubscription: false,
  };
  const violation = getContentAccessViolation(policy, { category_id: 99, id: 1, content_type: 'story' });
  assert.equal(violation, null);
});

test('getContentAccessViolation blocks unapproved book categories when explicit approvals exist', () => {
  const policy = {
    applies: true,
    child: { age: 6 },
    rules: {},
    explicitCategoryApprovals: true,
    allowedCategoryIds: [1],
    allowedCategoryNames: ['Histoires'],
    premiumUnlockedBookIds: [],
    hasActiveSubscription: false,
  };
  const violation = getContentAccessViolation(policy, { category_id: 99, id: 1, content_type: 'story' });
  assert.equal(violation?.code, 'CATEGORY_NOT_ALLOWED');
});

test('getContentAccessViolation bypasses category filter for learning content', () => {
  const policy = {
    applies: true,
    child: { age: 6 },
    rules: {},
    explicitCategoryApprovals: true,
    allowedCategoryIds: [1],
    allowedCategoryNames: ['Histoires'],
    premiumUnlockedBookIds: [],
    hasActiveSubscription: false,
  };
  const violation = getContentAccessViolation(policy, {
    source: 'learning',
    category_id: 99,
    content_type: 'quiz',
    id: 1,
  });
  assert.equal(violation, null);
});
