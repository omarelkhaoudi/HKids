import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import BookManagement from '../components/admin/BookManagement';
import CategoryManagement from '../components/admin/CategoryManagement';
import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminStatistics from '../components/admin/AdminStatistics';
import AdminSubscriptions from '../components/admin/AdminSubscriptions';
import LearningManagement from '../components/admin/LearningManagement';
import { 
  BookIcon, TagIcon, UserIcon, LogOutIcon, HomeIcon, HistoryIcon, 
  CheckIcon, BrainIcon, SearchIcon, BellIcon, ChevronLeftIcon, PlusIcon,
  XIcon
} from '../components/Icons';
import { Avatar } from '../components/ui';

// QUICK ACTIONS FAB COMPONENT
const QuickActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-xl border border-surface-200 p-2 w-64 mb-2 origin-bottom-right"
          >
            <div className="p-2 text-xs font-bold text-surface-400 uppercase tracking-wider">Actions Rapides</div>
            <Link to="/admin/contents" onClick={() => setIsOpen(false)} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-surface-50 text-surface-700 font-medium transition-colors">
              <div className="bg-primary-50 p-2 rounded-lg text-primary-600"><BookIcon className="w-4 h-4"/></div> Créer une histoire
            </Link>
            <Link to="/admin/categories" onClick={() => setIsOpen(false)} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-surface-50 text-surface-700 font-medium transition-colors">
              <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><TagIcon className="w-4 h-4"/></div> Ajouter une catégorie
            </Link>
            <Link to="/admin/subscriptions" onClick={() => setIsOpen(false)} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-surface-50 text-surface-700 font-medium transition-colors">
              <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><CheckIcon className="w-4 h-4"/></div> Gérer les abonnements
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-surface-900 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }}><PlusIcon className="w-6 h-6" /></motion.div>
      </button>
    </div>
  );
};

