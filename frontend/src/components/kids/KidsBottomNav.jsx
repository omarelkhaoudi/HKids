import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import KidsButton from './KidsButton';
import { HomeIcon, BookIcon, SparklesIcon, StarIcon } from '../Icons';

const NAV_ITEMS = [
  { id: 'home', path: '/kids', labelKey: 'kidsNavHome', icon: HomeIcon, emoji: null },
  { id: 'library', path: '/kids/library', labelKey: 'library', icon: BookIcon, emoji: null },
  { id: 'learning', path: '/kids/learning', labelKey: 'kidsNavLearning', icon: null, emoji: '🎮' },
  { id: 'studio', path: '/kids/story-studio', labelKey: 'kidsNavStudio', icon: SparklesIcon, emoji: null },
  { id: 'stories', path: '/kids/ai-stories', labelKey: 'kidsNavStories', icon: null, emoji: '✨' },
];

function isActivePath(currentPath, itemPath) {
  if (itemPath === '/kids') return currentPath === '/kids';
  return currentPath.startsWith(itemPath);
}

export function KidsBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navItems = NAV_ITEMS.filter((item) => item.id !== 'studio' || user?.role !== 'kid');

  return (
    <div className="fixed bottom-0 left-0 w-full p-4 md:p-6 z-30 pointer-events-none flex justify-center">
      <motion.nav
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 22 }}
        aria-label={t('kidsNavLabel')}
        className="pointer-events-auto bg-white/92 dark:bg-surface-900/92 backdrop-blur-xl px-3 py-3 md:px-5 md:py-4 rounded-[2rem] shadow-glass border-4 border-white/60 dark:border-white/10 flex flex-wrap gap-2 md:gap-3 justify-center max-w-full"
      >
        {navItems.map((item) => {
          const active = isActivePath(location.pathname, item.path);
          const Icon = item.icon;

          return (
            <KidsButton
              key={item.id}
              variant={active ? 'primary' : 'ghost'}
              size="sm"
              icon={Icon || undefined}
              className="!rounded-full !px-4 md:!px-5 !min-h-[56px] !text-base md:!text-lg"
              onClick={() => navigate(item.path)}
              aria-label={t(item.labelKey)}
            >
              {!Icon && item.emoji ? (
                <span className="flex items-center gap-2">
                  <span className="text-2xl" aria-hidden="true">{item.emoji}</span>
                  <span className="hidden sm:inline">{t(item.labelKey)}</span>
                </span>
              ) : (
                <span className="hidden sm:inline">{t(item.labelKey)}</span>
              )}
            </KidsButton>
          );
        })}
        <KidsButton
          variant={location.pathname === '/kids' && location.hash === '#medals' ? 'secondary' : 'ghost'}
          size="sm"
          icon={StarIcon}
          className="!rounded-full !px-4 md:!px-5 !min-h-[56px]"
          onClick={() => navigate('/kids#medals')}
          aria-label={t('yourMedals')}
        >
          <span className="hidden sm:inline">{t('yourMedals')}</span>
        </KidsButton>
      </motion.nav>
    </div>
  );
}

export default KidsBottomNav;
