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
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';
import { apiRateLimiter, authRateLimiter, resetRateLimit } from './middleware/rateLimiter.js';
import { sanitizeBody } from './middleware/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.port;

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
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

// Initialize database
initDatabase()
  .then(() => {
    console.log('✅ Database initialization completed');
  })
  .catch((err) => {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRouter);
app.use('/api/books', booksRouter);
app.use('/api/categories', categoriesRouter);

// Log available routes for debugging
console.log('📋 Available auth routes:');
console.log('   POST /api/auth/signup');
console.log('   POST /api/auth/login');

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

// Reset rate limit (development only)
if (config.nodeEnv === 'development') {
  app.post('/api/reset-rate-limit', (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    resetRateLimit(ip);
    res.json({ 
      success: true, 
      message: 'Rate limit reset for your IP',
      ip: ip
    });
  });
  console.log('   POST /api/reset-rate-limit (dev only)');
}

// 404 handler (must be before error handler)
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 HKids Backend running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🔒 CORS Origin: ${config.corsOrigin}`);
});

