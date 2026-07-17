import { describe, expect, it } from 'vitest';
import {
  buildBookCoverSources,
  deriveBookSlug,
  deriveBookTheme,
  isIllustratedCoverPath,
  LOCAL_BOOK_COVERS_BASE,
  resolveBookCoverUrl,
} from './bookCover';

describe('bookCover utils', () => {
  it('rejects seed SVG covers as non-illustrated', () => {
    expect(isIllustratedCoverPath('/uploads/books/demo-cover.svg')).toBe(false);
    expect(isIllustratedCoverPath('https://cdn.example.com/x.svg?v=1')).toBe(false);
  });

  it('accepts illustrated image paths', () => {
    expect(isIllustratedCoverPath('/uploads/books/story.png')).toBe(true);
    expect(isIllustratedCoverPath('/uploads/books/story.webp')).toBe(true);
    expect(isIllustratedCoverPath('https://cdn.example.com/art.jpg')).toBe(true);
  });

  it('derives slug from cover filename when slug missing', () => {
    expect(deriveBookSlug({ cover_image: '/uploads/books/demo-dino-courage-cover.svg' })).toBe('demo-dino-courage');
  });

  it('derives theme from title keywords', () => {
    expect(deriveBookTheme({ title: 'Bonne nuit petit ours' })).toBe('bedtime');
    expect(deriveBookTheme({ theme: 'space' })).toBe('space');
  });

  it('buildBookCoverSources prefers local slug over default', () => {
    const sources = buildBookCoverSources({
      slug: 'demo-dino-courage',
      cover_image: '/uploads/books/demo-dino-courage-cover.svg',
      theme: 'dinosaurs',
    });
    expect(sources[0]).toBe(`${LOCAL_BOOK_COVERS_BASE}/demo-dino-courage.webp`);
    expect(sources).toContain(`${LOCAL_BOOK_COVERS_BASE}/demo-dino-courage.png`);
    expect(sources).toContain(`${LOCAL_BOOK_COVERS_BASE}/themes/dinosaurs.png`);
    expect(sources).toContain(`${LOCAL_BOOK_COVERS_BASE}/default.png`);
  });

  it('maps spiritual and nature themes to illustrated packs', () => {
    expect(deriveBookTheme({ theme: 'spiritual' })).toBe('bedtime');
    expect(deriveBookTheme({ title: 'Les anges veillent', category_name: 'Spiritualité' })).toBe('bedtime');
    expect(deriveBookTheme({ title: 'Le petit poisson' })).toBe('ocean');
    expect(deriveBookTheme({ theme: 'nature' })).toBe('world');
  });
});
