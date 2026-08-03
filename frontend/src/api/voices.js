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
  getProfiles: () => axios.get(buildApiUrl('/voices/profiles'), { headers: authHeaders(), timeout: 12000 }),
  getAvailableVoices: () => axios.get(buildApiUrl('/voices/available'), { headers: authHeaders(), timeout: 12000 }),
  createProfile: (formData) => axios.post(buildApiUrl('/voices/profiles'), formData, { headers: multipartHeaders(), timeout: 90000 }),
  updateProfile: (id, formData) => axios.put(buildApiUrl(`/voices/profiles/${id}`), formData, { headers: multipartHeaders(), timeout: 90000 }),
  revokeConsent: (id) => axios.post(buildApiUrl(`/voices/profiles/${id}/revoke-consent`), {}, { headers: authHeaders(), timeout: 12000 }),
  deleteProfile: (id) => axios.delete(buildApiUrl(`/voices/profiles/${id}`), { headers: authHeaders(), timeout: 12000 }),
  getPreviewUrl: (id) => buildApiUrl(`/voices/profiles/${id}/preview`),
  getPreviewBlob: (id) => axios.get(buildApiUrl(`/voices/profiles/${id}/preview`), {
    headers: authHeaders(),
    responseType: 'blob',
    timeout: 20000,
  }),
  getMessages: () => axios.get(buildApiUrl('/voices/messages'), { headers: authHeaders(), timeout: 12000 }),
  getAvailableMessages: () => axios.get(buildApiUrl('/voices/messages/available'), { headers: authHeaders(), timeout: 12000 }),
  createMessage: (formData) => axios.post(buildApiUrl('/voices/messages'), formData, { headers: multipartHeaders(), timeout: 60000 }),
  getMessageAudioBlob: (id) => axios.get(buildApiUrl(`/voices/messages/${id}/audio`), {
    headers: authHeaders(),
    responseType: 'blob',
    timeout: 20000
  }),
  deleteMessage: (id) => axios.delete(buildApiUrl(`/voices/messages/${id}`), { headers: authHeaders(), timeout: 12000 }),
  generateNarration: ({ book_id, voice_profile_id }) => axios.post(
    buildApiUrl('/voices/narrations'),
    { book_id, voice_profile_id },
    { headers: authHeaders(), timeout: 45000 }
  ),
  getAudioBlob: (audioUrl) => axios.get(buildApiUrl(audioUrl), {
    headers: authHeaders(),
    responseType: 'blob',
    timeout: 30000,
  }),
  streamNarration: ({ book_id, voice_profile_id, signal }) => fetch(
    buildApiUrl('/voices/narrations/stream'),
    {
      method: 'POST',
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ book_id, voice_profile_id }),
      signal,
    }
  ),
};
