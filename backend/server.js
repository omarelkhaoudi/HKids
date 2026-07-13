// IMPORTANT: Charger les variables d'environnement EN PREMIER
import config from './config/env.js';

import dotenv from 'dotenv';
dotenv.config();


import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { getDatabase, initDatabase } from './database/init.js';
import supabase from './config/supabase.js';
import booksRouter from './routes/books.js';
import authRouter from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import parentalRouter from './routes/parental.js';
import subscriptionsRouter from './routes/subscriptions.js';
import stripeWebhooksRouter from './routes/stripeWebhooks.js';
import newsletterRouter from './routes/newsletter.js';
import adminRouter from './routes/admin.js';
import aiRouter from './routes/ai.js';
import generatedStoriesRouter from './routes/generatedStories.js';
import recommendationsRouter from './routes/recommendations.js';
import voicesRouter from './routes/voices.js';
import learningRouter from './routes/learning.js';
import privacyRouter from './routes/privacy.js';
import reportsRouter from './routes/reports.js';
import supportRouter from './routes/support.js';
import offlineRouter from './routes/offline.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';
import { apiRateLimiter, authRateLimiter, resetRateLimit } from './middleware/rateLimiter.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { sanitizeBody } from './middleware/validator.js';
import { isDevOnlyEndpointEnabled } from './utils/productionGuards.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.port;

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(securityHeaders);

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (ex: Postman, same-origin)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

    if (config.nodeEnv === 'production') {
      // En prod, on autorise uniquement les origines listées
      const allowedOrigins = [
        'https://h-kids.vercel.app',
        'https://hkids.vercel.app',
        config.corsOrigin
      ].filter(Boolean);
      
      if (allowedOrigins.map(o => o.replace(/\/$/, '')).includes(normalizedOrigin)) {
        return callback(null, true);
      } else {
        console.warn(`⚠️ CORS rejetée: ${normalizedOrigin}`);
        return callback(new Error('Not allowed by CORS'));
      }
    } else {
      // En dev, on accepte toutes les origines
      return callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Stripe-Signature'],
  exposedHeaders: ['Content-Disposition'],
}));
app.use('/api/webhooks/stripe', stripeWebhooksRouter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Sanitize input
app.use(sanitizeBody);

// Rate limiting
app.use('/api/auth', authRateLimiter);
app.use('/api', apiRateLimiter);

// Serve book uploads without fallback. If a file is missing, returning 404 is
// required so the reader never displays unrelated old content.
app.get('/uploads/books/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const fullPath = path.join(__dirname, 'uploads', 'books', filename);
    const storedPath = `/uploads/books/${filename}`;
    const pool = getDatabase();
    const accessResult = await pool.query(
      `SELECT
         EXISTS (
           SELECT 1
           FROM books b
           LEFT JOIN book_pages bp ON bp.book_id = b.id
           WHERE $1 IN (b.file_path, b.cover_image, b.audio_url)
              OR bp.image_path = $1
         ) AS known_asset,
         EXISTS (
           SELECT 1
           FROM books b
           LEFT JOIN book_pages bp ON bp.book_id = b.id
           WHERE ($1 IN (b.file_path, b.cover_image, b.audio_url) OR bp.image_path = $1)
             AND b.is_published = TRUE
             AND (b.publish_at IS NULL OR b.publish_at <= NOW())
             AND COALESCE(b.moderation_status, 'approved') = 'approved'
         ) AS public_asset`,
      [storedPath]
    );
    const access = accessResult.rows[0] || {};
    if (!access.known_asset) {
      return res.status(404).json({ error: 'Book file not found' });
    }

    if (!access.public_asset) {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(404).json({ error: 'Book file not found' });
      try {
        const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
        const admin = await pool.query(
          `SELECT id FROM users
           WHERE id = $1 AND role = 'admin'
           LIMIT 1`,
          [decoded.id]
        );
        if (!admin.rows[0]) return res.status(404).json({ error: 'Book file not found' });
      } catch {
        return res.status(404).json({ error: 'Book file not found' });
      }
    }

    if (fs.existsSync(fullPath)) {
      return res.sendFile(fullPath);
    }

    console.warn('[uploads] File not found:', filename);
    return res.status(404).json({ error: 'Book file not found' });
  } catch (error) {
    console.error('[uploads] Error serving book file:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Static files for other uploads (non-books)
app.use('/uploads/voices', (req, res) => {
  res.status(403).json({ error: 'Voice files require authenticated API access' });
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database initialization flag
let dbInitialized = false;
let dbInitializationPromise = null;

async function ensureDatabaseInitialized(req, res, next) {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  try {
    if (dbInitialized) return next();

    if (!dbInitializationPromise) {
      dbInitializationPromise = initDatabase()
        .then(() => {
          console.log('✅ Database initialization completed');
          dbInitialized = true;
        })
        .catch((err) => {
          dbInitializationPromise = null;
          throw err;
        });
    }

    await dbInitializationPromise;
    return next();
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    return res.status(500).json({ error: 'Database initialization failed' });
  }
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'HKids API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv
  });
});

app.use('/api', ensureDatabaseInitialized);
app.use('/api/auth', authRouter);
app.use('/api/books', booksRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/parental', parentalRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/admin', adminRouter);
app.use('/api/ai', aiRouter);
app.use('/api/generated-stories', generatedStoriesRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/voices', voicesRouter);
app.use('/api/learning', learningRouter);
app.use('/api/privacy', privacyRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/support', supportRouter);
app.use('/api/offline', offlineRouter);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'HKids Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login'
      },
      books: 'GET /api/books',
      categories: 'GET /api/categories'
    },
    documentation: 'Visit /api/health for API status'
  });
});

