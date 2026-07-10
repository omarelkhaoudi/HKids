import {
  AITimeoutError,
  AIProviderMethodNotImplementedError,
  normalizeAIError
} from './errors.js';
import { logAIEvent } from './aiLogger.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AIProvider {
  constructor({
    name,
    timeoutMs = 15000,
    maxRetries = 2,
    retryDelayMs = 250
  }) {
    this.name = name;
    this.timeoutMs = timeoutMs;
    this.maxRetries = maxRetries;
    this.retryDelayMs = retryDelayMs;
  }

  async execute(operation, handler, {
    timeoutMs = this.timeoutMs,
    maxRetries = this.maxRetries,
    signal: externalSignal = null
  } = {}) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const startedAt = Date.now();
      const controller = new AbortController();
      const abortRequest = () => controller.abort();
      if (externalSignal?.aborted) controller.abort();
      else externalSignal?.addEventListener('abort', abortRequest, { once: true });
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const result = await handler({ signal: controller.signal, attempt });
        logAIEvent('info', 'request_completed', {
          provider: this.name,
          operation,
          attempt,
          duration_ms: Date.now() - startedAt
        });
        return result;
      } catch (error) {
        const normalized = error?.name === 'AbortError'
          ? new AITimeoutError(`${this.name} ${operation} timed out`, {
            provider: this.name,
            cause: error
          })
          : normalizeAIError(error, {
            provider: this.name,
            fallbackMessage: `${this.name} ${operation} failed`
          });

        lastError = normalized;
        const willRetry = normalized.retryable && attempt < maxRetries;
        logAIEvent(willRetry ? 'warn' : 'error', willRetry ? 'request_retry' : 'request_failed', {
          provider: this.name,
          operation,
          attempt,
          duration_ms: Date.now() - startedAt,
          code: normalized.code,
          status: normalized.status
        });

        if (!willRetry) throw normalized;
        await sleep(this.retryDelayMs * 2 ** attempt);
      } finally {
        clearTimeout(timeoutId);
        externalSignal?.removeEventListener('abort', abortRequest);
      }
    }

    throw lastError;
  }

  async generateStory() {
    throw new AIProviderMethodNotImplementedError('generateStory', { provider: this.name });
  }

  async chat() {
    throw new AIProviderMethodNotImplementedError('chat', { provider: this.name });
  }

  async chatStream(input, { onChunk } = {}) {
    const response = await this.chat(input);
    if (response?.text && onChunk) await onChunk(response.text);
    return response;
  }

  async transcribeAudio() {
    throw new AIProviderMethodNotImplementedError('transcribeAudio', { provider: this.name });
  }

  async recommendContent() {
    throw new AIProviderMethodNotImplementedError('recommendContent', { provider: this.name });
  }

  async cloneVoice() {
    throw new AIProviderMethodNotImplementedError('cloneVoice', { provider: this.name });
  }

  async translate() {
    throw new AIProviderMethodNotImplementedError('translate', { provider: this.name });
  }
}
