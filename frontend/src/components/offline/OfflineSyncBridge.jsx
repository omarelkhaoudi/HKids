import { useEffect, useState } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { parentalAPI } from '../../api/parental';
import { generatedStoriesAPI } from '../../api/generatedStories';
import { synchronizePendingMutations, getPendingMutations } from '../../services/offline/offlineSyncService';
import { synchronizeParentalPolicy } from '../../services/parental/parentalAccessService';
import {
  kidActivityMutationHandlers,
  migrateLegacyKidActivity
} from '../../services/parental/kidActivitySyncService';
import { performCloudSync } from '../../services/cloud/cloudSyncService';
import { useAuth } from '../../context/AuthContext';
import {
  beginSync,
  completeSync,
  setNetworkOnline,
} from '../../services/offline/syncStatusService';
import { checkCatalogUpdate } from '../../services/contentDelivery/catalogDeliveryService';
import { syncFavoriteDownloads, bindFavoriteAutoDownload } from '../../services/contentDelivery/favoritesAutoDownloadService';
import { runPredictiveDownloads } from '../../services/contentDelivery/predictiveDownloadService';
import { getStorageStats, optimizeStorage } from '../../services/contentDelivery/storageStatsService';
import { drainQueue, resumePausedDownloads } from '../../services/contentDelivery/smartDownloadService';
import { recordOfflineEvent } from '../../services/contentDelivery/offlineAnalyticsService';
import { auditOfflineDownloads } from '../../services/offline/offlineContentService';

const syncHandlers = {
  reading_progress: (payload) => parentalAPI.recordReadingProgress(payload),
  generated_story_save: (payload) => generatedStoriesAPI.save(payload.storyId),
  generated_story_favorite: (payload) => generatedStoriesAPI.setFavorite(payload.storyId, payload.favorite),
  ...kidActivityMutationHandlers
};

let bridgeSyncActive = false;
let retryTimer = null;

function nextRetryFromMutations(mutations = []) {
  return mutations
    .map((mutation) => mutation.nextRetryAt)
    .filter(Boolean)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] || null;
}

function scheduleSyncRetry(nextRetryAt) {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (!nextRetryAt || typeof window === 'undefined') return;
  const delay = Math.max(1_000, new Date(nextRetryAt).getTime() - Date.now());
  retryTimer = window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent('hkids:sync-retry-due'));
  }, delay);
}

export function OfflineSyncBridge() {
  const { online, changedAt } = useNetworkStatus();
  const { user } = useAuth();
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    setNetworkOnline(online);
  }, [online, changedAt]);

  useEffect(() => bindFavoriteAutoDownload(), []);

  useEffect(() => {
    const onRetryDue = () => setRetryTick((tick) => tick + 1);
    window.addEventListener('hkids:sync-retry-due', onRetryDue);
    return () => {
      window.removeEventListener('hkids:sync-retry-due', onRetryDue);
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!online) return;
    if (bridgeSyncActive) return;

    const synchronize = async () => {
      bridgeSyncActive = true;
      let queueResult = { synced: 0, failed: 0, pending: 0 };
      let cloudResult = { unchanged: true, conflicts_resolved: 0 };
      let syncError = null;

      try {
        const pending = await getPendingMutations();
        beginSync({ queuePending: pending.length });
        await recordOfflineEvent('sync_started', { pending: pending.length });

        try {
          await synchronizeParentalPolicy();
        } catch (error) {
          console.warn('Parental policy sync failed:', error);
        }

        if (user?.role === 'kid') {
          try {
            await migrateLegacyKidActivity();
          } catch (error) {
            console.warn('Legacy kid activity migration failed:', error);
          }
        }

        queueResult = await synchronizePendingMutations(syncHandlers);

        if (user?.role === 'kid') {
          try {
            cloudResult = await performCloudSync();
          } catch (error) {
            syncError = error;
            console.warn('Cloud sync failed:', error);
          }
        }

        try {
          await checkCatalogUpdate();
        } catch (error) {
          console.warn('Catalog update check failed:', error);
        }

        // Smart offline pass: favorites → predictive → resume queue → quota trim
        try {
          const integrity = await auditOfflineDownloads({ repair: true, removeOrphans: false });
          if (integrity.repaired > 0) {
            await recordOfflineEvent('integrity_repaired', { count: integrity.repaired });
          }
          await syncFavoriteDownloads({ limit: 12 });
          await runPredictiveDownloads({ limit: 3 });
          await resumePausedDownloads();
          await drainQueue();
          const stats = await getStorageStats();
          if (stats.quotaBytes && stats.usageBytes / stats.quotaBytes > 0.9) {
            await optimizeStorage({ aggressive: true });
          }
        } catch (error) {
          console.warn('Smart offline pass failed:', error);
        }
      } catch (error) {
        syncError = error;
        console.warn('Offline synchronization failed:', error);
      } finally {
        const [pendingAfter, allQueuedAfter] = await Promise.all([
          getPendingMutations(),
          getPendingMutations({ includeDeferred: true }),
        ]);
        const nextRetryAt = nextRetryFromMutations(allQueuedAfter);
        scheduleSyncRetry(nextRetryAt);
        completeSync({
          queueSynced: queueResult.synced,
          queueFailed: queueResult.failed,
          queuePending: pendingAfter.length,
          queueDeferred: Math.max(0, allQueuedAfter.length - pendingAfter.length),
          cloudUnchanged: cloudResult?.unchanged ?? null,
          conflictsResolved: cloudResult?.conflicts_resolved || 0,
          nextRetryAt,
          error: syncError,
        });
        if (syncError) {
          await recordOfflineEvent('sync_failed', { message: syncError.message || String(syncError) });
        } else if (queueResult.failed > 0) {
          await recordOfflineEvent('sync_partial', {
            failed: queueResult.failed,
            deferred: Math.max(0, allQueuedAfter.length - pendingAfter.length),
          });
        } else {
          await recordOfflineEvent('sync_completed', {
            synced: queueResult.synced,
            conflictsResolved: cloudResult?.conflicts_resolved || 0,
          });
        }
        bridgeSyncActive = false;
      }
    };

    synchronize().catch((error) => {
      bridgeSyncActive = false;
      console.warn('Offline synchronization failed:', error);
    });
  }, [online, changedAt, retryTick, user?.id, user?.role]);

  return null;
}
