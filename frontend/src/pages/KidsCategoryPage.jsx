import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getKidCategory } from '../constants/kidCategories';
import { BookIcon, ChevronLeftIcon, LogOutIcon } from '../components/Icons';
import { Logo } from '../components/Logo';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';

function KidsCategoryPage() {
  const { categoryId } = useParams();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const category = getKidCategory(categoryId);

  if (!category) {
    return <Navigate to="/kids" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/parent/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-rose-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link to="/kids" className="shrink-0">
            <Logo size="default" showText={true} />
          </Link>
          <button
            onClick={handleLogout}
            className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-primary-500 shadow-md transition hover:bg-primary-50"
            aria-label="Deconnexion"
          >
            <LogOutIcon className="h-6 w-6" />
          </button>
        </header>

        <Link
          to="/kids"
          className="mb-5 inline-flex min-h-16 items-center gap-3 rounded-2xl bg-white px-5 py-4 font-black text-surface-800 shadow-md transition hover:bg-surface-50"
          aria-label="Retour accueil"
        >
          <ChevronLeftIcon className="h-8 w-8" />
          <span className="text-lg">Retour</span>
        </Link>

        <motion.main
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className={`grid min-h-[55vh] place-items-center rounded-[2rem] bg-gradient-to-br ${category.gradient} p-8 text-center text-white shadow-xl ring-4 ${category.ring}`}
        >
          <div>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto mb-6 grid h-36 w-36 place-items-center rounded-[2rem] bg-white/25 text-8xl shadow-inner backdrop-blur"
            >
              {category.pictogram}
            </motion.div>
            <h1 className="text-5xl font-black leading-tight sm:text-6xl">
              {category.shortLabel || category.label}
            </h1>
            <Link
              to="/kids/library"
              className="mx-auto mt-8 inline-flex min-h-20 min-w-52 items-center justify-center gap-4 rounded-[1.75rem] bg-white px-8 text-2xl font-black text-surface-900 shadow-xl transition hover:scale-105"
              aria-label={`Voir les histoires ${category.label}`}
            >
              <BookIcon className="h-9 w-9" />
              <span>Histoires</span>
            </Link>
          </div>
        </motion.main>
      </div>
      <VoiceAssistant />
    </div>
  );
}

export default KidsCategoryPage;
