import { AIProviderFactory } from './AIProviderFactory.js';
import { normalizeAIError } from './errors.js';
import { aiConfig } from './aiConfig.js';
import { logAIEvent } from './aiLogger.js';
import {
  assertChildSafeText,
  normalizeAIInputText,
  sanitizeProviderText
} from './contentSafety.js';
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

const DEGRADED_REPLIES = {
  fr: 'Le Lit fait une petite pause. On peut recommencer doucement dans un instant.',
  en: 'Le Lit is taking a short pause. We can try again gently in a moment.',
  ar: 'ÙŠØ£Ø®Ø° Le Lit Ø§Ø³ØªØ±Ø§Ø­Ø© ØµØºÙŠØ±Ø©. ÙŠÙ…ÙƒÙ†Ù†Ø§ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø±Ø© Ø£Ø®Ø±Ù‰ Ø¨Ù‡Ø¯ÙˆØ¡.'
};

function isAiProviderConfigured(provider = null) {
  if (provider && Object.prototype.hasOwnProperty.call(provider, 'apiKey')) {
    return Boolean(String(provider.apiKey || '').trim());
  }

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

function buildDegradedReply(transcript, responseLanguage, error) {
  const normalized = normalizeAIError(error, {
    fallbackMessage: 'AI assistant degraded reply'
  });

  return {
    transcript,
    reply_text: DEGRADED_REPLIES[responseLanguage] || DEGRADED_REPLIES.fr,
    intent: 'service_degraded',
    provider: 'demo',
    language: responseLanguage,
    demo_mode: true,
    degraded_mode: true,
    retryable: normalized.retryable,
    code: normalized.code
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
    const cleanTranscript = normalizeAIInputText(transcript, { maxLength: 1000 });
    const safeConversation = normalizeConversation(conversation);
    const responseLanguage = resolveAssistantLanguage(context, requestedLanguage);

    if (!cleanTranscript) {
      return {
        transcript: '',
        reply_text: EMPTY_REPLIES[responseLanguage] || EMPTY_REPLIES.fr,
        intent: 'empty',
        provider: isAiProviderConfigured(aiProvider) ? aiProvider.name : 'demo',
        language: responseLanguage
      };
    }

    if (!isAiProviderConfigured(aiProvider)) {
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
      const replyText = sanitizeProviderText(response.text, { maxLength: 900 });
      assertChildSafeText(replyText, {
        provider: aiProvider.name,
        operation: 'voice_assistant_reply'
      });

      return {
        transcript: cleanTranscript,
        reply_text: replyText || (DEGRADED_REPLIES[responseLanguage] || DEGRADED_REPLIES.fr),
        intent: response.intent || 'unknown',
        provider: aiProvider.name,
        language: responseLanguage
      };
    } catch (error) {
      const normalized = normalizeAIError(error, {
        provider: aiProvider.name,
        fallbackMessage: 'AI assistant error'
      });
      logAIEvent('warn', 'assistant_fallback', {
        provider: aiProvider.name,
        operation: 'voice_assistant',
        code: normalized.code,
        status: normalized.status,
        fallback: 'demo'
      });
      return buildDegradedReply(cleanTranscript, responseLanguage, normalized);
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
    const cleanTranscript = normalizeAIInputText(transcript, { maxLength: 1000 });
    const safeConversation = normalizeConversation(conversation);
    const responseLanguage = resolveAssistantLanguage(context, requestedLanguage);

    if (!cleanTranscript) {
      const replyText = EMPTY_REPLIES[responseLanguage] || EMPTY_REPLIES.fr;
      if (onChunk) await onChunk(replyText);
      return {
        transcript: '',
        reply_text: replyText,
        intent: 'empty',
        provider: isAiProviderConfigured(aiProvider) ? aiProvider.name : 'demo',
        language: responseLanguage
      };
    }

    if (!isAiProviderConfigured(aiProvider)) {
      const demoReply = buildDemoReply(cleanTranscript, responseLanguage);
      if (onChunk) await onChunk(demoReply.reply_text);
      return demoReply;
    }

    try {
      const streamedChunks = [];
      const response = await aiProvider.chatStream({
        transcript: cleanTranscript,
        user,
        context,
        conversation: safeConversation,
        language: responseLanguage
      }, {
        signal,
        onChunk: async (chunk) => {
          streamedChunks.push(chunk);
          assertChildSafeText(streamedChunks.join(''), {
            provider: aiProvider.name,
            operation: 'voice_assistant_stream_chunk'
          });
          if (onChunk) await onChunk(chunk);
        }
      });
      const replyText = sanitizeProviderText(response.text, { maxLength: 900 });
      assertChildSafeText(replyText, {
        provider: aiProvider.name,
        operation: 'voice_assistant_stream_reply'
      });

      return {
        transcript: cleanTranscript,
        reply_text: replyText || (DEGRADED_REPLIES[responseLanguage] || DEGRADED_REPLIES.fr),
        intent: response.intent || 'conversation',
        provider: aiProvider.name,
        language: responseLanguage,
        provider_metadata: response.provider_metadata || {}
      };
    } catch (error) {
      const normalized = normalizeAIError(error, {
        provider: aiProvider.name,
        fallbackMessage: 'AI assistant streaming error'
      });
      logAIEvent('warn', 'assistant_stream_fallback', {
        provider: aiProvider.name,
        operation: 'voice_assistant_stream',
        code: normalized.code,
        status: normalized.status,
        fallback: 'demo'
      });
      const fallbackReply = buildDegradedReply(cleanTranscript, responseLanguage, normalized);
      if (onChunk) await onChunk(fallbackReply.reply_text);
      return fallbackReply;
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
