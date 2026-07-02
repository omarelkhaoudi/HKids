import { MockVoiceAssistantProvider } from './providers/mockVoiceAssistantProvider.js';

function createProvider() {
  const provider = process.env.AI_VOICE_PROVIDER || 'mock';

  if (provider !== 'mock') {
    console.warn(`[ai] Unknown provider "${provider}", falling back to mock provider.`);
  }

  return new MockVoiceAssistantProvider();
}

const provider = createProvider();

export async function getVoiceAssistantReply({ transcript, user }) {
  const cleanTranscript = String(transcript || '').trim().slice(0, 1000);

  if (!cleanTranscript) {
    return {
      transcript: '',
      reply_text: "Je n ai pas bien entendu. Tu peux recommencer doucement.",
      intent: 'empty',
      provider: 'mock',
    };
  }

  const response = await provider.respond({
    transcript: cleanTranscript,
    user,
  });

  return {
    transcript: cleanTranscript,
    reply_text: response.text,
    intent: response.intent || 'unknown',
    provider: process.env.AI_VOICE_PROVIDER || 'mock',
  };
}
