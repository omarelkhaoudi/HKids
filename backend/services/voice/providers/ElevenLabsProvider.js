import {
  AINetworkError,
  AIProviderUnavailableError,
  AIQuotaExceededError,
  AITimeoutError
} from '../../ai/errors.js';
import { VoiceProvider } from '../VoiceProvider.js';

function fileNameFromMimeType(mimeType = '') {
  if (mimeType.includes('wav')) return 'voice-sample.wav';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'voice-sample.mp3';
  if (mimeType.includes('ogg')) return 'voice-sample.ogg';
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'voice-sample.m4a';
  return 'voice-sample.webm';
}

export class ElevenLabsProvider extends VoiceProvider {
  constructor({
    apiKey,
    baseUrl,
    model,
    speechToTextModel,
    outputFormat,
    timeoutMs = 30000,
    maxRetries = 2
  } = {}) {
    super({ name: 'elevenlabs', timeoutMs, maxRetries, retryDelayMs: 300 });
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.elevenlabs.io/v1';
    this.model = model || 'eleven_multilingual_v2';
    this.speechToTextModel = speechToTextModel || 'scribe_v1';
    this.outputFormat = outputFormat || 'mp3_44100_128';
  }

  assertConfigured() {
    if (!this.apiKey) {
      throw new AIProviderUnavailableError('ElevenLabs provider is not configured', {
        provider: this.name,
        retryable: false
      });
    }
  }

  async request(path, {
    method = 'GET',
    headers = {},
    body = null,
    expectBinary = false,
    onChunk = null,
    signal = null,
    maxRetries = null
  } = {}) {
    this.assertConfigured();

    return this.execute(`${method} ${path}`, async ({ signal: requestSignal }) => {
      const response = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: {
            'xi-api-key': this.apiKey,
            ...headers
          },
          body,
          signal: requestSignal
      });

      if (response.ok) {
        if (onChunk) {
          if (!response.body) {
            throw new AIProviderUnavailableError('ElevenLabs returned no audio stream', {
              provider: this.name,
              retryable: false
            });
          }
          const reader = response.body.getReader();
          const chunks = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = Buffer.from(value);
            chunks.push(chunk);
            await onChunk(chunk);
          }
          return {
            buffer: Buffer.concat(chunks),
            contentType: response.headers.get('content-type') || 'audio/mpeg'
          };
        }
        if (expectBinary) {
          return {
            buffer: Buffer.from(await response.arrayBuffer()),
            contentType: response.headers.get('content-type') || 'audio/mpeg'
          };
        }
        return response.status === 204 ? {} : response.json().catch(() => ({}));
      }

      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody?.detail?.message || errorBody?.detail || `ElevenLabs request failed with status ${response.status}`;
      if (response.status === 401 || response.status === 403) {
        throw new AIProviderUnavailableError(String(message), {
          provider: this.name,
          retryable: false
        });
      }
      if (method === 'DELETE' && response.status === 404) return {};
      if (response.status === 408) throw new AITimeoutError(String(message), { provider: this.name });
      if (response.status === 429) throw new AIQuotaExceededError(String(message), { provider: this.name });
      if (response.status >= 500) throw new AINetworkError(String(message), { provider: this.name });
      throw new AIProviderUnavailableError(String(message), {
        provider: this.name,
        retryable: false
      });
    }, {
      ...(onChunk ? { maxRetries: 0 } : maxRetries === null ? {} : { maxRetries }),
      signal
    });
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
      body: formData,
      // Voice creation is not safely idempotent; retrying can orphan a paid clone.
      maxRetries: 0
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

    const result = await this.request(
      `/text-to-speech/${encodeURIComponent(providerVoiceId)}?output_format=${encodeURIComponent(this.outputFormat)}`,
      {
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
      }
    );

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

  async synthesizeSpeechStream({ providerVoiceId, text, onChunk, signal = null }) {
    if (typeof onChunk !== 'function') {
      throw new AIProviderUnavailableError('Audio stream consumer is required', {
        provider: this.name,
        retryable: false
      });
    }
    const cleanText = String(text || '').trim().slice(0, 5000);
    if (!providerVoiceId || !cleanText) {
      throw new AIProviderUnavailableError('Voice id and text are required for streaming synthesis', {
        provider: this.name,
        retryable: false
      });
    }

    const result = await this.request(
      `/text-to-speech/${encodeURIComponent(providerVoiceId)}/stream?output_format=${encodeURIComponent(this.outputFormat)}`,
      {
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
        onChunk,
        signal
      }
    );

    return {
      audioBuffer: result.buffer,
      mimeType: result.contentType,
      provider_metadata: {
        provider: this.name,
        model: this.model,
        voice_id: providerVoiceId,
        text_length: cleanText.length,
        streamed: true
      }
    };
  }

  async transcribeAudio({ audioBuffer, mimeType, language = 'fr-FR' }) {
    if (!audioBuffer) {
      throw new AIProviderUnavailableError('Audio is required for ElevenLabs transcription', {
        provider: this.name,
        retryable: false
      });
    }
    const formData = new FormData();
    formData.append('model_id', this.speechToTextModel);
    formData.append('file', new Blob([audioBuffer], { type: mimeType || 'audio/webm' }), fileNameFromMimeType(mimeType));
    formData.append('language_code', String(language || 'fr').split('-')[0].toLowerCase());

    const data = await this.request('/speech-to-text', {
      method: 'POST',
      body: formData
    });

    return {
      transcript: String(data?.text || '').trim(),
      language,
      provider_metadata: {
        provider: this.name,
        model: this.speechToTextModel,
        language_code: data?.language_code || null
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
