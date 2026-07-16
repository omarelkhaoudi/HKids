import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import KidsButton from './KidsButton';
import { HomeIcon, BookIcon, AudioIcon, HeartIcon } from '../Icons';

const NAV_ITEMS = [
  { id: 'home', path: '/kids', match: 'exact', labelKey: 'kidsNavHome', icon: HomeIcon, tone: 'primary' },
  { id: 'library', path: '/kids/library', match: 'prefix', labelKey: 'library', icon: BookIcon, tone: 'primary' },
  { id: 'audio', path: '/kids/audio', match: 'audio', labelKey: 'kidsNavAudio', icon: AudioIcon, tone: 'accent' },
  { id: 'favorites', path: '/favorites', match: 'exact', labelKey: 'yourFavorites', icon: HeartIcon, tone: 'accent' },
  { id: 'profile', path: '/kids#profile', match: 'hash', labelKey: 'profile', icon: null, emoji: '👤', tone: 'primary' },
];

function isActiveItem(location, item) {
  if (item.match === 'exact') {
    return location.pathname === item.path && !location.hash;
  }
  if (item.match === 'prefix') {
    return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
  }
  if (item.match === 'audio') {
    return (
      location.pathname === '/kids/audio'
      || location.pathname.startsWith('/kids/audio/')
      || location.pathname.startsWith('/kids/listen')
    );
  }
  if (item.match === 'hash') {
    return location.pathname === '/kids' && location.hash === '#profile';
  }
  return false;
}

export function KidsBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-0 left-0 w-full p-4 md:p-6 z-30 pointer-events-none flex justify-center">
      <motion.nav
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 22 }}
        aria-label={t('kidsNavLabel')}
        className="pointer-events-auto bg-white/92 dark:bg-surface-900/92 backdrop-blur-xl px-3 py-3 md:px-5 md:py-4 rounded-[2rem] shadow-glass border-4 border-white/60 dark:border-white/10 flex gap-2 md:gap-3 justify-center max-w-full"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActiveItem(location, item);
          const Icon = item.icon;

          return (
            <KidsButton
              key={item.id}
              variant={active ? 'primary' : 'ghost'}
              tone={active ? item.tone : undefined}
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
      </motion.nav>
    </div>
  );
}

export default KidsBottomNav;
