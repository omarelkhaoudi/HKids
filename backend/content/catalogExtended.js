import { buildLocalizations, buildTags, cycleAgeBand, pickGradient } from './catalogMeta.js';

const AUTHOR = 'Le Lit Qui Lit';

function audioStoryItem(index, config) {
  const age = cycleAgeBand(index);
  const slug = config.slug || `audio-${String(index + 1).padStart(2, '0')}-${config.theme}`;
  return {
    slug,
    title: config.title,
    author: AUTHOR,
    description: config.description || `Une histoire audio douce pour ${age.level} ans.`,
    content_type: config.content_type || 'audio_story',
    language: 'fr',
    theme: config.theme,
    category_name: config.category_name || 'Histoires',
    age_group_min: config.age_min ?? age.min,
    age_group_max: config.age_max ?? age.max,
    emoji: config.emoji,
    gradient: config.gradient || pickGradient(index),
    audio_text: config.audio_text,
    duration_seconds: config.duration_seconds || 12,
    tags: config.tags || buildTags({
      level: age.level,
      theme: config.theme,
      extra: config.extraTags || [],
      difficulty: config.difficulty || 'easy',
      editorial: config.editorial || [],
    }),
    is_recommended: Boolean(config.is_recommended),
    is_popular: Boolean(config.is_popular),
    is_new: Boolean(config.is_new),
    localizations: buildLocalizations({
      titleEn: config.titleEn,
      descEn: config.descEn,
      titleAr: config.titleAr,
      descAr: config.descAr,
      audioEn: config.audioEn,
      audioAr: config.audioAr,
    }),
  };
}

const AUDIO_STORY_DEFS = [
  { title: 'Le dino qui murmure', theme: 'dinosaurs', emoji: '🦖', category_name: 'Dinosaures', audio_text: 'Petit dino au coeur doux, tu es courageux ce soir. Ferme les yeux, respire, tout va bien.' },
  { title: 'La fusee des reves', theme: 'space', emoji: '🚀', category_name: 'Espace', audio_text: 'La fusee vole parmi les etoiles. Chaque lumiere est un reve qui t attend.' },
  { title: 'Mimi chat et la lune', theme: 'animals', emoji: '🐱', category_name: 'Animaux', audio_text: 'Mimi chat regarde la lune. Elle ronronne doucement. Bonne nuit petit chat.' },
  { title: 'La princesse des etoiles', theme: 'princesses', emoji: '👸', category_name: 'Histoires', audio_text: 'La princesse tisse des etoiles dans le ciel. Elle veille sur ton sommeil.' },
  { title: 'Sami le pompier', theme: 'jobs', emoji: '🚒', category_name: 'Histoires', audio_text: 'Sami aide avec gentillesse. Il protege tout le monde. Bravo petit heros.' },
  { title: 'Le bateau des decouvertes', theme: 'world', emoji: '🌍', category_name: 'Contes', audio_text: 'Le bateau traverse les mers calmes. Chaque ile est une nouvelle amitie.' },
  { title: 'Foret enchantee', theme: 'nature', emoji: '🌲', category_name: 'Contes', audio_text: 'Les arbres murmurent une berceuse. Les feuilles dansent au vent doux.' },
  { title: 'Les amis du jardin', theme: 'animals', emoji: '🐰', category_name: 'Animaux', audio_text: 'Lapin, herisson et oiseau partagent le gouter. Ils rient ensemble.' },
  { title: 'Le robot curieux', theme: 'world', emoji: '🤖', category_name: 'Histoires', audio_text: 'Le petit robot apprend a sourire. Il decouvre que l amitie est magique.' },
  { title: 'La fee du sommeil', theme: 'princesses', emoji: '🧚', category_name: 'Histoires', audio_text: 'La fee du sommeil pose des paillettes dorees sur tes paupieres.' },
  { title: 'Le pirate gentil', theme: 'world', emoji: '🏴‍☠️', category_name: 'Contes', audio_text: 'Le pirate partage son tresor de rires. Sa carte mene aux reves bleus.' },
  { title: 'Nuages tout doux', theme: 'nature', emoji: '☁️', category_name: 'Histoires', audio_text: 'Les nuages sont des oreillers geants. Pose ta tete et flotte tout doux.' },
  { title: 'Le train des couleurs', theme: 'colors', emoji: '🌈', category_name: 'Histoires', audio_text: 'Rouge, bleu, jaune, vert. Le train des couleurs s endort au terminus.' },
  { title: 'Compte les lucioles', theme: 'numbers', emoji: '✨', category_name: 'Histoires', audio_text: 'Une, deux, trois lucioles brillent. Quatre, cinq, six etoiles dansent.' },
  { title: 'ABC du ciel', theme: 'alphabet', emoji: '🔤', category_name: 'Histoires', audio_text: 'A comme Astre, B comme Brise, C comme Calme. Bonne nuit alphabet.' },
  { title: 'Le dragon qui peint', theme: 'dinosaurs', emoji: '🐉', category_name: 'Dinosaures', audio_text: 'Le dragon peint des arcs-en-ciel. Chaque couleur est un bisou du soir.' },
  { title: 'L astronaute timide', theme: 'space', emoji: '👨‍🚀', category_name: 'Espace', audio_text: 'L astronaute timide decouvre sa lumiere interieure. Il brille tres fort.' },
  { title: 'La tortue patiente', theme: 'animals', emoji: '🐢', category_name: 'Animaux', audio_text: 'La tortue avance doucement. Elle sait que demain sera beau.' },
  { title: 'Le chateau de sable', theme: 'princesses', emoji: '🏰', category_name: 'Contes', audio_text: 'Un chateau de sable au bord de la mer. Les vagues chantent une berceuse.' },
  { title: 'Le marchand de sourires', theme: 'world', emoji: '😊', category_name: 'Contes', audio_text: 'Le marchand offre des sourires gratuits. Prends-en un pour ce soir.' },
  { title: 'La riviere qui chante', theme: 'nature', emoji: '💧', category_name: 'Histoires', audio_text: 'La riviere chante plouf plouf. Les poissons dansent sous la lune.' },
  { title: 'Le loup et la lumiere', theme: 'world', emoji: '🐺', category_name: 'Contes', audio_text: 'Le loup trouve une lanterne chaude. Il guide les petits vers le sommeil.' },
  { title: 'La licorne reveuse', theme: 'princesses', emoji: '🦄', category_name: 'Histoires', audio_text: 'La licorne reveuse galope sur les nuages roses. Elle t emmene au pays calme.' },
  { title: 'Le petit train du soir', theme: 'jobs', emoji: '🚂', category_name: 'Histoires', audio_text: 'Le train du soir traverse la campagne. Tchou tchou, dodo les voyageurs.' },
  { title: 'Les pingouins rigolos', theme: 'animals', emoji: '🐧', category_name: 'Animaux', audio_text: 'Les pingouins glissent sur la glace. Ils applaudissent la nuit etoilee.' },
  { title: 'La planete des bisous', theme: 'space', emoji: '🪐', category_name: 'Espace', audio_text: 'Sur la planete des bisous, tout le monde dit bonne nuit en souriant.' },
  { title: 'Le jardin secret', theme: 'nature', emoji: '🌷', category_name: 'Histoires', audio_text: 'Dans le jardin secret, les fleurs ferment leurs petales. Silence et douceur.' },
];

