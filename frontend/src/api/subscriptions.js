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

  getInvoices: (params = {}) => axios.get(buildApiUrl('/subscriptions/invoices'), {
    headers: authHeaders(),
    params,
  }),

  getHistory: (params = {}) => axios.get(buildApiUrl('/subscriptions/history'), {
    headers: authHeaders(),
    params,
  }),

  subscribe: (planCode) => axios.post(
    buildApiUrl('/subscriptions/subscribe'),
    { plan_code: planCode },
    { headers: authHeaders() }
  ),

  createCheckoutSession: (planCode) => axios.post(
    buildApiUrl('/subscriptions/create-checkout-session'),
    { plan_code: planCode },
    { headers: authHeaders() }
  ),

  confirmCheckout: (sessionId) => axios.post(
    buildApiUrl('/subscriptions/confirm-checkout'),
    { session_id: sessionId },
    { headers: authHeaders() }
  ),

  startTrial: () => axios.post(
    buildApiUrl('/subscriptions/start-trial'),
    {},
    { headers: authHeaders() }
  ),

  cancelSubscription: (atPeriodEnd = true) => axios.post(
    buildApiUrl('/subscriptions/cancel'),
    { at_period_end: atPeriodEnd },
    { headers: authHeaders() }
  ),

  resumeSubscription: () => axios.post(
    buildApiUrl('/subscriptions/resume'),
    {},
    { headers: authHeaders() }
  ),

  createBillingPortalSession: () => axios.post(
    buildApiUrl('/subscriptions/billing-portal'),
    {},
    { headers: authHeaders() }
  ),

  unlockBook: (bookId) => axios.post(
    buildApiUrl('/subscriptions/unlock-book'),
    { book_id: bookId },
    { headers: authHeaders() }
  ),
};
