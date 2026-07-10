import express from 'express';
import { verifyToken } from './auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import {
  buildPrivacyExportFilename,
  createPrivacyExport,
  listPrivacyLogs,
  permanentlyDeleteKid,
  permanentlyDeleteParentAccount,
  recordPrivacyEvent,
  verifyParentPassword
} from '../services/privacy/privacyService.js';

const router = express.Router();
const sensitivePrivacyRateLimiter = rateLimiter(
  process.env.NODE_ENV === 'production' ? 10 : 100,
  15 * 60 * 1000
);

function requireParentOrAdmin(req, res, next) {
  if (!['parent', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Parent or admin account required' });
  }
  next();
}

function sendPrivacyError(res, error) {
  const status = error?.status || 500;
  if (status >= 500) console.error('Privacy API error:', error);
  return res.status(status).json({
    error: status >= 500 ? 'Privacy operation failed' : error.message,
    code: error?.code || 'PRIVACY_OPERATION_FAILED'
  });
}

router.post('/export', verifyToken, sensitivePrivacyRateLimiter, async (req, res) => {
  try {
    await verifyParentPassword(req.user.id, req.body?.password);
    const data = await createPrivacyExport(req.user.id);
    await recordPrivacyEvent({
      user: req.user,
      action: 'privacy_export_viewed',
      req
    });
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    return res.json({ data });
  } catch (error) {
    return sendPrivacyError(res, error);
  }
});

router.post('/export/download', verifyToken, sensitivePrivacyRateLimiter, async (req, res) => {
  try {
    await verifyParentPassword(req.user.id, req.body?.password);
    const data = await createPrivacyExport(req.user.id);
    await recordPrivacyEvent({
      user: req.user,
      action: 'privacy_export_downloaded',
      req
    });
    const filename = buildPrivacyExportFilename(req.user.id);
    const payload = JSON.stringify(data, null, 2);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    return res.send(payload);
  } catch (error) {
    return sendPrivacyError(res, error);
  }
});

router.get('/logs', verifyToken, sensitivePrivacyRateLimiter, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Parent account required', code: 'PARENT_ACCOUNT_REQUIRED' });
    }
    const result = await listPrivacyLogs({
      userId: req.user.id,
      limit: req.query.limit,
      offset: req.query.offset
    });
    res.setHeader('Cache-Control', 'no-store');
    return res.json(result);
  } catch (error) {
    return sendPrivacyError(res, error);
  }
});

router.post('/local-data-cleared', verifyToken, sensitivePrivacyRateLimiter, async (req, res) => {
  try {
    await recordPrivacyEvent({
      user: req.user,
      action: 'privacy_local_data_cleared',
      req,
      metadata: { scope: 'device' }
    });
    return res.json({ logged: true });
  } catch (error) {
    return sendPrivacyError(res, error);
  }
});

router.delete('/kids/:id', verifyToken, requireParentOrAdmin, sensitivePrivacyRateLimiter, async (req, res) => {
  try {
    const result = await permanentlyDeleteKid({
      actor: req.user,
      kidProfileId: req.params.id,
      req
    });
    return res.json({
      message: 'Kid profile and linked data deleted permanently',
      deletion: result,
      sync: {
        clear_local_keys: [
          'hkids_favorites',
          'hkids_history',
          'hkids_listening_history',
          'hkids_downloaded_content'
        ],
        clear_indexeddb_prefixes: ['book:', 'generated-story:', 'voice-message:']
      }
    });
  } catch (error) {
    return sendPrivacyError(res, error);
  }
});

router.delete('/account', verifyToken, sensitivePrivacyRateLimiter, async (req, res) => {
  if (req.user.role !== 'parent') {
    return res.status(403).json({
      error: 'Only parent accounts can self-delete here',
      code: 'PARENT_ACCOUNT_REQUIRED'
    });
  }

  try {
    const result = await permanentlyDeleteParentAccount({
      userId: req.user.id,
      password: req.body?.password,
      req
    });
    return res.json({
      message: 'Parent account and linked data deleted permanently',
      deletion: result,
      sync: {
        clear_local_storage: true,
        clear_indexeddb: true
      }
    });
  } catch (error) {
    return sendPrivacyError(res, error);
  }
});

export default router;