const COMPTINE_DEFS = [
  { title: 'Pomme et poire', emoji: '🍎', theme: 'rhymes', audio_text: 'Pomme et poire, poire et pomme, dans mon panier tout est bon.' },
  { title: 'Petit canard', emoji: '🦆', theme: 'animals', audio_text: 'Coin coin dit le canard, il nage dans l etang tout doux.' },
  { title: 'Les roues du bus', emoji: '🚌', theme: 'rhymes', audio_text: 'Les roues du bus tournent, tournent, tournent, dans la ville calme.' },
  { title: 'Mon petit lapin', emoji: '🐇', theme: 'animals', audio_text: 'Mon petit lapin saute saute saute, dans le jardin vert.' },
  { title: 'Pluie et arc-en-ciel', emoji: '🌧️', theme: 'colors', audio_text: 'Pluie fine, arc-en-ciel, rouge bleu jaune, quel beau soleil.' },
  { title: 'Bateau sur l eau', emoji: '⛵', theme: 'world', audio_text: 'Bateau sur l eau, il danse, il danse, au rythme des vagues.' },
  { title: 'Les cinq doigts', emoji: '🖐️', theme: 'numbers', audio_text: 'Pouce, index, majeur, annulaire, auriculaire, cinq doigts joyeux.' },
  { title: 'La poule pon pon', emoji: '🐔', theme: 'animals', audio_text: 'La poule fait pon pon, le coq fait cocorico, bonjour la ferme.' },
  { title: 'Danse des etoiles', emoji: '⭐', theme: 'space', audio_text: 'Les etoiles dansent une, deux, trois, tourne tourne petit bras.' },
  { title: 'Bonjour les fleurs', emoji: '🌸', theme: 'nature', audio_text: 'Bonjour les fleurs, bonjour le vent, bonjour le jardin enchante.' },
  { title: 'Le petit poisson', emoji: '🐠', theme: 'animals', audio_text: 'Nage nage petit poisson, dans l eau claire et bleue.' },
  { title: 'Tap tap les mains', emoji: '👏', theme: 'rhymes', audio_text: 'Tap tap les mains, clap clap les mains, on fait la fete ensemble.' },
  { title: 'La vache meuh', emoji: '🐄', theme: 'animals', audio_text: 'La vache fait meuh, le mouton beee, la ferme chante doucement.' },
  { title: 'Vent et feuilles', emoji: '🍃', theme: 'nature', audio_text: 'Le vent souffle, les feuilles dansent, chuuuut, tout se repose.' },
  { title: 'Mon ami le soleil', emoji: '☀️', theme: 'rhymes', audio_text: 'Mon ami le soleil se couche, bonne nuit, a demain matin.' },
  { title: 'Les abeilles', emoji: '🐝', theme: 'animals', audio_text: 'Bzzz bzzz les abeilles, butinent les fleurs du matin.' },
  { title: 'Comptine des formes', emoji: '🔺', theme: 'shapes', audio_text: 'Rond comme le soleil, carre comme la fenetre, triangle comme la montagne.' },
  { title: 'La berceuse du loup', emoji: '🌙', theme: 'rhymes', audio_text: 'Dodo loup gentil, la lune veille, les etoiles brillent pour toi.' },
  { title: 'Chanson du marche', emoji: '🛒', theme: 'world', audio_text: 'Au marche on chante, pommes poires et sourires partout.' },
];

