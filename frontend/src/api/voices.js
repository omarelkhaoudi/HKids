import axios from 'axios';
import { buildApiUrl } from '../config/api.js';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const multipartHeaders = () => ({
  ...authHeaders(),
  'Content-Type': 'multipart/form-data',
});

export const voicesAPI = {
  getProfiles: () => axios.get(buildApiUrl('/voices/profiles'), { headers: authHeaders() }),
  getAvailableVoices: () => axios.get(buildApiUrl('/voices/available'), { headers: authHeaders() }),
  createProfile: (formData) => axios.post(buildApiUrl('/voices/profiles'), formData, { headers: multipartHeaders() }),
  updateProfile: (id, formData) => axios.put(buildApiUrl(`/voices/profiles/${id}`), formData, { headers: multipartHeaders() }),
  deleteProfile: (id) => axios.delete(buildApiUrl(`/voices/profiles/${id}`), { headers: authHeaders() }),
  getPreviewUrl: (id) => buildApiUrl(`/voices/profiles/${id}/preview`),
  getPreviewBlob: (id) => axios.get(buildApiUrl(`/voices/profiles/${id}/preview`), {
    headers: authHeaders(),
    responseType: 'blob',
  }),
  getMessages: () => axios.get(buildApiUrl('/voices/messages'), { headers: authHeaders() }),
  createMessage: (formData) => axios.post(buildApiUrl('/voices/messages'), formData, { headers: multipartHeaders() }),
  getMessageAudioBlob: (id) => axios.get(buildApiUrl(`/voices/messages/${id}/audio`), {
    headers: authHeaders(),
    responseType: 'blob'
  }),
  deleteMessage: (id) => axios.delete(buildApiUrl(`/voices/messages/${id}`), { headers: authHeaders() }),
  generateNarration: ({ book_id, voice_profile_id }) => axios.post(
    buildApiUrl('/voices/narrations'),
    { book_id, voice_profile_id },
    { headers: authHeaders(), timeout: 30000 }
  ),
};
