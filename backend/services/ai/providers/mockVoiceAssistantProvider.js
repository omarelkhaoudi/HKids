const THEME_KEYWORDS = {
  dinosaurs: ['dinosaure', 'dino', 'dinosaur'],
  space: ['espace', 'fusee', 'fusée', 'planete', 'planète', 'space', 'rocket'],
  animals: ['animal', 'animaux', 'animals'],
  princesses: ['princesse', 'princess'],
  jobs: ['metier', 'métier', 'pompier', 'doctor', 'job'],
  world: ['monde', 'voyage', 'world', 'travel']
};

const COPY = {
  fr: {
    empty: "Je n ai pas bien entendu. Tu peux recommencer doucement.",
    restricted: "Ce sujet n est pas disponible pour le moment. Choisissons ensemble une autre histoire.",
    screenLimit: "Ton temps d écran est terminé pour aujourd hui. Nous pourrons continuer plus tard.",
    outsideWindow: "Ce n est pas encore le moment prévu pour utiliser l assistant. Nous reprendrons pendant ton horaire autorisé.",
    dinosaurs: 'Bonne idee. Je vais chercher une histoire avec des dinosaures.',
    space: 'Super choix. Les histoires de l espace sont parfaites pour rever.',
    animals: 'D accord. Une histoire avec des animaux peut etre tres douce.',
    greeting: 'Bonjour{name}. Je suis la pour t aider a choisir une histoire.',
    interest: 'Je peux te proposer une histoire autour de {interest}.',
    hints: [
      'Tu peux choisir une histoire courte et l ecouter tranquillement.',
      'Je peux t aider a trouver une histoire avec des animaux, l espace ou les dinosaures.',
      'Si tu veux, demande une histoire douce pour le coucher.'
    ]
  },
  en: {
    empty: 'I did not hear you clearly. You can try again slowly.',
    restricted: 'That topic is not available right now. Let us choose another story together.',
    screenLimit: 'Your screen time is finished for today. We can continue later.',
    outsideWindow: 'It is not time to use the assistant yet. We can continue during your allowed time.',
    dinosaurs: 'Great idea. I will look for a story about dinosaurs.',
    space: 'Great choice. Space stories are wonderful for dreaming.',
    animals: 'Of course. A story with animals can be very gentle.',
    greeting: 'Hello{name}. I am here to help you choose a story.',
    interest: 'I can suggest a story about {interest}.',
    hints: [
      'You can choose a short story and listen quietly.',
      'I can help you find a story about animals, space, or dinosaurs.',
      'You can ask me for a gentle bedtime story.'
    ]
  },
  ar: {
    empty: 'لم أسمعك جيدًا. يمكنك المحاولة مرة أخرى بهدوء.',
    restricted: 'هذا الموضوع غير متاح الآن. لنختر قصة أخرى معًا.',
    screenLimit: 'انتهى وقت الشاشة اليوم. يمكننا المتابعة لاحقًا.',
    outsideWindow: 'هذا ليس الوقت المسموح لاستخدام المساعد. سنكمل في الوقت المحدد.',
    dinosaurs: 'فكرة جميلة. سأبحث عن قصة عن الديناصورات.',
    space: 'اختيار رائع. قصص الفضاء جميلة للأحلام.',
    animals: 'بكل سرور. يمكن أن تكون قصة الحيوانات لطيفة جدًا.',
    greeting: 'مرحبًا{name}. أنا هنا لمساعدتك في اختيار قصة.',
    interest: 'يمكنني اقتراح قصة عن {interest}.',
    hints: [
      'يمكنك اختيار قصة قصيرة والاستماع إليها بهدوء.',
      'يمكنني مساعدتك في العثور على قصة عن الحيوانات أو الفضاء أو الديناصورات.',
      'يمكنك أن تطلب مني قصة هادئة قبل النوم.'
    ]
  }
};

function normalizeForMatching(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function detectTheme(text) {
  return Object.entries(THEME_KEYWORDS).find(([, keywords]) => (
    keywords.some((keyword) => text.includes(normalizeForMatching(keyword)))
  ))?.[0] || null;
}

function isForbiddenRequest(text, context, requestedTheme) {
  const controls = context?.parental_controls || {};
  const allowedThemes = Array.isArray(controls.allowed_themes) ? controls.allowed_themes : [];

  if (requestedTheme && allowedThemes.length > 0 && !allowedThemes.includes(requestedTheme)) {
    return true;
  }

  const forbiddenCategories = Array.isArray(controls.forbidden_categories)
    ? controls.forbidden_categories
    : [];

  return forbiddenCategories.some((category) => {
    const categoryName = normalizeForMatching(category?.name);
    return categoryName && text.includes(categoryName);
  });
}

function format(template, values = {}) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, value || ''),
    template
  );
}

export class MockVoiceAssistantProvider {
  async respond({ transcript, context = {}, language = 'fr', conversation = [] }) {
    const text = normalizeForMatching(transcript);
    const responseLanguage = COPY[language] ? language : 'fr';
    const copy = COPY[responseLanguage];
    const firstName = String(context?.child?.first_name || '').trim();
    const nameSuffix = firstName ? ` ${firstName}` : '';
    const controls = context?.parental_controls || {};
    const personalizedReply = (replyText, intent) => ({
      text: firstName ? `${firstName}, ${replyText}` : replyText,
      intent
    });

    if (!text) {
      return { text: copy.empty, intent: 'empty' };
    }

    if (controls.screen_time_limit_reached) {
      return personalizedReply(copy.screenLimit, 'screen_time_limit');
    }

    if (controls.access_window?.currently_allowed === false) {
      return personalizedReply(copy.outsideWindow, 'outside_access_window');
    }

    const requestedTheme = detectTheme(text);
    if (isForbiddenRequest(text, context, requestedTheme)) {
      return personalizedReply(copy.restricted, 'parental_restriction');
    }

    if (requestedTheme === 'dinosaurs') {
      return personalizedReply(copy.dinosaurs, 'recommend_dinosaurs');
    }

    if (requestedTheme === 'space') {
      return personalizedReply(copy.space, 'recommend_space');
    }

    if (requestedTheme === 'animals') {
      return personalizedReply(copy.animals, 'recommend_animals');
    }

    if (['bonjour', 'salut', 'hello', 'hi', 'مرحبا', 'السلام'].some((word) => text.includes(word))) {
      return {
        text: format(copy.greeting, { name: nameSuffix }),
        intent: 'greeting'
      };
    }

    const interests = Array.isArray(context?.child?.interests) ? context.child.interests : [];
    if (interests[0]) {
      return personalizedReply(
        format(copy.interest, { interest: interests[0] }),
        conversation.length > 0 ? 'continue_personalized_help' : 'personalized_help'
      );
    }

    return personalizedReply(
      copy.hints[Math.floor(Math.random() * copy.hints.length)],
      conversation.length > 0 ? 'continue_conversation' : 'general_help'
    );
  }
}
