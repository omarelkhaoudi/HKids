import axios from 'axios';
import { buildApiUrl } from '../config/api.js';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const adminGet = (path, params) => axios.get(buildApiUrl(`/admin${path}`), {
  headers: authHeaders(),
  params,
});

const adminPatch = (path, data) => axios.patch(buildApiUrl(`/admin${path}`), data, {
  headers: authHeaders(),
});

const adminPut = (path, data) => axios.put(buildApiUrl(`/admin${path}`), data, {
  headers: authHeaders(),
});

export const adminAPI = {
  getOverview: () => adminGet('/overview'),
  getUsers: () => adminGet('/users'),
  getUserDetail: (id) => adminGet(`/users/${id}`),
  getStatistics: () => adminGet('/statistics'),
  getSubscriptions: () => adminGet('/subscriptions'),
  deleteUser: (id, reason) => axios.delete(buildApiUrl(`/admin/users/${id}`), {
    headers: authHeaders(),
    data: { reason },
  }),
  getModeration: (params = {}) => adminGet('/moderation', params),
  moderateContent: (type, id, data) => adminPatch(`/moderation/${type}/${id}`, data),
  getReports: (params = {}) => adminGet('/reports', params),
  updateReport: (id, data) => adminPatch(`/reports/${id}`, data),
  getAuditLogs: (params = {}) => adminGet('/audit-logs', params),
  search: (query, types = '') => adminGet('/search', { q: query, types }),
  getManagedSubscriptions: (params = {}) => adminGet('/managed-subscriptions', params),
  manageSubscription: (id, data) => adminPatch(`/managed-subscriptions/${id}`, data),
  getMyPermissions: () => adminGet('/permissions/me'),
  getPermissions: () => adminGet('/permissions'),
  setPermissions: (id, permissions) => adminPut(`/permissions/${id}`, { permissions }),
};
