export class AIError extends Error {
  constructor(message, {
    code = 'AI_ERROR',
    status = 500,
    provider = null,
    retryable = false,
    cause = null
  } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.provider = provider;
    this.retryable = retryable;
    this.cause = cause;
    this.isAIError = true;
  }
}

export class AITimeoutError extends AIError {
  constructor(message = 'AI request timed out', options = {}) {
    super(message, {
      code: 'AI_TIMEOUT',
      status: 504,
      retryable: true,
      ...options
    });
  }
}

export class AIProviderUnavailableError extends AIError {
  constructor(message = 'AI provider unavailable', options = {}) {
    super(message, {
      code: 'AI_PROVIDER_UNAVAILABLE',
      status: 503,
      retryable: true,
      ...options
    });
  }
}

export class AIQuotaExceededError extends AIError {
  constructor(message = 'AI provider quota exceeded', options = {}) {
    super(message, {
      code: 'AI_QUOTA_EXCEEDED',
      status: 429,
      retryable: false,
      ...options
    });
  }
}

export class AINetworkError extends AIError {
  constructor(message = 'AI network error', options = {}) {
    super(message, {
      code: 'AI_NETWORK_ERROR',
      status: 503,
      retryable: true,
      ...options
    });
  }
}

export class AIProviderMethodNotImplementedError extends AIError {
  constructor(method, options = {}) {
    super(`AI provider method not implemented: ${method}`, {
      code: 'AI_METHOD_NOT_IMPLEMENTED',
      status: 501,
      retryable: false,
      ...options
    });
  }
}

export function normalizeAIError(error, { provider = null, fallbackMessage = 'AI service error' } = {}) {
  if (error?.isAIError) return error;

  const message = String(error?.message || '').toLowerCase();

  if (message.includes('timeout') || message.includes('timed out')) {
    return new AITimeoutError(fallbackMessage, { provider, cause: error });
  }

  if (message.includes('quota') || message.includes('rate limit') || message.includes('429')) {
    return new AIQuotaExceededError(fallbackMessage, { provider, cause: error });
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('econnreset') || message.includes('enotfound')) {
    return new AINetworkError(fallbackMessage, { provider, cause: error });
  }

  return new AIError(fallbackMessage, {
    code: 'AI_UNEXPECTED_ERROR',
    status: 500,
    provider,
    retryable: false,
    cause: error
  });
}

export function aiErrorResponse(error) {
  const normalized = normalizeAIError(error);

  return {
    status: normalized.status,
    body: {
      error: normalized.message,
      code: normalized.code,
      provider: normalized.provider,
      retryable: normalized.retryable
    }
  };
}

export function withAITimeout(promise, timeoutMs, { provider = null, message = 'AI request timed out' } = {}) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new AITimeoutError(message, { provider }));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}
