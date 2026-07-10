import axios from 'axios';
import { buildApiUrl } from '../config/api.js';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const parentalAPI = {
  // Kids profiles
  getKids: () => {
    return axios.get(buildApiUrl('/parental/kids'), { headers: getAuthHeaders() });
  },

  createKid: (data) => {
    return axios.post(buildApiUrl('/parental/kids'), data, { headers: getAuthHeaders() });
  },

  updateKid: (id, data) => {
    return axios.put(buildApiUrl(`/parental/kids/${id}`), data, { headers: getAuthHeaders() });
  },

  deleteKid: (id) => {
    return axios.delete(buildApiUrl(`/parental/kids/${id}`), { headers: getAuthHeaders() });
  },

  // Approvals
  getApprovals: (kidId) => {
    return axios.get(buildApiUrl(`/parental/kids/${kidId}/approvals`), { headers: getAuthHeaders() });
  },

  updateApproval: (kidId, categoryId, approved) => {
    return axios.post(buildApiUrl(`/parental/kids/${kidId}/approvals`), {
      category_id: categoryId,
      approved: approved
    }, { headers: getAuthHeaders() });
  },

  bulkUpdateApprovals: (kidId, approvals) => {
    return axios.put(buildApiUrl(`/parental/kids/${kidId}/approvals/bulk`), {
      approvals: approvals
    }, { headers: getAuthHeaders() });
  },

  // Create kid account
  createKidAccount: (kidId, username, password) => {
    return axios.post(buildApiUrl(`/parental/kids/${kidId}/create-account`), {
      username,
      password
    }, { headers: getAuthHeaders() });
  },

  // Get approved books for a kid
  getApprovedBooks: (kidId) => {
    return axios.get(buildApiUrl(`/parental/kids/${kidId}/books`), { headers: getAuthHeaders() });
  },

  recordReadingProgress: (data) => {
    return axios.post(buildApiUrl('/parental/reading-progress'), data, { headers: getAuthHeaders() });
  },

  getConnectedKidOverview: () => {
    return axios.get(buildApiUrl('/parental/me/overview'), { headers: getAuthHeaders() });
  },

  getConnectedKidAccessPolicy: () => {
    return axios.get(buildApiUrl('/parental/me/access-policy'), { headers: getAuthHeaders() });
  },

  getKidActivity: (kidId) => {
    return axios.get(buildApiUrl(`/parental/kids/${kidId}/activity`), { headers: getAuthHeaders() });
  },

  getKidDashboard: (kidId, {
    days = 7,
    favoritesLimit = 20,
    favoritesOffset = 0,
    historyLimit = 50,
    historyOffset = 0,
    timelineLimit = 50,
    timelineOffset = 0
  } = {}) => {
    return axios.get(buildApiUrl(`/parental/kids/${kidId}/dashboard`), {
      headers: getAuthHeaders(),
      params: {
        days,
        favorites_limit: favoritesLimit,
        favorites_offset: favoritesOffset,
        history_limit: historyLimit,
        history_offset: historyOffset,
        timeline_limit: timelineLimit,
        timeline_offset: timelineOffset
      }
    });
  },

  recordScreenTime: (data) => {
    return axios.post(buildApiUrl('/parental/me/screen-time'), data, { headers: getAuthHeaders() });
  },

  setKidFavorite: (data) => {
    return axios.post(buildApiUrl('/parental/me/favorites'), data, { headers: getAuthHeaders() });
  },

  recordKidHistory: (data) => {
    return axios.post(buildApiUrl('/parental/me/history'), data, { headers: getAuthHeaders() });
  },

  importKidActivity: (data) => {
    return axios.post(buildApiUrl('/parental/me/activity-import'), data, { headers: getAuthHeaders() });
  },

  pullCloudSync: (syncToken = null) => {
    return axios.get(buildApiUrl('/parental/me/cloud-sync'), {
      headers: getAuthHeaders(),
      params: syncToken ? { sync_token: syncToken } : undefined
    });
  },

  pushCloudSync: (data) => {
    return axios.post(buildApiUrl('/parental/me/cloud-sync'), data, { headers: getAuthHeaders() });
  },

  saveReadingGoal: (kidId, data) => {
    return axios.put(buildApiUrl(`/parental/kids/${kidId}/reading-goal`), data, { headers: getAuthHeaders() });
  },

  clearReadingGoal: (kidId) => {
    return axios.delete(buildApiUrl(`/parental/kids/${kidId}/reading-goal`), { headers: getAuthHeaders() });
  },

  getRules: (kidId) => {
    return axios.get(buildApiUrl(`/parental/kids/${kidId}/rules`), { headers: getAuthHeaders() });
  },

  saveRules: (kidId, data) => {
    return axios.put(buildApiUrl(`/parental/kids/${kidId}/rules`), data, { headers: getAuthHeaders() });
  }
};

