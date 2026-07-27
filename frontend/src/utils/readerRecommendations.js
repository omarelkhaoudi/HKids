import { deriveBookTheme } from './bookCover';
import { buildSignals, rankRelatedBooks, scoreRelatedBook as scoreRelatedBookCore } from '../services/recommendations/scoringModel';
import { getRecommendationContext } from '../services/recommendations/recommendationEngine';

/**
 * Client-side story recommendations for the reader completion screen.
 * Delegates to the unified recommendation scoring model.
 */

export function scoreRelatedBook(source, candidate) {
  const context = getRecommendationContext();
  const signals = buildSignals({ kid: null, contents: [candidate], context });
  return scoreRelatedBookCore(source, candidate, signals);
}

/**
 * Rank candidates by unified recommendation affinity.
 */
export function pickRelatedBooks(source, candidates = [], limit = 3, { excludeIds } = {}) {
  const context = getRecommendationContext();
  const signals = buildSignals({ kid: null, contents: candidates, context });
  return rankRelatedBooks(source, candidates, signals, { limit, excludeIds });
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
