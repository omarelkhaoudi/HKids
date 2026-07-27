import { estimateRemainingMinutes } from '../../utils/discoveryRails';
import { storage } from '../../utils/storage';

function toProgressPercent(book = {}, progressRow = null, historyEntry = null) {
  if (progressRow) {
    const progress = Number(progressRow.progress_percent || 0);
    if (progress > 0) return Math.min(100, progress);
  }

  if (book.kid_progress_percent != null) {
    return Math.min(100, Number(book.kid_progress_percent || 0));
  }

  if (historyEntry) {
    const lastPage = Number(historyEntry.page ?? storage.getLastPage(book.id) ?? 0);
    const total = Number(book.page_count || 0);
    if (total > 0) {
      return Math.min(100, Math.round((lastPage / total) * 100));
    }
  }

  return 0;
}

function mergeProgressRow(book, progressRow, historyEntry) {
  const progress = toProgressPercent(book, progressRow, historyEntry);
  const currentPage = Number(
    progressRow?.current_page
    ?? historyEntry?.page
    ?? storage.getLastPage(book.id)
    ?? 0
  );
  const completed = Boolean(
    progressRow?.completed
    || progress >= 100
    || historyEntry?.completed
  );

  return {
    ...book,
    id: book.id ?? progressRow?.book_id,
    title: book.title || progressRow?.book_title,
    cover_image: book.cover_image || progressRow?.cover_image,
    slug: book.slug || progressRow?.slug,
    theme: book.theme || progressRow?.theme,
    author: book.author || progressRow?.author,
    kid_progress_percent: progress,
    progress,
    current_page: currentPage,
    kid_current_page: currentPage,
    kid_completed: completed,
    completed,
    last_opened_at: progressRow?.last_read_at
      || progressRow?.updated_at
      || historyEntry?.updatedAt
      || historyEntry?.date
      || null,
    remaining_minutes: estimateRemainingMinutes({ ...book, ...progressRow }, progress),
    finished: completed,
  };
}

function buildProgressIndex(progressRows = []) {
  return new Map(
    progressRows
      .filter((row) => row?.book_id != null)
      .map((row) => [String(row.book_id), row])
  );
}

function buildHistoryIndex(history = []) {
  return new Map(
    history
      .filter((entry) => entry?.bookId != null)
      .map((entry) => [String(entry.bookId), entry])
  );
}

/**
 * Single source of truth for continue-reading items.
 * Server progress wins over local history when both exist.
 */
export function resolveContinueReading({
  books = [],
  progressRows = [],
  apiContinueItems = [],
  readingHistory = storage.getReadingHistory?.() || [],
} = {}) {
  const bookMap = new Map(books.map((book) => [String(book.id), book]));
  const progressIndex = buildProgressIndex(progressRows);
  const historyIndex = buildHistoryIndex(readingHistory);
  const merged = new Map();

  const upsert = (bookId, progressRow = null, historyEntry = null) => {
    const book = bookMap.get(String(bookId));
    if (!book && !progressRow) return;
    const item = mergeProgressRow(book || {}, progressRow, historyEntry);
    const progress = Number(item.progress || 0);
    if (progress <= 0 || progress >= 100 || item.completed) return;
    merged.set(String(bookId), item);
  };

  progressRows.forEach((row) => upsert(row.book_id, row, historyIndex.get(String(row.book_id))));
  readingHistory.forEach((entry) => {
    if (!merged.has(String(entry.bookId))) {
      upsert(entry.bookId, progressIndex.get(String(entry.bookId)), entry);
    }
  });
  apiContinueItems.forEach((item) => {
    if (!merged.has(String(item.id))) {
      upsert(item.id, item, historyIndex.get(String(item.id)));
    }
  });

  return [...merged.values()].sort((a, b) => {
    const aTime = new Date(a.last_opened_at || 0).getTime();
    const bTime = new Date(b.last_opened_at || 0).getTime();
    if (bTime !== aTime) return bTime - aTime;
    return Number(b.recommendation_score || 0) - Number(a.recommendation_score || 0);
  });
}

export function getPrimaryContinueItem(items = []) {
  return items[0] || null;
}
