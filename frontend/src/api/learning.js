import axios from 'axios';
import { buildApiUrl } from '../config/api.js';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const learningAPI = {
  getCategories: () => axios.get(buildApiUrl('/learning/categories'), { headers: authHeaders() }),
  getRewards: () => axios.get(buildApiUrl('/learning/rewards'), { headers: authHeaders() }),
  getContents: (params = {}) => axios.get(buildApiUrl('/learning/contents'), {
    headers: authHeaders(),
    params,
  }),
  getContent: (id) => axios.get(buildApiUrl(`/learning/contents/${id}`), { headers: authHeaders() }),
  submitAttempt: (contentId, data) => axios.post(buildApiUrl(`/learning/contents/${contentId}/attempts`), data, { headers: authHeaders() }),
  getChallenges: (params = {}) => axios.get(buildApiUrl('/learning/challenges'), {
    headers: authHeaders(),
    params,
  }),
  getParentSummary: (kidId) => axios.get(buildApiUrl(`/learning/parent/kids/${kidId}/summary`), { headers: authHeaders() }),
  createContent: (data) => axios.post(buildApiUrl('/learning/admin/contents'), data, { headers: authHeaders() }),
  updateContent: (id, data) => axios.put(buildApiUrl(`/learning/admin/contents/${id}`), data, { headers: authHeaders() }),
  deleteContent: (id) => axios.delete(buildApiUrl(`/learning/admin/contents/${id}`), { headers: authHeaders() }),
  createChallenge: (data) => axios.post(buildApiUrl('/learning/admin/challenges'), data, { headers: authHeaders() }),
  createReward: (data) => axios.post(buildApiUrl('/learning/admin/rewards'), data, { headers: authHeaders() }),
  createCategory: (data) => axios.post(buildApiUrl('/learning/admin/categories'), data, { headers: authHeaders() }),
};
