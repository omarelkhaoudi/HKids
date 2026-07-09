import { getDatabase } from '../../database/init.js';

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

function resolveAge(kid) {
  const hasStoredAge = kid?.age !== null && kid?.age !== undefined && kid?.age !== '';
  const storedAge = hasStoredAge ? Number(kid.age) : Number.NaN;
  if (Number.isFinite(storedAge) && storedAge >= 0) return storedAge;
  if (!kid?.date_of_birth) return null;

  const birthDate = new Date(kid.date_of_birth);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const birthdayHasPassed = (
    today.getUTCMonth() > birthDate.getUTCMonth()
    || (
      today.getUTCMonth() === birthDate.getUTCMonth()
      && today.getUTCDate() >= birthDate.getUTCDate()
    )
  );
  if (!birthdayHasPassed) age -= 1;
  return age >= 0 && age <= 18 ? age : null;
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

async function getAuthorizedKid(pool, user, requestedKidProfileId) {
  if (user?.role === 'kid' && user.kid_profile_id) {
    const result = await pool.query(
      'SELECT * FROM kids_profiles WHERE id = $1',
      [user.kid_profile_id]
    );
    return result.rows[0] || null;
  }

  const kidProfileId = Number.parseInt(requestedKidProfileId, 10);
  if (!Number.isFinite(kidProfileId)) return null;

  if (user?.role === 'parent') {
    const result = await pool.query(
      'SELECT * FROM kids_profiles WHERE id = $1 AND parent_id = $2',
      [kidProfileId, user.id]
    );
    return result.rows[0] || null;
  }

  if (user?.role === 'admin') {
    const result = await pool.query(
      'SELECT * FROM kids_profiles WHERE id = $1',
      [kidProfileId]
    );
    return result.rows[0] || null;
  }

  return null;
}

export async function loadVoiceAssistantContext({
  user,
  requestedKidProfileId = null,
  requestedLanguage = null,
  pool = getDatabase()
} = {}) {
  const fallback = createFallbackAssistantContext({ user, requestedLanguage });
  const kid = await getAuthorizedKid(pool, user, requestedKidProfileId);
  if (!kid) return fallback;

  const [rulesResult, categoriesResult, readingResult] = await Promise.all([
    pool.query(
      `SELECT
        pr.*,
        COALESCE((
          SELECT SUM(krs.duration_seconds)
          FROM kid_reading_sessions krs
          WHERE krs.kid_profile_id = pr.kid_profile_id
            AND krs.created_at >= date_trunc('day', NOW())
        ), 0)::int AS screen_time_used_seconds,
        CASE
          WHEN pr.quiet_start_time IS NULL OR pr.quiet_end_time IS NULL THEN NULL
          WHEN pr.quiet_start_time <= pr.quiet_end_time
            THEN CURRENT_TIME BETWEEN pr.quiet_start_time AND pr.quiet_end_time
          ELSE CURRENT_TIME >= pr.quiet_start_time OR CURRENT_TIME <= pr.quiet_end_time
        END AS within_access_window
      FROM parental_rules pr
      WHERE pr.kid_profile_id = $1
      LIMIT 1`,
      [kid.id]
    ),
    pool.query(
      `SELECT c.id, c.name, pa.approved
       FROM categories c
       LEFT JOIN parent_approvals pa
         ON pa.category_id = c.id
        AND pa.kid_profile_id = $1
       ORDER BY c.name ASC`,
      [kid.id]
    ),
    pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM kid_reading_progress WHERE kid_profile_id = $1) AS books_started,
        (SELECT COUNT(*)::int FROM kid_reading_progress WHERE kid_profile_id = $1 AND completed = TRUE) AS books_completed,
        (SELECT COALESCE(SUM(duration_seconds), 0)::int FROM kid_reading_sessions WHERE kid_profile_id = $1) AS total_reading_seconds,
        (SELECT COALESCE(AVG(progress_percent), 0)::numeric FROM kid_reading_progress WHERE kid_profile_id = $1) AS average_progress_percent`,
      [kid.id]
    )
  ]);

  const rules = rulesResult.rows[0] || null;
  const reading = readingResult.rows[0] || {};
  const categories = categoriesResult.rows;
  const explicitCategoryRules = categories.filter((category) => category.approved !== null);
  const categoryRestrictionsActive = explicitCategoryRules.length > 0;
  const allowedCategories = categoryRestrictionsActive
    ? categories.filter((category) => category.approved === true)
    : categories;
  const forbiddenCategories = categoryRestrictionsActive
    ? categories.filter((category) => category.approved !== true)
    : [];

  const dailyLimitMinutes = rules
    ? Math.max(0, Number(rules.daily_screen_time_minutes || 0))
    : null;
  const screenTimeUsedSeconds = rules
    ? Math.max(0, Number(rules.screen_time_used_seconds || 0))
    : null;
  const screenTimeRemainingSeconds = dailyLimitMinutes && dailyLimitMinutes > 0
    ? Math.max(0, dailyLimitMinutes * 60 - screenTimeUsedSeconds)
    : null;

  return {
    child: {
      id: kid.id,
      first_name: normalizeText(kid.name),
      age: resolveAge(kid),
      preferred_language: normalizeLanguage(kid.preferred_language) || normalizeLanguage(requestedLanguage),
      interests: normalizeList(kid.interests, 12),
      reading_level: null
    },
    reading: {
      books_started: Number(reading.books_started || 0),
      books_completed: Number(reading.books_completed || 0),
      total_reading_seconds: Number(reading.total_reading_seconds || 0),
      average_progress_percent: Math.round(Number(reading.average_progress_percent || 0))
    },
    parental_controls: {
      configured: Boolean(rules),
      daily_screen_time_minutes: dailyLimitMinutes,
      screen_time_used_seconds: screenTimeUsedSeconds,
      screen_time_remaining_seconds: screenTimeRemainingSeconds,
      screen_time_limit_reached: screenTimeRemainingSeconds === 0,
      access_window: rules?.quiet_start_time && rules?.quiet_end_time
        ? {
            start: String(rules.quiet_start_time).slice(0, 5),
            end: String(rules.quiet_end_time).slice(0, 5),
            currently_allowed: rules.within_access_window === true
          }
        : null,
      allowed_languages: normalizeList(rules?.allowed_languages),
      allowed_themes: normalizeList(rules?.allowed_themes),
      category_restrictions_active: categoryRestrictionsActive,
      allowed_categories: allowedCategories.map((category) => ({
        id: category.id,
        name: normalizeText(category.name)
      })),
      forbidden_categories: forbiddenCategories.map((category) => ({
        id: category.id,
        name: normalizeText(category.name)
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
