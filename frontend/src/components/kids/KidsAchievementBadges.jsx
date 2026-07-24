import { motion } from 'framer-motion';
import { LEARNING_ACHIEVEMENTS } from '../../constants/educationalWorlds';
import { eduLabel } from '../../constants/educationalWorldLabels';

export function KidsAchievementBadges({
  unlockedIds = [],
  language = 'fr',
  reducedMotion = false,
  compact = false,
}) {
  const unlocked = new Set(unlockedIds);

  return (
    <div className={`grid ${compact ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'} gap-3`}>
      {LEARNING_ACHIEVEMENTS.map((badge) => {
        const isOn = unlocked.has(badge.id);
        return (
          <motion.div
            key={badge.id}
            initial={reducedMotion ? false : { scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`rounded-2xl border p-3 text-center ${
              isOn
                ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-soft'
                : 'border-border/60 bg-surface-secondary/50 opacity-50 grayscale'
            }`}
            aria-label={eduLabel(badge.labelKey, language)}
          >
            <div className={`${compact ? 'text-2xl' : 'text-3xl'} mb-1`}>{badge.emoji}</div>
            <p className="text-caption font-black leading-tight text-foreground">
              {eduLabel(badge.labelKey, language)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

export default KidsAchievementBadges;