const RELIGIOUS_DEFS = [
  { title: 'La gratitude du soir', audio_text: 'Merci pour cette belle journee. Merci pour les gens qui m aiment. Bonne nuit.' },
  { title: 'Noe et les animaux', audio_text: 'Noe accueille chaque animal avec amour. L arche est un refuge de paix.' },
  { title: 'Le partage du pain', audio_text: 'Partager rend le coeur leger. Un morceau pour toi, un morceau pour moi.' },
  { title: 'La lumiere dans la nuit', audio_text: 'Quand il fait noir, une petite lumiere guide nos pas avec douceur.' },
  { title: 'Jonas et la baleine', audio_text: 'Jonas apprend a ecouter et a faire confiance. La mer l berce calmement.' },
  { title: 'Les valeurs du jardin', audio_text: 'Dans le jardin, on seme la gentillesse. Elle pousse comme une fleur.' },
  { title: 'Le berger attentif', audio_text: 'Le bon berger veille sur chaque brebis. Personne n est oublie.' },
  { title: 'La patience de Joseph', audio_text: 'Joseph attend avec courage. Chaque jour apporte un nouveau cadeau.' },
  { title: 'Merci maman merci papa', audio_text: 'Merci pour les calins, merci pour les histoires, merci pour l amour.' },
  { title: 'Les anges veillent', audio_text: 'Les anges veillent sur ton sommeil. Tu es protege et aime.' },
];

export function buildExtendedAudioStories() {
  return AUDIO_STORY_DEFS.map((def, index) => audioStoryItem(index, {
    ...def,
    slug: `audio-${def.theme}-${String(index + 1).padStart(2, '0')}`,
    is_recommended: index % 7 === 0,
    is_popular: index % 5 === 0,
    is_new: index % 9 === 0,
  }));
}

export function buildExtendedComptines() {
  return COMPTINE_DEFS.map((def, index) => {
    const age = cycleAgeBand(index + 2);
    return audioStoryItem(index + 40, {
      ...def,
      slug: `comptine-${String(index + 1).padStart(2, '0')}`,
      content_type: 'song',
      category_name: 'Comptines',
      is_popular: index % 4 === 0,
      is_new: index % 6 === 0,
      tags: buildTags({
        level: age.level,
        theme: def.theme,
        extra: ['comptine', 'rhyme', 'song'],
        difficulty: 'easy',
      }),
    });
  });
}

export function buildReligiousStories() {
  return RELIGIOUS_DEFS.map((def, index) => {
    const age = cycleAgeBand(index + 1);
    return audioStoryItem(index + 60, {
      ...def,
      slug: `spiritual-${String(index + 1).padStart(2, '0')}`,
      theme: 'spiritual',
      category_name: 'Spiritualite',
      emoji: '🕊️',
      extraTags: ['religious', 'values', 'bedtime'],
      is_recommended: index % 2 === 0,
    });
  });
}

export function buildExtendedCatalog() {
  return [
    ...buildExtendedAudioStories(),
    ...buildExtendedComptines(),
    ...buildReligiousStories(),
  ];
}
