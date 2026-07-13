import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import SignUp from './pages/SignUp';
import ParentLogin from './pages/ParentLogin';
import ParentSignUp from './pages/ParentSignUp';
import ParentKidsProfiles from './pages/ParentKidsProfiles';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ToastProvider } from './components/ToastProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { SkipToContent } from './components/SkipToContent';
import { OfflineStatusBanner } from './components/offline/OfflineStatusBanner';
import { OfflineSyncBridge } from './components/offline/OfflineSyncBridge';
import { KidScreenTimeTracker } from './components/kids/KidScreenTimeTracker';
import ScrollToTop from './components/ScrollToTop';
import { isNativeAndroid } from './services/mobile/capacitorRuntime';
import { storage } from './utils/storage';

const KidsHome = lazy(() => import('./pages/KidsHome'));
const KidsLibrary = lazy(() => import('./pages/KidsLibrary'));
const KidsCategoryPage = lazy(() => import('./pages/KidsCategoryPage'));
const BookReader = lazy(() => import('./pages/BookReader'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const FamilyVoices = lazy(() => import('./pages/FamilyVoices'));
const KidsStoryStudio = lazy(() => import('./pages/KidsStoryStudio'));
const KidsAIStories = lazy(() => import('./pages/KidsAIStories'));
const KidsLearning = lazy(() => import('./pages/KidsLearning'));
const KidsListen = lazy(() => import('./pages/KidsListen'));
const KidsAudioLibrary = lazy(() => import('./pages/KidsAudioLibrary'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const BookDetails = lazy(() => import('./pages/BookDetails'));
const Favorites = lazy(() => import('./pages/Favorites'));
const History = lazy(() => import('./pages/History'));
const StoriesGallery = lazy(() => import('./pages/StoriesGallery'));
const ContentLibraryHome = lazy(() => import('./pages/ContentLibraryHome'));
const ContentCategoryContents = lazy(() => import('./pages/ContentCategoryContents'));
const FeatureDetails = lazy(() => import('./pages/FeatureDetails'));
const DesignSystem = lazy(() => import('./pages/DesignSystem'));

const isProductionBuild = import.meta.env.PROD;

const DEFAULT_ANDROID_KIOSK_IDLE_MS = 10 * 60 * 1000;

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="inline-block rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent animate-spin" />
    </div>
  );
}

function LazyRoute({ children }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const hasToken = Boolean(localStorage.getItem('token'));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent animate-spin mb-4"></div>
          <p className="text-surface-600 font-semibold">{t('loading')}</p>
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
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent animate-spin mb-4"></div>
          <p className="text-surface-600 font-semibold">{t('loading')}</p>
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

function AndroidKioskIdleReset() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isNativeAndroid()) return undefined;

    const configuredValue = Number(import.meta.env.VITE_ANDROID_KIOSK_IDLE_MS);
    const idleMs = Number.isFinite(configuredValue)
      ? configuredValue
      : DEFAULT_ANDROID_KIOSK_IDLE_MS;

    if (idleMs <= 0) return undefined;

    let timeoutId;
    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        if (window.location.pathname !== '/kids') {
          navigate('/kids', { replace: true });
        }
      }, idleMs);
    };

    const events = ['pointerdown', 'touchstart', 'keydown', 'scroll', 'click'];
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, [location.pathname, navigate]);

  return null;
}

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const prefs = storage.getPreferences();
    setDarkMode(prefs.darkMode || false);

    const handleToggleDarkMode = (e) => {
        if (e.detail !== undefined) {
            setDarkMode(e.detail);
        } else {
            setDarkMode(prev => !prev);
        }
    };
    window.addEventListener('toggleDarkMode', handleToggleDarkMode);
    return () => window.removeEventListener('toggleDarkMode', handleToggleDarkMode);
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
              <SkipToContent />
              <AndroidKioskIdleReset />
              <Routes>
                <Route path="/" element={<Home darkMode={darkMode} setDarkMode={setDarkMode} />} />
                <Route path="/book/:id" element={<RequireAuth><LazyRoute><BookReader /></LazyRoute></RequireAuth>} />
                <Route path="/book-details/:id" element={<RequireAuth><LazyRoute><BookDetails /></LazyRoute></RequireAuth>} />
                <Route path="/favorites" element={<RequireAuth><LazyRoute><Favorites /></LazyRoute></RequireAuth>} />
                <Route path="/history" element={<RequireAuth><LazyRoute><History /></LazyRoute></RequireAuth>} />
                <Route path="/stories" element={<LazyRoute><StoriesGallery /></LazyRoute>} />
                <Route path="/content-library" element={<RequireAuth><LazyRoute><ContentLibraryHome /></LazyRoute></RequireAuth>} />
                <Route path="/content-library/:categoryId" element={<RequireAuth><LazyRoute><ContentCategoryContents /></LazyRoute></RequireAuth>} />
                <Route path="/abonnements" element={<LazyRoute><Subscriptions /></LazyRoute>} />
                <Route path="/features/:featureId" element={<LazyRoute><FeatureDetails /></LazyRoute>} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/signup" element={<SignUp />} />
                <Route path="/parent/login" element={<ParentLogin />} />
                <Route path="/parent/signup" element={<ParentSignUp />} />
                <Route path="/admin/*" element={<RequireRole roles={['admin']}><LazyRoute><AdminDashboard /></LazyRoute></RequireRole>} />
                <Route path="/parent/profiles" element={<RequireRole roles={['parent', 'admin']}><ParentKidsProfiles /></RequireRole>} />
                <Route path="/parent/voices" element={<RequireRole roles={['parent', 'admin']}><LazyRoute><FamilyVoices /></LazyRoute></RequireRole>} />
                <Route path="/parent/*" element={<RequireRole roles={['parent', 'admin']}><LazyRoute><ParentDashboard /></LazyRoute></RequireRole>} />
                <Route path="/kids" element={<RequireAuth><LazyRoute><KidsHome /></LazyRoute></RequireAuth>} />
                <Route path="/kids/library" element={<RequireAuth><LazyRoute><KidsLibrary /></LazyRoute></RequireAuth>} />
                <Route path="/kids/audio" element={<RequireAuth><LazyRoute><KidsAudioLibrary /></LazyRoute></RequireAuth>} />
                <Route path="/kids/listen/:id" element={<RequireAuth><LazyRoute><KidsListen /></LazyRoute></RequireAuth>} />
                <Route path="/kids/read/:id" element={<RequireAuth><LazyRoute><BookReader /></LazyRoute></RequireAuth>} />
                <Route path="/kids/learning" element={<RequireAuth><LazyRoute><KidsLearning /></LazyRoute></RequireAuth>} />
                <Route path="/kids/story-studio" element={<RequireAuth><LazyRoute><KidsStoryStudio /></LazyRoute></RequireAuth>} />
                <Route path="/kids/storystudio" element={<Navigate to="/kids/story-studio" replace />} />
                <Route path="/kids/ai-stories" element={<RequireAuth><LazyRoute><KidsAIStories /></LazyRoute></RequireAuth>} />
                <Route path="/kids/category/:categoryId" element={<RequireAuth><LazyRoute><KidsCategoryPage /></LazyRoute></RequireAuth>} />
                <Route path="/design-system" element={isProductionBuild ? <Navigate to="/" replace /> : <LazyRoute><DesignSystem /></LazyRoute>} />
                <Route path="/mockup" element={<Navigate to="/kids" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <ScrollToTop />
              <KidScreenTimeTracker />
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

