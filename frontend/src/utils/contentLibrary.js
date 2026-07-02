import { CONTENT_LANGUAGES } from '../constants/contentOptions';
import { getCategoryForContent } from '../constants/contentLibrary';
import { getImageUrl } from './imageUrl';
import { storage } from './storage';

export function formatContentDuration(seconds = 0) {
  const safeSeconds = Math.max(0, Number(seconds || 0));
  if (!safeSeconds) return '0 min';
  const minutes = Math.max(1, Math.round(safeSeconds / 60));
  return `${minutes} min`;
}

export function formatAgeRange(content) {
  const min = Number(content.age_group_min ?? 0);
  const max = Number(content.age_group_max ?? 12);
  return `${min}-${max} ans`;
}

export function getContentLanguageLabel(languageId = 'fr') {
  const language = CONTENT_LANGUAGES.find((item) => item.id === languageId);
  return language?.shortLabel || String(languageId || 'fr').toUpperCase();
}

export function normalizeContentItem(book) {
  const category = getCategoryForContent(book);

  return {
    ...book,
    library_category_id: category.id,
    library_category_label: category.label,
    cover_url: getImageUrl(book.cover_image),
    short_description: book.description || 'Contenu a decouvrir.',
    duration_label: formatContentDuration(book.duration_seconds),
    language_label: getContentLanguageLabel(book.language),
    age_range_label: formatAgeRange(book),
    is_favorite: storage.isFavorite(book.id),
    is_downloaded: storage.isDownloaded(book.id),
    is_premium: Boolean(book.is_premium),
  };
}

export function contentMatchesCategory(content, category) {
  if (!category) return true;
  return category.contentTypes.includes(content.content_type || 'story');
}

export function filterContentItems(contents, filters, category = null) {
  const query = filters.search.trim().toLowerCase();

  return contents.filter((content) => {
    const matchesCategory = contentMatchesCategory(content, category);
    const matchesLanguage = !filters.language || (content.language || 'fr') === filters.language;
    const matchesAge = !filters.age || (
      Number(content.age_group_min ?? 0) <= Number(filters.age)
      && Number(content.age_group_max ?? 12) >= Number(filters.age)
    );
    const matchesSearch = !query || [
      content.title,
      content.description,
      content.author,
      content.category_name,
      content.library_category_label,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));

    return matchesCategory && matchesLanguage && matchesAge && matchesSearch;
  });
}
