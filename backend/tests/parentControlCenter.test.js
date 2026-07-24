import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bookAllowedByAgeGroups,
  normalizeLibraryControls,
  normalizeRecommendationRails,
  OFFICIAL_AGE_GROUP_IDS,
} from '../constants/parentControlCenter.js';

test('official age groups cover 0-12', () => {
  assert.deepEqual(OFFICIAL_AGE_GROUP_IDS, ['0-2', '2-4', '4-6', '6-8', '8-10', '10-12']);
});

test('age group overlap permissions', () => {
  assert.equal(bookAllowedByAgeGroups({ age_group_min: 2, age_group_max: 5 }, ['2-4', '4-6']), true);
  assert.equal(bookAllowedByAgeGroups({ age_group_min: 9, age_group_max: 11 }, ['0-2']), false);
  assert.equal(bookAllowedByAgeGroups({ age_group_min: 9, age_group_max: 11 }, []), true);
});

test('recommendation rails and library controls normalize safely', () => {
  assert.equal(normalizeRecommendationRails({ popular: false }).popular, false);
  assert.equal(normalizeRecommendationRails({ popular: false }).new, true);
  assert.deepEqual(normalizeLibraryControls({ pinned_book_ids: [1, '2', 0, -3] }).pinned_book_ids, [1, 2]);
});
