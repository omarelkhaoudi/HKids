/**
 * Low-priority predictive downloads based on recent reading / listening activity.
 */

import { booksAPI } from '../../api/books';
import { storage } from '../../utils/storage';
import { getDownload, offlineContentIds } from '../offline/offlineContentService';
import { getOfflinePrefs, shouldDeferForNetwork } from './offlinePrefs';
import { DOWNLOAD_PRIORITY, enqueueBookDownload } from './smartDownloadService';
import { recordOfflineEvent } from './offlineAnalyticsService';
import { getStorageStats } from './storageStatsService';

function collectCandidateIds() {
  const ids = [];
  const seen = new Set();
  const push = (id) => {
    const key = Number(id) || id;
    if (key == null || key === '' || seen.has(key)) return;
    seen.add(key);
    ids.push(key);
  };

  for (const id of storage.getPinnedFavorites() || []) push(id);
  for (const entry of storage.getReadingHistory() || []) push(entry.bookId || entry.id);
  for (const entry of storage.getListeningHistory() || []) push(entry.bookId);
  for (const id of storage.getReadingStats()?.completedBookIds || []) push(id);

  // Exclude already-favorited if auto-favorites handles them (still fine to include —
  // enqueueBookDownload de-dupes).
  return ids;
}

async function hasHeadroom() {
  try {
    const stats = await getStorageStats();
    if (!stats.quotaBytes) return true;
    const usageRatio = stats.usageBytes / stats.quotaBytes;
    return usageRatio < 0.85 && stats.availableBytes > 8 * 1024 * 1024;
  } catch {
    return true;
  }
}

export async function runPredictiveDownloads({ limit = 3 } = {}) {
  const prefs = getOfflinePrefs();
  if (!prefs.predictiveDownloads) {
    return { queued: 0, reason: 'pref_off' };
  }
  if (!navigator.onLine) {
    return { queued: 0, reason: 'offline' };
  }
  if (shouldDeferForNetwork(prefs)) {
    return { queued: 0, reason: 'wifi_only' };
  }
  if (!(await hasHeadroom())) {
    return { queued: 0, reason: 'low_storage' };
  }

  const candidates = collectCandidateIds();
  let queued = 0;

  for (const bookId of candidates) {
    if (queued >= limit) break;
    const downloadId = offlineContentIds.book(bookId);
    const existing = await getDownload(downloadId);
    if (existing?.status === 'downloaded' || existing?.status === 'downloading') continue;

    try {
      const response = await booksAPI.getBook(bookId);
      const book = response.data?.book || response.data;
      if (!book?.id) continue;
      const result = await enqueueBookDownload(book, {
        priority: DOWNLOAD_PRIORITY.PREDICTIVE,
        label: book.title,
        reason: 'predictive',
      });
      if (result.accepted) queued += 1;
    } catch {
      /* skip unavailable titles */
    }
  }

  if (queued > 0) {
    await recordOfflineEvent('predictive_queued', { count: queued });
  }

  return { queued };
}
