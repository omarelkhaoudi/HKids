import React, {useState, useEffect} from 'react';
import {createPortal} from 'react-dom';
import {Routes, Route, Navigate, Link, useNavigate, useLocation} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {useAuth} from '../context/AuthContext';
import BookManagement from '../components/admin/BookManagement';
import CategoryManagement from '../components/admin/CategoryManagement';
import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminStatistics from '../components/admin/AdminStatistics';
import AdminSubscriptions from '../components/admin/AdminSubscriptions';
import LearningManagement from '../components/admin/LearningManagement';
import AdminModeration from '../components/admin/AdminModeration';
import AdminReports from '../components/admin/AdminReports';
import AdminAuditLog from '../components/admin/AdminAuditLog';
import AdminPermissions from '../components/admin/AdminPermissions';
import {adminAPI} from '../api/admin';
import {
 BookIcon, TagIcon, UserIcon, LogOutIcon, HomeIcon, HistoryIcon, 
 CheckIcon, BrainIcon, SearchIcon, BellIcon, ChevronLeftIcon, PlusIcon,
 XIcon, ShieldIcon, WarningIcon
} from '../components/Icons';
import {Avatar} from '../components/ui';

// QUICK ACTIONS FAB COMPONENT
const QuickActions = () => {
 const [isOpen, setIsOpen] = useState(false);
 const buttonRef = React.useRef(null);
 const [menuStyle, setMenuStyle] = useState({});

 useEffect(() => {
 if (isOpen && buttonRef.current) {
 const rect = buttonRef.current.getBoundingClientRect();
 const margin = 16;
 const menuWidth = 256; // w-64
 const menuHeight = 200; // approximate
 
 let top = rect.top - menuHeight - 16;
 let left = rect.right - menuWidth;
 
 // Prevent top clipping
 if (top < margin) {
 top = rect.bottom + 16;
}
 
 // Prevent left clipping
 if (left < margin) {
 left = margin;
}
 
 // Prevent right clipping
 if (left + menuWidth > window.innerWidth - margin) {
 left = window.innerWidth - menuWidth - margin;
}
 
 // Prevent bottom clipping
 if (top + menuHeight > window.innerHeight - margin) {
 top = window.innerHeight - menuHeight - margin;
}

 setMenuStyle({
 position: 'fixed',
 top: `${top}px`,
 left: `${left}px`,
 width: `${menuWidth}px`,
 zIndex: 9999
});
}
}, [isOpen]);
 
 const content = (
 <AnimatePresence>
 {isOpen && (
 <motion.div
 initial={{opacity: 0, scale: 0.9, y: 10}}
 animate={{opacity: 1, scale: 1, y: 0}}
 exit={{opacity: 0, scale: 0.9, y: 10}}
 style={menuStyle}
 className="bg-card rounded-2xl shadow-2xl border border-border p-2 origin-bottom-right"
 >
 <div className="p-2 text-xs font-bold text-surface-400 uppercase tracking-wider">Actions Rapides</div>
 <Link to="/admin/contents" onClick={() => setIsOpen(false)} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-surface-secondary text-foreground-secondary font-medium transition-colors whitespace-nowrap">
 <div className="bg-primary-50 p-2 rounded-lg text-foreground-600 shrink-0"><BookIcon className="w-4 h-4"/></div> Créer une histoire
 </Link>
 <Link to="/admin/categories" onClick={() => setIsOpen(false)} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-surface-secondary text-foreground-secondary font-medium transition-colors whitespace-nowrap">
 <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600 shrink-0"><TagIcon className="w-4 h-4"/></div> Ajouter une catégorie
 </Link>
 <Link to="/admin/subscriptions" onClick={() => setIsOpen(false)} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-surface-secondary text-foreground-secondary font-medium transition-colors whitespace-nowrap">
 <div className="bg-blue-50 p-2 rounded-lg text-blue-600 shrink-0"><CheckIcon className="w-4 h-4"/></div> Gérer les abonnements
 </Link>
 </motion.div>
 )}
 </AnimatePresence>
 );

 return (
 <>
 <button 
 ref={buttonRef}
 onClick={() => setIsOpen(!isOpen)}
 className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[9990] w-14 h-14 bg-surface-900 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-transform"
 >
 <motion.div animate={{rotate: isOpen ? 45 : 0}}><PlusIcon className="w-6 h-6" /></motion.div>
 </button>
 {typeof document !== 'undefined' && createPortal(content, document.body)}
 </>
 );
};

