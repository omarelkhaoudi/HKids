import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LockIcon, UserIcon, EyeIcon, EyeOffIcon, AlertIcon, LoadingSpinnerIcon } from '../components/Icons';
import { Logo } from '../components/Logo';

function AdminLogin() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 flex items-center justify-center px-4 py-6">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-10 lg:gap-14 items-center">
        {/* Left side: intro / brand */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="hidden lg:block text-neutral-900"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 mb-5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Espace sécurisé administrateur
            </span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight mb-4">
            Gérez votre bibliothèque
            <span className="block bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 bg-clip-text text-transparent">
              en toute simplicité.
            </span>
          </h1>
          <p className="text-sm md:text-base text-neutral-600 max-w-xl leading-relaxed mb-8">
            Ajoutez de nouveaux livres, organisez les catégories et gardez le contrôle sur tout le contenu
            proposé aux enfants depuis un espace pensé pour les adultes.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md text-xs text-neutral-700/90">
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
              <p className="font-semibold mb-1">Conçu pour les écoles</p>
              <p className="text-neutral-500">
                Gestion simple des collections, même pour les équipes non techniques.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
              <p className="font-semibold mb-1">Sécurité renforcée</p>
              <p className="text-neutral-500">
                Accès réservé via compte administrateur, loin des petites mains curieuses.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right side: login card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-2xl border border-neutral-200 shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <div className="mb-5 flex justify-center">
              <Logo size="large" showText={false} className="pointer-events-none" />
            </div>
            <h2 className="text-3xl font-bold text-neutral-900 mb-2 tracking-tight">HKids Admin</h2>
            <p className="text-sm text-neutral-500">
              Connectez-vous pour gérer les livres, catégories et contenus.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2"
                >
                  <AlertIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-2">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <UserIcon className="w-5 h-5 text-neutral-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-400 transition-all text-sm bg-neutral-50 text-neutral-900 placeholder:text-neutral-400"
                  placeholder="Entrez votre nom d'utilisateur"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <LockIcon className="w-5 h-5 text-neutral-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3.5 border-2 border-neutral-200 rounded-xl focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-400 transition-all text-sm bg-neutral-50 text-neutral-900 placeholder:text-neutral-400"
                  placeholder="Entrez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base font-semibold rounded-xl bg-emerald-400 text-neutral-950 shadow-lg hover:shadow-xl hover:bg-emerald-300 transition-all"
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

          <div className="mt-8 space-y-4">
            <div className="text-center">
              <p className="text-sm text-neutral-500">
                Vous n'avez pas de compte ?{' '}
                <Link 
                  to="/admin/signup" 
                  className="text-emerald-600 font-semibold hover:underline"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200 shadow-inner">
              <p className="text-sm font-semibold text-neutral-800 mb-4">Identifiants de démo</p>
              <div className="flex items-center justify-center gap-4">
                <div className="bg-white px-5 py-3 rounded-xl border border-neutral-200 shadow-sm flex-1">
                  <span className="text-xs text-neutral-500 block mb-1.5 font-medium">Nom d'utilisateur</span>
                  <p className="font-mono text-base font-bold text-neutral-900">admin</p>
                </div>
                <div className="bg-white px-5 py-3 rounded-xl border border-neutral-200 shadow-sm flex-1">
                  <span className="text-xs text-neutral-500 block mb-1.5 font-medium">Mot de passe</span>
                  <p className="font-mono text-base font-bold text-neutral-900">admin123</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminLogin;

