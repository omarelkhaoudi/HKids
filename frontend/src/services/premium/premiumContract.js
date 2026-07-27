export const PREMIUM_ACCESS = {
  FREE: 'free',
  SUBSCRIPTION: 'subscription',
  PACK: 'pack',
  UNLOCK: 'unlock',
};

export function isPremiumContent(content = {}) {
  return content.is_premium === true || content.is_premium === 1;
}

export function inferPremiumAccess(content = {}) {
  if (content.metadata?.premium_access) return content.metadata.premium_access;
  if (!isPremiumContent(content)) return PREMIUM_ACCESS.FREE;

  if (content.metadata?.premium_pack_id || content.premium_pack_id) {
    return PREMIUM_ACCESS.PACK;
  }

  const slug = String(content.slug || '');
  if (slug.startsWith('prem-') || content.catalog_area === 'characters' || content.metadata?.catalog_area === 'characters') {
    return PREMIUM_ACCESS.SUBSCRIPTION;
  }

  return PREMIUM_ACCESS.SUBSCRIPTION;
}

export function canAccessPremiumBook(content = {}, {
  hasActiveSubscription = false,
  unlockedBookIds = [],
} = {}) {
  if (!isPremiumContent(content)) return true;
  if (hasActiveSubscription) return true;
  const bookId = Number(content.id);
  if (!Number.isFinite(bookId)) return false;
  return unlockedBookIds.map(Number).includes(bookId);
}

export function getBookPremiumState(content = {}, context = {}) {
  const access = inferPremiumAccess(content);
  const isPremium = access !== PREMIUM_ACCESS.FREE;
  const accessible = canAccessPremiumBook(content, context);
  return {
    isPremium,
    access,
    accessible,
    locked: isPremium && !accessible,
    showBadge: isPremium,
    showLock: isPremium && !accessible,
    requiresSubscription: isPremium && access === PREMIUM_ACCESS.SUBSCRIPTION,
    requiresUnlock: isPremium && access === PREMIUM_ACCESS.UNLOCK && !accessible,
    requiresPack: isPremium && access === PREMIUM_ACCESS.PACK && !accessible,
  };
}

export function buildPremiumContext({
  subscription = null,
  parentalPolicy = null,
  unlockedBookIds = [],
} = {}) {
  const hasActiveSubscription = Boolean(
    parentalPolicy?.has_active_subscription
    ?? parentalPolicy?.hasActiveSubscription
    ?? isActiveSubscriptionStatus(subscription)
  );
  const ids = [
    ...(Array.isArray(unlockedBookIds) ? unlockedBookIds : []),
    ...(Array.isArray(parentalPolicy?.premium_unlocked_book_ids) ? parentalPolicy.premium_unlocked_book_ids : []),
  ];

  return {
    hasActiveSubscription,
    unlockedBookIds: [...new Set(ids.map(Number).filter(Number.isFinite))],
  };
}

function isActiveSubscriptionStatus(subscription) {
  if (!subscription || typeof subscription !== 'object') return false;
  const status = String(subscription.status || '').toLowerCase();
  if (!['active', 'trialing'].includes(status)) return false;
  if (subscription.current_period_end) {
    const end = new Date(subscription.current_period_end);
    if (Number.isFinite(end.getTime()) && end < new Date()) return false;
  }
  return true;
}
