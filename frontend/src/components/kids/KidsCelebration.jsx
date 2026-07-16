import { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useLanguage } from '../../context/LanguageContext';
import KidsButton from './KidsButton';
import { KidsMascot } from './KidsMascot';
import { getMotionProps, kidsPageEnter, kidsBadgePop } from '../../constants/kidsMotion';

const STAR_COUNT = 12;
const CONFETTI_COUNT = 24;
const COLORS = ['#FBBF24', '#3B9AE8', '#2DD4BF', '#F472B6', '#A78BFA', '#F59E0B'];

/**
 * Celebration overlay. Bedtime variant: moon/stars, soft encouragement, up to 3 CTAs.
 */
export const KidsCelebration = memo(function KidsCelebration({
  active = false,
  title,
  subtitle,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  tertiaryLabel,
  onTertiary,
  onComplete,
  durationMs = 1800,
  autoDismiss = false,
  variant = 'default',
}) {
  const reducedMotion = useReducedMotion();
  const { t } = useLanguage();
  const isBedtime = variant === 'bedtime';

  useEffect(() => {
    if (!active || !autoDismiss) return undefined;
    const timer = setTimeout(() => onComplete?.(), durationMs);
    return () => clearTimeout(timer);
  }, [active, autoDismiss, durationMs, onComplete]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className={`fixed inset-0 z-[60] flex items-center justify-center p-6 backdrop-blur-sm ${
            isBedtime ? 'bg-[#0f172a]/55' : 'bg-black/35'
          }`}
          {...getMotionProps(reducedMotion, {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: { duration: 0.25 },
          })}
          role="dialog"
          aria-modal="true"
          aria-label={title || t('kidBookDone')}
        >
          {!reducedMotion && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
              {isBedtime ? (
                <>
                  <div className="absolute top-16 right-16 w-24 h-24 rounded-full bg-amber-100/80 shadow-[0_0_60px_20px_rgba(253,230,138,0.35)]" />
                  {Array.from({ length: STAR_COUNT }).map((_, i) => (
                    <motion.span
                      key={`s-${i}`}
                      className="absolute text-xl"
                      style={{ left: `${8 + (i * 7) % 84}%`, top: `${10 + (i * 11) % 55}%` }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 1, 0.6], scale: [0.5, 1.1, 1], y: [0, -10, -4] }}
                      transition={{ duration: 1.4, delay: i * 0.04 }}
                    >
                      ⭐
                    </motion.span>
                  ))}
                </>
              ) : (
                <>
                  {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
                    <motion.div
                      key={`c-${i}`}
                      className="absolute w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: COLORS[i % COLORS.length],
                        left: `${(i * 37) % 100}%`,
                        top: '-8px',
                      }}
                      initial={{ y: 0, opacity: 1, rotate: 0 }}
                      animate={{
                        y: typeof window !== 'undefined' ? window.innerHeight + 40 : 800,
                        opacity: 0,
                        rotate: 180,
                        x: ((i % 5) - 2) * 40,
                      }}
                      transition={{ duration: 1.4 + (i % 5) * 0.08, ease: 'easeOut', delay: (i % 8) * 0.03 }}
                    />
                  ))}
                  {Array.from({ length: STAR_COUNT }).map((_, i) => (
                    <motion.span
                      key={`s-${i}`}
                      className="absolute text-2xl"
                      style={{ left: `${8 + (i * 7) % 84}%`, top: `${12 + (i * 11) % 60}%` }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.8], y: [0, -16, -8] }}
                      transition={{ duration: 1.2, delay: i * 0.05 }}
                    >
                      ⭐
                    </motion.span>
                  ))}
                </>
              )}
            </div>
          )}

          <motion.div
            className={`relative z-10 kids-premium-panel max-w-md w-full p-8 md:p-10 text-center shadow-kids-soft ${
              isBedtime ? 'border-amber-100/40' : ''
            }`}
            {...getMotionProps(reducedMotion, kidsPageEnter)}
          >
            <motion.div className="flex justify-center mb-4" {...getMotionProps(reducedMotion, kidsBadgePop)}>
              <KidsMascot mood="celebrate" size="small" showBubble={false} className="!pointer-events-none" />
            </motion.div>
            <h2 className={`text-3xl md:text-4xl font-black mb-2 ${isBedtime ? 'text-indigo-700' : 'text-primary-600'}`}>
              {title || t('kidBookDone')}
            </h2>
            {subtitle && (
              <p className="text-lg font-bold text-foreground-secondary mb-6 line-clamp-2">{subtitle}</p>
            )}
            <div className="flex flex-col gap-3">
              {primaryLabel && onPrimary && (
                <KidsButton onClick={onPrimary} className="!min-h-[56px] !w-full !text-lg" tone={isBedtime ? 'accent' : 'primary'}>
                  {primaryLabel}
                </KidsButton>
              )}
              {secondaryLabel && onSecondary && (
                <KidsButton onClick={onSecondary} variant="ghost" className="!min-h-[56px] !w-full !text-lg">
                  {secondaryLabel}
                </KidsButton>
              )}
              {tertiaryLabel && onTertiary && (
                <KidsButton onClick={onTertiary} variant="ghost" className="!min-h-[56px] !w-full !text-lg !text-foreground-muted">
                  {tertiaryLabel}
                </KidsButton>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default KidsCelebration;
