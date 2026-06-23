import express from 'express';
import { getDatabase } from '../database/init.js';
import { verifyToken } from './auth.js';

const router = express.Router();

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

router.get('/plans', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT *
       FROM subscription_plans
       WHERE is_active = TRUE
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
         AND us.status = 'active'
         AND us.current_period_start <= NOW()
         AND us.current_period_end > NOW()
       ORDER BY us.created_at DESC
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

    await client.query(
      `UPDATE user_subscriptions
       SET status = 'replaced', updated_at = NOW()
       WHERE user_id = $1 AND status IN ('trialing', 'active')`,
      [req.user.id]
    );

    const subscriptionResult = await client.query(
      `INSERT INTO user_subscriptions (
        user_id,
        plan_id,
        status,
        started_at,
        current_period_start,
        current_period_end
      )
      VALUES ($1, $2, 'active', NOW(), NOW(), NOW() + INTERVAL '1 month')
      RETURNING *`,
      [req.user.id, plan.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Subscription activated',
      subscription: {
        ...subscriptionResult.rows[0],
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

export default router;