// Log available routes for debugging
console.log('📋 Available auth routes:');
console.log('   POST /api/auth/signup');
console.log('   POST /api/auth/login');

app.get('/api/test-supabase', async (req, res) => {
  if (config.nodeEnv === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Supabase is not configured'
      });
    }

    const { data, error } = await supabase.from('users').select('*').limit(5);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get('/api/uploads-status', (req, res) => {
  if (config.nodeEnv === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const booksDir = path.join(__dirname, 'uploads', 'books');
    const booksDirExists = fs.existsSync(booksDir);
    const booksFileCount = booksDirExists ? fs.readdirSync(booksDir).length : 0;

    res.json({
      booksDirExists,
      booksFileCount
    });
  } catch (err) {
    res.status(500).json({
      error: 'uploads_status_failed'
    });
  }
});

// Reset rate limit endpoint (available in all environments)
// This helps users who hit rate limits during testing
app.post('/api/reset-rate-limit', (req, res) => {
  if (!isDevOnlyEndpointEnabled(config.nodeEnv)) {
    return res.status(404).json({ error: 'Not found' });
  }

  const ip = req.ip || req.connection.remoteAddress;
  resetRateLimit(ip);
  res.json({ 
    success: true, 
    message: 'Rate limit reset for your IP',
    ip: ip
  });
});
console.log('   POST /api/reset-rate-limit');

// 404 handler (must be before error handler)
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Store server reference for graceful shutdown
let server = null;

// Function to check and free port if needed
// Skip in production environments (Fly.io, Render, etc.)
function checkAndFreePort(callback) {
  // Skip port checking in production environments
  if (config.nodeEnv === 'production' || process.env.FLY_APP_NAME || process.env.RENDER) {
    // In production, just proceed - the platform manages the port
    callback();
    return;
  }

  const isWindows = process.platform === 'win32';
  const command = isWindows 
    ? `netstat -ano | findstr :${PORT}`
    : `lsof -ti:${PORT}`;
  
  exec(command, (error, stdout) => {
    if (!error && stdout && stdout.trim()) {
      console.log(`⚠️  Port ${PORT} is already in use. Freeing it...`);
      
      if (isWindows) {
        const lines = stdout.trim().split('\n');
        const pids = new Set();
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 0) {
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(pid)) {
              pids.add(pid);
            }
          }
        });
        pids.forEach(pid => {
          console.log(`   Killing process ${pid}...`);
          exec(`taskkill /PID ${pid} /F`, () => {});
        });
      } else {
        const pid = stdout.trim();
        console.log(`   Killing process ${pid}...`);
        exec(`kill -9 ${pid}`, () => {});
      }
      
      // Wait a bit for the port to be freed
      setTimeout(callback, 1500);
    } else {
      // Port is free, proceed immediately
      callback();
    }
  });
}

