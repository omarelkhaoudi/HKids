/**
 * HKids Sprint 45 — Premium catalog expansion (~110 original titles).
 * Original French prose with EN/AR localizations.
 */
import { buildLocalizations, buildTags } from './catalogMeta.js';

const AUTHOR = 'Le Lit Qui Lit';

const CATEGORY = {
  dinosaurs: 'Dinosaures',
  space: 'Espace',
  animals: 'Animaux',
  princesses: 'Contes',
  bedtime: 'Histoires',
  spirituality: 'Spiritualite',
  ocean: 'Contes',
  vehicles: 'Histoires',
  world: 'Contes',
  colors: 'Histoires',
  rhymes: 'Comptines',
  alphabet: 'Histoires',
  numbers: 'Histoires',
  jobs: 'Histoires',
};

const GRADIENTS = [
  ['#7b3eb8', '#389d85'], ['#1e3a8a', '#7b3eb8'], ['#f76219', '#fbbf24'],
  ['#ec4899', '#8b5cf6'], ['#db2777', '#7b3eb8'], ['#389d85', '#34d399'],
  ['#dc2626', '#f97316'], ['#2563eb', '#06b6d4'], ['#7c3aed', '#a855f7'],
  ['#312e81', '#6366f1'], ['#92400e', '#d97706'], ['#059669', '#10b981'],
  ['#f59e0b', '#f76219'], ['#0f766e', '#14b8a6'], ['#be185d', '#f472b6'],
  ['#0ea5e9', '#38bdf8'], ['#65a30d', '#a3e635'], ['#ea580c', '#fb923c'],
];

/** Compact tuple builder — see DEFS below. */
function book(index, d) {
  const type = d.type || 'story';
  const level = `${d.min}-${d.max}`;
  const flags = d.flags || '';
  const item = {
    slug: d.slug,
    title: d.titleFr,
    author: AUTHOR,
    description: d.descFr,
    content_type: type,
    language: 'fr',
    theme: d.theme,
    category_name: CATEGORY[d.theme],
    age_group_min: d.min,
    age_group_max: d.max,
    emoji: d.emoji,
    gradient: GRADIENTS[index % GRADIENTS.length],
    pages: d.pages.map((text) => ({ text })),
    tags: buildTags({
      level,
      theme: d.theme,
      extra: d.extraTags || [],
      difficulty: 'easy',
    }),
    is_recommended: flags.includes('rec'),
    is_popular: flags.includes('pop'),
    is_new: flags.includes('new'),
    localizations: buildLocalizations({
      titleEn: d.titleEn,
      descEn: d.descEn,
      titleAr: d.titleAr,
      descAr: d.descAr,
      audioEn: d.audioEn,
      audioAr: d.audioAr,
    }),
  };
  if (type === 'audio_story' || type === 'song') {
    item.audio_text = d.audioFr;
    item.duration_seconds = d.duration ?? 12;
  }
  return item;
}

