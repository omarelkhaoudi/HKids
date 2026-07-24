import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LIBRARY_CONTROLS,
  DEFAULT_RECOMMENDATION_RAILS,
  normalizeRulesForm,
  toggleBookInLibrary,
  toggleListValue,
  exportKidProfilePayload,
  CONTROL_AGE_OPTIONS,
} from '../../constants/parentControlCenter';
import { bookOverlapsAgeGroup, getAgeGroupById } from '../../constants/ageGroups';

function bookAllowedByAgeGroups(book, allowedAgeGroups = []) {
  if (!Array.isArray(allowedAgeGroups) || allowedAgeGroups.length === 0) return true;
  return allowedAgeGroups.some((id) => bookOverlapsAgeGroup(book, getAgeGroupById(id)));
}

describe('parent control center', () => {
  it('normalizes rules with defaults', () => {
    const rules = normalizeRulesForm({});
    expect(rules.daily_screen_time_minutes).toBe(30);
    expect(rules.recommendation_rails).toEqual(DEFAULT_RECOMMENDATION_RAILS);
    expect(rules.library_controls).toMatchObject(DEFAULT_LIBRARY_CONTROLS);
    expect(CONTROL_AGE_OPTIONS).toHaveLength(6);
  });

  it('toggles allow/block lists', () => {
    expect(toggleListValue(['dinosaurs'], 'ocean')).toEqual(['dinosaurs', 'ocean']);
    expect(toggleListValue(['dinosaurs', 'ocean'], 'dinosaurs')).toEqual(['ocean']);
  });

  it('toggles library book controls', () => {
    const next = toggleBookInLibrary(DEFAULT_LIBRARY_CONTROLS, 'pinned_book_ids', 42);
    expect(next.pinned_book_ids).toEqual([42]);
    expect(toggleBookInLibrary(next, 'pinned_book_ids', 42).pinned_book_ids).toEqual([]);
  });

  it('exports a portable kid profile payload', () => {
    const payload = exportKidProfilePayload(
      { id: 1, name: 'Lina', age: 6, preferred_language: 'fr' },
      normalizeRulesForm({ allowed_age_groups: ['4-6'] }),
      { summary: { reading_streak_days: 3 }, goal: { target_value: 20 } },
    );
    expect(payload.kid.name).toBe('Lina');
    expect(payload.rules.allowed_age_groups).toEqual(['4-6']);
    expect(payload.summary.reading_streak_days).toBe(3);
    expect(payload.exported_at).toBeTruthy();
  });

  it('enforces overlapping age-group permissions', () => {
    const book = { age_group_min: 5, age_group_max: 7 };
    expect(bookAllowedByAgeGroups(book, [])).toBe(true);
    expect(bookAllowedByAgeGroups(book, ['4-6', '6-8'])).toBe(true);
    expect(bookAllowedByAgeGroups(book, ['0-2', '10-12'])).toBe(false);
  });
});
