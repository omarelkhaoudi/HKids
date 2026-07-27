/**
 * Centralized premium feature gating.
 */

import { getFeatureFlags, listPremiumPacks } from './premiumPackStore';
import { bookMatchesPack } from '../constants/premiumPacks';
import { isPremiumBook } from './discoveryRails';
import {
  buildPremiumContext,
  canAccessPremiumBook,
  getBookPremiumState,
  inferPremiumAccess,
  isPremiumContent,
  PREMIUM_ACCESS,
} from '../services/premium/premiumContract';

export { PREMIUM_ACCESS, inferPremiumAccess, isPremiumContent, getBookPremiumState };

/** Normalize `/subscriptions/me` and nested API shapes. */
export function normalizeSubscription(payload) {
  if (!payload) return null;
  if (payload.subscription !== undefined) return payload.subscription || null;
  if (payload.status || payload.plan || payload.plan_code) return payload;
  return null;
}

export function hasActiveSubscription(subscription) {
  const sub = normalizeSubscription(subscription) || subscription;
  if (!sub || typeof sub !== 'object') return false;
  const status = String(sub.status || '').toLowerCase();
  if (!['active', 'trialing'].includes(status)) return false;
  if (sub.current_period_end) {
    const end = new Date(sub.current_period_end);
    if (Number.isFinite(end.getTime()) && end < new Date()) return false;
  }
  return true;
}

export function isFeatureEnabled(featureId, flags = getFeatureFlags()) {
  if (!featureId) return true;
  return flags[featureId] !== false;
}

export function canAccessFeature(featureId, { subscription = null, flags = getFeatureFlags() } = {}) {
  if (!isFeatureEnabled(featureId, flags)) return false;
  // Free-friendly features that still show locked premium UX when off-plan
  const premiumOnly = [
    'ai_stories',
    'premium_books',
    'seasonal_packs',
    'exclusive_avatars',
    'premium_games',
    'premium_quizzes',
    'premium_narrators',
  ];
  if (!premiumOnly.includes(featureId)) return true;
  return hasActiveSubscription(subscription);
}

export function canAccessPack(pack, { subscription = null, flags = getFeatureFlags() } = {}) {
  if (!pack || pack.archived || pack.published === false) return false;
  const required = pack.features || [];
  if (required.some((flag) => !isFeatureEnabled(flag, flags))) return false;
  return hasActiveSubscription(subscription);
}

export function canAccessBook(book, {
  subscription = null,
  parentalPolicy = null,
  unlockedBookIds = [],
} = {}) {
  const context = buildPremiumContext({ subscription, parentalPolicy, unlockedBookIds });
  return canAccessPremiumBook(book, context);
}

export function getBookAccessState(book, context = {}) {
  const premiumContext = buildPremiumContext(context);
  return getBookPremiumState(book, premiumContext);
}

export function getPackAccessState(pack, context = {}) {
  const flags = context.flags || getFeatureFlags();
  const subscribed = hasActiveSubscription(context.subscription);
  const featureBlocked = (pack.features || []).some((flag) => !isFeatureEnabled(flag, flags));
  if (featureBlocked) {
    return { locked: true, reason: 'feature_disabled', canPreview: true };
  }
  if (!subscribed) {
    return { locked: true, reason: 'subscription_required', canPreview: true };
  }
  return { locked: false, reason: null, canPreview: true };
}

export function filterBooksForPack(books = [], pack) {
  return books.filter((book) => bookMatchesPack(book, pack) || (isPremiumBook(book) && pack?.themes?.length));
}

export function buildPremiumDiscoverySections({
  books = [],
  subscription = null,
  recommendedBooks = [],
} = {}) {
  const packs = listPremiumPacks();
  const flags = getFeatureFlags();
  const withAccess = packs.map((pack) => ({
    ...pack,
    access: getPackAccessState(pack, { subscription, flags }),
    sampleBooks: books.filter((book) => bookMatchesPack(book, pack)).slice(0, 8),
  }));

  const popular = withAccess.filter((p) => p.featured).slice(0, 8);
  const newest = withAccess.filter((p) => p.isNew).slice(0, 8);
  const seasonal = withAccess.filter((p) => p.seasonal).slice(0, 8);
  const ai = withAccess.filter((p) => p.ai);
  const collections = withAccess.filter((p) => !p.seasonal && !p.ai);
  const recommended = withAccess
    .filter((pack) => recommendedBooks.some((book) => bookMatchesPack(book, pack)))
    .slice(0, 6);

  return {
    popular: popular.length ? popular : collections.slice(0, 6),
    newPremium: newest.length ? newest : collections.filter((p) => p.isNew || p.featured).slice(0, 6),
    seasonal,
    aiStories: ai,
    collections,
    recommended: recommended.length ? recommended : popular.slice(0, 4),
    all: withAccess,
  };
}

export function getSubscriptionComparisonRows(t = (k) => k) {
  return [
    { id: 'library', label: t('premCompareLibrary'), free: true, premium: true },
    { id: 'premium_books', label: t('premCompareBooks'), free: false, premium: true },
    { id: 'seasonal', label: t('premCompareSeasonal'), free: false, premium: true },
    { id: 'ai', label: t('premCompareAi'), free: false, premium: true },
    { id: 'games', label: t('premCompareGames'), free: 'limited', premium: true },
    { id: 'avatars', label: t('premCompareAvatars'), free: 'limited', premium: true },
    { id: 'narrators', label: t('premCompareNarrators'), free: false, premium: true },
    { id: 'quizzes', label: t('premCompareQuizzes'), free: 'limited', premium: true },
  ];
}
