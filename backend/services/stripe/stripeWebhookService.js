import { getDatabase } from '../../database/init.js';
import { getStripe, getWebhookSecret, requireWebhookSecretInProduction } from './stripeConfig.js';
import {
  markSubscriptionCanceled,
  recordInvoiceFromStripe,
  resolvePlanFromStripeSubscription,
  syncStripeSubscriptionById,
  upsertSubscriptionFromStripe
} from './subscriptionService.js';

function httpError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

async function isEventProcessed(stripeEventId) {
  const pool = getDatabase();
  const result = await pool.query(
    'SELECT stripe_event_id FROM stripe_webhook_events WHERE stripe_event_id = $1 LIMIT 1',
    [stripeEventId]
  );
  return Boolean(result.rows[0]);
}

async function markEventProcessed(stripeEventId, eventType) {
  const pool = getDatabase();
  await pool.query(
    `INSERT INTO stripe_webhook_events (stripe_event_id, event_type)
     VALUES ($1, $2)
     ON CONFLICT (stripe_event_id) DO NOTHING`,
    [stripeEventId, eventType]
  );
}

async function handleCheckoutSessionCompleted(event) {
  const session = event.data.object;
  const userId = Number(session.metadata?.user_id || session.client_reference_id);
  const planCode = session.metadata?.plan_code;
  if (!userId || !planCode || !session.subscription) return { handled: false, reason: 'missing_metadata' };

  const stripe = getStripe();
  const stripeSubscription = await stripe.subscriptions.retrieve(String(session.subscription));
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
      eventType: event.type
    });

    if (session.invoice) {
      const invoice = await stripe.invoices.retrieve(String(session.invoice));
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
      eventType: event.type
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
  await markSubscriptionCanceled(stripeSubscription, { stripeEventId: event.id });
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
      const stripeSubscription = await stripe.subscriptions.retrieve(String(invoice.subscription));
      const plan = await resolvePlanFromStripeSubscription(client, stripeSubscription);
      const userId = Number(stripeSubscription.metadata?.user_id);
      if (userId) {
        await upsertSubscriptionFromStripe(client, {
          userId,
          plan,
          stripeSubscription,
          stripeEventId: event.id,
          eventType: 'subscription.renewed'
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
      const stripeSubscription = await stripe.subscriptions.retrieve(String(invoice.subscription));
      const plan = await resolvePlanFromStripeSubscription(client, stripeSubscription);
      const userId = Number(stripeSubscription.metadata?.user_id);
      if (userId) {
        await upsertSubscriptionFromStripe(client, {
          userId,
          plan,
          stripeSubscription,
          stripeEventId: event.id,
          eventType: event.type
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
  } catch (error) {
    throw httpError(400, `Webhook signature verification failed: ${error.message}`, 'SIGNATURE_INVALID');
  }
}

export async function processStripeWebhookEvent(event) {
  if (await isEventProcessed(event.id)) {
    return { received: true, duplicate: true };
  }

  const handler = EVENT_HANDLERS[event.type];
  if (!handler) {
    await markEventProcessed(event.id, event.type);
    return { received: true, ignored: true, type: event.type };
  }

  const result = await handler(event);
  await markEventProcessed(event.id, event.type);
  return { received: true, duplicate: false, type: event.type, ...result };
}
