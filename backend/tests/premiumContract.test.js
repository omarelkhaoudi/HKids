import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PREMIUM_ACCESS,
  canAccessPremiumBook,
  getBookPremiumState,
  inferPremiumAccess,
  isPremiumContent,
} from '../services/premium/premiumContract.js';
import { getContentAccessViolation } from '../services/parental/parentalAccessService.js';

test('premium contract classifies catalog access models', () => {
  assert.equal(inferPremiumAccess({ is_premium: false }), PREMIUM_ACCESS.FREE);
  assert.equal(inferPremiumAccess({ slug: 'prem-hero', is_premium: true }), PREMIUM_ACCESS.SUBSCRIPTION);
  assert.equal(
    inferPremiumAccess({ is_premium: true, metadata: { premium_pack_id: 'dinosaurs' } }),
    PREMIUM_ACCESS.PACK,
  );
});

test('active subscription unlocks premium books', () => {
  const book = { id: 7, is_premium: true };
  assert.equal(canAccessPremiumBook(book, { hasActiveSubscription: true, unlockedBookIds: [] }), true);
  assert.equal(canAccessPremiumBook(book, { hasActiveSubscription: false, unlockedBookIds: [7] }), true);
  assert.equal(canAccessPremiumBook(book, { hasActiveSubscription: false, unlockedBookIds: [] }), false);
});

test('parental policy allows premium books with active subscription', () => {
  const policy = {
    applies: true,
    child: { age: 7 },
    rules: {},
    explicitCategoryApprovals: false,
    allowedCategoryIds: [],
    allowedCategoryNames: [],
    premiumUnlockedBookIds: [],
    hasActiveSubscription: true,
  };
  const violation = getContentAccessViolation(policy, { id: 9, is_premium: true, content_type: 'story' });
  assert.equal(violation, null);
});

test('parental policy blocks locked premium books without subscription', () => {
  const policy = {
    applies: true,
    child: { age: 7 },
    rules: {},
    explicitCategoryApprovals: false,
    allowedCategoryIds: [],
    allowedCategoryNames: [],
    premiumUnlockedBookIds: [],
    hasActiveSubscription: false,
  };
  const violation = getContentAccessViolation(policy, { id: 9, is_premium: true, content_type: 'story' });
  assert.equal(violation?.code, 'PREMIUM_NOT_ALLOWED');
});

test('book premium state exposes lock and badge consistently', () => {
  const locked = getBookPremiumState({ id: 1, is_premium: true }, { hasActiveSubscription: false, unlockedBookIds: [] });
  const unlocked = getBookPremiumState({ id: 1, is_premium: true }, { hasActiveSubscription: true, unlockedBookIds: [] });
  assert.equal(locked.locked, true);
  assert.equal(locked.showLock, true);
  assert.equal(unlocked.locked, false);
  assert.equal(isPremiumContent({ is_premium: 1 }), true);
});
