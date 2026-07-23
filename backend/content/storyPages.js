/**
 * Sprint 18 — complete reading pages for every catalog book.
 * Original French stories; each item gets at least 4 illustrated pages.
 */

const EXPANDED_PAGES = {
  'demo-dino-courage': [
    { text: 'Il était une fois Dino, un petit dinosaure vert aux taches dorées. Il adorait courir dans la prairie au soleil.' },
    { text: 'Quand la nuit arrivait, Dino regardait l ombre des arbres. Son ventre papillonnait un tout petit peu.' },
    { text: 'Sa maman s assit près de lui. « Tu portes une lumière dans le cœur, même quand il fait noir dehors. »' },
    { text: 'Dino serra son doudour. Il imagina une étoile qui brillait juste au-dessus de sa tête.' },
    { text: 'Il ferma les yeux en souriant. Dino savait qu il était courageux. Bonne nuit, petit dinosaure.' },
  ],
  'demo-voyage-lune': [
    { text: 'Léo enfile son casque doux et monte dans une fusée argentée. Aujourd hui, il part vers la lune.' },
    { text: 'La fusée décolle sans bruit. Par le hublot, la Terre devient une bille bleue très calme.' },
    { text: 'Des étoiles scintillent comme des lucioles géantes. Léo leur fait un signe amical.' },
    { text: 'Sur la lune, tout est paisible. Léo pose un drapeau fait d un tissu moelleux.' },
    { text: 'Il retourne se coucher dans sa capsule. Bonne nuit, petit astronaute. Les rêves t attendent.' },
  ],
  'demo-trois-cochons': [
    { text: 'Trois frères cochons décident de bâtir chacun une maison. Le premier choisit la paille, le second le bois.' },
    { text: 'Le troisième, patient, assemble de jolies briques rouges. « Notre maison tiendra longtemps », dit-il.' },
    { text: 'Un vent fort passe dans la forêt. Paille et bois s envolent en riant, sans méchanceté.' },
    { text: 'Les trois frères se réfugient dans la maison de briques. Ils se serrent gentiment.' },
    { text: 'Ensemble, ils dansent dans le salon. L amour de famille est plus solide que n importe quel mur.' },
  ],
  'fee-des-couleurs': [
    { text: 'Lila est une fée curieuse. Ce matin, elle ouvre son coffre magique rempli de poudre colorée.' },
    { text: 'Elle saupoudre du rouge sur une fraise, du bleu sur une goutte de rosée, du jaune sur un rayon de soleil.' },
    { text: 'Les couleurs dansent dans l air et dessinent un arc-en-ciel au-dessus du village.' },
    { text: 'Les enfants applaudissent. Lila leur apprend que chaque couleur a sa chanson.' },
    { text: 'Le soir venu, l arc-en-ciel s endort doucement. Lila range ses pinceaux. À demain, les couleurs !' },
  ],
  'princesse-lina': [
    { text: 'Princesse Lina habite un château où les rideaux flottent comme des nuages.' },
    { text: 'Un jour, un grand dragon s approche. Lina n a pas peur : le dragon porte un panier de marguerites.' },
    { text: '« Je m appelle Flamme, mais je ne crache que des bulles de savon », dit le dragon en rougissant.' },
    { text: 'Lina et Flamme préparent des tartines au miel. Ils rient quand une bulle éclate sur le nez du chat.' },
    { text: 'Depuis ce jour, le jardin du château fleurit deux fois plus fort. L amitié est la plus belle magie.' },
  ],
  'chat-curieux': [
    { text: 'Mimi le chat étire ses pattes et sort dans le jardin parfumé de lilas.' },
    { text: 'Un papillon bleu vole autour de ses moustaches. Mimi lève la patte sans le toucher, par respect.' },
    { text: 'Ils jouent à cache-cache entre les tulipes. Mimi ronronne comme un petit moteur joyeux.' },
    { text: 'Le papillon se pose sur une feuille. Mimi s allonge dans l herbe tiède pour l observer.' },
    { text: 'Le soleil descend doucement. Mimi rentre à la maison, le cœur plein de découvertes. Bonne nuit, Mimi.' },
  ],
  'pompiers-heroes': [
    { text: 'Sami ajuste son casque rouge brillant. Aujourd hui, il visite la caserne avec son oncle pompier.' },
    { text: 'La grande échelle monte vers le ciel. Sami apprend que les pompiers écoutent avant d agir.' },
    { text: 'La sirène chante doucement pour montrer le chemin. Personne n est seul quand on s entraide.' },
    { text: 'Sami arrose un petit plant dans le jardin de la caserne. Prendre soin, c est aussi protéger.' },
    { text: 'Le soir, Sami rêve de sourires sauvés. Demain, il sera peut-être un héros du quotidien.' },
  ],
  'abc-jardin': [
    { text: 'A comme Abeille qui butine joyeusement. B comme Bouton doré qui s ouvre au printemps.' },
    { text: 'C comme Chenille qui se transforme en papillon. D comme Dauphin qui saute dans la mare claire.' },
    { text: 'E comme Écureuil qui stocke des noisettes. F comme Fleur qui parfume le sentier.' },
    { text: 'G comme Grenouille qui coasse sous la pluie fine. H comme Herbe qui frémit au vent.' },
    { text: 'Le jardin entier est un alphabet vivant. Ferme les yeux : tu entends les lettres chanter ?' },
  ],
  'compte-avec-moi': [
    { text: 'Regarde le ciel : un soleil, deux nuages tout doux, trois oiseaux qui tournent en rond.' },
    { text: 'Dans le jardin : quatre fleurs rouges, cinq gouttes sur une feuille, six fourmis en file.' },
    { text: 'Sur la table : sept raisins, huit cubes colorés. Compte avec moi, lentement.' },
    { text: 'Neuf étoiles apparaissent. Dix doigts se joignent pour dire bonne nuit.' },
    { text: 'Compter, c est découvrir le monde. Et le monde est plein de surprises amicales.' },
  ],
  'demo-comptine-etoiles': [
    { text: 'Nina s allonge sur l herbe tiède. Le ciel s allume petit à petit, comme des lampes douces.' },
    { text: 'Petite étoile, brillante étoile, tu scintilles très haut dans le grand manteau bleu.' },
    { text: 'Nina ferme les paupières. Elle entend la nuit respirer calmement autour d elle.' },
    { text: 'Chaque étoile lui envoie un baiser de lumière. Son doudour est content aussi.' },
    { text: 'Ferme les yeux, bonne nuit, rêve tout doux. Demain, le soleil reviendra te sourire.' },
  ],
  'demo-bonne-nuit-ours': [
    { text: 'Petit ours brun prépare sa tanière avec des feuilles sèches et moelleuses.' },
    { text: 'Dehors, la lune dessine un chemin argenté entre les sapins. Tout est silencieux.' },
    { text: 'Dodo petit ours, dans ta grotte douce. La lune veille sur toi, fidèle amie.' },
    { text: 'Dans son rêve, l ours patine sur un nuage. Il glisse sans jamais tomber.' },
    { text: 'Bonne nuit, fais de beaux rêves. La forêt entière chuchote : « À demain. »' },
  ],
  'comptine-animaux': [
    { text: 'Au lever du jour, la ferme s éveille en musique. Le coq secoue sa crête dorée.' },
    { text: 'Le chat fait miaou, le chien fait ouaf, la vache fait meuh dans la grange.' },
    { text: 'Les canards barbotent en rond. Le cheval frappe doucement du sabot sur la paille.' },
    { text: 'Les enfants du village imitent chaque bruit en riant. C est un grand concert joyeux.' },
    { text: 'Chantons tous ensemble, c est rigolo ! Chaque animal a sa chanson et sa place au soleil.' },
  ],
  'chanson-du-matin': [
    { text: 'Le rideau s ouvre sur un ciel rose. Un oiseau gratte une note sur la branche.' },
    { text: 'Bonjour le soleil, bonjour la journée ! Les draps glissent, les pieds touchent le sol.' },
    { text: 'On s étire comme un chat qui bâille. On sourit à son reflet dans le miroir.' },
    { text: 'Le petit-déjeuner sent bon. Une tasse fume, une tartine attend gentiment.' },
    { text: 'C est parti pour jouer, apprendre et découvrir ! Aujourd hui est un cadeau neuf.' },
  ],
  'spiritual-01': [
    { text: 'Avant de dormir, Yassine regarde sa journée comme un album de photos dans sa tête.' },
    { text: 'Il se souvient du jeu dans la cour, du goûter partagé, du câlin de sa grand-mère.' },
    { text: '« Merci pour cette belle journée », murmure-t-il. « Merci pour les gens qui m aiment. »' },
    { text: 'Sa respiration devient lente. Ses mains se détendent sur la couverture.' },
    { text: 'Bonne nuit, petit cœur reconnaissant. Demain sera une nouvelle page à remplir de joie.' },
  ],
  'spiritual-02': [
    { text: 'Noé ouvre les grandes portes de l arche. La pluie tambourine doucement sur le toit.' },
    { text: 'Un lion, une tortue et deux colombes entrent en silence. Chaque animal a sa place.' },
    { text: 'Noé accueille chaque visiteur avec un mot doux et une couverture sèche.' },
    { text: 'L arche devient un refuge de paix. On entend des ronflements, des battements d ailes.' },
    { text: 'Dehors, l eau calme reflète un arc-en-ciel. L amour protège tous ceux qu il abrite.' },
  ],
  'spiritual-03': [
    { text: 'Sara prépare la table avec une nappe bleue. Il y a du pain chaud dans le panier.' },
    { text: 'Son ami Tom arrive les mains vides. Sara coupe la mie en deux parts égales.' },
    { text: '« Partager rend le cœur léger », dit-elle. Tom sourit, les yeux brillants.' },
    { text: 'Ils mâchent lentement, heureux. Le pain a meilleur goût quand il est offert.' },
    { text: 'Un morceau pour toi, un morceau pour moi. Ainsi grandit l amitié, simple et belle.' },
  ],
  'spiritual-04': [
    { text: 'La nuit tombe sur le sentier. Léa tient la main de son papa, un peu inquiète.' },
    { text: 'Papa allume une petite lanterne. Une tache dorée danse devant leurs pas.' },
    { text: '« Quand il fait noir, une lumière guide nos pas avec douceur », explique-t-il.' },
    { text: 'Les ombres reculent. Léa marche plus droite, fière de sa lanterne intérieure.' },
    { text: 'Ils arrivent à la maison. Léa sait qu une lumière veille toujours, même invisible.' },
  ],
  'spiritual-05': [
    { text: 'Jonas observe la mer depuis le bateau. Les vagues bercent le bois comme un berceau.' },
    { text: 'Il apprend à écouter le vent plutôt que de courir partout. Le silence lui répond.' },
    { text: 'Une grande baleine passe, douce comme une colline bleue. Jonas ne crie pas : il respire.' },
    { text: 'Il comprend qu on peut faire confiance à la vie, même quand on ne voit pas la rive.' },
    { text: 'La mer le ramène au calme. Jonas sourit. Il est prêt à recommencer, plus sage et plus doux.' },
  ],
  'spiritual-06': [
    { text: 'Dans le jardin partagé, les voisins plantent des graines en cercle.' },
    { text: 'Chacun arrose avec un arrosoir coloré. Personne ne se pousse, personne ne crie.' },
    { text: '« Ici, on sème la gentillesse », dit la jardinière. « Elle pousse comme une fleur. »' },
    { text: 'Des bourgeons éclosent : patience, partage, respect. Les abeilles applaudissent.' },
    { text: 'Le soir, le jardin sent bon. Demain, une nouvelle fleur ouvrira peut-être son cœur.' },
  ],
  'spiritual-07': [
    { text: 'Sur la colline, le berger compte ses brebis une par une. Aucune ne manque.' },
    { text: 'La plus petite trébuche. Le berger la porte sur ses épaules, sans se plaindre.' },
    { text: '« Personne n est oublié », murmure-t-il. La brebis lèche sa main pour le remercier.' },
    { text: 'Le troupeau se couche sous les étoiles. Le berger veille, immobile et attentif.' },
    { text: 'Quand tu te sens perdu, rappelle-toi : quelqu un compte jusqu à toi et t appelle par ton nom.' },
  ],
  'spiritual-08': [
    { text: 'Joseph range des jarres dans un grand palais. Il attend sans savoir ce qui viendra.' },
    { text: 'Les jours passent. Parfois Joseph doute, mais il continue à aider son voisin.' },
    { text: 'Un matin, une surprise lumineuse arrive : une mission qui demande courage.' },
    { text: 'Joseph respire profondément. Chaque jour difficile lui a appris la patience.' },
    { text: 'Il ouvre les bras. Demain apporte un cadeau nouveau, même quand on ne le voit pas encore.' },
  ],
  'spiritual-09': [
    { text: 'Avant la lumière éteinte, Emma fait le tour de sa journée avec ses parents.' },
    { text: '« Merci pour les câlins au réveil », dit-elle. « Merci pour les histoires du soir. »' },
    { text: '« Merci pour l amour qui reste quand je fais des bêtises », ajoute-t-elle en riant.' },
    { text: 'Maman et papa répondent : « Merci d exister. » Leurs voix sont des couvertures chaudes.' },
    { text: 'Emma ferme les yeux, comblée. La gratitude est une chanson qui réchauffe la nuit.' },
  ],
  'spiritual-10': [
    { text: 'Ce soir, Noa regarde les étoiles par sa fenêtre. La maison sent bon le lait tiède.' },
    { text: 'Maman lui chuchote : « Les anges veillent sur ton sommeil. Tu es protégée et aimée. »' },
    { text: 'Noa imagine de petites lumières qui dansent autour de son lit, légères comme des plumes.' },
    { text: 'Son doudou serre son cœur. Elle respire lentement, calme comme une vague qui s endort.' },
    { text: 'Les anges veillent. Noa s endort en souriant. Demain sera un nouveau jour merveilleux.' },
  ],
};

