import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ChevronLeftIcon, LockIcon, UserIcon, AlertIcon, LoadingSpinnerIcon, CheckCircleIcon, StarIcon, EyeIcon, EyeOffIcon } from '../components/Icons';
import { Logo } from '../components/Logo';

// Helper for password strength
const getPasswordStrength = (pass) => {
  if (!pass) return { score: 0, label: '', color: 'bg-surface-200' };
  let score = 0;
  if (pass.length > 5) score += 1;
  if (pass.length > 8) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  
  if (score <= 1) return { score, label: 'Faible', color: 'bg-red-400' };
  if (score === 2) return { score, label: 'Moyen', color: 'bg-yellow-400' };
  if (score === 3) return { score, label: 'Bon', color: 'bg-blue-400' };
  return { score, label: 'Fort', color: 'bg-green-500' };
};

export default function ParentSignUp() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const strength = getPasswordStrength(password);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      setError("Le nom d'utilisateur doit contenir au moins 3 caractères.");
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (!termsAccepted) {
      setError('Vous devez accepter les conditions d\'utilisation.');
      return;
    }

    setLoading(true);
    const result = await signup(username.trim(), password, 'parent');
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Création du compte impossible.");
      return;
    }

    // Success animation before navigation
    setSuccess(true);
    setTimeout(() => {
      navigate('/parent/login');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden font-sans">
      
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-50">
        <Link to="/">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-surface-200 rounded-[1.5rem] shadow-sm text-surface-700 font-bold text-sm hover:text-surface-900 hover:shadow-md transition-all"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Retour
          </motion.button>
        </Link>
      </div>

      {/* LEFT PANEL: Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-secondary-50 via-secondary-100/40 to-primary-50 items-center justify-center p-12 overflow-hidden border-r border-secondary-100">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-300/20 blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary-300/20 blur-[120px]"></div>
          
          {mounted && Array.from({ length: 8 }).map((_, i) => (
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
                rotate: [0, -10, 0]
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

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 w-full max-w-lg flex flex-col items-center text-center"
        >
          {/* Glassmorphic Image Container */}
          <div className="relative w-full aspect-square mb-12">
            <div className="absolute inset-4 bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-white shadow-[0_30px_60px_-15px_rgba(72,175,202,0.15)] overflow-hidden flex items-center justify-center p-6">
              {/* Using a different existing asset for signup to mix it up */}
              <img 
                src="/enfant 5 8ans.webp" 
                alt="Enfant heureux" 
                className="w-full h-full object-contain filter drop-shadow-2xl"
                onError={(e) => { e.currentTarget.src = '/enfant3ans.webp' }}
              />
              
              <motion.div 
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-xl">🎓</div>
                <div className="text-left">
                  <div className="text-sm font-extrabold text-surface-900">Éducatif</div>
                  <div className="text-xs font-bold text-surface-500">100% Bienveillant</div>
                </div>
              </motion.div>
            </div>
          </div>

          <h2 className="text-4xl lg:text-5xl font-extrabold text-surface-900 tracking-tight leading-[1.1] mb-4">
            Commencez<br/>l'aventure.
          </h2>
          <p className="text-lg text-surface-600 font-medium max-w-sm">
            Créez votre compte pour offrir des histoires magiques personnalisées.
          </p>
        </motion.div>
      </div>

      {/* RIGHT PANEL: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-20 relative bg-white">
        
        <div className="w-full max-w-[420px] mx-auto">
          {/* Mobile Header */}
          <div className="lg:hidden flex flex-col items-center text-center mb-10 pt-16">
            <div className="w-16 h-16 rounded-3xl bg-secondary-50 flex items-center justify-center mb-6">
              <Logo size="small" showText={false} />
            </div>
            <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight mb-2">Inscription</h1>
            <p className="text-surface-600 font-medium">Créez votre compte parent</p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-secondary-500 to-secondary-600 shadow-lg flex items-center justify-center mb-8">
              <Logo size="small" showText={false} className="text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight mb-2">Créer un compte</h1>
            <p className="text-surface-600 font-medium">Rejoignez-nous en quelques clics.</p>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-6"
                >
                  <CheckCircleIcon className="w-12 h-12" />
                </motion.div>
                <h3 className="text-2xl font-bold text-surface-900 mb-2">Compte créé !</h3>
                <p className="text-surface-600">Préparation de votre espace magique...</p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="mb-8 p-4 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-2xl flex items-start gap-3 shadow-sm"
                    >
                      <AlertIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold text-red-700 leading-relaxed">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Username Input */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-surface-700 ml-1">
                      Nom d'utilisateur
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-secondary-500 transition-colors">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-surface-50 border-2 border-surface-100 rounded-[1.5rem] focus:bg-white focus:border-secondary-500 focus:ring-4 focus:ring-secondary-500/10 transition-all font-medium text-surface-900 placeholder:text-surface-400 outline-none"
                        placeholder="Ex: Sophie.M"
                        required
                        minLength={3}
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-surface-700 ml-1">
                      Mot de passe
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-secondary-500 transition-colors">
                        <LockIcon className="w-5 h-5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-14 py-4 bg-surface-50 border-2 border-surface-100 rounded-[1.5rem] focus:bg-white focus:border-secondary-500 focus:ring-4 focus:ring-secondary-500/10 transition-all font-medium text-surface-900 placeholder:text-surface-400 outline-none"
                        placeholder="Créer un mot de passe (min. 6)"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-200 text-surface-400 hover:text-surface-700 transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                    {/* Password Strength Indicator */}
                    {password.length > 0 && (
                      <div className="px-2 pt-1 flex items-center gap-2">
                        <div className="flex-1 flex gap-1 h-1.5 rounded-full overflow-hidden bg-surface-100">
                          {[1, 2, 3, 4].map((level) => (
                            <div 
                              key={level} 
                              className={`flex-1 transition-all duration-300 ${level <= strength.score ? strength.color : 'bg-transparent'}`}
                            />
                          ))}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${password.length >= 6 ? 'text-surface-500' : 'text-red-400'}`}>
                          {password.length < 6 ? 'Trop court' : strength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-surface-700 ml-1">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-secondary-500 transition-colors">
                        <LockIcon className="w-5 h-5" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-12 pr-14 py-4 bg-surface-50 border-2 rounded-[1.5rem] focus:bg-white focus:ring-4 outline-none transition-all font-medium text-surface-900 placeholder:text-surface-400 ${
                          confirmPassword && password !== confirmPassword 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' 
                            : 'border-surface-100 focus:border-secondary-500 focus:ring-secondary-500/10'
                        }`}
                        placeholder="Répétez le mot de passe"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-200 text-surface-400 hover:text-surface-700 transition-colors focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="pt-2 pb-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative w-6 h-6 shrink-0 mt-0.5 rounded-lg border-2 border-surface-300 group-hover:border-secondary-500 flex items-center justify-center transition-colors">
                        <input 
                          type="checkbox" 
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="peer absolute opacity-0 w-full h-full cursor-pointer" 
                        />
                        <div className="w-full h-full bg-secondary-500 rounded-[6px] opacity-0 peer-checked:opacity-100 flex items-center justify-center transition-opacity">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-surface-600 leading-snug">
                        J'accepte les <span className="text-secondary-600 hover:underline">conditions d'utilisation</span> et la <span className="text-secondary-600 hover:underline">politique de confidentialité</span> de HKids.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading || !termsAccepted}
                    whileHover={{ scale: (loading || !termsAccepted) ? 1 : 1.01 }}
                    whileTap={{ scale: (loading || !termsAccepted) ? 1 : 0.99 }}
                    className="w-full mt-6 py-4 bg-secondary-500 hover:bg-secondary-600 text-white rounded-[1.5rem] font-bold text-lg shadow-[0_8px_20px_-6px_rgba(72,175,202,0.4)] hover:shadow-[0_12px_25px_-6px_rgba(72,175,202,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2 group relative overflow-hidden"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinnerIcon className="w-6 h-6 animate-spin" />
                        <span>Création...</span>
                      </>
                    ) : (
                      <>
                        <span className="relative z-10">Créer mon compte</span>
                        {termsAccepted && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                        )}
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Login link */}
                <div className="mt-8 text-center">
                  <p className="text-surface-600 font-medium">
                    Vous avez déjà un compte ?{' '}
                    <Link to="/parent/login" className="text-secondary-600 font-bold hover:text-secondary-700 hover:underline inline-flex items-center gap-1 transition-colors">
                      Se connecter <ChevronLeftIcon className="w-3 h-3 rotate-180" />
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
