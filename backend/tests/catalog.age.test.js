/**
 * Catalog age integrity — every seeded book has age_group_min/max
 * and overlaps at least one official HKids age group.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from '../content/catalog.js';

const AGE_GROUPS = [
  { id: '0-2', min: 0, max: 2 },
  { id: '2-4', min: 2, max: 4 },
  { id: '4-6', min: 4, max: 6 },
  { id: '6-8', min: 6, max: 8 },
  { id: '8-10', min: 8, max: 10 },
  { id: '10-12', min: 10, max: 12 },
];

function overlaps(bookMin, bookMax, groupMin, groupMax) {
  return bookMin <= groupMax && bookMax >= groupMin;
}

test('every catalog book has finite age_group_min/max', () => {
  for (const book of CATALOG) {
    assert.ok(Number.isFinite(book.age_group_min), `${book.slug} missing age_group_min`);
    assert.ok(Number.isFinite(book.age_group_max), `${book.slug} missing age_group_max`);
    assert.ok(book.age_group_min <= book.age_group_max, `${book.slug} inverted age range`);
  }
});

test('every catalog book overlaps at least one official age group', () => {
  for (const book of CATALOG) {
    const hit = AGE_GROUPS.some((group) => overlaps(
      book.age_group_min,
      book.age_group_max,
      group.min,
      group.max,
    ));
    assert.equal(hit, true, `${book.slug} (${book.age_group_min}-${book.age_group_max}) outside official ages`);
  }
});

test('age distribution is computed without vanishing books', () => {
  const distribution = Object.fromEntries(AGE_GROUPS.map((g) => [g.id, 0]));
  let covered = 0;
  for (const book of CATALOG) {
    let matched = false;
    for (const group of AGE_GROUPS) {
      if (overlaps(book.age_group_min, book.age_group_max, group.min, group.max)) {
        distribution[group.id] += 1;
        matched = true;
      }
    }
    if (matched) covered += 1;
  }
  assert.equal(covered, CATALOG.length);
  assert.ok(Object.values(distribution).some((count) => count > 0));
});
