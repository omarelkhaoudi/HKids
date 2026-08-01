import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../database/init.js';
import { logSecurityEvent } from '../services/security/auditLog.js';
import { signupRateLimiter } from '../middleware/rateLimiter.js';
import { canRegisterAdmin } from '../utils/adminSignupPolicy.js';
import config from '../config/env.js';
import {
  OAuthConfigurationError,
  buildOAuthAuthorizationUrl,
  buildOAuthErrorRedirect,
  buildOAuthSuccessRedirect,
  findOrCreateOAuthUser,
  resolveOAuthCallbackProfile,
  signUserToken,
} from '../services/auth/oauthService.js';

const LOGIN_LOCKOUT_MAX = 5;
const LOGIN_LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const failedLoginAttempts = new Map();

function getLoginLockout(username) {
  const entry = failedLoginAttempts.get(username);
  if (!entry) return null;
  if (Date.now() > entry.resetTime) {
    failedLoginAttempts.delete(username);
    return null;
  }
  return entry;
}

function recordFailedLogin(username) {
  const existing = getLoginLockout(username) || { count: 0, resetTime: Date.now() + LOGIN_LOCKOUT_WINDOW_MS };
  existing.count += 1;
  existing.resetTime = Date.now() + LOGIN_LOCKOUT_WINDOW_MS;
  failedLoginAttempts.set(username, existing);
}

function clearFailedLogin(username) {
  failedLoginAttempts.delete(username);
}

const router = express.Router();
const JWT_SECRET = config.jwtSecret;
const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,40}$/;

// Helper function to get database pool safely
function getPool() {
  try {
    return getDatabase();
  } catch (error) {
    console.error('Database not initialized:', error);
    throw new Error('Database connection not available');
  }
}

function normalizeOAuthProvider(value) {
  const provider = String(value || '').trim().toLowerCase();
  return ['google', 'apple'].includes(provider) ? provider : null;
}

function getRequestValue(req, key) {
  return req.body?.[key] || req.query?.[key];
}

function getOAuthErrorCode(error) {
  if (error instanceof OAuthConfigurationError) return 'oauth_not_configured';
  return 'oauth_failed';
}

router.get('/oauth/:provider', async (req, res) => {
  const provider = normalizeOAuthProvider(req.params.provider);

  if (!provider) {
    return res.redirect(buildOAuthErrorRedirect('oauth_provider_not_supported'));
  }

  try {
    const authorizationUrl = buildOAuthAuthorizationUrl({
      provider,
      req,
      role: req.query.role,
      mode: req.query.mode,
      returnTo: req.query.return_to,
    });

    return res.redirect(authorizationUrl);
  } catch (error) {
    console.warn(`${provider} OAuth start failed:`, error.message);
    return res.redirect(buildOAuthErrorRedirect(getOAuthErrorCode(error)));
  }
});

async function handleOAuthCallback(req, res) {
  const provider = normalizeOAuthProvider(req.params.provider);

  if (!provider) {
    return res.redirect(buildOAuthErrorRedirect('oauth_provider_not_supported'));
  }

  const providerError = getRequestValue(req, 'error');
  if (providerError) {
    return res.redirect(buildOAuthErrorRedirect('oauth_cancelled'));
  }

  let pool;

  try {
    pool = getPool();
    const { profile, statePayload } = await resolveOAuthCallbackProfile({
      provider,
      req,
      code: getRequestValue(req, 'code'),
      state: getRequestValue(req, 'state'),
      rawUser: getRequestValue(req, 'user'),
    });

    const { user, created } = await findOrCreateOAuthUser(pool, profile, statePayload.role);
    const token = signUserToken(user);

    await logSecurityEvent(pool, {
      userId: user.id,
      actorRole: user.role,
      action: created ? 'oauth_user_created' : 'oauth_login_success',
      resourceType: 'user',
      resourceId: user.id,
      req,
      metadata: {
        provider,
        mode: statePayload.mode,
        email_available: Boolean(profile.email),
      },
    });

    return res.redirect(buildOAuthSuccessRedirect({ token, statePayload }));
  } catch (error) {
    console.error(`${provider} OAuth callback failed:`, error.message);
    if (pool) {
      await logSecurityEvent(pool, {
        action: 'oauth_login_failed',
        req,
        metadata: {
          provider,
          reason: String(error.message || 'oauth_failed').slice(0, 120),
        },
      });
    }
    return res.redirect(buildOAuthErrorRedirect(getOAuthErrorCode(error)));
  }
}

