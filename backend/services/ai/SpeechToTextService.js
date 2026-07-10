import { AIProviderFactory } from './AIProviderFactory.js';
import { aiConfig } from './aiConfig.js';
import { normalizeAIError } from './errors.js';

const maxAudioBytes = 8 * 1024 * 1024;

export class SpeechToTextService {
  constructor({ aiProvider = null } = {}) {
    this.aiProvider = aiProvider;
  }

  async transcribe({ audioBuffer, mimeType, language = 'fr-FR' }) {
    const aiProvider = this.aiProvider || AIProviderFactory.getProvider(
      aiConfig.transcriptionProvider || aiConfig.provider
    );
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
      const response = await aiProvider.transcribeAudio({
        audioBuffer,
        mimeType,
        language
      });

      return {
        transcript: String(response.transcript || '').trim(),
        language: response.language || language,
        provider: aiProvider.name,
        provider_metadata: response.provider_metadata || {}
      };
    } catch (error) {
      throw normalizeAIError(error, {
        provider: aiProvider.name,
        fallbackMessage: 'Speech transcription failed'
      });
    }
  }
}

const speechToTextService = new SpeechToTextService();

export async function transcribeAudio(input) {
  return speechToTextService.transcribe(input);
}
