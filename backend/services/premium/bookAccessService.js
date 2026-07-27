import jwt from 'jsonwebtoken';
import config from '../../config/env.js';
import {
  getContentAccessViolation,
  loadChildAccessPolicy,
} from '../parental/parentalAccessService.js';
import {
  buildPremiumContext,
  canAccessPremiumBook,
  isPremiumContent,
} from './premiumContract.js';
import { getCurrentSubscription } from '../stripe/subscriptionService.js';

/**
 * Resolve a DB user from a bearer token. Returns null when invalid.
 */
export async function resolveUserFromToken(pool, token) {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    const userResult = await pool.query(
      'SELECT id, username, role, kid_profile_id FROM users WHERE id = $1 LIMIT 1',
      [decoded.id]
    );
    const user = userResult.rows[0] || null;
    if (!user) return null;

    if (user.role === 'kid') {
      if (!user.kid_profile_id) return null;
      const profileResult = await pool.query(
        'SELECT id FROM kids_profiles WHERE id = $1 LIMIT 1',
        [user.kid_profile_id]
      );
      if (!profileResult.rows[0]) return null;
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Build premium access context for any authenticated role.
 */
export async function resolvePremiumContextForUser(pool, user) {
  if (!user) {
    return { hasActiveSubscription: false, unlockedBookIds: [], isAdmin: false, policy: null };
  }

  if (user.role === 'admin') {
    return {
      hasActiveSubscription: true,
      unlockedBookIds: [],
      isAdmin: true,
      policy: null,
    };
  }

  if (user.role === 'kid' && user.kid_profile_id) {
    const policy = await loadChildAccessPolicy({ user, pool });
    return {
      hasActiveSubscription: policy.hasActiveSubscription,
      unlockedBookIds: policy.premiumUnlockedBookIds || [],
      isAdmin: false,
      policy,
    };
  }

  if (user.role === 'parent') {
    const { subscription } = await getCurrentSubscription(user);
    const unlockedBookIds = (subscription?.unlocked_books || []).map((row) => row.book_id);
    return {
      ...buildPremiumContext({ subscription, unlockedBookIds }),
      isAdmin: false,
      policy: null,
    };
  }

  return { hasActiveSubscription: false, unlockedBookIds: [], isAdmin: false, policy: null };
}

export function isBookPremiumLocked(book, premiumContext = {}) {
  if (!isPremiumContent(book)) return false;
  if (premiumContext.isAdmin) return false;
  return !canAccessPremiumBook(book, premiumContext);
}

/**
 * Strip downloadable assets from locked premium catalog entries.
 */
export function redactLockedBookContent(book, premiumContext = {}) {
  if (!isBookPremiumLocked(book, premiumContext)) return book;

  const redacted = {
    ...book,
    audio_url: null,
    file_path: null,
    premium_locked: true,
  };

  if (Array.isArray(book.pages)) {
    redacted.pages = [];
    redacted.page_count = book.page_count ?? book.pages.length;
  }

  return redacted;
}

export function userCanAccessBook(user, book, { premiumContext, policy } = {}) {
  if (!book) return false;
  if (user?.role === 'admin' || premiumContext?.isAdmin) return true;
  if (isBookPremiumLocked(book, premiumContext)) return false;

  if (user?.role === 'kid' && policy) {
    return !getContentAccessViolation(policy, book);
  }

  return true;
}