// COMMAND PALETTE COMPONENT
const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        isOpen ? onClose() : null; // Toggle logic handled by parent usually, but we keep it simple here
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-32 px-4">
      <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-surface-200"
      >
        <div className="flex items-center p-4 border-b border-surface-100 gap-3">
          <SearchIcon className="w-6 h-6 text-surface-400" />
          <input 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher des histoires, utilisateurs, abonnements..."
            className="flex-1 bg-transparent border-none outline-none text-lg text-surface-900 placeholder-surface-400"
          />
          <div className="flex items-center gap-1 text-xs font-bold text-surface-400 bg-surface-100 px-2 py-1 rounded">ESC</div>
        </div>
        <div className="p-2 max-h-96 overflow-y-auto">
          {query ? (
            <div className="p-8 text-center text-surface-500 font-medium">Recherche de "{query}"... (UI Only)</div>
          ) : (
            <>
              <div className="p-2 text-xs font-bold text-surface-400 uppercase tracking-wider">Raccourcis</div>
              <Link to="/admin/contents" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 text-surface-700 transition-colors">
                <BookIcon className="w-5 h-5 text-surface-400" /> Aller à la gestion des histoires
              </Link>
              <Link to="/admin/users" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 text-surface-700 transition-colors">
                <UserIcon className="w-5 h-5 text-surface-400" /> Aller à la gestion des utilisateurs
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (path) => location.pathname === path;
  const navItems = [
    { to: '/admin', label: "Vue d'ensemble", icon: HomeIcon, end: true },
    { to: '/admin/contents', label: 'Histoires CMS', icon: BookIcon },
    { to: '/admin/categories', label: 'Catégories', icon: TagIcon },
    { to: '/admin/users', label: 'Utilisateurs', icon: UserIcon },
    { to: '/admin/subscriptions', label: 'Abonnements', icon: CheckIcon },
    { to: '/admin/learning', label: 'Quiz & Jeux', icon: BrainIcon },
    { to: '/admin/statistics', label: 'Analytique', icon: HistoryIcon },
  ];

  // Listener for CMD+K to open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] text-surface-900 flex overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 72 }}
        className="bg-white border-r border-surface-200 z-40 hidden md:flex flex-col h-screen shrink-0 transition-all duration-300"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-surface-100">
          {isSidebarOpen && <span className="font-black text-xl tracking-tight">HKids <span className="text-primary-500">Admin</span></span>}
          {!isSidebarOpen && <span className="font-black text-xl tracking-tight mx-auto text-primary-500">H</span>}
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1 mt-2">
          <div className={`text-xs font-bold text-surface-400 uppercase tracking-wider mb-2 px-2 ${!isSidebarOpen && 'text-center'}`}>
            {isSidebarOpen ? 'Général' : 'Gén'}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.end ? isActive(item.to) : location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                  active
                    ? 'bg-surface-900 text-white shadow-md'
                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                }`}
                title={!isSidebarOpen ? item.label : ''}
              >
                <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-surface-400 group-hover:text-surface-600'}`} />
                {isSidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-surface-100">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="w-full p-2 flex items-center justify-center text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-xl transition-colors mb-2"
          >
            <ChevronLeftIcon className={`w-5 h-5 transition-transform ${!isSidebarOpen ? 'rotate-180' : ''}`} />
          </button>
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-surface-50 border border-surface-200 ${!isSidebarOpen && 'justify-center'}`}>
            <Avatar fallback={user.username.charAt(0).toUpperCase()} className="w-8 h-8 bg-gradient-to-br from-primary-400 to-violet-500 text-white font-bold shrink-0" />
            {isSidebarOpen && (
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-bold text-surface-900 truncate">{user.username}</p>
                <p className="text-xs text-surface-500 truncate">{user.email || 'admin@hkids.com'}</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* TOP BAR */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-surface-200 flex items-center justify-between px-6 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-surface-500 font-medium">
              <span>Admin</span>
              <span>/</span>
              <span className="text-surface-900 font-bold capitalize">
                {location.pathname.split('/')[2] || "Vue d'ensemble"}
              </span>
            </div>
            {/* Mobile branding */}
            <div className="md:hidden font-black text-lg">HKids Admin</div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex items-center gap-2 bg-surface-100 hover:bg-surface-200 text-surface-500 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium border border-surface-200 w-64"
            >
              <SearchIcon className="w-4 h-4" />
              <span>Rechercher...</span>
              <div className="ml-auto flex gap-1">
                <kbd className="bg-white px-1.5 rounded text-xs font-sans shadow-sm">⌘</kbd>
                <kbd className="bg-white px-1.5 rounded text-xs font-sans shadow-sm">K</kbd>
              </div>
            </button>
            <button className="md:hidden p-2 text-surface-500 hover:bg-surface-100 rounded-full" onClick={() => setIsSearchOpen(true)}>
              <SearchIcon className="w-5 h-5" />
            </button>

            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-surface-500 hover:bg-surface-100 rounded-full relative transition-colors"
              >
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>
              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-surface-200 overflow-hidden z-50 origin-top-right"
                  >
                    <div className="p-4 border-b border-surface-100 flex justify-between items-center bg-surface-50">
                      <h3 className="font-bold text-surface-900">Notifications</h3>
                      <button className="text-xs text-primary-600 font-bold hover:underline">Tout marquer lu</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="p-4 border-b border-surface-100 hover:bg-surface-50 cursor-pointer">
                        <p className="text-sm font-bold text-surface-900">Nouvel abonnement 🎉</p>
                        <p className="text-xs text-surface-500 mt-1">Un parent vient de souscrire à la Formule Lecture.</p>
                        <p className="text-xs text-surface-400 mt-2">Il y a 2 min</p>
                      </div>
                      <div className="p-4 border-b border-surface-100 hover:bg-surface-50 cursor-pointer">
                        <p className="text-sm font-bold text-surface-900">Alerte Système</p>
                        <p className="text-xs text-surface-500 mt-1">Mise à jour des modèles vocaux terminée avec succès.</p>
                        <p className="text-xs text-surface-400 mt-2">Il y a 1h</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 text-surface-500 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-colors"
              title="Déconnexion"
            >
              <LogOutIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* MAIN SCROLLABLE AREA */}
        <main className="flex-1 overflow-y-auto bg-[#fafafa]">
          <div className="p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
            <Routes>
              <Route index element={<AdminOverview />} />
              <Route path="contents" element={<BookManagement />} />
              <Route path="categories" element={<CategoryManagement />} />
              <Route path="learning" element={<LearningManagement />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="subscriptions" element={<AdminSubscriptions />} />
              <Route path="statistics" element={<AdminStatistics />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </div>
        </main>
        
        <QuickActions />
        <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </div>
    </div>
  );
}

export default AdminDashboard;
