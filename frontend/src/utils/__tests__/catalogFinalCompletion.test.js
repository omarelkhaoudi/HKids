import { describe, expect, it } from 'vitest';
import { contentMatchesSearch, normalizeSearchText } from '../contentSearch';
import { filterContentItems } from '../contentLibrary';
import { bookMatchesKidCategory, getCategoryContentStrategy } from '../kidCategoryContent';
import { localizeKidCategories } from '../../constants/kidCategories';

describe('catalog final search and categories', () => {
  const sampleBook = {
    id: 42,
    title: 'Nova et la planète des questions',
    description: 'Une aventure scientifique premium',
    author: 'Le Lit Qui Lit',
    category_name: 'Personnages premium',
    theme: 'characters',
    content_type: 'story',
    tags: ['area:characters', 'subject:science', 'character:nova'],
    metadata: {
      catalog_area: 'characters',
      search_terms: ['nova', 'science', 'héros', 'premium', 'شخصية'],
      subjects: ['science', 'space'],
    },
  };

  it('normalizes accents and Arabic diacritics for search', () => {
    expect(normalizeSearchText('Créativité')).toContain('creativite');
    expect(normalizeSearchText('الْعُلُوم')).toContain('العلوم');
  });

  it('matches localized aliases and metadata search terms', () => {
    expect(contentMatchesSearch(sampleBook, 'nova science')).toBe(true);
    expect(contentMatchesSearch(sampleBook, 'شخصية')).toBe(true);
    expect(contentMatchesSearch(sampleBook, 'dinosaure')).toBe(false);
  });

  it('filters library content through improved search', () => {
    const filtered = filterContentItems([sampleBook], {
      search: 'premium hero',
      language: '',
      age: '',
    });
    expect(filtered).toHaveLength(1);
  });

  it('exposes science geography languages and characters categories', () => {
    const categories = localizeKidCategories('fr').map((item) => item.id);
    expect(categories).toEqual(expect.arrayContaining(['science', 'geography', 'languages', 'characters']));
  });

  it('matches books to category strategies using metadata', () => {
    const strategy = getCategoryContentStrategy('characters');
    expect(strategy.type).toBe('books');
    expect(bookMatchesKidCategory(sampleBook, strategy)).toBe(true);
  });
});
