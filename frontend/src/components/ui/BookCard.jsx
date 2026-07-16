import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const BookCard = memo(function BookCard({
  book,
  onClick,
  progress = null,
  isNew = false,
  isRecommended = false,
  className = '',
}) {
  const reducedMotion = useReducedMotion();
  const hoverMotion = reducedMotion ? {} : { whileHover: { y: -8, scale: 1.02 } };
  const cover = book?.cover_image_url || book?.cover_image;
  const title = book?.title || '';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      {...hoverMotion}
      className={[
        'group relative flex flex-col w-[160px] sm:w-[180px] lg:w-[220px]',
        'rounded-24 overflow-hidden cursor-pointer bg-surface shadow-card border border-border',
        'text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        className,
      ].join(' ')}
      aria-label={title}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-secondary">
        <img
          src={cover || '/placeholder.png'}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-900/70 via-transparent to-transparent opacity-70" />
        <div className="absolute top-space-12 left-space-12 flex flex-col gap-space-8">
          {isNew ? <Badge variant="primary" size="sm">Nouveau</Badge> : null}
          {isRecommended ? <Badge variant="secondary" size="sm">Pour toi</Badge> : null}
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="w-space-48 h-space-48 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-floating pl-space-4" aria-hidden="true">
            <svg className="w-space-24 h-space-24" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </div>
      </div>

      {progress !== null ? (
        <ProgressBar progress={progress} className="rounded-none" />
      ) : null}

      <div className="p-space-16 flex flex-col grow bg-surface">
        <h3 className="text-heading-m text-base line-clamp-1 group-hover:text-primary-600 transition-colors">
          {title}
        </h3>
        <p className="text-caption mt-space-4 line-clamp-1">
          {book?.age_group ? `${book.age_group} ans` : ''}
          {book?.duration_minutes ? ` · ${book.duration_minutes} min` : ''}
        </p>
      </div>
    </motion.button>
  );
});
