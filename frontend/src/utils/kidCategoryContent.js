import { getKidCategory } from '../constants/kidCategories';

const LEARNING_CATEGORY_IDS = new Set(['alphabet', 'numbers', 'colors']);

export function getCategoryContentStrategy(categoryId) {
  const category = getKidCategory(categoryId);
  if (!category) return { type: 'unknown' };

  if (categoryId === 'rhymes') {
    return { type: 'audio', contentType: 'song', category };
  }

  if (LEARNING_CATEGORY_IDS.has(categoryId)) {
    return { type: 'learning', categoryCode: categoryId, category };
  }

  return { type: 'books', themeId: categoryId, match: category.match, category };
}

export function bookMatchesKidCategory(book, strategy) {
  if (!book || strategy.type !== 'books') return false;
  const searchable = [
    book.title,
    book.description,
    book.category_name,
    book.author,
    book.theme,
    book.catalog_area,
    ...(Array.isArray(book.tags) ? book.tags : []),
    ...(Array.isArray(book.search_terms) ? book.search_terms : []),
    ...(Array.isArray(book.metadata?.search_terms) ? book.metadata.search_terms : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (book.theme === strategy.themeId) return true;
  if (book.metadata?.catalog_area === strategy.themeId) return true;
  return (strategy.match || []).some((keyword) => searchable.includes(String(keyword).toLowerCase()));
}
