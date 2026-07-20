import { memo } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Almost-invisible illustration life — soft float + micro parallax via CSS.
 */
export const LivingIllustration = memo(function LivingIllustration({
  src,
  alt = '',
  className = '',
}) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={`kids-reader-living-art ${reducedMotion ? 'is-static' : ''}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`kids-reader-illustration kids-reader-illustration-breathe ${className}`.trim()}
      />
    </div>
  );
});

export default LivingIllustration;
