import { memo } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Decorative ambient layers — quiet, sparse, pointer-events none.
 */
const AMBIENT = {
  books: {
    className: 'kids-ambient-books',
    shapes: (
      <>
        <div className="kids-ambient-shelf kids-ambient-shelf-1" />
        <div className="kids-ambient-shelf kids-ambient-shelf-2" />
      </>
    ),
  },
  audio: {
    className: 'kids-ambient-audio',
    shapes: (
      <>
        <div className="kids-ambient-moon" style={{ opacity: 0.28 }} />
        <div className="kids-ambient-star kids-ambient-star-sm" style={{ top: '22%', right: '16%', opacity: 0.35 }} />
      </>
    ),
  },
  learn: {
    className: 'kids-ambient-learn',
    shapes: (
      <>
        <div className="kids-ambient-blob kids-ambient-blob-a" style={{ opacity: 0.35 }} />
      </>
    ),
  },
  create: {
    className: 'kids-ambient-create',
    shapes: (
      <>
        <div className="kids-ambient-spark" style={{ top: '24%', left: '18%', opacity: 0.4 }} />
        <div className="kids-ambient-spark" style={{ bottom: '28%', right: '20%', opacity: 0.3 }} />
      </>
    ),
  },
  favorites: {
    className: 'kids-ambient-favorites',
    shapes: (
      <>
        <div className="kids-ambient-heart kids-ambient-heart-sm" style={{ top: '20%', right: '14%', opacity: 0.25 }} />
      </>
    ),
  },
  home: {
    className: 'kids-ambient-home',
    shapes: (
      <>
        <div className="kids-ambient-blob kids-ambient-blob-a opacity-40" />
      </>
    ),
  },
};

export const KidsAmbientBackground = memo(function KidsAmbientBackground({ world = 'home' }) {
  const reducedMotion = useReducedMotion();
  const ambient = AMBIENT[world] || AMBIENT.home;

  return (
    <div
      className={`kids-ambient pointer-events-none absolute inset-0 overflow-hidden ${ambient.className} ${reducedMotion ? 'kids-ambient-static' : ''}`}
      aria-hidden="true"
    >
      {ambient.shapes}
    </div>
  );
});

export default KidsAmbientBackground;
