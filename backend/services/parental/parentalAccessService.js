import { getDatabase } from '../../database/init.js';

const THEME_KEYWORDS = {
  dinosaurs: ['dinosaure', 'dinosaur', 'dino'],
  space: ['espace', 'space', 'fusee', 'fusée', 'rocket', 'planete', 'planète'],
  animals: ['animal', 'animaux', 'animals'],
  princesses: ['princesse', 'princess'],
  jobs: ['metier', 'métier', 'job', 'pompier', 'doctor'],
  world: ['monde', 'world', 'voyage', 'travel']
};

const RESTRICTION_MESSAGES = {
  SCREEN_TIME_LIMIT: "Le temps d'écran autorisé est terminé pour aujourd'hui.",
  BLOCKED_HOURS: "Cette fonctionnalité n'est pas disponible pendant l'horaire de pause défini par le parent.",
  CATEGORY_NOT_ALLOWED: "Ce contenu n'appartient pas à une catégorie autorisée.",
  LANGUAGE_NOT_ALLOWED: "Cette langue n'est pas autorisée par le contrôle parental.",
  THEME_NOT_ALLOWED: "Ce thème n'est pas autorisé par le contrôle parental.",
  AGE_NOT_ALLOWED: "Ce contenu n'est pas adapté à l'âge de cet enfant.",
  PREMIUM_NOT_ALLOWED: "Ce contenu premium doit être autorisé et débloqué par le parent.",
  CHILD_PROFILE_REQUIRED: "Un profil enfant valide est nécessaire pour accéder à ce contenu.",
  POLICY_UNAVAILABLE: "Le contrôle parental est momentanément indisponible."
};

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeList(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
}

