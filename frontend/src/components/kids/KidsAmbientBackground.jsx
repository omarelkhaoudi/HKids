import { memo } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Decorative ambient layers per kids world — CSS/SVG only, pointer-events none.
 */
const AMBIENT = {
  books: {
    className: 'kids-ambient-books',
    shapes: (
      <>
        <div className="kids-ambient-shelf kids-ambient-shelf-1" />
        <div className="kids-ambient-shelf kids-ambient-shelf-2" />
        <div className="kids-ambient-shelf kids-ambient-shelf-3" />
        <span className="kids-ambient-emoji" style={{ top: '12%', left: '6%' }} aria-hidden="true">📖</span>
        <span className="kids-ambient-emoji" style={{ top: '68%', right: '8%' }} aria-hidden="true">📚</span>
      </>
    ),
  },
  audio: {
    className: 'kids-ambient-audio',
    shapes: (
      <>
        <div className="kids-ambient-moon" />
        <div className="kids-ambient-star" style={{ top: '18%', left: '12%' }} />
        <div className="kids-ambient-star kids-ambient-star-sm" style={{ top: '28%', right: '18%' }} />
        <div className="kids-ambient-star" style={{ top: '55%', left: '22%' }} />
        <div className="kids-ambient-star kids-ambient-star-sm" style={{ bottom: '22%', right: '12%' }} />
        <span className="kids-ambient-emoji" style={{ bottom: '18%', left: '10%' }} aria-hidden="true">🌙</span>
      </>
    ),
  },
  learn: {
    className: 'kids-ambient-learn',
    shapes: (
      <>
        <div className="kids-ambient-blob kids-ambient-blob-a" />
        <div className="kids-ambient-blob kids-ambient-blob-b" />
        <div className="kids-ambient-blob kids-ambient-blob-c" />
        <span className="kids-ambient-emoji" style={{ top: '16%', right: '10%' }} aria-hidden="true">⭐</span>
        <span className="kids-ambient-emoji" style={{ bottom: '20%', left: '8%' }} aria-hidden="true">🎯</span>
      </>
    ),
  },
  create: {
    className: 'kids-ambient-create',
    shapes: (
      <>
        <div className="kids-ambient-cloud kids-ambient-cloud-1" />
        <div className="kids-ambient-cloud kids-ambient-cloud-2" />
        <div className="kids-ambient-spark" style={{ top: '20%', left: '15%' }} />
        <div className="kids-ambient-spark" style={{ top: '40%', right: '20%' }} />
        <div className="kids-ambient-spark" style={{ bottom: '30%', left: '25%' }} />
        <span className="kids-ambient-emoji" style={{ top: '14%', right: '12%' }} aria-hidden="true">✨</span>
      </>
    ),
  },
  favorites: {
    className: 'kids-ambient-favorites',
    shapes: (
      <>
        <div className="kids-ambient-heart" style={{ top: '15%', left: '10%' }} />
        <div className="kids-ambient-heart kids-ambient-heart-sm" style={{ top: '35%', right: '14%' }} />
        <div className="kids-ambient-heart" style={{ bottom: '25%', left: '18%' }} />
        <div className="kids-ambient-heart kids-ambient-heart-sm" style={{ bottom: '18%', right: '10%' }} />
        <span className="kids-ambient-emoji" style={{ top: '22%', right: '22%' }} aria-hidden="true">❤️</span>
      </>
    ),
  },
  home: {
    className: 'kids-ambient-home',
    shapes: (
      <>
        <div className="kids-ambient-blob kids-ambient-blob-a opacity-60" />
        <div className="kids-ambient-star kids-ambient-star-sm" style={{ top: '20%', right: '15%' }} />
        <div className="kids-ambient-star" style={{ bottom: '30%', left: '12%' }} />
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
