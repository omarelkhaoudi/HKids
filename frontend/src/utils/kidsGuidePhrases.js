/**
 * Short spoken / bubble phrases for non-reader guidance (FR / EN / AR).
 */

const CATEGORY_VOICE = {
  dinosaurs: {
    en: 'Dinosaurs are waiting!',
    fr: 'Les dinosaures t’attendent !',
    ar: 'الديناصورات بانتظارك!',
  },
  space: {
    en: 'Let’s explore space!',
    fr: 'Partons explorer l’espace !',
    ar: 'هيا نستكشف الفضاء!',
  },
  animals: {
    en: 'Let’s meet amazing animals!',
    fr: 'Allons rencontrer de super animaux !',
    ar: 'هيا نلتقي بحيوانات رائعة!',
  },
  princesses: {
    en: 'You found fairy-tale magic!',
    fr: 'Tu as trouvé la magie des contes !',
    ar: 'وجدت سحر الحكايات!',
  },
  bedtime: {
    en: 'Soft stories for bedtime.',
    fr: 'Des histoires douces pour le dodo.',
    ar: 'قصص هادئة قبل النوم.',
  },
  ocean: {
    en: 'Splash into the ocean!',
    fr: 'Plouf dans l’océan !',
    ar: 'هيا نغطس في المحيط!',
  },
  world: {
    en: 'Let’s discover the world!',
    fr: 'Découvrons le monde !',
    ar: 'هيا نكتشف العالم!',
  },
  colors: {
    en: 'Time to create with colors!',
    fr: 'Créons avec les couleurs !',
    ar: 'حان وقت الألوان!',
  },
  jobs: {
    en: 'Let’s discover cool jobs!',
    fr: 'Découvrons les métiers !',
    ar: 'هيا نكتشف المهن!',
  },
  rhymes: {
    en: 'Sing along with me!',
    fr: 'Chantons ensemble !',
    ar: 'هيا نغني معاً!',
  },
  alphabet: {
    en: 'Let’s play with letters!',
    fr: 'Jouons avec les lettres !',
    ar: 'هيا نلعب بالحروف!',
  },
  numbers: {
    en: 'Let’s count together!',
    fr: 'Comptons ensemble !',
    ar: 'هيا نعد معاً!',
  },
  spirituality: {
    en: 'A calm and kind story.',
    fr: 'Une histoire douce et bienveillante.',
    ar: 'قصة هادئة ولطيفة.',
  },
  vehicles: {
    en: 'Vroom! Let’s go!',
    fr: 'Vroum ! En route !',
    ar: 'فروه! هيا ننطلق!',
  },
};

const ACTION_VOICE = {
  welcome: {
    en: 'Hi! Pick a story with the pictures.',
    fr: 'Salut ! Choisis une histoire avec les images.',
    ar: 'مرحبا! اختر قصة بالصور.',
  },
  library: {
    en: 'Choose your next story.',
    fr: 'Choisis ta prochaine histoire.',
    ar: 'اختر قصتك التالية.',
  },
  favorites: {
    en: 'Here are your favorite stories.',
    fr: 'Voici tes histoires préférées.',
    ar: 'هذه قصصك المفضلة.',
  },
  audio: {
    en: 'Let’s listen together.',
    fr: 'Écoutons ensemble.',
    ar: 'هيا نستمع معاً.',
  },
  learning: {
    en: 'Ready to play and learn?',
    fr: 'Prêt à jouer et apprendre ?',
    ar: 'هل أنت مستعد للعب والتعلم؟',
  },
  greatChoice: {
    en: 'Great choice!',
    fr: 'Super choix !',
    ar: 'اختيار رائع!',
  },
  finished: {
    en: 'Great job! You finished!',
    fr: 'Bravo ! Tu as terminé !',
    ar: 'أحسنت! لقد أنهيت!',
  },
  explore: {
    en: 'Let’s explore together!',
    fr: 'Explorons ensemble !',
    ar: 'هيا نستكشف معاً!',
  },
  home: {
    en: 'Welcome home!',
    fr: 'Bienvenue à la maison !',
    ar: 'أهلاً بك في البيت!',
  },
};

function langKey(language = 'fr') {
  const code = String(language || 'fr').toLowerCase();
  if (code.startsWith('en')) return 'en';
  if (code.startsWith('ar')) return 'ar';
  return 'fr';
}

export function getCategoryVoicePhrase(categoryId, language = 'fr') {
  const entry = CATEGORY_VOICE[categoryId];
  if (!entry) return ACTION_VOICE.explore[langKey(language)];
  return entry[langKey(language)] || entry.fr;
}

export function getGuideVoicePhrase(actionKey, language = 'fr') {
  const entry = ACTION_VOICE[actionKey] || ACTION_VOICE.explore;
  return entry[langKey(language)] || entry.fr;
}

export function speechLocale(language = 'fr') {
  const key = langKey(language);
  if (key === 'en') return 'en-US';
  if (key === 'ar') return 'ar-SA';
  return 'fr-FR';
}

/** Pictogram map for common kids actions (visual-first UI). */
export const KIDS_PICTOGRAMS = {
  home: '🏠',
  library: '📚',
  favorites: '❤️',
  continue: '▶️',
  listen: '🎧',
  read: '📖',
  quiz: '🧩',
  games: '🎮',
  back: '⬅️',
  search: '🔍',
  downloads: '⬇️',
  settings: '⚙️',
  audio: '🎧',
  profile: '🧒',
  create: '✨',
  learn: '🎮',
  new: '✨',
  popular: '⭐',
  recommended: '🌟',
};
