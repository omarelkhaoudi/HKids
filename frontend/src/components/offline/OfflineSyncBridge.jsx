import { useEffect } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { parentalAPI } from '../../api/parental';
import { generatedStoriesAPI } from '../../api/generatedStories';
import { synchronizePendingMutations } from '../../services/offline/offlineSyncService';

const syncHandlers = {
  reading_progress: (payload) => parentalAPI.recordReadingProgress(payload),
  generated_story_save: (payload) => generatedStoriesAPI.save(payload.storyId),
  generated_story_favorite: (payload) => generatedStoriesAPI.setFavorite(payload.storyId, payload.favorite),
  favorite_add: () => Promise.resolve(),
  favorite_remove: () => Promise.resolve(),
  listening_history: () => Promise.resolve(),
  reading_history: () => Promise.resolve()
};

export function OfflineSyncBridge() {
  const { online, changedAt } = useNetworkStatus();

  useEffect(() => {
    if (!online) return;

    synchronizePendingMutations(syncHandlers).catch((error) => {
      console.warn('Offline synchronization failed:', error);
    });
  }, [online, changedAt]);

  return null;
}
