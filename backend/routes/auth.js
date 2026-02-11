import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../database/init.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hkids-secret-key-change-in-production';

// Signup
router.post('/signup', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const db = getDatabase();
  
  // Check if user already exists
  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username.trim()],
    (err, existingUser) => {
      if (err) {
        console.error('Database error during signup:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingUser) {
        console.log(`Signup attempt failed: User '${username}' already exists`);
        return res.status(409).json({ error: 'Username already exists' });
      }

      // Hash password and create user
      const hashedPassword = bcrypt.hashSync(password, 10);
      
      db.run(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [username.trim(), hashedPassword, 'admin'],
        function(err) {
          if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ error: 'Error creating user' });
          }

          console.log(`✅ New user created: ${username}`);
          res.status(201).json({
            message: 'User created successfully',
            user: {
              id: this.lastID,
              username: username.trim(),
              role: 'admin'
            }
          });
        }
      );
    }
  );
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const db = getDatabase();
  
  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username.trim()],
    (err, user) => {
      if (err) {
        console.error('Database error during login:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        console.log(`Login attempt failed: User '${username}' not found`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = bcrypt.compareSync(password, user.password);
      if (!isValid) {
        console.log(`Login attempt failed: Invalid password for user '${username}'`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log(`✅ Successful login for user: ${user.username}`);
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    }
  );
});

// Verify token middleware
export function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
}

export default router;

