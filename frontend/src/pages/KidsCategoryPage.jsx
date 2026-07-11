import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { booksAPI } from '../api/books';
import { learningAPI } from '../api/learning';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getKidCategory } from '../constants/kidCategories';
import { getCategoryContentStrategy, bookMatchesKidCategory } from '../utils/kidCategoryContent';
import { getKidsContentPath } from '../utils/contentRouting';
import { BookIcon, ChevronLeftIcon, LogOutIcon, PlayIcon } from '../components/Icons';
import { Logo } from '../components/Logo';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { KidsMediaCard } from '../components/kids/KidsMediaCard';
import { KidsEmptyState } from '../components/kids/KidsEmptyState';

function KidsCategoryPage() {
  const { categoryId } = useParams();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const category = getKidCategory(categoryId, language);
  const strategy = getCategoryContentStrategy(categoryId);

  const [books, setBooks] = useState([]);
  const [learningItems, setLearningItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!category) return;
    let active = true;
    setLoading(true);

    const loaders = [booksAPI.getPublishedBooks({ language })];

    if (strategy.type === 'learning') {
      loaders.push(learningAPI.getContents({ language }));
    } else if (strategy.type === 'audio') {
      loaders.push(Promise.resolve({ data: [] }));
    } else {
      loaders.push(Promise.resolve({ data: [] }));
    }

    Promise.all(loaders)
      .then(([booksRes, learningRes]) => {
        if (!active) return;
        let nextBooks = booksRes.data || [];

        if (strategy.type === 'audio') {
          nextBooks = nextBooks.filter((book) => book.content_type === strategy.contentType);
        } else if (strategy.type === 'books') {
          nextBooks = nextBooks.filter((book) => bookMatchesKidCategory(book, strategy));
        }

        setBooks(nextBooks);

        if (strategy.type === 'learning') {
          const items = (learningRes?.data || []).filter(
            (item) => item.category_code === strategy.categoryCode || item.content_type === strategy.categoryCode
          );
          setLearningItems(items);
        } else {
          setLearningItems([]);
        }
      })
      .catch(() => {
        if (active) {
          setBooks([]);
          setLearningItems([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [categoryId, language, category, strategy.type, strategy.contentType, strategy.categoryCode]);

  const listPath = useMemo(() => {
    if (strategy.type === 'audio') return '/kids/audio?type=song';
    if (strategy.type === 'learning') return '/kids/learning';
    return `/kids/library?theme=${categoryId}`;
  }, [strategy.type, categoryId]);

  if (!category) {
    return <Navigate to="/kids" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/parent/login');
  };

  const hasContent = books.length > 0 || learningItems.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-rose-50 pb-32">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link to="/kids" className="shrink-0">
            <Logo size="default" showText={true} />
          </Link>
          <button
            onClick={handleLogout}
            className="grid h-12 w-12 place-items-center rounded-2xl bg-card text-foreground-500 shadow-md transition hover:bg-primary-50"
            aria-label="Deconnexion"
          >
            <LogOutIcon className="h-6 w-6" />
          </button>
        </header>

        <Link
          to="/kids"
          className="mb-5 inline-flex min-h-16 items-center gap-3 rounded-2xl bg-card px-5 py-4 font-black text-foreground shadow-md transition hover:bg-surface-secondary"
          aria-label={t('back')}
        >
          <ChevronLeftIcon className="h-8 w-8" />
          <span className="text-lg">{t('back')}</span>
        </Link>

        <motion.main
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-[2rem] bg-gradient-to-br ${category.gradient} p-8 text-center text-white shadow-xl ring-4 ${category.ring} mb-8`}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="mx-auto mb-6 grid h-36 w-36 place-items-center rounded-[2rem] bg-card/25 text-8xl shadow-inner backdrop-blur"
          >
            {category.pictogram}
          </motion.div>
          <h1 className="text-5xl font-black leading-tight sm:text-6xl">
            {category.shortLabel || category.label}
          </h1>
          <Link
            to={listPath}
            className="mx-auto mt-8 inline-flex min-h-20 min-w-52 items-center justify-center gap-4 rounded-[1.75rem] bg-card px-8 text-2xl font-black text-foreground shadow-xl transition hover:scale-105"
          >
            <BookIcon className="h-9 w-9" />
            <span>{t('discover')}</span>
          </Link>
        </motion.main>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 rounded-[2rem] bg-card animate-pulse border border-border" />
            ))}
          </div>
        ) : !hasContent ? (
          <KidsEmptyState
            emoji={category.pictogram}
            title={t('nothingFound')}
            description={t('emptyBooksDescription')}
            actionLabel={t('goToLibrary')}
            onAction={() => navigate('/kids/library')}
          />
        ) : (
          <div className="space-y-8">
            {books.length > 0 && (
              <section>
                <h2 className="text-2xl font-black mb-4 text-foreground">{t('library')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {books.slice(0, 6).map((book) => (
                    <KidsMediaCard key={book.id} book={book} variant="poster" hideTitle onPlay={(b) => navigate(getKidsContentPath(b))} />
                  ))}
                </div>
              </section>
            )}
            {learningItems.length > 0 && (
              <section>
                <h2 className="text-2xl font-black mb-4 text-foreground">{t('kidsNavLearning')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {learningItems.slice(0, 6).map((item) => (
                    <motion.button
                      key={item.id}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/kids/learning')}
                      className={`rounded-[2rem] bg-gradient-to-br ${item.category_color || 'from-sky-500 to-cyan-400'} p-5 text-left text-white shadow-lg min-h-40`}
                    >
                      <span className="text-4xl">{item.category_pictogram || '⭐'}</span>
                      <p className="mt-3 font-black text-lg">{item.title}</p>
                      <PlayIcon className="h-6 w-6 mt-2" filled />
                    </motion.button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
      <VoiceAssistant onNavigate={navigate} />
      <KidsBottomNav />
    </div>
  );
}

export default KidsCategoryPage;
