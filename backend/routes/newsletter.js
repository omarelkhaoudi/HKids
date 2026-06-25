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
  const logoUrl = `${frontendUrl}/HKidsimg.webp`;

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
      subject: 'Bienvenue chez HKids - confirmez votre inscription',
      text: `Bienvenue chez HKids ! Confirmez votre inscription pour recevoir nos nouveautes, nos histoires et nos offres speciales : ${confirmationUrl}`,
      html: `
        <div style="margin:0; padding:0; background:#fff7f4; font-family:Arial, Helvetica, sans-serif; color:#171717;">
          <div style="max-width:680px; margin:0 auto; padding:28px 16px;">
            <div style="background:#1f1f1f; border-radius:24px 24px 0 0; padding:22px 26px;">
              <img src="${logoUrl}" alt="HKids" width="64" height="64" style="display:inline-block; width:64px; height:64px; border-radius:18px; border:3px solid #ff5f8f; vertical-align:middle; object-fit:cover;">
              <span style="display:inline-block; margin-left:14px; color:#ffffff; font-size:28px; font-weight:800; vertical-align:middle;">HKids</span>
            </div>
            <div style="background:#ffffff; border-radius:0 0 24px 24px; padding:38px 30px 34px; border:1px solid #ffe1db; border-top:0; box-shadow:0 18px 45px rgba(31,31,31,0.10);">
              <div style="display:inline-block; padding:9px 14px; border-radius:999px; background:#fff0e9; color:#ff5a1f; font-size:14px; font-weight:800; margin-bottom:20px;">
                Bienvenue dans la bibliotheque HKids
              </div>
              <h1 style="margin:0 0 16px; font-size:34px; line-height:1.15; font-weight:900; color:#151515;">
                Confirmez votre inscription
              </h1>
              <p style="margin:0 0 14px; color:#4b5563; font-size:18px; line-height:1.65;">
                Merci de rejoindre HKids. Confirmez votre adresse e-mail pour recevoir nos nouvelles histoires, les sorties de livres et les petites surprises preparees pour les enfants.
              </p>
              <p style="margin:0 0 28px; color:#6b7280; font-size:15px; line-height:1.6;">
                Si vous n'avez pas demande cette inscription, vous pouvez simplement ignorer cet e-mail.
              </p>
              <a href="${confirmationUrl}" style="display:block; text-align:center; color:#ffffff; text-decoration:none; font-size:18px; font-weight:800; padding:17px 22px; border-radius:999px; background:linear-gradient(90deg,#ef233c,#e83e8c,#fb5607); box-shadow:0 14px 28px rgba(232,62,140,0.28);">
                Confirmer mon inscription
              </a>
              <div style="margin-top:30px; padding:18px; border-radius:18px; background:#fff8ed; color:#7c4a03; font-size:14px; line-height:1.55;">
                HKids aide les enfants a decouvrir le plaisir de lire avec des histoires simples, colorees et adaptees a leur age.
              </div>
            </div>
            <p style="margin:18px 0 0; text-align:center; color:#9ca3af; font-size:12px;">
              HKids - Bibliotheque numerique pour enfants
            </p>
          </div>
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
