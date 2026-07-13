import { AIProviderFactory } from './AIProviderFactory.js';
import { normalizeAIError } from './errors.js';
import { aiConfig } from './aiConfig.js';
import {
  createFallbackAssistantContext,
  normalizeConversation,
  resolveAssistantLanguage
} from './voiceAssistantContextService.js';

const EMPTY_REPLIES = {
  fr: "Je n ai pas bien entendu. Tu peux recommencer doucement.",
  en: 'I did not hear you clearly. You can try again slowly.',
  ar: 'لم أسمعك جيدًا. يمكنك المحاولة مرة أخرى بهدوء.'
};

const DEMO_REPLIES = {
  fr: 'Je suis Le Lit en mode demonstration. Pour une vraie conversation, il faut configurer la cle IA sur le serveur.',
  en: 'I am Le Lit in demo mode. Configure the AI API key on the server for a full conversation.',
  ar: 'أنا Le Lit في وضع العرض. لتفعيل المحادثة الكاملة، يجب إعداد مفتاح الذكاء الاصطناعي على الخادم.'
};

function isAiProviderConfigured() {
  const providerName = (aiConfig.provider || 'openai').toLowerCase();
  const normalizedName = providerName === 'claude' ? 'anthropic' : providerName;
  const providerConfig = aiConfig.providers[normalizedName];
  return Boolean(providerConfig?.apiKey);
}

function buildDemoReply(transcript, responseLanguage) {
  return {
    transcript,
    reply_text: DEMO_REPLIES[responseLanguage] || DEMO_REPLIES.fr,
    intent: 'demo_mode',
    provider: 'demo',
    language: responseLanguage,
    demo_mode: true
  };
}

export class VoiceAssistantService {
  constructor({ aiProvider = null } = {}) {
    this.aiProvider = aiProvider;
  }

  async getReply({
    transcript,
    user,
    context = createFallbackAssistantContext({ user }),
    conversation = [],
    requestedLanguage = null
  }) {
    const aiProvider = this.aiProvider || AIProviderFactory.getProvider();
    const cleanTranscript = String(transcript || '').trim().slice(0, 1000);
    const safeConversation = normalizeConversation(conversation);
    const responseLanguage = resolveAssistantLanguage(context, requestedLanguage);

    if (!cleanTranscript) {
      return {
        transcript: '',
        reply_text: EMPTY_REPLIES[responseLanguage] || EMPTY_REPLIES.fr,
        intent: 'empty',
        provider: isAiProviderConfigured() ? aiProvider.name : 'demo',
        language: responseLanguage
      };
    }

    if (!isAiProviderConfigured()) {
      return buildDemoReply(cleanTranscript, responseLanguage);
    }

    try {
      const response = await aiProvider.chat({
        transcript: cleanTranscript,
        user,
        context,
        conversation: safeConversation,
        language: responseLanguage
      });

      return {
        transcript: cleanTranscript,
        reply_text: response.text,
        intent: response.intent || 'unknown',
        provider: aiProvider.name,
        language: responseLanguage
      };
    } catch (error) {
      throw normalizeAIError(error, {
        provider: aiProvider.name,
        fallbackMessage: 'AI assistant error'
      });
    }
  }

  async getReplyStream({
    transcript,
    user,
    context = createFallbackAssistantContext({ user }),
    conversation = [],
    requestedLanguage = null
  }, { onChunk, signal } = {}) {
    const aiProvider = this.aiProvider || AIProviderFactory.getProvider();
    const cleanTranscript = String(transcript || '').trim().slice(0, 1000);
    const safeConversation = normalizeConversation(conversation);
    const responseLanguage = resolveAssistantLanguage(context, requestedLanguage);

    if (!cleanTranscript) {
      const replyText = EMPTY_REPLIES[responseLanguage] || EMPTY_REPLIES.fr;
      if (onChunk) await onChunk(replyText);
      return {
        transcript: '',
        reply_text: replyText,
        intent: 'empty',
        provider: isAiProviderConfigured() ? aiProvider.name : 'demo',
        language: responseLanguage
      };
    }

    if (!isAiProviderConfigured()) {
      const demoReply = buildDemoReply(cleanTranscript, responseLanguage);
      if (onChunk) await onChunk(demoReply.reply_text);
      return demoReply;
    }

    try {
      const response = await aiProvider.chatStream({
        transcript: cleanTranscript,
        user,
        context,
        conversation: safeConversation,
        language: responseLanguage
      }, { onChunk, signal });

      return {
        transcript: cleanTranscript,
        reply_text: response.text,
        intent: response.intent || 'conversation',
        provider: aiProvider.name,
        language: responseLanguage,
        provider_metadata: response.provider_metadata || {}
      };
    } catch (error) {
      throw normalizeAIError(error, {
        provider: aiProvider.name,
        fallbackMessage: 'AI assistant streaming error'
      });
    }
  }
}

const voiceAssistantService = new VoiceAssistantService();

export async function getVoiceAssistantReply(input) {
  return voiceAssistantService.getReply(input);
}

export async function streamVoiceAssistantReply(input, options) {
  return voiceAssistantService.getReplyStream(input, options);
}
