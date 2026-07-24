/**
 * Official HKids age system — single source of truth.
 * Every UI surface (home, library, search, favorites, offline) must import from here.
 */

export const AGE_GROUPS = [
  { id: '0-2', min: 0, max: 2, emoji: '🍼', titleKey: 'ageTitle0to2', labelKey: 'age0to2' },
  { id: '2-4', min: 2, max: 4, emoji: '🐣', titleKey: 'ageTitle2to4', labelKey: 'age2to4' },
  { id: '4-6', min: 4, max: 6, emoji: '🧸', titleKey: 'ageTitle4to6', labelKey: 'age4to6' },
  { id: '6-8', min: 6, max: 8, emoji: '🚀', titleKey: 'ageTitle6to8', labelKey: 'age6to8' },
  { id: '8-10', min: 8, max: 10, emoji: '🦖', titleKey: 'ageTitle8to10', labelKey: 'age8to10' },
  { id: '10-12', min: 10, max: 12, emoji: '🌍', titleKey: 'ageTitle10to12', labelKey: 'age10to12' },
];

export const ALL_AGES_ID = 'all';

/** @typedef {{ min: number, max: number }} AgeRange */

/**
 * Read min/max from a book (catalog uses age_group_*; accept aliases).
 * @param {object} book
 * @returns {AgeRange|null}
 */
export function getBookAgeRange(book) {
  if (!book || typeof book !== 'object') return null;
  const minRaw = book.age_group_min ?? book.minAge ?? book.min_age ?? book.ageMin;
  const maxRaw = book.age_group_max ?? book.maxAge ?? book.max_age ?? book.ageMax;
  const min = Number(minRaw);
  const max = Number(maxRaw);
  if (!Number.isFinite(min) && !Number.isFinite(max)) return null;
  const safeMin = Number.isFinite(min) ? min : max;
  const safeMax = Number.isFinite(max) ? max : min;
  if (!Number.isFinite(safeMin) || !Number.isFinite(safeMax)) return null;
  return {
    min: Math.min(safeMin, safeMax),
    max: Math.max(safeMin, safeMax),
  };
}

/**
 * Inclusive overlap: book [bMin,bMax] overlaps group [gMin,gMax]
 * when bMin <= gMax && bMax >= gMin.
 */
export function rangesOverlap(aMin, aMax, bMin, bMax) {
  return Number(aMin) <= Number(bMax) && Number(aMax) >= Number(bMin);
}

export function bookOverlapsAgeRange(book, min, max) {
  const range = getBookAgeRange(book);
  if (!range) return false;
  return rangesOverlap(range.min, range.max, min, max);
}

export function bookOverlapsAgeGroup(book, group) {
  if (!group) return true;
  return bookOverlapsAgeRange(book, group.min, group.max);
}

export function getAgeGroupById(id) {
  if (!id || id === ALL_AGES_ID) return null;
  return AGE_GROUPS.find((group) => group.id === id) || null;
}

export function parseAgeGroupId(raw) {
  const value = String(raw || '').trim();
  if (!value || value === ALL_AGES_ID) return ALL_AGES_ID;
  const match = AGE_GROUPS.find((group) => group.id === value);
  return match ? match.id : ALL_AGES_ID;
}

/**
 * O(n) filter — books overlapping the given group id (or all).
 */
export function filterBooksByAgeGroupId(books = [], ageGroupId = ALL_AGES_ID) {
  const group = getAgeGroupById(parseAgeGroupId(ageGroupId));
  if (!group) return books;
  return books.filter((book) => bookOverlapsAgeGroup(book, group));
}

export function countBooksByAgeGroup(books = [], ageGroupId = ALL_AGES_ID) {
  return filterBooksByAgeGroupId(books, ageGroupId).length;
}

/**
 * Distribution map: { '0-2': n, '2-4': n, ..., all: total }
 */
export function buildAgeDistribution(books = []) {
  const distribution = { [ALL_AGES_ID]: books.length };
  for (const group of AGE_GROUPS) {
    distribution[group.id] = countBooksByAgeGroup(books, group.id);
  }
  return distribution;
}

/** Every book with age metadata must land in ≥1 official group. */
export function bookBelongsToAtLeastOneAgeGroup(book) {
  const range = getBookAgeRange(book);
  if (!range) return false;
  return AGE_GROUPS.some((group) => bookOverlapsAgeGroup(book, group));
}

export function normalizeBookAgeFields(book) {
  if (!book || typeof book !== 'object') return book;
  const range = getBookAgeRange(book);
  if (!range) return book;
  return {
    ...book,
    age_group_min: range.min,
    age_group_max: range.max,
    minAge: range.min,
    maxAge: range.max,
  };
}

/** Deep-link path for Kids Library age filter */
export function kidsLibraryAgePath(ageGroupId = ALL_AGES_ID) {
  const id = parseAgeGroupId(ageGroupId);
  if (id === ALL_AGES_ID) return '/kids/library';
  return `/kids/library?age=${encodeURIComponent(id)}`;
}

/**
 * Map onboarding profile bands onto official numeric ranges.
 * Onboarding can keep its own UX labels; filtering uses this bridge.
 */
export const ONBOARDING_TO_AGE_RANGE = {
  '3-4': { min: 2, max: 4 },
  '5-6': { min: 4, max: 6 },
  '7-8': { min: 6, max: 8 },
  '9+': { min: 8, max: 12 },
};

export function onboardingBandToRange(ageBand) {
  return ONBOARDING_TO_AGE_RANGE[ageBand] || ONBOARDING_TO_AGE_RANGE['5-6'];
}

export function formatAgeGroupLabel(group, language = 'fr') {
  if (!group) return '';
  const unit = language?.startsWith('en') ? 'years' : language?.startsWith('ar') ? 'سنوات' : 'ans';
  return `${group.min}–${group.max} ${unit}`;
}
