const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'audio',
  'audio_path',
  'sample_audio_path',
  'preview_audio_path',
  'provider_voice_id',
  'OPENAI_API_KEY',
  'ELEVENLABS_API_KEY'
]);

function redact(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 20).map(redact);

  return Object.entries(value).reduce((acc, [key, entry]) => {
    if (SENSITIVE_KEYS.has(key) || /password|token|secret|key|audio|voice/i.test(key)) {
      acc[key] = '[redacted]';
    } else if (entry && typeof entry === 'object') {
      acc[key] = redact(entry);
    } else {
      acc[key] = entry;
    }
    return acc;
  }, {});
}

export async function logSecurityEvent(pool, {
  userId = null,
  actorRole = null,
  action,
  resourceType = null,
  resourceId = null,
  req = null,
  metadata = {}
}) {
  if (!pool || !action) return;

  try {
    await pool.query(
      `INSERT INTO security_audit_logs (
        user_id, actor_role, action, resource_type, resource_id, ip_address, user_agent, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        actorRole,
        action,
        resourceType,
        resourceId ? String(resourceId).slice(0, 120) : null,
        req?.ip || req?.connection?.remoteAddress || null,
        req?.get?.('user-agent')?.slice(0, 300) || null,
        redact(metadata)
      ]
    );
  } catch (error) {
    console.warn('Security audit event could not be recorded:', error.message);
  }
}
