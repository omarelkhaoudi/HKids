import axios from 'axios';
import { buildApiUrl } from '../config/api.js';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const aiAPI = {
  transcribeVoice: ({ audioBlob, language = 'fr-FR' }) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, `voice-${Date.now()}.webm`);
    formData.append('language', language);

    return axios.post(
      buildApiUrl('/ai/transcribe'),
      formData,
      {
        headers: {
          ...authHeaders(),
          'Content-Type': 'multipart/form-data'
        },
        timeout: 25000
      }
    );
  },

  sendVoiceAssistantRequest: (transcript) => axios.post(
    buildApiUrl('/ai/voice-assistant'),
    { transcript },
    { headers: authHeaders() }
  ),
};
