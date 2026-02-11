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
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl border-2 border-neutral-200 shadow-xl p-8 md:p-12 w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="mb-6 flex justify-center">
            <Logo size="large" showText={false} className="pointer-events-none" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2 tracking-tight">HKids Admin</h1>
          <p className="text-neutral-600 text-base">Connectez-vous pour gérer le contenu</p>
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
                className="w-full pl-10 pr-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:ring-4 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all text-sm bg-neutral-50/50"
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
                className="w-full pl-10 pr-12 py-3.5 border-2 border-neutral-200 rounded-xl focus:ring-4 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all text-sm bg-neutral-50/50"
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
            className="btn-primary w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl"
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
            <p className="text-sm text-neutral-600">
              Vous n'avez pas de compte ?{' '}
              <Link 
                to="/admin/signup" 
                className="text-neutral-900 font-semibold hover:underline"
              >
                Créer un compte
              </Link>
            </p>
          </div>
          <div className="bg-neutral-50 rounded-xl p-5 border-2 border-neutral-200 shadow-sm">
            <p className="text-sm font-semibold text-neutral-700 mb-4">Identifiants par défaut</p>
            <div className="flex items-center justify-center gap-4">
              <div className="bg-white px-5 py-3 rounded-xl border-2 border-neutral-200 shadow-sm flex-1">
                <span className="text-xs text-neutral-500 block mb-1.5 font-medium">Nom d'utilisateur</span>
                <p className="font-mono text-base font-bold text-neutral-900">admin</p>
              </div>
              <div className="bg-white px-5 py-3 rounded-xl border-2 border-neutral-200 shadow-sm flex-1">
                <span className="text-xs text-neutral-500 block mb-1.5 font-medium">Mot de passe</span>
                <p className="font-mono text-base font-bold text-neutral-900">admin123</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default AdminLogin;

