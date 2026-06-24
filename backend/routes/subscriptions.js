import express from 'express';
import { getDatabase } from '../database/init.js';
import { verifyToken } from './auth.js';

const router = express.Router();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const frontendUrl = (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'https://hkids.vercel.app').replace(/\/+$/, '');

function getPool() {
  try {
    return getDatabase();
  } catch (error) {
    console.error('Database not initialized:', error);
    throw new Error('Database connection not available');
  }
}

function normalizePlan(row) {
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
  };
}

function appendStripeParams(params, value, prefix) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => appendStripeParams(params, item, `${prefix}[${index}]`));
    return;
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, nestedValue]) => {
      appendStripeParams(params, nestedValue, prefix ? `${prefix}[${key}]` : key);
    });
    return;
  }

  if (value !== undefined && value !== null) {
    params.append(prefix, String(value));
  }
}

async function stripeRequest(path, options = {}) {
  if (!stripeSecretKey) {
    const error = new Error('Stripe is not configured');
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error?.message || 'Stripe request failed');
    error.statusCode = response.status;
    error.stripe = data.error;
    throw error;
  }

  return data;
}

async function activateSubscription(client, userId, plan, provider = null, providerSubscriptionId = null) {
  await client.query(
    `UPDATE user_subscriptions
     SET status = 'replaced', updated_at = NOW()
     WHERE user_id = $1 AND status IN ('trialing', 'active')`,
    [userId]
  );

  const subscriptionResult = await client.query(
    `INSERT INTO user_subscriptions (
      user_id,
      plan_id,
      status,
      started_at,
      current_period_start,
      current_period_end,
      provider,
      provider_subscription_id
    )
    VALUES ($1, $2, 'active', NOW(), NOW(), NOW() + INTERVAL '1 month', $3, $4)
    RETURNING *`,
    [userId, plan.id, provider, providerSubscriptionId]
  );

  return subscriptionResult.rows[0];
}

