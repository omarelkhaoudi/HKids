import { motion } from 'framer-motion';
import KidsButton from './KidsButton';

export function KidsEmptyState({
  emoji = '📚',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  compact = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`kids-premium-panel w-full p-10 md:p-12 text-center ${className}`}
    >
      <div className="text-7xl mb-5" aria-hidden="true">{emoji}</div>
      {title && <h3 className={`font-black text-foreground mb-2 ${compact ? 'text-xl' : 'text-2xl md:text-3xl'}`}>{title}</h3>}
      {!compact && description && (
        <p className="text-foreground-secondary font-bold mb-6 max-w-md mx-auto">{description}</p>
      )}
      {actionLabel && onAction && (
        <KidsButton onClick={onAction} className="!min-h-[56px] !text-lg">
          {compact ? '📚' : actionLabel}
        </KidsButton>
      )}
    </motion.div>
  );
}

export default KidsEmptyState;
