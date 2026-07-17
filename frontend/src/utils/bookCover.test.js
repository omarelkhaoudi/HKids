import { describe, expect, it } from 'vitest';
import {
  buildBookCoverSources,
  deriveBookSlug,
  deriveBookTheme,
  isIllustratedCoverPath,
  isSeedCatalogCover,
  LOCAL_BOOK_COVERS_BASE,
  resolveBookCoverUrl,
} from './bookCover';

describe('bookCover utils', () => {
  it('rejects seed SVG and uploads placeholders', () => {
    expect(isSeedCatalogCover('/uploads/books/demo-cover.svg')).toBe(true);
    expect(isIllustratedCoverPath('/uploads/books/demo-cover.svg')).toBe(false);
    expect(isIllustratedCoverPath('/uploads/books/story.png')).toBe(false);
    expect(isIllustratedCoverPath('https://cdn.example.com/x.svg?v=1')).toBe(false);
  });

  it('accepts real external illustrated images', () => {
    expect(isIllustratedCoverPath('https://cdn.example.com/art.jpg')).toBe(true);
    expect(isIllustratedCoverPath('https://cdn.example.com/art.webp')).toBe(true);
  });

  it('derives slug from cover filename when slug missing', () => {
    expect(deriveBookSlug({ cover_image: '/uploads/books/demo-dino-courage-cover.svg' })).toBe('demo-dino-courage');
  });

  it('maps spiritual and nature themes to illustrated packs', () => {
    expect(deriveBookTheme({ theme: 'spiritual' })).toBe('bedtime');
    expect(deriveBookTheme({ title: 'Les anges veillent', category_name: 'Spiritualité' })).toBe('bedtime');
    expect(deriveBookTheme({ title: 'Le petit poisson' })).toBe('ocean');
    expect(deriveBookTheme({ theme: 'nature' })).toBe('world');
    expect(deriveBookTheme({ title: 'Tap tap les mains' })).toBe('rhymes');
    expect(deriveBookTheme({ title: 'La vache meuh' })).toBe('animals');
  });

  it('never uses seed uploads; prefers slug local art then default', () => {
    const sources = buildBookCoverSources({
      slug: 'spiritual-10',
      title: 'Les anges veillent',
      cover_image: '/uploads/books/spiritual-10-cover.svg',
      theme: 'spiritual',
    });
    expect(sources[0]).toBe(`${LOCAL_BOOK_COVERS_BASE}/spiritual-10.webp`);
    expect(sources).toContain(`${LOCAL_BOOK_COVERS_BASE}/default.webp`);
    expect(sources.every((src) => !src.includes('/uploads/'))).toBe(true);
    expect(sources.every((src) => !src.includes('.svg'))).toBe(true);
  });

  it('prefers real illustrated API cover before local slug', () => {
    const sources = buildBookCoverSources({
      slug: 'demo-dino-courage',
      cover_image: 'https://cdn.example.com/covers/dino.webp',
    });
    expect(sources[0]).toBe('https://cdn.example.com/covers/dino.webp');
    expect(sources).toContain(`${LOCAL_BOOK_COVERS_BASE}/demo-dino-courage.webp`);
  });

  it('resolveBookCoverUrl never returns uploads seed path', () => {
    const url = resolveBookCoverUrl({
      title: 'Le petit poisson',
      cover_image: '/uploads/books/comptine-08-cover.svg',
    });
    expect(url.startsWith(`${LOCAL_BOOK_COVERS_BASE}/`)).toBe(true);
    expect(url).not.toContain('/uploads/');
  });
});
