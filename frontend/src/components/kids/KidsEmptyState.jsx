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
  recommendations = [],
  onRecommendPlay = null,
  recommendLabel = null,
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      {...getMotionProps(reducedMotion, kidsCardAppear)}
      className={`kids-premium-panel w-full p-8 md:p-12 text-center relative overflow-hidden ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-0 kids-shimmer opacity-25 pointer-events-none" aria-hidden="true" />
      {showMascot && (
        <div className="relative flex justify-center mb-3">
          <KidsMascot mood={mascotMood} size="small" showBubble={false} />
        </div>
      )}
      {!showMascot && (illustration || emoji) ? (
      <motion.div
        className={`relative inline-flex mb-5 ${compact ? 'text-5xl' : 'text-7xl md:text-8xl'}`}
        {...(reducedMotion ? {} : kidsFloat)}
        aria-hidden="true"
      >
        {illustration || emoji}
      </motion.div>
      ) : null}
      {/* Completely text-free UI: Removed title and description */}
      {Array.isArray(recommendations) && recommendations.length > 0 && (
        <div className="relative mb-6 flex flex-wrap justify-center gap-2">
          {recommendations.slice(0, 4).map((book) => (
            <button
              key={book.id || book.title}
              type="button"
              onClick={() => onRecommendPlay?.(book)}
              className="min-h-[48px] rounded-2xl border border-border bg-card px-3 py-2 text-caption font-bold shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
            >
              {book.title || recommendLabel || '✨'}
            </button>
          ))}
        </div>
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