export function resolveChildAge(kid) {
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

export class ParentalAccessError extends Error {
  constructor(code, details = {}) {
    super(RESTRICTION_MESSAGES[code] || RESTRICTION_MESSAGES.POLICY_UNAVAILABLE);
    this.name = 'ParentalAccessError';
    this.code = code;
    this.status = 403;
    this.details = details;
    this.isParentalAccessError = true;
  }
}

export function sendParentalAccessError(res, error) {
  return res.status(error.status || 403).json({
    error: error.message,
    code: error.code || 'PARENTAL_RESTRICTION',
    parental_restriction: true,
    details: error.details || {}
  });
}

export async function getAuthorizedKidProfile(pool, user, requestedKidProfileId = null) {
  if (user?.role === 'kid') {
    if (!user.kid_profile_id) return null;
    const result = await pool.query('SELECT * FROM kids_profiles WHERE id = $1', [user.kid_profile_id]);
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
    const result = await pool.query('SELECT * FROM kids_profiles WHERE id = $1', [kidProfileId]);
    return result.rows[0] || null;
  }

  return null;
}

export async function loadChildAccessPolicy({
  user,
  requestedKidProfileId = null,
  pool = getDatabase()
} = {}) {
  const kid = await getAuthorizedKidProfile(pool, user, requestedKidProfileId);
  if (!kid) {
    return {
      applies: false,
      child: null,
      rules: null,
      allowedCategoryIds: [],
      allowedCategoryNames: [],
      forbiddenCategoryNames: [],
      premiumUnlockedBookIds: []
    };
  }

  const [rulesResult, categoriesResult, subscriptionResult] = await Promise.all([
    pool.query(
      `SELECT
        pr.*,
        COALESCE((
          SELECT SUM(ksts.duration_seconds)
          FROM kid_screen_time_sessions ksts
          WHERE ksts.kid_profile_id = pr.kid_profile_id
            AND ksts.started_at >= date_trunc('day', NOW())
        ), (
          SELECT SUM(krs.duration_seconds)
          FROM kid_reading_sessions krs
          WHERE krs.kid_profile_id = pr.kid_profile_id
            AND krs.created_at >= date_trunc('day', NOW())
        ), 0)::int AS screen_time_used_seconds,
        CASE
          WHEN pr.quiet_start_time IS NULL OR pr.quiet_end_time IS NULL THEN FALSE
          WHEN pr.quiet_start_time <= pr.quiet_end_time
            THEN CURRENT_TIME BETWEEN pr.quiet_start_time AND pr.quiet_end_time
          ELSE CURRENT_TIME >= pr.quiet_start_time OR CURRENT_TIME <= pr.quiet_end_time
        END AS blocked_hours_active
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
      `SELECT us.id, us.current_period_start, us.current_period_end,
              ARRAY_REMOVE(ARRAY_AGG(sbu.book_id), NULL) AS unlocked_book_ids
       FROM user_subscriptions us
       LEFT JOIN subscription_book_unlocks sbu
         ON sbu.subscription_id = us.id
        AND sbu.period_start = us.current_period_start
       WHERE us.user_id = $1
         AND us.status IN ('trialing', 'active', 'past_due')
         AND us.current_period_start <= NOW()
         AND us.current_period_end > NOW()
       GROUP BY us.id
       ORDER BY CASE WHEN us.status = 'active' THEN 0 ELSE 1 END, us.created_at DESC
       LIMIT 1`,
      [kid.parent_id]
    )
  ]);

  const rules = rulesResult.rows[0] || null;
  const categories = categoriesResult.rows;
  const explicitApprovals = categories.filter((category) => category.approved !== null);
  const allowedCategories = categories.filter((category) => category.approved === true);
  const forbiddenCategories = explicitApprovals.length > 0
    ? categories.filter((category) => category.approved !== true)
    : categories;
  const dailyLimitMinutes = rules ? Math.max(0, Number(rules.daily_screen_time_minutes || 0)) : null;
  const usedSeconds = rules ? Math.max(0, Number(rules.screen_time_used_seconds || 0)) : null;
  const remainingSeconds = dailyLimitMinutes && dailyLimitMinutes > 0
    ? Math.max(0, dailyLimitMinutes * 60 - usedSeconds)
    : null;

  return {
    applies: true,
    child: {
      id: kid.id,
      parent_id: kid.parent_id,
      first_name: kid.name || null,
      age: resolveChildAge(kid),
      preferred_language: kid.preferred_language || null,
      interests: normalizeList(kid.interests)
    },
    rules: {
      configured: Boolean(rules),
      daily_screen_time_minutes: dailyLimitMinutes,
      screen_time_used_seconds: usedSeconds,
      screen_time_remaining_seconds: remainingSeconds,
      screen_time_limit_reached: remainingSeconds === 0,
      blocked_hours_active: rules?.blocked_hours_active === true,
      quiet_start_time: rules?.quiet_start_time ? String(rules.quiet_start_time).slice(0, 5) : null,
      quiet_end_time: rules?.quiet_end_time ? String(rules.quiet_end_time).slice(0, 5) : null,
      allowed_languages: normalizeList(rules?.allowed_languages),
      allowed_themes: normalizeList(rules?.allowed_themes),
      allowed_content_types: normalizeList(rules?.allowed_content_types)
    },
    categoryRestrictionsActive: explicitApprovals.length > 0,
    explicitCategoryApprovals: explicitApprovals.length > 0,
    allowedCategoryIds: allowedCategories.map((category) => Number(category.id)),
    allowedCategoryNames: allowedCategories.map((category) => String(category.name)),
    forbiddenCategoryNames: forbiddenCategories.map((category) => String(category.name)),
    hasActiveSubscription: Boolean(subscriptionResult.rows[0]),
    premiumUnlockedBookIds: normalizeList(subscriptionResult.rows[0]?.unlocked_book_ids)
      .map((id) => Number(id))
      .filter(Number.isFinite)
  };
}

export function getGlobalAccessViolation(policy) {
  if (!policy?.applies) return null;
  if (policy.rules?.screen_time_limit_reached) {
    return new ParentalAccessError('SCREEN_TIME_LIMIT', {
      remaining_seconds: 0
    });
  }
  if (policy.rules?.blocked_hours_active) {
    return new ParentalAccessError('BLOCKED_HOURS', {
      start: policy.rules.quiet_start_time,
      end: policy.rules.quiet_end_time
    });
  }
  return null;
}

export function getContentAccessViolation(policy, content = {}, { includeGlobal = true } = {}) {
  if (!policy?.applies) return null;
  if (includeGlobal) {
    const globalViolation = getGlobalAccessViolation(policy);
    if (globalViolation) return globalViolation;
  }

  const childAge = policy.child?.age;
  const ageMin = content.age_group_min ?? content.age_min;
  const ageMax = content.age_group_max ?? content.age_max;
  if (
    childAge !== null
    && childAge !== undefined
    && (
      (ageMin !== null && ageMin !== undefined && childAge < Number(ageMin))
      || (ageMax !== null && ageMax !== undefined && childAge > Number(ageMax))
    )
  ) {
    return new ParentalAccessError('AGE_NOT_ALLOWED', {
      child_age: childAge,
      minimum_age: ageMin ?? null,
      maximum_age: ageMax ?? null
    });
  }

  const allowedLanguages = policy.rules?.allowed_languages || [];
  if (allowedLanguages.length > 0 && (!content.language || !allowedLanguages.includes(content.language))) {
    return new ParentalAccessError('LANGUAGE_NOT_ALLOWED', {
      language: content.language || null,
      allowed_languages: allowedLanguages
    });
  }

  const allowedThemes = policy.rules?.allowed_themes || [];
  if (allowedThemes.length > 0 && (!content.theme || !allowedThemes.includes(content.theme))) {
    return new ParentalAccessError('THEME_NOT_ALLOWED', {
      theme: content.theme || null,
      allowed_themes: allowedThemes
    });
  }

  const allowedContentTypes = policy.rules?.allowed_content_types || [];
  if (allowedContentTypes.length > 0 && content.content_type && !allowedContentTypes.includes(content.content_type)) {
    return new ParentalAccessError('CONTENT_TYPE_NOT_ALLOWED', {
      content_type: content.content_type,
      allowed_content_types: allowedContentTypes
    });
  }

  if (
    content.source !== 'learning'
    && policy.explicitCategoryApprovals
    && content.category_id !== null
    && content.category_id !== undefined
  ) {
    const categoryId = Number(content.category_id);
    const categoryName = normalizeText(content.category_name || content.category_code);
    const categoryAliases = Array.isArray(content.category_aliases)
      ? content.category_aliases.map(normalizeText).filter(Boolean)
      : [];
    const allowedById = Number.isFinite(categoryId) && policy.allowedCategoryIds.includes(categoryId);
    const allowedByName = policy.allowedCategoryNames.some(
      (name) => [categoryName, ...categoryAliases].includes(normalizeText(name))
    );
    if (!allowedById && !allowedByName) {
      return new ParentalAccessError('CATEGORY_NOT_ALLOWED', {
        category_id: Number.isFinite(categoryId) ? categoryId : null,
        category_name: content.category_name || content.category_code || null
      });
    }
  }

  if (content.is_premium === true && !policy.premiumUnlockedBookIds.includes(Number(content.id))) {
    return new ParentalAccessError('PREMIUM_NOT_ALLOWED', {
      content_id: content.id,
      active_subscription: policy.hasActiveSubscription
    });
  }

  return null;
}

export function assertChildAccess(policy, content = null, options = {}) {
  const violation = content
    ? getContentAccessViolation(policy, content, options)
    : getGlobalAccessViolation(policy);
  if (violation) throw violation;
  return policy;
}

export function filterAllowedContent(policy, contents = [], options = {}) {
  return contents.filter((content) => !getContentAccessViolation(policy, content, options));
}

function detectTheme(text) {
  const normalizedText = normalizeText(text);
  return Object.entries(THEME_KEYWORDS).find(([, keywords]) => (
    keywords.some((keyword) => normalizedText.includes(normalizeText(keyword)))
  ))?.[0] || null;
}

export function getTextAccessViolation(policy, text) {
  const globalViolation = getGlobalAccessViolation(policy);
  if (globalViolation) return globalViolation;
  if (!policy?.applies) return null;

  const normalizedText = normalizeText(text);
  const forbiddenCategory = policy.forbiddenCategoryNames.find((name) => (
    normalizedText.includes(normalizeText(name))
  ));
  if (forbiddenCategory) {
    return new ParentalAccessError('CATEGORY_NOT_ALLOWED', {
      category_name: forbiddenCategory
    });
  }

  const requestedTheme = detectTheme(text);
  const allowedThemes = policy.rules?.allowed_themes || [];
  if (requestedTheme && allowedThemes.length > 0 && !allowedThemes.includes(requestedTheme)) {
    return new ParentalAccessError('THEME_NOT_ALLOWED', {
      theme: requestedTheme,
      allowed_themes: allowedThemes
    });
  }

  return null;
}

export function serializePolicyForClient(policy) {
  if (!policy?.applies) return { applies: false };
  return {
    applies: true,
    child: {
      id: policy.child.id,
      age: policy.child.age,
      preferred_language: policy.child.preferred_language
    },
    rules: policy.rules,
    allowed_category_ids: policy.allowedCategoryIds,
    allowed_category_names: policy.allowedCategoryNames,
    forbidden_category_names: policy.forbiddenCategoryNames,
    explicit_category_approvals: policy.explicitCategoryApprovals === true,
    premium_unlocked_book_ids: policy.premiumUnlockedBookIds,
    generated_at: new Date().toISOString()
  };
}
