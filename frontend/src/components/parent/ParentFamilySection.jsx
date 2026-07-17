import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AudioIcon, HeartIcon, SparklesIcon, StarIcon,
} from '../Icons';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion, getMotionProps, kidsCardAppear, kidsStaggerContainer } from '../../constants/kidsMotion';

const FAMILY_LINKS = [
  {
    id: 'voices',
    path: '/parent/voices',
    labelKey: 'parentFamilyVoices',
    descKey: 'parentFamilyVoicesDesc',
    icon: AudioIcon,
    emoji: '🎙️',
    accent: 'from-secondary-100 to-primary-50',
  },
  {
    id: 'stories',
    path: '/parent/story-studio',
    labelKey: 'parentFamilyStories',
    descKey: 'parentFamilyStoriesDesc',
    icon: SparklesIcon,
    emoji: '✨',
    accent: 'from-magic-100 to-orange-50',
  },
  {
    id: 'together',
    path: '/parent/ai-stories',
    labelKey: 'parentFamilyTogether',
    descKey: 'parentFamilyTogetherDesc',
    icon: HeartIcon,
    emoji: '👨‍👩‍👧',
    accent: 'from-orange-100 to-secondary-50',
  },
  {
    id: 'goals',
    path: '/parent',
    labelKey: 'parentFamilyGoals',
    descKey: 'parentFamilyGoalsDesc',
    icon: StarIcon,
    emoji: '🎯',
    accent: 'from-success-100 to-primary-50',
  },
];

export function ParentFamilySection({ t, kidName, streakDays = 0 }) {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  return (
    <section className="parent-section" aria-labelledby="parent-family-heading">
      <header className="mb-space-24">
        <h2 id="parent-family-heading" className="text-heading-xl font-black text-foreground">
          {t('parentFamilyTitle')}
        </h2>
        <p className="text-body-lg text-foreground-secondary font-medium mt-1">
          {kidName
            ? t('parentFamilySubtitle', { name: kidName })
            : t('parentFamilySubtitleGeneric')}
        </p>
        {streakDays > 0 && (
          <p className="text-body font-bold text-primary-600 mt-2">
            {t('parentFamilyStreakCelebrate', { days: streakDays })}
          </p>
        )}
      </header>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-space-16"
        {...(reducedMotion ? {} : kidsStaggerContainer)}
      >
        {FAMILY_LINKS.map((link, index) => {
          const Icon = link.icon;
          return (
            <motion.button
              key={link.id}
              type="button"
              onClick={() => navigate(link.path)}
              {...getMotionProps(reducedMotion, {
                ...kidsCardAppear,
                transition: { ...kidsCardAppear.transition, delay: index * 0.05 },
              })}
              {...getHoverMotion(reducedMotion)}
              className="parent-family-card text-start rounded-32 shadow-card bg-gradient-to-br border border-border/40 p-space-24 min-h-touch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              style={{ backgroundImage: undefined }}
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${link.accent} mb-space-16 shadow-soft`}>
                <span className="text-2xl" aria-hidden="true">{link.emoji}</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-foreground-muted shrink-0" aria-hidden="true" />
                <h3 className="text-heading-m font-black text-foreground">{t(link.labelKey)}</h3>
              </div>
              <p className="text-body text-foreground-secondary font-medium leading-relaxed">{t(link.descKey)}</p>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
}

export default ParentFamilySection;
