import {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {useAuth} from '../context/AuthContext';
import {EyeIcon, EyeOffIcon, LockIcon, UserIcon, ChevronLeftIcon, AlertIcon, LoadingSpinnerIcon, StarIcon} from '../components/Icons';
import {Logo} from '../components/Logo';

export default function ParentLogin() {
 const [username, setUsername] = useState('');
 const [password, setPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);
 const [mounted, setMounted] = useState(false);
 
 const {login} = useAuth();
 const navigate = useNavigate();

 useEffect(() => {
 setMounted(true);
}, []);

 const handleSubmit = async (event) => {
 event.preventDefault();
 setError('');
 setLoading(true);

 const result = await login(username.trim(), password);
 setLoading(false);

 if (!result.success) {
 setError(result.error || 'Connexion impossible');
 return;
}

 const userData = localStorage.getItem('user');
 const user = userData ? JSON.parse(userData) : null;

 if (user?.role === 'kid') {
 navigate('/kids');
 return;
}

 if (user?.role !== 'parent' && user?.role !== 'admin') {
 setError("Ce compte n'a pas accès à HKids.");
 return;
}

 navigate('/parent');
};

 return (
 <div className="min-h-screen bg-card flex flex-col lg:flex-row overflow-hidden font-sans">
 
 {/* Back Button - Fixed positioning for both mobile and desktop */}
 <div className="absolute top-6 left-6 z-50">
 <Link to="/">
 <motion.button 
 whileHover={{scale: 1.05}}
 whileTap={{scale: 0.95}}
 className="flex items-center gap-2 px-5 py-2.5 bg-card/80 backdrop-blur-md border border-border rounded-[1.5rem] shadow-sm text-foreground-secondary font-bold text-sm hover:text-foreground hover:shadow-md transition-all"
 >
 <ChevronLeftIcon className="w-4 h-4" />
 Retour
 </motion.button>
 </Link>
 </div>

 {/* LEFT PANEL: Visuals (Hidden on small screens) */}
 <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-50 via-primary-100/50 to-secondary-50 items-center justify-center p-12 overflow-hidden border-r border-primary-100">
 {/* Background decorative elements */}
 <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
 <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-300/20 blur-[100px]"></div>
 <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary-300/20 blur-[120px]"></div>
 
 {/* Animated stars */}
 {mounted && Array.from({length: 8}).map((_, i) => (
 <motion.div
 key={i}
 className="absolute text-yellow-400 opacity-60"
 style={{
 left: `${15 + Math.random() * 70}%`,
 top: `${15 + Math.random() * 70}%`,
}}
 animate={{
 y: [0, -15, 0],
 opacity: [0.3, 0.8, 0.3],
 scale: [0.8, 1.1, 0.8],
 rotate: [0, 10, 0]
}}
 transition={{
 duration: 4 + Math.random() * 3,
 repeat: Infinity,
 delay: Math.random() * 2,
}}
 >
 <StarIcon className="w-6 h-6" />
 </motion.div>
 ))}
 </div>

 {/* Central Illustration Composition */}
 <motion.div 
 initial={{opacity: 0, y: 40}}
 animate={{opacity: 1, y: 0}}
 transition={{duration: 0.8, delay: 0.2}}
 className="relative z-10 w-full max-w-lg flex flex-col items-center text-center"
 >
 {/* Glassmorphic Image Container */}
 <div className="relative w-full aspect-square mb-12">
 <div className="absolute inset-4 bg-card/40 backdrop-blur-3xl rounded-[3rem] border border-white shadow-[0_30px_60px_-15px_rgba(123,62,184,0.15)] overflow-hidden flex items-center justify-center p-8">
 <img 
 src="/enfant3ans.webp" 
 alt="Enfant qui lit" 
 className="w-full h-full object-contain filter drop-shadow-2xl"
 />
 
 {/* Floating Badge */}
 <motion.div 
 animate={{y: [-5, 5, -5]}}
 transition={{duration: 4, repeat: Infinity, ease:"easeInOut"}}
 className="absolute -top-4 -right-4 bg-card/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-white/50 flex items-center gap-2"
 >
 <span className="text-xl">✨</span>
 <div className="text-left">
 <div className="text-xs font-bold text-foreground-muted">HKids</div>
 <div className="text-sm font-extrabold text-foreground-600">Espace Parent</div>
 </div>
 </motion.div>
 </div>
 </div>

 <h2 className="text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-4">
 Bienvenue dans<br/>votre espace.
 </h2>
 <p className="text-lg text-foreground-secondary font-medium max-w-sm">
 Gérez la bibliothèque de vos enfants et suivez leurs aventures magiques.
 </p>
 </motion.div>
 </div>

 {/* RIGHT PANEL: Form */}
 <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-20 relative bg-card">
 
 <div className="w-full max-w-[420px] mx-auto">
 {/* Mobile Header (Only visible on small screens) */}
 <div className="lg:hidden flex flex-col items-center text-center mb-10 pt-16">
 <div className="w-16 h-16 rounded-3xl bg-primary-50 flex items-center justify-center mb-6">
 <Logo size="small" showText={false} />
 </div>
 <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Bienvenue</h1>
 <p className="text-foreground-secondary font-medium">Connectez-vous à votre espace parent</p>
 </div>

 {/* Desktop Header */}
 <div className="hidden lg:block mb-10">
 <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg flex items-center justify-center mb-8">
 <Logo size="small" showText={false} className="text-white" />
 </div>
 <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Connexion</h1>
 <p className="text-foreground-secondary font-medium">Renseignez vos identifiants pour continuer.</p>
 </div>

 {/* Error Message */}
 <AnimatePresence>
 {error && (
 <motion.div
 initial={{opacity: 0, y: -10, scale: 0.98}}
 animate={{opacity: 1, y: 0, scale: 1}}
 exit={{opacity: 0, scale: 0.98}}
 className="mb-8 p-4 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-2xl flex items-start gap-3 shadow-sm"
 >
 <AlertIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
 <p className="text-sm font-semibold text-red-700 leading-relaxed">{error}</p>
 </motion.div>
 )}
 </AnimatePresence>

 <form onSubmit={handleSubmit} className="space-y-6">
 {/* Username Input */}
 <div className="space-y-2">
 <label className="block text-sm font-bold text-foreground-secondary ml-1">
 Nom d'utilisateur
 </label>
 <div className="relative group">
 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-foreground-500 transition-colors">
 <UserIcon className="w-5 h-5" />
 </div>
 <input
 type="text"
 value={username}
 onChange={(e) => setUsername(e.target.value)}
 className="w-full pl-12 pr-4 py-4 bg-surface-secondary border-2 border-border rounded-[1.5rem] focus:bg-card focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-medium text-foreground placeholder:text-surface-400 outline-none"
 placeholder="votre_pseudo"
 required
 />
 </div>
 </div>

 {/* Password Input */}
 <div className="space-y-2">
 <label className="block text-sm font-bold text-foreground-secondary ml-1">
 Mot de passe
 </label>
 <div className="relative group">
 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-foreground-500 transition-colors">
 <LockIcon className="w-5 h-5" />
 </div>
 <input
 type={showPassword ? 'text' : 'password'}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="w-full pl-12 pr-14 py-4 bg-surface-secondary border-2 border-border rounded-[1.5rem] focus:bg-card focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-medium text-foreground placeholder:text-surface-400 outline-none"
 placeholder="••••••••"
 required
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-200 text-surface-400 hover:text-foreground-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
 aria-label={showPassword ?"Masquer le mot de passe" :"Afficher le mot de passe"}
 >
 {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
 </button>
 </div>
 </div>

 {/* Options Row */}
 <div className="flex items-center justify-between pt-2">
 <label className="flex items-center gap-2 cursor-pointer group">
 <div className="relative w-5 h-5 rounded-md border-2 border-surface-300 group-hover:border-primary-500 flex items-center justify-center transition-colors">
 <input type="checkbox" className="peer absolute opacity-0 w-full h-full cursor-pointer" />
 <div className="w-full h-full bg-primary-500 rounded-[4px] opacity-0 peer-checked:opacity-100 flex items-center justify-center transition-opacity">
 <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
 </div>
 </div>
 <span className="text-sm font-semibold text-foreground-secondary group-hover:text-foreground transition-colors">Se souvenir de moi</span>
 </label>
 
 <button type="button" className="text-sm font-bold text-foreground-600 hover:text-foreground-700 hover:underline transition-all">
 Mot de passe oublié ?
 </button>
 </div>

 {/* Submit Button */}
 <motion.button
 type="submit"
 disabled={loading}
 whileHover={{scale: loading ? 1 : 1.01}}
 whileTap={{scale: loading ? 1 : 0.99}}
 className="w-full mt-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-[1.5rem] font-bold text-lg shadow-[0_8px_20px_-6px_rgba(123,62,184,0.4)] hover:shadow-[0_12px_25px_-6px_rgba(123,62,184,0.5)] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group relative overflow-hidden"
 >
 {loading ? (
 <>
 <LoadingSpinnerIcon className="w-6 h-6 animate-spin" />
 <span>Connexion en cours...</span>
 </>
 ) : (
 <>
 <span className="relative z-10">Se connecter</span>
 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
 </>
 )}
 </motion.button>
 </form>

 {/* Sign up link */}
 <div className="mt-10 text-center">
 <p className="text-foreground-secondary font-medium">
 Nouveau sur HKids ?{' '}
 <Link to="/parent/signup" className="text-foreground-600 font-bold hover:text-foreground-700 hover:underline inline-flex items-center gap-1 transition-colors">
 Créer un compte <ChevronLeftIcon className="w-3 h-3 rotate-180" />
 </Link>
 </p>
 </div>

 </div>
 </div>
 </div>
 );
}
