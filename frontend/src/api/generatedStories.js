import axios from 'axios';
import { buildApiUrl } from '../config/api.js';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const generatedStoriesAPI = {
  getKidProfiles: () => axios.get(
    buildApiUrl('/generated-stories/kid-profiles'),
    { headers: authHeaders(), timeout: 12000 }
  ),

  generate: (data) => axios.post(
    buildApiUrl('/generated-stories/generate'),
    data,
    { headers: authHeaders(), timeout: 25000 }
  ),

  getHistory: (params = {}) => axios.get(
    buildApiUrl('/generated-stories'),
    { headers: authHeaders(), params, timeout: 12000 }
  ),

  save: (id) => axios.post(
    buildApiUrl(`/generated-stories/${id}/save`),
    {},
    { headers: authHeaders(), timeout: 12000 }
  )
};
