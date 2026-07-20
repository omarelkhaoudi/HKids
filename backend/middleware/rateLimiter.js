/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting the number of requests per IP
 */

import config from '../config/env.js';

// Simple in-memory store (use Redis in production)
const requestCounts = new Map();

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Resolve the real client IP (Vercel / reverse proxies often hide req.ip).
 * @param {import('express').Request} req
 */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const clientIp = forwarded.split(',')[0]?.trim();
    if (clientIp) return clientIp;
  }

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * Rate limiter middleware
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @param {{ keyPrefix?: string }} [options]
 */
export const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000, options = {}) => {
  const { keyPrefix = '' } = options;

  return (req, res, next) => {
    const ip = getClientIp(req);
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    let requests = requestCounts.get(key);

    if (!requests) {
      requests = { count: 0, resetTime: now + windowMs };
      requestCounts.set(key, requests);
    }

    if (now > requests.resetTime) {
      requests.count = 0;
      requests.resetTime = now + windowMs;
    }

    if (requests.count >= maxRequests) {
      const retryAfter = Math.ceil((requests.resetTime - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later',
        retryAfter,
      });
    }

    requests.count++;

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requests.count));
    res.setHeader('X-RateLimit-Reset', new Date(requests.resetTime).toISOString());

    next();
  };
};

const authLimitMax = isDevelopment
  ? 200
  : parseInt(process.env.AUTH_RATE_LIMIT_MAX || '60', 10);

const authLimitWindow = isDevelopment
  ? 1 * 60 * 1000
  : parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || String(15 * 60 * 1000), 10);

/** Auth routes — login, me, etc. */
export const authRateLimiter = rateLimiter(authLimitMax, authLimitWindow, { keyPrefix: 'auth' });

/** Signup only — separate bucket so retries do not block login for everyone */
export const signupRateLimiter = rateLimiter(
  isDevelopment ? 30 : parseInt(process.env.SIGNUP_RATE_LIMIT_MAX || '10', 10),
  isDevelopment ? 5 * 60 * 1000 : parseInt(process.env.SIGNUP_RATE_LIMIT_WINDOW || String(60 * 60 * 1000), 10),
  { keyPrefix: 'signup' },
);

/** Standard rate limiter for non-auth API routes */
export const apiRateLimiter = rateLimiter(
  config.rateLimitMax,
  config.rateLimitWindow,
  { keyPrefix: 'api' },
);

/** Skip global API limiter for routes already covered by auth limiters */
export function skipAuthPathsRateLimiter(req, res, next) {
  if (req.path.startsWith('/auth')) {
    return next();
  }
  return apiRateLimiter(req, res, next);
}

/**
 * Reset rate limit counters for an IP (development helper)
 * @param {string} ip
 */
export const resetRateLimit = (ip) => {
  for (const key of requestCounts.keys()) {
    if (key.endsWith(`:${ip}`)) {
      requestCounts.delete(key);
    }
  }
};