// Function to start server
function startServer() {
  // Close existing server if it exists
  if (server) {
    console.log('🔄 Closing existing server...');
    server.close(() => {
      console.log('✅ Previous server closed');
      checkAndFreePort(() => createServer());
    });
  } else {
    checkAndFreePort(() => createServer());
  }
}

function createServer() {
  try {
    // In production (Fly.io, Render, etc.), listen on 0.0.0.0 to accept external connections
    const host = (config.nodeEnv === 'production' || process.env.FLY_APP_NAME || process.env.RENDER) 
      ? '0.0.0.0' 
      : 'localhost';
    
    server = app.listen(PORT, host, () => {
      console.log(`🚀 HKids Backend running on http://${host}:${PORT}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log(`🔒 CORS Origin: ${config.corsOrigin}`);
    });

    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // In production, don't try to kill processes - let the platform handle it
        if (config.nodeEnv === 'production' || process.env.FLY_APP_NAME || process.env.RENDER) {
          console.error(`❌ Port ${PORT} is already in use.`);
          console.log('💡 In production, the platform manages the port. This may be a configuration issue.');
          process.exit(1);
          return;
        }

        console.error(`❌ Port ${PORT} is already in use.`);
        console.log('💡 Trying to free the port...');
        
        // Try to find and kill the process using the port
        const isWindows = process.platform === 'win32';
        const command = isWindows 
          ? `netstat -ano | findstr :${PORT}`
          : `lsof -ti:${PORT}`;
        
        exec(command, (error, stdout) => {
          if (!error && stdout && stdout.trim()) {
            if (isWindows) {
              const lines = stdout.trim().split('\n');
              const pids = new Set();
              lines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length > 0) {
                  const pid = parts[parts.length - 1];
                  if (pid && !isNaN(pid)) {
                    pids.add(pid);
                  }
                }
              });
              pids.forEach(pid => {
                console.log(`   Killing process ${pid}...`);
                exec(`taskkill /PID ${pid} /F`, () => {});
              });
            } else {
              const pid = stdout.trim();
              console.log(`   Killing process ${pid}...`);
              exec(`kill -9 ${pid}`, () => {});
            }
            // Wait a bit then retry
            setTimeout(() => {
              console.log('🔄 Retrying to start server...');
              server = null;
              createServer();
            }, 2000);
          } else {
            console.error('❌ Could not find process using port', PORT);
            console.log('💡 Please manually stop the process using port', PORT);
            console.log('   On Windows: netstat -ano | findstr :3000');
            console.log('   Then: taskkill /PID <PID> /F');
            process.exit(1);
          }
        });
      } else {
        console.error('❌ Server error:', err);
        console.error('   Error code:', err.code);
        console.error('   Error message:', err.message);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown handlers
function gracefulShutdown(signal) {
  console.log(`\n📛 Received ${signal}. Closing server gracefully...`);
  
  if (server) {
    server.close(() => {
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Initialize database and start server (only for non-Vercel environments)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test' && process.env.SKIP_SERVER_START !== '1') {
  initDatabase()
    .then(() => {
      console.log('✅ Database initialization completed');
      dbInitialized = true;
      // Start server only after database is initialized
      startServer();
    })
    .catch((err) => {
      console.error('❌ Database initialization failed:', err);
      console.error('❌ Server will not start without database connection');
      process.exit(1);
    });
} else {
  console.log('Database initialization will run on the first Vercel API request');
}

// Export app for Vercel serverless functions
// Must be at the end of the file
export { app };
export default app;

