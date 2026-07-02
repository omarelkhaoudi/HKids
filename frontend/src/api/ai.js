import axios from 'axios';
import { buildApiUrl } from '../config/api.js';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const aiAPI = {
  sendVoiceAssistantRequest: (transcript) => axios.post(
    buildApiUrl('/ai/voice-assistant'),
    { transcript },
    { headers: authHeaders() }
  ),
};
