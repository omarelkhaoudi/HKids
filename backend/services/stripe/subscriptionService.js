import { getDatabase } from '../../database/init.js';
import { getCheckoutTrialDays, getFrontendUrl, getStripe, isStripeConfigured } from './stripeConfig.js';

function httpError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export function normalizePlan(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    monthly_price_cents: Number(row.monthly_price_cents),
    monthly_price: Number(row.monthly_price_cents) / 100,
    currency: row.currency,
    book_limit: Number(row.book_limit),
    is_featured: Boolean(row.is_featured),
    is_active: Boolean(row.is_active),
    trial_days: Number(row.trial_days || 0),
    stripe_price_id: row.stripe_price_id || null
  };
}

export function mapStripeStatus(stripeStatus) {
  switch (stripeStatus) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'unpaid':
      return 'unpaid';
    case 'canceled':
      return 'canceled';
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete';
    case 'paused':
      return 'paused';
    default:
      return 'inactive';
  }
}

export async function getBillingUserId(pool, user) {
  if (user.role !== 'kid') return user.id;
  if (!user.kid_profile_id) return null;
  const kidResult = await pool.query(
    'SELECT parent_id FROM kids_profiles WHERE id = $1 LIMIT 1',
    [user.kid_profile_id]
  );
  return kidResult.rows[0]?.parent_id || null;
}

export function rejectKidPayment(user) {
  if (user.role === 'kid') {
    return httpError(403, 'A parent account is required for payments', 'PARENT_REQUIRED');
  }
  return null;
}

async function getUserRecord(pool, userId) {
  const result = await pool.query(
    'SELECT id, username, stripe_customer_id FROM users WHERE id = $1 LIMIT 1',
    [userId]
  );
  if (!result.rows[0]) throw httpError(404, 'User not found', 'USER_NOT_FOUND');
  return result.rows[0];
}

export async function getOrCreateStripeCustomer(pool, userId) {
  const user = await getUserRecord(pool, userId);
  if (user.stripe_customer_id) {
    try {
      const stripe = getStripe();
      const customer = await stripe.customers.retrieve(user.stripe_customer_id);
      if (!customer.deleted) return customer.id;
    } catch {
      // Recreate if Stripe customer was deleted.
    }
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name: user.username,
    metadata: { user_id: String(userId) }
  });

  await pool.query(
    'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
    [customer.id, userId]
  );

  return customer.id;
}

async function getPlanByCode(db, planCode) {
  const result = await db.query(
    `SELECT * FROM subscription_plans WHERE code = $1 AND is_active = TRUE LIMIT 1`,
    [planCode]
  );
  if (!result.rows[0]) throw httpError(404, 'Subscription plan not found', 'PLAN_NOT_FOUND');
  return result.rows[0];
}

