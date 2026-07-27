import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, kidsCarouselReveal } from '../../constants/kidsMotion';

/**
 * Lightweight horizontal carousel with smooth snap scrolling.
 * Visual polish only — no data fetching.
 */
export function Carousel({
  children,
  className = '',
  gap = 'gap-space-16',
  ariaLabel = 'Carousel',
}) {
  const reducedMotion = useReducedMotion();
  const railRef = useRef(null);

  const scrollBy = (dir) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(280, el.clientWidth * 0.7), behavior: 'smooth' });
  };

  return (
    <motion.div
      className={`relative ${className}`}
      {...getMotionProps(reducedMotion, kidsCarouselReveal)}
    >
      <div
        ref={railRef}
        className={`kids-discovery-rail ${gap}`}
        role="region"
        aria-label={ariaLabel}
      >
        {children}
      </div>
      <div className="mt-space-12 flex justify-end gap-space-8 px-space-8">
        <button
          type="button"
          className="kids-icon-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
          aria-label="Scroll previous"
          onClick={() => scrollBy(-1)}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          className="kids-icon-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
          aria-label="Scroll next"
          onClick={() => scrollBy(1)}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
