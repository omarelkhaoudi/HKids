import axios from 'axios';
import { buildApiUrl } from '../config/api.js';

export const newsletterAPI = {
  subscribe: (email) => axios.post(buildApiUrl('/newsletter/subscribe'), { email }),
};
