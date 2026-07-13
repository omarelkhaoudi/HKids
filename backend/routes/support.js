import express from 'express';
import { verifyToken } from './auth.js';
import {
  createSupportTicket,
  listUserSupportTickets
} from '../services/support/supportTicketService.js';

const router = express.Router();

router.post('/tickets', verifyToken, async (req, res) => {
  try {
    const ticket = await createSupportTicket({
      user: req.user,
      subject: req.body.subject,
      message: req.body.message,
      category: req.body.category
    });
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(error?.status || 500).json({
      error: error?.status ? error.message : 'Support service unavailable',
      code: error?.code || 'SUPPORT_SERVICE_ERROR'
    });
  }
});

router.get('/tickets', verifyToken, async (req, res) => {
  try {
    if (!['parent', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Parent account required' });
    }
    const result = await listUserSupportTickets(req.user.id, {
      limit: req.query.limit,
      offset: req.query.offset
    });
    res.json(result);
  } catch (error) {
    console.error('Error listing support tickets:', error);
    res.status(error?.status || 500).json({
      error: error?.status ? error.message : 'Support service unavailable',
      code: error?.code || 'SUPPORT_SERVICE_ERROR'
    });
  }
});

export default router;
