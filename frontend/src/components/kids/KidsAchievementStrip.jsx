import { motion } from 'framer-motion';
import { persLabel } from '../../constants/personalizationLabels';
import { getMotionProps, kidsCarouselReveal } from '../../constants/kidsMotion';

export function KidsAchievementStrip({
  achievements = [],
  language = 'fr',
  reducedMotion = false,
}) {
  const earned = achievements.filter((a) => a.earned);
  if (!earned.length) return null;

  return (
    <motion.section
      className="px-space-8 md:px-space-16 mb-space-8"
      aria-label="Achievements"
      {...getMotionProps(reducedMotion, kidsCarouselReveal)}
    >
      <div className="flex gap-3 overflow-x-auto pb-2 kids-scroll-smooth custom-scrollbar snap-x">
        {earned.map((ach) => (
          <motion.div
            key={ach.id}
            initial={reducedMotion ? false : { scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="snap-start shrink-0 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-hkids-brown-soft to-hkids-brown-soft border border-hkids-brown-light px-4 py-2 min-h-[48px] shadow-soft"
          >
            <span className="text-2xl" aria-hidden="true">{ach.emoji}</span>
            <span className="text-caption font-black text-foreground whitespace-nowrap">
              {persLabel(ach.labelKey, language)}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

export default KidsAchievementStrip;