async function recordSubscriptionEvent(client, {
  userId,
  subscriptionId = null,
  stripeEventId = null,
  eventType,
  payload = {}
}) {
  await client.query(
    `INSERT INTO subscription_events (user_id, subscription_id, stripe_event_id, event_type, payload)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [userId, subscriptionId, stripeEventId, eventType, JSON.stringify(payload)]
  );
}

function stripePeriodDates(stripeSubscription) {
  const start = stripeSubscription.current_period_start
    ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
    : new Date().toISOString();
  const end = stripeSubscription.current_period_end
    ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const trialEnd = stripeSubscription.trial_end
    ? new Date(stripeSubscription.trial_end * 1000).toISOString()
    : null;
  return { start, end, trialEnd };
}

export async function upsertSubscriptionFromStripe(client, {
  userId,
  plan,
  stripeSubscription,
  stripeEventId = null,
  eventType = 'subscription.synced'
}) {
  const providerSubscriptionId = stripeSubscription.id;
  const status = mapStripeStatus(stripeSubscription.status);
  const { start, end, trialEnd } = stripePeriodDates(stripeSubscription);
  const cancelAtPeriodEnd = Boolean(stripeSubscription.cancel_at_period_end);

  const existing = await client.query(
    `SELECT id FROM user_subscriptions
     WHERE provider = 'stripe' AND provider_subscription_id = $1
     LIMIT 1`,
    [providerSubscriptionId]
  );

  let subscriptionRow;
  if (existing.rows[0]) {
    const updated = await client.query(
      `UPDATE user_subscriptions
       SET plan_id = $1,
           status = $2,
           current_period_start = $3::timestamptz,
           current_period_end = $4::timestamptz,
           cancel_at_period_end = $5,
           trial_end = $6::timestamptz,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [plan.id, status, start, end, cancelAtPeriodEnd, trialEnd, existing.rows[0].id]
    );
    subscriptionRow = updated.rows[0];
  } else {
    await client.query(
      `UPDATE user_subscriptions
       SET status = 'replaced', updated_at = NOW()
       WHERE user_id = $1 AND status IN ('trialing', 'active', 'past_due', 'unpaid')`,
      [userId]
    );
    const inserted = await client.query(
      `INSERT INTO user_subscriptions (
         user_id, plan_id, status, started_at,
         current_period_start, current_period_end,
         cancel_at_period_end, trial_end,
         provider, provider_subscription_id
       )
       VALUES ($1, $2, $3, NOW(), $4::timestamptz, $5::timestamptz, $6, $7::timestamptz, 'stripe', $8)
       RETURNING *`,
      [userId, plan.id, status, start, end, cancelAtPeriodEnd, trialEnd, providerSubscriptionId]
    );
    subscriptionRow = inserted.rows[0];
  }

  await recordSubscriptionEvent(client, {
    userId,
    subscriptionId: subscriptionRow.id,
    stripeEventId,
    eventType,
    payload: {
      stripe_subscription_id: providerSubscriptionId,
      status,
      cancel_at_period_end: cancelAtPeriodEnd
    }
  });

  return subscriptionRow;
}

export async function recordInvoiceFromStripe(client, stripeInvoice, { userId = null, subscriptionId = null } = {}) {
  if (!stripeInvoice?.id) return null;

  const resolvedUserId = userId || Number(stripeInvoice.metadata?.user_id || stripeInvoice.subscription_details?.metadata?.user_id || 0) || null;
  const amountPaid = Number(stripeInvoice.amount_paid || 0);
  const currency = String(stripeInvoice.currency || 'eur').toUpperCase();
  const paidAt = stripeInvoice.status_transitions?.paid_at
    ? new Date(stripeInvoice.status_transitions.paid_at * 1000).toISOString()
    : null;

  const result = await client.query(
    `INSERT INTO subscription_invoices (
       user_id, subscription_id, stripe_invoice_id, stripe_subscription_id,
       amount_paid, currency, status, hosted_invoice_url, invoice_pdf,
       period_start, period_end, paid_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamptz, $11::timestamptz, $12::timestamptz)
     ON CONFLICT (stripe_invoice_id)
     DO UPDATE SET
       status = EXCLUDED.status,
       amount_paid = EXCLUDED.amount_paid,
       hosted_invoice_url = EXCLUDED.hosted_invoice_url,
       invoice_pdf = EXCLUDED.invoice_pdf,
       paid_at = EXCLUDED.paid_at
     RETURNING *`,
    [
      resolvedUserId,
      subscriptionId,
      stripeInvoice.id,
      typeof stripeInvoice.subscription === 'string' ? stripeInvoice.subscription : stripeInvoice.subscription?.id || null,
      amountPaid,
      currency,
      stripeInvoice.status || 'open',
      stripeInvoice.hosted_invoice_url || null,
      stripeInvoice.invoice_pdf || null,
      stripeInvoice.period_start ? new Date(stripeInvoice.period_start * 1000).toISOString() : null,
      stripeInvoice.period_end ? new Date(stripeInvoice.period_end * 1000).toISOString() : null,
      paidAt
    ]
  );

  if (resolvedUserId) {
    await recordSubscriptionEvent(client, {
      userId: resolvedUserId,
      subscriptionId,
      eventType: `invoice.${stripeInvoice.status || 'updated'}`,
      payload: {
        stripe_invoice_id: stripeInvoice.id,
        amount_paid: amountPaid,
        currency
      }
    });
  }

  return result.rows[0];
}

