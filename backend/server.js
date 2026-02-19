// IMPORTANT: Charger les variables d'environnement EN PREMIER
import config from './config/env.js';

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database/init.js';
import booksRouter from './routes/books.js';
import authRouter from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import parentalRouter from './routes/parental.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';
import { apiRateLimiter, authRateLimiter, resetRateLimit } from './middleware/rateLimiter.js';
import { sanitizeBody } from './middleware/validator.js';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.port;

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Middleware CORS
// Normaliser l'origine CORS (enlever le slash final si présent)
const normalizeOrigin = (origin) => {
  if (!origin) return origin;
  return origin.endsWith('/') ? origin.slice(0, -1) : origin;
};

app.use(cors({
  origin: (origin, callback) => {
    // Si pas d'origine (requête same-origin), autoriser
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowedOrigin = normalizeOrigin(config.corsOrigin);
    const normalizedRequestOrigin = normalizeOrigin(origin);

    // En production, vérifier l'origine exacte
    if (config.nodeEnv === 'production') {
      if (normalizedRequestOrigin === allowedOrigin) {
        callback(null, true);
      } else {
        console.log(`⚠️  CORS: Origine rejetée. Reçue: ${normalizedRequestOrigin}, Attendue: ${allowedOrigin}`);
        callback(null, false);
      }
    } else {
      // En développement, accepter toutes les origines
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Sanitize input
app.use(sanitizeBody);

// Rate limiting
app.use('/api/auth', authRateLimiter);
app.use('/api', apiRateLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database initialization flag
let dbInitialized = false;

// Routes
app.use('/api/auth', authRouter);
app.use('/api/books', booksRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/parental', parentalRouter);

// Log available routes for debugging
console.log('📋 Available auth routes:');
console.log('   POST /api/auth/signup');
console.log('   POST /api/auth/login');

// Root route - API information
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'HKids API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv
  });
});

// Reset rate limit endpoint (available in all environments)
// This helps users who hit rate limits during testing
app.post('/api/reset-rate-limit', (req, res) => {
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
// On Vercel, this will be handled in the export section
if (!process.env.VERCEL) {
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
  // For Vercel: initialize DB in background (non-blocking)
  initDatabase()
    .then(() => {
      console.log('✅ Database initialized for Vercel');
      dbInitialized = true;
    })
    .catch((err) => console.error('⚠️  Database init warning:', err.message));
}

// Export app for Vercel serverless functions
// Must be at the end of the file
export default app;

