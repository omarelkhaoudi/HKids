import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useLanguage } from '../../context/LanguageContext';
import { subscribeSyncStatus, SYNC_PHASE } from '../../services/offline/syncStatusService';
import { BRAND_SEMANTIC } from '../../constants/brandTheme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps } from '../../constants/kidsMotion';

const bannerMotion = {
  initial: { opacity: 0, y: -16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12, scale: 0.98 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
};

export function OfflineStatusBanner() {
  const { online, changedAt } = useNetworkStatus();
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(!online);
  const [syncPhase, setSyncPhase] = useState('idle');
  const [queueFailed, setQueueFailed] = useState(0);

  useEffect(() => subscribeSyncStatus((status) => {
    setSyncPhase(status.phase);
    setQueueFailed(status.queueFailed || 0);
  }), []);

  useEffect(() => {
    setVisible(true);
    if (!online) return undefined;

    const timeout = window.setTimeout(() => {
      if (syncPhase === SYNC_PHASE.idle || syncPhase === SYNC_PHASE.success) {
        setVisible(false);
      }
    }, 3500);
    return () => window.clearTimeout(timeout);
  }, [online, changedAt, syncPhase]);

  const isSyncing = online && syncPhase === SYNC_PHASE.syncing;
  const hasError = syncPhase === SYNC_PHASE.error || queueFailed > 0;
  const isPartial = syncPhase === SYNC_PHASE.partial;

  let message = t('offlineBannerOffline');
  let tone = 'bg-surface-900 text-white';
  let emoji = '🌙';

  if (online && isSyncing) {
    message = t('offlineBannerSyncing');
    tone = `${BRAND_SEMANTIC.success.solid} text-white`;
    emoji = '☁️';
  } else if (online && hasError) {
    message = t('offlineBannerSyncError');
    tone = `${BRAND_SEMANTIC.warning.solid} text-white`;
    emoji = '🌧️';
  } else if (online && isPartial) {
    message = t('offlineBannerSyncPartial', { count: queueFailed });
    tone = `${BRAND_SEMANTIC.warning.solid} text-white`;
    emoji = '🌦️';
  } else if (online) {
    message = t('offlineBannerOnline');
    tone = `${BRAND_SEMANTIC.success.solid} text-white`;
    emoji = '✨';
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed inset-x-3 top-3 z-[100] mx-auto flex max-w-lg items-center justify-center gap-3 rounded-[1.35rem] px-4 py-3 text-sm font-black shadow-lg backdrop-blur-xl ${tone}`}
          role="status"
          aria-live="polite"
          {...getMotionProps(reducedMotion, bannerMotion)}
        >
          <span className="text-base" aria-hidden="true">{emoji}</span>
          {isSyncing && (
            <span className={`inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent ${reducedMotion ? '' : 'animate-spin'}`} aria-hidden="true" />
          )}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
