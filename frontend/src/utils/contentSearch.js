const ARABIC_DIACRITICS = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g;

export function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(ARABIC_DIACRITICS, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function flattenSearchValues(value) {
  if (Array.isArray(value)) return value.flatMap(flattenSearchValues);
  if (value && typeof value === 'object') return Object.values(value).flatMap(flattenSearchValues);
  return value == null ? [] : [value];
}

export function getContentSearchText(content = {}) {
  return normalizeSearchText(flattenSearchValues([
    content.title,
    content.description,
    content.author,
    content.category_name,
    content.subcategory_name,
    content.library_category_label,
    content.theme,
    content.catalog_area,
    content.tags,
    content.search_terms,
    content.subjects,
    content.skills,
    content.character,
    content.series,
    content.metadata?.search_terms,
    content.metadata?.subjects,
    content.metadata?.skills,
    content.metadata?.character,
    content.metadata?.series,
  ]).join(' '));
}

export function contentMatchesSearch(content, query) {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = getContentSearchText(content);
  return terms.every((term) => haystack.includes(term));
}
