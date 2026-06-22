import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import BookReader from './pages/BookReader';
import BookDetails from './pages/BookDetails';
import AdminLogin from './pages/AdminLogin';
import SignUp from './pages/SignUp';
import AdminDashboard from './pages/AdminDashboard';
import ParentDashboard from './pages/ParentDashboard';
import KidsLibrary from './pages/KidsLibrary';
import Favorites from './pages/Favorites';
import History from './pages/History';
import FeatureDetails from './pages/FeatureDetails';
import StoriesGallery from './pages/StoriesGallery';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './components/ToastProvider';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import { storage } from './utils/storage';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const hasToken = Boolean(localStorage.getItem('token'));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent animate-spin mb-4"></div>
          <p className="text-neutral-600 font-semibold">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user && !hasToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

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
                <Route path="/book/:id" element={<RequireAuth><BookReader /></RequireAuth>} />
                <Route path="/book-details/:id" element={<RequireAuth><BookDetails /></RequireAuth>} />
                <Route path="/favorites" element={<RequireAuth><Favorites /></RequireAuth>} />
                <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
                <Route path="/stories" element={<RequireAuth><StoriesGallery /></RequireAuth>} />
                <Route path="/features/:featureId" element={<FeatureDetails />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/signup" element={<SignUp />} />
                <Route path="/admin/*" element={<AdminDashboard />} />
                <Route path="/parent/*" element={<ParentDashboard />} />
                <Route path="/kids" element={<KidsLibrary />} />
              </Routes>
              <ScrollToTop />
            </div>
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;

