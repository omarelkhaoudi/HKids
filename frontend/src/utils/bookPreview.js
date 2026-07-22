/**
 * Soft emotional preview signals for book details.
 * Client-side only — answers “what / how long / read or listen / bedtime?”
 * without visual noise.
 */

import { getCategoryContentStrategy, bookMatchesKidCategory } from './kidCategoryContent';
import { isAudioContent } from './contentRouting';
import { collectCompletedBookIds } from './kidsPersonalization';

function isBedtimeBook(book) {
  if (!book) return false;
  const strategy = getCategoryContentStrategy('bedtime');
  if (bookMatchesKidCategory(book, strategy)) return true;
  const theme = String(book.theme || book.category_name || '').toLowerCase();
  return /bedtime|nuit|dodo|sleep|soir|calm|douce/.test(theme);
}

/**
 * @returns {{ invitation: string, modalityHint: string|null, isBedtime: boolean, canListen: boolean, canRead: boolean }}
 */
export function buildBookPreviewSignals(book, t, { hasProgress = false } = {}) {
  const canListen = Boolean(book?.audio_url) || isAudioContent(book);
  const canRead = Boolean(book?.pages?.length) || book?.page_count > 0 || !canListen;
  const bedtime = isBedtimeBook(book);

  let invitation = t('bookDetailsInvitationAdventure');
  if (hasProgress) {
    invitation = t('bookDetailsInvitationContinue');
  } else if (bedtime) {
    invitation = t('bookDetailsInvitationBedtime');
  } else if (canListen && canRead) {
    invitation = t('bookDetailsInvitationListen');
  }

  let modalityHint = null;
  if (bedtime) {
    modalityHint = t('discoverReasonBedtime');
  } else if (canListen && canRead) {
    modalityHint = t('bookDetailsModalityBoth');
  } else if (canListen) {
    modalityHint = t('listenAction');
  } else {
    modalityHint = t('readAction');
  }

  return {
    invitation,
    modalityHint,
    isBedtime: bedtime,
    canListen,
    canRead,
  };
}

export function buildFinishedStories({
  publishedBooks = [],
  progressRows = [],
  t,
  limit = 8,
} = {}) {
  const completedIds = collectCompletedBookIds(progressRows);

  if (!completedIds.size) return [];

  return publishedBooks
    .filter((book) => completedIds.has(String(book.id)))
    .slice(0, limit)
    .map((book) => ({
      ...book,
      _discoveryReason: t('kidsHomeFinishedMemory'),
    }));
}

export default buildBookPreviewSignals;
