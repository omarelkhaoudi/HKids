import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeOffIcon, LockIcon, UserIcon, ChevronLeftIcon } from '../components/Icons';
import { Logo } from '../components/Logo';

function ParentLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
      setError("Ce compte n'a pas acces a HKids.");
      return;
    }

    navigate('/parent');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50/30 to-pink-50/30 flex items-center justify-center px-4 py-8">
      <Link to="/" className="absolute left-6 top-6">
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-red-200 rounded-xl shadow text-neutral-700 font-medium text-sm">
          <ChevronLeftIcon className="w-4 h-4" />
          Retour a l'accueil
        </button>
      </Link>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="hidden lg:block">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white mb-5 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-white" />
            <span className="text-xs font-semibold uppercase tracking-wide">Espace securise HKids</span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-neutral-900">
            Connectez-vous
            <span className="block bg-gradient-to-r from-red-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              a votre espace.
            </span>
          </h1>
          <p className="text-lg text-neutral-700 max-w-xl leading-relaxed">
            Parents et enfants retrouvent ici leur espace de lecture, le suivi et les livres autorises.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 rounded-3xl border-2 border-red-200/50 shadow-2xl p-8 md:p-10 w-full max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-500 shadow-lg mb-5">
              <Logo size="large" showText={false} />
            </div>
            <h2 className="text-3xl font-bold text-neutral-900 mb-2">Connexion HKids</h2>
            <p className="text-sm text-neutral-600">Connectez-vous pour acceder a votre espace.</p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Nom d'utilisateur</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 border-2 border-red-200/50 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Mot de passe</label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full pl-10 pr-12 py-3.5 border-2 border-red-200/50 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400"
                >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold shadow-lg disabled:opacity-60"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-neutral-600">
            Vous n'avez pas de compte ?{' '}
            <Link to="/parent/signup" className="font-bold text-red-600 hover:underline">
              Creer un compte parent
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default ParentLogin;
