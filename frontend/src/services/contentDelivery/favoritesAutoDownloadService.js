/**
 * Optional auto-download of favorites when preference is enabled.
 */

import { booksAPI } from '../../api/books';
import { storage } from '../../utils/storage';
import { getOfflinePrefs } from './offlinePrefs';
import { DOWNLOAD_PRIORITY, enqueueBookDownload } from './smartDownloadService';
import { recordOfflineEvent } from './offlineAnalyticsService';

async function resolveBook(bookId) {
  try {
    const response = await booksAPI.getBook(bookId);
    return response.data?.book || response.data;
  } catch {
    return null;
  }
}

export async function enqueueFavoriteDownload(bookId, { force = false } = {}) {
  const prefs = getOfflinePrefs();
  if (!prefs.autoDownloadFavorites && !force) {
    return { accepted: false, reason: 'pref_off' };
  }
  if (!navigator.onLine) {
    return { accepted: false, reason: 'offline' };
  }

  const book = await resolveBook(bookId);
  if (!book) return { accepted: false, reason: 'not_found' };

  const result = await enqueueBookDownload(book, {
    priority: DOWNLOAD_PRIORITY.FAVORITE,
    label: book.title,
    reason: 'favorite',
  });

  if (result.accepted) {
    await recordOfflineEvent('favorites_auto_queued', { count: 1, bookId });
  }
  return result;
}

/** Sync all current favorites that are not yet downloaded. */
export async function syncFavoriteDownloads({ limit = 12 } = {}) {
  const prefs = getOfflinePrefs();
  if (!prefs.autoDownloadFavorites) {
    return { queued: 0, skipped: 0 };
  }
  if (!navigator.onLine) {
    return { queued: 0, skipped: 0, reason: 'offline' };
  }

  const favorites = storage.getFavorites().slice(0, limit);
  let queued = 0;
  let skipped = 0;

  for (const bookId of favorites) {
    const result = await enqueueFavoriteDownload(bookId);
    if (result.accepted) queued += 1;
    else skipped += 1;
  }

  return { queued, skipped };
}

export function bindFavoriteAutoDownload() {
  if (typeof window === 'undefined') return () => {};
  const handler = (event) => {
    const { bookId, favorite } = event.detail || {};
    if (!favorite || bookId == null) return;
    enqueueFavoriteDownload(bookId).catch(() => {});
  };
  window.addEventListener('hkids:favorite-changed', handler);
  return () => window.removeEventListener('hkids:favorite-changed', handler);
}