router.get('/oauth/:provider/callback', handleOAuthCallback);
router.post('/oauth/:provider/callback', handleOAuthCallback);

// Signup
router.post('/signup', signupRateLimiter, async (req, res) => {
  const { username, password, role, admin_signup_code } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const normalizedUsername = String(username).trim();

  if (!USERNAME_PATTERN.test(normalizedUsername)) {
    return res.status(400).json({ error: 'Username must be 3-40 characters and use only letters, numbers, dot, dash or underscore' });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  // Validate role if provided
  const validRoles = ['parent'];
  let userRole = role && validRoles.includes(role) ? role : 'parent';

  if (role === 'admin') {
    const pool = getPool();
    const adminSignup = await canRegisterAdmin(pool, admin_signup_code);

    if (!adminSignup.allowed) {
      return res.status(403).json({ error: adminSignup.error || 'Admin signup is not available' });
    }

    userRole = 'admin';
  }

  try {
    const pool = getPool();
    const existing = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [normalizedUsername]
    );

    if (existing.rows.length > 0) {
      console.log(`Signup attempt failed: User '${username}' already exists`);
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 12);

    const result = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [normalizedUsername, hashedPassword, userRole]
    );

    const user = result.rows[0];
    console.log(`✅ New user created: ${user.username} with role: ${user.role}`);

    await logSecurityEvent(pool, {
      userId: user.id,
      actorRole: user.role,
      action: 'user_signup',
      resourceType: 'user',
      resourceId: user.id,
      req,
      metadata: { role: user.role }
    });

    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (err) {
    console.error('Database error during signup:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const pool = getPool();
    const normalizedUsername = String(username).trim();
    const lockout = getLoginLockout(normalizedUsername);
    if (lockout && lockout.count >= LOGIN_LOCKOUT_MAX) {
      return res.status(429).json({ error: 'Too many failed login attempts. Try again later.' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [normalizedUsername]
    );

    const user = result.rows[0];
    if (!user) {
      console.log(`Login attempt failed: User '${username}' not found`);
      recordFailedLogin(normalizedUsername);
      await logSecurityEvent(pool, {
        action: 'login_failed',
        req,
        metadata: { reason: 'user_not_found', username: normalizedUsername.slice(0, 40) }
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      recordFailedLogin(normalizedUsername);
      console.log(`Login attempt failed: Invalid password for user '${username}'`);
      await logSecurityEvent(pool, {
        userId: user.id,
        actorRole: user.role,
        action: 'login_failed',
        resourceType: 'user',
        resourceId: user.id,
        req,
        metadata: { reason: 'invalid_password' }
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signUserToken(user);

    console.log(`✅ Successful login for user: ${user.username}`);
    clearFailedLogin(normalizedUsername);
    await logSecurityEvent(pool, {
      userId: user.id,
      actorRole: user.role,
      action: 'login_success',
      resourceType: 'user',
      resourceId: user.id,
      req
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        kid_profile_id: user.kid_profile_id || null,
      },
    });
  } catch (err) {
    console.error('Database error during login:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Verify token middleware
export async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('No authorization header provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      console.log('No token in authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const currentUser = await getPool().query(
      `SELECT id, username, role, kid_profile_id
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [decoded.id]
    );
    const user = currentUser.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      kid_profile_id: user.kid_profile_id || null
    };
    return next();
  } catch (error) {
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error?.name)) {
      console.log('Token verification failed:', error.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    console.error('Error in verifyToken middleware:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
}

router.get('/me', verifyToken, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ user: req.user });
});

export default router;

