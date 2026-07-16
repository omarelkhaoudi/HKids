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
import { BookIcon, ChevronLeftIcon, PlayIcon } from '../components/Icons';
import { Logo } from '../components/Logo';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { KidsPageShell } from '../components/kids/KidsPageShell';
import { KidsMediaCard } from '../components/kids/KidsMediaCard';
import { KidsEmptyState } from '../components/kids/KidsEmptyState';
import { BookGridSkeleton } from '../components/SkeletonLoader';

function KidsCategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { language, isRtl, t } = useLanguage();
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

  const hasContent = books.length > 0 || learningItems.length > 0;
  const featuredBook = books[0] || null;

  return (
    <KidsPageShell isRtl={isRtl} variant="library" className="pb-32 kids-hero-glow" footer={<KidsBottomNav />}>
      <header className="relative z-10 px-6 py-4 flex items-center justify-between">
        <Link to="/kids" className="shrink-0 transition-transform hover:scale-105">
          <Logo size="default" showText={false} />
        </Link>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link
          to="/kids"
          className="mb-5 inline-flex kids-touch-target items-center gap-3 rounded-[1.75rem] kids-premium-panel px-5 py-3 font-black text-foreground shadow-md transition hover:scale-[1.02]"
          aria-label={t('back')}
        >
          <ChevronLeftIcon className={`h-8 w-8 ${isRtl ? 'rotate-180' : ''}`} />
          <span className="text-lg">{t('back')}</span>
        </Link>

        <motion.main
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${category.gradient} p-8 md:p-12 text-center text-white shadow-kids-soft ring-4 ${category.ring} mb-10`}
        >
          <div className="absolute -right-10 -top-10 text-[12rem] opacity-20 pointer-events-none" aria-hidden="true">
            {category.pictogram}
          </div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="mx-auto mb-6 grid h-40 w-40 md:h-44 md:w-44 place-items-center rounded-[2rem] bg-white/30 text-8xl md:text-9xl shadow-inner backdrop-blur"
          >
            {category.pictogram}
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight drop-shadow-md">
            {category.shortLabel || category.label}
          </h1>
          <p className="mt-3 text-lg md:text-xl font-bold text-white/90 max-w-lg mx-auto">
            {category.label}
          </p>

          {featuredBook && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(getKidsContentPath(featuredBook))}
              className="kids-touch-target mx-auto mt-8 inline-flex min-w-52 items-center justify-center gap-4 rounded-[1.75rem] bg-white px-8 py-4 text-xl md:text-2xl font-black text-foreground shadow-xl"
            >
              <PlayIcon className={`h-9 w-9 text-primary-500 ${isRtl ? 'rotate-180' : ''}`} filled />
              <span>{t('listenAction')}</span>
            </motion.button>
          )}

          <Link
            to={listPath}
            className="kids-touch-target mx-auto mt-4 inline-flex min-w-52 items-center justify-center gap-3 rounded-[1.75rem] bg-white/20 backdrop-blur px-6 py-3 text-lg font-black text-white border-2 border-white/40"
          >
            <BookIcon className="h-7 w-7" />
            <span>{t('discover')}</span>
          </Link>
        </motion.main>

        {loading ? (
          <BookGridSkeleton count={6} />
        ) : !hasContent ? (
          <KidsEmptyState
            emoji={category.pictogram}
            title={t('nothingFound')}
            description={t('emptyBooksDescription')}
            actionLabel={t('goToLibrary')}
            onAction={() => navigate('/kids/library')}
          />
        ) : (
          <div className="space-y-10">
            {books.length > 0 && (
              <section>
                <h2 className="kids-shelf-title mb-5">
                  <span aria-hidden="true">{category.pictogram}</span>
                  <span>{t('library')}</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5 justify-items-center">
                  {books.slice(0, 9).map((book) => (
                    <KidsMediaCard
                      key={book.id}
                      book={book}
                      variant="poster"
                      hideTitle
                      isRtl={isRtl}
                      onPlay={(b) => navigate(getKidsContentPath(b))}
                    />
                  ))}
                </div>
              </section>
            )}
            {learningItems.length > 0 && (
              <section>
                <h2 className="kids-shelf-title mb-5">
                  <span aria-hidden="true">🎮</span>
                  <span>{t('kidsNavLearning')}</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {learningItems.slice(0, 6).map((item) => (
                    <motion.button
                      key={item.id}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/kids/learning')}
                      className={`kids-touch-target rounded-[2rem] bg-gradient-to-br ${item.category_color || 'from-primary-500 to-secondary-500'} p-5 text-left text-white shadow-kids-soft min-h-44 border-4 border-white/30`}
                    >
                      <span className="text-5xl">{item.category_pictogram || '⭐'}</span>
                      <p className="mt-3 font-black text-lg line-clamp-2">{item.title}</p>
                      <PlayIcon className="h-7 w-7 mt-3" filled />
                    </motion.button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <VoiceAssistant onNavigate={navigate} />
    </KidsPageShell>
  );
}

export default KidsCategoryPage;
