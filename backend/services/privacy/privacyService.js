import bcrypt from 'bcryptjs';
import { getDatabase } from '../../database/init.js';
import { logSecurityEvent } from '../security/auditLog.js';
import { getStripe, isStripeConfigured } from '../stripe/stripeConfig.js';
import { purgeUserVoiceData } from '../voice/voiceDataDeletionService.js';
import { invalidateParentDashboardCache } from '../parentDashboardService.js';

const PRIVACY_ACTIONS = Object.freeze([
  'privacy_export_viewed',
  'privacy_export_downloaded',
  'privacy_local_data_cleared',
  'kid_profile_deleted_permanently',
  'parent_account_deleted_permanently'
]);

function privacyError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export function boundedInteger(value, fallback, min = 0, max = 100) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function buildPrivacyExportFilename(userId, date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  return `hkids-rgpd-${Number(userId)}-${day}.json`;
}

export async function requireParentAccount(userId, pool = getDatabase()) {
  const result = await pool.query(
    `SELECT id, username, password, role, created_at
     FROM users
     WHERE id = $1 AND role = 'parent'
     LIMIT 1`,
    [userId]
  );
  if (!result.rows[0]) {
    throw privacyError(403, 'Parent account required', 'PARENT_ACCOUNT_REQUIRED');
  }
  return result.rows[0];
}

export async function verifyParentPassword(userId, password, pool = getDatabase()) {
  if (!password || typeof password !== 'string') {
    throw privacyError(400, 'Password confirmation required', 'PASSWORD_REQUIRED');
  }
  const user = await requireParentAccount(userId, pool);
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw privacyError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }
  return user;
}

async function rows(pool, text, values = []) {
  const result = await pool.query(text, values);
  return result.rows;
}

