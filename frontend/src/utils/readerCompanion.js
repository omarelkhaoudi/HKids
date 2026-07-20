/**
 * Calm reading companion — milestone detection and emotional progress phases.
 * Frontend-only; no API or persistence.
 */

export function getReadingPhaseKey(currentPage, totalPages) {
  const total = Math.max(1, Number(totalPages) || 1);
  const page = Math.max(0, Number(currentPage) || 0);

  if (total <= 1 || page >= total - 1) return 'end';
  if (page === 0) return 'beginning';
  if (page >= total - 2) return 'almost';
  if (page >= Math.floor(total / 2)) return 'halfway';
  if (page >= 2) return 'exploring';
  return 'beginning';
}

/**
 * Returns the first unseen milestone message key for this page turn.
 * @param {number} currentPage 0-based
 * @param {number} totalPages
 * @param {Set<string>} shownIds
 */
export function detectReadingMilestone(currentPage, totalPages, shownIds = new Set()) {
  const total = Math.max(1, Number(totalPages) || 1);
  const page = Math.max(0, Number(currentPage) || 0);

  const candidates = [];

  if (page === 2 && total > 3 && !shownIds.has('page3')) {
    candidates.push({ id: 'page3', messageKey: 'companionPage3' });
  }

  const halfIndex = Math.floor(total / 2);
  if (page === halfIndex && halfIndex >= 2 && page < total - 1 && !shownIds.has('halfway')) {
    candidates.push({ id: 'halfway', messageKey: 'companionHalfway' });
  }

  if (page === total - 2 && total > 3 && !shownIds.has('almostEnd')) {
    candidates.push({ id: 'almostEnd', messageKey: 'companionAlmostEnd' });
  }

  if (page === total - 1 && !shownIds.has('lastPage')) {
    candidates.push({ id: 'lastPage', messageKey: 'companionLastPage' });
  }

  return candidates[0] || null;
}

export function getReadingPhaseLabelKey(phaseKey) {
  const map = {
    beginning: 'readerPhaseBeginning',
    exploring: 'readerPhaseExploring',
    halfway: 'readerPhaseHalfway',
    almost: 'readerPhaseAlmost',
    end: 'readerPhaseEnd',
  };
  return map[phaseKey] || map.beginning;
}
