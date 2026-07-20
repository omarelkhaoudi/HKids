import { memo } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Subtle reading presence — breathing glow, dust motes, soft light drift.
 * Decorative only; lazy-friendly (no images).
 */
export const ReaderLivingPresence = memo(function ReaderLivingPresence({
  mood = 'warm',
  active = true,
}) {
  const reducedMotion = useReducedMotion();

  if (!active || reducedMotion) {
    return (
      <div className="kids-reader-living-presence kids-reader-living-presence--static" aria-hidden="true">
        <span className="kids-reader-breathing-glow" />
      </div>
    );
  }

  return (
    <div className={`kids-reader-living-presence kids-reader-living-presence--${mood}`} aria-hidden="true">
      <span className="kids-reader-breathing-glow" />
      <span className="kids-reader-light-drift" />
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className="kids-reader-dust-mote"
          style={{
            left: `${14 + index * 16}%`,
            top: `${22 + (index * 13) % 55}%`,
            animationDelay: `${index * 1.4}s`,
          }}
        />
      ))}
    </div>
  );
});

export default ReaderLivingPresence;
