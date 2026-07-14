import axios from 'axios';
import { buildApiUrl } from '../config/api.js';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const reportsAPI = {
  create: ({ targetType, targetId, reason, details }) => axios.post(
    buildApiUrl('/reports'),
    {
      target_type: targetType,
      target_id: targetId,
      reason,
      details,
    },
    { headers: authHeaders() }
  ),
};
