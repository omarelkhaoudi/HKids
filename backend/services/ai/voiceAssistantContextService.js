import { getDatabase } from '../../database/init.js';
import { loadChildAccessPolicy } from '../parental/parentalAccessService.js';

const SUPPORTED_LANGUAGES = new Set(['fr', 'en', 'ar']);

function normalizeText(value, maxLength = 120) {
  const text = String(value || '').trim();
  return text ? text.slice(0, maxLength) : null;
}

function normalizeLanguage(value) {
  const language = String(value || '').trim().toLowerCase().slice(0, 2);
  return SUPPORTED_LANGUAGES.has(language) ? language : null;
}

function normalizeList(value, maxItems = 20) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeText(item))
    .filter((item, index, items) => item && items.indexOf(item) === index)
    .slice(0, maxItems);
}

export function normalizeConversation(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((message) => {
      const role = message?.role === 'assistant'
        ? 'assistant'
        : ['kid', 'user'].includes(message?.role)
          ? 'user'
          : null;
      const text = normalizeText(message?.text ?? message?.content, 600);
      return role && text ? { role, content: text } : null;
    })
    .filter(Boolean)
    .slice(-8);
}

export function createFallbackAssistantContext({ user, requestedLanguage = null } = {}) {
  return {
    child: {
      id: user?.kid_profile_id || null,
      first_name: null,
      age: null,
      preferred_language: normalizeLanguage(requestedLanguage),
      interests: [],
      reading_level: null
    },
    reading: {
      books_started: 0,
      books_completed: 0,
      total_reading_seconds: 0,
      average_progress_percent: 0
    },
    parental_controls: {
      configured: false,
      daily_screen_time_minutes: null,
      screen_time_used_seconds: null,
      screen_time_remaining_seconds: null,
      screen_time_limit_reached: false,
      access_window: null,
      allowed_languages: [],
      allowed_themes: [],
      category_restrictions_active: false,
      allowed_categories: [],
      forbidden_categories: []
    },
    profile_available: false
  };
}

export async function loadVoiceAssistantContext({
  user,
  requestedKidProfileId = null,
  requestedLanguage = null,
  policy = null,
  pool = getDatabase()
} = {}) {
  const accessPolicy = policy || await loadChildAccessPolicy({
    user,
    requestedKidProfileId,
    pool
  });
  if (!accessPolicy.applies) {
    return createFallbackAssistantContext({ user, requestedLanguage });
  }

  const readingResult = await pool.query(
    `SELECT
      (SELECT COUNT(*)::int FROM kid_reading_progress WHERE kid_profile_id = $1) AS books_started,
      (SELECT COUNT(*)::int FROM kid_reading_progress WHERE kid_profile_id = $1 AND completed = TRUE) AS books_completed,
      (SELECT COALESCE(SUM(duration_seconds), 0)::int FROM kid_reading_sessions WHERE kid_profile_id = $1) AS total_reading_seconds,
      (SELECT COALESCE(AVG(progress_percent), 0)::numeric FROM kid_reading_progress WHERE kid_profile_id = $1) AS average_progress_percent`,
    [accessPolicy.child.id]
  );
  const reading = readingResult.rows[0] || {};

  return {
    child: {
      id: accessPolicy.child.id,
      first_name: normalizeText(accessPolicy.child.first_name),
      age: accessPolicy.child.age,
      preferred_language: normalizeLanguage(accessPolicy.child.preferred_language) || normalizeLanguage(requestedLanguage),
      interests: normalizeList(accessPolicy.child.interests, 12),
      reading_level: null
    },
    reading: {
      books_started: Number(reading.books_started || 0),
      books_completed: Number(reading.books_completed || 0),
      total_reading_seconds: Number(reading.total_reading_seconds || 0),
      average_progress_percent: Math.round(Number(reading.average_progress_percent || 0))
    },
    parental_controls: {
      configured: Boolean(accessPolicy.rules?.configured),
      daily_screen_time_minutes: accessPolicy.rules?.daily_screen_time_minutes ?? null,
      screen_time_used_seconds: accessPolicy.rules?.screen_time_used_seconds ?? null,
      screen_time_remaining_seconds: accessPolicy.rules?.screen_time_remaining_seconds ?? null,
      screen_time_limit_reached: Boolean(accessPolicy.rules?.screen_time_limit_reached),
      access_window: accessPolicy.rules?.quiet_start_time && accessPolicy.rules?.quiet_end_time
        ? {
            start: accessPolicy.rules.quiet_start_time,
            end: accessPolicy.rules.quiet_end_time,
            currently_allowed: !accessPolicy.rules.blocked_hours_active
          }
        : null,
      allowed_languages: accessPolicy.rules?.allowed_languages || [],
      allowed_themes: accessPolicy.rules?.allowed_themes || [],
      category_restrictions_active: accessPolicy.categoryRestrictionsActive,
      allowed_categories: accessPolicy.allowedCategoryNames.map((name, index) => ({
        id: accessPolicy.allowedCategoryIds[index] || null,
        name
      })),
      forbidden_categories: accessPolicy.forbiddenCategoryNames.map((name) => ({
        id: null,
        name
      }))
    },
    profile_available: true
  };
}

export function resolveAssistantLanguage(context, fallbackLanguage = 'fr') {
  const preferredLanguage = normalizeLanguage(context?.child?.preferred_language);
  const allowedLanguages = normalizeList(context?.parental_controls?.allowed_languages)
    .map(normalizeLanguage)
    .filter(Boolean);

  if (preferredLanguage && (allowedLanguages.length === 0 || allowedLanguages.includes(preferredLanguage))) {
    return preferredLanguage;
  }

  return allowedLanguages[0] || normalizeLanguage(fallbackLanguage) || 'fr';
}
