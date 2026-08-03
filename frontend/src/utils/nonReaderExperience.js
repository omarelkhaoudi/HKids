import { KIDS_PICTOGRAMS } from './kidsGuidePhrases';

export const NON_READER_MIN_TOUCH_PX = 56;

export const NON_READER_ACTIONS = {
  back: { pictogram: KIDS_PICTOGRAMS.back, labelKey: 'back', tone: 'calm' },
  next: { pictogram: '➡️', labelKey: 'kidReaderNext', tone: 'calm' },
  play: { pictogram: KIDS_PICTOGRAMS.continue, labelKey: 'kidReaderPlay', tone: 'primary' },
  listen: { pictogram: KIDS_PICTOGRAMS.listen, labelKey: 'listenAction', tone: 'audio' },
  read: { pictogram: KIDS_PICTOGRAMS.read, labelKey: 'readAction', tone: 'primary' },
  pause: { pictogram: '⏸️', labelKey: 'pause', tone: 'primary' },
  replay: { pictogram: '↻', labelKey: 'kidReaderReadAgain', tone: 'calm' },
  favorite: { pictogram: KIDS_PICTOGRAMS.favorites, labelKey: 'addToFavorites', tone: 'warm' },
  download: { pictogram: KIDS_PICTOGRAMS.downloads, labelKey: 'offlineMode', tone: 'calm' },
  search: { pictogram: KIDS_PICTOGRAMS.search, labelKey: 'search', tone: 'calm' },
  microphone: { pictogram: '🎙️', labelKey: 'assistantVoice', tone: 'voice' },
  story: { pictogram: KIDS_PICTOGRAMS.library, labelKey: 'kidsNavStories', tone: 'primary' },
  quiz: { pictogram: KIDS_PICTOGRAMS.quiz, labelKey: 'kidsNavLearning', tone: 'learn' },
  reward: { pictogram: '🏆', labelKey: 'eduParentAchievements', tone: 'reward' },
  avatar: { pictogram: KIDS_PICTOGRAMS.profile, labelKey: 'profile', tone: 'calm' },
  parents: { pictogram: '👪', labelKey: 'parentDashboard', tone: 'warm' },
  settings: { pictogram: KIDS_PICTOGRAMS.settings, labelKey: 'settings', tone: 'calm' },
  sleep: { pictogram: '🌙', labelKey: 'readerAmbienceNight', tone: 'night' },
  success: { pictogram: '⭐', labelKey: 'kidsLearningBravo', tone: 'reward' },
  retry: { pictogram: '↻', labelKey: 'kidReaderRetry', tone: 'warm' },
};

export function getNonReaderAction(actionId) {
  return NON_READER_ACTIONS[actionId] || NON_READER_ACTIONS.play;
}

export function isNonReaderTouchTarget(sizePx) {
  return Number(sizePx) >= NON_READER_MIN_TOUCH_PX;
}

export function nonReaderActionIds() {
  return Object.keys(NON_READER_ACTIONS);
}
