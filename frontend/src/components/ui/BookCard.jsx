import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion, kidsTouchFeedback } from '../../constants/kidsMotion';
import { KidsBookCover } from '../kids/KidsBookCover';

export const BookCard = memo(function BookCard({
  book,
  onClick,
  progress = null,
  isNew = false,
  isRecommended = false,
  className = '',
}) {
  const reducedMotion = useReducedMotion();
  const title = book?.title || '';
  const safeProgress = progress == null ? null : Math.min(100, Math.max(0, Number(progress)));

  return (
    <motion.button
      type="button"
      onClick={onClick}
      {...getHoverMotion(reducedMotion, kidsTouchFeedback)}
      className={[
        'kids-book-collectible group relative text-left',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        className,
      ].join(' ')}
      aria-label={title}
    >
      <div className="kids-book-collectible-cover w-full">
        <KidsBookCover
          book={book}
          imgClassName="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-out"
        />
        <div className="absolute top-2 inset-inline-start-2 z-10 flex flex-col gap-1">
          {isNew ? <span className="kids-book-meta-chip kids-book-meta-chip--accent">Nouveau</span> : null}
          {isRecommended ? <span className="kids-book-meta-chip">Pour toi</span> : null}
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="kids-book-play-hint" aria-hidden="true">
            <svg className="h-5 w-5 ms-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </div>
        {safeProgress != null && safeProgress > 0 && safeProgress < 100 ? (
          <div
            className="kids-book-progress"
            role="progressbar"
            aria-valuenow={Math.round(safeProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="kids-book-progress-fill" style={{ width: `${safeProgress}%` }} />
          </div>
        ) : null}
      </div>

      <div className="kids-book-collectible-meta">
        <h3 className="kids-book-title">
          {title}
        </h3>
        <div className="kids-book-meta-row">
          {book?.age_group ? (
            <span className="kids-book-meta-pill">{book.age_group} ans</span>
          ) : null}
          {book?.duration_minutes ? (
            <span className="kids-book-meta-pill">{book.duration_minutes} min</span>
          ) : null}
        </div>
      </div>
    </motion.button>
  );
});
