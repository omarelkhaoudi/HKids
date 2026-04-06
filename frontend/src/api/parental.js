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
  }
};

