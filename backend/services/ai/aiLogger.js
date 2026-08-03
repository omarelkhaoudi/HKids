import { captureException, addBreadcrumb } from '../../config/sentry.js';

const ALLOWED_FIELDS = new Set([
  'provider',
  'operation',
  'model',
  'attempt',
  'duration_ms',
  'code',
  'status',
  'stream',
  'cache',
  'fallback',
  'circuit_state',
  'retry_after_ms',
  'tokens_prompt',
  'tokens_completion',
  'tokens_total',
  'audio_bytes',
  'text_length'
]);

const stats = new Map();

function sanitize(details = {}) {
  return Object.fromEntries(
    Object.entries(details).filter(([key, value]) => ALLOWED_FIELDS.has(key) && value !== undefined)
  );
}

function metricKey(details = {}) {
  return `${details.provider || 'unknown'}:${details.operation || 'unknown'}`;
}

function ensureMetric(details = {}) {
  const key = metricKey(details);
  if (!stats.has(key)) {
    stats.set(key, {
      provider: details.provider || 'unknown',
      operation: details.operation || 'unknown',
      requests: 0,
      completions: 0,
      retries: 0,
      failures: 0,
      fallbacks: 0,
      cache_hits: 0,
      total_duration_ms: 0,
      max_duration_ms: 0,
      tokens_prompt: 0,
      tokens_completion: 0,
      tokens_total: 0,
      audio_bytes: 0,
      last_event_at: null,
      last_code: null,
      last_status: null
    });
  }
  return stats.get(key);
}

function recordStats(event, details = {}) {
  const metric = ensureMetric(details);
  metric.last_event_at = new Date().toISOString();
  metric.last_code = details.code || metric.last_code;
  metric.last_status = details.status || metric.last_status;

  if (event === 'request_completed') {
    metric.requests += 1;
    metric.completions += 1;
    metric.total_duration_ms += Number(details.duration_ms || 0);
    metric.max_duration_ms = Math.max(metric.max_duration_ms, Number(details.duration_ms || 0));
  } else if (event === 'request_retry') {
    metric.retries += 1;
  } else if (event === 'request_failed') {
    metric.requests += 1;
    metric.failures += 1;
    metric.total_duration_ms += Number(details.duration_ms || 0);
    metric.max_duration_ms = Math.max(metric.max_duration_ms, Number(details.duration_ms || 0));
  } else if (event.includes('fallback')) {
    metric.fallbacks += 1;
  }

  if (details.cache === 'hit') metric.cache_hits += 1;
  metric.tokens_prompt += Number(details.tokens_prompt || 0);
  metric.tokens_completion += Number(details.tokens_completion || 0);
  metric.tokens_total += Number(details.tokens_total || 0);
  metric.audio_bytes += Number(details.audio_bytes || 0);
}

export function logAIEvent(level, event, details = {}) {
  recordStats(event, details);
  const payload = {
    timestamp: new Date().toISOString(),
    scope: 'ai',
    event,
    ...sanitize(details)
  };
  const writer = level === 'error'
    ? console.error
    : level === 'warn'
      ? console.warn
      : console.info;

  writer(JSON.stringify(payload));

  if (level === 'error') {
    captureException(new Error(`AI ${event}`), payload);
  } else {
    addBreadcrumb({ category: 'ai', message: event, level, data: sanitize(details) });
  }
}

export function getAIStats() {
  return Array.from(stats.values()).map((metric) => ({
    ...metric,
    average_duration_ms: metric.requests > 0
      ? Math.round(metric.total_duration_ms / metric.requests)
      : 0
  }));
}

export function resetAIStatsForTests() {
  stats.clear();
}
