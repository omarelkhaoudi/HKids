import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from './Badge';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { LOCAL_BOOK_COVERS_BASE } from '../../utils/bookCover';

export const StoryCard = memo(function StoryCard({
  title,
  coverUrl,
  meta,
  badge,
  onClick,
  className = '',
}) {
  const reducedMotion = useReducedMotion();
  const hoverMotion = reducedMotion ? {} : { whileHover: { y: -6, scale: 1.02 } };
  const src = coverUrl || `${LOCAL_BOOK_COVERS_BASE}/default.webp`;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      {...hoverMotion}
      className={[
        'group text-left w-full rounded-24 overflow-hidden bg-surface shadow-card border border-border',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        className,
      ].join(' ')}
      aria-label={title}
    >
      <div className="relative aspect-[3/4] bg-surface-secondary overflow-hidden">
        <img
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.src = `${LOCAL_BOOK_COVERS_BASE}/default.webp`;
          }}
        />
        {badge ? (
          <div className="absolute top-space-12 left-space-12">
            <Badge variant="magic" size="sm">{badge}</Badge>
          </div>
        ) : null}
      </div>
      <div className="p-space-16 space-y-space-4">
        <h3 className="text-heading-m line-clamp-2">{title}</h3>
        {meta ? <p className="text-caption line-clamp-1">{meta}</p> : null}
      </div>
    </motion.button>
  );
});
