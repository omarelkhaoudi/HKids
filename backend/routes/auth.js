import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../database/init.js';
import { logSecurityEvent } from '../services/security/auditLog.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hkids-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';
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

// Signup
router.post('/signup', async (req, res) => {
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
    const adminSignupEnabled = process.env.ADMIN_SIGNUP_ENABLED === 'true';
    const requiredCode = process.env.ADMIN_SIGNUP_CODE;

    if (!adminSignupEnabled || (requiredCode && admin_signup_code !== requiredCode)) {
      return res.status(403).json({ error: 'Admin signup is not available' });
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
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [normalizedUsername]
    );

    const user = result.rows[0];
    if (!user) {
      console.log(`Login attempt failed: User '${username}' not found`);
      await logSecurityEvent(pool, {
        action: 'login_failed',
        req,
        metadata: { reason: 'user_not_found', username: normalizedUsername.slice(0, 40) }
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
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

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        kid_profile_id: user.kid_profile_id || null
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log(`✅ Successful login for user: ${user.username}`);
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
export function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('No authorization header provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      console.log('No token in authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log('Token verification failed:', err.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Error in verifyToken middleware:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
}

export default router;