export async function createPrivacyExport(userId, pool = getDatabase()) {
  const account = await requireParentAccount(userId, pool);
  const kids = await rows(
    pool,
    `SELECT id, name, avatar, age, date_of_birth, photo_url, preferred_language,
            interests, created_at, updated_at
     FROM kids_profiles
     WHERE parent_id = $1
     ORDER BY created_at ASC`,
    [userId]
  );
  const kidIds = kids.map((kid) => kid.id);

  const [
    approvals,
    rules,
    progress,
    sessions,
    goals,
    screenTime,
    favorites,
    history,
    imports,
    downloads,
    stories,
    learningAttempts,
    challengeProgress,
    rewards,
    subscriptions,
    unlocks,
    invoices,
    subscriptionEvents,
    voiceProfiles,
    voiceMessages,
    voiceAuditLogs,
    voiceConsents,
    voiceUsage,
    voiceNarrations,
    reports,
    securityLogs
  ] = await Promise.all([
    rows(pool, 'SELECT * FROM parent_approvals WHERE kid_profile_id = ANY($1::int[]) ORDER BY created_at ASC', [kidIds]),
    rows(pool, 'SELECT * FROM parental_rules WHERE kid_profile_id = ANY($1::int[]) ORDER BY created_at ASC', [kidIds]),
    rows(pool, 'SELECT * FROM kid_reading_progress WHERE kid_profile_id = ANY($1::int[]) ORDER BY created_at ASC', [kidIds]),
    rows(pool, 'SELECT * FROM kid_reading_sessions WHERE kid_profile_id = ANY($1::int[]) ORDER BY created_at ASC', [kidIds]),
    rows(pool, 'SELECT * FROM kid_reading_goals WHERE kid_profile_id = ANY($1::int[]) ORDER BY created_at ASC', [kidIds]),
    rows(pool, 'SELECT * FROM kid_screen_time_sessions WHERE kid_profile_id = ANY($1::int[]) ORDER BY created_at ASC', [kidIds]),
    rows(pool, 'SELECT * FROM kid_book_favorites WHERE kid_profile_id = ANY($1::int[]) ORDER BY created_at ASC', [kidIds]),
    rows(pool, 'SELECT * FROM kid_book_history WHERE kid_profile_id = ANY($1::int[]) ORDER BY created_at ASC', [kidIds]),
    rows(pool, 'SELECT * FROM kid_data_imports WHERE kid_profile_id = ANY($1::int[]) ORDER BY imported_at ASC', [kidIds]),
    rows(pool, 'SELECT * FROM kid_download_registry WHERE kid_profile_id = ANY($1::int[]) ORDER BY downloaded_at ASC', [kidIds]),
    rows(
      pool,
      `SELECT id, kid_profile_id, title, story_text, summary, language, theme, age_level,
              characters, estimated_duration_minutes, educational_value, age_at_generation,
              prompt_metadata, generation_metadata, chapters, interactive_choices,
              illustration_plan, narration_metadata, provider, saved, saved_at, favorite,
              favorited_at, source_story_id, version_number, created_at, updated_at
       FROM generated_stories
       WHERE kid_profile_id = ANY($1::int[])
       ORDER BY created_at ASC`,
      [kidIds]
    ),
    rows(pool, 'SELECT * FROM learning_attempts WHERE kid_profile_id = ANY($1::int[]) ORDER BY created_at ASC', [kidIds]),
    rows(pool, 'SELECT * FROM kid_challenge_progress WHERE kid_profile_id = ANY($1::int[]) ORDER BY updated_at ASC', [kidIds]),
    rows(pool, 'SELECT * FROM kid_rewards WHERE kid_profile_id = ANY($1::int[]) ORDER BY created_at ASC', [kidIds]),
    rows(
      pool,
      `SELECT us.id, us.status, us.started_at, us.current_period_start, us.current_period_end,
              us.cancel_at_period_end, us.provider, us.provider_subscription_id,
              us.created_at, us.updated_at,
              sp.code AS plan_code, sp.name AS plan_name, sp.monthly_price_cents, sp.currency
       FROM user_subscriptions us
       JOIN subscription_plans sp ON sp.id = us.plan_id
       WHERE us.user_id = $1
       ORDER BY us.created_at ASC`,
      [userId]
    ),
    rows(pool, 'SELECT * FROM subscription_book_unlocks WHERE user_id = $1 ORDER BY unlocked_at ASC', [userId]),
    rows(
      pool,
      `SELECT id, stripe_invoice_id, stripe_subscription_id, amount_paid, currency, status,
              hosted_invoice_url, invoice_pdf, period_start, period_end, paid_at, created_at
       FROM subscription_invoices
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    ),
    rows(
      pool,
      `SELECT id, event_type, created_at
       FROM subscription_events
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    ),
    rows(
      pool,
      `SELECT id, name, relation, language, status, provider, consent_given, consent_at,
              quality_score, quality_status, quality_notes, created_at, updated_at, deleted_at,
              (sample_audio_path IS NOT NULL) AS has_sample_audio,
              (preview_audio_path IS NOT NULL) AS has_preview_audio
       FROM voice_profiles
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    ),
    rows(
      pool,
      `SELECT id, voice_profile_id, title, message_text, language, duration_seconds,
              created_at, deleted_at, (audio_path IS NOT NULL) AS has_audio
       FROM voice_messages
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    ),
    rows(pool, 'SELECT id, voice_profile_id, action, metadata, created_at FROM voice_audit_logs WHERE user_id = $1 ORDER BY created_at ASC', [userId]),
    rows(
      pool,
      `SELECT id, voice_profile_id, consent_version, legal_text_hash, scope, locale,
              ip_address, user_agent, granted_at, revoked_at
       FROM voice_consent_records
       WHERE user_id = $1
       ORDER BY granted_at ASC`,
      [userId]
    ),
    rows(pool, 'SELECT id, voice_profile_id, operation, provider, character_count, created_at FROM voice_usage_records WHERE user_id = $1 ORDER BY created_at ASC', [userId]),
    rows(
      pool,
      `SELECT id, voice_profile_id, book_id, provider, duration_seconds, metadata,
              created_at, updated_at
       FROM voice_narrations
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    ),
    rows(
      pool,
      `SELECT id, target_type, target_id, reason, details, status, priority,
              resolution_note, resolved_at, created_at, updated_at
       FROM content_reports
       WHERE reporter_user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    ),
    rows(
      pool,
      `SELECT id, action, resource_type, resource_id, ip_address, user_agent,
              metadata, created_at
       FROM security_audit_logs
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    )
  ]);

  return {
    format: 'HKids GDPR export',
    version: 1,
    generated_at: new Date().toISOString(),
    account: {
      id: account.id,
      username: account.username,
      role: account.role,
      created_at: account.created_at
    },
    children: kids,
    parental_controls: { approvals, rules },
    reading: { progress, sessions, goals, screen_time: screenTime, favorites, history },
    offline_sync: { imports, downloads },
    generated_stories: stories,
    learning: { attempts: learningAttempts, challenge_progress: challengeProgress, rewards },
    billing: { subscriptions, unlocks, invoices, events: subscriptionEvents },
    voices: {
      profiles: voiceProfiles,
      messages: voiceMessages,
      audit_logs: voiceAuditLogs,
      consents: voiceConsents,
      usage: voiceUsage,
      narrations: voiceNarrations
    },
    reports,
    security_logs: securityLogs
  };
}

export async function recordPrivacyEvent({
  user,
  action,
  req = null,
  metadata = {},
  pool = getDatabase()
}) {
  if (!PRIVACY_ACTIONS.includes(action)) {
    throw privacyError(400, 'Invalid privacy event', 'INVALID_PRIVACY_EVENT');
  }
  await logSecurityEvent(pool, {
    userId: user.id,
    actorRole: user.role,
    action,
    resourceType: 'privacy',
    resourceId: user.id,
    req,
    metadata
  });
}

export async function listPrivacyLogs({
  userId,
  limit = 50,
  offset = 0,
  pool = getDatabase()
}) {
  const safeLimit = boundedInteger(limit, 50, 1, 100);
  const safeOffset = boundedInteger(offset, 0, 0, 100_000);
  const result = await pool.query(
    `SELECT id, action, resource_type, resource_id, metadata, created_at,
            COUNT(*) OVER()::int AS total
     FROM security_audit_logs
     WHERE user_id = $1
       AND action = ANY($2::text[])
     ORDER BY created_at DESC
     LIMIT $3 OFFSET $4`,
    [userId, PRIVACY_ACTIONS, safeLimit, safeOffset]
  );
  return {
    items: result.rows.map(({ total: _total, ...item }) => item),
    total: Number(result.rows[0]?.total || 0),
    limit: safeLimit,
    offset: safeOffset
  };
}

export async function getAuthorizedKid({ actor, kidProfileId, pool = getDatabase() }) {
  const query = actor.role === 'admin'
    ? 'SELECT * FROM kids_profiles WHERE id = $1'
    : 'SELECT * FROM kids_profiles WHERE id = $1 AND parent_id = $2';
  const params = actor.role === 'admin'
    ? [kidProfileId]
    : [kidProfileId, actor.id];
  const result = await pool.query(query, params);
  return result.rows[0] || null;
}

export async function deleteKidData(client, kidProfileId) {
  const kidAccountIds = await rows(
    client,
    `SELECT id FROM users
     WHERE role = 'kid' AND kid_profile_id = $1`,
    [kidProfileId]
  );
  if (kidAccountIds.length > 0) {
    await client.query(
      `DELETE FROM users
       WHERE id = ANY($1::int[])`,
      [kidAccountIds.map((account) => account.id)]
    );
  }
  await client.query('DELETE FROM kids_profiles WHERE id = $1', [kidProfileId]);
  return { deleted_kid_account_ids: kidAccountIds.map((account) => account.id) };
}

export async function permanentlyDeleteKid({
  actor,
  kidProfileId,
  req = null,
  pool = getDatabase()
}) {
  const kid = await getAuthorizedKid({ actor, kidProfileId, pool });
  if (!kid) throw privacyError(404, 'Kid profile not found', 'KID_NOT_FOUND');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await deleteKidData(client, kid.id);
    await logSecurityEvent(client, {
      userId: actor.id,
      actorRole: actor.role,
      action: 'kid_profile_deleted_permanently',
      resourceType: 'kid_profile',
      resourceId: kid.id,
      req,
      metadata: result
    });
    await client.query('COMMIT');
    await invalidateParentDashboardCache(kid.id);
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function deleteStripeCustomerData(userId, stripeCustomerId, pool) {
  const stripeSubscriptions = await rows(
    pool,
    `SELECT provider_subscription_id
     FROM user_subscriptions
     WHERE user_id = $1
       AND provider = 'stripe'
       AND provider_subscription_id IS NOT NULL
       AND status IN ('trialing', 'active', 'past_due', 'unpaid')`,
    [userId]
  );
  if (stripeSubscriptions.length === 0 && !stripeCustomerId) return;
  if (!isStripeConfigured()) {
    throw privacyError(
      503,
      'Stripe must be configured before deleting this subscribed account',
      'STRIPE_REQUIRED'
    );
  }

  const stripe = getStripe();
  for (const subscription of stripeSubscriptions) {
    try {
      await stripe.subscriptions.cancel(subscription.provider_subscription_id);
    } catch (error) {
      if (error?.code !== 'resource_missing') throw error;
    }
  }
  if (stripeCustomerId) {
    try {
      await stripe.customers.del(stripeCustomerId);
    } catch (error) {
      if (error?.code !== 'resource_missing') throw error;
    }
  }
}

export async function permanentlyDeleteParentAccount({
  userId,
  password,
  req = null,
  pool = getDatabase()
}) {
  const user = await verifyParentPassword(userId, password, pool);
  const stripeResult = await pool.query(
    'SELECT stripe_customer_id FROM users WHERE id = $1 LIMIT 1',
    [userId]
  );
  await deleteStripeCustomerData(userId, stripeResult.rows[0]?.stripe_customer_id, pool);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const kids = await rows(client, 'SELECT id FROM kids_profiles WHERE parent_id = $1', [userId]);
    for (const kid of kids) {
      await deleteKidData(client, kid.id);
    }

    await purgeUserVoiceData({ client, userId });
    await client.query('DELETE FROM content_reports WHERE reporter_user_id = $1', [userId]);
    await client.query('DELETE FROM subscription_events WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM subscription_invoices WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM voice_audit_logs WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM voice_consent_records WHERE user_id = $1', [userId]);
    await client.query(
      `UPDATE security_audit_logs
       SET ip_address = NULL,
           user_agent = NULL,
           metadata = '{"erased":true}'::jsonb
       WHERE user_id = $1`,
      [userId]
    );
    await logSecurityEvent(client, {
      userId,
      actorRole: user.role,
      action: 'parent_account_deleted_permanently',
      resourceType: 'user',
      resourceId: userId,
      metadata: { erasure_completed: true, child_profiles_deleted: kids.length }
    });
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    await client.query('COMMIT');
    await Promise.all(kids.map((kid) => invalidateParentDashboardCache(kid.id)));
    return { deleted: true, child_profiles_deleted: kids.length };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export { PRIVACY_ACTIONS };
