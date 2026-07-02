import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getKidCategory } from '../constants/kidCategories';
import { ChevronLeftIcon, LogOutIcon } from '../components/Icons';
import { Logo } from '../components/Logo';

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
            className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-red-500 shadow-md transition hover:bg-red-50"
            aria-label="Deconnexion"
          >
            <LogOutIcon className="h-6 w-6" />
          </button>
        </header>

        <Link
          to="/kids"
          className="mb-5 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-4 py-3 font-black text-neutral-800 shadow-md transition hover:bg-neutral-50"
        >
          <ChevronLeftIcon className="h-6 w-6" />
          <span>Retour</span>
        </Link>

        <motion.main
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className={`grid min-h-[55vh] place-items-center rounded-[2rem] bg-gradient-to-br ${category.gradient} p-8 text-center text-white shadow-xl ring-4 ${category.ring}`}
        >
          <div>
            <div className="mx-auto mb-6 grid h-32 w-32 place-items-center rounded-[2rem] bg-white/25 text-7xl shadow-inner backdrop-blur">
              {category.pictogram}
            </div>
            <h1 className="text-5xl font-black leading-tight sm:text-6xl">
              {category.label}
            </h1>
          </div>
        </motion.main>
      </div>
    </div>
  );
}

export default KidsCategoryPage;
