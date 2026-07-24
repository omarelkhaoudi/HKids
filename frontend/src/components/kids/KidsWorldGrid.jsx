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
    ? EDUCATIONAL_WORLDS.filter((w) => highlightIds.includes(w.id))
    : EDUCATIONAL_WORLDS;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-space-16 md:gap-space-20">
      {worlds.map((world, index) => {
        const wins = progressByWorld[world.id] || 0;
        return (
          <motion.button
            key={world.id}
            type="button"
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reducedMotion ? 0 : Math.min(index * 0.03, 0.4) }}
            {...getHoverMotion(reducedMotion)}
            onClick={() => onSelectWorld?.(world.id)}
            className={`group relative overflow-hidden min-h-[10.5rem] rounded-24 bg-gradient-to-br ${world.gradient} p-space-16 text-left text-white shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-success-300`}
          >
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15 blur-xl" />
            <span className="text-4xl drop-shadow-md block mb-space-8" aria-hidden="true">{world.emoji}</span>
            <span className="block text-heading-m leading-tight font-black drop-shadow-sm">
              {eduLabel(world.labelKey, language)}
            </span>
            <span className="mt-space-8 inline-flex items-center gap-1 rounded-full bg-black/25 px-space-10 py-space-4 text-caption font-bold">
              ⭐ {wins}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

export default KidsWorldGrid;