const THEME_OPENINGS = {
  dinosaurs: (title) => [
    `Au bord d une clairière verdoyante, ${title} commence une promenade tranquille.`,
    `Sous des fougères géantes, une petite aventure douce attend ${title}.`,
    `Le vent souffle sur les collines. ${title} écoute la forêt préhistorique respirer.`,
  ],
  space: (title) => [
    `Au-dessus des toits, ${title} observe le ciel qui s allume doucement.`,
    `Une navette imaginaire décolle sans bruit. ${title} flotte parmi les planètes calmes.`,
    `Les constellations dessinent un chemin. ${title} suit la lumière des étoiles.`,
  ],
  animals: (title) => [
    `Dans le parc du matin, ${title} s éveille avec le parfum de l herbe fraîche.`,
    `Près du ruisseau, ${title} découvre des traces minuscules dans la boue.`,
    `Les oiseaux saluent ${title}. La journée commence en douceur.`,
  ],
  princesses: (title) => [
    `Dans un royaume paisible, ${title} ouvre les fenêtres de son château.`,
    `Les rideaux roses dansent. ${title} prépare une surprise pour ses amis.`,
    `Une couronne de fleurs attend sur la table. ${title} sourit déjà.`,
  ],
  jobs: (title) => [
    `Ce matin, ${title} enfile un uniforme fièrement. Aujourd hui, il apprend un métier utile.`,
    `À l atelier, ${title} découvre que travailler ensemble rend tout plus simple.`,
    `Les outils brillent. ${title} écoute attentivement son mentor.`,
  ],
  world: (title) => [
    `Sur la carte du monde, ${title} trace un voyage imaginaire au crayon de couleur.`,
    `Un bateau en papier glisse sur l eau. ${title} rêve d îles amicales.`,
    `Les marchés sentent bon les épices. ${title} dit bonjour dans plusieurs langues.`,
  ],
  nature: (title) => [
    `La rosée perle sur les feuilles. ${title} marche pieds nus sur le sentier.`,
    `Un vent léger fait danser les branches. ${title} lève le nez vers les nuages.`,
    `La rivière murmure une chanson. ${title} s assied sur un tronc moussu.`,
  ],
  colors: (title) => [
    `Sur la table à dessin, ${title} aligne des crayons comme un arc-en-ciel.`,
    `Une goutte de peinture tombe et s étale. ${title} rit en voyant une tache dorée.`,
    `Le monde brille de mille teintes. ${title} choisit la couleur du bonheur.`,
  ],
  numbers: (title) => [
    `Sur le comptoir, ${title} aligne des cubes numérotés du plus petit au plus grand.`,
    `Dans la cuisine, ${title} compte les cuillères une par une, sans se presser.`,
    `Des chiffres flottent comme des bulles. ${title} les attrape avec le sourire.`,
  ],
  alphabet: (title) => [
    `Sur le tableau, ${title} écrit la première lettre du prénom de son ami.`,
    `Des cartes alphabet sont étalées. ${title} chante chaque lettre comme une note.`,
    `Le dictionnaire des enfants s ouvre. ${title} découvre un mot magique.`,
  ],
  spiritual: (title) => [
    `Quand la maison s apaise, ${title} prend un moment pour réfléchir à sa journée.`,
    `Une bougie imaginaire brille dans le cœur de ${title}. Tout devient plus doux.`,
    `Assis près de la fenêtre, ${title} remercie la vie pour les petites merveilles.`,
  ],
  rhymes: (title) => [
    `La mélodie commence par un petit tap-tap. ${title} bat des mains en rythme.`,
    `Une comptine naît dans la cuisine. ${title} la fredonne en dansant sur place.`,
    `Les paroles s enchaînent comme des perles. ${title} les porte avec joie.`,
  ],
  shapes: (title) => [
    `Sur le tapis, ${title} assemble des formes en mosaïque colorée.`,
    `Rond, carré, triangle : ${title} les reconnaît dans la chambre.`,
    `Une boîte de puzzles s ouvre. ${title} cherche la pièce qui brille.`,
  ],
  bedtime: (title) => [
    `La lampe de chevet s allume. ${title} tire la couette jusqu au menton.`,
    `Dehors, la lune sourit. ${title} bâille tout doucement.`,
    `Les jouets se rangent. ${title} prépare un rêve tout moelleux.`,
  ],
  ocean: (title) => [
    `Les vagues murmurent sur le sable. ${title} laisse les pieds dans l eau tiède.`,
    `Un coquillage brille. ${title} y entend une chanson de mer.`,
    `Sous la surface turquoise, ${title} découvre un jardin d algues calmes.`,
  ],
  vehicles: (title) => [
    `Le moteur ronronne comme un chat. ${title} boucle sa ceinture imaginaire.`,
    `La route s ouvre devant ${title}, pleine de virages doux et de paysages.`,
    `Un train siffle au loin. ${title} compte les wagons qui passent.`,
  ],
  spirituality: (title) => [
    `Quand la maison s apaise, ${title} prend un moment pour remercier la journée.`,
    `Une lumière douce habite le cœur de ${title}. Tout devient plus calme.`,
    `Assis près de la fenêtre, ${title} pense à ceux qu il aime.`,
  ],
};

