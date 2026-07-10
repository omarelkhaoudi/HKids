import express from 'express';
import { verifyToken } from './auth.js';
import { createContentReport } from '../services/admin/adminService.js';

const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
  try {
    const result = await createContentReport({
      reporter: req.user,
      targetType: req.body.target_type,
      targetId: req.body.target_id,
      reason: req.body.reason,
      details: req.body.details
    });
    res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error) {
    console.error('Error creating content report:', error);
    res.status(error?.status || 500).json({
      error: error?.status ? error.message : 'Report service unavailable',
      code: error?.code || 'REPORT_SERVICE_ERROR'
    });
  }
});

export default router;
