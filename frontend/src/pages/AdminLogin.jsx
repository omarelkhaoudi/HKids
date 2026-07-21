import {useState} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {useAuth} from '../context/AuthContext';
import {useLanguage} from '../context/LanguageContext';
import {LockIcon, UserIcon, EyeIcon, EyeOffIcon, AlertIcon, LoadingSpinnerIcon, ChevronLeftIcon, StarIcon} from '../components/Icons';
import {Logo} from '../components/Logo';
import {MagicalBackground} from '../components/layout/PlatformShell';
import {API_URL, buildApiUrl} from '../config/api.js';

// Composant pour les étoiles animées
function StarParticles({count = 20}) {
 return (
 <div className="absolute inset-0 overflow-hidden pointer-events-none">
 {Array.from({length: count}).map((_, i) => (
 <motion.div
 key={i}
 className="absolute text-accent-400"
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
 <StarIcon className="w-6 h-6" />
 </motion.div>
 ))}
 </div>
 );
}

function AdminLogin({audience = 'admin'}) {
 const isParentLogin = audience === 'parent';
 const [username, setUsername] = useState(isParentLogin ? '' : 'admin');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);
 const [showPassword, setShowPassword] = useState(false);
 const {login} = useAuth();
 const {t} = useLanguage();
 const navigate = useNavigate();

 const resetRateLimit = async () => {
 try {
 const response = await fetch(buildApiUrl('/reset-rate-limit'), {
 method: 'POST',
 headers: {'Content-Type': 'application/json'},
});
 if (response.ok) {
 return true;
}
} catch (err) {
 console.error('Error resetting rate limit:', err);
}
 return false;
};

 const handleSubmit = async (e) => {
 e.preventDefault();
 setError('');
 setLoading(true);

 try {
 const result = await login(username.trim(), password);
 
 if (result.success) {
 const userData = localStorage.getItem('user');
 const loggedUser = userData ? JSON.parse(userData) : null;
 if (loggedUser?.role === 'parent') {
 navigate('/parent');
} else if (loggedUser?.role === 'kid') {
 navigate('/kids');
} else {
 navigate('/admin');
}
} else {
 // Translate error messages to French
 let errorMessage = result.error || t('adminLoginErrorDefault');
 if (errorMessage.includes('Invalid credentials') || errorMessage.includes('Invalid username or password')) {
 errorMessage = t('adminLoginErrorInvalid');
} else if (errorMessage.includes('Network Error') || errorMessage.includes('ECONNREFUSED')) {
 errorMessage = t('adminLoginErrorNetwork');
} else if (errorMessage.includes('timeout')) {
 errorMessage = t('adminLoginErrorTimeout');
} else if (errorMessage.includes('Too many requests') || errorMessage.includes('429') || errorMessage.includes('Erreur 429')) {
 // Auto-reset rate limit
 const reset = await resetRateLimit();
 errorMessage = reset 
 ? t('adminLoginErrorRateReset')
 : t('adminLoginErrorRateWait');
}
 setError(errorMessage);
}
} catch (err) {
 setError(t('adminLoginErrorUnexpected'));
} finally {
 setLoading(false);
}
};

 return (
 <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 flex items-center justify-center px-4 py-6 relative overflow-hidden">
 <MagicalBackground preset="platform" />
 {/* Étoiles animées en arrière-plan */}
 <StarParticles count={15} />

 {/* Bouton retour à l'accueil */}
 <motion.div
 initial={{opacity: 0, x: -20}}
 animate={{opacity: 1, x: 0}}
 transition={{duration: 0.4}}
 className="absolute top-6 left-6 z-10"
 >
 <Link to="/">
 <motion.button
 whileHover={{scale: 1.05, x: -3}}
 whileTap={{scale: 0.95}}
 className="flex items-center gap-2 px-4 py-2.5 bg-card/90 backdrop-blur-sm border-2 border-primary-200/50 rounded-3xl shadow-md hover:shadow-lg hover:border-primary-300 transition-all text-foreground-secondary font-medium text-sm"
 >
 <ChevronLeftIcon className="w-4 h-4" />
 <span>{t('adminLoginBackToHome')}</span>
 </motion.button>
 </Link>
 </motion.div>

 <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-10 lg:gap-14 items-center">
 {/* Left side: intro / brand */}
 <motion.div
 initial={{opacity: 0, x: -20}}
 animate={{opacity: 1, x: 0}}
 transition={{duration: 0.4}}
 className="hidden lg:block text-foreground relative z-10"
 >
 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white mb-5 shadow-lg">
 <span className="h-2 w-2 rounded-full bg-card animate-pulse" />
 <span className="text-xs font-semibold uppercase tracking-wide">
 {t('adminLoginSecureSpace')}
 </span>
 </div>
 <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight mb-4">
 {t('adminLoginTitle')}
 <span className="block bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent">
 {t('adminLoginTitleHighlight')}
 </span>
 </h1>
 <p className="text-base md:text-lg text-foreground-secondary max-w-xl leading-relaxed mb-8">
 {t('adminLoginDescription')}
 </p>
 <div className="grid grid-cols-2 gap-4 max-w-md">
 <motion.div 
 whileHover={{scale: 1.02, y: -2}}
 className="rounded-2xl border-2 border-primary-200/50 bg-gradient-to-br from-white to-primary-50/30 px-4 py-4 shadow-md hover:shadow-lg transition-all"
 >
 <p className="font-bold mb-2 text-foreground">{t('adminLoginSchoolsTitle')}</p>
 <p className="text-sm text-foreground-secondary">
 {t('adminLoginSchoolsDesc')}
 </p>
 </motion.div>
 <motion.div 
 whileHover={{scale: 1.02, y: -2}}
 className="rounded-2xl border-2 border-secondary-200/50 bg-gradient-to-br from-white to-secondary-50/30 px-4 py-4 shadow-md hover:shadow-lg transition-all"
 >
 <p className="font-bold mb-2 text-foreground">{t('adminLoginSecurityTitle')}</p>
 <p className="text-sm text-foreground-secondary">
 {t('adminLoginSecurityDesc')}
 </p>
 </motion.div>
 </div>
 </motion.div>

 {/* Right side: login card */}
 <motion.div
 initial={{opacity: 0, scale: 0.95, y: 20}}
 animate={{opacity: 1, scale: 1, y: 0}}
 transition={{duration: 0.35}}
 className="bg-card/95 backdrop-blur-sm rounded-3xl border-2 border-primary-200/50 shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-md mx-auto relative overflow-hidden"
 >
 {/* Effet de gradient en arrière-plan */}
 <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 via-secondary-500/5 to-accent-500/10 blur-2xl rounded-3xl" />
 
 <div className="relative z-10 text-center mb-8">
 <motion.div 
 className="mb-5 flex justify-center"
 whileHover={{scale: 1.1, rotate: 5}}
 transition={{type:"spring", stiffness: 300}}
 >
 <div className="relative">
 <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/30 via-secondary-500/20 to-accent-500/30 blur-2xl rounded-full" />
 <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 shadow-lg">
 <Logo size="large" showText={false} className="pointer-events-none" />
 </div>
 </div>
 </motion.div>
 <h2 className="text-3xl font-bold text-foreground mb-2 tracking-tight">HKids Admin</h2>
 <p className="text-sm text-foreground-secondary">
 {t('adminLoginSubtitle')}
 </p>
 </div>

 <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
 <AnimatePresence>
 {error && (
 <motion.div
 initial={{opacity: 0, y: -10}}
 animate={{opacity: 1, y: 0}}
 exit={{opacity: 0, y: -10}}
 className="bg-primary-50 border-2 border-primary-300 text-foreground-700 px-4 py-3 rounded-3xl flex items-start gap-2 shadow-md"
 >
 <AlertIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
 <span className="text-sm font-medium">{error}</span>
 </motion.div>
 )}
 </AnimatePresence>

 <div>
 <label htmlFor="username" className="block text-sm font-semibold text-foreground-secondary mb-2">
 {t('adminLoginUsername')}
 </label>
 <div className="relative">
 <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
 <UserIcon className="w-5 h-5 text-foreground-400" />
 </div>
 <input
 id="username"
 type="text"
 value={username}
 onChange={(e) => setUsername(e.target.value)}
 required
 className="w-full pl-10 pr-4 py-3.5 border-2 border-primary-200/50 rounded-3xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm bg-card/80 backdrop-blur-sm text-foreground placeholder:text-surface-400 shadow-sm hover:shadow-md"
 placeholder={t('adminLoginUsernamePlaceholder')}
 />
 </div>
 </div>

 <div>
 <label htmlFor="password" className="block text-sm font-semibold text-foreground-secondary mb-2">
 {t('adminLoginPassword')}
 </label>
 <div className="relative">
 <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
 <LockIcon className="w-5 h-5 text-foreground-400" />
 </div>
 <input
 id="password"
 type={showPassword ?"text" :"password"}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 className="w-full pl-10 pr-12 py-3.5 border-2 border-primary-200/50 rounded-3xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm bg-card/80 backdrop-blur-sm text-foreground placeholder:text-surface-400 shadow-sm hover:shadow-md"
 placeholder={t('adminLoginPasswordPlaceholder')}
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground-400 hover:text-foreground-600 transition-colors"
 >
 {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
 </button>
 </div>
 </div>

 <motion.button
 type="submit"
 disabled={loading}
 className="w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base font-bold rounded-3xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg hover:shadow-xl transition-all"
 whileHover={{scale: loading ? 1 : 1.02}}
 whileTap={{scale: loading ? 1 : 0.98}}
 >
 {loading ? (
 <>
 <LoadingSpinnerIcon className="w-5 h-5 animate-spin" />
 <span>{t('adminLoginLoading')}</span>
 </>
 ) : (
 <span>{t('adminLoginSubmit')}</span>
 )}
 </motion.button>
 </form>

 <div className="relative z-10 mt-8">
 <div className="text-center">
 <p className="text-sm text-foreground-secondary">
 {t('adminLoginNoAccount')}{' '}
 <Link 
 to="/admin/signup" 
 className="text-foreground-600 font-bold hover:text-foreground-secondary-600 hover:underline transition-colors"
 >
 {t('adminLoginCreateAccount')}
 </Link>
 </p>
 </div>
 </div>
 </motion.div>
 </div>
 </div>
 );
}

export default AdminLogin;

