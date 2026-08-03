import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {
  buildCheckoutIdempotencyKey,
  executeStripeRequest,
  hasPremiumEntitlement,
  isCheckoutPaymentComplete,
  isStaleStripeEvent,
  mapStripeStatus,
  sanitizeStripeError,
  stripeEventCreatedAt,
} from '../services/stripe/subscriptionService.js';
import {
  isWebhookProcessingStale,
  safeWebhookErrorMessage,
  verifyStripeWebhook,
  webhookEventCreatedAt,
} from '../services/stripe/stripeWebhookService.js';

const TEST_SECRET = 'whsec_test_secret_for_unit_tests_only';

test('mapStripeStatus maps production lifecycle states', () => {
  assert.equal(mapStripeStatus('trialing'), 'trialing');
  assert.equal(mapStripeStatus('active'), 'active');
  assert.equal(mapStripeStatus('past_due'), 'past_due');
  assert.equal(mapStripeStatus('canceled'), 'canceled');
  assert.equal(mapStripeStatus('incomplete_expired'), 'incomplete');
});

test('buildCheckoutIdempotencyKey is stable within the retry window', () => {
  const first = buildCheckoutIdempotencyKey(42, 'premium/monthly!', 1_800_000);
  const sameWindow = buildCheckoutIdempotencyKey(42, 'premium/monthly!', 1_800_001);
  const nextWindow = buildCheckoutIdempotencyKey(42, 'premium/monthly!', 2_400_001);

  assert.equal(first, sameWindow);
  assert.notEqual(first, nextWindow);
  assert.match(first, /^hkids_checkout_42_premiummonthly_\d+$/);
});

test('isCheckoutPaymentComplete requires completed and paid Stripe sessions', () => {
  assert.equal(isCheckoutPaymentComplete({ status: 'complete', payment_status: 'paid' }), true);
  assert.equal(isCheckoutPaymentComplete({ status: 'complete', payment_status: 'no_payment_required' }), true);
  assert.equal(isCheckoutPaymentComplete({ status: 'complete', payment_status: 'unpaid' }), false);
  assert.equal(isCheckoutPaymentComplete({ status: 'open', payment_status: 'paid' }), false);
  assert.equal(isCheckoutPaymentComplete({ status: 'expired', payment_status: 'paid' }), false);
});

test('stripe event timestamp helpers protect against out-of-order webhook writes', () => {
  assert.equal(stripeEventCreatedAt(1_700_000_000), '2023-11-14T22:13:20.000Z');
  assert.equal(webhookEventCreatedAt({ created: 1_700_000_000 }), '2023-11-14T22:13:20.000Z');
  assert.equal(isStaleStripeEvent('2025-01-01T00:00:00.000Z', '2024-12-31T23:59:59.000Z'), true);
  assert.equal(isStaleStripeEvent('2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'), false);
  assert.equal(isStaleStripeEvent('bad-date', '2025-01-01T00:00:00.000Z'), false);
});

test('webhook processing lock only allows stale processing claims to be retried', () => {
  const now = new Date('2026-08-03T12:00:00.000Z');
  assert.equal(
    isWebhookProcessingStale({ status: 'processing', last_received_at: '2026-08-03T11:59:00.000Z' }, now),
    false
  );
  assert.equal(
    isWebhookProcessingStale({ status: 'processing', last_received_at: '2026-08-03T11:45:00.000Z' }, now),
    true
  );
  assert.equal(
    isWebhookProcessingStale({ status: 'failed', last_received_at: '2026-08-03T11:45:00.000Z' }, now),
    false
  );
});

test('hasPremiumEntitlement only accepts active non-expired subscription states', () => {
  const now = new Date('2026-08-03T00:00:00.000Z');
  assert.equal(hasPremiumEntitlement({ status: 'active', current_period_end: '2026-08-04T00:00:00.000Z' }, now), true);
  assert.equal(hasPremiumEntitlement({ status: 'trialing' }, now), true);
  assert.equal(hasPremiumEntitlement({ status: 'past_due', current_period_end: '2026-08-04T00:00:00.000Z' }, now), false);
  assert.equal(hasPremiumEntitlement({ status: 'active', current_period_end: '2026-08-02T00:00:00.000Z' }, now), false);
  assert.equal(hasPremiumEntitlement({ status: 'canceled' }, now), false);
});

test('Stripe provider failures are sanitized before reaching API responses', async () => {
  assert.equal(
    sanitizeStripeError({ type: 'api_connection_error', message: 'connect ECONNRESET sk_live_secret' }),
    'Payment provider is temporarily unavailable'
  );

  let receivedOptions;
  await assert.rejects(
    () => executeStripeRequest(
      (options) => {
        receivedOptions = options;
        const error = new Error('No such customer sk_live_secret');
        error.type = 'invalid_request_error';
        error.statusCode = 400;
        throw error;
      },
      { operationName: 'customers.retrieve', idempotencyKey: 'hkids_customer_1' }
    ),
    (error) => error.code === 'STRIPE_PROVIDER_ERROR'
      && error.message === 'Payment provider is temporarily unavailable'
      && error.operation === 'customers.retrieve'
      && error.provider_error_code === null
  );
  assert.deepEqual(receivedOptions, { idempotencyKey: 'hkids_customer_1' });
});

test('webhook error messages never expose provider internals', () => {
  assert.equal(safeWebhookErrorMessage({ code: 'SIGNATURE_INVALID', message: 'raw secret leak' }), 'Invalid Stripe webhook signature');
  assert.equal(safeWebhookErrorMessage({ code: 'SIGNATURE_MISSING' }), 'Missing Stripe signature header');
  assert.equal(safeWebhookErrorMessage({ message: 'database stack trace with key' }), 'Stripe webhook processing failed');
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
