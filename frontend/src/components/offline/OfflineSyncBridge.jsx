import { useEffect } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { parentalAPI } from '../../api/parental';
import { generatedStoriesAPI } from '../../api/generatedStories';
import { synchronizePendingMutations } from '../../services/offline/offlineSyncService';
import { synchronizeParentalPolicy } from '../../services/parental/parentalAccessService';
import {
  kidActivityMutationHandlers,
  migrateLegacyKidActivity
} from '../../services/parental/kidActivitySyncService';
import { performCloudSync } from '../../services/cloud/cloudSyncService';
import { useAuth } from '../../context/AuthContext';

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
    if (!online) return;

    const synchronize = async () => {
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
      await synchronizePendingMutations(syncHandlers);
      if (user?.role === 'kid') {
        try {
          await performCloudSync();
        } catch (error) {
          console.warn('Cloud sync failed:', error);
        }
      }
    };
    synchronize().catch((error) => {
      console.warn('Offline synchronization failed:', error);
    });
  }, [online, changedAt, user?.id, user?.role]);

  return null;
}
