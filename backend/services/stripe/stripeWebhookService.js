import { getDatabase } from '../../database/init.js';
import { getStripe, getWebhookSecret, requireWebhookSecretInProduction } from './stripeConfig.js';
import {
  executeStripeRequest,
  markSubscriptionCanceled,
  recordInvoiceFromStripe,
  resolvePlanFromStripeSubscription,
  upsertSubscriptionFromStripe
} from './subscriptionService.js';

function httpError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

const MAX_WEBHOOK_ATTEMPTS = 5;
const WEBHOOK_ERROR_MAX_LENGTH = 1_000;
const WEBHOOK_PROCESSING_STALE_MS = 10 * 60 * 1000;

function truncate(value, maxLength = WEBHOOK_ERROR_MAX_LENGTH) {
  return String(value || '').slice(0, maxLength);
}

export function safeWebhookErrorMessage(error) {
  if (!error) return 'Stripe webhook processing failed';
  if (error.code === 'SIGNATURE_INVALID') return 'Invalid Stripe webhook signature';
  if (error.code === 'SIGNATURE_MISSING') return 'Missing Stripe signature header';
  if (error.code === 'WEBHOOK_SECRET_MISSING') return 'Stripe webhook secret is not configured';
  return 'Stripe webhook processing failed';
}

export function webhookEventCreatedAt(event = {}) {
  const created = Number(event.created || 0);
  if (!Number.isFinite(created) || created <= 0) return null;
  return new Date(created * 1000).toISOString();
}

export function isWebhookProcessingStale(record = {}, now = new Date()) {
  if (record.status !== 'processing') return false;
  const receivedAt = new Date(record.last_received_at || 0).getTime();
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  if (!Number.isFinite(receivedAt) || !Number.isFinite(nowMs)) return false;
  return nowMs - receivedAt > WEBHOOK_PROCESSING_STALE_MS;
}

async function getWebhookRecord(stripeEventId) {
  const pool = getDatabase();
  const result = await pool.query(
    'SELECT * FROM stripe_webhook_events WHERE stripe_event_id = $1 LIMIT 1',
    [stripeEventId]
  );
  return result.rows[0] || null;
}

async function claimWebhookEvent(event) {
  const pool = getDatabase();
  const inserted = await pool.query(
    `INSERT INTO stripe_webhook_events (
       stripe_event_id, event_type, status, attempts,
       last_received_at, event_created, processed_at
     )
     VALUES ($1, $2, 'processing', 1, NOW(), $3::timestamptz, NULL)
     ON CONFLICT (stripe_event_id) DO NOTHING
     RETURNING *`,
    [event.id, event.type, webhookEventCreatedAt(event)]
  );
  if (inserted.rows[0]) return { claimed: true, attempts: 1 };

  const existing = await getWebhookRecord(event.id);
  if (!existing) return { claimed: false, duplicate: true };
  if (existing.status === 'processed') return { claimed: false, duplicate: true, status: existing.status };
  if (existing.status === 'dead_letter') return { claimed: false, dead_letter: true, status: existing.status };
  if (existing.status === 'processing' && !isWebhookProcessingStale(existing)) {
    return { claimed: false, duplicate: true, status: existing.status };
  }

  const attempts = Number(existing.attempts || 0);
  if (attempts >= MAX_WEBHOOK_ATTEMPTS) {
    await pool.query(
      `UPDATE stripe_webhook_events
       SET status = 'dead_letter', last_received_at = NOW()
       WHERE stripe_event_id = $1`,
      [event.id]
    );
    return { claimed: false, dead_letter: true, status: 'dead_letter' };
  }

  const claimed = await pool.query(
    `UPDATE stripe_webhook_events
     SET status = 'processing',
         event_type = $2,
         attempts = attempts + 1,
         last_received_at = NOW(),
         event_created = COALESCE(event_created, $3::timestamptz),
         last_error = NULL
     WHERE stripe_event_id = $1
       AND (
         status = 'failed'
         OR (status = 'processing' AND last_received_at < NOW() - INTERVAL '10 minutes')
       )
     RETURNING *`,
    [event.id, event.type, webhookEventCreatedAt(event)]
  );
  return { claimed: Boolean(claimed.rows[0]), attempts: Number(claimed.rows[0]?.attempts || attempts + 1) };
}

async function markEventProcessed(stripeEventId, eventType) {
  const pool = getDatabase();
  await pool.query(
    `UPDATE stripe_webhook_events
     SET event_type = $2,
         status = 'processed',
         processed_at = NOW(),
         last_error = NULL
     WHERE stripe_event_id = $1`,
    [stripeEventId, eventType]
  );
}

async function markEventFailed(stripeEventId, error, attempts = 1) {
  const pool = getDatabase();
  const status = attempts >= MAX_WEBHOOK_ATTEMPTS ? 'dead_letter' : 'failed';
  await pool.query(
    `UPDATE stripe_webhook_events
     SET status = $2,
         last_error = $3,
         last_received_at = NOW()
     WHERE stripe_event_id = $1`,
    [stripeEventId, status, truncate(error?.message || error)]
  );
  return status;
}

