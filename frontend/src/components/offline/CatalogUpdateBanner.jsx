import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps } from '../../constants/kidsMotion';
import { Button } from '../ui';
import { cdLabel } from '../../constants/contentDeliveryLabels';
import {
  applyCatalogUpdate,
  dismissCatalogUpdate,
  subscribeCatalogUpdates,
  getLocalCatalogState,
} from '../../services/contentDelivery/catalogDeliveryService';
import {
  formatEta,
  getQueueSnapshot,
  subscribeDownloadQueue,
} from '../../services/contentDelivery/downloadQueueService';
import { useToast } from '../ToastProvider';

const bannerMotion = {
  initial: { opacity: 0, y: -16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12, scale: 0.98 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
};

export function CatalogUpdateBanner() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const { showToast } = useToast();
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [queue, setQueue] = useState(() => getQueueSnapshot());

  useEffect(() => {
    getLocalCatalogState().then((state) => {
      if (state.pending) setPending(state.pending);
    }).catch(() => {});
    return subscribeCatalogUpdates((detail) => {
      if (detail?.type === 'available') {
        setPending(detail.catalog ? {
          version: detail.catalog.version,
          versionId: detail.catalog.version_id,
          publishedAt: detail.catalog.published_at,
          packageBytes: detail.catalog.package_bytes,
          fingerprint: detail.catalog.content_fingerprint,
          changelog: detail.catalog.changelog || [],
          packs: detail.catalog.packs || [],
        } : null);
      }
      if (detail?.type === 'applied' || detail?.type === 'dismissed' || detail?.type === 'rolled_back') {
        setPending(null);
      }
    });
  }, []);

  useEffect(() => subscribeDownloadQueue(setQueue), []);

  if (!user) return null;

  const activeJob = Object.values(queue.jobs || {}).find((j) => j.status === 'downloading' || j.status === 'paused');

  const handleUpdate = async () => {
    try {
      setBusy(true);
      await applyCatalogUpdate();
      showToast(cdLabel('cdApplied', language), 'success');
      setPending(null);
    } catch (error) {
      showToast(cdLabel('cdFailed', language), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleLater = async () => {
    await dismissCatalogUpdate(pending?.version);
    setPending(null);
  };

  const showUpdate = Boolean(pending?.version);
  const showProgress = Boolean(activeJob);

  if (!showUpdate && !showProgress) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-x-3 top-16 z-[99] mx-auto max-w-lg rounded-[1.35rem] bg-card/95 text-foreground shadow-lg border border-border backdrop-blur-xl px-4 py-3"
        role="status"
        aria-live="polite"
        {...getMotionProps(reducedMotion, bannerMotion)}
      >
        {showProgress && (
          <div className="mb-2">
            <div className="flex items-center justify-between gap-2 text-sm font-black">
              <span>✨ {cdLabel('cdDownloading', language)}</span>
              <span>{cdLabel('cdProgress', language, { percent: activeJob.progress || 0 })}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-surface-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-500 transition-all"
                style={{ width: `${Math.min(100, activeJob.progress || 0)}%` }}
              />
            </div>
            <p className="mt-1 text-caption text-foreground-muted font-bold">
              {cdLabel('cdEta', language, { eta: formatEta(activeJob.etaSeconds) })}
            </p>
          </div>
        )}

        {showUpdate && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm">✨ {cdLabel('cdNewStories', language)}</p>
              <p className="text-caption text-foreground-muted font-bold truncate">
                {cdLabel('cdCatalogVersion', language)} v{pending.version}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button size="sm" variant="primary" disabled={busy} onClick={handleUpdate} className="rounded-full font-black">
                {cdLabel('cdUpdateNow', language)}
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={handleLater} className="rounded-full font-bold">
                {cdLabel('cdLater', language)}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default CatalogUpdateBanner;
