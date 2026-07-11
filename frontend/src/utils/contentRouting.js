export const AUDIO_CONTENT_TYPES = new Set(['song', 'audio_story']);

export function isAudioContent(book) {
  if (!book) return false;
  if (AUDIO_CONTENT_TYPES.has(book.content_type) && book.audio_url) return true;
  return Boolean(book.audio_url) && !book.pages?.length;
}

export function getKidsContentPath(book) {
  if (!book?.id) return '/kids/library';
  if (isAudioContent(book)) return `/kids/listen/${book.id}`;
  return `/kids/read/${book.id}`;
}

export function filterAudioBooks(books = []) {
  return books.filter((book) => isAudioContent(book) || AUDIO_CONTENT_TYPES.has(book.content_type));
}

export function filterComptines(books = []) {
  return books.filter((book) => book.content_type === 'song');
}
