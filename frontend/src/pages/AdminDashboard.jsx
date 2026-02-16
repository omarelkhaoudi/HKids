import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import BookManagement from '../components/admin/BookManagement';
import CategoryManagement from '../components/admin/CategoryManagement';
import { BookIcon, TagIcon, UserIcon, LogOutIcon } from '../components/Icons';
import { Logo } from '../components/Logo';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (path) => location.pathname === path;

  // Composant pour les étoiles animées
  const StarParticles = ({ count = 15 }) => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-yellow-400"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50/30 to-pink-50/30 text-neutral-900 relative overflow-hidden">
      {/* Étoiles animées en arrière-plan */}
      <StarParticles count={15} />
      
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-y-0 left-0 w-64 bg-white/90 backdrop-blur-lg border-r border-red-200/50 z-40 hidden md:flex shadow-xl"
      >
        <div className="p-6 h-full flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="mb-3">
              <Logo size="default" showText={true} className="pointer-events-none" />
            </div>
            <p className="text-xs text-neutral-500 mb-6 uppercase tracking-wide">
              Tableau de bord administrateur
            </p>
          </motion.div>

          <nav className="space-y-1.5 flex-1 text-sm">
            <Link
              to="/admin"
              end
              className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all ${
                isActive('/admin')
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                  : 'text-neutral-700 hover:bg-red-50/50 hover:border-red-200 border border-transparent'
              }`}
            >
              <BookIcon className="w-5 h-5" />
              <span>Livres</span>
            </Link>
            <Link
              to="/admin/categories"
              className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all ${
                isActive('/admin/categories')
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                  : 'text-neutral-700 hover:bg-red-50/50 hover:border-red-200 border border-transparent'
              }`}
            >
              <TagIcon className="w-5 h-5" />
              <span>Catégories</span>
            </Link>
          </nav>

          <div className="border-t border-neutral-200 pt-5 mt-4 text-xs">
            <div className="mb-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <p className="text-neutral-500 mb-1">Connecté en tant que</p>
              <p className="font-medium text-neutral-900 flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                {user.username}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium hover:from-red-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl"
            >
              <LogOutIcon className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25 }}
        className="md:ml-64 relative z-10"
      >
        {/* Top bar for mobile */}
        <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-red-200/50 px-4 py-3 flex items-center justify-between shadow-sm">
          <Logo size="small" />
          <div className="flex items-center gap-3 text-xs text-neutral-600">
            <span className="hidden xs:inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 border border-red-200">
              <UserIcon className="w-3 h-3 text-red-600" />
              {user.username}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-xs font-medium text-white flex items-center gap-1 transition-all shadow-sm"
            >
              <LogOutIcon className="w-3 h-3" />
              <span>Quitter</span>
            </button>
          </div>
        </header>

        <div className="relative z-10">
          <Routes>
            <Route index element={<BookManagement />} />
            <Route path="categories" element={<CategoryManagement />} />
          </Routes>
        </div>
      </motion.main>
    </div>
  );
}

export default AdminDashboard;

