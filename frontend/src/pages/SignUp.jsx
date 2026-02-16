import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { UserIcon, EyeIcon, EyeOffIcon, AlertIcon, LoadingSpinnerIcon, CheckCircleIcon, StarIcon, LockIcon, ChevronLeftIcon } from '../components/Icons';
import { Logo } from '../components/Logo';

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

function SignUp() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!username.trim()) {
      setError('Le nom d\'utilisateur est requis');
      return false;
    }

    if (username.length < 3) {
      setError('Le nom d\'utilisateur doit contenir au moins 3 caractères');
      return false;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await signup(username.trim(), password);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/admin/login');
        }, 2000);
      } else {
        let errorMessage = result.error || 'Échec de l\'inscription';
        if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
          errorMessage = 'Ce nom d\'utilisateur est déjà utilisé. Veuillez en choisir un autre.';
        } else if (errorMessage.includes('Network Error') || errorMessage.includes('ECONNREFUSED')) {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré.';
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

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-10 lg:gap-14 items-center relative z-10">
        {/* Left side: intro / benefits */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="hidden lg:block text-neutral-900"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg mb-5">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              • ESPACE ADMINISTRATEUR HKIDS
            </span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight mb-4">
            Créez un compte
            <span className="block bg-gradient-to-r from-red-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              pour gérer vos contenus.
            </span>
          </h1>
          <p className="text-base md:text-lg text-neutral-700 max-w-xl leading-relaxed mb-8">
            Donnez vie à votre catalogue de livres en ligne&nbsp;: ajoutez de nouveaux albums, organisez-les par
            catégories et âges, et offrez aux enfants une expérience de lecture cohérente et sécurisée.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="rounded-2xl border-2 border-red-200/50 bg-gradient-to-br from-white to-red-50/30 px-4 py-4 shadow-md hover:shadow-lg transition-all"
            >
              <p className="font-bold mb-2 text-neutral-900">Compte multi-accès</p>
              <p className="text-sm text-neutral-600">
                Plusieurs adultes peuvent gérer les contenus sans partager les identifiants principaux.
              </p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="rounded-2xl border-2 border-pink-200/50 bg-gradient-to-br from-white to-pink-50/30 px-4 py-4 shadow-md hover:shadow-lg transition-all"
            >
              <p className="font-bold mb-2 text-neutral-900">Pensé pour durer</p>
              <p className="text-sm text-neutral-600">
                Ajoutez, modifiez et archivez vos livres à mesure que votre bibliothèque grandit.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Right side: signup card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3 }}
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
            <h2 className="text-3xl font-bold text-neutral-900 mb-2 tracking-tight">Créer un compte admin</h2>
            <p className="text-sm text-neutral-600">
              Rejoignez HKids pour gérer les livres, catégories et paramètres.
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
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-50 border-2 border-green-300 text-green-700 px-4 py-3 rounded-xl flex items-start gap-2 shadow-md"
                >
                  <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">Compte créé avec succès ! Redirection en cours...</span>
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
                  minLength={3}
                  className="w-full pl-10 pr-4 py-3.5 border-2 border-red-200/50 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm bg-white/80 backdrop-blur-sm text-neutral-900 placeholder:text-neutral-400 shadow-sm hover:shadow-md"
                  placeholder="Choisissez un nom d'utilisateur"
                />
              </div>
              <p className="text-xs text-neutral-600 mt-1">Minimum 3 caractères</p>
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
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3.5 border-2 border-red-200/50 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm bg-white/80 backdrop-blur-sm text-neutral-900 placeholder:text-neutral-400 shadow-sm hover:shadow-md"
                  placeholder="Créez un mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-600 transition-colors"
                >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-neutral-600 mt-1">Minimum 6 caractères</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <LockIcon className="w-5 h-5 text-red-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3.5 border-2 border-red-200/50 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm bg-white/80 backdrop-blur-sm text-neutral-900 placeholder:text-neutral-400 shadow-sm hover:shadow-md"
                  placeholder="Confirmez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || success}
              className="w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base font-bold rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg hover:shadow-xl transition-all"
              whileHover={{ scale: loading || success ? 1 : 1.02 }}
              whileTap={{ scale: loading || success ? 1 : 0.98 }}
            >
              {loading ? (
                <>
                  <LoadingSpinnerIcon className="w-5 h-5 animate-spin" />
                  <span>Création du compte...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Compte créé !</span>
                </>
              ) : (
                <span>Créer un compte</span>
              )}
            </motion.button>
          </form>

          <div className="relative z-10 mt-8 text-center">
            <p className="text-sm text-neutral-600">
              Vous avez déjà un compte ?{' '}
              <Link 
                to="/admin/login" 
                className="text-red-600 font-bold hover:text-pink-600 hover:underline transition-colors"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default SignUp;