const THEME_MIDDLES = {
  dinosaurs: [
    'Un fossile luisant montre des empreintes amusantes. Chaque trace raconte une histoire de courage.',
    'Un ami ptérodactyle passe et salue de l aile. On se sent moins seul dans la grande vallée.',
    'La pluie fine tombe. Sous une feuille large, tout le monde rit en se serrant.',
  ],
  space: [
    'Une comète dessine un trait d argent. On souffle dessus comme sur un gâteau d anniversaire.',
    'La lune se reflète dans une flaque. On dirait un second satellite tout près de nos pieds.',
    'Des astronautes en peluche flottent dans la chambre. Ils ne touchent jamais le sol.',
  ],
  animals: [
    'Un hérisson traverse le chemin. On l attend patiemment, le cœur respectueux.',
    'Deux canetons suivent leur maman en file indienne. C est une parade adorable.',
    'Un papillon se pose sur un nez curieux. Personne ne bouge : c est un cadeau fragile.',
  ],
  princesses: [
    'Une fête de thé réunit des voisins du royaume. Chacun apporte un biscuit à partager.',
    'Un dragon timide offre des fleurs. Les pétales sentent bon la confiance.',
    'Les musiciens jouent une valse lente. Même les chaises ont envie de danser.',
  ],
  jobs: [
    'On apprend à poser une question avant d agir. C est la clé des vrais héros.',
    'Un mentor explique que l entraide vaut plus qu une médaille.',
    'Les gants sont un peu grands, mais l envie de bien faire est parfaite.',
  ],
  world: [
    'On découvre une coutume nouvelle : dire bonjour avec les mains jointes.',
    'Un pont en bois mène à un village où l on partage toujours la dernière figue.',
    'Une carte au trésor mène… au lit, où les rêves voyagent plus loin que les bateaux.',
  ],
  nature: [
    'Une libellule bleue inspecte les roseaux. Le temps semble ralentir.',
    'Les champignons forment une famille sous la mousse. On chuchote pour ne pas les réveiller.',
    'Le coucher de soleil peint l horizon en orange tendre.',
  ],
  colors: [
    'Le rouge réchauffe, le bleu calme, le jaune éclaire. Chaque couleur a un rôle.',
    'On mélange deux teintes et une surprise apparaît : le vert, ami de la forêt.',
    'Les doigts colorés laissent des empreintes joyeuses sur une grande feuille.',
  ],
  numbers: [
    'Trois sauts, quatre tours, cinq éclats de rire. Les chiffres dansent aussi.',
    'On partage huit bonbons équitablement. Personne n est oublié autour de la table.',
    'Neuf pas mènent à la porte du jardin secret. Dix, et on y est !',
  ],
  alphabet: [
    'La lettre M ouvre le mot « merci ». C est peut-être la plus belle.',
    'On compose son prénom avec des magnets. Chaque lettre brille un instant.',
    'Un livre tombe ouvert sur la lettre R, comme par magie.',
  ],
  spiritual: [
    'On pense à ceux qui ont été gentils aujourd hui. Le cœur devient plus spacieux.',
    'Une prière silencieuse ressemble à une couverture posée sur les épaules.',
    'On pardonne à la petite bêtise du matin. Demain recommence, tout neuf.',
  ],
  rhymes: [
    'On tape des pieds, on claque des doigts. Le rythme nous porte comme un bateau.',
    'Les paroles reviennent toutes seules. C est la magie des chansons partagées.',
    'On invente un couplet neuf. Même le chat écoute, les oreilles dressées.',
  ],
  shapes: [
    'Le cercle du soleil ressemble au zero qui ouvre le comptage.',
    'Deux triangles dos à dos forment une maison de papier.',
    'On trouve un carré dans la fenêtre et un ovale dans le miroir.',
  ],
  bedtime: [
    'Le doudou sent encore le soleil de la journée. Il raconte des souvenirs tièdes.',
    'On compte trois étoiles à la fenêtre. La quatrième est déjà un rêve.',
    'La respiration devient une vague lente. La chambre est un bateau sûr.',
  ],
  ocean: [
    'Une méduse transparente danse sans bruit. On la regarde avec respect.',
    'Les poissons forment un ruban d argent. Personne n est seul dans le courant.',
    'Un phare clignote au loin. Sa lumière dit : « Tu retrouveras le rivage. »',
  ],
  vehicles: [
    'Les clignotants chantent une petite musique. La route devient un jeu.',
    'On salue un camion rouge. Le chauffeur répond d un grand sourire.',
    'À chaque arrêt, on découvre un détail : un oiseau, un panneau, un nuage.',
  ],
  spirituality: [
    'On pense à ceux qui ont été gentils aujourd hui. Le cœur devient plus spacieux.',
    'Une prière silencieuse ressemble à une couverture posée sur les épaules.',
    'On pardonne à la petite bêtise du matin. Demain recommence, tout neuf.',
  ],
};

