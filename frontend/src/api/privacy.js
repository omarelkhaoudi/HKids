import axios from 'axios';
import { buildApiUrl } from '../config/api.js';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const privacyAPI = {
  exportData(password) {
    return axios.post(
      buildApiUrl('/privacy/export'),
      { password },
      { headers: authHeaders() }
    );
  },

  downloadData(password) {
    return axios.post(
      buildApiUrl('/privacy/export/download'),
      { password },
      {
        headers: authHeaders(),
        responseType: 'blob'
      }
    );
  },

  getLogs({ limit = 50, offset = 0 } = {}) {
    return axios.get(buildApiUrl('/privacy/logs'), {
      headers: authHeaders(),
      params: { limit, offset }
    });
  },

  logLocalDataCleared() {
    return axios.post(
      buildApiUrl('/privacy/local-data-cleared'),
      {},
      { headers: authHeaders() }
    );
  },

  deleteKid(kidId) {
    return axios.delete(buildApiUrl(`/privacy/kids/${kidId}`), {
      headers: authHeaders()
    });
  },

  deleteAccount(password) {
    return axios.delete(buildApiUrl('/privacy/account'), {
      headers: authHeaders(),
      data: { password }
    });
  }
};
