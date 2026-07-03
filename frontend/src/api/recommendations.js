import axios from 'axios';
import { buildApiUrl } from '../config/api.js';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const recommendationsAPI = {
  getForKid: (context = {}) => axios.post(
    buildApiUrl('/recommendations'),
    context,
    {
      headers: authHeaders(),
      timeout: 12000,
    }
  ),
};