const DEFS = [
  {
    "slug": "prem-herisson-courageux",
    "theme": "animals",
    "min": 3,
    "max": 5,
    "emoji": "🦔",
    "titleFr": "Le hérisson courageux",
    "descFr": "Un petit hérisson apprend à demander de l'aide.",
    "titleEn": "The brave little hedgehog",
    "descEn": "A little hedgehog learns to ask for help.",
    "titleAr": "القنفذ الشجاع",
    "descAr": "قنفذ صغير يتعلم طلب المساعدة.",
    "pages": [
      "Hérisson roux sort du buisson avec son panier de feuilles.",
      "Il croise un fossé trop large pour ses petites pattes.",
      "Un écureuil tend une branche. « On traverse ensemble », dit-il.",
      "Hérisson sourit. Demander de l'aide, c'est aussi être courageux.",
      "Ils partagent une noisette au soleil. L'amitié réchauffe les piquants."
    ],
    "flags": "rec"
  },
  {
    "slug": "prem-emma-jardin-lune",
    "theme": "animals",
    "min": 4,
    "max": 7,
    "emoji": "🐰",
    "titleFr": "Emma et le jardin de la lune",
    "descFr": "Emma suit un lapin blanc jusqu'à un jardin argenté.",
    "titleEn": "Emma and the moon garden",
    "descEn": "Emma follows a white rabbit to a silver garden.",
    "titleAr": "إيما وحديقة القمر",
    "descAr": "إيما تتبع أرنباً أبيض إلى حديقة فضية.",
    "pages": [
      "Emma chausse ses bottes jaunes et suit un lapin blanc.",
      "Le jardin de la lune sent la menthe et la rosée.",
      "Des fleurs s'ouvrent seulement la nuit, toutes douces.",
      "Emma arrose une pousse. Le lapin tape des pattes pour l'applaudir.",
      "Elle rentre, les poches pleines d'étoiles imaginaires. Bonne nuit, jardin."
    ],
    "flags": "pop"
  },
  {
    "slug": "prem-ours-miel",
    "theme": "animals",
    "min": 2,
    "max": 4,
    "emoji": "🐻",
    "titleFr": "L'ours qui partageait son miel",
    "descFr": "Un ours gourmand découvre que partager rend le miel plus doux.",
    "titleEn": "The bear who shared his honey",
    "descEn": "A hungry bear learns sharing makes honey sweeter.",
    "titleAr": "الدب الذي يشارك عسله",
    "descAr": "دب شره يكتشف أن المشاركة تجعل العسل أحلى.",
    "pages": [
      "Petit Ours trouve un pot de miel doré derrière le chêne.",
      "Deux abeilles buzzent : « C'est aussi notre travail ! »",
      "Il pose trois cuillères : une pour lui, une pour elles, une pour un oisillon.",
      "Le miel a un goût de soleil partagé.",
      "Ils font la sieste ensemble sous les feuilles tièdes."
    ],
    "flags": "new"
  },
  {
    "slug": "prem-renard-etoile",
    "theme": "animals",
    "min": 5,
    "max": 8,
    "emoji": "🦊",
    "titleFr": "Le renard et l'étoile perdue",
    "descFr": "Un renard rusé aide une étoile tombée à retrouver le ciel.",
    "titleEn": "The fox and the lost star",
    "descEn": "A clever fox helps a fallen star return to the sky.",
    "titleAr": "الثعلب والنجمة الضائعة",
    "descAr": "ثعلب ماكر يساعد نجمة ساقطة على العودة للسماء.",
    "pages": [
      "Une petite étoile glisse dans la neige près du terrier.",
      "Renard la chauffe entre ses pattes, sans la briser.",
      "Il grimpe la colline et souffle doucement vers le firmament.",
      "L'étoile reprend sa place. Renard lève le museau, fier.",
      "La nuit brille plus fort. Même les rusés ont un cœur tendre."
    ],
    "flags": "",
    "type": "audio_story",
    "audioFr": "Petite étoile perdue, le renard te porte vers le ciel. Brille doucement, la nuit t'accueille.",
    "audioEn": "Little lost star, the fox carries you to the sky. Shine gently, the night welcomes you.",
    "audioAr": "أيتها النجمة الضائعة، الثعلب يحملك إلى السماء. تألقي بلطف، الليل يرحب بك."
  },
  {
    "slug": "prem-chat-bibliotheque",
    "theme": "animals",
    "min": 4,
    "max": 7,
    "emoji": "🐱",
    "titleFr": "Le chat qui aimait les livres",
    "descFr": "Moka le chat découvre que chaque livre est une porte.",
    "titleEn": "The cat who loved books",
    "descEn": "Moka the cat discovers every book is a doorway.",
    "titleAr": "القطة التي تحب الكتب",
    "descAr": "موكا القطة تكتشف أن كل كتاب باب.",
    "pages": [
      "Moka se glisse entre les rayons de la bibliothèque.",
      "Elle ouvre un livre avec la patte : une forêt apparaît.",
      "Puis un océan, puis un château. Ses yeux brillent.",
      "La bibliothécaire sourit. « Les chats lecteurs sont les bienvenus. »",
      "Moka s'endort sur un coussin, le museau dans les pages."
    ],
    "flags": "rec"
  },
  {
    "slug": "prem-abeille-danse",
    "theme": "animals",
    "min": 3,
    "max": 6,
    "emoji": "🐝",
    "titleFr": "L'abeille qui dansait",
    "descFr": "Une abeille timide apprend une danse pour guider ses amies.",
    "titleEn": "The bee who danced",
    "descEn": "A shy bee learns a dance to guide her friends.",
    "titleAr": "النحلة الراقصة",
    "descAr": "نحلة خجولة تتعلم رقصة لإرشاد صديقاتها.",
    "pages": [
      "Buzzia vole trop bas. Elle a peur des grandes fleurs.",
      "Une vieille abeille lui montre des pas : droite, cercle, zigzag.",
      "Buzzia répète. Ses ailes vibrent de joie.",
      "Elle guide la ruche vers le meilleur nectar.",
      "Le soir, la ruche bourdonne une berceuse de miel."
    ],
    "flags": ""
  },
  {
    "slug": "prem-loup-doudou",
    "theme": "animals",
    "min": 2,
    "max": 5,
    "emoji": "🐺",
    "titleFr": "Le loup et son doudou",
    "descFr": "Même les loups ont besoin de câlins avant de dormir.",
    "titleEn": "The wolf and his soft toy",
    "descEn": "Even wolves need cuddles before bedtime.",
    "titleAr": "الذئب ودميته",
    "descAr": "حتى الذئاب تحتاج احتضاناً قبل النوم.",
    "pages": [
      "Petit Loup cache son doudou sous la couette.",
      "Il croit que les grands loups ne dorment jamais avec un jouet.",
      "Maman Loup sort son vieux foulard usé. « Moi aussi j'ai un doudou. »",
      "Ils se blottissent. La forêt devient un berceau.",
      "Bonne nuit, petit loup. Ton courage tient aussi dans un câlin."
    ],
    "flags": "pop"
  },
  {
    "slug": "prem-dauphin-ami",
    "theme": "animals",
    "min": 4,
    "max": 7,
    "emoji": "🐬",
    "titleFr": "Le dauphin ami",
    "descFr": "Iris le dauphin aide un enfant perdu près du rivage.",
    "titleEn": "The friendly dolphin",
    "descEn": "Iris the dolphin helps a child lost near the shore.",
    "titleAr": "الدلفين الصديق",
    "descAr": "إيريس الدلفين يساعد طفلاً تائهاً قرب الشاطئ.",
    "pages": [
      "Iris saute hors de l'eau turquoise.",
      "Un enfant crie sur le sable. Il a perdu son bateau jouet.",
      "Iris le pousse vers la vague avec son museau.",
      "Le bateau revient. L'enfant rit et salue.",
      "Iris plonge, heureux. L'océan aime les gestes gentils."
    ],
    "flags": ""
  },
  {
    "slug": "prem-hibou-questions",
    "theme": "animals",
    "min": 5,
    "max": 8,
    "emoji": "🦉",
    "titleFr": "Le hibou aux cent questions",
    "descFr": "Un hibou curieux apprend qu'on peut aussi écouter.",
    "titleEn": "The owl with a hundred questions",
    "descEn": "A curious owl learns that listening matters too.",
    "titleAr": "البومة ذات المئة سؤال",
    "descAr": "بومة فضولية تتعلم أن الاستماع مهم أيضاً.",
    "pages": [
      "Hibou pose cent questions avant le petit-déjeuner.",
      "Ses amis se fatiguent. Il se tait, un peu triste.",
      "Il écoute le vent, le ruisseau, le silence.",
      "Il découvre des réponses qu'il n'aurait jamais entendues en parlant.",
      "Le soir, il pose une seule question douce : « Comment vas-tu ? »"
    ],
    "flags": "new"
  },
  {
    "slug": "prem-tortue-course",
    "theme": "animals",
    "min": 3,
    "max": 6,
    "emoji": "🐢",
    "titleFr": "La tortue qui prenait son temps",
    "descFr": "Lila la tortue gagne une course… en allant doucement.",
    "titleEn": "The turtle who took her time",
    "descEn": "Lila the turtle wins a race by going gently.",
    "titleAr": "السلحفاة التي تأخذ وقتها",
    "descAr": "ليلا السلحفاة تفوز بالسباق بلطف.",
    "pages": [
      "Les lièvres partent en flèche. Lila avance pas à pas.",
      "Elle salue les fleurs, boit une goutte de rosée.",
      "Les lièvres s'épuisent à courir en rond.",
      "Lila arrive au ruban, souriante et calme.",
      "Prendre son temps, c'est aussi une façon de gagner."
    ],
    "flags": ""
  },
  {
    "slug": "prem-dino-livres",
    "theme": "dinosaurs",
    "min": 4,
    "max": 7,
    "emoji": "📚",
    "titleFr": "Le dragon qui aimait les livres",
    "descFr": "Un dragon découvre que les histoires calment son feu.",
    "titleEn": "The dragon who loved books",
    "descEn": "A dragon finds stories calm his fire.",
    "titleAr": "التنين الذي يحب الكتب",
    "descAr": "تنين يكتشف أن القصص تهدئ ناره.",
    "pages": [
      "Drako crache des étincelles quand il s'énerve.",
      "La bibliothécaire lui offre un livre épais.",
      "Il lit. Son feu devient une lueur chaude et douce.",
      "Les enfants s'assoient près de lui sans peur.",
      "Drako range son livre sous l'aile. Demain, un autre chapitre."
    ],
    "flags": "rec"
  },
  {
    "slug": "prem-t-rex-timide",
    "theme": "dinosaurs",
    "min": 3,
    "max": 5,
    "emoji": "🦖",
    "titleFr": "Le T-Rex timide",
    "descFr": "Un grand dinosaure apprend à dire bonjour.",
    "titleEn": "The shy T-Rex",
    "descEn": "A big dinosaur learns to say hello.",
    "titleAr": "التي-ريكس الخجول",
    "descAr": "ديناصور كبير يتعلم قول مرحبا.",
    "pages": [
      "Rex cache sa tête derrière une fougère.",
      "Un petit dino lui sourit : « Salut ! »",
      "Rex murmure « salut » d'une voix de tonnerre… tout doux.",
      "Ils jouent à cache-cache entre les rochers.",
      "Rex n'a plus peur. Dire bonjour ouvre les portes."
    ],
    "flags": ""
  },
  {
    "slug": "prem-stego-etoiles",
    "theme": "dinosaurs",
    "min": 5,
    "max": 8,
    "emoji": "⭐",
    "titleFr": "Le stégosaure et les étoiles",
    "descFr": "Sam compte les plaques de son dos comme des étoiles.",
    "titleEn": "The stegosaurus and the stars",
    "descEn": "Sam counts the plates on his back like stars.",
    "titleAr": "الستيغوصور والنجوم",
    "descAr": "سام يعد الصفائح على ظهره كالنجوم.",
    "pages": [
      "Sam lève les yeux. Le ciel est plein de points brillants.",
      "Il compte ses plaques : une, deux, trois…",
      "Chaque plaque raconte une aventure du jour.",
      "Il s'endort sous la Voie lactée préhistorique.",
      "Bonne nuit, Sam. Tes étoiles veillent."
    ],
    "flags": "pop"
  },
  {
    "slug": "prem-ptero-vent",
    "theme": "dinosaurs",
    "min": 4,
    "max": 7,
    "emoji": "🪶",
    "titleFr": "Le ptérodactyle et le vent",
    "descFr": "Pia apprend à faire confiance au vent.",
    "titleEn": "The pterodactyl and the wind",
    "descEn": "Pia learns to trust the wind.",
    "titleAr": "التيروداكتيل والريح",
    "descAr": "بيا تتعلم الثقة بالريح.",
    "pages": [
      "Pia a peur de déployer ses ailes.",
      "Le vent murmure : « Je te porterai. »",
      "Elle saute. L'air la soulève comme une berceuse.",
      "Elle plane au-dessus de la vallée, légère.",
      "Atterrir n'est plus un souci. Le vent est un ami."
    ],
    "flags": ""
  },
  {
    "slug": "prem-triceratops-amis",
    "theme": "dinosaurs",
    "min": 3,
    "max": 6,
    "emoji": "🦕",
    "titleFr": "Les trois cornes de l'amitié",
    "descFr": "Trois tricératops apprennent à résoudre un conflit.",
    "titleEn": "The three horns of friendship",
    "descEn": "Three triceratops learn to resolve a conflict.",
    "titleAr": "القرون الثلاثة للصداقة",
    "descAr": "ثلاثة تريسيراتوبس يتعلمون حل خلاف.",
    "pages": [
      "Trois amis se disputent pour une pomme.",
      "Chacun veut la plus rouge.",
      "Ils la coupent en trois parts égales.",
      "Ils rient. La pomme a meilleur goût partagée.",
      "Leurs cornes se touchent en signe de paix."
    ],
    "flags": "new"
  },
  {
    "slug": "prem-dino-nuit",
    "theme": "dinosaurs",
    "min": 2,
    "max": 4,
    "emoji": "🌙",
    "titleFr": "Bonne nuit, petit dino",
    "descFr": "Une berceuse pour s'endormir dans la jungle.",
    "titleEn": "Good night, little dino",
    "descEn": "A lullaby for falling asleep in the jungle.",
    "titleAr": "تصبح على خير يا دينو الصغير",
    "descAr": "تهويدة للنوم في الأدغال.",
    "pages": [
      "Les fougères se ferment comme des paupières.",
      "Petit Dino serre son caillou préféré.",
      "Les grillons jouent une musique douce.",
      "Maman Dino chante tout bas.",
      "Bonne nuit, petit dino. La jungle veille."
    ],
    "flags": "rec"
  },
  {
    "slug": "prem-velo-cuisine",
    "theme": "dinosaurs",
    "min": 5,
    "max": 8,
    "emoji": "🍲",
    "titleFr": "Le vélociraptor cuisinier",
    "descFr": "Velo invente une soupe pour toute la meute.",
    "titleEn": "The cooking velociraptor",
    "descEn": "Velo invents a soup for the whole pack.",
    "titleAr": "الفيلوسيربتور الطباخ",
    "descAr": "فيلو يخترع حساء للقطيع كله.",
    "pages": [
      "Velo coupe des racines colorées.",
      "Il ajoute des herbes qui sentent bon.",
      "La meute arrive, curieuse.",
      "Chacun goûte. « Miam ! » disent les petits.",
      "Cuisiner ensemble, c'est aimer sa famille."
    ],
    "flags": ""
  },
  {
    "slug": "prem-dino-musee",
    "theme": "dinosaurs",
    "min": 6,
    "max": 9,
    "emoji": "🏛️",
    "titleFr": "Les dinosaures du musée",
    "descFr": "Léa imagine que les fossiles s'éveillent la nuit.",
    "titleEn": "The museum dinosaurs",
    "descEn": "Léa imagines fossils waking at night.",
    "titleAr": "ديناصورات المتحف",
    "descAr": "ليا تتخيل أن المتحجرات تستيقظ ليلاً.",
    "pages": [
      "Léa visite le musée avec sa classe.",
      "La nuit, dans son rêve, les ossements dansent.",
      "Un T-Rex lui explique l'histoire de la Terre.",
      "Léa pose mille questions. Le musée répond.",
      "Au réveil, elle dessine un dinosaure savant."
    ],
    "flags": ""
  },
  {
    "slug": "prem-fusee-reves",
    "theme": "space",
    "min": 3,
    "max": 5,
    "emoji": "🚀",
    "titleFr": "La fusée des rêves",
    "descFr": "Une fusée douce emmène les enfants vers des planètes paisibles.",
    "titleEn": "The rocket of dreams",
    "descEn": "A gentle rocket carries children to peaceful planets.",
    "titleAr": "صاروخ الأحلام",
    "descAr": "صاروخ لطيف يحمل الأطفال إلى كواكب هادئة.",
    "pages": [
      "Ce soir, la fusée des rêves s'allume dans la chambre.",
      "Par le hublot, les étoiles dessinent des chemins dorés.",
      "Elle atterrit sur une planète de nuages moelleux.",
      "Les enfants y posent leurs soucis comme des cailloux.",
      "Au réveil, ils gardent une poussière d'étoile au creux de la main."
    ],
    "flags": "rec"
  },
  {
    "slug": "prem-astronaute-lune",
    "theme": "space",
    "min": 4,
    "max": 7,
    "emoji": "🌙",
    "titleFr": "L'astronaute et la lune curieuse",
    "descFr": "Noé découvre que la lune pose des questions tendres.",
    "titleEn": "The astronaut and the curious moon",
    "descEn": "Noah discovers the moon asks gentle questions.",
    "titleAr": "رائد الفضاء والقمر الفضولي",
    "descAr": "نوح يكتشف أن القمر يطرح أسئلة لطيفة.",
    "pages": [
      "Noé enfile son casque en carton et grimpe sur la chaise.",
      "La lune lui demande : « Quel est ton rêve préféré ? »",
      "Il répond : « Un monde où tout le monde rit. »",
      "La lune sourit et allume une lumière bleue.",
      "Noé s'endort, fier d'avoir parlé à la nuit."
    ],
    "flags": ""
  },
  {
    "slug": "prem-planete-jardin",
    "theme": "space",
    "min": 5,
    "max": 8,
    "emoji": "🪐",
    "titleFr": "La planète-jardin",
    "descFr": "Sur une planète lointaine, les fleurs poussent au rythme des chansons.",
    "titleEn": "The garden planet",
    "descEn": "On a distant planet, flowers grow to the rhythm of songs.",
    "titleAr": "كوكب الحديقة",
    "descAr": "على كوكب بعيد، تنمو الزهور على إيقاع الأغاني.",
    "pages": [
      "Zia atterrit sur une planète verte et chantante.",
      "Chaque fleur répond à une note de sa flûte.",
      "Un nuage de papillons lumineux l'accompagne.",
      "Elle plante une graine de gentillesse.",
      "La planète brille un peu plus fort ce soir-là."
    ],
    "flags": "pop"
  },
  {
    "slug": "prem-etoile-guide",
    "theme": "space",
    "min": 3,
    "max": 6,
    "emoji": "⭐",
    "titleFr": "L'étoile guide",
    "descFr": "Une étoile veille sur les petits explorateurs perdus.",
    "titleEn": "The guiding star",
    "descEn": "A star watches over little lost explorers.",
    "titleAr": "النجمة المرشدة",
    "descAr": "نجمة تسهر على المستكشفين الصغار الضائعين.",
    "pages": [
      "Une étoile descend près du lit de Mila.",
      "« Je t'éclaire quand tu as peur du noir », murmure-t-elle.",
      "Mila suit sa lumière jusqu'au doudou.",
      "Elle ferme les yeux, rassurée.",
      "L'étoile remonte au ciel, fière de son travail."
    ],
    "flags": "rec",
    "type": "audio_story",
    "audioFr": "Étoile guide, brille doucement. Les petits explorateurs te suivent vers le sommeil.",
    "audioEn": "Guiding star, shine gently. Little explorers follow you toward sleep.",
    "audioAr": "أيتها النجمة المرشدة، تألقي بلطف. المستكشفون الصغار يتبعونك نحو النوم."
  },
  {
    "slug": "prem-satellite-amis",
    "theme": "space",
    "min": 6,
    "max": 9,
    "emoji": "🛰️",
    "titleFr": "Le satellite des amitiés",
    "descFr": "Deux satellites échangent des messages de tendresse.",
    "titleEn": "The friendship satellite",
    "descEn": "Two satellites exchange messages of kindness.",
    "titleAr": "القمر الصناعي للصداقات",
    "descAr": "قمران صناعيان يتبادلان رسائل من الحنان.",
    "pages": [
      "Sat un et Sat deux tournent autour de la Terre.",
      "Ils s'envoient des signaux : « Bonjour, ami lointain ! »",
      "Un jour, ils croisent une comète timide.",
      "Ils lui offrent une place dans leur danse.",
      "La nuit entière scintille de leurs saluts."
    ],
    "flags": ""
  },
  {
    "slug": "prem-comete-douce",
    "theme": "space",
    "min": 4,
    "max": 7,
    "emoji": "☄️",
    "titleFr": "La comète douce",
    "descFr": "Une comète traverse le ciel sans faire peur.",
    "titleEn": "The gentle comet",
    "descEn": "A comet crosses the sky without frightening anyone.",
    "titleAr": "المذنب اللطيف",
    "descAr": "مذنب يعبر السماء دون أن يخيف أحداً.",
    "pages": [
      "Une traînée bleue glisse au-dessus des toits.",
      "Les enfants lèvent la tête, émerveillés.",
      "La comète laisse une poussière qui sent la vanille.",
      "Elle murmure : « Passez une nuit paisible. »",
      "Demain, elle sera déjà loin, mais son passage reste."
    ],
    "flags": "new",
    "type": "audio_story",
    "audioFr": "Comète douce, traîne de lumière. Tu passes sans bruit, tu laisses des rêves.",
    "audioEn": "Gentle comet, trail of light. You pass in silence, you leave dreams behind.",
    "audioAr": "أيتها المذنب اللطيف، ذيل من النور. تعبر بصمت وتترك أحلاماً."
  },
  {
    "slug": "prem-station-espace",
    "theme": "space",
    "min": 7,
    "max": 10,
    "emoji": "🛸",
    "titleFr": "La station des petits astronautes",
    "descFr": "Des enfants imaginent une station où l'on apprend à s'entraider.",
    "titleEn": "The little astronauts' station",
    "descEn": "Children imagine a station where everyone helps each other.",
    "titleAr": "محطة رواد الفضاء الصغار",
    "descAr": "أطفال يتخيلون محطة يتعلمون فيها التعاون.",
    "pages": [
      "Dans la station, chaque cabine a une mission gentille.",
      "Lina prépare le thé stellaire. Tom range les combinaisons.",
      "Ils réparent une antenne en chœur.",
      "La Terre leur envoie un signe : merci.",
      "Ils savent que l'espace est vaste, mais leurs cœurs aussi."
    ],
    "flags": ""
  },
  {
    "slug": "prem-marte-etoiles",
    "theme": "space",
    "min": 5,
    "max": 8,
    "emoji": "🔴",
    "titleFr": "Mars et le jardin rouge",
    "descFr": "Sur Mars, une graine improbable pousse grâce à la patience.",
    "titleEn": "Mars and the red garden",
    "descEn": "On Mars, an unlikely seed grows thanks to patience.",
    "titleAr": "المريخ والحديقة الحمراء",
    "descAr": "على المريخ، بذرة مستحيلة تنمو بفضل الصبر.",
    "pages": [
      "Léo plante une graine dans le sable rouge de son bac à sable.",
      "Chaque jour, il arrose avec une goutte d'espoir.",
      "Une pousse verte perce enfin.",
      "Léo danse. Même sur Mars, la vie aime qu'on l'attende.",
      "Il promet de partager sa récolte avec toute la classe."
    ],
    "flags": ""
  },
  {
    "slug": "prem-princesse-rose",
    "theme": "princesses",
    "min": 3,
    "max": 5,
    "emoji": "👸",
    "titleFr": "Princesse Rose et le parfum du matin",
    "descFr": "Rose apprend que la vraie magie commence par un sourire.",
    "titleEn": "Princess Rose and the morning scent",
    "descEn": "Rose learns real magic begins with a smile.",
    "titleAr": "الأميرة روز ورائحة الصباح",
    "descAr": "روز تتعلم أن السحر الحقيقي يبدأ بابتسامة.",
    "pages": [
      "Princesse Rose ouvre les fenêtres du château.",
      "Le jardin sent la rosée et les fraises.",
      "Elle salue le boulanger, le jardinier, le chat.",
      "Tous lui rendent son sourire.",
      "Rose comprend : une princesse sert son royaume avec gentillesse."
    ],
    "flags": "rec"
  },
  {
    "slug": "prem-chateau-lumiere",
    "theme": "princesses",
    "min": 4,
    "max": 7,
    "emoji": "🏰",
    "titleFr": "Le château de lumière",
    "descFr": "Un château s'illumine quand on y lit des histoires ensemble.",
    "titleEn": "The castle of light",
    "descEn": "A castle glows when stories are read together inside.",
    "titleAr": "قلعة النور",
    "descAr": "قلعة تضيء عندما تُقرأ فيها القصص معاً.",
    "pages": [
      "Le vieux château semblait endormi.",
      "Clara lit une histoire à voix haute dans la salle vide.",
      "Les vitraux s'allument un par un.",
      "Des oiseaux viennent écouter à la fenêtre.",
      "Le château n'est plus vide : il brille de voix tendres."
    ],
    "flags": ""
  },
  {
    "slug": "prem-fee-poussiere",
    "theme": "princesses",
    "min": 3,
    "max": 6,
    "emoji": "🧚",
    "titleFr": "La fée poussière d'or",
    "descFr": "Une fée saupoudre du courage sur les enfants timides.",
    "titleEn": "The golden dust fairy",
    "descEn": "A fairy sprinkles courage on shy children.",
    "titleAr": "جنية الغبار الذهبي",
    "descAr": "جنية ترش الشجعان على الأطفال الخجولين.",
    "pages": [
      "Fée Poussière vole sans bruit dans la chambre.",
      "Elle pose une trace dorée sur la joue de Sami.",
      "Sami respire profondément et dit bonjour à la classe.",
      "La fée applaudit avec ses ailes.",
      "Le courage, parfois, tient dans une paillette."
    ],
    "flags": "pop"
  },
  {
    "slug": "prem-princesse-chevalier",
    "theme": "princesses",
    "min": 5,
    "max": 8,
    "emoji": "⚔️",
    "titleFr": "La princesse chevalier",
    "descFr": "Inès protège son village avec son cœur et son épée en bois.",
    "titleEn": "The knight princess",
    "descEn": "Inès protects her village with her heart and wooden sword.",
    "titleAr": "الأميرة الفارسة",
    "descAr": "إينès تحمي قريتها بقلبها وسيفها الخشبي.",
    "pages": [
      "Inès s'entraîne dans la cour avec une épée de cèdre.",
      "Un agneau s'égare près de la rivière.",
      "Elle le guide doucement vers le troupeau.",
      "Les villageois l'appellent princesse chevalier.",
      "Elle répond : « Je protège ceux qui ont peur. »"
    ],
    "flags": ""
  },
  {
    "slug": "prem-couronne-courage",
    "theme": "princesses",
    "min": 4,
    "max": 7,
    "emoji": "👑",
    "titleFr": "La couronne du courage",
    "descFr": "Une couronne se pose sur celui qui ose dire pardon.",
    "titleEn": "The crown of courage",
    "descEn": "A crown rests on whoever dares to say sorry.",
    "titleAr": "تاج الشجاعة",
    "descAr": "تاج ينزل على من يجرؤ على قول آسف.",
    "pages": [
      "Deux amis se disputent pour une couronne de papier.",
      "Elle tombe et se froisse.",
      "L'un dit : « Pardon. » L'autre répond : « Moi aussi. »",
      "La couronne semble briller à nouveau.",
      "Ils la portent à deux, riant ensemble."
    ],
    "flags": "new"
  },
  {
    "slug": "prem-princesse-bibliotheque",
    "theme": "princesses",
    "min": 6,
    "max": 9,
    "emoji": "📖",
    "titleFr": "La princesse de la bibliothèque",
    "descFr": "Une princesse règne sur un royaume de pages ouvertes.",
    "titleEn": "The library princess",
    "descEn": "A princess reigns over a kingdom of open pages.",
    "titleAr": "أميرة المكتبة",
    "descAr": "أميرة تحكم مملكة من الصفحات المفتوحة.",
    "pages": [
      "Princesse Lina passe ses journées entre les rayons.",
      "Elle lit à voix haute aux visiteurs timides.",
      "Chaque livre lui confie un secret.",
      "Elle écrit une charte : ici, personne n'a honte de ne pas savoir.",
      "Son royaume sent le papier chaud et la curiosité."
    ],
    "flags": ""
  },
  {
    "slug": "prem-roi-enchant",
    "theme": "princesses",
    "min": 3,
    "max": 5,
    "emoji": "🤴",
    "titleFr": "Le roi des enchantements",
    "descFr": "Un jeune roi apprend que les plus beaux sorts sont simples.",
    "titleEn": "The king of enchantments",
    "descEn": "A young king learns the finest spells are simple.",
    "titleAr": "ملك السحر",
    "descAr": "ملك صغير يتعلم أن أجمل التعاويذ بسيطة.",
    "pages": [
      "Petit roi Arthur veut un grand sortilège.",
      "Sa fée lui demande de préparer une tisane pour grand-mère.",
      "Il le fait avec soin.",
      "Grand-mère l'étreint. « Voilà ta magie », dit la fée.",
      "Arthur comprend : aimer, c'est enchanter le monde."
    ],
    "flags": "",
    "type": "audio_story",
    "audioFr": "Petit roi, ta magie est simple : un câlin, un merci, une tisane faite avec amour.",
    "audioEn": "Little king, your magic is simple: a hug, a thank you, tea made with love.",
    "audioAr": "أيها الملك الصغير، سحرك بسيط: احتضان، شكر، وشاي محضّر بالحب."
  },
  {
    "slug": "prem-princesse-pluie",
    "theme": "princesses",
    "min": 5,
    "max": 8,
    "emoji": "🌧️",
    "titleFr": "Princesse Pluie et le parapluie arc-en-ciel",
    "descFr": "Princesse Pluie danse sous la pluie et invite les autres.",
    "titleEn": "Princess Rain and the rainbow umbrella",
    "descEn": "Princess Rain dances in the rain and invites others.",
    "titleAr": "الأميرة المطر والمظلة قوس قزح",
    "descAr": "أميرة المطر ترقص تحت المطر وتدعو الآخرين.",
    "pages": [
      "Princesse Pluie ouvre son parapluie multicolore.",
      "Les passants se cachent. Elle chante.",
      "Un enfant la rejoint, puis deux, puis dix.",
      "La pluie devient une fête de gouttes.",
      "Quand le soleil revient, un arc-en-ciel les salue tous."
    ],
    "flags": ""
  },
  {
    "slug": "prem-nuit-douce",
    "theme": "bedtime",
    "min": 2,
    "max": 4,
    "emoji": "🌙",
    "titleFr": "La nuit douce",
    "descFr": "Une berceuse pour glisser vers le sommeil en confiance.",
    "titleEn": "The gentle night",
    "descEn": "A lullaby to drift toward sleep with confidence.",
    "titleAr": "الليل اللطيف",
    "descAr": "تهويدة للانزلاق نحو النوم بثقة.",
    "pages": [
      "La nuit étend son manteau bleu sur la maison.",
      "Les fenêtres battent comme des paupières.",
      "Maman chuchote : « Je suis là. »",
      "Le doudou sent le lait tiède et le savon.",
      "Les rêves arrivent en chuchotant. Bonne nuit."
    ],
    "flags": "rec"
  },
  {
    "slug": "prem-berceuse-nuages",
    "theme": "bedtime",
    "min": 2,
    "max": 5,
    "emoji": "☁️",
    "titleFr": "Berceuse des nuages",
    "descFr": "Des nuages bercent les enfants avec des mélodies lentes.",
    "titleEn": "Cloud lullaby",
    "descEn": "Clouds rock children with slow melodies.",
    "titleAr": "تهويدة الغيوم",
    "descAr": "غيوم تهدهد الأطفال بألحان هادئة.",
    "pages": [
      "Un nuage s'installe au-dessus du lit.",
      "Il chante sans mots, juste des vibrations douces.",
      "Les paupières deviennent lourdes comme des plumes.",
      "Le nuage pose une ombre fraîche.",
      "Le sommeil descend comme une pluie fine."
    ],
    "flags": "",
    "type": "audio_story",
    "audioFr": "Nuage doux, berceuse lente. Ferme les yeux, le ciel veille sur toi.",
    "audioEn": "Soft cloud, slow lullaby. Close your eyes, the sky watches over you.",
    "audioAr": "أيها الغيم الناعم، تهويدة بطيئة. أغمض عينيك، السماء تسهر عليك."
  },
  {
    "slug": "prem-dodo-etoiles",
    "theme": "bedtime",
    "min": 3,
    "max": 6,
    "emoji": "✨",
    "titleFr": "Dodo avec les étoiles",
    "descFr": "Chaque étoile compte un enfant endormi.",
    "titleEn": "Sleep with the stars",
    "descEn": "Each star counts a sleeping child.",
    "titleAr": "نام مع النجوم",
    "descAr": "كل نجمة تعد طفلاً نائماً.",
    "pages": [
      "Papa montre la carte du ciel au-dessus du lit.",
      "« Cette étoile veille sur toi », dit-il.",
      "L'enfant compte jusqu'à trois et ferme les yeux.",
      "Les étoiles clignotent comme des veilleuses.",
      "La nuit entière devient une couverture."
    ],
    "flags": ""
  },
  {
    "slug": "prem-reve-coton",
    "theme": "bedtime",
    "min": 3,
    "max": 5,
    "emoji": "🛏️",
    "titleFr": "Le rêve en coton",
    "descFr": "Un oreiller de coton emmène les rêves les plus doux.",
    "titleEn": "The cotton dream",
    "descEn": "A cotton pillow carries the gentlest dreams.",
    "titleAr": "الحلم القطني",
    "descAr": "وسادة قطنية تحمل ألطف الأحلام.",
    "pages": [
      "L'oreiller gonfle comme un petit nuage.",
      "Il sent la lessive propre et le calme.",
      "Les rêves y montent un par un.",
      "Un rêve de vélo, un rêve de mer, un rêve de rire.",
      "Au matin, l'enfant se souvient d'une lumière dorée."
    ],
    "flags": "pop"
  },
  {
    "slug": "prem-noel-dodo",
    "theme": "bedtime",
    "min": 3,
    "max": 6,
    "emoji": "🎄",
    "titleFr": "La veille de Noël au chaud",
    "descFr": "Une nuit de Noël où l'on s'endort en pensant aux autres.",
    "titleEn": "Christmas Eve all warm",
    "descEn": "A Christmas Eve spent falling asleep thinking of others.",
    "titleAr": "ليلة عيد الميلاد الدافئة",
    "descAr": "ليلة عيد ميلاد ينام فيها الطفل وهو يفكر بالآخرين.",
    "pages": [
      "La maison sent le pain d'épices et le sapin.",
      "On prépare un cadeau pour le voisin seul.",
      "L'enfant écrit une carte avec des flocons.",
      "Il se glisse sous la couette, le cœur léger.",
      "Dehors, la neige tombe. Noël veille."
    ],
    "flags": "new",
    "extraTags": [
      "seasonal",
      "christmas"
    ]
  },
  {
    "slug": "prem-hiver-couverture",
    "theme": "bedtime",
    "min": 2,
    "max": 5,
    "emoji": "❄️",
    "titleFr": "La couverture d'hiver",
    "descFr": "Une couverture épaisse protège du froid et des peurs.",
    "titleEn": "The winter blanket",
    "descEn": "A thick blanket protects from cold and fears.",
    "titleAr": "بطانية الشتاء",
    "descAr": "بطانية سميكة تحمي من البرد والمخاوف.",
    "pages": [
      "Dehors, le vent souffle contre la vitre.",
      "Maman plie une couverture toute douce.",
      "Elle raconte trois histoires chaudes.",
      "Les orteils se réchauffent.",
      "L'hiver peut frapper à la porte, le lit reste un refuge."
    ],
    "flags": "",
    "extraTags": [
      "seasonal",
      "winter"
    ]
  },
  {
    "slug": "prem-ete-brise",
    "theme": "bedtime",
    "min": 3,
    "max": 6,
    "emoji": "☀️",
    "titleFr": "La brise d'été",
    "descFr": "Une brise légère apporte le sommeil après une longue journée.",
    "titleEn": "The summer breeze",
    "descEn": "A light breeze brings sleep after a long day.",
    "titleAr": "نسيم الصيف",
    "descAr": "نسيم خفيف يجلب النوم بعد يوم طويل.",
    "pages": [
      "La journée d'été a été pleine de jeux.",
      "Une brise entre par la fenêtre entrouverte.",
      "Elle sent la herbe coupée et les glaces.",
      "L'enfant bâille en souriant.",
      "La nuit d'été l'enveloppe comme une chanson lente."
    ],
    "flags": "",
    "extraTags": [
      "seasonal",
      "summer"
    ]
  },
  {
    "slug": "prem-rentree-dodo",
    "theme": "bedtime",
    "min": 4,
    "max": 7,
    "emoji": "🎒",
    "titleFr": "Dodo avant la rentrée",
    "descFr": "La veille de l'école, on s'endort en se rappelant ses forces.",
    "titleEn": "Sleep before school starts",
    "descEn": "The night before school, sleep remembering your strengths.",
    "titleAr": "النوم قبل العودة للمدرسة",
    "descAr": "في ليلة ما قبل المدرسة، ننام ونتذكر نقاط قوتنا.",
    "pages": [
      "Le cartable est prêt près de la porte.",
      "L'enfant craint un peu la nouvelle classe.",
      "Papa liste trois choses qu'il sait faire.",
      "Il respire. Son courage est déjà là.",
      "Demain sera une aventure, ce soir on se repose."
    ],
    "flags": "",
    "extraTags": [
      "seasonal",
      "school"
    ]
  },
  {
    "slug": "prem-ramadan-nuit",
    "theme": "bedtime",
    "min": 4,
    "max": 8,
    "emoji": "🌙",
    "titleFr": "Les nuits douces du Ramadan",
    "descFr": "Des nuits paisibles où l'on partage et l'on prie en silence.",
    "titleEn": "Gentle Ramadan nights",
    "descEn": "Peaceful nights of sharing and quiet prayer.",
    "titleAr": "ليالي رمضان الهادئة",
    "descAr": "ليالي هادئة للمشاركة والدعاء بصمت.",
    "pages": [
      "La maison sent la soupe et les dattes.",
      "Grand-père lit une prière douce.",
      "Les enfants écoutent, les mains jointes.",
      "La lune observe par la fenêtre.",
      "Ces nuits enseignent la patience et la gratitude."
    ],
    "flags": "rec",
    "extraTags": [
      "seasonal",
      "ramadan"
    ]
  },
  {
    "slug": "prem-lune-berceuse",
    "theme": "bedtime",
    "min": 2,
    "max": 4,
    "emoji": "🌜",
    "titleFr": "La lune berceuse",
    "descFr": "La lune se balance et berce toute la ville.",
    "titleEn": "The lullaby moon",
    "descEn": "The moon sways and rocks the whole town.",
    "titleAr": "القمر المهدئ",
    "descAr": "القمر يتأرجح ويهدئ المدينة كلها.",
    "pages": [
      "La lune monte au-dessus des toits.",
      "Elle se balance, lentement, lentement.",
      "Les chats s'endorment sur les balcons.",
      "Les bateaux se taisent au port.",
      "Bonne nuit, ville. La lune veille."
    ],
    "flags": ""
  },
  {
    "slug": "prem-poisson-arcenciel",
    "theme": "ocean",
    "min": 3,
    "max": 5,
    "emoji": "🐠",
    "titleFr": "Le poisson arc-en-ciel",
    "descFr": "Nino le poisson peint des couleurs dans l'eau claire.",
    "titleEn": "The rainbow fish",
    "descEn": "Nino the fish paints colors in clear water.",
    "titleAr": "السمكة قوس قزح",
    "descAr": "نينو السمكة يرسم الألوان في الماء الصافي.",
    "pages": [
      "Nino nage entre les coraux roses.",
      "Chaque écaille reflète une couleur différente.",
      "Il invite les petits poissons timides à jouer.",
      "Ensemble, ils dessinent un arc-en-ciel liquide.",
      "La mer scintille comme un trésor partagé."
    ],
    "flags": ""
  },
  {
    "slug": "prem-baleine-chant",
    "theme": "ocean",
    "min": 4,
    "max": 7,
    "emoji": "🐋",
    "titleFr": "La baleine qui chantait",
    "descFr": "Une baleine chante des berceuses aux bateaux de nuit.",
    "titleEn": "The whale who sang",
    "descEn": "A whale sings lullabies to boats at night.",
    "titleAr": "الحوت المغني",
    "descAr": "حوت يغني تهويدات للقوارب ليلاً.",
    "pages": [
      "Baleine Bleue monte à la surface.",
      "Son chant traverse l'eau comme une couverture.",
      "Les marins ferment les yeux, apaisés.",
      "Les vagues dansent au rythme.",
      "La mer retient cette mélodie longtemps."
    ],
    "flags": "rec",
    "type": "audio_story",
    "audioFr": "Baleine douce, ton chant berce la mer. Dors, petit voyageur.",
    "audioEn": "Gentle whale, your song rocks the sea. Sleep, little traveler.",
    "audioAr": "أيتها الحوت اللطيف، أغنيتك تهدهد البحر. نم أيها المسافر الصغير."
  },
  {
    "slug": "prem-coquillage-secret",
    "theme": "ocean",
    "min": 5,
    "max": 8,
    "emoji": "🐚",
    "titleFr": "Le coquillage secret",
    "descFr": "Un coquillage murmure des histoires à qui sait écouter.",
    "titleEn": "The secret shell",
    "descEn": "A shell whispers stories to those who listen.",
    "titleAr": "الصدفة السرية",
    "descAr": "صدفة تهمس قصصاً لمن يستمع.",
    "pages": [
      "Sur la plage, Lina trouve un coquillage spiralé.",
      "Elle le porte à son oreille : « Chut, écoute. »",
      "Une voix raconte des baleines et des tempêtes calmes.",
      "Lina dessine ce qu'elle entend.",
      "Elle rend le coquillage à la mer, reconnaissante."
    ],
    "flags": ""
  },
  {
    "slug": "prem-meduse-lumiere",
    "theme": "ocean",
    "min": 3,
    "max": 6,
    "emoji": "🪼",
    "titleFr": "La méduse lumière",
    "descFr": "Une méduse brille pour rassurer les petits poissons.",
    "titleEn": "The light jellyfish",
    "descEn": "A jellyfish glows to reassure little fish.",
    "titleAr": "قنديل البحر المضيء",
    "descAr": "قنديل بحر يضيء ليطمئن الأسماك الصغيرة.",
    "pages": [
      "La nuit, la méduse Lumi pulse doucement.",
      "Les petits poissons perdus la suivent.",
      "Elle les guide vers le récif familier.",
      "Personne ne reste seul dans le noir bleu.",
      "Au matin, elle s'éteint pour se reposer."
    ],
    "flags": "pop"
  },
  {
    "slug": "prem-crabe-danse",
    "theme": "ocean",
    "min": 4,
    "max": 7,
    "emoji": "🦀",
    "titleFr": "Le crabe qui dansait",
    "descFr": "Crabi apprend un pas de danse pour fêter la marée.",
    "titleEn": "The dancing crab",
    "descEn": "Crabi learns a dance step to celebrate the tide.",
    "titleAr": "السلطعون الراقص",
    "descAr": "كرابي يتعلم خطوة رقص للاحتفال بالمد.",
    "pages": [
      "Crabi claque ses pinces en rythme.",
      "Les crevettes l'imitent en riant.",
      "La marée monte, la fête aussi.",
      "Même les algues ondulent.",
      "La mer aime quand on célèbre la vie."
    ],
    "flags": ""
  },
  {
    "slug": "prem-recif-amis",
    "theme": "ocean",
    "min": 5,
    "max": 8,
    "emoji": "🪸",
    "titleFr": "Le récif des amis",
    "descFr": "Sur le récif, chaque habitant apporte sa lumière.",
    "titleEn": "The reef of friends",
    "descEn": "On the reef, every resident brings their light.",
    "titleAr": "الشعاب المرجانية للأصدقاء",
    "descAr": "على الشعاب، كل ساكن يضيء بضوئه.",
    "pages": [
      "Corail rouge, poisson clown, étoile de mer : tous voisins.",
      "Un jour, une tempête voile l'eau.",
      "Ils nettoient ensemble, pinces et nageoires.",
      "Le récif retrouve ses couleurs.",
      "Ensemble, ils brillent plus fort."
    ],
    "flags": "new"
  },
  {
    "slug": "prem-phare-guide",
    "theme": "ocean",
    "min": 6,
    "max": 9,
    "emoji": "🗼",
    "titleFr": "Le phare qui guide",
    "descFr": "Un phare veille sur les bateaux et les rêves des enfants.",
    "titleEn": "The guiding lighthouse",
    "descEn": "A lighthouse watches over boats and children's dreams.",
    "titleAr": "المنارة المرشدة",
    "descAr": "منارة تسهر على القوارب وأحلام الأطفال.",
    "pages": [
      "Le phare tourne, régulier comme un battement.",
      "Les pêcheurs saluent sa lumière.",
      "Les enfants du port dessinent sa silhouette.",
      "Il ne parle pas, il éclaire.",
      "C'est déjà une grande amitié."
    ],
    "flags": ""
  },
  {
    "slug": "prem-ete-plage",
    "theme": "ocean",
    "min": 3,
    "max": 6,
    "emoji": "🏖️",
    "titleFr": "L'été à la plage",
    "descFr": "Une journée d'été où la mer apprend à partager le sable.",
    "titleEn": "Summer at the beach",
    "descEn": "A summer day when the sea learns to share the sand.",
    "titleAr": "الصيف على الشاطئ",
    "descAr": "يوم صيفي تتعلم فيه البحر مشاركة الرمل.",
    "pages": [
      "Le sable est chaud, la mer est fraîche.",
      "Les enfants construisent un château.",
      "Une vague l'effleure sans le casser.",
      "Ils rient et replient leurs serviettes.",
      "L'été garde ce souvenir salé."
    ],
    "flags": "",
    "extraTags": [
      "seasonal",
      "summer"
    ]
  },
  {
    "slug": "prem-vague-berceuse",
    "theme": "ocean",
    "min": 2,
    "max": 5,
    "emoji": "🌊",
    "titleFr": "La vague berceuse",
    "descFr": "Les vagues chantent une berceuse au rivage.",
    "titleEn": "The lullaby wave",
    "descEn": "Waves sing a lullaby on the shore.",
    "titleAr": "موجة التهويدة",
    "descAr": "الأمواج تغني تهويدة على الشاطئ.",
    "pages": [
      "La mer monte et descend, doucement.",
      "Chaque vague efface les traces du jour.",
      "Le sable se refroidit sous les étoiles.",
      "Un enfant écoute depuis la fenêtre.",
      "La mer dit : dors, demain on jouera encore."
    ],
    "flags": "",
    "type": "audio_story",
    "audioFr": "Vague douce, va et vient. Berce le rivage, berce mon cœur.",
    "audioEn": "Gentle wave, come and go. Rock the shore, rock my heart.",
    "audioAr": "أيتها الموجة اللطيفة، اذهبي وعودي. اهدي الشاطئ واهدي قلبي."
  },
  {
    "slug": "prem-train-nuit",
    "theme": "vehicles",
    "min": 3,
    "max": 6,
    "emoji": "🚂",
    "titleFr": "Le train de la nuit",
    "descFr": "Un train traverse la nuit en portant des rêves.",
    "titleEn": "The night train",
    "descEn": "A train crosses the night carrying dreams.",
    "titleAr": "قطار الليل",
    "descAr": "قطار يعبر الليل حاملاً الأحلام.",
    "pages": [
      "Le train siffle doucement à la gare.",
      "Chaque wagon contient une couchette moelleuse.",
      "Les paysages filent comme des pages.",
      "Un enfant compte les étoiles par le hublot.",
      "Au matin, le train arrive au pays des rêves."
    ],
    "flags": "rec"
  },
  {
    "slug": "prem-camion-aide",
    "theme": "vehicles",
    "min": 4,
    "max": 7,
    "emoji": "🚚",
    "titleFr": "Le camion qui aidait",
    "descFr": "Camion Tom livre des sourires avec ses colis.",
    "titleEn": "The helping truck",
    "descEn": "Truck Tom delivers smiles with his packages.",
    "titleAr": "الشاحنة المساعدة",
    "descAr": "شاحنة توم توصل الابتسامات مع طرودها.",
    "pages": [
      "Tom charge des cartons légers et lourds.",
      "Il s'arrête chez la dame qui marche mal.",
      "Il monte les courses sans bruit.",
      "Elle lui offre un biscuit.",
      "Tom repart, moteur content."
    ],
    "flags": ""
  },
  {
    "slug": "prem-velo-liberte",
    "theme": "vehicles",
    "min": 5,
    "max": 8,
    "emoji": "🚲",
    "titleFr": "Le vélo de liberté",
    "descFr": "Yan apprend à pédaler et à tomber sans se faire mal.",
    "titleEn": "The freedom bike",
    "descEn": "Yan learns to pedal and fall without getting hurt.",
    "titleAr": "دراجة الحرية",
    "descAr": "يان يتعلم ركوب الدراجة والسقوط دون أذى.",
    "pages": [
      "Yan serre son casque et pousse sur les pédales.",
      "Il vacille, tombe dans l'herbe.",
      "Papa l'aide à se relever.",
      "Au troisième essai, il file comme le vent.",
      "La liberté sent la terre et le rire."
    ],
    "flags": ""
  },
  {
    "slug": "prem-bus-ecole",
    "theme": "vehicles",
    "min": 4,
    "max": 7,
    "emoji": "🚌",
    "titleFr": "Le bus de l'école",
    "descFr": "Le bus accueille chaque enfant avec un signe amical.",
    "titleEn": "The school bus",
    "descEn": "The bus welcomes each child with a friendly sign.",
    "titleAr": "حافلة المدرسة",
    "descAr": "الحافلة ترحب بكل طفل بإشارة ودية.",
    "pages": [
      "Le bus jaune s'arrête au coin de la rue.",
      "Le conducteur connaît tous les prénoms.",
      "Il pose une question : « Qu'as-tu appris hier ? »",
      "Les enfants répondent en chœur.",
      "Le trajet devient une petite fête."
    ],
    "flags": "",
    "extraTags": [
      "seasonal",
      "school"
    ]
  },
  {
    "slug": "prem-helico-rescue",
    "theme": "vehicles",
    "min": 6,
    "max": 9,
    "emoji": "🚁",
    "titleFr": "L'hélico du secours",
    "descFr": "Un hélicoptère aide avec calme et courage.",
    "titleEn": "The rescue helicopter",
    "descEn": "A helicopter helps with calm and courage.",
    "titleAr": "مروحية الإنقاذ",
    "descAr": "مروحية تساعد بهدوء وشجاعة.",
    "pages": [
      "L'hélico survole les collines brumeuses.",
      "Il repère un mouton égaré.",
      "Il guide le berger sans bruit.",
      "Le mouton retrouve son troupeau.",
      "Secourir, c'est observer avant d'agir."
    ],
    "flags": "pop"
  },
  {
    "slug": "prem-bateau-vent",
    "theme": "vehicles",
    "min": 3,
    "max": 5,
    "emoji": "⛵",
    "titleFr": "Le bateau et le vent",
    "descFr": "Un petit bateau apprend à danser avec le vent.",
    "titleEn": "The boat and the wind",
    "descEn": "A little boat learns to dance with the wind.",
    "titleAr": "القارب والريح",
    "descAr": "قارب صغير يتعلم الرقص مع الريح.",
    "pages": [
      "Voilier Petit Loup tangue sur les vagues.",
      "Il a peur quand le vent souffle fort.",
      "Le vieux marin lui dit : « Écoute, ne combats pas. »",
      "Petit Loup incline sa voile.",
      "Il glisse, souriant, vers le port."
    ],
    "flags": ""
  },
  {
    "slug": "prem-tracteur-champs",
    "theme": "vehicles",
    "min": 5,
    "max": 8,
    "emoji": "🚜",
    "titleFr": "Le tracteur des champs",
    "descFr": "Tracteur Roux prépare la terre pour les semailles.",
    "titleEn": "The field tractor",
    "descEn": "Tractor Roux prepares the soil for planting.",
    "titleAr": "جرار الحقول",
    "descAr": "جرار روكس يجهز التربة للزراعة.",
    "pages": [
      "Roux avance lentement dans le champ.",
      "La terre se fend en lignes propres.",
      "Les oiseaux suivent pour picorer.",
      "Un enfant apporte des graines.",
      "Ensemble, ils promettent une moisson de partage."
    ],
    "flags": ""
  },
  {
    "slug": "prem-metro-reves",
    "theme": "vehicles",
    "min": 7,
    "max": 10,
    "emoji": "🚇",
    "titleFr": "Le métro des rêves",
    "descFr": "Un métro traverse la ville quand tout le monde dort.",
    "titleEn": "The dream subway",
    "descEn": "A subway crosses the city while everyone sleeps.",
    "titleAr": "مترو الأحلام",
    "descAr": "مترو يعبر المدينة بينما الجميع نائم.",
    "pages": [
      "Les rails brillent sous la lune.",
      "Le métro transporte des rêves emballés.",
      "Il s'arrête à chaque lit.",
      "Il dépose une aventure douce.",
      "Au matin, les passagers sourient sans savoir pourquoi."
    ],
    "flags": "",
    "type": "audio_story",
    "audioFr": "Métro des rêves, roule sans bruit. Tu portes la nuit vers demain.",
    "audioEn": "Dream subway, roll in silence. You carry the night toward tomorrow.",
    "audioAr": "مترو الأحلام، تحرك بصمت. تحمل الليل نحو الغد."
  },
  {
    "slug": "prem-voyage-sacs",
    "theme": "world",
    "min": 4,
    "max": 7,
    "emoji": "🎒",
    "titleFr": "Le voyage en deux sacs",
    "descFr": "Deux frères apprennent à voyager léger et ensemble.",
    "titleEn": "The two-bag journey",
    "descEn": "Two brothers learn to travel light and together.",
    "titleAr": "الرحلة بحقيبتين",
    "descAr": "أخوان يتعلمان السفر خفيفين ومعاً.",
    "pages": [
      "Ils préparent deux sacs pour les vacances.",
      "L'aîné veut tout emporter. Le cadet oublie son doudou.",
      "Ils partagent place et cachettes.",
      "Sur la route, ils rient des imprévus.",
      "Voyager, c'est aussi s'entraider."
    ],
    "flags": ""
  },
  {
    "slug": "prem-marche-monde",
    "theme": "world",
    "min": 5,
    "max": 8,
    "emoji": "🌍",
    "titleFr": "La marche autour du monde",
    "descFr": "Une carte au trésor mène à des rencontres, pas à de l'or.",
    "titleEn": "The walk around the world",
    "descEn": "A treasure map leads to encounters, not gold.",
    "titleAr": "الجولة حول العالم",
    "descAr": "خريطة كنز تقود إلى لقاءات لا إلى ذهب.",
    "pages": [
      "Sur la carte, des flèches pointent vers des marchés.",
      "L'enfant goûte du pain, une épice, une chanson.",
      "Chaque arrêt est un cadeau.",
      "Il colle des tickets dans son carnet.",
      "Le trésor, c'est ce qu'il a appris."
    ],
    "flags": "rec",
    "type": "audio_story",
    "audioFr": "Petit voyageur, le monde t'attend. Chaque pas est une histoire.",
    "audioEn": "Little traveler, the world awaits you. Every step is a story.",
    "audioAr": "أيها المسافر الصغير، العالم ينتظرك. كل خطوة قصة."
  },
  {
    "slug": "prem-noel-monde",
    "theme": "world",
    "min": 3,
    "max": 6,
    "emoji": "🎁",
    "titleFr": "Noël autour du monde",
    "descFr": "Des enfants du monde entier partagent leurs traditions.",
    "titleEn": "Christmas around the world",
    "descEn": "Children worldwide share their traditions.",
    "titleAr": "عيد الميلاد حول العالم",
    "descAr": "أطفال من العالم يشاركون تقاليدهم.",
    "pages": [
      "En Norvège, des bougies. Au Brésil, des lumières.",
      "En France, une bûche. Partout, des sourires.",
      "Les enfants échangent des cartes.",
      "Ils comprennent : la joie parle toutes les langues.",
      "Noël tient dans un cœur ouvert."
    ],
    "flags": "",
    "extraTags": [
      "seasonal",
      "christmas"
    ]
  },
  {
    "slug": "prem-ramadan-lune",
    "theme": "world",
    "min": 5,
    "max": 9,
    "emoji": "🌙",
    "titleFr": "Ramadan sous la même lune",
    "descFr": "Des familles loin les unes des autres partagent la même lune.",
    "titleEn": "Ramadan under the same moon",
    "descEn": "Families far apart share the same moon.",
    "titleAr": "رمضان تحت القمر نفسه",
    "descAr": "عائلات بعيدة تشترك في القمر نفسه.",
    "pages": [
      "La lune se lève sur deux villes différentes.",
      "Ici, on prépare la table. Là-bas aussi.",
      "Les enfants envoient des messages.",
      "Ils jeûnent, prient, rient ensemble à distance.",
      "La lune les relie comme un fil doux."
    ],
    "flags": "pop",
    "extraTags": [
      "seasonal",
      "ramadan"
    ]
  },
  {
    "slug": "prem-ete-voyage",
    "theme": "world",
    "min": 4,
    "max": 8,
    "emoji": "🌻",
    "titleFr": "L'été en voyage",
    "descFr": "Un train d'été mène vers des champs de tournesols.",
    "titleEn": "Summer journey",
    "descEn": "A summer train leads to fields of sunflowers.",
    "titleAr": "رحلة الصيف",
    "descAr": "قطار صيفي يقود إلى حقول عباد الشمس.",
    "pages": [
      "Le train traverse des plaines dorées.",
      "Les enfants collent le nez aux vitres.",
      "Ils descendent près d'un village de fête.",
      "Ils dansent sous le soleil.",
      "L'été sent la poussière chaude et la liberté."
    ],
    "flags": "",
    "extraTags": [
      "seasonal",
      "summer"
    ]
  },
  {
    "slug": "prem-hiver-chalet",
    "theme": "world",
    "min": 3,
    "max": 7,
    "emoji": "🏔️",
    "titleFr": "Le chalet d'hiver",
    "descFr": "Au chalet, on partage du chocolat chaud et des histoires.",
    "titleEn": "The winter chalet",
    "descEn": "At the chalet, hot cocoa and stories are shared.",
    "titleAr": "كوخ الشتاء",
    "descAr": "في الكوخ، نشارك الشوكولاتة الساخنة والقصص.",
    "pages": [
      "La neige recouvre le toit du chalet.",
      "Grand-mère prépare du chocolat.",
      "Les enfants dessinent sur les vitres givrées.",
      "Dehors, le silence est doux.",
      "L'hiver rapproche les cœurs."
    ],
    "flags": "",
    "extraTags": [
      "seasonal",
      "winter"
    ]
  },
  {
    "slug": "prem-ecole-monde",
    "theme": "world",
    "min": 6,
    "max": 9,
    "emoji": "🏫",
    "titleFr": "L'école du monde",
    "descFr": "Une école imaginaire où chaque pays enseigne une gentillesse.",
    "titleEn": "The world school",
    "descEn": "An imaginary school where each country teaches a kindness.",
    "titleAr": "مدرسة العالم",
    "descAr": "مدرسة خيالية يعلم فيها كل بلد لطفاً.",
    "pages": [
      "Le matin, on apprend à dire merci en dix langues.",
      "À midi, on partage des recettes.",
      "L'après-midi, on écrit des lettres d'amitié.",
      "Personne n'est seul à la récréation.",
      "L'école du monde tient dans un cahier."
    ],
    "flags": "new",
    "extraTags": [
      "seasonal",
      "school"
    ]
  },
  {
    "slug": "prem-carte-tresor",
    "theme": "world",
    "min": 7,
    "max": 10,
    "emoji": "🗺️",
    "titleFr": "La carte au trésor des rires",
    "descFr": "Une carte mène à des endroits où l'on rit fort.",
    "titleEn": "The treasure map of laughter",
    "descEn": "A map leads to places where people laugh loudly.",
    "titleAr": "خريطة كنز الضحك",
    "descAr": "خريطة تقود إلى أماكن يضحك فيها الناس بصوت عال.",
    "pages": [
      "La carte indique : « Ici, on rit aux éclats. »",
      "Les enfants suivent les indices.",
      "Ils trouvent une scène, un jeu, une blague.",
      "Ils ajoutent leurs propres rires à la carte.",
      "Le vrai trésor est contagieux."
    ],
    "flags": ""
  },
  {
    "slug": "prem-arc-en-ciel",
    "theme": "colors",
    "min": 2,
    "max": 4,
    "emoji": "🌈",
    "titleFr": "L'arc-en-ciel de Lila",
    "descFr": "Lila mélange les couleurs et découvre la magie du violet.",
    "titleEn": "Lila's rainbow",
    "descEn": "Lila mixes colors and discovers the magic of purple.",
    "titleAr": "قوس قزح ليلى",
    "descAr": "ليلى تمزج الألوان وتكتشف سحر البنفسجي.",
    "pages": [
      "Lila pose du rouge à côté du bleu.",
      "Elle mélange : surprise, du violet apparaît !",
      "Elle peint un arc-en-ciel géant.",
      "Chaque bande a une émotion.",
      "Elle accroche son tableau au frigo, fière."
    ],
    "flags": "rec"
  },
  {
    "slug": "prem-rouge-courage",
    "theme": "colors",
    "min": 3,
    "max": 5,
    "emoji": "🔴",
    "titleFr": "Le rouge du courage",
    "descFr": "Le rouge aide Léo à parler devant la classe.",
    "titleEn": "The red of courage",
    "descEn": "Red helps Léo speak in front of the class.",
    "titleAr": "الأحمر للشجاعة",
    "descAr": "الأحمر يساعد ليو على التحدث أمام الصف.",
    "pages": [
      "Léo porte un pull rouge le jour de l'exposé.",
      "Il sent son cœur battre.",
      "Il respire et commence.",
      "Sa voix devient claire.",
      "Le rouge, ce jour-là, veut dire : j'ose."
    ],
    "flags": ""
  },
  {
    "slug": "prem-bleu-calme",
    "theme": "colors",
    "min": 3,
    "max": 6,
    "emoji": "🔵",
    "titleFr": "Le bleu du calme",
    "descFr": "Une chambre bleue apaise les tempêtes intérieures.",
    "titleEn": "The blue of calm",
    "descEn": "A blue room soothes inner storms.",
    "titleAr": "الأزرق للهدوء",
    "descAr": "غرفة زرقاء تهدئ العواصف الداخلية.",
    "pages": [
      "Maman peint un mur en bleu ciel.",
      "L'enfant entre, respire profondément.",
      "Ses pensées ralentissent.",
      "Il lit une histoire sans s'agiter.",
      "Le bleu lui fait une place pour rêver."
    ],
    "flags": ""
  },
  {
    "slug": "prem-jaune-soleil",
    "theme": "colors",
    "min": 2,
    "max": 5,
    "emoji": "🟡",
    "titleFr": "Le jaune soleil",
    "descFr": "Le jaune réchauffe une matinée grise.",
    "titleEn": "The yellow sun",
    "descEn": "Yellow warms a gray morning.",
    "titleAr": "الأصفر الشمس",
    "descAr": "الأصفر يدفئ صباحاً رمادياً.",
    "pages": [
      "Dehors, la pluie tombe.",
      "L'enfant sort un crayon jaune.",
      "Il dessine un soleil sur la vitre.",
      "La cuisine semble plus claire.",
      "Parfois, une couleur suffit à sourire."
    ],
    "flags": "pop"
  },
  {
    "slug": "prem-melange-magie",
    "theme": "colors",
    "min": 4,
    "max": 7,
    "emoji": "🎨",
    "titleFr": "Le mélange magique",
    "descFr": "Deux couleurs ennemies deviennent amies en se mélangeant.",
    "titleEn": "The magic mix",
    "descEn": "Two rival colors become friends when mixed.",
    "titleAr": "المزيج السحري",
    "descAr": "لونان متنافسان يصبحان صديقين عند المزج.",
    "pages": [
      "Le vert et l'orange se disputent.",
      "L'enfant les mélange par accident.",
      "Un brun chaud apparaît.",
      "Ils découvrent qu'ensemble, ils créent.",
      "La palette entière applaudit."
    ],
    "flags": ""
  },
  {
    "slug": "prem-peinture-reves",
    "theme": "colors",
    "min": 5,
    "max": 8,
    "emoji": "🖌️",
    "titleFr": "La peinture des rêves",
    "descFr": "Chaque nuit, une couleur nouvelle colore les rêves.",
    "titleEn": "The paint of dreams",
    "descEn": "Each night, a new color paints the dreams.",
    "titleAr": "دهان الأحلام",
    "descAr": "كل ليلة، لون جديد يلون الأحلام.",
    "pages": [
      "Une goutte de rose pour les rêves doux.",
      "Du vert pour les forêts imaginaires.",
      "Du gold pour les fêtes.",
      "L'enfant choisit sa couleur du soir.",
      "Il s'endort dans une aquarelle."
    ],
    "flags": "new"
  },
  {
    "slug": "prem-medecin-doudou",
    "theme": "jobs",
    "min": 3,
    "max": 5,
    "emoji": "🩺",
    "titleFr": "Le docteur des doudous",
    "descFr": "Nina soigne les peluches avec des pansements en feutrine.",
    "titleEn": "The soft toy doctor",
    "descEn": "Nina heals stuffed animals with felt bandages.",
    "titleAr": "طبيبة الدمى",
    "descAr": "نina تعالج الحيوانات المحشوة بضمادات مخملية.",
    "pages": [
      "Nina ouvre sa clinique sous la table.",
      "Ours a une griffure. Lapin, un bouton manquant.",
      "Elle écoute leurs cœurs en peluche.",
      "Elle prescrit des câlins.",
      "Tous guérissent avant le goûter."
    ],
    "flags": ""
  },
  {
    "slug": "prem-boulanger-matin",
    "theme": "jobs",
    "min": 4,
    "max": 7,
    "emoji": "🥖",
    "titleFr": "Le boulanger du matin",
    "descFr": "Pierre se lève tôt pour partager du pain chaud.",
    "titleEn": "The morning baker",
    "descEn": "Pierre rises early to share warm bread.",
    "titleAr": "خباز الصباح",
    "descAr": "بيير يستيقظ مبكراً ليشارك الخبز الدافئ.",
    "pages": [
      "La boulangerie sent la farine et le levain.",
      "Pierre pétrit la pâte avec patience.",
      "Les voisins arrivent, mains froides.",
      "Il leur offre un morceau croustillant.",
      "Nourrir, c'est dire je pense à toi."
    ],
    "flags": "rec"
  },
  {
    "slug": "prem-jardinier-graines",
    "theme": "jobs",
    "min": 5,
    "max": 8,
    "emoji": "🌱",
    "titleFr": "Le jardinier des graines",
    "descFr": "Ali plante des graines de patience dans la cour.",
    "titleEn": "The seed gardener",
    "descEn": "Ali plants seeds of patience in the yard.",
    "titleAr": "بستاني البذور",
    "descAr": "علي يزرع بذور الصبر في الفناء.",
    "pages": [
      "Ali creuse de petits trous réguliers.",
      "Il place une graine, recouvre, arrose.",
      "Chaque matin, il observe sans tirer.",
      "Une pousse apparaît enfin.",
      "Le jardinier sait attendre avec amour."
    ],
    "flags": ""
  },
  {
    "slug": "prem-veterinaire-amis",
    "theme": "jobs",
    "min": 4,
    "max": 7,
    "emoji": "🐾",
    "titleFr": "La vétérinaire des amis",
    "descFr": "Dr. Lola soigne un chaton avec douceur.",
    "titleEn": "The animals' vet",
    "descEn": "Dr. Lola treats a kitten with gentleness.",
    "titleAr": "الطبيبة البيطرية للأصدقاء",
    "descAr": "د. لولا تعالج قطة صغيرة بلطف.",
    "pages": [
      "Le chaton miaule faiblement.",
      "Lola l'examine sans brusquerie.",
      "Elle lui donne une goutte et un câlin.",
      "Le propriétaire respire.",
      "Soigner, c'est aussi rassurer."
    ],
    "flags": "pop"
  },
  {
    "slug": "prem-artiste-couleurs",
    "theme": "jobs",
    "min": 6,
    "max": 9,
    "emoji": "🎭",
    "titleFr": "L'artiste des couleurs",
    "descFr": "Maya peint des fresques qui racontent son quartier.",
    "titleEn": "The color artist",
    "descEn": "Maya paints murals that tell her neighborhood's story.",
    "titleAr": "فنانة الألوان",
    "descAr": "مايا ترسم جداريات تحكي حيها.",
    "pages": [
      "Maya prépare ses pots sur le trottoir.",
      "Les passants s'arrêtent, curieux.",
      "Elle peint des visages, des arbres, des mains.",
      "Le mur devient un livre ouvert.",
      "L'artiste montre que la beauté appartient à tous."
    ],
    "flags": ""
  },
  {
    "slug": "prem-pompier-coeur",
    "theme": "jobs",
    "min": 3,
    "max": 6,
    "emoji": "🚒",
    "titleFr": "Le pompier au grand cœur",
    "descFr": "Sam le pompier sauve un chaton et rassure toute la rue.",
    "titleEn": "The big-hearted firefighter",
    "descEn": "Firefighter Sam rescues a kitten and reassures the whole street.",
    "titleAr": "رجل الإطفاء ذو القلب الكبير",
    "descAr": "سام رجل الإطفاء ينقذ قطة ويطمئن الشارع.",
    "pages": [
      "La sirène retentit, mais Sam reste calme.",
      "Il monte à l'échelle avec précision.",
      "Il descend le chaton dans une couverture.",
      "Les voisins applaudissent.",
      "Protéger, c'est agir avec douceur."
    ],
    "flags": "new"
  },
  {
    "slug": "prem-a-abeille",
    "theme": "alphabet",
    "min": 2,
    "max": 4,
    "emoji": "🅰️",
    "titleFr": "A comme Abeille",
    "descFr": "Découvre la lettre A avec Buzz l'abeille.",
    "titleEn": "A for Bee",
    "descEn": "Discover the letter A with Buzz the bee.",
    "titleAr": "أ مثل نحلة",
    "descAr": "اكتشف حرف A مع نحلة Buzz.",
    "pages": [
      "A est le premier pas de l'alphabet.",
      "Buzz vole autour du A géant.",
      "Il butine une fleur en forme de A.",
      "Les enfants tracent la lettre dans l'air.",
      "A comme amitié, aussi."
    ],
    "flags": ""
  },
  {
    "slug": "prem-b-baleine",
    "theme": "alphabet",
    "min": 3,
    "max": 5,
    "emoji": "🅱️",
    "titleFr": "B comme Baleine",
    "descFr": "La baleine B balance une berceuse bleue.",
    "titleEn": "B for Whale",
    "descEn": "Whale B sways a blue lullaby.",
    "titleAr": "ب مثل حوت",
    "descAr": "الحوت B يهدهد بتهويدة زرقاء.",
    "pages": [
      "B ouvre la bouche en forme de sourire.",
      "La baleine chante doucement.",
      "Des bulles dessinent un B.",
      "L'enfant répète le son.",
      "B comme bonheur, peut-être."
    ],
    "flags": "rec"
  },
  {
    "slug": "prem-c-chat",
    "theme": "alphabet",
    "min": 3,
    "max": 5,
    "emoji": "🐱",
    "titleFr": "C comme Chat",
    "descFr": "Moka le chat court autour du C courbe.",
    "titleEn": "C for Cat",
    "descEn": "Moka the cat runs around the curved C.",
    "titleAr": "ج مثل قطة",
    "descAr": "موكا القطة تركض حول C المنحنية.",
    "pages": [
      "C se courbe comme un croissant.",
      "Moka s'y allonge, ronronnant.",
      "Les enfants dessinent trois C.",
      "Ils forment des vagues.",
      "C comme câlin, certainement."
    ],
    "flags": ""
  },
  {
    "slug": "prem-d-dino",
    "theme": "alphabet",
    "min": 4,
    "max": 6,
    "emoji": "🇩",
    "titleFr": "D comme Dinosaure",
    "descFr": "Dino D danse sur la lettre D.",
    "titleEn": "D for Dinosaur",
    "descEn": "Dino D dances on the letter D.",
    "titleAr": "د مثل ديناصور",
    "descAr": "دينو D يرقص على حرف D.",
    "pages": [
      "D a deux barres solides.",
      "Dino tape du pied en rythme.",
      "Il laisse des empreintes en D.",
      "Les enfants rient et imitent.",
      "D comme dynamique, d'accord."
    ],
    "flags": ""
  },
  {
    "slug": "prem-e-etoile",
    "theme": "alphabet",
    "min": 4,
    "max": 7,
    "emoji": "⭐",
    "titleFr": "E comme Étoile",
    "descFr": "L'étoile E éclaire l'alphabet du soir.",
    "titleEn": "E for Star",
    "descEn": "Star E lights up the evening alphabet.",
    "titleAr": "ن مثل نجمة",
    "descAr": "نجمة E تضيء أبجدية المساء.",
    "pages": [
      "E ressemble à une échelle vers le ciel.",
      "L'étoile grimpe doucement.",
      "Elle allume chaque barre.",
      "L'enfant lit E, étoile, émerveillement.",
      "E comme émerveillement, enfin."
    ],
    "flags": "pop"
  },
  {
    "slug": "prem-un-soleil",
    "theme": "numbers",
    "min": 2,
    "max": 4,
    "emoji": "1️⃣",
    "titleFr": "Un comme soleil",
    "descFr": "Le chiffre un brille comme un soleil unique.",
    "titleEn": "One like the sun",
    "descEn": "The number one shines like a unique sun.",
    "titleAr": "١ مثل الشمس",
    "descAr": "الرقم واحد يلمع كشمس فريدة.",
    "pages": [
      "Un est seul, mais il éclaire tout.",
      "Un soleil, un nez, un sourire.",
      "L'enfant lève un doigt.",
      "Il compte les objets autour de lui.",
      "Un peut commencer une grande aventure."
    ],
    "flags": ""
  },
  {
    "slug": "prem-deux-mains",
    "theme": "numbers",
    "min": 2,
    "max": 5,
    "emoji": "2️⃣",
    "titleFr": "Deux mains pour aider",
    "descFr": "Le chiffre deux, ce sont deux mains qui se tendent.",
    "titleEn": "Two hands to help",
    "descEn": "The number two is two hands reaching out.",
    "titleAr": "٢ يدان للمساعدة",
    "descAr": "الرقم اثنان هما يدان ممدودتان.",
    "pages": [
      "Deux mains se serrent.",
      "Deux yeux qui clignent.",
      "Deux pas qui marchent ensemble.",
      "L'enfant compte sur ses doigts.",
      "Deux, c'est déjà une équipe."
    ],
    "flags": "rec"
  },
  {
    "slug": "prem-trois-amis",
    "theme": "numbers",
    "min": 3,
    "max": 5,
    "emoji": "3️⃣",
    "titleFr": "Trois amis sur un banc",
    "descFr": "Trois amis partagent un goûter équitable.",
    "titleEn": "Three friends on a bench",
    "descEn": "Three friends share a fair snack.",
    "titleAr": "٣ أصدقاء على مقعد",
    "descAr": "ثلاثة أصدقاء يتشاركون وجبة عادلة.",
    "pages": [
      "Trois parts égales de gâteau.",
      "Trois rires qui se répondent.",
      "Trois verres de jus.",
      "Personne n'est oublié.",
      "Trois, c'est une petite fête."
    ],
    "flags": ""
  },
  {
    "slug": "prem-quatre-saisons",
    "theme": "numbers",
    "min": 4,
    "max": 7,
    "emoji": "4️⃣",
    "titleFr": "Quatre saisons",
    "descFr": "Quatre saisons, quatre couleurs, quatre histoires.",
    "titleEn": "Four seasons",
    "descEn": "Four seasons, four colors, four stories.",
    "titleAr": "٤ فصول",
    "descAr": "أربعة فصول، أربعة ألوان، أربع قصص.",
    "pages": [
      "Le printemps vert, l'été jaune.",
      "L'automne orange, l'hiver bleu.",
      "L'enfant tourne un calendrier.",
      "Chaque saison a sa chanson.",
      "Quatre, c'est un tour complet."
    ],
    "flags": ""
  },
  {
    "slug": "prem-cinq-doigts",
    "theme": "numbers",
    "min": 3,
    "max": 6,
    "emoji": "5️⃣",
    "titleFr": "Cinq doigts magiques",
    "descFr": "Cinq doigts pour compter, caresser, créer.",
    "titleEn": "Five magic fingers",
    "descEn": "Five fingers to count, caress, create.",
    "titleAr": "٥ أصابع سحرية",
    "descAr": "خمسة أصابع للعد والمداعبة والإبداع.",
    "pages": [
      "Pouce, index, majeur, annulaire, auriculaire.",
      "Chaque doigt a un nom.",
      "L'enfant trace cinq étoiles.",
      "Il applaudit cinq fois.",
      "Cinq, c'est une main entière de possibilités."
    ],
    "flags": "new"
  },
  {
    "slug": "prem-comptine-soleil",
    "theme": "rhymes",
    "min": 2,
    "max": 4,
    "emoji": "☀️",
    "titleFr": "Comptine du soleil",
    "descFr": "Une comptine pour saluer le matin en chantant.",
    "titleEn": "Sun nursery rhyme",
    "descEn": "A nursery rhyme to greet the morning in song.",
    "titleAr": "أنشودة الشمس",
    "descAr": "أنشودة لتحية الصباح بالغناء.",
    "pages": [
      "Soleil, soleil, lève-toi doucement.",
      "Tu colores ma chambre en or.",
      "Je m'étire, je souris, je chante.",
      "Bonne journée commence ici."
    ],
    "flags": "rec",
    "type": "song",
    "audioFr": "Soleil, soleil, lève-toi doucement. Tu colores ma chambre en or. Je m'étire, je souris, je chante. Bonne journée commence ici.",
    "audioEn": "Sun, sun, rise gently. You paint my room in gold. I stretch, I smile, I sing. A good day begins here.",
    "audioAr": "أيتها الشمس، اطلقي بلطف. تلوّين غرفتي بالذهب. أتمطى وأبتسم وأغني. يوم جميل يبدأ هنا.",
    "extraTags": [
      "comptine",
      "rhyme",
      "song"
    ]
  },
  {
    "slug": "prem-comptine-pluie",
    "theme": "rhymes",
    "min": 2,
    "max": 5,
    "emoji": "🌧️",
    "titleFr": "Comptine de la pluie",
    "descFr": "Danse avec les gouttes qui tombent.",
    "titleEn": "Rain nursery rhyme",
    "descEn": "Dance with the falling drops.",
    "titleAr": "أنشودة المطر",
    "descAr": "ارقص مع القطرات المتساقطة.",
    "pages": [
      "Pluie, pluie, fais ta ronde.",
      "Tu danses sur mon parapluie.",
      "Plic ploc, je saute, je ris.",
      "La terre boit ta chanson."
    ],
    "flags": "",
    "type": "song",
    "audioFr": "Pluie, pluie, fais ta ronde. Tu danses sur mon parapluie. Plic ploc, je saute, je ris. La terre boit ta chanson.",
    "audioEn": "Rain, rain, go round and round. You dance on my umbrella. Pitter patter, I jump, I laugh. The earth drinks your song.",
    "audioAr": "مطر، مطر، دوري. ترقصين على مظلتي. قطرات، أقفز وأضحك. الأرض تشرب أغنيتك.",
    "extraTags": [
      "comptine",
      "rhyme",
      "song"
    ]
  },
  {
    "slug": "prem-comptine-animaux",
    "theme": "rhymes",
    "min": 3,
    "max": 5,
    "emoji": "🐾",
    "titleFr": "Comptine des animaux de la ferme",
    "descFr": "Chaque animal a son petit refrain.",
    "titleEn": "Farm animals nursery rhyme",
    "descEn": "Each animal has its little refrain.",
    "titleAr": "أنشودة الحيوانات",
    "descAr": "لكل حيوان لازمة صغيرة.",
    "pages": [
      "Le chat dit miaou, le chien ouaf.",
      "La vache meuh, le mouton bêê.",
      "On imite, on rit, on chante fort.",
      "La ferme est un orchestre."
    ],
    "flags": "pop",
    "type": "song",
    "audioFr": "Le chat dit miaou, le chien ouaf. La vache meuh, le mouton bêê. On imite, on rit, on chante fort. La ferme est un orchestre.",
    "audioEn": "The cat says meow, the dog woof. The cow moo, the sheep baa. We mimic, we laugh, we sing loud. The farm is an orchestra.",
    "audioAr": "القطة تقول مواء، الكلب نباح. البقرة خوخ، الخروف مaa. نقلد ونضحك ونغني بصوت عال. المزرعة فرقة موسيقية.",
    "extraTags": [
      "comptine",
      "rhyme",
      "song"
    ]
  },
  {
    "slug": "prem-comptine-dodo",
    "theme": "rhymes",
    "min": 2,
    "max": 4,
    "emoji": "😴",
    "titleFr": "Comptine du dodo",
    "descFr": "Une berceuse pour fermer les yeux.",
    "titleEn": "Sleepy nursery rhyme",
    "descEn": "A lullaby to close your eyes.",
    "titleAr": "أنشودة النوم",
    "descAr": "تهويدة لإغماض العينين.",
    "pages": [
      "Dodo, l'enfant do. Dodo, il fait si chaud.",
      "Dodo, le lait est bon. Dodo, voici le son.",
      "Dodo, ferme les yeux. Dodo, rêve en bleu.",
      "La nuit t'enveloppe comme une couverture douce."
    ],
    "flags": "",
    "type": "song",
    "audioFr": "Dodo, l'enfant do. Dodo, il fait si chaud. Dodo, le lait est bon. Dodo, voici le son. Dodo, ferme les yeux. Dodo, rêve en bleu.",
    "audioEn": "Sleep, little child. Sleep, it is so warm. Sleep, the milk is good. Sleep, here comes the sound. Sleep, close your eyes. Sleep, dream in blue.",
    "audioAr": "نام، يا طفل. نام، الجو دافئ. نام، الحليب طيب. نام، هذا الصوت. نام، أغمض عينيك. نام، احلم بالأزرق.",
    "extraTags": [
      "comptine",
      "rhyme",
      "song"
    ]
  },
  {
    "slug": "prem-comptine-saisons",
    "theme": "rhymes",
    "min": 4,
    "max": 7,
    "emoji": "🍂",
    "titleFr": "Comptine des saisons",
    "descFr": "Chante le tour de l'année.",
    "titleEn": "Seasons nursery rhyme",
    "descEn": "Sing through the year.",
    "titleAr": "أنشودة الفصول",
    "descAr": "غني دورة السنة.",
    "pages": [
      "Printemps fleurit, été brille.",
      "Automne danse, hiver dort.",
      "Quatre saisons, un refrain.",
      "On tourne, on chante, on rit."
    ],
    "flags": "",
    "type": "song",
    "audioFr": "Printemps fleurit, été brille. Automne danse, hiver dort. Quatre saisons, un refrain. On tourne, on chante, on rit.",
    "audioEn": "Spring blooms, summer shines. Autumn dances, winter sleeps. Four seasons, one refrain. We spin, we sing, we laugh.",
    "audioAr": "الربيع يزهر، الصيف يلمع. الخريف يرقص، الشتاء ينام. أربعة فصول، لازمة واحدة. ندور ونغني ونضحك.",
    "extraTags": [
      "comptine",
      "rhyme",
      "song",
      "seasonal"
    ]
  },
  {
    "slug": "prem-comptine-ecole",
    "theme": "rhymes",
    "min": 3,
    "max": 6,
    "emoji": "🎒",
    "titleFr": "Comptine de l'école",
    "descFr": "Chante la rentrée avec joie.",
    "titleEn": "School nursery rhyme",
    "descEn": "Sing the school year with joy.",
    "titleAr": "أنشودة المدرسة",
    "descAr": "غني العودة للمدرسة بفرح.",
    "pages": [
      "Cartable sur le dos, je marche content.",
      "Je dis bonjour à la maîtresse.",
      "Crayons, cahiers, sourires neufs.",
      "L'école est une fête."
    ],
    "flags": "new",
    "type": "song",
    "audioFr": "Cartable sur le dos, je marche content. Je dis bonjour à la maîtresse. Crayons, cahiers, sourires neufs. L'école est une fête.",
    "audioEn": "Backpack on my back, I walk happily. I say hello to the teacher. Pencils, notebooks, fresh smiles. School is a celebration.",
    "audioAr": "حقيبتي على ظهري، أمشي سعيداً. أقول مرحباً للمعلمة. أقلام، دفاتر، ابتسامات جديدة. المدرسة احتفال.",
    "extraTags": [
      "comptine",
      "rhyme",
      "song",
      "seasonal",
      "school"
    ]
  },
  {
    "slug": "prem-gratitude-jour",
    "theme": "spirituality",
    "min": 3,
    "max": 6,
    "emoji": "🙏",
    "titleFr": "La gratitude du jour",
    "descFr": "Trois mercis avant de dormir changent la nuit.",
    "titleEn": "The day's gratitude",
    "descEn": "Three thank-yous before sleep change the night.",
    "titleAr": "امتنان اليوم",
    "descAr": "ثلاثة شكر قبل النوم تغير الليل.",
    "pages": [
      "Le soir, l'enfant ferme les yeux.",
      "Il pense à un ami, un repas, un jeu.",
      "Il murmure merci trois fois.",
      "Son cœur se allège.",
      "Dormir avec gratitude, c'est dormir en paix."
    ],
    "flags": "rec"
  },
  {
    "slug": "prem-partage-pain",
    "theme": "spirituality",
    "min": 4,
    "max": 7,
    "emoji": "🍞",
    "titleFr": "Le partage du pain chaud",
    "descFr": "Partager un repas, c'est honorer l'autre.",
    "titleEn": "Sharing warm bread",
    "descEn": "Sharing a meal honors the other.",
    "titleAr": "مشاركة الخبز",
    "descAr": "مشاركة الوجبة تكرّم الآخر.",
    "pages": [
      "La table accueille des mains différentes.",
      "On coupe le pain en parts égales.",
      "On attend que tout le monde soit servi.",
      "Le silence est respectueux et doux.",
      "Partager, c'est dire : tu comptes."
    ],
    "flags": ""
  },
  {
    "slug": "prem-ramadan-etoile",
    "theme": "spirituality",
    "min": 5,
    "max": 9,
    "emoji": "🌙",
    "titleFr": "L'étoile du Ramadan",
    "descFr": "Une étoile veille sur les nuits de partage.",
    "titleEn": "The Ramadan star",
    "descEn": "A star watches over nights of sharing.",
    "titleAr": "نجمة رمضان",
    "descAr": "نجمة تسهر على ليالي المشاركة.",
    "pages": [
      "La lune croissante brille au-dessus des minarets.",
      "Les familles préparent la table.",
      "Les enfants apprennent la patience.",
      "Une étoile particulièrement brillante les observe.",
      "Elle rappelle : la générosité éclaire la nuit."
    ],
    "flags": "pop",
    "extraTags": [
      "seasonal",
      "ramadan"
    ]
  },
  {
    "slug": "prem-priere-douce",
    "theme": "spirituality",
    "min": 3,
    "max": 7,
    "emoji": "🕊️",
    "titleFr": "La prière douce",
    "descFr": "Une prière simple pour apaiser le cœur.",
    "titleEn": "The gentle prayer",
    "descEn": "A simple prayer to soothe the heart.",
    "titleAr": "الدعاء اللطيف",
    "descAr": "دعاء بسيط لتهدئة القلب.",
    "pages": [
      "Les mains se joignent, les yeux se ferment.",
      "Une prière murmure : protège ma famille.",
      "Le vent répond par un silence tendre.",
      "L'enfant sourit, rassuré.",
      "Prier, c'est confier ses peurs au ciel."
    ],
    "flags": "",
    "type": "audio_story",
    "audioFr": "Prières douces, mains jointes. Le ciel écoute ton cœur.",
    "audioEn": "Gentle prayers, hands together. The sky listens to your heart.",
    "audioAr": "أدعية لطيفة، أيدٍ متشابكة. السماء تسمع قلبك."
  },
  {
    "slug": "prem-generosite-coeur",
    "theme": "spirituality",
    "min": 4,
    "max": 8,
    "emoji": "💝",
    "titleFr": "La générosité du cœur",
    "descFr": "Donner sans compter rend le cœur plus large.",
    "titleEn": "Generosity of the heart",
    "descEn": "Giving without counting makes the heart wider.",
    "titleAr": "كرم القلب",
    "descAr": "العطاء بلا حساب يوسع القلب.",
    "pages": [
      "L'enfant glisse un jouet dans la boîte de dons.",
      "Il hésite, puis sourit.",
      "Un autre enfant le recevra.",
      "Son cœur bat plus fort, mais léger.",
      "La générosité laisse une chaleur durable."
    ],
    "flags": ""
  },
  {
    "slug": "prem-noel-lumiere",
    "theme": "spirituality",
    "min": 3,
    "max": 7,
    "emoji": "🕯️",
    "titleFr": "La lumière de Noël",
    "descFr": "Une bougie rappelle que la lumière vainc la peur.",
    "titleEn": "The Christmas light",
    "descEn": "A candle reminds us that light defeats fear.",
    "titleAr": "نور عيد الميلاد",
    "descAr": "شمعة تذكّر أن النور يهزم الخوف.",
    "pages": [
      "Une bougie brûle sur la table.",
      "L'enfant regarde la flamme danser.",
      "Il pense à ceux qui manquent.",
      "Il souffle un vœu de paix.",
      "Noël tient dans une lumière partagée."
    ],
    "flags": "new",
    "extraTags": [
      "seasonal",
      "christmas"
    ]
  },
  {
    "slug": "prem-atlas-des-reves",
    "theme": "world",
    "min": 8,
    "max": 10,
    "emoji": "🗺️",
    "titleFr": "L atlas des rêves",
    "descFr": "Un atlas magique emmène un lecteur curieux vers des continents imaginaires.",
    "titleEn": "The atlas of dreams",
    "descEn": "A magic atlas takes a curious reader to imaginary continents.",
    "titleAr": "أطلس الأحلام",
    "descAr": "أطلس سحري يأخذ قارئاً فضولياً إلى قارات خيالية.",
    "pages": [
      "Léo ouvre un atlas trop grand pour ses genoux.",
      "Chaque page sent le vent d un pays différent.",
      "Il voyage sans bouger, juste en lisant les noms.",
      "Il note dans un carnet ce qu il a compris du monde.",
      "Lire, c est aussi préparer de vrais voyages."
    ],
    "flags": "rec"
  },
  {
    "slug": "prem-club-scientifiques",
    "theme": "world",
    "min": 8,
    "max": 10,
    "emoji": "🔬",
    "titleFr": "Le club des petits scientifiques",
    "descFr": "Quatre amis mènent une expérience sur l amitié et la curiosité.",
    "titleEn": "The little scientists club",
    "descEn": "Four friends run an experiment about friendship and curiosity.",
    "titleAr": "نادي العلماء الصغار",
    "descAr": "أربعة أصدقاء يجرون تجربة عن الصداقة والفضول.",
    "pages": [
      "Le club se réunit dans le garage de Inès.",
      "Ils observent une graine qui pousse sous une lampe.",
      "Chacun note une hypothèse sans se moquer.",
      "La graine germe. Ils applaudissent la patience.",
      "La science commence souvent par un regard attentif."
    ],
    "flags": "pop",
    "extraTags": ["science", "school"]
  },
  {
    "slug": "prem-journal-heros",
    "theme": "jobs",
    "min": 8,
    "max": 10,
    "emoji": "📰",
    "titleFr": "Le journal des héros du quotidien",
    "descFr": "Un reporter junior interroge ceux qui aident chaque jour.",
    "titleEn": "The everyday heroes newspaper",
    "descEn": "A junior reporter interviews people who help every day.",
    "titleAr": "صحيفة أبطال اليوم",
    "descAr": "مراسل صغير يحاور من يساعدون كل يوم.",
    "pages": [
      "Amine prépare son carnet et son crayon.",
      "Il interroge le facteur, l infirmière, le boulanger.",
      "Chacun a une histoire simple et forte.",
      "Amine publie un journal mural à l école.",
      "Les vrais héros portent parfois un tablier."
    ],
    "flags": "new"
  },
  {
    "slug": "prem-code-etoiles",
    "theme": "space",
    "min": 8,
    "max": 10,
    "emoji": "💻",
    "titleFr": "Le code des étoiles",
    "descFr": "Une jeune programmeuse invente un jeu pour apprendre le ciel.",
    "titleEn": "The code of the stars",
    "descEn": "A young coder invents a game to learn the sky.",
    "titleAr": "شيفرة النجوم",
    "descAr": "مبرمجة صغيرة تخترع لعبة لتعلم السماء.",
    "pages": [
      "Sara écrit des lignes de code comme des constellations.",
      "Son jeu montre Orion et la Grande Ourse.",
      "Un bug apparaît. Elle respire et corrige.",
      "Ses amis jouent et apprennent les noms des étoiles.",
      "Créer, c est aussi partager sa curiosité."
    ],
    "flags": "rec"
  },
  {
    "slug": "prem-histoire-des-mots",
    "theme": "alphabet",
    "min": 8,
    "max": 10,
    "emoji": "📖",
    "titleFr": "L histoire secrète des mots",
    "descFr": "Un dictionnaire vivant raconte d où viennent les mots préférés.",
    "titleEn": "The secret history of words",
    "descEn": "A living dictionary tells where favorite words come from.",
    "titleAr": "التاريخ السري للكلمات",
    "descAr": "قاموس حي يروي من أين تأتي الكلمات المفضلة.",
    "pages": [
      "Nour ouvre un dictionnaire qui murmure.",
      "Le mot « courage » raconte un long voyage.",
      "Le mot « merci » brille d une lumière chaude.",
      "Nour comprend que les mots portent des histoires.",
      "Lire, c est voyager dans le temps des langues."
    ],
    "flags": ""
  }
];

export function buildPremiumExpansionCatalog() {
  return DEFS.map((d, i) => book(i, d));
}
