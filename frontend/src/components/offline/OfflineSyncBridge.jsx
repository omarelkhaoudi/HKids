import { useEffect } from 'react';
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
import { drainQueue } from '../../services/contentDelivery/smartDownloadService';

const syncHandlers = {
  reading_progress: (payload) => parentalAPI.recordReadingProgress(payload),
  generated_story_save: (payload) => generatedStoriesAPI.save(payload.storyId),
  generated_story_favorite: (payload) => generatedStoriesAPI.setFavorite(payload.storyId, payload.favorite),
  ...kidActivityMutationHandlers
};

export function OfflineSyncBridge() {
  const { online, changedAt } = useNetworkStatus();
  const { user } = useAuth();

  useEffect(() => {
    setNetworkOnline(online);
  }, [online, changedAt]);

  useEffect(() => bindFavoriteAutoDownload(), []);

  useEffect(() => {
    if (!online) return;

    const synchronize = async () => {
      let queueResult = { synced: 0, failed: 0, pending: 0 };
      let cloudResult = { unchanged: true, conflicts_resolved: 0 };
      let syncError = null;

      try {
        const pending = await getPendingMutations();
        beginSync({ queuePending: pending.length });

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
          await syncFavoriteDownloads({ limit: 12 });
          await runPredictiveDownloads({ limit: 3 });
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
        const pendingAfter = await getPendingMutations();
        completeSync({
          queueSynced: queueResult.synced,
          queueFailed: queueResult.failed,
          queuePending: pendingAfter.length,
          cloudUnchanged: cloudResult?.unchanged ?? null,
          conflictsResolved: cloudResult?.conflicts_resolved || 0,
          error: syncError,
        });
      }
    };

    synchronize().catch((error) => {
      console.warn('Offline synchronization failed:', error);
    });
  }, [online, changedAt, user?.id, user?.role]);

  return null;
}
