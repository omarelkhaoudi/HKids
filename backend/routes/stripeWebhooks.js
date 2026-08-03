import express from 'express';
import {
  processStripeWebhookEvent,
  safeWebhookErrorMessage,
  verifyStripeWebhook
} from '../services/stripe/stripeWebhookService.js';

const router = express.Router();

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const event = verifyStripeWebhook(req.body, signature);
    const result = await processStripeWebhookEvent(event);
    res.json(result);
  } catch (error) {
    console.error('Stripe webhook error:', error.message);
    res.status(error.status || 500).json({
      error: safeWebhookErrorMessage(error),
      code: error.code || 'WEBHOOK_ERROR'
    });
  }
});

export default router;
