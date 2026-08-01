import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../../config/env.js';

export const SUPPORTED_OAUTH_PROVIDERS = new Set(['google', 'apple']);

export class OAuthConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OAuthConfigurationError';
  }
}

const JWT_SECRET = config.jwtSecret;
const OAUTH_STATE_EXPIRES_IN = '10m';
const GOOGLE_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);
const jwksCache = new Map();

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function getFrontendBaseUrl() {
  return trimTrailingSlash(
    process.env.FRONTEND_URL
      || process.env.CORS_ORIGIN
      || (config.nodeEnv === 'production' ? config.corsOrigin : 'http://localhost:5173')
  );
}

function getApiBaseUrl(req) {
  const configuredBackendUrl = config.nodeEnv === 'production'
    ? (process.env.OAUTH_BACKEND_URL || process.env.PUBLIC_BACKEND_URL || process.env.BACKEND_URL)
    : (process.env.OAUTH_BACKEND_URL || process.env.BACKEND_URL || process.env.PUBLIC_BACKEND_URL);
  if (configuredBackendUrl) return trimTrailingSlash(configuredBackendUrl);

  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
  const host = req.get('host');
  return trimTrailingSlash(`${protocol}://${host}`);
}

function getRedirectUri(req, provider) {
  return `${getApiBaseUrl(req)}/api/auth/oauth/${provider}/callback`;
}

function getProviderConfig(provider) {
  if (provider === 'google') {
    return {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  if (provider === 'apple') {
    return {
      clientId: process.env.APPLE_OAUTH_CLIENT_ID || process.env.APPLE_CLIENT_ID,
      teamId: process.env.APPLE_OAUTH_TEAM_ID || process.env.APPLE_TEAM_ID,
      keyId: process.env.APPLE_OAUTH_KEY_ID || process.env.APPLE_KEY_ID,
      privateKey: process.env.APPLE_OAUTH_PRIVATE_KEY || process.env.APPLE_PRIVATE_KEY,
      clientSecret: process.env.APPLE_OAUTH_CLIENT_SECRET || process.env.APPLE_CLIENT_SECRET,
    };
  }

  return null;
}

function assertProviderConfigured(provider, providerConfig) {
  if (!providerConfig?.clientId) {
    throw new OAuthConfigurationError(`${provider} OAuth client id is missing`);
  }

  if (provider === 'google' && !providerConfig.clientSecret) {
    throw new OAuthConfigurationError('Google OAuth client secret is missing');
  }

  if (
    provider === 'apple'
    && !providerConfig.clientSecret
    && (!providerConfig.teamId || !providerConfig.keyId || !providerConfig.privateKey)
  ) {
    throw new OAuthConfigurationError('Apple OAuth client secret or signing key is missing');
  }
}

function isSafeReturnTo(value) {
  return typeof value === 'string'
    && value.startsWith('/')
    && !value.startsWith('//')
    && !value.includes('\\');
}

function createOAuthState({ provider, role, mode, returnTo }) {
  return jwt.sign(
    {
      provider,
      role: role === 'parent' ? 'parent' : 'parent',
      mode: ['login', 'signup'].includes(mode) ? mode : 'login',
      returnTo: isSafeReturnTo(returnTo) ? returnTo : '/parent',
      nonce: crypto.randomUUID(),
    },
    JWT_SECRET,
    { expiresIn: OAUTH_STATE_EXPIRES_IN, algorithm: 'HS256' }
  );
}

function verifyOAuthState(state, provider) {
  if (!state) throw new Error('Missing OAuth state');
  const decoded = jwt.verify(state, JWT_SECRET, { algorithms: ['HS256'] });
  if (decoded.provider !== provider) {
    throw new Error('OAuth state provider mismatch');
  }
  return decoded;
}

function decodeJwtPart(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

async function getJwks(jwksUrl) {
  const cached = jwksCache.get(jwksUrl);
  if (cached && cached.expiresAt > Date.now()) return cached.keys;

  const response = await fetch(jwksUrl, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Could not load OAuth signing keys (${response.status})`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload.keys)) {
    throw new Error('OAuth signing keys response is invalid');
  }

  jwksCache.set(jwksUrl, {
    keys: payload.keys,
    expiresAt: Date.now() + 60 * 60 * 1000,
  });

  return payload.keys;
}

async function verifyIdTokenWithJwks(idToken, { jwksUrl, audience, issuer, allowedIssuers }) {
  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) throw new Error('OAuth id token is invalid');

  const [headerPart, payloadPart, signaturePart] = parts;
  const header = decodeJwtPart(headerPart);
  const payload = decodeJwtPart(payloadPart);

  if (header.alg !== 'RS256') {
    throw new Error('OAuth id token algorithm is not supported');
  }

  const keys = await getJwks(jwksUrl);
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) throw new Error('OAuth signing key not found');

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerPart}.${payloadPart}`);
  verifier.end();

  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const signature = Buffer.from(signaturePart, 'base64url');
  if (!verifier.verify(publicKey, signature)) {
    throw new Error('OAuth id token signature is invalid');
  }

  const tokenAudiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!tokenAudiences.includes(audience)) {
    throw new Error('OAuth id token audience is invalid');
  }

  if (allowedIssuers) {
    if (!allowedIssuers.has(payload.iss)) throw new Error('OAuth id token issuer is invalid');
  } else if (payload.iss !== issuer) {
    throw new Error('OAuth id token issuer is invalid');
  }

  if (!payload.exp || payload.exp * 1000 <= Date.now()) {
    throw new Error('OAuth id token has expired');
  }

  return payload;
}

async function exchangeOAuthCode(tokenUrl, fields) {
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(fields).toString(),
  });

  const rawBody = await response.text();
  let payload = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || `OAuth token exchange failed (${response.status})`);
  }

  return payload;
}

