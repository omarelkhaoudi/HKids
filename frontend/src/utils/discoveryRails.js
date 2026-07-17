/**
 * Client-side discovery helpers — presentation only.
 * No API calls; filters already-loaded books.
 */

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

export function filterByAgeBand(books = [], minAge, maxAge) {
  return books
    .filter((book) => {
      const min = Number(book.age_group_min);
      const max = Number(book.age_group_max);
      if (!Number.isFinite(min) && !Number.isFinite(max)) return false;
      const bookMin = Number.isFinite(min) ? min : max;
      const bookMax = Number.isFinite(max) ? max : min;
      return bookMax >= minAge && bookMin <= maxAge;
    })
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
