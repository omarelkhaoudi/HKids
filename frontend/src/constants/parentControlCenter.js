import { AGE_GROUPS, ALL_AGES_ID } from './ageGroups';

export const CONTROL_THEME_OPTIONS = [
  { id: 'dinosaurs', emoji: '🦖', labelKey: 'studioWorld_dinosaurs' },
  { id: 'space', emoji: '🚀', labelKey: 'studioWorld_space' },
  { id: 'animals', emoji: '🐻', labelKey: 'studioWorld_animals' },
  { id: 'princesses', emoji: '🧚', labelKey: 'pccThemePrincesses' },
  { id: 'ocean', emoji: '🌊', labelKey: 'studioWorld_ocean' },
  { id: 'bedtime', emoji: '🌙', labelKey: 'pccThemeBedtime' },
  { id: 'vehicles', emoji: '🚗', labelKey: 'pccThemeVehicles' },
  { id: 'world', emoji: '🌍', labelKey: 'studioWorld_adventure' },
  { id: 'jobs', emoji: '🚒', labelKey: 'pccThemeJobs' },
  { id: 'colors', emoji: '🎨', labelKey: 'pccThemeColors' },
  { id: 'rhymes', emoji: '🎵', labelKey: 'pccThemeRhymes' },
  { id: 'alphabet', emoji: '🔤', labelKey: 'pccThemeAlphabet' },
  { id: 'numbers', emoji: '🔢', labelKey: 'pccThemeNumbers' },
  { id: 'spirituality', emoji: '🙏', labelKey: 'pccThemeSpirituality' },
];

export const CONTROL_AGE_OPTIONS = AGE_GROUPS.map((group) => ({
  id: group.id,
  emoji: group.emoji,
  labelKey: group.labelKey,
  min: group.min,
  max: group.max,
}));

export const RECOMMENDATION_RAIL_OPTIONS = [
  { id: 'popular', labelKey: 'pccRailPopular', emoji: '🔥' },
  { id: 'recommended', labelKey: 'pccRailRecommended', emoji: '⭐' },
  { id: 'continue', labelKey: 'pccRailContinue', emoji: '📖' },
  { id: 'discover', labelKey: 'pccRailDiscover', emoji: '✨' },
  { id: 'premium', labelKey: 'pccRailPremium', emoji: '💎' },
  { id: 'new', labelKey: 'pccRailNew', emoji: '🆕' },
];

export const DAILY_GOAL_MINUTES = [10, 20, 30, 45];

export const SCHOOL_LEVEL_OPTIONS = [
  { id: 'maternelle', labelKey: 'pccSchoolMaternelle' },
  { id: 'cp', labelKey: 'pccSchoolCp' },
  { id: 'ce1', labelKey: 'pccSchoolCe1' },
  { id: 'ce2', labelKey: 'pccSchoolCe2' },
  { id: 'cm1', labelKey: 'pccSchoolCm1' },
  { id: 'cm2', labelKey: 'pccSchoolCm2' },
  { id: 'college', labelKey: 'pccSchoolCollege' },
];

export const CONTROL_CENTER_TABS = [
  { id: 'content', labelKey: 'pccTabContent', emoji: '📚' },
  { id: 'ages', labelKey: 'pccTabAges', emoji: '🎂' },
  { id: 'library', labelKey: 'pccTabLibrary', emoji: '📌' },
  { id: 'goals', labelKey: 'pccTabGoals', emoji: '🎯' },
  { id: 'favorites', labelKey: 'pccTabFavorites', emoji: '❤️' },
  { id: 'rails', labelKey: 'pccTabRails', emoji: '🧭' },
  { id: 'profile', labelKey: 'pccTabProfile', emoji: '👧' },
  { id: 'analytics', labelKey: 'pccTabAnalytics', emoji: '📊' },
  { id: 'actions', labelKey: 'pccTabActions', emoji: '⚡' },
];

export const DEFAULT_RECOMMENDATION_RAILS = Object.fromEntries(
  RECOMMENDATION_RAIL_OPTIONS.map((rail) => [rail.id, true]),
);

export const DEFAULT_LIBRARY_CONTROLS = {
  hidden_book_ids: [],
  pinned_book_ids: [],
  forced_book_ids: [],
  custom_library_ids: [],
};

export function createEmptyRulesForm() {
  return {
    daily_screen_time_minutes: 30,
    quiet_start_time: '19:00',
    quiet_end_time: '21:00',
    allowed_languages: [],
    allowed_themes: [],
    allowed_content_types: [],
    allowed_age_groups: [],
    blocked_themes: [],
    recommendation_rails: { ...DEFAULT_RECOMMENDATION_RAILS },
    library_controls: { ...DEFAULT_LIBRARY_CONTROLS },
  };
}

export function normalizeRulesForm(data = {}) {
  return {
    ...createEmptyRulesForm(),
    ...data,
    allowed_languages: Array.isArray(data.allowed_languages) ? data.allowed_languages : [],
    allowed_themes: Array.isArray(data.allowed_themes) ? data.allowed_themes : [],
    allowed_content_types: Array.isArray(data.allowed_content_types) ? data.allowed_content_types : [],
    allowed_age_groups: Array.isArray(data.allowed_age_groups) ? data.allowed_age_groups : [],
    blocked_themes: Array.isArray(data.blocked_themes) ? data.blocked_themes : [],
    recommendation_rails: {
      ...DEFAULT_RECOMMENDATION_RAILS,
      ...(data.recommendation_rails || {}),
    },
    library_controls: {
      ...DEFAULT_LIBRARY_CONTROLS,
      ...(data.library_controls || {}),
      hidden_book_ids: data.library_controls?.hidden_book_ids || [],
      pinned_book_ids: data.library_controls?.pinned_book_ids || [],
      forced_book_ids: data.library_controls?.forced_book_ids || [],
      custom_library_ids: data.library_controls?.custom_library_ids || [],
    },
  };
}

export function toggleListValue(list = [], value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function toggleBookInLibrary(controls, field, bookId) {
  const id = Number(bookId);
  if (!Number.isFinite(id)) return controls;
  const current = Array.isArray(controls[field]) ? controls[field] : [];
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];
  return { ...controls, [field]: next };
}

export function exportKidProfilePayload(kid, rules, dashboardData) {
  return {
    exported_at: new Date().toISOString(),
    kid: {
      id: kid?.id,
      name: kid?.name,
      age: kid?.age,
      preferred_language: kid?.preferred_language,
      interests: kid?.interests,
      school_level: kid?.school_level,
      favorite_themes: kid?.favorite_themes,
    },
    rules,
    summary: dashboardData?.summary || null,
    goal: dashboardData?.goal || null,
  };
}

export { ALL_AGES_ID };
