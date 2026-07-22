import { deriveBookTheme } from './bookCover';

/**
 * Client-side story recommendations for the reader completion screen.
 * Uses existing book metadata only — no API contract changes.
 */

function ageOverlapScore(source = {}, candidate = {}) {
  const sMin = Number(source.age_group_min);
  const sMax = Number(source.age_group_max);
  const cMin = Number(candidate.age_group_min);
  const cMax = Number(candidate.age_group_max);

  const sourceHasAge = Number.isFinite(sMin) || Number.isFinite(sMax);
  const candidateHasAge = Number.isFinite(cMin) || Number.isFinite(cMax);
  if (!sourceHasAge || !candidateHasAge) return 0;

  const a0 = Number.isFinite(sMin) ? sMin : sMax;
  const a1 = Number.isFinite(sMax) ? sMax : sMin;
  const b0 = Number.isFinite(cMin) ? cMin : cMax;
  const b1 = Number.isFinite(cMax) ? cMax : cMin;
  if (a1 < b0 || b1 < a0) return 0;

  const overlap = Math.min(a1, b1) - Math.max(a0, b0) + 1;
  if (overlap >= 3) return 3;
  if (overlap >= 1) return 2;
  return 1;
}

export function scoreRelatedBook(source, candidate) {
  if (!source || !candidate || source.id == null || candidate.id == null) return -1;
  if (String(source.id) === String(candidate.id)) return -1;

  let score = 0;

  if (
    source.category_id != null
    && candidate.category_id != null
    && String(source.category_id) === String(candidate.category_id)
  ) {
    score += 5;
  }

  const sourceTheme = deriveBookTheme(source);
  const candidateTheme = deriveBookTheme(candidate);
  if (sourceTheme && candidateTheme && sourceTheme === candidateTheme) {
    score += 4;
  }

  if (
    source.theme
    && candidate.theme
    && String(source.theme).toLowerCase() === String(candidate.theme).toLowerCase()
  ) {
    score += 3;
  }

  score += ageOverlapScore(source, candidate);
  return score;
}

/**
 * Rank candidates by category / theme / age affinity.
 * Falls back to original order when affinity scores are unavailable.
 * Optionally skips finished stories via excludeIds (Set of string ids).
 */
export function pickRelatedBooks(source, candidates = [], limit = 3, { excludeIds } = {}) {
  const safeLimit = Math.max(1, Number(limit) || 3);
  const ranked = (candidates || [])
    .filter((item) => item && item.id != null && String(item.id) !== String(source?.id))
    .filter((item) => !excludeIds?.size || !excludeIds.has(String(item.id)))
    .map((book) => ({ book, score: scoreRelatedBook(source, book) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.book.title || '').localeCompare(String(b.book.title || ''), 'fr');
    });

  const withAffinity = ranked.filter((entry) => entry.score > 0).map((entry) => entry.book);
  if (withAffinity.length >= safeLimit) {
    return withAffinity.slice(0, safeLimit);
  }

  return ranked.map((entry) => entry.book).slice(0, safeLimit);
}

/**
 * Estimate remaining narration time in seconds.
 * Prefers real audio remaining when available; otherwise uses page/word heuristics.
 */
export function estimateRemainingReadSeconds({
  totalPages = 1,
  currentPage = 0,
  speechRate = 1,
  pageWordCount = 70,
  audioRemaining = null,
} = {}) {
  if (audioRemaining != null && Number.isFinite(audioRemaining)) {
    return Math.max(0, Math.round(audioRemaining));
  }

  const pagesLeft = Math.max(0, (Number(totalPages) || 1) - (Number(currentPage) || 0));
  const rate = Math.min(1.4, Math.max(0.65, Number(speechRate) || 1));
  const wordsPerMinute = 130 * rate;
  const words = Math.max(20, Number(pageWordCount) || 70);
  const secondsPerPage = (words / wordsPerMinute) * 60;
  return Math.max(0, Math.round(pagesLeft * secondsPerPage));
}

export function formatRemainingReadLabel(seconds = 0) {
  const safe = Math.max(0, Math.round(Number(seconds) || 0));
  if (safe < 60) return `~${safe}s`;
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  if (rest === 0) return `~${minutes} min`;
  return `~${minutes}:${String(rest).padStart(2, '0')}`;
}

export default pickRelatedBooks;
