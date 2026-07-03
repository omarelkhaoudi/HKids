import { AIProviderFactory } from './AIProviderFactory.js';
import { aiConfig } from './aiConfig.js';
import { normalizeAIError, withAITimeout } from './errors.js';

const provider = AIProviderFactory.getProvider();

export class VoiceAssistantService {
  constructor({ aiProvider = provider, timeoutMs = aiConfig.timeoutMs } = {}) {
    this.aiProvider = aiProvider;
    this.timeoutMs = timeoutMs;
  }

  async getReply({ transcript, user }) {
    const cleanTranscript = String(transcript || '').trim().slice(0, 1000);

    if (!cleanTranscript) {
      return {
        transcript: '',
        reply_text: "Je n ai pas bien entendu. Tu peux recommencer doucement.",
        intent: 'empty',
        provider: this.aiProvider.name,
      };
    }

    try {
      const response = await withAITimeout(
        this.aiProvider.chat({
          transcript: cleanTranscript,
          user,
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
