import { useEffect, useMemo, useState } from 'react';
import { buildBookCoverSources } from '../../utils/bookCover';

/**
 * Full-bleed illustrated book cover.
 * Always prefers `/books/covers/*` art — never seed SVG/uploads placeholders.
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
    book?.category_name,
  ]);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [sources.join('|')]);

  const src = sources[Math.min(sourceIndex, Math.max(sources.length - 1, 0))]
    || '/books/covers/default.webp';

  return (
    <img
      key={src}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      className={`kids-book-cover-img ${imgClassName} ${className}`.trim()}
      onError={(event) => {
        // SPA rewrite can return index.html (200) for missing files — treat as failure
        const current = event.currentTarget?.currentSrc || src;
        if (current && !current.includes('/books/covers/')) {
          // unexpected remote failure — advance
        }
        setSourceIndex((index) => {
          if (index >= sources.length - 1) return index;
          return index + 1;
        });
      }}
    />
  );
}

export default KidsBookCover;
