import { AIProviderFactory } from './AIProviderFactory.js';
import { aiConfig } from './aiConfig.js';
import { normalizeAIError, withAITimeout } from './errors.js';
import {
  createFallbackAssistantContext,
  normalizeConversation,
  resolveAssistantLanguage
} from './voiceAssistantContextService.js';

const provider = AIProviderFactory.getProvider();
const EMPTY_REPLIES = {
  fr: "Je n ai pas bien entendu. Tu peux recommencer doucement.",
  en: 'I did not hear you clearly. You can try again slowly.',
  ar: 'لم أسمعك جيدًا. يمكنك المحاولة مرة أخرى بهدوء.'
};

export class VoiceAssistantService {
  constructor({ aiProvider = provider, timeoutMs = aiConfig.timeoutMs } = {}) {
    this.aiProvider = aiProvider;
    this.timeoutMs = timeoutMs;
  }

  async getReply({
    transcript,
    user,
    context = createFallbackAssistantContext({ user }),
    conversation = [],
    requestedLanguage = null
  }) {
    const cleanTranscript = String(transcript || '').trim().slice(0, 1000);
    const safeConversation = normalizeConversation(conversation);
    const responseLanguage = resolveAssistantLanguage(context, requestedLanguage);

    if (!cleanTranscript) {
      return {
        transcript: '',
        reply_text: EMPTY_REPLIES[responseLanguage] || EMPTY_REPLIES.fr,
        intent: 'empty',
        provider: this.aiProvider.name,
        language: responseLanguage
      };
    }

    try {
      const response = await withAITimeout(
        this.aiProvider.chat({
          transcript: cleanTranscript,
          user,
          context,
          conversation: safeConversation,
          language: responseLanguage
        }),
        this.timeoutMs,
        {
          provider: this.aiProvider.name,
          message: 'Voice assistant timed out. Please try again.'
        }
      );

      return {
        transcript: cleanTranscript,
        reply_text: response.text,
        intent: response.intent || 'unknown',
        provider: this.aiProvider.name,
        language: responseLanguage
      };
    } catch (error) {
      throw normalizeAIError(error, {
        provider: this.aiProvider.name,
        fallbackMessage: 'AI assistant error'
      });
    }
  }
}

const voiceAssistantService = new VoiceAssistantService();

export async function getVoiceAssistantReply(input) {
  return voiceAssistantService.getReply(input);
}
