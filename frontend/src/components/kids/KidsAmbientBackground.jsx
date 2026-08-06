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
  
  // A premium Disney/Toca Boca style global background
  return (
    <div
      className={`kids-ambient pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-br from-sky-300 via-sky-200 to-sky-100 ${reducedMotion ? 'kids-ambient-static' : ''}`}
      aria-hidden="true"
    >
      {/* Massive ambient glow orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-300/40 blur-[80px] mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-yellow-200/50 blur-[100px] mix-blend-multiply" />
      
      {/* Magical Floating Elements (Disney/Toca Boca vibe) */}
      <span className="kids-home-cloud" style={{ width: '22vw', top: '8%', left: '4%', opacity: 0.8 }} />
      <span className="kids-home-cloud" style={{ width: '16vw', top: '15%', right: '8%', opacity: 0.6 }} />
      <span className="kids-home-cloud" style={{ width: '28vw', bottom: '12%', left: '15%', opacity: 0.7 }} />
      <span className="kids-home-cloud" style={{ width: '18vw', bottom: '25%', right: '6%', opacity: 0.9 }} />
      
      {/* Twinkling Stars & Particles */}
      <span className="kids-home-star" style={{ top: '18%', left: '35%' }} />
      <span className="kids-home-star" style={{ top: '35%', right: '25%' }} />
      <span className="kids-home-star" style={{ bottom: '40%', left: '20%' }} />
      <span className="kids-home-star" style={{ bottom: '18%', right: '40%' }} />
      
      {/* Floating Magic Dust (CSS Bubbles) */}
      <div className="absolute top-[30%] left-[10%] w-6 h-6 rounded-full bg-white/40 shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-[hkids-float_6s_ease-in-out_infinite]" />
      <div className="absolute bottom-[20%] right-[20%] w-4 h-4 rounded-full bg-white/50 shadow-[0_0_10px_rgba(255,255,255,0.9)] animate-[hkids-float_8s_ease-in-out_infinite_1s]" />
      <div className="absolute top-[60%] left-[50%] w-8 h-8 rounded-full bg-white/30 shadow-[0_0_20px_rgba(255,255,255,0.6)] animate-[hkids-float_7s_ease-in-out_infinite_2s]" />
    </div>
  );
});

export default KidsAmbientBackground;
