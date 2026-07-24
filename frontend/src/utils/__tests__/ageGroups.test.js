import { describe, expect, it } from 'vitest';
import {
  AGE_GROUPS,
  ALL_AGES_ID,
  bookBelongsToAtLeastOneAgeGroup,
  bookOverlapsAgeGroup,
  buildAgeDistribution,
  countBooksByAgeGroup,
  filterBooksByAgeGroupId,
  getAgeGroupById,
  getBookAgeRange,
  kidsLibraryAgePath,
  normalizeBookAgeFields,
  parseAgeGroupId,
  rangesOverlap,
} from '../../constants/ageGroups';

describe('unified age system', () => {
  it('exposes six official age groups', () => {
    expect(AGE_GROUPS).toHaveLength(6);
    expect(AGE_GROUPS.map((g) => g.id)).toEqual(['0-2', '2-4', '4-6', '6-8', '8-10', '10-12']);
  });

  it('uses inclusive overlapping ranges', () => {
    expect(rangesOverlap(2, 5, 2, 4)).toBe(true);
    expect(rangesOverlap(2, 5, 4, 6)).toBe(true);
    expect(rangesOverlap(6, 8, 6, 8)).toBe(true);
    expect(rangesOverlap(0, 3, 0, 2)).toBe(true);
    expect(rangesOverlap(0, 3, 2, 4)).toBe(true);
    expect(rangesOverlap(6, 8, 0, 2)).toBe(false);
  });

  it('maps books into overlapping official groups', () => {
    const book = { age_group_min: 2, age_group_max: 5 };
    expect(bookOverlapsAgeGroup(book, getAgeGroupById('2-4'))).toBe(true);
    expect(bookOverlapsAgeGroup(book, getAgeGroupById('4-6'))).toBe(true);
    expect(bookOverlapsAgeGroup(book, getAgeGroupById('6-8'))).toBe(false);
  });

  it('accepts minAge/maxAge aliases and normalizes fields', () => {
    const normalized = normalizeBookAgeFields({ minAge: 5, maxAge: 3, title: 'X' });
    expect(normalized.age_group_min).toBe(3);
    expect(normalized.age_group_max).toBe(5);
    expect(normalized.minAge).toBe(3);
    expect(normalized.maxAge).toBe(5);
    expect(getBookAgeRange(normalized)).toEqual({ min: 3, max: 5 });
  });

  it('computes counters and distribution without hardcoding', () => {
    const books = [
      { id: 1, age_group_min: 0, age_group_max: 2 },
      { id: 2, age_group_min: 2, age_group_max: 5 },
      { id: 3, age_group_min: 6, age_group_max: 8 },
      { id: 4, age_group_min: 8, age_group_max: 10 },
    ];
    expect(countBooksByAgeGroup(books, ALL_AGES_ID)).toBe(4);
    expect(countBooksByAgeGroup(books, '2-4')).toBe(2);
    expect(countBooksByAgeGroup(books, '0-2')).toBe(2);
    expect(filterBooksByAgeGroupId(books, '6-8').map((b) => b.id).sort()).toEqual([3, 4]);
    const distribution = buildAgeDistribution(books);
    expect(distribution.all).toBe(4);
    expect(distribution['6-8']).toBe(2);
  });

  it('ensures every aged book belongs to at least one group', () => {
    const samples = [
      { age_group_min: 0, age_group_max: 1 },
      { age_group_min: 2, age_group_max: 5 },
      { age_group_min: 9, age_group_max: 12 },
      { age_group_min: 4, age_group_max: 4 },
    ];
    samples.forEach((book) => {
      expect(bookBelongsToAtLeastOneAgeGroup(book)).toBe(true);
    });
  });

  it('preserves age filter in deep links', () => {
    expect(parseAgeGroupId('2-4')).toBe('2-4');
    expect(parseAgeGroupId('legacy')).toBe(ALL_AGES_ID);
    expect(kidsLibraryAgePath('2-4')).toBe('/kids/library?age=2-4');
    expect(kidsLibraryAgePath('all')).toBe('/kids/library');
  });

  it('recomputes the filtered list when the age query id changes', () => {
    const catalog = [
      { id: 'a', age_group_min: 0, age_group_max: 2 },
      { id: 'b', age_group_min: 9, age_group_max: 12 },
      { id: 'c', age_group_min: 4, age_group_max: 6 },
    ];
    expect(filterBooksByAgeGroupId(catalog, '0-2').map((book) => book.id)).toEqual(['a']);
    expect(filterBooksByAgeGroupId(catalog, '10-12').map((book) => book.id)).toEqual(['b']);
    expect(filterBooksByAgeGroupId(catalog, '4-6').map((book) => book.id)).toEqual(['c']);
    expect(filterBooksByAgeGroupId(catalog, ALL_AGES_ID).map((book) => book.id)).toEqual(['a', 'b', 'c']);
  });
});
