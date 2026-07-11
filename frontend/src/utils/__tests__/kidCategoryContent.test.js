import { describe, it, expect } from 'vitest';
import { getCategoryContentStrategy, bookMatchesKidCategory } from '../kidCategoryContent';

describe('kidCategoryContent', () => {
  it('maps rhymes to audio strategy', () => {
    const strategy = getCategoryContentStrategy('rhymes');
    expect(strategy.type).toBe('audio');
    expect(strategy.contentType).toBe('song');
  });

  it('maps alphabet to learning strategy', () => {
    const strategy = getCategoryContentStrategy('alphabet');
    expect(strategy.type).toBe('learning');
    expect(strategy.categoryCode).toBe('alphabet');
  });

  it('matches books by theme keywords', () => {
    const strategy = getCategoryContentStrategy('dinosaurs');
    const book = { title: 'Le grand dinosaure', theme: 'dinosaurs' };
    expect(bookMatchesKidCategory(book, strategy)).toBe(true);
  });
});
