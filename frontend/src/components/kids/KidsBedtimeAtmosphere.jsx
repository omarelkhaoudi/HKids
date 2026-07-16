import { memo } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Calm bedtime atmosphere — moonlight, soft stars, slow breathing particles.
 * Decorative only; pointer-events none.
 */
export const KidsBedtimeAtmosphere = memo(function KidsBedtimeAtmosphere({ intensity = 'soft' }) {
  const reducedMotion = useReducedMotion();
  const starCount = intensity === 'rich' ? 18 : 10;

  return (
    <div
      className={`kids-bedtime-atmosphere pointer-events-none absolute inset-0 overflow-hidden ${reducedMotion ? 'kids-ambient-static' : ''}`}
      aria-hidden="true"
    >
      <div className="kids-bedtime-sky" />
      <div className="kids-bedtime-moon" />
      <div className="kids-bedtime-moon-glow" />
      {Array.from({ length: starCount }).map((_, i) => (
        <motion.span
          key={i}
          className="kids-bedtime-star"
          style={{
            top: `${8 + ((i * 17) % 70)}%`,
            left: `${5 + ((i * 23) % 90)}%`,
            width: `${3 + (i % 3)}px`,
            height: `${3 + (i % 3)}px`,
          }}
          animate={reducedMotion ? undefined : { opacity: [0.25, 0.85, 0.25], scale: [0.9, 1.15, 0.9] }}
          transition={reducedMotion ? undefined : { duration: 3.5 + (i % 4) * 0.4, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
      {!reducedMotion && (
        <>
          <motion.div
            className="kids-bedtime-particle"
            style={{ bottom: '22%', left: '18%' }}
            animate={{ y: [0, -14, 0], opacity: [0.2, 0.45, 0.2] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="kids-bedtime-particle kids-bedtime-particle-sm"
            style={{ bottom: '30%', right: '22%' }}
            animate={{ y: [0, -10, 0], opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          />
        </>
      )}
    </div>
  );
});

export default KidsBedtimeAtmosphere;
