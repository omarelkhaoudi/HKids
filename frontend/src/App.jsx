import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import BookReader from './pages/BookReader';
import BookDetails from './pages/BookDetails';
import AdminLogin from './pages/AdminLogin';
import SignUp from './pages/SignUp';
import AdminDashboard from './pages/AdminDashboard';
import Favorites from './pages/Favorites';
import History from './pages/History';
import FeatureDetails from './pages/FeatureDetails';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './components/ToastProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { storage } from './utils/storage';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const prefs = storage.getPreferences();
    setDarkMode(prefs.darkMode || false);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storage.setPreference('darkMode', darkMode);
  }, [darkMode]);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <div className={darkMode ? 'dark' : ''}>
              <Routes>
                <Route path="/" element={<Home darkMode={darkMode} setDarkMode={setDarkMode} />} />
                <Route path="/book/:id" element={<BookReader />} />
                <Route path="/book-details/:id" element={<BookDetails />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/history" element={<History />} />
                <Route path="/features/:featureId" element={<FeatureDetails />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/signup" element={<SignUp />} />
                <Route path="/admin/*" element={<AdminDashboard />} />
              </Routes>
            </div>
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;

