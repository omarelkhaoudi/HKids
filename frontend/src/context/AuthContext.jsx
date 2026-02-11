import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token is still valid
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', { username, password }, {
        timeout: 10000 // 10 second timeout
      });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      // Better error handling
      let errorMessage = 'Échec de la connexion';
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.error || `Erreur ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Aucune réponse du serveur. Vérifiez que le serveur backend est démarré.';
      } else {
        // Error setting up request
        errorMessage = error.message || 'Erreur lors de la connexion';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const signup = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/signup', { username, password }, {
        timeout: 10000
      });
      
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Échec de l\'inscription';
      
      if (error.response) {
        errorMessage = error.response.data?.error || `Erreur ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Aucune réponse du serveur. Vérifiez que le serveur backend est démarré.';
      } else {
        errorMessage = error.message || 'Erreur lors de l\'inscription';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
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

