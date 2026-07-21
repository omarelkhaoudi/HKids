import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { booksAPI } from '../api/books';
import { learningAPI } from '../api/learning';
import { useLanguage } from '../context/LanguageContext';
import { getKidCategory } from '../constants/kidCategories';
import { getCategoryContentStrategy, bookMatchesKidCategory } from '../utils/kidCategoryContent';
import { getKidsContentPath } from '../utils/contentRouting';
import { storage } from '../utils/storage';
import { ChevronLeftIcon, PlayIcon } from '../components/Icons';
import { Logo } from '../components/Logo';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { KidsPageShell } from '../components/kids/KidsPageShell';
import { KidsBookCarousel } from '../components/kids/KidsBookCarousel';
import { KidsEmptyState } from '../components/kids/KidsEmptyState';
import { KidsCategoryAtmosphere } from '../components/kids/KidsCategoryAtmosphere';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { useToast } from '../components/ToastProvider';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { getMotionProps, kidsCategoryEnter } from '../constants/kidsMotion';

function KidsCategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { language, isRtl, t } = useLanguage();
  const { showToast } = useToast();
  const reducedMotion = useReducedMotion();
  const category = getKidCategory(categoryId, language);
  const strategy = getCategoryContentStrategy(categoryId);
  const favoritesIds = storage.getFavorites();

  const [books, setBooks] = useState([]);
  const [learningItems, setLearningItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!category) return undefined;
    let active = true;
    setLoading(true);

    const loaders = [booksAPI.getPublishedBooks({ language })];

    if (strategy.type === 'learning') {
      loaders.push(learningAPI.getContents({ language }));
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

        setBooks(nextBooks.map((book) => ({ ...book, _themeEmoji: category.pictogram })));

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
          showToast(t('loadError'), 'error');
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
  const featuredActionLabel = strategy.type === 'audio' ? t('listenAction') : t('readAction');

  return (
    <KidsPageShell isRtl={isRtl} variant="library" world="books" className="pb-32 kids-glow-books relative" footer={<KidsBottomNav />}>
      <KidsCategoryAtmosphere categoryId={categoryId} />

      <header className="relative z-10 px-6 py-4 flex items-center justify-between">
        <Link to="/kids" className="shrink-0 transition-transform hover:scale-105">
          <Logo size="default" showText={false} />
        </Link>
        <span className="text-4xl" aria-hidden="true">{category.pictogram}</span>
      </header>

      <div className="kids-main relative z-10">
        <Link
          to="/kids"
          className="kids-icon-action self-start"
          aria-label={t('back')}
        >
          <ChevronLeftIcon className={isRtl ? 'rotate-180' : ''} />
        </Link>

        <motion.main
          {...getMotionProps(reducedMotion, kidsCategoryEnter)}
          className={`relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${category.gradient} p-8 md:p-12 text-center text-white shadow-kids-soft ring-4 ${category.ring}`}
        >
          <div className="absolute -right-10 -top-10 text-[12rem] opacity-20 pointer-events-none" aria-hidden="true">
            {category.pictogram}
          </div>
          <motion.div
            animate={reducedMotion ? undefined : { y: [0, -10, 0] }}
            transition={reducedMotion ? undefined : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="mx-auto mb-4 grid h-36 w-36 md:h-44 md:w-44 place-items-center rounded-[2rem] bg-white/30 text-8xl md:text-9xl shadow-inner backdrop-blur"
            aria-hidden="true"
          >
            {category.pictogram}
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black leading-tight drop-shadow-md line-clamp-2">
            {category.shortLabel || category.label}
          </h1>

          {featuredBook && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(getKidsContentPath(featuredBook))}
              className="kids-touch-target mx-auto mt-8 inline-flex min-w-52 items-center justify-center gap-4 rounded-[1.75rem] bg-white px-8 py-4 text-xl md:text-2xl font-black text-foreground shadow-xl"
              aria-label={featuredActionLabel}
            >
              <PlayIcon className={`h-9 w-9 text-primary-500 ${isRtl ? 'rotate-180' : ''}`} filled />
              <span>{featuredActionLabel}</span>
            </motion.button>
          )}
        </motion.main>

        {loading ? (
          <BookGridSkeleton count={6} variant="carousel" />
        ) : !hasContent ? (
          <KidsEmptyState
            emoji={category.pictogram}
            title={t('nothingFound')}
            description={t('emptyBooksDescription')}
            actionLabel={t('goToLibrary')}
            onAction={() => navigate(listPath)}
            showMascot
          />
        ) : (
          <div className="space-y-10">
            {books.length > 0 && (
              <div className="kids-shelf-rail">
                <KidsBookCarousel
                  title={category.shortLabel || category.label}
                  emoji={category.pictogram}
                  books={books}
                  isRtl={isRtl}
                  favorites={favoritesIds}
                  showActions={false}
                  hideTitle={false}
                  modality="books"
                  onPlay={(b) => navigate(getKidsContentPath(b))}
                />
              </div>
            )}
            {learningItems.length > 0 && (
              <section>
                <h2 className="kids-shelf-title mb-5 px-2">
                  <span aria-hidden="true">🎮</span>
                  <span className="sr-only sm:not-sr-only">{t('kidsNavLearning')}</span>
                </h2>
                <div className="flex gap-5 overflow-x-auto pb-4 px-2 snap-x snap-mandatory custom-scrollbar">
                  {learningItems.slice(0, 8).map((item) => (
                    <motion.button
                      key={item.id}
                      type="button"
                      whileHover={{ scale: 1.03, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/kids/learning')}
                      className={`kids-touch-target snap-start shrink-0 w-44 md:w-52 rounded-[2rem] bg-gradient-to-br ${item.category_color || 'from-secondary-500 to-primary-500'} p-5 text-center text-white shadow-kids-soft min-h-44 border-4 border-white/40`}
                      aria-label={item.title}
                    >
                      <span className="text-6xl" aria-hidden="true">{item.category_pictogram || '⭐'}</span>
                      <PlayIcon className="h-8 w-8 mt-4 mx-auto" filled />
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
