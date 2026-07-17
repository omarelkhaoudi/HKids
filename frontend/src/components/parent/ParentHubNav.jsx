import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion, getMotionProps, kidsCardAppear, kidsStaggerContainer } from '../../constants/kidsMotion';
import { BookIcon, AudioIcon, SettingsIcon, SparklesIcon } from '../Icons';

const LINKS = [
  { id: 'profiles', path: '/parent/profiles', labelKey: 'parentNavProfiles', descKey: 'parentNavProfilesDesc', icon: BookIcon, emoji: '👧' },
  { id: 'voices', path: '/parent/voices', labelKey: 'parentNavVoices', descKey: 'parentNavVoicesDesc', icon: AudioIcon, emoji: '🎙️' },
  { id: 'stories', path: '/parent/story-studio', labelKey: 'parentNavStories', descKey: 'parentNavStoriesDesc', icon: SparklesIcon, emoji: '✨' },
  { id: 'subscription', path: '/abonnements', labelKey: 'parentNavSubscription', descKey: 'parentNavSubscriptionDesc', icon: SettingsIcon, emoji: '💎' },
];

export function ParentHubNav({ className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();

  return (
    <nav className={className} aria-label={t('parentHubNavLabel')}>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-16"
        {...(reducedMotion ? {} : kidsStaggerContainer)}
      >
        {LINKS.map((link, index) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <motion.button
              key={link.id}
              type="button"
              {...getMotionProps(reducedMotion, {
                ...kidsCardAppear,
                transition: { ...kidsCardAppear.transition, delay: index * 0.04 },
              })}
              {...getHoverMotion(reducedMotion)}
              onClick={() => navigate(link.path)}
              className={`parent-hub-card text-start rounded-32 shadow-card bg-card border p-space-24 min-h-touch transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
                isActive ? 'border-primary-300 ring-2 ring-primary-200/60 shadow-floating' : 'border-border/50 hover:shadow-floating'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-3xl mb-space-12 block" aria-hidden="true">{link.emoji}</span>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-5 h-5 text-primary-500 shrink-0" aria-hidden="true" />
                <p className="font-black text-heading-m text-foreground">{t(link.labelKey)}</p>
              </div>
              <p className="text-body text-foreground-secondary font-medium leading-relaxed">{t(link.descKey)}</p>
            </motion.button>
          );
        })}
      </motion.div>
    </nav>
  );
}

export default ParentHubNav;
