/**
 * Client-side discovery helpers — presentation only.
 * No API calls; filters already-loaded books.
 */

import {
  bookOverlapsAgeRange,
  getBookAgeRange,
} from '../constants/ageGroups';

const SEASONAL_KEYWORDS = {
  winter: ['winter', 'hiver', 'snow', 'neige', 'noel', 'christmas', 'froid', 'ice'],
  spring: ['spring', 'printemps', 'flower', 'fleur', 'easter', 'paques', 'jardin'],
  summer: ['summer', 'ete', 'été', 'beach', 'plage', 'soleil', 'sun', 'vacation'],
  autumn: ['autumn', 'fall', 'automne', 'leaf', 'feuille', 'pumpkin', 'citrouille'],
};

export function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month === 11 || month <= 1) return 'winter';
  if (month <= 4) return 'spring';
  if (month <= 7) return 'summer';
  return 'autumn';
}

function bookSearchText(book) {
  return [book.title, book.description, book.theme, book.category_name, book.author]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function filterSeasonalBooks(books = [], season = getCurrentSeason()) {
  const keywords = SEASONAL_KEYWORDS[season] || SEASONAL_KEYWORDS.spring;
  return books
    .filter((book) => keywords.some((kw) => bookSearchText(book).includes(kw)))
    .slice(0, 12);
}

export function withDiscoveryReason(book, reason) {
  if (!book) return book;
  return { ...book, _discoveryReason: reason };
}

export function annotateBooksWithReasons(books, reason) {
  return books.map((book) => withDiscoveryReason(book, reason));
}

/** Overlap-based age filter (official HKids age model). */
export function filterByAgeBand(books = [], minAge, maxAge) {
  return books
    .filter((book) => bookOverlapsAgeRange(book, minAge, maxAge))
    .slice(0, 12);
}

export function inferLikedThemeId(favoriteBooks = [], categories = []) {
  if (!favoriteBooks.length || !categories.length) return null;
  const scores = new Map();
  favoriteBooks.forEach((book) => {
    const text = bookSearchText(book);
    categories.forEach((category) => {
      const hits = (category.match || []).filter((kw) => text.includes(kw)).length;
      if (hits > 0) scores.set(category.id, (scores.get(category.id) || 0) + hits);
    });
  });
  let bestId = null;
  let bestScore = 0;
  scores.forEach((score, id) => {
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  });
  return bestId;
}

export function isShortStory(book) {
  const pages = Number(book.page_count || 0);
  const minutes = Number(book.duration_minutes || 0);
  const seconds = Number(book.duration_seconds || 0);
  if (pages > 0 && pages <= 12) return true;
  if (minutes > 0 && minutes <= 5) return true;
  if (seconds > 0 && seconds <= 300) return true;
  return false;
}

export { getBookAgeRange };

export function isAudioBook(book) {
  return Boolean(book?.audio_url)
    || book?.content_type === 'song'
    || book?.content_type === 'audio_story';
}

export function isPremiumBook(book) {
  return book?.is_premium === true || book?.is_premium === 1;
}

export function estimateRemainingMinutes(book, progressPercent = 0) {
  const progress = Math.min(100, Math.max(0, Number(progressPercent) || 0));
  const totalSeconds = Number(book?.duration_seconds || 0);
  const totalMinutes = Number(book?.duration_minutes || 0)
    || (totalSeconds > 0 ? Math.max(1, Math.round(totalSeconds / 60)) : 0)
    || (Number(book?.page_count || 0) > 0 ? Math.max(1, Math.round(Number(book.page_count) * 0.75)) : 0);
  if (!totalMinutes) return null;
  const remaining = Math.ceil(totalMinutes * ((100 - progress) / 100));
  return Math.max(1, remaining);
}

function daySeed(date = new Date()) {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
}

function hashSeed(text = '') {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function pickDailyFeatured(books = [], date = new Date()) {
  if (!books.length) return null;
  const index = hashSeed(daySeed(date)) % books.length;
  return books[index] || null;
}

export function pickEditorsChoice(books = [], limit = 12) {
  const curated = books.filter((book) => (
    book.is_recommended === true
    || book.is_recommended === 1
    || isPremiumBook(book)
  ));
  const pool = curated.length ? curated : books;
  return pool.slice(0, limit);
}

export function pickPopularThisWeek(books = [], limit = 15) {
  const scored = [...books].sort((a, b) => {
    const score = (book) => (
      (book.is_popular === true || book.is_popular === 1 ? 4 : 0)
      + (book.is_recommended === true || book.is_recommended === 1 ? 2 : 0)
      + (book.is_new === true || book.is_new === 1 ? 1 : 0)
      + (isPremiumBook(book) ? 1 : 0)
    );
    return score(b) - score(a);
  });
  return scored.slice(0, limit);
}

export function pickRandomExplore(books = [], limit = 10, seedText = daySeed()) {
  if (!books.length) return [];
  const seeded = [...books]
    .map((book, index) => ({
      book,
      rank: hashSeed(`${seedText}:${book.id || index}`),
    }))
    .sort((a, b) => a.rank - b.rank);
  return seeded.slice(0, limit).map((entry) => entry.book);
}

export function filterAudioBooks(books = [], limit = 15) {
  return books.filter(isAudioBook).slice(0, limit);
}

export function filterPremiumBooks(books = [], limit = 15) {
  return books.filter(isPremiumBook).slice(0, limit);
}
