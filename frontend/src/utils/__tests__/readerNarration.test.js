import { describe, expect, it } from 'vitest';
import {
  splitTextIntoSentences,
  sentenceIndexAtChar,
  sentenceIndexAtProgress,
  countWords,
} from '../readerNarration';

describe('readerNarration', () => {
  it('splits text into sentences with char ranges', () => {
    const sentences = splitTextIntoSentences('Bonjour. Comment ça va ? Bien.');
    expect(sentences).toHaveLength(3);
    expect(sentences[0].text).toBe('Bonjour.');
    expect(sentences[0].start).toBe(0);
    expect(sentences[1].start).toBeGreaterThan(sentences[0].start);
  });

  it('maps char index to the active sentence', () => {
    const sentences = splitTextIntoSentences('Alpha. Beta. Gamma.');
    expect(sentenceIndexAtChar(sentences, 0)).toBe(0);
    expect(sentenceIndexAtChar(sentences, sentences[1].start)).toBe(1);
    expect(sentenceIndexAtChar(sentences, sentences[2].start + 1)).toBe(2);
  });

  it('maps playback progress to a sentence', () => {
    const sentences = splitTextIntoSentences('Un. Deux. Trois. Quatre.');
    expect(sentenceIndexAtProgress(sentences, 0)).toBe(0);
    expect(sentenceIndexAtProgress(sentences, 0.5)).toBeGreaterThanOrEqual(1);
    expect(sentenceIndexAtProgress(sentences, 1)).toBe(3);
  });

  it('counts words', () => {
    expect(countWords('un deux trois')).toBe(3);
    expect(countWords('')).toBe(0);
  });
});
