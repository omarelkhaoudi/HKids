import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { HomeIcon, BookIcon, AudioIcon, HeartIcon, UserIcon } from '../Icons';

const NAV_ITEMS = [
  { id: 'home', path: '/kids', match: 'exact', labelKey: 'kidsNavHome', icon: HomeIcon },
  { id: 'library', path: '/kids/library', match: 'prefix', labelKey: 'library', icon: BookIcon },
  { id: 'audio', path: '/kids/audio', match: 'audio', labelKey: 'kidsNavAudio', icon: AudioIcon },
  { id: 'favorites', path: '/favorites', match: 'exact', labelKey: 'yourFavorites', icon: HeartIcon },
  { id: 'profile', path: '/kids#profile', match: 'hash', labelKey: 'profile', icon: UserIcon },
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
  const reducedMotion = useReducedMotion();

  return (
    <div className="fixed bottom-0 inset-inline-0 p-space-12 md:p-space-20 z-30 pointer-events-none flex justify-center">
      <motion.nav
        initial={reducedMotion ? false : { y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        aria-label={t('kidsNavLabel')}
        className="kids-bottom-nav-shell pointer-events-auto px-space-12 py-space-8 md:px-space-16 rounded-full flex gap-space-4 md:gap-space-8 justify-center max-w-full"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActiveItem(location, item);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              aria-label={t(item.labelKey)}
              aria-current={active ? 'page' : undefined}
              className={`kids-bottom-nav-item focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${active ? 'is-active' : ''}`}
            >
              {Icon ? (
                <Icon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={active ? 2.25 : 1.75} />
              ) : null}
              <span className="kids-bottom-nav-label hidden sm:block max-w-[4.5rem] truncate">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
}

export default KidsBottomNav;