export async function getPlans() {
  const pool = getDatabase();
  const result = await pool.query(
    `SELECT *
     FROM subscription_plans
     WHERE is_active = TRUE
       AND code <> 'trial_3_books_7_days'
     ORDER BY book_limit ASC`
  );
  return result.rows.map(normalizePlan);
}

export async function getCurrentSubscription(user) {
  const pool = getDatabase();
  const billingUserId = await getBillingUserId(pool, user);
  if (!billingUserId) return { subscription: null, billing_owner: null };

  const result = await pool.query(
    `SELECT us.*, sp.code, sp.name, sp.description, sp.monthly_price_cents, sp.currency,
            sp.book_limit, sp.is_featured, sp.is_active AS plan_active, sp.trial_days, sp.stripe_price_id
     FROM user_subscriptions us
     JOIN subscription_plans sp ON sp.id = us.plan_id
     WHERE us.user_id = $1
     ORDER BY us.created_at DESC
     LIMIT 1`,
    [billingUserId]
  );

  const subscription = result.rows[0];
  if (!subscription) return { subscription: null, billing_owner: billingUserId === user.id ? 'self' : 'parent' };

  const unlocksResult = await pool.query(
    `SELECT book_id, unlocked_at
     FROM subscription_book_unlocks
     WHERE subscription_id = $1
     ORDER BY unlocked_at ASC`,
    [subscription.id]
  );

  return {
    billing_owner: billingUserId === user.id ? 'self' : 'parent',
    subscription: {
      id: subscription.id,
      status: subscription.status,
      started_at: subscription.started_at,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      trial_end: subscription.trial_end,
      provider: subscription.provider,
      used_books: unlocksResult.rowCount,
      unlocked_books: unlocksResult.rows,
      plan: normalizePlan({
        id: subscription.plan_id,
        code: subscription.code,
        name: subscription.name,
        description: subscription.description,
        monthly_price_cents: subscription.monthly_price_cents,
        currency: subscription.currency,
        book_limit: subscription.book_limit,
        is_featured: subscription.is_featured,
        is_active: subscription.plan_active,
        trial_days: subscription.trial_days,
        stripe_price_id: subscription.stripe_price_id
      })
    }
  };
}

