import { describe, expect, it } from 'vitest';
import {
  scoreRelatedBook,
  pickRelatedBooks,
  estimateRemainingReadSeconds,
  formatRemainingReadLabel,
} from '../readerRecommendations';

describe('readerRecommendations', () => {
  const source = {
    id: 1,
    title: 'Forêt magique',
    category_id: 10,
    theme: 'nature',
    age_group_min: 3,
    age_group_max: 6,
  };

  it('scores same category and overlapping age higher', () => {
    const twin = {
      id: 2,
      title: 'Arbres',
      category_id: 10,
      theme: 'nature',
      age_group_min: 4,
      age_group_max: 7,
    };
    const distant = {
      id: 3,
      title: 'Espace',
      category_id: 99,
      theme: 'space',
      age_group_min: 9,
      age_group_max: 12,
    };
    expect(scoreRelatedBook(source, twin)).toBeGreaterThan(scoreRelatedBook(source, distant));
  });

  it('excludes the source book and ranks by affinity', () => {
    const candidates = [
      { id: 1, title: 'Self', category_id: 10, theme: 'nature', age_group_min: 3, age_group_max: 6 },
      { id: 4, title: 'Zed', category_id: 99, theme: 'space', age_group_min: 8, age_group_max: 12 },
      { id: 5, title: 'Ami', category_id: 10, theme: 'nature', age_group_min: 3, age_group_max: 5 },
      { id: 6, title: 'Cousin', category_id: 10, theme: 'animals', age_group_min: 4, age_group_max: 6 },
    ];
    const picked = pickRelatedBooks(source, candidates, 2);
    expect(picked.map((book) => book.id)).toEqual([5, 6]);
  });

  it('falls back to candidates when affinity is zero', () => {
    const candidates = [
      { id: 7, title: 'A', category_id: 50 },
      { id: 8, title: 'B', category_id: 51 },
    ];
    const picked = pickRelatedBooks({ id: 1, title: 'X' }, candidates, 2);
    expect(picked).toHaveLength(2);
  });

  it('estimates remaining reading time from audio when available', () => {
    expect(estimateRemainingReadSeconds({ audioRemaining: 95.4 })).toBe(95);
  });

  it('estimates remaining reading time from pages and rate', () => {
    const slow = estimateRemainingReadSeconds({
      totalPages: 10,
      currentPage: 0,
      speechRate: 0.75,
      pageWordCount: 80,
    });
    const fast = estimateRemainingReadSeconds({
      totalPages: 10,
      currentPage: 0,
      speechRate: 1.25,
      pageWordCount: 80,
    });
    expect(slow).toBeGreaterThan(fast);
  });

  it('formats remaining labels', () => {
    expect(formatRemainingReadLabel(45)).toBe('~45s');
    expect(formatRemainingReadLabel(120)).toBe('~2 min');
    expect(formatRemainingReadLabel(90)).toBe('~1:30');
  });
});
