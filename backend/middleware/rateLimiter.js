/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting the number of requests per IP
 */

// Simple in-memory store (use Redis in production)
const requestCounts = new Map();

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Rate limiter middleware
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 */
export const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Get or create request count for this IP
    let requests = requestCounts.get(ip);
    
    if (!requests) {
      requests = { count: 0, resetTime: now + windowMs };
      requestCounts.set(ip, requests);
    }
    
    // Reset if window expired
    if (now > requests.resetTime) {
      requests.count = 0;
      requests.resetTime = now + windowMs;
    }
    
    // Check if limit exceeded
    if (requests.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil((requests.resetTime - now) / 1000)
      });
    }
    
    // Increment count
    requests.count++;
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - requests.count);
    res.setHeader('X-RateLimit-Reset', new Date(requests.resetTime).toISOString());
    
    next();
  };
};

/**
 * Strict rate limiter for auth routes
 * More permissive in development mode
 */
export const authRateLimiter = rateLimiter(
  isDevelopment ? 200 : 5, // 200 requests in dev, 5 in production
  isDevelopment ? 1 * 60 * 1000 : 15 * 60 * 1000 // 1 minute in dev, 15 minutes in production
);

/**
 * Standard rate limiter for API routes
 */
export const apiRateLimiter = rateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes

/**
 * Helper function to reset rate limit for an IP (useful for development)
 */
export const resetRateLimit = (ip) => {
  requestCounts.delete(ip);
};

