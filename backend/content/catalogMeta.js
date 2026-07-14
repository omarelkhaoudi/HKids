/** Shared metadata helpers for HKids demo catalog generation. */

export const AGE_BANDS = [
  { level: '2-4', min: 2, max: 4 },
  { level: '5-7', min: 5, max: 7 },
  { level: '8-10', min: 8, max: 10 },
];

export const GRADIENTS = [
  ['#7b3eb8', '#389d85'],
  ['#1e3a8a', '#7b3eb8'],
  ['#f76219', '#fbbf24'],
  ['#ec4899', '#8b5cf6'],
  ['#db2777', '#7b3eb8'],
  ['#389d85', '#34d399'],
  ['#dc2626', '#f97316'],
  ['#2563eb', '#06b6d4'],
  ['#7c3aed', '#a855f7'],
  ['#312e81', '#6366f1'],
  ['#92400e', '#d97706'],
  ['#059669', '#10b981'],
  ['#f59e0b', '#f76219'],
  ['#0f766e', '#14b8a6'],
  ['#be185d', '#f472b6'],
];

export const BOOK_CATEGORIES = [
  ['Histoires', 'Histoires illustrees et audio pour enfants'],
  ['Comptines', 'Comptines et chansons douces'],
  ['Dinosaures', 'Univers dinosaures'],
  ['Espace', 'Decouverte de l espace'],
  ['Animaux', 'Histoires et chansons avec les animaux'],
  ['Spiritualite', 'Histoires bienveillantes sur les valeurs et la gratitude'],
  ['Contes', 'Contes doux et classiques adaptes'],
];

export function pickGradient(index) {
  return GRADIENTS[index % GRADIENTS.length];
}

export function buildTags({ level, theme, extra = [], difficulty, editorial = [] }) {
  const tags = [`level:${level}`, theme, ...extra, ...editorial].filter(Boolean);
  if (difficulty) tags.push(`difficulty:${difficulty}`);
  return [...new Set(tags)];
}

export function buildLocalizations({ titleFr, descFr, titleEn, descEn, titleAr, descAr, audioFr, audioEn, audioAr }) {
  const localizations = {};
  if (titleEn) {
    localizations.en = {
      title: titleEn,
      description: descEn || descFr,
      ...(audioEn ? { audio_text: audioEn } : {}),
    };
  }
  if (titleAr) {
    localizations.ar = {
      title: titleAr,
      description: descAr || descFr,
      ...(audioAr ? { audio_text: audioAr } : {}),
    };
  }
  if (audioFr && !localizations.fr) {
    // base language handled separately
  }
  return localizations;
}

export function cycleAgeBand(index) {
  return AGE_BANDS[index % AGE_BANDS.length];
}