export async function unlockBook(user, bookId) {
  const pool = getDatabase();
  const client = await pool.connect();
  try {
    const billingUserId = await getBillingUserId(client, user);
    if (!billingUserId) throw httpError(403, 'Parent account required', 'PARENT_REQUIRED');

    await client.query('BEGIN');

    const subscriptionResult = await client.query(
      `SELECT us.*, sp.book_limit, sp.code, sp.name, sp.description, sp.monthly_price_cents,
              sp.currency, sp.is_featured, sp.is_active
       FROM user_subscriptions us
       JOIN subscription_plans sp ON sp.id = us.plan_id
       WHERE us.user_id = $1
         AND us.current_period_start <= NOW()
         AND us.current_period_end > NOW()
         AND us.status IN ('trialing', 'active', 'past_due')
       ORDER BY CASE WHEN us.status = 'active' THEN 0 WHEN us.status = 'trialing' THEN 1 ELSE 2 END,
                us.created_at DESC
       LIMIT 1`,
      [billingUserId]
    );

    const subscription = subscriptionResult.rows[0];
    if (!subscription) throw httpError(402, 'No active subscription', 'NO_SUBSCRIPTION');

    const bookResult = await client.query(
      'SELECT id FROM books WHERE id = $1 AND is_published = TRUE LIMIT 1',
      [bookId]
    );
    if (!bookResult.rows[0]) throw httpError(404, 'Book not found', 'BOOK_NOT_FOUND');

    const existingUnlock = await client.query(
      `SELECT * FROM subscription_book_unlocks
       WHERE subscription_id = $1 AND book_id = $2 AND period_start = $3 LIMIT 1`,
      [subscription.id, bookId, subscription.current_period_start]
    );

    const usedResult = await client.query(
      `SELECT COUNT(*)::int AS used FROM subscription_book_unlocks
       WHERE subscription_id = $1 AND period_start = $2`,
      [subscription.id, subscription.current_period_start]
    );
    const used = Number(usedResult.rows[0]?.used || 0);
    const limit = Number(subscription.book_limit);

    if (existingUnlock.rows[0]) {
      await client.query('COMMIT');
      return {
        message: 'Book already unlocked',
        remaining_books: Math.max(0, limit - used),
        unlocked: existingUnlock.rows[0]
      };
    }

    if (user.role === 'kid') {
      const err = httpError(403, 'Ce contenu premium doit être débloqué par le parent.', 'PREMIUM_PARENT_REQUIRED');
      err.parental_restriction = true;
      err.parent_required = true;
      throw err;
    }

    if (used >= limit) {
      throw httpError(403, 'Monthly book limit reached', 'BOOK_LIMIT_REACHED');
    }

    const unlockResult = await client.query(
      `INSERT INTO subscription_book_unlocks (subscription_id, user_id, book_id, period_start, period_end)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [subscription.id, user.id, bookId, subscription.current_period_start, subscription.current_period_end]
    );

    await client.query('COMMIT');
    return {
      message: 'Book unlocked',
      remaining_books: Math.max(0, limit - used - 1),
      unlocked: unlockResult.rows[0],
      plan: normalizePlan(subscription)
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function activateManualSubscription(user, planCode) {
  if (process.env.NODE_ENV === 'production') {
    throw httpError(403, 'Manual subscriptions are disabled in production', 'MANUAL_DISABLED');
  }

  const pool = getDatabase();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const plan = await getPlanByCode(client, planCode);
    await client.query(
      `UPDATE user_subscriptions SET status = 'replaced', updated_at = NOW()
       WHERE user_id = $1 AND status IN ('trialing', 'active', 'past_due', 'unpaid')`,
      [user.id]
    );
    const subscriptionResult = await client.query(
      `INSERT INTO user_subscriptions (
         user_id, plan_id, status, started_at, current_period_start, current_period_end, provider
       )
       VALUES ($1, $2, 'active', NOW(), NOW(), NOW() + INTERVAL '1 month', 'manual')
       RETURNING *`,
      [user.id, plan.id]
    );
    await recordSubscriptionEvent(client, {
      userId: user.id,
      subscriptionId: subscriptionResult.rows[0].id,
      eventType: 'subscription.manual_activated',
      payload: { plan_code: plan.code }
    });
    await client.query('COMMIT');
    return { subscription: subscriptionResult.rows[0], plan };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function startTrial(user) {
  const pool = getDatabase();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existingTrial = await client.query(
      `SELECT id FROM user_subscriptions WHERE user_id = $1 AND provider = 'trial' LIMIT 1`,
      [user.id]
    );
    if (existingTrial.rows[0]) throw httpError(409, 'Trial already used', 'TRIAL_ALREADY_USED');

    const activeSubscription = await client.query(
      `SELECT id FROM user_subscriptions
       WHERE user_id = $1 AND status IN ('trialing', 'active', 'past_due', 'unpaid')
         AND current_period_end > NOW() LIMIT 1`,
      [user.id]
    );
    if (activeSubscription.rows[0]) {
      throw httpError(409, 'User already has an active subscription', 'SUBSCRIPTION_ALREADY_ACTIVE');
    }

    const planResult = await client.query(
      `INSERT INTO subscription_plans (code, name, description, monthly_price_cents, currency, book_limit, is_featured, is_active, trial_days)
       VALUES ('trial_3_books_7_days', 'Essai gratuit', 'Trois livres offerts pendant 7 jours pour découvrir HKids.', 0, 'EUR', 3, FALSE, TRUE, 7)
       ON CONFLICT (code) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         monthly_price_cents = EXCLUDED.monthly_price_cents,
         currency = EXCLUDED.currency,
         book_limit = EXCLUDED.book_limit,
         trial_days = EXCLUDED.trial_days,
         is_active = TRUE,
         updated_at = NOW()
       RETURNING *`
    );

    const plan = planResult.rows[0];
    const subscriptionResult = await client.query(
      `INSERT INTO user_subscriptions (
         user_id, plan_id, status, started_at, current_period_start, current_period_end,
         trial_end, provider
       )
       VALUES ($1, $2, 'trialing', NOW(), NOW(), NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days', 'trial')
       RETURNING *`,
      [user.id, plan.id]
    );

    await recordSubscriptionEvent(client, {
      userId: user.id,
      subscriptionId: subscriptionResult.rows[0].id,
      eventType: 'subscription.trial_started',
      payload: { plan_code: plan.code, trial_days: 7 }
    });

    await client.query('COMMIT');
    return { subscription: subscriptionResult.rows[0], plan };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function buildCheckoutLineItem(plan) {
  if (plan.stripe_price_id) {
    return { price: plan.stripe_price_id, quantity: 1 };
  }
  return {
    quantity: 1,
    price_data: {
      currency: String(plan.currency || 'EUR').toLowerCase(),
      unit_amount: plan.monthly_price_cents,
      recurring: { interval: 'month' },
      product_data: {
        name: plan.name,
        description: plan.description || `${plan.book_limit} livre(s) par mois`,
        metadata: { plan_code: plan.code }
      }
    }
  };
}

export async function createCheckoutSession(user, planCode) {
  if (!isStripeConfigured()) {
    throw httpError(503, 'Stripe is not configured', 'STRIPE_NOT_CONFIGURED');
  }

  const pool = getDatabase();
  const plan = await getPlanByCode(pool, planCode);
  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(pool, user.id);
  const frontendUrl = getFrontendUrl();
  const trialDays = getCheckoutTrialDays(plan);

  const sessionParams = {
    mode: 'subscription',
    customer: customerId,
    client_reference_id: String(user.id),
    success_url: `${frontendUrl}/abonnements?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/abonnements?checkout=cancelled`,
    line_items: [buildCheckoutLineItem(plan)],
    metadata: { user_id: String(user.id), plan_code: plan.code },
    subscription_data: {
      metadata: { user_id: String(user.id), plan_code: plan.code }
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto'
  };

  if (trialDays > 0) {
    sessionParams.subscription_data.trial_period_days = trialDays;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return { checkout_url: session.url, session_id: session.id, trial_days: trialDays };
}

export async function confirmCheckoutSession(user, sessionId) {
  if (!isStripeConfigured()) {
    throw httpError(503, 'Stripe is not configured', 'STRIPE_NOT_CONFIGURED');
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'subscription.latest_invoice']
  });

  if (session.client_reference_id !== String(user.id) && session.metadata?.user_id !== String(user.id)) {
    throw httpError(403, 'Checkout session does not belong to this user', 'CHECKOUT_FORBIDDEN');
  }

  if (session.status !== 'complete') {
    throw httpError(402, 'Checkout session is not complete yet', 'CHECKOUT_INCOMPLETE');
  }

  const planCode = session.metadata?.plan_code;
  if (!planCode) throw httpError(400, 'Missing plan metadata on checkout session', 'PLAN_METADATA_MISSING');

  const pool = getDatabase();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const plan = await getPlanByCode(client, planCode);

    const stripeSubscription = typeof session.subscription === 'string'
      ? await stripe.subscriptions.retrieve(session.subscription)
      : session.subscription;

    if (!stripeSubscription) {
      throw httpError(400, 'Stripe subscription missing on checkout session', 'SUBSCRIPTION_MISSING');
    }

    const existing = await client.query(
      `SELECT * FROM user_subscriptions
       WHERE user_id = $1 AND provider = 'stripe' AND provider_subscription_id = $2 LIMIT 1`,
      [user.id, stripeSubscription.id]
    );

    if (existing.rows[0]) {
      await client.query('COMMIT');
      return { subscription: existing.rows[0], plan, already_confirmed: true };
    }

    const subscription = await upsertSubscriptionFromStripe(client, {
      userId: user.id,
      plan,
      stripeSubscription,
      eventType: 'subscription.checkout_confirmed'
    });

    if (session.subscription?.latest_invoice || stripeSubscription.latest_invoice) {
      const invoiceId = typeof stripeSubscription.latest_invoice === 'string'
        ? stripeSubscription.latest_invoice
        : stripeSubscription.latest_invoice?.id;
      if (invoiceId) {
        const invoice = await stripe.invoices.retrieve(invoiceId);
        await recordInvoiceFromStripe(client, invoice, {
          userId: user.id,
          subscriptionId: subscription.id
        });
      }
    }

    await client.query('COMMIT');
    return { subscription, plan, already_confirmed: false };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getStripeManagedSubscription(pool, userId) {
  const result = await pool.query(
    `SELECT us.*, sp.code AS plan_code
     FROM user_subscriptions us
     JOIN subscription_plans sp ON sp.id = us.plan_id
     WHERE us.user_id = $1
       AND us.provider = 'stripe'
       AND us.provider_subscription_id IS NOT NULL
       AND us.status IN ('trialing', 'active', 'past_due', 'unpaid')
     ORDER BY us.created_at DESC
     LIMIT 1`,
    [userId]
  );
  if (!result.rows[0]) throw httpError(404, 'No Stripe subscription found', 'NO_STRIPE_SUBSCRIPTION');
  return result.rows[0];
}

export async function cancelSubscription(user, { atPeriodEnd = true } = {}) {
  if (!isStripeConfigured()) throw httpError(503, 'Stripe is not configured', 'STRIPE_NOT_CONFIGURED');

  const pool = getDatabase();
  const localSub = await getStripeManagedSubscription(pool, user.id);
  const stripe = getStripe();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    let stripeSubscription;
    if (atPeriodEnd) {
      stripeSubscription = await stripe.subscriptions.update(localSub.provider_subscription_id, {
        cancel_at_period_end: true
      });
    } else {
      stripeSubscription = await stripe.subscriptions.cancel(localSub.provider_subscription_id);
    }

    const plan = await getPlanByCode(client, localSub.plan_code);
    const subscription = await upsertSubscriptionFromStripe(client, {
      userId: user.id,
      plan,
      stripeSubscription,
      eventType: atPeriodEnd ? 'subscription.cancel_scheduled' : 'subscription.canceled'
    });

    await client.query('COMMIT');
    return {
      subscription,
      plan: normalizePlan(plan),
      message: atPeriodEnd
        ? 'Subscription will cancel at the end of the billing period'
        : 'Subscription canceled immediately'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function resumeSubscription(user) {
  if (!isStripeConfigured()) throw httpError(503, 'Stripe is not configured', 'STRIPE_NOT_CONFIGURED');

  const pool = getDatabase();
  const localSub = await getStripeManagedSubscription(pool, user.id);
  if (!localSub.cancel_at_period_end) {
    throw httpError(409, 'Subscription is not scheduled for cancellation', 'NOT_SCHEDULED');
  }

  const stripe = getStripe();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const stripeSubscription = await stripe.subscriptions.update(localSub.provider_subscription_id, {
      cancel_at_period_end: false
    });
    const plan = await getPlanByCode(client, localSub.plan_code);
    const subscription = await upsertSubscriptionFromStripe(client, {
      userId: user.id,
      plan,
      stripeSubscription,
      eventType: 'subscription.resumed'
    });
    await client.query('COMMIT');
    return { subscription, plan: normalizePlan(plan), message: 'Subscription resumed' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function createBillingPortalSession(user) {
  if (!isStripeConfigured()) throw httpError(503, 'Stripe is not configured', 'STRIPE_NOT_CONFIGURED');

  const pool = getDatabase();
  const customerId = await getOrCreateStripeCustomer(pool, user.id);
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getFrontendUrl()}/abonnements`
  });
  return { portal_url: session.url };
}

export async function getInvoices(user, { limit = 20, offset = 0 } = {}) {
  const pool = getDatabase();
  const billingUserId = await getBillingUserId(pool, user);
  if (!billingUserId) return { items: [], total: 0, limit, offset };

  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 20));
  const safeOffset = Math.max(0, Number(offset) || 0);

  const [itemsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT id, stripe_invoice_id, stripe_subscription_id, amount_paid, currency, status,
              hosted_invoice_url, invoice_pdf, period_start, period_end, paid_at, created_at
       FROM subscription_invoices
       WHERE user_id = $1
       ORDER BY COALESCE(paid_at, created_at) DESC
       LIMIT $2 OFFSET $3`,
      [billingUserId, safeLimit, safeOffset]
    ),
    pool.query('SELECT COUNT(*)::int AS total FROM subscription_invoices WHERE user_id = $1', [billingUserId])
  ]);

  return {
    items: itemsResult.rows,
    total: Number(countResult.rows[0]?.total || 0),
    limit: safeLimit,
    offset: safeOffset
  };
}

export async function getSubscriptionHistory(user, { limit = 50, offset = 0 } = {}) {
  const pool = getDatabase();
  const billingUserId = await getBillingUserId(pool, user);
  if (!billingUserId) return { items: [], total: 0, limit, offset };

  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50));
  const safeOffset = Math.max(0, Number(offset) || 0);

  const [itemsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT id, subscription_id, stripe_event_id, event_type, payload, created_at
       FROM subscription_events
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [billingUserId, safeLimit, safeOffset]
    ),
    pool.query('SELECT COUNT(*)::int AS total FROM subscription_events WHERE user_id = $1', [billingUserId])
  ]);

  return {
    items: itemsResult.rows,
    total: Number(countResult.rows[0]?.total || 0),
    limit: safeLimit,
    offset: safeOffset
  };
}

export async function resolvePlanFromStripeSubscription(client, stripeSubscription) {
  const planCode = stripeSubscription.metadata?.plan_code;
  if (planCode) {
    try {
      return await getPlanByCode(client, planCode);
    } catch {
      // Fall through to price mapping.
    }
  }

  const priceId = stripeSubscription.items?.data?.[0]?.price?.id;
  if (priceId) {
    const byPrice = await client.query(
      'SELECT * FROM subscription_plans WHERE stripe_price_id = $1 AND is_active = TRUE LIMIT 1',
      [priceId]
    );
    if (byPrice.rows[0]) return byPrice.rows[0];
  }

  throw httpError(400, 'Unable to resolve subscription plan from Stripe metadata', 'PLAN_RESOLUTION_FAILED');
}

export async function syncStripeSubscriptionById(stripeSubscriptionId, {
  stripeEventId = null,
  eventType = 'subscription.webhook_sync'
} = {}) {
  const stripe = getStripe();
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const userId = Number(stripeSubscription.metadata?.user_id);
  if (!userId) throw httpError(400, 'Stripe subscription missing user_id metadata', 'USER_METADATA_MISSING');

  const pool = getDatabase();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const plan = await resolvePlanFromStripeSubscription(client, stripeSubscription);
    const subscription = await upsertSubscriptionFromStripe(client, {
      userId,
      plan,
      stripeSubscription,
      stripeEventId,
      eventType
    });
    await client.query('COMMIT');
    return subscription;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function markSubscriptionCanceled(stripeSubscription, { stripeEventId = null } = {}) {
  const userId = Number(stripeSubscription.metadata?.user_id);
  if (!userId) return null;

  const pool = getDatabase();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await client.query(
      `UPDATE user_subscriptions
       SET status = 'canceled',
           cancel_at_period_end = FALSE,
           updated_at = NOW()
       WHERE provider = 'stripe' AND provider_subscription_id = $1
       RETURNING *`,
      [stripeSubscription.id]
    );
    if (updated.rows[0]) {
      await recordSubscriptionEvent(client, {
        userId,
        subscriptionId: updated.rows[0].id,
        stripeEventId,
        eventType: 'subscription.deleted',
        payload: { stripe_subscription_id: stripeSubscription.id }
      });
    }
    await client.query('COMMIT');
    return updated.rows[0] || null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