// COMMAND PALETTE COMPONENT
const CommandPalette = ({isOpen, onClose}) => {
 const [query, setQuery] = useState('');
 const [results, setResults] = useState([]);
 const [loading, setLoading] = useState(false);
 const navigate = useNavigate();

 useEffect(() => {
 const handleKeyDown = (e) => {
 if (e.key === 'Escape') onClose();
};
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
}, [onClose]);

 useEffect(() => {
 if (!isOpen || query.trim().length < 2) {
 setResults([]);
 return undefined;
}
 const timer = setTimeout(async () => {
 try {
 setLoading(true);
 const response = await adminAPI.search(query.trim());
 setResults(response.data?.results || []);
} catch (error) {
 console.error('Admin search failed:', error);
 setResults([]);
} finally {
 setLoading(false);
}
}, 250);
 return () => clearTimeout(timer);
}, [isOpen, query]);

 useEffect(() => {
 if (!isOpen) setQuery('');
}, [isOpen]);

 if (!isOpen) return null;

 const openResult = (result) => {
 navigate(result.url);
 onClose();
};

 return (
 <div className="fixed inset-0 z-[100] flex items-start justify-center pt-32 px-4">
 <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={onClose}></div>
 <motion.div 
 initial={{opacity: 0, scale: 0.95}}
 animate={{opacity: 1, scale: 1}}
 exit={{opacity: 0, scale: 0.95}}
 className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-border"
 >
 <div className="flex items-center p-4 border-b border-border gap-3">
 <SearchIcon className="w-6 h-6 text-surface-400" />
 <input 
 autoFocus
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="Livres, utilisateurs, abonnements, signalements..."
 className="flex-1 bg-transparent border-none outline-none text-lg text-foreground placeholder-surface-400"
 />
 <div className="flex items-center gap-1 text-xs font-bold text-surface-400 bg-surface-secondary px-2 py-1 rounded">ESC</div>
 </div>
 <div className="p-2 max-h-96 overflow-y-auto">
 {query.trim().length >= 2 ? (
 loading ? (
 <div className="p-8 text-center text-foreground-muted">Recherche...</div>
 ) : results.length === 0 ? (
 <div className="p-8 text-center text-foreground-muted">Aucun résultat.</div>
 ) : results.map((result) => (
 <button key={`${result.type}:${result.id}`} onClick={() => openResult(result)} className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-surface-secondary transition-colors">
 <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center text-foreground-600"><SearchIcon className="w-4 h-4" /></div>
 <div className="min-w-0">
 <p className="font-bold truncate">{result.title}</p>
 <p className="text-xs text-foreground-muted truncate">{result.type} · {result.subtitle}</p>
 </div>
 </button>
 ))
 ) : (
 <>
 <div className="p-2 text-xs font-bold text-surface-400 uppercase tracking-wider">Raccourcis</div>
 <Link to="/admin/moderation" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-secondary text-foreground-secondary transition-colors">
 <BookIcon className="w-5 h-5 text-surface-400" /> File de modération
 </Link>
 <Link to="/admin/reports" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-secondary text-foreground-secondary transition-colors">
 <WarningIcon className="w-5 h-5 text-surface-400" /> Signalements ouverts
 </Link>
 </>
 )}
 </div>
 </motion.div>
 </div>
 );
};

