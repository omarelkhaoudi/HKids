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

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 text-neutral-900">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-y-0 left-0 w-64 bg-white border-r border-neutral-200 z-40 hidden md:flex"
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
                  ? 'bg-neutral-900 text-white shadow-md'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <BookIcon className="w-5 h-5" />
              <span>Livres</span>
            </Link>
            <Link
              to="/admin/categories"
              className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all ${
                isActive('/admin/categories')
                  ? 'bg-neutral-900 text-white shadow-md'
                  : 'text-neutral-700 hover:bg-neutral-100'
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
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 text-sm"
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
        className="md:ml-64"
      >
        {/* Top bar for mobile */}
        <header className="md:hidden sticky top-0 z-30 bg-white/95 border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
          <Logo size="small" />
          <div className="flex items-center gap-3 text-xs text-neutral-600">
            <span className="hidden xs:inline-flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-100 border border-neutral-200">
              <UserIcon className="w-3 h-3" />
              {user.username}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-white flex items-center gap-1"
            >
              <LogOutIcon className="w-3 h-3" />
              <span>Quitter</span>
            </button>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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

