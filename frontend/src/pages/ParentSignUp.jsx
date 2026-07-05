import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeftIcon, LockIcon, UserIcon } from '../components/Icons';
import { Logo } from '../components/Logo';

function ParentSignUp() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      setError("Le nom d'utilisateur doit contenir au moins 3 caracteres.");
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    const result = await signup(username.trim(), password, 'parent');
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Creation du compte impossible.");
      return;
    }

    navigate('/parent/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 flex items-center justify-center px-4 py-8">
      <Link to="/" className="absolute left-6 top-6">
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-primary-200 rounded-3xl shadow text-surface-700 font-medium text-sm">
          <ChevronLeftIcon className="w-4 h-4" />
          Retour a l'accueil
        </button>
      </Link>

      <div className="bg-white/95 rounded-3xl border-2 border-primary-200/50 shadow-2xl p-8 md:p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 shadow-lg mb-5">
            <Logo size="large" showText={false} />
          </div>
          <h1 className="text-3xl font-bold text-surface-900 mb-2">Compte parent</h1>
          <p className="text-sm text-surface-600">Creez un compte pour suivre et accompagner vos enfants.</p>
        </div>

        {error && (
          <div className="mb-5 rounded-3xl border-2 border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Nom d'utilisateur</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full pl-10 pr-4 py-3.5 border-2 border-primary-200/50 rounded-3xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Mot de passe</label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full pl-10 pr-4 py-3.5 border-2 border-primary-200/50 rounded-3xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Confirmer le mot de passe</label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full pl-10 pr-4 py-3.5 border-2 border-primary-200/50 rounded-3xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-3xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-bold shadow-lg disabled:opacity-60"
          >
            {loading ? 'Creation...' : 'Creer mon compte parent'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-surface-600">
          Vous avez deja un compte ?{' '}
          <Link to="/parent/login" className="font-bold text-primary-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ParentSignUp;