function AdminDashboard() {
 const {user, logout} = useAuth();
 const navigate = useNavigate();
 const location = useLocation();
 const [isSidebarOpen, setSidebarOpen] = useState(true);
 const [isSearchOpen, setIsSearchOpen] = useState(false);
 const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
 const [permissions, setPermissions] = useState(null);

 useEffect(() => {
 if (!user?.id) return;
 adminAPI.getMyPermissions()
 .then((response) => setPermissions(response.data?.permissions || []))
 .catch((error) => console.error('Could not load admin permissions:', error));
}, [user?.id]);

 if (!user) {
 return <Navigate to="/admin/login" replace />;
}

 const handleLogout = () => {
 logout();
 navigate('/admin/login');
};

 const isActive = (path) => location.pathname === path;
 const navItems = [
 {to: '/admin', label:"Vue d'ensemble", icon: HomeIcon, end: true, permission: 'overview.read'},
 {to: '/admin/contents', label: 'Histoires CMS', icon: BookIcon, permission: 'content.read'},
 {to: '/admin/moderation', label: 'Modération', icon: ShieldIcon, permission: 'content.read'},
 {to: '/admin/reports', label: 'Signalements', icon: WarningIcon, permission: 'reports.read'},
 {to: '/admin/categories', label: 'Catégories', icon: TagIcon, permission: 'content.read'},
 {to: '/admin/users', label: 'Utilisateurs', icon: UserIcon, permission: 'users.read'},
 {to: '/admin/subscriptions', label: 'Abonnements', icon: CheckIcon, permission: 'subscriptions.read'},
 {to: '/admin/learning', label: 'Quiz & Jeux', icon: BrainIcon, permission: 'content.read'},
 {to: '/admin/statistics', label: 'Analytique', icon: HistoryIcon, permission: 'overview.read'},
 {to: '/admin/audit', label: 'Journal actions', icon: HistoryIcon, permission: 'audit.read'},
 {to: '/admin/permissions', label: 'Permissions', icon: ShieldIcon, permission: 'permissions.manage'},
 ].filter((item) => permissions == null || permissions.includes(item.permission));

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
 <div className="min-h-screen bg-[#fafafa] text-foreground flex overflow-hidden font-sans">
 
 {/* SIDEBAR */}
 <motion.aside
 initial={false}
 animate={{width: isSidebarOpen ? 260 : 72}}
 className="bg-card border-r border-border z-40 hidden md:flex flex-col h-screen shrink-0 transition-all duration-300"
 >
 <div className="h-16 flex items-center justify-between px-4 border-b border-border">
 {isSidebarOpen && <span className="font-black text-xl tracking-tight">HKids <span className="text-foreground-500">Admin</span></span>}
 {!isSidebarOpen && <span className="font-black text-xl tracking-tight mx-auto text-foreground-500">H</span>}
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
 : 'text-foreground-secondary hover:bg-surface-secondary hover:text-foreground'
}`}
 title={!isSidebarOpen ? item.label : ''}
 >
 <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-surface-400 group-hover:text-foreground-secondary'}`} />
 {isSidebarOpen && <span className="truncate">{item.label}</span>}
 </Link>
 );
})}
 </nav>

 <div className="p-3 border-t border-border">
 <button
 onClick={() => setSidebarOpen(!isSidebarOpen)}
 className="w-full p-2 flex items-center justify-center text-surface-400 hover:text-foreground-secondary hover:bg-surface-secondary rounded-xl transition-colors mb-2"
 >
 <ChevronLeftIcon className={`w-5 h-5 transition-transform ${!isSidebarOpen ? 'rotate-180' : ''}`} />
 </button>
 <div className={`flex items-center gap-3 p-2 rounded-xl bg-surface-secondary border border-border ${!isSidebarOpen && 'justify-center'}`}>
 <Avatar fallback={user.username.charAt(0).toUpperCase()} className="w-8 h-8 bg-gradient-to-br from-primary-400 to-violet-500 text-white font-bold shrink-0" />
 {isSidebarOpen && (
 <div className="overflow-hidden flex-1">
 <p className="text-sm font-bold text-foreground truncate">{user.username}</p>
 <p className="text-xs text-foreground-muted truncate">{user.email || 'admin@hkids.com'}</p>
 </div>
 )}
 </div>
 </div>
 </motion.aside>

 {/* MAIN LAYOUT */}
 <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
 
 {/* TOP BAR */}
 <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 z-30 shrink-0">
 <div className="flex items-center gap-4">
 <div className="hidden md:flex items-center gap-2 text-sm text-foreground-muted font-medium">
 <span>Admin</span>
 <span>/</span>
 <span className="text-foreground font-bold capitalize">
 {location.pathname.split('/')[2] ||"Vue d'ensemble"}
 </span>
 </div>
 {/* Mobile branding */}
 <div className="md:hidden font-black text-lg">HKids Admin</div>
 </div>

 <div className="flex items-center gap-4">
 <button 
 onClick={() => setIsSearchOpen(true)}
 className="hidden md:flex items-center gap-2 bg-surface-secondary hover:bg-surface-200 text-foreground-muted px-3 py-1.5 rounded-lg transition-colors text-sm font-medium border border-border w-64"
 >
 <SearchIcon className="w-4 h-4" />
 <span>Rechercher...</span>
 <div className="ml-auto flex gap-1">
 <kbd className="bg-card px-1.5 rounded text-xs font-sans shadow-sm">⌘</kbd>
 <kbd className="bg-card px-1.5 rounded text-xs font-sans shadow-sm">K</kbd>
 </div>
 </button>
 <button className="md:hidden p-2 text-foreground-muted hover:bg-surface-secondary rounded-full" onClick={() => setIsSearchOpen(true)}>
 <SearchIcon className="w-5 h-5" />
 </button>

 <div className="relative">
 <button 
 onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
 className="p-2 text-foreground-muted hover:bg-surface-secondary rounded-full relative transition-colors"
 >
 <BellIcon className="w-5 h-5" />
 <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
 </button>
 <AnimatePresence>
 {isNotificationsOpen && (
 <motion.div 
 initial={{opacity: 0, y: 10, scale: 0.95}} animate={{opacity: 1, y: 0, scale: 1}} exit={{opacity: 0, y: 10, scale: 0.95}}
 className="absolute right-0 mt-2 w-80 bg-card rounded-2xl shadow-xl border border-border overflow-hidden z-50 origin-top-right"
 >
 <div className="p-4 border-b border-border flex justify-between items-center bg-surface-secondary">
 <h3 className="font-bold text-foreground">Notifications</h3>
 <button className="text-xs text-foreground-600 font-bold hover:underline">Tout marquer lu</button>
 </div>
 <div className="max-h-64 overflow-y-auto">
 <div className="p-4 border-b border-border hover:bg-surface-secondary cursor-pointer">
 <p className="text-sm font-bold text-foreground">Nouvel abonnement 🎉</p>
 <p className="text-xs text-foreground-muted mt-1">Un parent vient de souscrire à la Formule Lecture.</p>
 <p className="text-xs text-surface-400 mt-2">Il y a 2 min</p>
 </div>
 <div className="p-4 border-b border-border hover:bg-surface-secondary cursor-pointer">
 <p className="text-sm font-bold text-foreground">Alerte Système</p>
 <p className="text-xs text-foreground-muted mt-1">Mise à jour des modèles vocaux terminée avec succès.</p>
 <p className="text-xs text-surface-400 mt-2">Il y a 1h</p>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 
 <button
 onClick={handleLogout}
 className="p-2 text-foreground-muted hover:bg-rose-50 hover:text-rose-600 rounded-full transition-colors"
 title="Déconnexion"
 >
 <LogOutIcon className="w-5 h-5" />
 </button>
 </div>
 </header>

 {/* MAIN SCROLLABLE AREA */}
 <main className="flex-1 overflow-y-auto bg-[#fafafa]">
 <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto">
 <Routes>
 <Route index element={<AdminOverview />} />
 <Route path="contents" element={<BookManagement />} />
 <Route path="categories" element={<CategoryManagement />} />
 <Route path="learning" element={<LearningManagement />} />
 <Route path="users" element={<AdminUsers />} />
 <Route path="subscriptions" element={<AdminSubscriptions />} />
 <Route path="statistics" element={<AdminStatistics />} />
 <Route path="moderation" element={<AdminModeration />} />
 <Route path="reports" element={<AdminReports />} />
 <Route path="audit" element={<AdminAuditLog />} />
 <Route path="permissions" element={<AdminPermissions />} />
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
