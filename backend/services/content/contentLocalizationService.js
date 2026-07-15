const SUPPORTED_LOCALES = ['fr', 'en', 'ar'];

export function normalizeLocale(locale, fallback = 'fr') {
  const normalized = String(locale || fallback).toLowerCase().slice(0, 2);
  return SUPPORTED_LOCALES.includes(normalized) ? normalized : fallback;
}

export async function fetchBookLocalizations(pool, bookIds, locale) {
  if (!bookIds?.length) return new Map();

  const loc = normalizeLocale(locale);
  const result = await pool.query(
    `SELECT content_id, locale, title, description, body
     FROM content_localizations
     WHERE content_type = 'book' AND content_id = ANY($1) AND locale = ANY($2)`,
    [bookIds, [loc, 'fr']]
  );

  const map = new Map();
  for (const row of result.rows) {
    if (!map.has(row.content_id)) map.set(row.content_id, {});
    map.get(row.content_id)[row.locale] = row;
  }
  return map;
}

export function applyBookLocalization(book, locale, localizationMap) {
  const loc = normalizeLocale(locale);
  const entries = localizationMap.get(book.id) || {};
  const preferred = entries[loc] || entries.fr;
  if (!preferred) return { ...book, resolved_locale: book.language };

  return {
    ...book,
    title: preferred.title || book.title,
    description: preferred.description ?? book.description,
    resolved_locale: entries[loc] ? loc : (entries.fr ? 'fr' : book.language),
  };
}

export async function fetchBookAudioTracks(pool, bookIds, locale) {
  if (!bookIds?.length) return new Map();

  const loc = normalizeLocale(locale);
  const result = await pool.query(
    `SELECT DISTINCT ON (book_id) book_id, audio_url, locale, duration_seconds
     FROM book_audio_tracks
     WHERE book_id = ANY($1) AND locale = ANY($2)
     ORDER BY book_id, CASE locale WHEN $3 THEN 0 WHEN 'fr' THEN 1 ELSE 2 END`,
    [bookIds, [loc, 'fr'], loc]
  );

  return new Map(result.rows.map((row) => [row.book_id, row]));
}

export function applyBookAudioTrack(book, audioTrack) {
  if (!audioTrack?.audio_url) return book;
  return {
    ...book,
    audio_url: audioTrack.audio_url,
    duration_seconds: audioTrack.duration_seconds ?? book.duration_seconds,
    audio_locale: audioTrack.locale,
  };
}

export async function applyBooksLocalizations(pool, books, locale) {
  if (!books?.length) return books;

  const ids = books.map((book) => book.id);
  const loc = normalizeLocale(locale);
  const [localizationMap, audioTrackMap] = await Promise.all([
    fetchBookLocalizations(pool, ids, loc),
    fetchBookAudioTracks(pool, ids, loc),
  ]);

  return books.map((book) => {
    let next = applyBookLocalization(book, loc, localizationMap);
    next = applyBookAudioTrack(next, audioTrackMap.get(book.id));
    return next;
  });
}

export async function applySingleBookLocalization(pool, book, locale) {
  const [localized] = await applyBooksLocalizations(pool, [book], locale);
  return localized;
}

export async function applyCategoriesLocalizations(categories, locale, pool) {
  if (!categories?.length) return categories;

  const loc = normalizeLocale(locale);
  const ids = categories.map((c) => c.id);

  const result = await pool.query(
    `SELECT content_id, title, description
     FROM content_localizations
     WHERE content_type = 'category' AND content_id = ANY($1) AND locale = $2`,
    [ids, loc]
  );

  const locMap = new Map(result.rows.map((row) => [row.content_id, row]));

  return categories.map((cat) => {
    const localized = locMap.get(cat.id);
    if (!localized) return cat;
    return {
      ...cat,
      name: localized.title || cat.name,
      description: localized.description ?? cat.description,
    };
  });
}

export async function applyLearningLocalizations(contents, locale, pool) {
  if (!contents?.length) return contents;

  const loc = normalizeLocale(locale);
  const ids = contents.map((c) => c.id);

  const result = await pool.query(
    `SELECT content_id, title, description, metadata
     FROM content_localizations
     WHERE content_type = 'learning_content' AND content_id = ANY($1) AND locale = $2`,
    [ids, loc]
  );

  const locMap = new Map(result.rows.map((row) => [row.content_id, row]));

  return contents.map((content) => {
    const localized = locMap.get(content.id);
    if (!localized) return content;
    return {
      ...content,
      title: localized.title || content.title,
      description: localized.description ?? content.description,
      ...(localized.metadata?.question ? { localizedQuestion: localized.metadata.question } : {}),
    };
  });
}

export function buildLanguageAvailabilityClause(paramIndex) {
  return `(
    b.language = $${paramIndex}
    OR EXISTS (
      SELECT 1 FROM content_localizations cl
      WHERE cl.content_type = 'book'
        AND cl.content_id = b.id
        AND cl.locale = $${paramIndex}
    )
  )`;
}