function getAppleClientSecret(providerConfig) {
  if (providerConfig.clientSecret) return providerConfig.clientSecret;

  const privateKey = String(providerConfig.privateKey).replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iss: providerConfig.teamId,
      iat: now,
      exp: now + 60 * 60 * 24 * 180,
      aud: 'https://appleid.apple.com',
      sub: providerConfig.clientId,
    },
    privateKey,
    {
      algorithm: 'ES256',
      keyid: providerConfig.keyId,
    }
  );
}

function normalizeAppleUser(rawUser) {
  if (!rawUser || typeof rawUser !== 'string') return {};
  try {
    return JSON.parse(rawUser);
  } catch {
    return {};
  }
}

function normalizeProfileName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 120) || null;
}

async function resolveGoogleProfile({ code, redirectUri, providerConfig }) {
  const tokenPayload = await exchangeOAuthCode('https://oauth2.googleapis.com/token', {
    code,
    client_id: providerConfig.clientId,
    client_secret: providerConfig.clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const idPayload = await verifyIdTokenWithJwks(tokenPayload.id_token, {
    jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
    audience: providerConfig.clientId,
    allowedIssuers: GOOGLE_ISSUERS,
  });

  if (!idPayload.sub) throw new Error('Google profile has no subject');

  return {
    provider: 'google',
    subject: idPayload.sub,
    email: idPayload.email ? String(idPayload.email).toLowerCase() : null,
    name: normalizeProfileName(idPayload.name),
  };
}

async function resolveAppleProfile({ code, redirectUri, providerConfig, rawUser }) {
  const tokenPayload = await exchangeOAuthCode('https://appleid.apple.com/auth/token', {
    code,
    client_id: providerConfig.clientId,
    client_secret: getAppleClientSecret(providerConfig),
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const idPayload = await verifyIdTokenWithJwks(tokenPayload.id_token, {
    jwksUrl: 'https://appleid.apple.com/auth/keys',
    audience: providerConfig.clientId,
    issuer: 'https://appleid.apple.com',
  });

  if (!idPayload.sub) throw new Error('Apple profile has no subject');

  const appleUser = normalizeAppleUser(rawUser);
  const firstName = appleUser.name?.firstName || appleUser.name?.first_name;
  const lastName = appleUser.name?.lastName || appleUser.name?.last_name;

  return {
    provider: 'apple',
    subject: idPayload.sub,
    email: idPayload.email ? String(idPayload.email).toLowerCase() : null,
    name: normalizeProfileName([firstName, lastName].filter(Boolean).join(' ')),
  };
}

export function buildOAuthAuthorizationUrl({ provider, req, role, mode, returnTo }) {
  if (!SUPPORTED_OAUTH_PROVIDERS.has(provider)) {
    throw new OAuthConfigurationError('Unsupported OAuth provider');
  }

  const providerConfig = getProviderConfig(provider);
  assertProviderConfigured(provider, providerConfig);

  const redirectUri = getRedirectUri(req, provider);
  const state = createOAuthState({ provider, role, mode, returnTo });

  if (provider === 'google') {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', providerConfig.clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('prompt', 'select_account');
    return authUrl.toString();
  }

  const authUrl = new URL('https://appleid.apple.com/auth/authorize');
  authUrl.searchParams.set('client_id', providerConfig.clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('response_mode', 'form_post');
  authUrl.searchParams.set('scope', 'name email');
  authUrl.searchParams.set('state', state);
  return authUrl.toString();
}

export async function resolveOAuthCallbackProfile({ provider, req, code, state, rawUser }) {
  if (!SUPPORTED_OAUTH_PROVIDERS.has(provider)) {
    throw new Error('Unsupported OAuth provider');
  }

  if (!code) throw new Error('Missing OAuth code');
  const statePayload = verifyOAuthState(state, provider);
  const providerConfig = getProviderConfig(provider);
  assertProviderConfigured(provider, providerConfig);
  const redirectUri = getRedirectUri(req, provider);

  const profile = provider === 'google'
    ? await resolveGoogleProfile({ code, redirectUri, providerConfig })
    : await resolveAppleProfile({ code, redirectUri, providerConfig, rawUser });

  return { profile, statePayload };
}

function makeOAuthUsername(profile) {
  if (profile.email) return profile.email.toLowerCase();
  const sanitizedSubject = String(profile.subject || '')
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '')
    .slice(0, 24);
  return `${profile.provider}_${sanitizedSubject || crypto.randomUUID().slice(0, 8)}`;
}

async function findAvailableUsername(pool, profile) {
  const baseUsername = makeOAuthUsername(profile).slice(0, 40);
  let candidate = baseUsername;

  for (let index = 0; index < 20; index += 1) {
    const existing = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1',
      [candidate]
    );
    if (existing.rows.length === 0) return candidate;

    const suffix = `-${index + 1}`;
    candidate = `${baseUsername.slice(0, 40 - suffix.length)}${suffix}`;
  }

  return `${profile.provider}_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    kid_profile_id: user.kid_profile_id || null,
  };
}

export async function findOrCreateOAuthUser(pool, profile, role = 'parent') {
  const normalizedRole = role === 'parent' ? 'parent' : 'parent';

  const oauthResult = await pool.query(
    `SELECT id, username, role, kid_profile_id
     FROM users
     WHERE oauth_provider = $1 AND oauth_subject = $2
     LIMIT 1`,
    [profile.provider, profile.subject]
  );

  if (oauthResult.rows[0]) {
    const user = oauthResult.rows[0];
    await pool.query(
      `UPDATE users
       SET oauth_email = COALESCE($1, oauth_email),
           oauth_name = COALESCE($2, oauth_name),
           last_login_at = NOW()
       WHERE id = $3`,
      [profile.email, profile.name, user.id]
    );
    return { user: publicUser(user), created: false };
  }

  if (profile.email) {
    const emailResult = await pool.query(
      `SELECT id, username, role, kid_profile_id
       FROM users
       WHERE LOWER(username) = LOWER($1)
       LIMIT 1`,
      [profile.email]
    );

    if (emailResult.rows[0]) {
      const user = emailResult.rows[0];
      await pool.query(
        `UPDATE users
         SET oauth_provider = $1,
             oauth_subject = $2,
             oauth_email = $3,
             oauth_name = COALESCE($4, oauth_name),
             last_login_at = NOW()
         WHERE id = $5`,
        [profile.provider, profile.subject, profile.email, profile.name, user.id]
      );
      return { user: publicUser(user), created: false };
    }
  }

  const username = await findAvailableUsername(pool, profile);
  const passwordPlaceholder = bcrypt.hashSync(`oauth:${profile.provider}:${profile.subject}:${crypto.randomUUID()}`, 12);

  const createdResult = await pool.query(
    `INSERT INTO users (
       username,
       password,
       role,
       oauth_provider,
       oauth_subject,
       oauth_email,
       oauth_name,
       last_login_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING id, username, role, kid_profile_id`,
    [
      username,
      passwordPlaceholder,
      normalizedRole,
      profile.provider,
      profile.subject,
      profile.email,
      profile.name,
    ]
  );

  return { user: publicUser(createdResult.rows[0]), created: true };
}

export function signUserToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      kid_profile_id: user.kid_profile_id || null,
    },
    JWT_SECRET,
    { expiresIn: config.jwtExpiresIn, algorithm: 'HS256' }
  );
}

export function buildOAuthSuccessRedirect({ token, statePayload }) {
  const redirectUrl = new URL('/auth/oauth/callback', getFrontendBaseUrl());
  redirectUrl.searchParams.set('token', token);
  redirectUrl.searchParams.set('return_to', isSafeReturnTo(statePayload?.returnTo) ? statePayload.returnTo : '/parent');
  return redirectUrl.toString();
}

export function buildOAuthErrorRedirect(message = 'oauth_failed') {
  const redirectUrl = new URL('/parent/login', getFrontendBaseUrl());
  redirectUrl.searchParams.set('oauth_error', message);
  return redirectUrl.toString();
}
