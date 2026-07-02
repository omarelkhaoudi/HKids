import axios from 'axios';
import { buildApiUrl } from '../config/api.js';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const adminGet = (path) => axios.get(buildApiUrl(`/admin${path}`), {
  headers: authHeaders(),
});

export const adminAPI = {
  getOverview: () => adminGet('/overview'),
  getUsers: () => adminGet('/users'),
  getUserDetail: (id) => adminGet(`/users/${id}`),
  getStatistics: () => adminGet('/statistics'),
  getSubscriptions: () => adminGet('/subscriptions'),
};
