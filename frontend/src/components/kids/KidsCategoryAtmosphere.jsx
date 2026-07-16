import { memo } from 'react';
import { motion } from 'framer-motion';
import { getCategoryAtmosphere } from '../../constants/kidCategoryAtmosphere';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Decorative category atmosphere — footprints, stars, bubbles, etc.
 */
export const KidsCategoryAtmosphere = memo(function KidsCategoryAtmosphere({ categoryId }) {
  const reducedMotion = useReducedMotion();
  const atmosphere = getCategoryAtmosphere(categoryId);

  return (
    <div
      className={`kids-category-atmosphere pointer-events-none absolute inset-0 overflow-hidden ${atmosphere.className} ${reducedMotion ? 'kids-ambient-static' : ''}`}
      aria-hidden="true"
    >
      <div className={`absolute inset-0 bg-gradient-to-b ${atmosphere.tint}`} />
      {atmosphere.motifs.map((motif, index) => (
        <motion.span
          key={`${motif}-${index}`}
          className="kids-cat-motif"
          style={{
            top: `${12 + (index * 19) % 70}%`,
            left: index % 2 === 0 ? `${6 + index * 8}%` : undefined,
            right: index % 2 === 1 ? `${8 + index * 6}%` : undefined,
            fontSize: `${1.8 + (index % 3) * 0.6}rem`,
          }}
          animate={reducedMotion ? undefined : { y: [0, -10, 0], opacity: [0.2, 0.45, 0.2] }}
          transition={reducedMotion ? undefined : { duration: 4 + index * 0.4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
        >
          {motif}
        </motion.span>
      ))}
      {categoryId === 'dinosaurs' && (
        <>
          <div className="kids-cat-print" style={{ bottom: '18%', left: '12%' }} />
          <div className="kids-cat-print kids-cat-print-sm" style={{ bottom: '28%', left: '22%' }} />
          <div className="kids-cat-print" style={{ bottom: '14%', right: '18%' }} />
        </>
      )}
      {categoryId === 'ocean' && (
        <>
          <div className="kids-cat-bubble" style={{ bottom: '20%', left: '15%' }} />
          <div className="kids-cat-bubble kids-cat-bubble-sm" style={{ bottom: '35%', left: '28%' }} />
          <div className="kids-cat-bubble" style={{ bottom: '25%', right: '20%' }} />
        </>
      )}
      {categoryId === 'space' && (
        <>
          <div className="kids-ambient-star" style={{ top: '16%', left: '20%' }} />
          <div className="kids-ambient-star kids-ambient-star-sm" style={{ top: '30%', right: '25%' }} />
          <div className="kids-ambient-star" style={{ top: '50%', left: '40%' }} />
        </>
      )}
    </div>
  );
});

export default KidsCategoryAtmosphere;
