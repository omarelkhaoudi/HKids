/** Visual hints for AI-generated children's book cover illustrations. */

const THEME_HINTS = {
  dinosaurs: 'friendly cartoon dinosaurs in a prehistoric meadow, soft greens and earth tones',
  space: 'a child astronaut or rocket among stars and a gentle moon, deep blue and purple sky',
  animals: 'cute woodland animals in a cozy natural setting, warm and playful',
  princesses: 'a kind princess in a magical fairytale castle garden, sparkles and pastel pinks',
  spiritual: 'gentle light, stars, hands in prayer or angels, peaceful golden glow, serene night',
  nature: 'trees, flowers, sunshine and a calm meadow, fresh greens and sky blue',
  colors: 'rainbow shapes, paint splashes and color blocks, cheerful primary colors',
  numbers: 'friendly numbers as characters, playful counting scene, bright educational style',
  alphabet: 'letters and books in a whimsical classroom, playful typography elements',
  jobs: 'a child hero in a uniform (firefighter, doctor, etc.), inspiring and kind',
  world: 'globe, map or travel adventure, diverse friendly characters',
  rhymes: 'musical notes, singing animals or children clapping, joyful rhythm',
  fairytales: 'classic fairytale elements, castle, forest path, storybook magic',
  default: 'a cozy bedtime story scene, warm lamp light and soft clouds',
};

const CONTENT_TYPE_HINTS = {
  song: 'musical comptine for toddlers, sing-along mood, instruments and happy motion',
  audio_story: 'bedtime audio story mood, calm stars and a listening child silhouette',
  story: 'illustrated picture book cover, one clear focal character',
};

export function buildCoverIllustrationPrompt(item, { compact = false } = {}) {
  const themeHint = THEME_HINTS[item.theme] || THEME_HINTS.default;
  const typeHint = CONTENT_TYPE_HINTS[item.content_type] || CONTENT_TYPE_HINTS.story;
  const title = String(item.title || 'children story').trim();

  if (compact) {
    return [
      `Children book cover: ${title}.`,
      themeHint.split(',')[0] + '.',
      'Watercolor, kid-safe, cozy, no text.',
    ].join(' ');
  }

  const description = String(item.description || '').trim();

  return [
    `Children's book cover illustration for "${title}".`,
    themeHint + '.',
    typeHint + '.',
    description ? `Story mood: ${description}.` : '',
    'Soft watercolor and gouache style, rounded shapes, kid-safe, wholesome, no scary elements.',
    'Portrait composition 4:5, single scene, rich details, professional picture book quality.',
    'No text, no letters, no words, no watermark, no logo, no frame.',
  ].filter(Boolean).join(' ');
}
