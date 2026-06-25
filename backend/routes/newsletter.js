import crypto from 'crypto';
import express from 'express';
import { getDatabase } from '../database/init.js';

const router = express.Router();

function cleanUrl(url) {
  return String(url || '').replace(/\/+$/, '');
}

function getNewsletterConfig() {
  const fromEmail =
    process.env.NEWSLETTER_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    'HKids <onboarding@resend.dev>';

  return {
    resendApiKey: process.env.RESEND_API_KEY || process.env.RESEND_KEY || '',
    fromEmail,
    usesTestSender: fromEmail.includes('onboarding@resend.dev'),
    allowTestSender: process.env.ALLOW_RESEND_TEST_SENDER === 'true',
    frontendUrl: cleanUrl(process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'https://h-kids.vercel.app'),
    backendUrl: cleanUrl(
      process.env.BACKEND_URL ||
      process.env.API_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
    ),
  };
}

router.get('/status', (req, res) => {
  const { resendApiKey, fromEmail, usesTestSender, allowTestSender, frontendUrl, backendUrl } = getNewsletterConfig();

  res.json({
    resend_configured: Boolean(resendApiKey),
    from_email: fromEmail,
    uses_test_sender: usesTestSender,
    test_sender_allowed: allowTestSender,
    frontend_url: frontendUrl,
    backend_url: backendUrl,
    ready_to_send: Boolean(resendApiKey) && (!usesTestSender || allowTestSender),
  });
});

function getPool() {
  try {
    return getDatabase();
  } catch (error) {
    console.error('Database not initialized:', error);
    throw new Error('Database connection not available');
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendConfirmationEmail(email, token) {
  const { resendApiKey, fromEmail, frontendUrl, backendUrl, usesTestSender, allowTestSender } = getNewsletterConfig();

  if (!resendApiKey) {
    const error = new Error('RESEND_API_KEY is missing on the backend');
    error.statusCode = 503;
    error.setupRequired = true;
    throw error;
  }

  if (usesTestSender && !allowTestSender) {
    const error = new Error('NEWSLETTER_FROM_EMAIL must use a verified Resend domain');
    error.statusCode = 503;
    error.setupRequired = true;
    throw error;
  }

  const confirmationUrl = backendUrl
    ? `${backendUrl}/api/newsletter/confirm?token=${encodeURIComponent(token)}`
    : `${frontendUrl}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject: 'Confirmez que vous souhaitez recevoir du marketing par e-mail',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 32px; color: #111;">
          <div style="font-size: 44px; font-weight: 700; color: #6ab7a8; margin-bottom: 28px;">H<span style="color:#c8b19d;">kids</span></div>
          <h1 style="font-size: 32px; line-height: 1.25; margin: 0 0 18px;">Confirmez que vous souhaitez recevoir du marketing par e-mail</h1>
          <p style="font-size: 18px; line-height: 1.6; color: #666; margin: 0 0 28px;">
            Vous devez confirmer que vous souhaitez recevoir des messages marketing de notre part.
            Si vous n'êtes pas abonné(e), vous n'avez rien à faire.
          </p>
          <a href="${confirmationUrl}" style="display: block; text-align: center; background: #6ab7a8; color: white; text-decoration: none; font-size: 20px; padding: 18px 24px; border-radius: 6px;">
            Inscription
          </a>
        </div>
      `,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Email provider request failed');
    error.statusCode = response.status;
    error.providerResponse = data;
    throw error;
  }

  return data;
}

router.post('/subscribe', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Adresse e-mail invalide' });
  }

  try {
    const pool = getPool();
    const token = crypto.randomBytes(32).toString('hex');

    await pool.query(
      `INSERT INTO newsletter_subscribers (email, confirmation_token, confirmed_at, updated_at)
       VALUES ($1, $2, NULL, NOW())
       ON CONFLICT (email) DO UPDATE SET
         confirmation_token = EXCLUDED.confirmation_token,
         updated_at = NOW()
       RETURNING id`,
      [email, token]
    );

    let emailSent = true;
    let setupRequired = false;
    let emailResult = null;

    try {
      emailResult = await sendConfirmationEmail(email, token);
    } catch (emailError) {
      if (!emailError.setupRequired) {
        throw emailError;
      }

      emailSent = false;
      setupRequired = true;
      console.warn('Newsletter email service is not configured. Subscriber was saved without sending confirmation email.');
    }

    res.status(emailSent ? 202 : 200).json({
      message: emailSent ? 'Confirmation email sent' : 'Subscription saved; email service is not configured',
      email_sent: emailSent,
      setup_required: setupRequired,
      resend_id: emailSent ? emailResult?.id : null,
    });
  } catch (err) {
    console.error('Error subscribing to newsletter:', err);
    res.status(err.statusCode || 500).json({
      error: err.setupRequired
        ? "Le service d'e-mail n'est pas configuré sur le backend"
        : err.message || 'Newsletter subscription failed',
      setup_required: Boolean(err.setupRequired),
    });
  }
});

router.get('/confirm', async (req, res) => {
  const { frontendUrl } = getNewsletterConfig();
  const token = String(req.query.token || '');

  if (!token) {
    return res.redirect(`${frontendUrl}/?newsletter=invalid`);
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE newsletter_subscribers
       SET confirmed_at = COALESCE(confirmed_at, NOW()),
           updated_at = NOW()
       WHERE confirmation_token = $1
       RETURNING email`,
      [token]
    );

    if (!result.rows[0]) {
      return res.redirect(`${frontendUrl}/?newsletter=invalid`);
    }

    return res.redirect(`${frontendUrl}/?newsletter=confirmed`);
  } catch (err) {
    console.error('Error confirming newsletter subscription:', err);
    return res.redirect(`${frontendUrl}/?newsletter=error`);
  }
});

export default router;
