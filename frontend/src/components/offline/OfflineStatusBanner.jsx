import { useEffect, useState } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useLanguage } from '../../context/LanguageContext';
import { subscribeSyncStatus, SYNC_PHASE } from '../../services/offline/syncStatusService';

export function OfflineStatusBanner() {
  const { online, changedAt } = useNetworkStatus();
  const { t } = useLanguage();
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

  if (!visible) return null;

  const isSyncing = online && syncPhase === SYNC_PHASE.syncing;
  const hasError = syncPhase === SYNC_PHASE.error || queueFailed > 0;
  const isPartial = syncPhase === SYNC_PHASE.partial;

  let message = t('offlineBannerOffline');
  let tone = 'bg-surface-900 text-white';

  if (online && isSyncing) {
    message = t('offlineBannerSyncing');
    tone = 'bg-emerald-600 text-white';
  } else if (online && hasError) {
    message = t('offlineBannerSyncError');
    tone = 'bg-amber-600 text-white';
  } else if (online && isPartial) {
    message = t('offlineBannerSyncPartial', { count: queueFailed });
    tone = 'bg-amber-600 text-white';
  } else if (online) {
    message = t('offlineBannerOnline');
    tone = 'bg-emerald-600 text-white';
  }

  return (
    <div
      className={`fixed inset-x-3 top-3 z-[100] mx-auto flex max-w-md items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black shadow-lg ${tone}`}
      role="status"
      aria-live="polite"
    >
      {isSyncing && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
      )}
      {message}
    </div>
  );
}
