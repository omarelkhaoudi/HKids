import { AIProviderFactory } from './AIProviderFactory.js';
import { aiConfig } from './aiConfig.js';
import { normalizeAIError, withAITimeout } from './errors.js';

const maxAudioBytes = 8 * 1024 * 1024;

export class SpeechToTextService {
  constructor({ aiProvider = AIProviderFactory.getProvider(), timeoutMs = aiConfig.timeoutMs } = {}) {
    this.aiProvider = aiProvider;
    this.timeoutMs = timeoutMs;
  }

  async transcribe({ audioBuffer, mimeType, language = 'fr-FR' }) {
    if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length === 0) {
      const error = new Error('Audio file is required');
      error.status = 400;
      throw error;
    }

    if (audioBuffer.length > maxAudioBytes) {
      const error = new Error('Audio file is too large');
      error.status = 413;
      throw error;
    }

    try {
      const response = await withAITimeout(
        this.aiProvider.transcribeAudio({
          audioBuffer,
          mimeType,
          language
        }),
        this.timeoutMs,
        {
          provider: this.aiProvider.name,
          message: 'Speech transcription timed out. Please try again.'
        }
      );

      return {
        transcript: String(response.transcript || '').trim(),
        language: response.language || language,
        provider: this.aiProvider.name,
        provider_metadata: response.provider_metadata || {}
      };
    } catch (error) {
      throw normalizeAIError(error, {
        provider: this.aiProvider.name,
        fallbackMessage: 'Speech transcription failed'
      });
    }
  }
}

const speechToTextService = new SpeechToTextService();

export async function transcribeAudio(input) {
  return speechToTextService.transcribe(input);
}
