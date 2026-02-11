/**
 * Simple structured logging middleware
 * Logs all requests with relevant information
 */

/**
 * Request logger middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`📥 ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusEmoji = res.statusCode >= 400 ? '❌' : '✅';
    
    console.log(`${statusEmoji} ${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });

  next();
};

/**
 * Error logger
 */
export const errorLogger = (err, req, res, next) => {
  console.error('❌ Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  next(err);
};

/**
 * Simple log utility functions
 */
export const logger = {
  info: (message, data = {}) => {
    console.log('ℹ️ INFO:', message, data);
  },
  error: (message, error = {}) => {
    console.error('❌ ERROR:', message, error);
  },
  warn: (message, data = {}) => {
    console.warn('⚠️ WARN:', message, data);
  },
  success: (message, data = {}) => {
    console.log('✅ SUCCESS:', message, data);
  }
};

