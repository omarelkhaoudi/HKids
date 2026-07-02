const bedtimeHints = [
  'Tu peux choisir une histoire courte et l ecouter tranquillement.',
  'Je peux t aider a trouver une histoire avec des animaux, l espace ou les dinosaures.',
  'Si tu veux, demande une histoire douce pour le coucher.',
];

export class MockVoiceAssistantProvider {
  async respond({ transcript }) {
    const text = String(transcript || '').trim().toLowerCase();

    if (!text) {
      return {
        text: "Je n ai pas bien entendu. Tu peux recommencer doucement.",
        intent: 'empty',
      };
    }

    if (text.includes('dinosaure') || text.includes('dino')) {
      return {
        text: 'Bonne idee. Je vais chercher une histoire avec des dinosaures.',
        intent: 'recommend_dinosaurs',
      };
    }

    if (text.includes('espace') || text.includes('fusée') || text.includes('planete')) {
      return {
        text: 'Super choix. Les histoires de l espace sont parfaites pour rever.',
        intent: 'recommend_space',
      };
    }

    if (text.includes('animal') || text.includes('animaux')) {
      return {
        text: 'D accord. Une histoire avec des animaux peut etre tres douce.',
        intent: 'recommend_animals',
      };
    }

    if (text.includes('bonjour') || text.includes('salut')) {
      return {
        text: 'Bonjour. Je suis la pour t aider a choisir une histoire.',
        intent: 'greeting',
      };
    }

    return {
      text: bedtimeHints[Math.floor(Math.random() * bedtimeHints.length)],
      intent: 'general_help',
    };
  }
}
