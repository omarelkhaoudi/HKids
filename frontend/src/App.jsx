import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import BookReader from './pages/BookReader';
import BookDetails from './pages/BookDetails';
import AdminLogin from './pages/AdminLogin';
import SignUp from './pages/SignUp';
import ParentLogin from './pages/ParentLogin';
import ParentSignUp from './pages/ParentSignUp';
import AdminDashboard from './pages/AdminDashboard';
import ParentDashboard from './pages/ParentDashboard';
import ParentKidsProfiles from './pages/ParentKidsProfiles';
import FamilyVoices from './pages/FamilyVoices';
import KidsHome from './pages/KidsHome';
import KidsLibrary from './pages/KidsLibrary';
import KidsCategoryPage from './pages/KidsCategoryPage';
import KidsStoryStudio from './pages/KidsStoryStudio';
import KidsAIStories from './pages/KidsAIStories';
import KidsLearning from './pages/KidsLearning';
import ContentLibraryHome from './pages/ContentLibraryHome';
import ContentCategoryContents from './pages/ContentCategoryContents';
import Favorites from './pages/Favorites';
import History from './pages/History';
import FeatureDetails from './pages/FeatureDetails';
import StoriesGallery from './pages/StoriesGallery';
import Subscriptions from './pages/Subscriptions';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './components/ToastProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { OfflineStatusBanner } from './components/offline/OfflineStatusBanner';
import { OfflineSyncBridge } from './components/offline/OfflineSyncBridge';
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
    return <Navigate to="/parent/login" replace />;
  }

  return children;
}

function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();

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

  if (!user) {
    const loginPath = roles.includes('parent') ? '/parent/login' : '/admin/login';
    return <Navigate to={loginPath} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
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
                <Route path="/stories" element={<StoriesGallery />} />
                <Route path="/content-library" element={<RequireAuth><ContentLibraryHome /></RequireAuth>} />
                <Route path="/content-library/:categoryId" element={<RequireAuth><ContentCategoryContents /></RequireAuth>} />
                <Route path="/abonnements" element={<Subscriptions />} />
                <Route path="/features/:featureId" element={<FeatureDetails />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/signup" element={<SignUp />} />
                <Route path="/parent/login" element={<ParentLogin />} />
                <Route path="/parent/signup" element={<ParentSignUp />} />
                <Route path="/admin/*" element={<AdminDashboard />} />
                <Route path="/parent/profiles" element={<RequireRole roles={['parent', 'admin']}><ParentKidsProfiles /></RequireRole>} />
                <Route path="/parent/voices" element={<RequireRole roles={['parent', 'admin']}><FamilyVoices /></RequireRole>} />
                <Route path="/parent/*" element={<RequireRole roles={['parent', 'admin']}><ParentDashboard /></RequireRole>} />
                <Route path="/kids" element={<RequireAuth><KidsHome /></RequireAuth>} />
                <Route path="/kids/library" element={<RequireRole roles={['kid']}><KidsLibrary /></RequireRole>} />
                <Route path="/kids/learning" element={<RequireRole roles={['kid']}><KidsLearning /></RequireRole>} />
                <Route path="/kids/story-studio" element={<RequireAuth><KidsStoryStudio /></RequireAuth>} />
                <Route path="/kids/storystudio" element={<Navigate to="/kids/story-studio" replace />} />
                <Route path="/kids/ai-stories" element={<RequireAuth><KidsAIStories /></RequireAuth>} />
                <Route path="/kids/category/:categoryId" element={<RequireAuth><KidsCategoryPage /></RequireAuth>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <ScrollToTop />
              <OfflineSyncBridge />
              <OfflineStatusBanner />
            </div>
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;

