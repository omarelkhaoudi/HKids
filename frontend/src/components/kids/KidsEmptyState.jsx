import { motion } from 'framer-motion';
import KidsButton from './KidsButton';
import { KidsMascot } from './KidsMascot';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, kidsCardAppear, kidsFloat } from '../../constants/kidsMotion';

export function KidsEmptyState({
  emoji = '📚',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  compact = false,
  illustration,
  showMascot = false,
  mascotMood = 'encourage',
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      {...getMotionProps(reducedMotion, kidsCardAppear)}
      className={`kids-premium-panel w-full p-8 md:p-12 text-center relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 kids-shimmer opacity-25 pointer-events-none" aria-hidden="true" />
      {showMascot && (
        <div className="relative flex justify-center mb-3">
          <KidsMascot mood={mascotMood} size="small" showBubble={false} />
        </div>
      )}
      <motion.div
        className={`relative inline-flex mb-5 ${compact ? 'text-5xl' : 'text-7xl md:text-8xl'}`}
        {...(reducedMotion ? {} : kidsFloat)}
        aria-hidden="true"
      >
        {illustration || emoji}
      </motion.div>
      {title && (
        <h3 className={`relative font-black text-foreground mb-2 line-clamp-2 ${compact ? 'text-xl' : 'text-2xl md:text-3xl'}`}>
          {title}
        </h3>
      )}
      {description && (
        <p className={`relative text-foreground-secondary font-bold mb-6 max-w-md mx-auto line-clamp-2 ${compact ? 'text-sm' : 'text-base'}`}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <KidsButton onClick={onAction} className="relative !min-h-[56px] !text-lg mx-auto">
          {actionLabel}
        </KidsButton>
      )}
    </motion.div>
  );
}

export default KidsEmptyState;
