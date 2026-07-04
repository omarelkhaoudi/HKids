import {
  AINetworkError,
  AIProviderUnavailableError,
  AIQuotaExceededError,
  AITimeoutError
} from '../../ai/errors.js';
import { VoiceProvider } from '../VoiceProvider.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fileNameFromMimeType(mimeType = '') {
  if (mimeType.includes('wav')) return 'voice-sample.wav';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'voice-sample.mp3';
  if (mimeType.includes('ogg')) return 'voice-sample.ogg';
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'voice-sample.m4a';
  return 'voice-sample.webm';
}

export class ElevenLabsProvider extends VoiceProvider {
  constructor({ apiKey, baseUrl, model, maxRetries = 2 } = {}) {
    super({ name: 'elevenlabs' });
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.elevenlabs.io/v1';
    this.model = model || 'eleven_multilingual_v2';
    this.maxRetries = maxRetries;
  }

  assertConfigured() {
    if (!this.apiKey) {
      throw new AIProviderUnavailableError('ElevenLabs provider is not configured', { provider: this.name });
    }
  }

  async request(path, { method = 'GET', headers = {}, body = null, expectBinary = false } = {}) {
    this.assertConfigured();
    let lastError = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: {
            'xi-api-key': this.apiKey,
            ...headers
          },
          body
        });

        if (response.ok) {
          if (expectBinary) {
            return {
              buffer: Buffer.from(await response.arrayBuffer()),
              contentType: response.headers.get('content-type') || 'audio/mpeg'
            };
          }
          return response.status === 204 ? {} : await response.json().catch(() => ({}));
        }

        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody?.detail?.message || errorBody?.detail || `ElevenLabs request failed with status ${response.status}`;

        if (response.status === 401 || response.status === 403) {
          throw new AIProviderUnavailableError(String(message), { provider: this.name });
        }
        if (response.status === 408) {
          throw new AITimeoutError(String(message), { provider: this.name });
        }
        if (response.status === 429) {
          throw new AIQuotaExceededError(String(message), { provider: this.name });
        }
        if (response.status >= 500 && attempt < this.maxRetries) {
          lastError = new AINetworkError(String(message), { provider: this.name });
          await sleep(300 * 2 ** attempt);
          continue;
        }

        throw new AIProviderUnavailableError(String(message), { provider: this.name });
      } catch (error) {
        if (error?.isAIError && !(error instanceof AINetworkError)) throw error;

        lastError = error?.isAIError
          ? error
          : new AINetworkError(error?.message || 'ElevenLabs network error', { provider: this.name, cause: error });

        if (attempt < this.maxRetries) {
          await sleep(300 * 2 ** attempt);
          continue;
        }
      }
    }

    throw lastError || new AINetworkError('ElevenLabs request failed', { provider: this.name });
  }

  async createVoiceProfile({ audioSample, mimeType, metadata = {} }) {
    if (!audioSample) {
      throw new AIProviderUnavailableError('Audio sample is required to create an ElevenLabs voice', { provider: this.name });
    }

    const formData = new FormData();
    formData.append('name', metadata.name || 'Le Lit Qui Lit voice');
    formData.append('files', new Blob([audioSample], { type: mimeType || 'audio/webm' }), fileNameFromMimeType(mimeType));
    formData.append('description', `Voice profile for ${metadata.relation || 'family'} narration`);

    const data = await this.request('/voices/add', {
      method: 'POST',
      body: formData
    });

    return {
      status: data?.voice_id ? 'ready' : 'sample_received',
      provider_voice_id: data?.voice_id || null,
      provider_metadata: {
        provider: this.name,
        voice_id: data?.voice_id || null
      }
    };
  }

  async getVoiceStatus({ providerVoiceId }) {
    if (!providerVoiceId) {
      return {
        status: 'sample_received',
        provider_metadata: { provider: this.name }
      };
    }

    const data = await this.request(`/voices/${encodeURIComponent(providerVoiceId)}`);
    return {
      status: data?.voice_id ? 'ready' : 'sample_received',
      provider_metadata: {
        provider: this.name,
        voice_id: data?.voice_id || providerVoiceId,
        name: data?.name || null
      }
    };
  }

  async synthesizeSpeech({ providerVoiceId, text }) {
    if (!providerVoiceId) {
      throw new AIProviderUnavailableError('Provider voice id is required for ElevenLabs synthesis', { provider: this.name });
    }

    const cleanText = String(text || '').trim().slice(0, 5000);
    if (!cleanText) {
      throw new AIProviderUnavailableError('Text is required for ElevenLabs synthesis', { provider: this.name });
    }

    const result = await this.request(`/text-to-speech/${encodeURIComponent(providerVoiceId)}`, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: this.model,
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.75,
          style: 0.2,
          use_speaker_boost: true
        }
      }),
      expectBinary: true
    });

    return {
      audioBuffer: result.buffer,
      mimeType: result.contentType,
      provider_metadata: {
        provider: this.name,
        model: this.model,
        voice_id: providerVoiceId,
        text_length: cleanText.length
      }
    };
  }

  async deleteVoiceProfile({ providerVoiceId }) {
    if (!providerVoiceId) {
      return {
        deleted: true,
        provider_metadata: {
          provider: this.name,
          skipped: true
        }
      };
    }

    await this.request(`/voices/${encodeURIComponent(providerVoiceId)}`, {
      method: 'DELETE'
    });

    return {
      deleted: true,
      provider_metadata: {
        provider: this.name,
        voice_id: providerVoiceId
      }
    };
  }
}