const THEME_ENDINGS = [
  'Le jour se termine en douceur. Demain apportera une nouvelle page à lire.',
  'Les yeux deviennent lourds, le souffle ralentit. Tout est bien, tout est calme.',
  'Une dernière lumière s éteint. Les rêves attendent, doux comme un câlin.',
  'On range ses jouets et son cœur. Bonne nuit, petit explorateur.',
  'Le monde continue de tourner, protégé et paisible. Endors-toi en souriant.',
];

function hashSlug(slug, salt = 0) {
  let hash = salt;
  for (let index = 0; index < slug.length; index += 1) {
    hash = (hash * 31 + slug.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pick(list, slug, salt = 0) {
  if (!list?.length) return '';
  return list[hashSlug(slug, salt) % list.length];
}

function heroFromTitle(title = '') {
  const trimmed = title.trim();
  if (!trimmed) return 'L enfant';
  const words = trimmed.split(/\s+/);
  if (words.length <= 3) return trimmed;
  return words.slice(0, 3).join(' ');
}

function composeStoryPages(item) {
  const slug = item.slug;
  const hero = heroFromTitle(item.title);
  const theme = item.theme || 'world';
  const openings = THEME_OPENINGS[theme] || THEME_OPENINGS.world;
  const middles = THEME_MIDDLES[theme] || THEME_MIDDLES.world;
  const audioLine = item.audio_text?.replace(/\s+/g, ' ').trim();

  const openingTemplate = pick(openings, slug, 1);
  const openingText = typeof openingTemplate === 'function'
    ? openingTemplate(hero)
    : openingTemplate;

  const pages = [
    { text: openingText },
    { text: pick(middles, slug, 2) },
    { text: pick(middles, slug, 3) },
    audioLine
      ? { text: `${hero} s arrête un instant. ${audioLine}` }
      : { text: pick(middles, slug, 4) },
    { text: pick(THEME_ENDINGS, slug, 5) },
  ];

  return pages.filter((page) => page.text && page.text.length > 8);
}

export function resolveStoryPages(item) {
  if (EXPANDED_PAGES[item.slug]?.length) {
    return EXPANDED_PAGES[item.slug];
  }

  if (Array.isArray(item.pages) && item.pages.length >= 4) {
    return item.pages;
  }

  if (Array.isArray(item.pages) && item.pages.length > 0) {
    const composed = composeStoryPages(item);
    const merged = [...item.pages];
    while (merged.length < 4) {
      merged.push(composed[merged.length] || composed[composed.length - 1]);
    }
    if (merged.length < 5) {
      merged.push(composed[composed.length - 1]);
    }
    return merged;
  }

  return composeStoryPages(item);
}

export function enrichCatalogWithPages(catalog = []) {
  return catalog.map((item) => ({
    ...item,
    pages: resolveStoryPages(item),
  }));
}

export function estimateReadingMinutes(pageCount = 0) {
  return Math.max(1, Math.ceil(pageCount * 0.45));
}
