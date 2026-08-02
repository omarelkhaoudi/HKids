import { motion } from 'framer-motion';
import { EDUCATIONAL_WORLDS } from '../../constants/educationalWorlds';
import { eduLabel } from '../../constants/educationalWorldLabels';
import { getHoverMotion } from '../../constants/kidsMotion';

export function KidsWorldGrid({
  language = 'fr',
  progressByWorld = {},
  onSelectWorld,
  reducedMotion = false,
  highlightIds = null,
}) {
  const worlds = highlightIds?.length
    ? EDUCATIONAL_WORLDS.filter((world) => highlightIds.includes(world.id))
    : EDUCATIONAL_WORLDS;

  return (
    <div className="grid grid-cols-2 gap-space-16 sm:grid-cols-3 md:gap-space-20 lg:grid-cols-4 xl:grid-cols-5">
      {worlds.map((world, index) => {
        const wins = progressByWorld[world.id] || 0;
        const label = eduLabel(world.labelKey, language);

        return (
          <motion.button
            key={world.id}
            type="button"
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reducedMotion ? 0 : Math.min(index * 0.03, 0.4) }}
            {...getHoverMotion(reducedMotion)}
            onClick={() => onSelectWorld?.(world.id)}
            className="kids-visual-learning-world kids-touch-target group relative overflow-hidden rounded-24 p-space-16 shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
            aria-label={label}
            title={label}
          >
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/25 blur-xl" aria-hidden="true" />
            <span className="kids-visual-learning-emoji" aria-hidden="true">{world.emoji}</span>
            <span className="sr-only">{label}</span>
            <span className="kids-visual-learning-count" aria-label={`${wins}`}>
              <span aria-hidden="true">⭐</span>
              <span>{wins}</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

export default KidsWorldGrid;
