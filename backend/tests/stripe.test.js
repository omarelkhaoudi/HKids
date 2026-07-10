import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { mapStripeStatus } from '../services/stripe/subscriptionService.js';
import { verifyStripeWebhook } from '../services/stripe/stripeWebhookService.js';

const TEST_SECRET = 'whsec_test_secret_for_unit_tests_only';

test('mapStripeStatus maps production lifecycle states', () => {
  assert.equal(mapStripeStatus('trialing'), 'trialing');
  assert.equal(mapStripeStatus('active'), 'active');
  assert.equal(mapStripeStatus('past_due'), 'past_due');
  assert.equal(mapStripeStatus('canceled'), 'canceled');
  assert.equal(mapStripeStatus('incomplete_expired'), 'incomplete');
});

test('verifyStripeWebhook rejects missing signature', () => {
  const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const previousStripeKey = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_WEBHOOK_SECRET = TEST_SECRET;
  process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';

  try {
    assert.throws(
      () => verifyStripeWebhook(Buffer.from('{}'), undefined),
      (error) => error.code === 'SIGNATURE_MISSING'
    );
  } finally {
    process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
    process.env.STRIPE_SECRET_KEY = previousStripeKey;
  }
});

test('verifyStripeWebhook rejects invalid signature', () => {
  const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const previousStripeKey = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_WEBHOOK_SECRET = TEST_SECRET;
  process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';

  try {
    assert.throws(
      () => verifyStripeWebhook(Buffer.from('{"id":"evt_test"}'), 'invalid-signature'),
      (error) => error.code === 'SIGNATURE_INVALID'
    );
  } finally {
    process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
    process.env.STRIPE_SECRET_KEY = previousStripeKey;
  }
});

test('verifyStripeWebhook accepts valid Stripe signature', () => {
  const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const previousStripeKey = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_WEBHOOK_SECRET = TEST_SECRET;
  process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';

  try {
    const payload = JSON.stringify({
      id: 'evt_test_webhook',
      object: 'event',
      type: 'invoice.paid',
      data: { object: { id: 'in_test', object: 'invoice', status: 'paid' } }
    });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' });
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: TEST_SECRET
    });
    const event = verifyStripeWebhook(Buffer.from(payload), signature);
    assert.equal(event.id, 'evt_test_webhook');
    assert.equal(event.type, 'invoice.paid');
  } finally {
    process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
    process.env.STRIPE_SECRET_KEY = previousStripeKey;
  }
});

test('manual subscriptions are blocked in production mode', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    const { activateManualSubscription } = await import('../services/stripe/subscriptionService.js');
    await assert.rejects(
      () => activateManualSubscription({ id: 1, role: 'parent' }, 'one_book_monthly'),
      (error) => error.code === 'MANUAL_DISABLED'
    );
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
});
