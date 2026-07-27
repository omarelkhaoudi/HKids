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
  {
    name: 'Histoires', description: 'Histoires illustrees et audio pour enfants',
    en: { name: 'Stories', description: 'Illustrated and audio stories for children' },
    ar: { name: 'قصص', description: 'قصص مصورة وصوتية للأطفال' },
  },
  {
    name: 'Comptines', description: 'Comptines et chansons douces',
    en: { name: 'Nursery Rhymes', description: 'Nursery rhymes and lullabies' },
    ar: { name: 'أناشيد', description: 'أناشيد وأغاني هادئة' },
  },
  {
    name: 'Dinosaures', description: 'Univers dinosaures',
    en: { name: 'Dinosaurs', description: 'Dinosaur universe' },
    ar: { name: 'ديناصورات', description: 'عالم الديناصورات' },
  },
  {
    name: 'Espace', description: 'Decouverte de l espace',
    en: { name: 'Space', description: 'Space discovery' },
    ar: { name: 'فضاء', description: 'اكتشاف الفضاء' },
  },
  {
    name: 'Animaux', description: 'Histoires et chansons avec les animaux',
    en: { name: 'Animals', description: 'Stories and songs with animals' },
    ar: { name: 'حيوانات', description: 'قصص وأغاني مع الحيوانات' },
  },
  {
    name: 'Spiritualite', description: 'Histoires bienveillantes sur les valeurs et la gratitude',
    en: { name: 'Spirituality', description: 'Kind stories about values and gratitude' },
    ar: { name: 'روحانيات', description: 'قصص عن القيم والامتنان' },
  },
  {
    name: 'Contes', description: 'Contes doux et classiques adaptes',
    en: { name: 'Tales', description: 'Gentle and adapted classic tales' },
    ar: { name: 'حكايات', description: 'حكايات كلاسيكية لطيفة ومعدّلة' },
  },
  {
    name: 'Livres audio', description: 'Livres racontes et aventures sonores',
    en: { name: 'Audiobooks', description: 'Narrated books and audio adventures' },
    ar: { name: 'كتب صوتية', description: 'كتب مسموعة ومغامرات صوتية' },
  },
  {
    name: 'Langues', description: 'Premiers mots, vocabulaire et prononciation',
    en: { name: 'Languages', description: 'First words, vocabulary, and pronunciation' },
    ar: { name: 'لغات', description: 'الكلمات الأولى والمفردات والنطق' },
  },
  {
    name: 'Sciences', description: 'Sciences, nature et experiences adaptees',
    en: { name: 'Science', description: 'Science, nature, and age-appropriate experiments' },
    ar: { name: 'علوم', description: 'العلوم والطبيعة وتجارب مناسبة للعمر' },
  },
  {
    name: 'Géographie', description: 'Cartes, pays, paysages et cultures',
    en: { name: 'Geography', description: 'Maps, countries, landscapes, and cultures' },
    ar: { name: 'جغرافيا', description: 'الخرائط والبلدان والتضاريس والثقافات' },
  },
  {
    name: 'Créativité', description: 'Arts, musique, imagination et expression',
    en: { name: 'Creativity', description: 'Arts, music, imagination, and expression' },
    ar: { name: 'إبداع', description: 'الفنون والموسيقى والخيال والتعبير' },
  },
  {
    name: 'Religion et valeurs', description: 'Foi, valeurs, paix et respect des traditions',
    en: { name: 'Religion and values', description: 'Faith, values, peace, and respect for traditions' },
    ar: { name: 'الدين والقيم', description: 'الإيمان والقيم والسلام واحترام التقاليد' },
  },
  {
    name: 'Personnages premium', description: 'Aventures exclusives des heros HKids',
    en: { name: 'Premium characters', description: 'Exclusive adventures with HKids heroes' },
    ar: { name: 'شخصيات مميزة', description: 'مغامرات حصرية مع أبطال HKids' },
  },
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
