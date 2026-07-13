import { parentalAPI } from '../../api/parental';
import { storage } from '../../utils/storage';
import { offlineDb } from '../offline/offlineDb';

const POLICY_KEY = 'connected-kid-parental-policy';

const MESSAGES = {
  SCREEN_TIME_LIMIT: "Le temps d'écran autorisé est terminé pour aujourd'hui.",
  BLOCKED_HOURS: "Cette fonctionnalité n'est pas disponible pendant l'horaire de pause défini par le parent.",
  CATEGORY_NOT_ALLOWED: "Ce contenu n'appartient pas à une catégorie autorisée.",
  LANGUAGE_NOT_ALLOWED: "Cette langue n'est pas autorisée par le contrôle parental.",
  THEME_NOT_ALLOWED: "Ce thème n'est pas autorisé par le contrôle parental.",
  CONTENT_TYPE_NOT_ALLOWED: "Ce type de contenu n'est pas autorisé par le contrôle parental.",
  AGE_NOT_ALLOWED: "Ce contenu n'est pas adapté à ton âge.",
  PREMIUM_NOT_ALLOWED: "Ce contenu premium doit être débloqué par ton parent.",
  POLICY_UNAVAILABLE: "Le contrôle parental doit être vérifié avant d'utiliser ce contenu hors connexion."
};

function currentKidUser() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.role === 'kid' && user?.kid_profile_id ? user : null;
  } catch {
    return null;
  }
}

function currentUserIsKid() {
  return Boolean(currentKidUser());
}

function scopedPolicyKey() {
  const user = currentKidUser();
  return user ? `${POLICY_KEY}:kid:${user.kid_profile_id}` : POLICY_KEY;
}

function normalize(value) {
  return String(value || '').trim().toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function timeIsBlocked(start, end) {
  if (!start || !end) return false;
  const current = new Date().toTimeString().slice(0, 5);
  return start <= end ? current >= start && current <= end : current >= start || current <= end;
}

function todayOfflineSeconds() {
  const today = new Date().toDateString();
  const readingSeconds = (storage.getReadingStats().sessions || []).reduce((total, session) => (
    new Date(session.date).toDateString() === today ? total + Number(session.durationSeconds || 0) : total
  ), 0);
  const user = currentKidUser();
  const date = new Date();
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const screenSeconds = user
    ? Number(localStorage.getItem(`hkids_screen_time_daily:kid:${user.kid_profile_id}:${day}`) || 0)
    : 0;
  return Math.max(readingSeconds, screenSeconds);
}

function restriction(code, details = {}) {
  const error = new Error(MESSAGES[code] || MESSAGES.POLICY_UNAVAILABLE);
  error.code = code;
  error.parentalRestriction = true;
  error.details = details;
  return error;
}

const LEARNING_ACTIVITY_TYPES = new Set([
  'quiz', 'game', 'challenge', 'alphabet', 'numbers', 'colors', 'shapes', 'languages'
]);

function isLearningActivityAllowedByParent(content, allowedContentTypes = []) {
  if (content?.source !== 'learning' || !LEARNING_ACTIVITY_TYPES.has(content.content_type)) {
    return false;
  }
  return allowedContentTypes.includes('quiz') || allowedContentTypes.includes('educational');
}

export async function synchronizeParentalPolicy() {
  if (!currentUserIsKid()) return null;
  const response = await parentalAPI.getConnectedKidAccessPolicy();
  const key = scopedPolicyKey();
  const record = { key, policy: response.data, savedAt: new Date().toISOString() };
  await offlineDb.put(offlineDb.stores.metadata, record);
  return record.policy;
}

export async function getCachedParentalPolicy() {
  if (!currentUserIsKid()) return null;
  return (await offlineDb.get(offlineDb.stores.metadata, scopedPolicyKey()))?.policy || null;
}

export async function getCurrentParentalPolicy() {
  if (!currentUserIsKid()) return null;
  if (navigator.onLine) {
    try {
      return await synchronizeParentalPolicy();
    } catch {
      // The cached policy remains authoritative while the network is unstable.
    }
  }
  return getCachedParentalPolicy();
}

export function getParentalViolation(policy, content = null) {
  if (!currentUserIsKid()) return null;
  if (!policy?.applies) return restriction('POLICY_UNAVAILABLE');

  const rules = policy.rules || {};
  const dailyLimit = Number(rules.daily_screen_time_minutes || 0) * 60;
  const serverUsed = Number(rules.screen_time_used_seconds || 0);
  if (dailyLimit > 0 && Math.max(serverUsed, todayOfflineSeconds()) >= dailyLimit) {
    return restriction('SCREEN_TIME_LIMIT');
  }
  if (timeIsBlocked(rules.quiet_start_time, rules.quiet_end_time)) {
    return restriction('BLOCKED_HOURS');
  }
  if (!content) return null;

  const age = policy.child?.age;
  const minimumAge = content.age_group_min ?? content.age_min;
  const maximumAge = content.age_group_max ?? content.age_max;
  if (age != null && ((minimumAge != null && age < Number(minimumAge)) || (maximumAge != null && age > Number(maximumAge)))) {
    return restriction('AGE_NOT_ALLOWED');
  }

  if (rules.allowed_languages?.length && (!content.language || !rules.allowed_languages.includes(content.language))) {
    return restriction('LANGUAGE_NOT_ALLOWED');
  }
  if (rules.allowed_themes?.length && (!content.theme || !rules.allowed_themes.includes(content.theme))) {
    return restriction('THEME_NOT_ALLOWED');
  }
  if (
    rules.allowed_content_types?.length
    && content.content_type
    && !rules.allowed_content_types.includes(content.content_type)
    && !isLearningActivityAllowedByParent(content, rules.allowed_content_types)
  ) {
    return restriction('CONTENT_TYPE_NOT_ALLOWED');
  }

  if (
    content.source !== 'learning'
    && policy.explicit_category_approvals
    && content.category_id != null
  ) {
    const allowedIds = policy.allowed_category_ids || [];
    const allowedNames = (policy.allowed_category_names || []).map(normalize);
    if (!allowedIds.includes(Number(content.category_id)) && !allowedNames.includes(normalize(content.category_name))) {
      return restriction('CATEGORY_NOT_ALLOWED');
    }
  }

  if (content.is_premium === true && !(policy.premium_unlocked_book_ids || []).includes(Number(content.id))) {
    return restriction('PREMIUM_NOT_ALLOWED');
  }
  return null;
}

export async function assertParentalAccess(content = null) {
  const violation = getParentalViolation(await getCurrentParentalPolicy(), content);
  if (violation) throw violation;
}

export async function filterOfflineContent(records) {
  if (!currentUserIsKid()) return records;
  const policy = await getCurrentParentalPolicy();
  return records.filter((record) => !getParentalViolation(policy, record.payload));
}

export function getRestrictionMessage(error, fallback) {
  return error?.response?.data?.parental_restriction
    ? error.response.data.error
    : error?.parentalRestriction
      ? error.message
      : fallback;
}