async function handleCheckoutSessionCompleted(event) {
  const session = event.data.object;
  const userId = Number(session.metadata?.user_id || session.client_reference_id);
  const planCode = session.metadata?.plan_code;
  if (!userId || !planCode || !session.subscription) return { handled: false, reason: 'missing_metadata' };

  const stripe = getStripe();
  const stripeSubscription = await executeStripeRequest(
    () => stripe.subscriptions.retrieve(String(session.subscription)),
    { operationName: 'subscriptions.retrieve' }
  );
  const pool = getDatabase();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const planResult = await client.query(
      'SELECT * FROM subscription_plans WHERE code = $1 AND is_active = TRUE LIMIT 1',
      [planCode]
    );
    if (!planResult.rows[0]) {
      await client.query('ROLLBACK');
      return { handled: false, reason: 'plan_not_found' };
    }

    await upsertSubscriptionFromStripe(client, {
      userId,
      plan: planResult.rows[0],
      stripeSubscription,
      stripeEventId: event.id,
      eventType: event.type,
      stripeEventCreated: event.created
    });

    if (session.invoice) {
      const invoice = await executeStripeRequest(
        () => stripe.invoices.retrieve(String(session.invoice)),
        { operationName: 'invoices.retrieve' }
      );
      await recordInvoiceFromStripe(client, invoice, { userId });
    }

    await client.query('COMMIT');
    return { handled: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function handleSubscriptionUpdated(event) {
  const stripeSubscription = event.data.object;
  const pool = getDatabase();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const plan = await resolvePlanFromStripeSubscription(client, stripeSubscription);
    const userId = Number(stripeSubscription.metadata?.user_id);
    if (!userId) {
      await client.query('ROLLBACK');
      return { handled: false, reason: 'missing_user_metadata' };
    }

    await upsertSubscriptionFromStripe(client, {
      userId,
      plan,
      stripeSubscription,
      stripeEventId: event.id,
      eventType: event.type,
      stripeEventCreated: event.created
    });
    await client.query('COMMIT');
    return { handled: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function handleSubscriptionDeleted(event) {
  const stripeSubscription = event.data.object;
  await markSubscriptionCanceled(stripeSubscription, {
    stripeEventId: event.id,
    stripeEventCreated: event.created
  });
  return { handled: true };
}

async function handleInvoicePaid(event) {
  const invoice = event.data.object;
  const pool = getDatabase();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await recordInvoiceFromStripe(client, invoice);

    if (invoice.subscription) {
      const stripe = getStripe();
      const stripeSubscription = await executeStripeRequest(
        () => stripe.subscriptions.retrieve(String(invoice.subscription)),
        { operationName: 'subscriptions.retrieve' }
      );
      const plan = await resolvePlanFromStripeSubscription(client, stripeSubscription);
      const userId = Number(stripeSubscription.metadata?.user_id);
      if (userId) {
        await upsertSubscriptionFromStripe(client, {
          userId,
          plan,
          stripeSubscription,
          stripeEventId: event.id,
          eventType: 'subscription.renewed',
          stripeEventCreated: event.created
        });
      }
    }

    await client.query('COMMIT');
    return { handled: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function handleInvoicePaymentFailed(event) {
  const invoice = event.data.object;
  const pool = getDatabase();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await recordInvoiceFromStripe(client, invoice);

    if (invoice.subscription) {
      const stripe = getStripe();
      const stripeSubscription = await executeStripeRequest(
        () => stripe.subscriptions.retrieve(String(invoice.subscription)),
        { operationName: 'subscriptions.retrieve' }
      );
      const plan = await resolvePlanFromStripeSubscription(client, stripeSubscription);
      const userId = Number(stripeSubscription.metadata?.user_id);
      if (userId) {
        await upsertSubscriptionFromStripe(client, {
          userId,
          plan,
          stripeSubscription,
          stripeEventId: event.id,
          eventType: event.type,
          stripeEventCreated: event.created
        });
      }
    }

    await client.query('COMMIT');
    return { handled: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

const EVENT_HANDLERS = {
  'checkout.session.completed': handleCheckoutSessionCompleted,
  'customer.subscription.created': handleSubscriptionUpdated,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'invoice.paid': handleInvoicePaid,
  'invoice.payment_failed': handleInvoicePaymentFailed,
  'invoice.finalized': async (event) => {
    const pool = getDatabase();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await recordInvoiceFromStripe(client, event.data.object);
      await client.query('COMMIT');
      return { handled: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

export function verifyStripeWebhook(rawBody, signature) {
  requireWebhookSecretInProduction();
  const webhookSecret = getWebhookSecret();
  if (!webhookSecret) {
    throw httpError(503, 'Stripe webhook secret is not configured', 'WEBHOOK_SECRET_MISSING');
  }
  if (!signature) {
    throw httpError(400, 'Missing Stripe signature header', 'SIGNATURE_MISSING');
  }

  const stripe = getStripe();
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    throw httpError(400, 'Invalid Stripe webhook signature', 'SIGNATURE_INVALID');
  }
}

export async function processStripeWebhookEvent(event) {
  const claim = await claimWebhookEvent(event);
  if (!claim.claimed) {
    return {
      received: true,
      duplicate: Boolean(claim.duplicate),
      dead_letter: Boolean(claim.dead_letter),
      status: claim.status || null,
      type: event.type
    };
  }

  const handler = EVENT_HANDLERS[event.type];
  if (!handler) {
    await markEventProcessed(event.id, event.type);
    return { received: true, ignored: true, type: event.type };
  }

  try {
    const result = await handler(event);
    await markEventProcessed(event.id, event.type);
    return { received: true, duplicate: false, type: event.type, attempts: claim.attempts, ...result };
  } catch (error) {
    const status = await markEventFailed(event.id, error, claim.attempts);
    error.webhook_status = status;
    throw error;
  }
}
