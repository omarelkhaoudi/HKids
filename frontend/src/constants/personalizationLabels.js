import { normalizeLanguage } from '../utils/translations';

const labels = {
  en: {
    persNewForYou: 'New For You',
    persRecentlyPlayed: 'Recently Played',
    persPopularWithAge: 'Popular With Kids Your Age',
    persSimilarStories: 'Similar Stories',
    persExploreNew: 'Explore Something New',
    persTodaysSurprise: "Today's Surprise",
    persBecauseFinished: 'Because you finished {theme} stories',
    persBecauseListenedBedtime: 'Because you listened to Bedtime Stories',
    persLastOpened: 'Last opened',
    persRemaining: '{count} min left',
    persFinishedBadge: 'Finished',
    persAchFirstStory: 'First Story',
    persAchFiveStories: '5 Stories',
    persAchTenStories: '10 Stories',
    persAchAnimalExplorer: 'Animal Explorer',
    persAchSpaceExplorer: 'Space Explorer',
    persAchGoodListener: 'Good Listener',
    persAchReadingChampion: 'Reading Champion',
    persAchCuriousMind: 'Curious Mind',
    persPinFavorite: 'Pin favorite',
    persUnpinFavorite: 'Unpin',
    persFavoriteCollections: 'Favorite collections',
    persDiscoverHint: 'Try a story the mascot picked for you',
    kidsRecentlyLoved: 'Recently loved',
  },
  fr: {
    persNewForYou: 'Nouveau pour toi',
    persRecentlyPlayed: 'Joué récemment',
    persPopularWithAge: 'Populaire à ton âge',
    persSimilarStories: 'Histoires similaires',
    persExploreNew: 'Explorer quelque chose de nouveau',
    persTodaysSurprise: 'Surprise du jour',
    persBecauseFinished: 'Parce que tu as fini des histoires {theme}',
    persBecauseListenedBedtime: 'Parce que tu as écouté des histoires du soir',
    persLastOpened: 'Dernière ouverture',
    persRemaining: '{count} min restantes',
    persFinishedBadge: 'Terminé',
    persAchFirstStory: 'Première histoire',
    persAchFiveStories: '5 histoires',
    persAchTenStories: '10 histoires',
    persAchAnimalExplorer: 'Explorateur animaux',
    persAchSpaceExplorer: 'Explorateur espace',
    persAchGoodListener: 'Bonne oreille',
    persAchReadingChampion: 'Champion de lecture',
    persAchCuriousMind: 'Esprit curieux',
    persPinFavorite: 'Épingler',
    persUnpinFavorite: 'Désépingler',
    persFavoriteCollections: 'Collections favorites',
    persDiscoverHint: 'Essaie une histoire choisie par la mascotte',
    kidsRecentlyLoved: 'Aimées récemment',
  },
  ar: {
    persNewForYou: 'جديد لك',
    persRecentlyPlayed: 'شُوهد مؤخراً',
    persPopularWithAge: 'شائع لأطفالك في عمرك',
    persSimilarStories: 'قصص مشابهة',
    persExploreNew: 'استكشف شيئاً جديداً',
    persTodaysSurprise: 'مفاجأة اليوم',
    persBecauseFinished: 'لأنك أنهيت قصص {theme}',
    persBecauseListenedBedtime: 'لأنك استمعت لقصص ما قبل النوم',
    persLastOpened: 'آخر فتح',
    persRemaining: '{count} د متبقية',
    persFinishedBadge: 'مكتمل',
    persAchFirstStory: 'أول قصة',
    persAchFiveStories: '5 قصص',
    persAchTenStories: '10 قصص',
    persAchAnimalExplorer: 'مستكشف الحيوانات',
    persAchSpaceExplorer: 'مستكشف الفضاء',
    persAchGoodListener: 'مستمع جيد',
    persAchReadingChampion: 'بطل القراءة',
    persAchCuriousMind: 'عقل فضولي',
    persPinFavorite: 'تثبيت',
    persUnpinFavorite: 'إلغاء التثبيت',
    persFavoriteCollections: 'مجموعات مفضلة',
    persDiscoverHint: 'جرّب قصة اختارتها التميمة',
    kidsRecentlyLoved: 'أُحبت مؤخراً',
  },
};

export function persLabel(key, language = 'fr', vars = {}) {
  const lang = normalizeLanguage(language);
  let text = labels[lang]?.[key] || labels.fr[key] || labels.en[key] || key;
  Object.entries(vars).forEach(([k, v]) => {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  });
  return text;
}

/** Merge personalization labels into the app `t()` helper. */
export function withPersonalizationLabels(t, language = 'fr') {
  return (key, vars) => {
    if (labels.en[key] || labels.fr[key]) {
      return persLabel(key, language, vars || {});
    }
    return typeof t === 'function' ? t(key, vars) : key;
  };
}
