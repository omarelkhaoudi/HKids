import express from 'express';
import { verifyToken } from './auth.js';
import {
  activateManualSubscription,
  cancelSubscription,
  confirmCheckoutSession,
  createBillingPortalSession,
  createCheckoutSession,
  getCurrentSubscription,
  getInvoices,
  getPlans,
  getSubscriptionHistory,
  normalizePlan,
  rejectKidPayment,
  resumeSubscription,
  startTrial,
  unlockBook
} from '../services/stripe/subscriptionService.js';

const router = express.Router();

function boundedInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function sendServiceError(res, error) {
  const payload = {
    error: error?.status ? error.message : 'Subscription service unavailable',
    code: error?.code || 'SUBSCRIPTION_ERROR'
  };
  if (error?.parental_restriction) payload.parental_restriction = true;
  if (error?.parent_required) payload.parent_required = true;
  if (error?.code === 'STRIPE_NOT_CONFIGURED') payload.setup_required = true;
  return res.status(error?.status || 500).json(payload);
}

router.get('/plans', async (req, res) => {
  try {
    res.json(await getPlans());
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    sendServiceError(res, error);
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    res.json(await getCurrentSubscription(req.user));
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    sendServiceError(res, error);
  }
});

router.get('/invoices', verifyToken, async (req, res) => {
  try {
    const kidError = rejectKidPayment(req.user);
    if (kidError) return sendServiceError(res, kidError);
    res.json(await getInvoices(req.user, {
      limit: boundedInteger(req.query.limit, 20, 1, 50),
      offset: boundedInteger(req.query.offset, 0, 0, 10_000)
    }));
  } catch (error) {
    console.error('Error fetching subscription invoices:', error);
    sendServiceError(res, error);
  }
});

router.get('/history', verifyToken, async (req, res) => {
  try {
    const kidError = rejectKidPayment(req.user);
    if (kidError) return sendServiceError(res, kidError);
    res.json(await getSubscriptionHistory(req.user, {
      limit: boundedInteger(req.query.limit, 50, 1, 100),
      offset: boundedInteger(req.query.offset, 0, 0, 10_000)
    }));
  } catch (error) {
    console.error('Error fetching subscription history:', error);
    sendServiceError(res, error);
  }
});

router.post('/unlock-book', verifyToken, async (req, res) => {
  const { book_id } = req.body;
  if (!book_id) return res.status(400).json({ error: 'book_id is required' });

  try {
    const result = await unlockBook(req.user, book_id);
    res.status(result.message === 'Book unlocked' ? 201 : 200).json(result);
  } catch (error) {
    console.error('Error unlocking subscription book:', error);
    sendServiceError(res, error);
  }
});

router.post('/subscribe', verifyToken, async (req, res) => {
  const kidError = rejectKidPayment(req.user);
  if (kidError) return sendServiceError(res, kidError);
  if (!req.body.plan_code) return res.status(400).json({ error: 'plan_code is required' });

  try {
    const { subscription, plan } = await activateManualSubscription(req.user, req.body.plan_code);
    res.status(201).json({
      message: 'Subscription activated',
      subscription: { ...subscription, plan: normalizePlan(plan) }
    });
  } catch (error) {
    console.error('Error creating manual subscription:', error);
    sendServiceError(res, error);
  }
});

router.post('/start-trial', verifyToken, async (req, res) => {
  const kidError = rejectKidPayment(req.user);
  if (kidError) return sendServiceError(res, kidError);

  try {
    const { subscription, plan } = await startTrial(req.user);
    res.status(201).json({
      message: 'Trial started',
      subscription: { ...subscription, plan: normalizePlan(plan) }
    });
  } catch (error) {
    console.error('Error starting trial:', error);
    sendServiceError(res, error);
  }
});

router.post('/create-checkout-session', verifyToken, async (req, res) => {
  const kidError = rejectKidPayment(req.user);
  if (kidError) return sendServiceError(res, kidError);
  if (!req.body.plan_code) return res.status(400).json({ error: 'plan_code is required' });

  try {
    res.json(await createCheckoutSession(req.user, req.body.plan_code));
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    sendServiceError(res, error);
  }
});

router.post('/confirm-checkout', verifyToken, async (req, res) => {
  const kidError = rejectKidPayment(req.user);
  if (kidError) return sendServiceError(res, kidError);
  if (!req.body.session_id) return res.status(400).json({ error: 'session_id is required' });

  try {
    const { subscription, plan, already_confirmed } = await confirmCheckoutSession(req.user, req.body.session_id);
    res.json({
      message: already_confirmed ? 'Stripe subscription already confirmed' : 'Stripe subscription confirmed',
      subscription: { ...subscription, plan: normalizePlan(plan) }
    });
  } catch (error) {
    console.error('Error confirming Stripe checkout:', error);
    sendServiceError(res, error);
  }
});

router.post('/cancel', verifyToken, async (req, res) => {
  const kidError = rejectKidPayment(req.user);
  if (kidError) return sendServiceError(res, kidError);

  try {
    const result = await cancelSubscription(req.user, { atPeriodEnd: req.body.at_period_end !== false });
    res.json({
      message: result.message,
      subscription: { ...result.subscription, plan: result.plan }
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    sendServiceError(res, error);
  }
});

router.post('/resume', verifyToken, async (req, res) => {
  const kidError = rejectKidPayment(req.user);
  if (kidError) return sendServiceError(res, kidError);

  try {
    const result = await resumeSubscription(req.user);
    res.json({
      message: result.message,
      subscription: { ...result.subscription, plan: result.plan }
    });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    sendServiceError(res, error);
  }
});

router.post('/billing-portal', verifyToken, async (req, res) => {
  const kidError = rejectKidPayment(req.user);
  if (kidError) return sendServiceError(res, kidError);

  try {
    res.json(await createBillingPortalSession(req.user));
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    sendServiceError(res, error);
  }
});

export default router;
