import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LockIcon, UserIcon, EyeIcon, EyeOffIcon, AlertIcon, LoadingSpinnerIcon, ChevronLeftIcon, StarIcon } from '../components/Icons';
import { Logo } from '../components/Logo';
import { API_URL } from '../config/api.js';

// Composant pour les étoiles animées
function StarParticles({ count = 20 }) {
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
          <StarIcon className="w-6 h-6" />
        </motion.div>
      ))}
    </div>
  );
}

function AdminLogin() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const resetRateLimit = async () => {
    try {
      const response = await fetch(`${API_URL}/reset-rate-limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        console.log('Rate limit réinitialisé');
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
        navigate('/admin');
      } else {
        // Translate error messages to French
        let errorMessage = result.error || 'Échec de la connexion';
        if (errorMessage.includes('Invalid credentials') || errorMessage.includes('Invalid username or password')) {
          errorMessage = 'Identifiants invalides. Vérifiez votre nom d\'utilisateur et votre mot de passe.';
        } else if (errorMessage.includes('Network Error') || errorMessage.includes('ECONNREFUSED')) {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré.';
        } else if (errorMessage.includes('timeout')) {
          errorMessage = 'La connexion a expiré. Veuillez réessayer.';
        } else if (errorMessage.includes('Too many requests') || errorMessage.includes('429') || errorMessage.includes('Erreur 429')) {
          // Auto-reset rate limit
          const reset = await resetRateLimit();
          errorMessage = reset 
            ? 'Trop de tentatives. Le rate limit a été réinitialisé, vous pouvez réessayer maintenant.'
            : 'Trop de tentatives. Veuillez attendre quelques instants avant de réessayer.';
        }
        setError(errorMessage);
      }
    } catch (err) {
      setError('Une erreur inattendue s\'est produite. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50/30 to-pink-50/30 flex items-center justify-center px-4 py-6 relative overflow-hidden">
      {/* Étoiles animées en arrière-plan */}
      <StarParticles count={15} />

      {/* Bouton retour à l'accueil */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute top-6 left-6 z-10"
      >
        <Link to="/">
          <motion.button
            whileHover={{ scale: 1.05, x: -3 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm border-2 border-red-200/50 rounded-xl shadow-md hover:shadow-lg hover:border-red-300 transition-all text-neutral-700 font-medium text-sm"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </motion.button>
        </Link>
      </motion.div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-10 lg:gap-14 items-center">
        {/* Left side: intro / brand */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="hidden lg:block text-neutral-900 relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white mb-5 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              • ESPACE SÉCURISÉ ADMINISTRATEUR
            </span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight mb-4">
            Gérez votre bibliothèque
            <span className="block bg-gradient-to-r from-red-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              en toute simplicité.
            </span>
          </h1>
          <p className="text-base md:text-lg text-neutral-700 max-w-xl leading-relaxed mb-8">
            Ajoutez de nouveaux livres, organisez les catégories et gardez le contrôle sur tout le contenu
            proposé aux enfants depuis un espace pensé pour les adultes.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="rounded-2xl border-2 border-red-200/50 bg-gradient-to-br from-white to-red-50/30 px-4 py-4 shadow-md hover:shadow-lg transition-all"
            >
              <p className="font-bold mb-2 text-neutral-900">Conçu pour les écoles</p>
              <p className="text-sm text-neutral-600">
                Gestion simple des collections, même pour les équipes non techniques.
              </p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="rounded-2xl border-2 border-pink-200/50 bg-gradient-to-br from-white to-pink-50/30 px-4 py-4 shadow-md hover:shadow-lg transition-all"
            >
              <p className="font-bold mb-2 text-neutral-900">Sécurité renforcée</p>
              <p className="text-sm text-neutral-600">
                Accès réservé via compte administrateur, loin des petites mains curieuses.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Right side: login card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl border-2 border-red-200/50 shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-md mx-auto relative overflow-hidden"
        >
          {/* Effet de gradient en arrière-plan */}
          <div className="absolute inset-0 bg-gradient-to-tr from-red-500/10 via-pink-500/5 to-orange-500/10 blur-2xl rounded-3xl" />
          
          <div className="relative z-10 text-center mb-8">
            <motion.div 
              className="mb-5 flex justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-red-500/30 via-pink-500/20 to-orange-500/30 blur-2xl rounded-full" />
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-500 shadow-lg">
                  <Logo size="large" showText={false} className="pointer-events-none" />
                </div>
              </div>
            </motion.div>
            <h2 className="text-3xl font-bold text-neutral-900 mb-2 tracking-tight">HKids Admin</h2>
            <p className="text-sm text-neutral-600">
              Connectez-vous pour gérer les livres, catégories et contenus.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2 shadow-md"
                >
                  <AlertIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-neutral-700 mb-2">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <UserIcon className="w-5 h-5 text-red-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3.5 border-2 border-red-200/50 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm bg-white/80 backdrop-blur-sm text-neutral-900 placeholder:text-neutral-400 shadow-sm hover:shadow-md"
                  placeholder="Entrez votre nom d'utilisateur"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <LockIcon className="w-5 h-5 text-red-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3.5 border-2 border-red-200/50 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm bg-white/80 backdrop-blur-sm text-neutral-900 placeholder:text-neutral-400 shadow-sm hover:shadow-md"
                  placeholder="Entrez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-600 transition-colors"
                >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base font-bold rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg hover:shadow-xl transition-all"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <>
                  <LoadingSpinnerIcon className="w-5 h-5 animate-spin" />
                  <span>Connexion...</span>
                </>
              ) : (
                <span>Se connecter</span>
              )}
            </motion.button>
          </form>

          <div className="relative z-10 mt-8 space-y-4">
            <div className="text-center">
              <p className="text-sm text-neutral-600">
                Vous n'avez pas de compte ?{' '}
                <Link 
                  to="/admin/signup" 
                  className="text-red-600 font-bold hover:text-pink-600 hover:underline transition-colors"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-50/50 via-pink-50/50 to-orange-50/50 rounded-xl p-5 border-2 border-red-200/50 shadow-inner">
              <p className="text-sm font-bold text-neutral-800 mb-4">Identifiants de démo</p>
              <div className="flex items-center justify-center gap-4">
                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-white px-5 py-3 rounded-xl border-2 border-red-200/50 shadow-md flex-1"
                >
                  <span className="text-xs text-neutral-600 block mb-1.5 font-semibold">Nom d'utilisateur</span>
                  <p className="font-mono text-base font-bold text-neutral-900">admin</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-white px-5 py-3 rounded-xl border-2 border-pink-200/50 shadow-md flex-1"
                >
                  <span className="text-xs text-neutral-600 block mb-1.5 font-semibold">Mot de passe</span>
                  <p className="font-mono text-base font-bold text-neutral-900">admin123</p>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminLogin;

