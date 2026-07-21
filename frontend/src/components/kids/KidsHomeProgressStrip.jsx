import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, kidsCarouselReveal, kidsProgressFill } from '../../constants/kidsMotion';

/**
 * Soft progress strip — calm signals only (no XP, coins, or badges).
 */
export function KidsHomeProgressStrip({
  completed = 0,
  started = 0,
  readingDays = 0,
  worlds = [],
  t,
}) {
  const reducedMotion = useReducedMotion();

  const chips = [
    completed > 0 && {
      id: 'completed',
      label: t('kidsHomeProgressCompleted', { count: completed }),
      value: Math.min(100, completed * 12),
    },
    started > 0 && {
      id: 'started',
      label: t('kidsHomeProgressStarted', { count: started }),
      value: Math.min(100, started * 10),
    },
    readingDays > 1 && {
      id: 'days',
      label: t('kidsHomeProgressDays', { count: readingDays }),
      value: Math.min(100, readingDays * 14),
    },
    worlds.length > 0 && {
      id: 'worlds',
      label: t('kidsHomeProgressWorlds', { worlds: worlds.join(' · ') }),
      value: Math.min(100, worlds.length * 28),
    },
  ].filter(Boolean);

  if (!chips.length) return null;

  return (
    <motion.section
      className="px-space-8 md:px-space-16"
      aria-label={t('kidsHomeProgressLabel')}
      {...getMotionProps(reducedMotion, kidsCarouselReveal)}
    >
      <div className="kids-premium-panel p-space-16 md:p-space-20">
        <p className="kids-type-meta mb-space-12 text-primary-700">
          {t('kidsHomeProgressTitle')}
        </p>
        <ul className="grid gap-space-12 sm:grid-cols-2">
          {chips.map((chip) => (
            <li key={chip.id} className="min-w-0">
              <p className="kids-type-body font-semibold text-foreground mb-space-8 truncate">
                {chip.label}
              </p>
              <div
                className="h-2 rounded-full bg-white/70 overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(chip.value)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={chip.label}
              >
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary-400 to-secondary-400"
                  initial={reducedMotion ? false : { width: 0 }}
                  animate={{ width: `${chip.value}%` }}
                  transition={reducedMotion ? { duration: 0 } : kidsProgressFill.transition}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}

export default KidsHomeProgressStrip;