router.get('/plans', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT *
       FROM subscription_plans
       WHERE is_active = TRUE
         AND code <> 'trial_3_books_7_days'
       ORDER BY book_limit ASC`
    );

    res.json(result.rows.map(normalizePlan));
  } catch (err) {
    console.error('Error fetching subscription plans:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT us.*, sp.code, sp.name, sp.description, sp.monthly_price_cents, sp.currency, sp.book_limit, sp.is_featured, sp.is_active AS plan_active
       FROM user_subscriptions us
       JOIN subscription_plans sp ON sp.id = us.plan_id
       WHERE us.user_id = $1
       ORDER BY us.created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    const subscription = result.rows[0];
    if (!subscription) {
      return res.json({ subscription: null });
    }

    const unlocksResult = await pool.query(
      `SELECT book_id, unlocked_at
       FROM subscription_book_unlocks
       WHERE subscription_id = $1
       ORDER BY unlocked_at ASC`,
      [subscription.id]
    );

    res.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        started_at: subscription.started_at,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
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
        }),
      },
    });
  } catch (err) {
    console.error('Error fetching user subscription:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/unlock-book', verifyToken, async (req, res) => {
  const { book_id } = req.body;

  if (!book_id) {
    return res.status(400).json({ error: 'book_id is required' });
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const subscriptionResult = await client.query(
      `SELECT us.*, sp.book_limit, sp.code, sp.name, sp.description, sp.monthly_price_cents, sp.currency, sp.is_featured, sp.is_active
       FROM user_subscriptions us
       JOIN subscription_plans sp ON sp.id = us.plan_id
       WHERE us.user_id = $1
         AND us.current_period_start <= NOW()
         AND us.current_period_end > NOW()
         AND us.status IN ('trialing', 'active')
       ORDER BY CASE WHEN us.status = 'active' THEN 0 ELSE 1 END, us.created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    const subscription = subscriptionResult.rows[0];
    if (!subscription) {
      await client.query('ROLLBACK');
      return res.status(402).json({ error: 'No active subscription' });
    }

    const bookResult = await client.query(
      `SELECT id FROM books WHERE id = $1 AND is_published = TRUE LIMIT 1`,
      [book_id]
    );

    if (!bookResult.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Book not found' });
    }

    const existingUnlock = await client.query(
      `SELECT *
       FROM subscription_book_unlocks
       WHERE subscription_id = $1
         AND book_id = $2
         AND period_start = $3
       LIMIT 1`,
      [subscription.id, book_id, subscription.current_period_start]
    );

    const usedResult = await client.query(
      `SELECT COUNT(*)::int AS used
       FROM subscription_book_unlocks
       WHERE subscription_id = $1
         AND period_start = $2`,
      [subscription.id, subscription.current_period_start]
    );

    const used = Number(usedResult.rows[0]?.used || 0);
    const limit = Number(subscription.book_limit);

    if (existingUnlock.rows[0]) {
      await client.query('COMMIT');
      return res.json({
        message: 'Book already unlocked',
        remaining_books: Math.max(0, limit - used),
        unlocked: existingUnlock.rows[0],
      });
    }

    if (used >= limit) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: 'Monthly book limit reached',
        book_limit: limit,
        used_books: used,
      });
    }

    const unlockResult = await client.query(
      `INSERT INTO subscription_book_unlocks (subscription_id, user_id, book_id, period_start, period_end)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        subscription.id,
        req.user.id,
        book_id,
        subscription.current_period_start,
        subscription.current_period_end,
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Book unlocked',
      remaining_books: Math.max(0, limit - used - 1),
      unlocked: unlockResult.rows[0],
      plan: normalizePlan({
        id: subscription.plan_id,
        code: subscription.code,
        name: subscription.name,
        description: subscription.description,
        monthly_price_cents: subscription.monthly_price_cents,
        currency: subscription.currency,
        book_limit: subscription.book_limit,
        is_featured: subscription.is_featured,
        is_active: subscription.is_active,
      }),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error unlocking subscription book:', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

router.post('/subscribe', verifyToken, async (req, res) => {
  const { plan_code } = req.body;

  if (!plan_code) {
    return res.status(400).json({ error: 'plan_code is required' });
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const planResult = await client.query(
      `SELECT *
       FROM subscription_plans
       WHERE code = $1 AND is_active = TRUE
       LIMIT 1`,
      [plan_code]
    );

    const plan = planResult.rows[0];
    if (!plan) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    const subscription = await activateSubscription(client, req.user.id, plan, 'manual', null);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Subscription activated',
      subscription: {
        ...subscription,
        plan: normalizePlan(plan),
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating subscription:', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

router.post('/start-trial', verifyToken, async (req, res) => {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const existingTrial = await client.query(
      `SELECT id
       FROM user_subscriptions
       WHERE user_id = $1
         AND provider = 'trial'
       LIMIT 1`,
      [req.user.id]
    );

    if (existingTrial.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Trial already used' });
    }

    const activeSubscription = await client.query(
      `SELECT id
       FROM user_subscriptions
       WHERE user_id = $1
         AND status IN ('trialing', 'active')
         AND current_period_end > NOW()
       LIMIT 1`,
      [req.user.id]
    );

    if (activeSubscription.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'User already has an active subscription' });
    }

    const planResult = await client.query(
      `SELECT *
       FROM subscription_plans
       WHERE code = 'trial_3_books_7_days' AND is_active = TRUE
       LIMIT 1`
    );

    const plan = planResult.rows[0];
    if (!plan) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Trial plan not found' });
    }

    const subscriptionResult = await client.query(
      `INSERT INTO user_subscriptions (
        user_id,
        plan_id,
        status,
        started_at,
        current_period_start,
        current_period_end,
        provider
      )
      VALUES ($1, $2, 'trialing', NOW(), NOW(), NOW() + INTERVAL '7 days', 'trial')
      RETURNING *`,
      [req.user.id, plan.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Trial started',
      subscription: {
        ...subscriptionResult.rows[0],
        plan: normalizePlan(plan),
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error starting trial:', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

router.post('/create-checkout-session', verifyToken, async (req, res) => {
  const { plan_code } = req.body;

  if (!plan_code) {
    return res.status(400).json({ error: 'plan_code is required' });
  }

  try {
    const pool = getPool();
    const planResult = await pool.query(
      `SELECT *
       FROM subscription_plans
       WHERE code = $1 AND is_active = TRUE
       LIMIT 1`,
      [plan_code]
    );

    const plan = planResult.rows[0];
    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    if (!stripeSecretKey) {
      return res.status(503).json({
        error: 'Stripe is not configured',
        setup_required: true,
        required_env: ['STRIPE_SECRET_KEY', 'FRONTEND_URL'],
      });
    }

    const params = new URLSearchParams();
    const payload = {
      mode: 'subscription',
      client_reference_id: String(req.user.id),
      success_url: `${frontendUrl}/abonnements?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/abonnements?checkout=cancelled`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: String(plan.currency || 'EUR').toLowerCase(),
            unit_amount: plan.monthly_price_cents,
            recurring: { interval: 'month' },
            product_data: {
              name: plan.name,
              description: plan.description || `${plan.book_limit} livre(s) par mois`,
            },
          },
        },
      ],
      metadata: {
        user_id: req.user.id,
        plan_code: plan.code,
      },
      subscription_data: {
        metadata: {
          user_id: req.user.id,
          plan_code: plan.code,
        },
      },
    };

    appendStripeParams(params, payload);

    const session = await stripeRequest('/checkout/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    res.json({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (err) {
    console.error('Error creating Stripe checkout session:', err);
    res.status(err.statusCode || 500).json({
      error: err.message || 'Stripe checkout error',
      setup_required: err.statusCode === 503,
    });
  }
});

router.post('/confirm-checkout', verifyToken, async (req, res) => {
  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: 'session_id is required' });
  }

  const client = await getPool().connect();
  try {
    const session = await stripeRequest(`/checkout/sessions/${encodeURIComponent(session_id)}`);

    if (session.client_reference_id !== String(req.user.id) && session.metadata?.user_id !== String(req.user.id)) {
      return res.status(403).json({ error: 'Checkout session does not belong to this user' });
    }

    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Checkout session is not paid yet' });
    }

    const planCode = session.metadata?.plan_code;
    if (!planCode) {
      return res.status(400).json({ error: 'Missing plan metadata on checkout session' });
    }

    await client.query('BEGIN');

    const planResult = await client.query(
      `SELECT *
       FROM subscription_plans
       WHERE code = $1 AND is_active = TRUE
       LIMIT 1`,
      [planCode]
    );

    const plan = planResult.rows[0];
    if (!plan) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    const providerSubscriptionId = session.subscription || session.id;
    const existingSubscription = await client.query(
      `SELECT *
       FROM user_subscriptions
       WHERE user_id = $1
         AND provider = 'stripe'
         AND provider_subscription_id = $2
       LIMIT 1`,
      [req.user.id, providerSubscriptionId]
    );

    if (existingSubscription.rows[0]) {
      await client.query('COMMIT');
      return res.json({
        message: 'Stripe subscription already confirmed',
        subscription: {
          ...existingSubscription.rows[0],
          plan: normalizePlan(plan),
        },
      });
    }

    const subscription = await activateSubscription(
      client,
      req.user.id,
      plan,
      'stripe',
      providerSubscriptionId
    );

    await client.query('COMMIT');

    res.json({
      message: 'Stripe subscription confirmed',
      subscription: {
        ...subscription,
        plan: normalizePlan(plan),
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error confirming Stripe checkout:', err);
    res.status(err.statusCode || 500).json({
      error: err.message || 'Stripe confirmation error',
      setup_required: err.statusCode === 503,
    });
  } finally {
    client.release();
  }
});

export default router;
