import { motion } from 'framer-motion';
import KidsButton from './KidsButton';

export function KidsEmptyState({
  emoji = '📚',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full rounded-[2rem] bg-white/80 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 p-10 md:p-12 text-center shadow-sm ${className}`}
    >
      <div className="text-6xl mb-4" aria-hidden="true">{emoji}</div>
      <h3 className="text-2xl font-black text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-surface-500 font-bold mb-6 max-w-md mx-auto">{description}</p>
      )}
      {actionLabel && onAction && (
        <KidsButton onClick={onAction}>{actionLabel}</KidsButton>
      )}
    </motion.div>
  );
}

export default KidsEmptyState;
