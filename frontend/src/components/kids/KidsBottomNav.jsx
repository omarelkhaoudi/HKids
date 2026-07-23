import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { KIDS_PICTOGRAMS } from '../../utils/kidsGuidePhrases';
import { playKidsUiSound } from '../../utils/kidsUiSound';
import { getGuideVoicePhrase } from '../../utils/kidsGuidePhrases';
import { useKidsVoiceGuide } from '../../hooks/useKidsVoiceGuide';

const NAV_ITEMS = [
  { id: 'home', path: '/kids', match: 'exact', labelKey: 'kidsNavHome', pictogram: KIDS_PICTOGRAMS.home, voiceKey: 'home' },
  { id: 'library', path: '/kids/library', match: 'prefix', labelKey: 'library', pictogram: KIDS_PICTOGRAMS.library, voiceKey: 'library' },
  { id: 'audio', path: '/kids/audio', match: 'audio', labelKey: 'kidsNavAudio', pictogram: KIDS_PICTOGRAMS.audio, voiceKey: 'audio' },
  { id: 'favorites', path: '/favorites', match: 'exact', labelKey: 'yourFavorites', pictogram: KIDS_PICTOGRAMS.favorites, voiceKey: 'favorites' },
  { id: 'profile', path: '/kids#profile', match: 'hash', labelKey: 'profile', pictogram: KIDS_PICTOGRAMS.profile, voiceKey: null },
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
  const { language, t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const { speakGuide } = useKidsVoiceGuide(language);

  return (
    <div className="fixed bottom-0 inset-inline-0 p-space-12 md:p-space-20 z-30 pointer-events-none flex justify-center">
      <motion.nav
        initial={reducedMotion ? false : { y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        aria-label={t('kidsNavLabel')}
        className="kids-bottom-nav-shell kids-bottom-nav-shell--pictogram pointer-events-auto px-space-12 py-space-8 md:px-space-16 rounded-full flex gap-space-4 md:gap-space-8 justify-center max-w-full"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActiveItem(location, item);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                playKidsUiSound('tap');
                if (item.voiceKey) {
                  speakGuide(getGuideVoicePhrase(item.voiceKey, language));
                }
                navigate(item.path);
              }}
              aria-label={t(item.labelKey)}
              aria-current={active ? 'page' : undefined}
              title={t(item.labelKey)}
              className={`kids-bottom-nav-item kids-bottom-nav-item--pictogram focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${active ? 'is-active' : ''}`}
            >
              <span className="kids-bottom-nav-pictogram" aria-hidden="true">{item.pictogram}</span>
              <span className="sr-only">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
}

export default KidsBottomNav;
