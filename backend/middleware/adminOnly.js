import { getDatabase } from '../database/init.js';
import { logSecurityEvent } from '../services/security/auditLog.js';

export function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    res.once('finish', () => {
      if (res.statusCode < 200 || res.statusCode >= 400) return;
      try {
        const pool = getDatabase();
        logSecurityEvent(pool, {
          userId: req.user.id,
          actorRole: req.user.role,
          action: `admin_api_${req.method.toLowerCase()}`,
          resourceType: String(req.baseUrl || 'admin').split('/').filter(Boolean).pop(),
          resourceId: req.params?.id || null,
          req,
          metadata: {
            path: req.originalUrl?.split('?')[0],
            status_code: res.statusCode
          }
        });
      } catch (error) {
        console.warn('Admin mutation audit could not be scheduled:', error.message);
      }
    });
  }

  next();
}
