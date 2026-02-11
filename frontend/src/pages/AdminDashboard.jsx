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
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-y-0 left-0 w-64 bg-white border-r border-neutral-200 z-40"
      >
        <div className="p-6 h-full flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-2">
              <Logo size="default" showText={true} className="pointer-events-none" />
            </div>
            <p className="text-sm text-neutral-600 mb-8">Tableau de bord administrateur</p>
          </motion.div>

          <nav className="space-y-2 flex-1">
            <Link
              to="/admin"
              end
              className={`block px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-3 ${
                isActive('/admin')
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <BookIcon className="w-5 h-5" />
              <span>Livres</span>
            </Link>
            <Link
              to="/admin/categories"
              className={`block px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-3 ${
                isActive('/admin/categories')
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <TagIcon className="w-5 h-5" />
              <span>Catégories</span>
            </Link>
          </nav>

          <div className="border-t border-neutral-200 pt-6">
            <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
              <p className="text-xs text-neutral-500 mb-1">Connecté en tant que</p>
              <p className="font-medium text-neutral-900 flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                {user.username}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
            >
              <LogOutIcon className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="ml-64"
      >
        <Routes>
          <Route index element={<BookManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
        </Routes>
      </motion.div>
    </div>
  );
}

export default AdminDashboard;

