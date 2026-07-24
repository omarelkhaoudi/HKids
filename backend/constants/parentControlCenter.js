/**
 * Shared parental control-center defaults (backend).
 * Keep in sync with frontend/src/constants/parentControlCenter.js
 */

export const OFFICIAL_AGE_GROUP_IDS = ['0-2', '2-4', '4-6', '6-8', '8-10', '10-12'];

export const AGE_GROUP_RANGES = {
  '0-2': { min: 0, max: 2 },
  '2-4': { min: 2, max: 4 },
  '4-6': { min: 4, max: 6 },
  '6-8': { min: 6, max: 8 },
  '8-10': { min: 8, max: 10 },
  '10-12': { min: 10, max: 12 },
};

export const CONTROL_THEME_IDS = [
  'dinosaurs',
  'space',
  'animals',
  'princesses',
  'jobs',
  'world',
  'ocean',
  'bedtime',
  'vehicles',
  'colors',
  'rhymes',
  'alphabet',
  'numbers',
  'spirituality',
];

export const RECOMMENDATION_RAIL_IDS = [
  'popular',
  'recommended',
  'continue',
  'discover',
  'premium',
  'new',
];

export const DEFAULT_RECOMMENDATION_RAILS = Object.fromEntries(
  RECOMMENDATION_RAIL_IDS.map((id) => [id, true]),
);

export const DEFAULT_LIBRARY_CONTROLS = {
  hidden_book_ids: [],
  pinned_book_ids: [],
  forced_book_ids: [],
  custom_library_ids: [],
};

export function normalizeIdList(value, allowedValues = null) {
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];
  const cleaned = items
    .map((item) => String(item).trim())
    .filter((item, index, self) => item && self.indexOf(item) === index);
  if (!allowedValues) return cleaned;
  return cleaned.filter((item) => allowedValues.includes(item));
}

export function normalizeBookIdList(value, max = 200) {
  const items = Array.isArray(value) ? value : [];
  return [...new Set(
    items
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0),
  )].slice(0, max);
}

export function normalizeRecommendationRails(value) {
  const source = value && typeof value === 'object' ? value : {};
  const next = { ...DEFAULT_RECOMMENDATION_RAILS };
  for (const id of RECOMMENDATION_RAIL_IDS) {
    if (Object.prototype.hasOwnProperty.call(source, id)) {
      next[id] = Boolean(source[id]);
    }
  }
  return next;
}

export function normalizeLibraryControls(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    hidden_book_ids: normalizeBookIdList(source.hidden_book_ids),
    pinned_book_ids: normalizeBookIdList(source.pinned_book_ids),
    forced_book_ids: normalizeBookIdList(source.forced_book_ids),
    custom_library_ids: normalizeBookIdList(source.custom_library_ids),
  };
}

export function bookOverlapsAgeGroupId(book, ageGroupId) {
  const range = AGE_GROUP_RANGES[ageGroupId];
  if (!range) return false;
  const min = Number(book?.age_group_min ?? book?.age_min);
  const max = Number(book?.age_group_max ?? book?.age_max);
  if (!Number.isFinite(min) && !Number.isFinite(max)) return true;
  const lo = Number.isFinite(min) ? min : max;
  const hi = Number.isFinite(max) ? max : min;
  return lo <= range.max && hi >= range.min;
}

export function bookAllowedByAgeGroups(book, allowedAgeGroups = []) {
  if (!Array.isArray(allowedAgeGroups) || allowedAgeGroups.length === 0) return true;
  return allowedAgeGroups.some((id) => bookOverlapsAgeGroupId(book, id));
}
