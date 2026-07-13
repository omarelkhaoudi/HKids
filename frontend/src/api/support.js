import axios from 'axios';
import { buildApiUrl } from '../config/api.js';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const supportAPI = {
  createTicket: (data) => axios.post(buildApiUrl('/support/tickets'), data, { headers: authHeaders() }),
  getMyTickets: (params = {}) => axios.get(buildApiUrl('/support/tickets'), {
    headers: authHeaders(),
    params,
  }),
};
