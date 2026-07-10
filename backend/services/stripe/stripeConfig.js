import Stripe from 'stripe';

let stripeClient = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  if (!isStripeConfigured()) {
    const error = new Error('Stripe is not configured');
    error.status = 503;
    error.code = 'STRIPE_NOT_CONFIGURED';
    throw error;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
      maxNetworkRetries: 2
    });
  }
  return stripeClient;
}

export function getFrontendUrl() {
  return (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'https://hkids.vercel.app').replace(/\/+$/, '');
}

export function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || '';
}

export function requireWebhookSecretInProduction() {
  if (process.env.NODE_ENV === 'production' && !getWebhookSecret()) {
    const error = new Error('STRIPE_WEBHOOK_SECRET is required in production');
    error.status = 503;
    error.code = 'WEBHOOK_SECRET_MISSING';
    throw error;
  }
}

export function getCheckoutTrialDays(plan) {
  const planTrial = Number(plan?.trial_days);
  if (Number.isFinite(planTrial) && planTrial > 0) return Math.min(planTrial, 30);
  const envTrial = Number(process.env.STRIPE_CHECKOUT_TRIAL_DAYS);
  if (Number.isFinite(envTrial) && envTrial > 0) return Math.min(envTrial, 30);
  return 0;
}
