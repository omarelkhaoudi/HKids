import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api.js';
import { clearLocalPrivacyData } from '../services/privacy/privacyStorageService';
import { setUser as setSentryUser } from '../lib/sentry';
import { i18nT } from '../utils/i18n';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('privacy_purge_pending') === 'true') {
      void clearLocalPrivacyData({ includeAuthentication: true })
        .then(() => localStorage.removeItem('privacy_purge_pending'))
        .catch((error) => {
          console.warn('Pending local privacy purge is still blocked:', error);
        });
    }
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token is still valid
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }

    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          error.response?.status === 401 &&
          ['Invalid or expired token', 'No token provided'].includes(error.response?.data?.error)
        ) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          void clearLocalPrivacyData({
            includeAuthentication: true,
            preservePreferences: true
          }).catch((purgeError) => {
            console.warn('Could not fully clear local session data:', purgeError);
          });
        }
        return Promise.reject(error);
      }
    );

    if (token && navigator.onLine) {
      axios.get(buildApiUrl('/auth/me'))
        .then((response) => {
          const verifiedUser = response.data?.user;
          if (!verifiedUser) return;
          localStorage.setItem('user', JSON.stringify(verifiedUser));
          setUser(verifiedUser);
        })
        .catch(() => {
          // The interceptor clears invalid sessions. Network failures keep offline access.
        });
    }

    setLoading(false);

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(buildApiUrl('/auth/login'), { username, password }, {
        timeout: 10000 // 10 second timeout
      });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      setSentryUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      // Better error handling
      let errorMessage = i18nT('authErrorLoginFailed');
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.error || i18nT('authErrorHttpStatus', {
          status: error.response.status,
          statusText: error.response.statusText,
        });
      } else if (error.request) {
        // Request made but no response
        errorMessage = i18nT('authErrorServerNoResponse');
      } else {
        // Error setting up request
        errorMessage = error.message || i18nT('authErrorConnection');
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const signup = async (username, password, role = 'admin', adminSignupCode) => {
    try {
      const payload = {
        username,
        password,
        role,
      };
      const code = adminSignupCode || import.meta.env.VITE_ADMIN_SIGNUP_CODE;
      if (code) {
        payload.admin_signup_code = code;
      }

      const response = await axios.post(buildApiUrl('/auth/signup'), payload, {
        timeout: 10000
      });
      
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Signup error:', error);
      
      let errorMessage = i18nT('authErrorSignupFailed');
      
      if (error.response) {
        const { status, data, statusText } = error.response;
        errorMessage = data?.error || i18nT('authErrorHttpStatus', { status, statusText });
        if (status === 429 && data?.retryAfter) {
          const minutes = Math.max(1, Math.ceil(Number(data.retryAfter) / 60));
          errorMessage = i18nT('authErrorRateLimit', { minutes });
        } else if (status === 403 && errorMessage === 'Admin signup is not available') {
          errorMessage = i18nT('authErrorAdminSignupDisabled');
        } else if (status === 403 && errorMessage.includes('Code d\'inscription admin')) {
          errorMessage = i18nT('authErrorAdminCodeInvalid');
        }
      } else if (error.request) {
        errorMessage = i18nT('authErrorServerNoResponse');
      } else {
        errorMessage = error.message || i18nT('authErrorConnection');
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = ({ purgeLocalData = true } = {}) => {
    if (purgeLocalData) {
      void clearLocalPrivacyData({
        includeAuthentication: true,
        preservePreferences: true
      }).catch((error) => {
        console.warn('Could not fully clear local session data:', error);
      });
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setSentryUser(null);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

