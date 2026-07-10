const ALLOWED_FIELDS = new Set([
  'provider',
  'operation',
  'model',
  'attempt',
  'duration_ms',
  'code',
  'status',
  'stream'
]);

function sanitize(details = {}) {
  return Object.fromEntries(
    Object.entries(details).filter(([key, value]) => ALLOWED_FIELDS.has(key) && value !== undefined)
  );
}

export function logAIEvent(level, event, details = {}) {
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
}
