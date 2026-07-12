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
