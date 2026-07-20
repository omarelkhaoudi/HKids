/**
 * Read-along helpers — sentence sync for TTS and recorded narration.
 */

export function splitTextIntoSentences(text = '') {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const matches = normalized.match(/[^.!?]+[.!?]*\s*/g) || [normalized];
  let cursor = 0;
  return matches.map((segment) => {
    const trimmed = segment.trim();
    const start = normalized.indexOf(trimmed, cursor);
    const safeStart = start >= 0 ? start : cursor;
    cursor = safeStart + trimmed.length;
    return {
      text: trimmed,
      start: safeStart,
      end: safeStart + trimmed.length,
    };
  }).filter((segment) => segment.text);
}

/**
 * Map a spoken character index to the active sentence.
 */
export function sentenceIndexAtChar(sentences = [], charIndex = 0) {
  if (!sentences.length) return -1;
  const index = Number(charIndex) || 0;
  const found = sentences.findIndex(
    (sentence) => index >= sentence.start && index < sentence.end,
  );
  if (found >= 0) return found;
  if (index >= sentences[sentences.length - 1].end) return sentences.length - 1;
  return 0;
}

/**
 * Approximate sentence index from playback progress (0–1) for recorded audio.
 */
export function sentenceIndexAtProgress(sentences = [], progress = 0) {
  if (!sentences.length) return -1;
  const ratio = Math.min(1, Math.max(0, Number(progress) || 0));
  if (ratio <= 0) return 0;
  if (ratio >= 1) return sentences.length - 1;

  const totalChars = Math.max(
    1,
    sentences[sentences.length - 1].end - sentences[0].start,
  );
  const target = sentences[0].start + ratio * totalChars;
  return sentenceIndexAtChar(sentences, target);
}

export function countWords(text = '') {
  const normalized = String(text || '').trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/).filter(Boolean).length;
}

export default splitTextIntoSentences;
