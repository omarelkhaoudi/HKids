import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { KID_CATEGORIES } from '../constants/kidCategories';
import { KidCategoryCard } from '../components/kids/KidCategoryCard';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { Logo } from '../components/Logo';
import { AudioIcon, BookIcon, LogOutIcon, SparklesIcon } from '../components/Icons';

function KidsHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/parent/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-rose-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link to="/kids" className="shrink-0">
            <Logo size="default" showText={true} />
          </Link>
          <button
            onClick={handleLogout}
            className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-red-500 shadow-md transition hover:bg-red-50"
            aria-label="Deconnexion"
          >
            <LogOutIcon className="h-6 w-6" />
          </button>
        </header>

        <section className="mb-7 overflow-hidden rounded-[2rem] bg-gradient-to-br from-red-500 via-pink-500 to-orange-400 p-5 text-white shadow-xl sm:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-black backdrop-blur">
                <SparklesIcon className="h-5 w-5" />
                <span>{user?.username || 'Bienvenue'}</span>
              </div>
              <h1 className="text-5xl font-black leading-tight sm:text-6xl">
                Choisis
              </h1>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Link
                to="/kids/story-studio"
                aria-label="Creer une histoire"
                className="grid min-h-24 min-w-24 place-items-center rounded-[1.75rem] bg-neutral-900 p-4 text-white shadow-lg transition hover:bg-neutral-800"
              >
                <SparklesIcon className="h-10 w-10" />
                <span className="text-sm font-black">Creer</span>
              </Link>
              <Link
                to="/kids/ai-stories"
                aria-label="Mes histoires IA"
                className="grid min-h-24 min-w-24 place-items-center rounded-[1.75rem] bg-white p-4 text-blue-600 shadow-lg transition hover:bg-blue-50"
              >
                <BookIcon className="h-10 w-10" />
                <span className="text-sm font-black">Mes IA</span>
              </Link>
              <Link
                to="/content-library"
                aria-label="Histoires a ecouter"
                className="grid min-h-24 min-w-24 place-items-center rounded-[1.75rem] bg-white p-4 text-red-600 shadow-lg transition hover:bg-red-50"
              >
                <AudioIcon className="h-10 w-10" />
                <span className="text-sm font-black">Audio</span>
              </Link>
            </div>
          </div>
        </section>

        <main>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black text-neutral-900">Univers</h2>
            <Link
              to="/content-library"
              aria-label="Ouvrir la bibliotheque"
              className="grid h-16 w-16 place-items-center rounded-2xl bg-neutral-900 text-white shadow-md transition hover:bg-neutral-800"
            >
              <BookIcon className="h-8 w-8" />
            </Link>
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.06 },
              },
            }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {KID_CATEGORIES.map((category) => (
              <motion.div
                key={category.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <KidCategoryCard category={category} />
              </motion.div>
            ))}
          </motion.div>
        </main>
      </div>
      <VoiceAssistant />
    </div>
  );
}

export default KidsHome;
