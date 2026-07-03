const openings = {
  fr: 'Un soir tres doux,',
  en: 'On a gentle evening,',
  ar: 'في مساء هادئ،'
};

const valueLessons = {
  courage: {
    fr: 'Le courage commence souvent par un petit pas.',
    en: 'Courage often starts with one small step.',
    ar: 'الشجاعة تبدأ غالبا بخطوة صغيرة.'
  },
  friendship: {
    fr: 'Les amis deviennent plus forts quand ils s ecoutent.',
    en: 'Friends grow stronger when they listen to each other.',
    ar: 'الاصدقاء يصبحون اقوى عندما يستمعون لبعضهم.'
  },
  respect: {
    fr: 'Respecter les autres rend l aventure plus belle.',
    en: 'Respect makes every adventure brighter.',
    ar: 'الاحترام يجعل كل مغامرة اجمل.'
  },
  curiosity: {
    fr: 'La curiosite ouvre des portes que personne ne voyait.',
    en: 'Curiosity opens doors no one else could see.',
    ar: 'الفضول يفتح ابوابا لا يراها احد.'
  }
};

function pickLanguage(language) {
  return ['fr', 'en', 'ar'].includes(language) ? language : 'fr';
}

function pickLesson(value, language) {
  const key = valueLessons[value] ? value : 'curiosity';
  return valueLessons[key][language] || valueLessons[key].fr;
}

function joinCharacters(characters, fallback) {
  if (!Array.isArray(characters) || characters.length === 0) return fallback;
  return characters.slice(0, 4).join(', ');
}

export class MockStoryGenerationProvider {
  async generate({ kid, preferences }) {
    const language = pickLanguage(kid.preferred_language || preferences.language);
    const name = kid.name || 'petit lecteur';
    const age = kid.age ? `${kid.age} ans` : 'son age';
    const theme = preferences.theme || 'aventure douce';
    const characters = joinCharacters(preferences.characters, 'un ami lumineux');
    const duration = Math.max(2, Math.min(15, Number(preferences.estimated_duration_minutes || 5)));
    const lesson = pickLesson(preferences.educational_value, language);
    const interests = Array.isArray(kid.interests) && kid.interests.length > 0
      ? kid.interests.join(', ')
      : 'les histoires du soir';

    const title = language === 'en'
      ? `${name} and the ${theme}`
      : language === 'ar'
      ? `${name} ومغامرة ${theme}`
      : `${name} et le secret ${theme}`;

    const paragraphs = language === 'en'
      ? [
          `${openings.en} ${name}, who was ${age}, heard a tiny sound near the bed.`,
          `With ${characters}, the child followed a glowing path about ${theme}. The path used things ${name} already loved: ${interests}.`,
          `The adventure stayed calm, clear, and just long enough for about ${duration} minutes of reading.`,
          `${lesson} ${name} smiled, took a deep breath, and kept the story safe for another night.`
        ]
      : language === 'ar'
      ? [
          `${openings.ar} سمع ${name} صوتا صغيرا قرب السرير.`,
          `مع ${characters}، بدأ ${name} مغامرة عن ${theme}، وفيها اشياء يحبها مثل ${interests}.`,
          `كانت القصة هادئة ومناسبة لعمره، وتدوم حوالي ${duration} دقائق.`,
          `${lesson} ابتسم ${name} وحفظ الحكاية لقلبه.`
        ]
      : [
          `${openings.fr} ${name}, qui avait ${age}, entendit un petit bruit pres de son lit.`,
          `Avec ${characters}, ${name} suivit un chemin brillant autour du theme: ${theme}. Sur le chemin, il retrouva ce qu il aimait deja: ${interests}.`,
          `L aventure resta douce, claire et adaptee a son age, avec une duree d environ ${duration} minutes.`,
          `${lesson} Alors ${name} sourit, respira calmement et garda cette histoire pour les prochains soirs.`
        ];

    return {
      title,
      story_text: paragraphs.join('\n\n'),
      provider_metadata: {
        provider: 'mock',
        model: 'mock-story-v1'
      }
    };
  }
}
