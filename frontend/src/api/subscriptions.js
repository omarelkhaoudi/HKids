import axios from 'axios';
import { buildApiUrl } from '../config/api.js';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const subscriptionsAPI = {
  getPlans: () => axios.get(buildApiUrl('/subscriptions/plans')),

  getCurrentSubscription: () => axios.get(buildApiUrl('/subscriptions/me'), {
    headers: authHeaders(),
  }),

  subscribe: (planCode) => axios.post(
    buildApiUrl('/subscriptions/subscribe'),
    { plan_code: planCode },
    { headers: authHeaders() }
  ),

  unlockBook: (bookId) => axios.post(
    buildApiUrl('/subscriptions/unlock-book'),
    { book_id: bookId },
    { headers: authHeaders() }
  ),
};
