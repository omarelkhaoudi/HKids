import axios from 'axios';
import { buildApiUrl } from '../config/api.js';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const offlineAPI = {
  getManifest: () => axios.get(buildApiUrl('/offline/manifest'), { headers: authHeaders() }),
  getCurrentCatalog: () => axios.get(buildApiUrl('/offline/catalog/current'), { headers: authHeaders() }),
  getCatalogVersions: (params = {}) => axios.get(buildApiUrl('/offline/catalog/versions'), {
    headers: authHeaders(),
    params,
  }),
  getChangelog: (since) => axios.get(buildApiUrl('/offline/catalog/changelog'), {
    headers: authHeaders(),
    params: since ? { since } : {},
  }),
};
