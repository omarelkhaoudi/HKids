import { useEffect, useMemo, useState } from 'react';
import { buildBookCoverSources } from '../../utils/bookCover';

/**
 * Full-bleed illustrated book cover.
 * Loads real art from API when available, else `/books/covers/{slug}.*`,
 * else theme / default temps in the same folder.
 */
export function KidsBookCover({
  book,
  className = '',
  imgClassName = '',
  alt = '',
  loading = 'lazy',
}) {
  const sources = useMemo(() => buildBookCoverSources(book), [
    book?.id,
    book?.slug,
    book?.cover_image,
    book?.cover_image_url,
    book?.theme,
    book?._themeId,
    book?.title,
  ]);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [sources]);

  const src = sources[Math.min(sourceIndex, Math.max(sources.length - 1, 0))] || '/books/covers/default.webp';

  return (
    <img
      key={src}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      className={`kids-book-cover-img ${imgClassName} ${className}`.trim()}
      onError={() => {
        setSourceIndex((current) => {
          if (current >= sources.length - 1) return current;
          return current + 1;
        });
      }}
    />
  );
}

export default KidsBookCover;
