import {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import {booksAPI} from '../api/books';
import {storage} from '../utils/storage';
import {useToast} from '../components/ToastProvider';
import {BookGridSkeleton} from '../components/SkeletonLoader';
import {ChevronLeftIcon, TrashIcon} from '../components/Icons';
import {Logo} from '../components/Logo';
import {KidsBookCover} from '../components/kids/KidsBookCover';
import {useLanguage} from '../context/LanguageContext';
import {useAuth} from '../context/AuthContext';
import {KidsPageShell} from '../components/kids/KidsPageShell';
import {KidsPageHeader} from '../components/kids/KidsPageHeader';
import {KidsHero} from '../components/kids/KidsHero';
import {KidsBottomNav} from '../components/kids/KidsBottomNav';
import {KidsEmptyState} from '../components/kids/KidsEmptyState';
import {KidsBookCarousel} from '../components/kids/KidsBookCarousel';
import {KidsModal} from '../components/kids/KidsModal';
import {getKidsContentPath} from '../utils/contentRouting';
import {VoiceAssistant} from '../components/kids/VoiceAssistant';
import {PlatformShell} from '../components/layout/PlatformShell';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {getMotionProps, kidsCardAppear, kidsPageEnter} from '../constants/kidsMotion';

function History() {
 const [history, setHistory] = useState([]);
 const [books, setBooks] = useState([]);
 const [loading, setLoading] = useState(true);
 const [showClearModal, setShowClearModal] = useState(false);
 const {language, isRtl, t} = useLanguage();
 const {user} = useAuth();
 const navigate = useNavigate();
 const reducedMotion = useReducedMotion();
 const isKidMode = user?.role === 'kid';

 useEffect(() => {
 loadHistory();
}, [language]);

 const loadHistory = async () => {
 try {
 setLoading(true);
 const historyData = storage.getReadingHistory();
 setHistory(historyData);

 if (historyData.length > 0) {
 // Charger les détails des livres
 const bookIds = historyData.map(h => h.bookId);
 const response = await booksAPI.getPublishedBooks({language});
 const historyBooks = response.data.filter(book => bookIds.includes(book.id));
 
 // Pour les livres manquants (non publiés), charger individuellement
 const missingBookIds = bookIds.filter(id => !historyBooks.find(b => b.id === id));
 const missingBooks = await Promise.all(
 missingBookIds.map(async (id) => {
 try {
 const bookResponse = await booksAPI.getBook(id);
 return bookResponse.data;
} catch (err) {
 console.warn(`[History] Could not load book ${id}:`, err);
 return null;
}
})
 );
 
 // Combiner les livres trouvés
 const allBooks = [...historyBooks, ...missingBooks.filter(Boolean)];
 
 // Trier selon l'ordre de l'historique
 const sorted = historyData.map(h => 
 allBooks.find(b => b.id === h.bookId)
 ).filter(Boolean);
 
 setBooks(sorted);
}
} catch (error) {
 console.error('Error loading history:', error);
} finally {
 setLoading(false);
}
};

 const {showToast} = useToast();

 const clearHistory = () => {
 storage.clearReadingHistory();
 setHistory([]);
 setBooks([]);
 showToast(t('historyCleared'), 'info', 2000);
 setShowClearModal(false);
};

 const handlePlayBook = (book) => {
  const historyItem = history.find((h) => h.bookId === book.id);
  const pageQuery = historyItem?.page ? `?page=${historyItem.page}` : '';
  if (book.id) {
   navigate(`/kids/read/${book.id}${pageQuery}`);
  } else {
   navigate(getKidsContentPath(book));
  }
 };

 const formatDate = (dateString) => {
 const date = new Date(dateString);
 const now = new Date();
 const diff = now - date;
 const days = Math.floor(diff / (1000 * 60 * 60 * 24));
 const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-US' : 'fr-FR';

 if (days === 0) return t('today');
 if (days === 1) return t('yesterday');
 if (days < 7) return t('daysAgo', { count: days });
 return date.toLocaleDateString(locale);
};

 // Calculer les statistiques
 const totalPagesRead = history.reduce((sum, h) => sum + (h.page || 0), 0);
 const uniqueBooks = books.length;
 const avgPagesPerBook = uniqueBooks > 0 ? Math.round(totalPagesRead / uniqueBooks) : 0;

 if (isKidMode) {
  return (
   <KidsPageShell isRtl={isRtl} variant="library" world="books" className="pb-32 kids-glow-books" footer={<KidsBottomNav />}>
    <KidsPageHeader
     backTo="/kids"
     emoji="📖"
     title={t('history')}
     trailing={books.length > 0 ? (
      <button
       type="button"
       onClick={() => setShowClearModal(true)}
       className="kids-touch-target rounded-full bg-rose-100 text-rose-700 px-4 py-2 font-black text-sm"
       aria-label={t('clearHistory')}
      >
        🗑️
      </button>
     ) : null}
    />
    <main className="kids-main kids-main-tablet-wide relative z-20">
     <KidsHero modality="books" emoji="📖" title={t('history')} subtitle={t('continueReading')} />
     {loading ? (
      <BookGridSkeleton count={6} variant="carousel" />
     ) : books.length === 0 ? (
      <KidsEmptyState
       emoji="📖"
       title={t('emptyHistoryTitle')}
       description={t('emptyHistoryDescription')}
       actionLabel={t('goToLibrary')}
       onAction={() => navigate('/kids/library')}
       showMascot
       mascotMood="encourage"
      />
     ) : (
      <KidsBookCarousel
       title={t('continueReading')}
       emoji="📖"
       books={books}
       isRtl={isRtl}
       showActions={false}
       hideTitle
       modality="books"
       onPlay={handlePlayBook}
      />
     )}
    </main>
    <KidsModal
     isOpen={showClearModal}
     onClose={() => setShowClearModal(false)}
     emoji="🗑️"
     title={t('history')}
     primaryLabel={t('confirmAction')}
     onPrimary={clearHistory}
     secondaryLabel={t('back')}
     onSecondary={() => setShowClearModal(false)}
    >
      {t('historyClearConfirm')}
    </KidsModal>
    <VoiceAssistant onNavigate={navigate} />
   </KidsPageShell>
  );
 }

 return (
 <PlatformShell variant="platform" isRtl={isRtl} className="pb-24 parent-home-shell">
 <motion.div {...getMotionProps(reducedMotion, kidsPageEnter)}>
 <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border/50">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-3">
 <Logo size="default" isLink={false} />
 <div className="flex items-center gap-3">
  <Link to="/" className="text-foreground-secondary hover:text-foreground font-medium flex items-center gap-2 transition-colors">
   <ChevronLeftIcon className="w-5 h-5" />
   <span>{t('back')}</span>
  </Link>
  {books.length > 0 && (
   <button
    type="button"
    onClick={() => setShowClearModal(true)}
    className="min-h-[56px] min-w-[56px] px-4 py-3 rounded-3xl bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors font-semibold flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 touch-manipulation"
    aria-label={t('clearHistory')}
   >
    <TrashIcon className="w-5 h-5" />
   </button>
  )}
 </div>
 </div>
 </header>

 <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
 <motion.section {...getMotionProps(reducedMotion, kidsCardAppear)} className="parent-today-hero mb-8">
  <p className="parent-today-hero-kicker">{t('history')}</p>
  <h1 className="parent-today-hero-title">📖 {t('continueReading')}</h1>
  <p className="parent-today-hero-message">
   {books.length > 0
    ? `${uniqueBooks} ${t('featured').toLowerCase()} • ${totalPagesRead} ${t('pages')}`
    : t('emptyBooksDescription')}
  </p>
 </motion.section>

 {books.length > 0 && (
  <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
   <div className="parent-progress-spotlight">
    <p className="parent-progress-pill-label">{t('history')}</p>
    <p className="parent-progress-spotlight-value">{uniqueBooks}</p>
   </div>
   <div className="parent-progress-spotlight">
    <p className="parent-progress-pill-label">{t('pages')}</p>
    <p className="parent-progress-spotlight-value">{totalPagesRead}</p>
   </div>
   <div className="parent-progress-spotlight">
    <p className="parent-progress-pill-label">{t('page')}</p>
    <p className="parent-progress-spotlight-value">{avgPagesPerBook}</p>
   </div>
  </section>
 )}

 {loading ? (
  <BookGridSkeleton count={6} viewMode="list" />
 ) : books.length === 0 ? (
  <KidsEmptyState
   emoji="📖"
   title={t('emptyBooksTitle')}
   description={t('emptyBooksDescription')}
   actionLabel={t('goToLibrary')}
   onAction={() => navigate('/')}
   className="max-w-3xl mx-auto"
  />
 ) : (
  <div className="space-y-4">
   {books.map((book, index) => {
    const historyItem = history.find((h) => h.bookId === book.id);
    const progress = book.page_count > 0 ? Math.round((((historyItem?.page || 0) + 1) / book.page_count) * 100) : 0;

    return (
     <motion.article
      key={book.id}
      {...getMotionProps(reducedMotion, {
       ...kidsCardAppear,
       transition: { ...kidsCardAppear.transition, delay: index * 0.04 },
      })}
      className="parent-warm-card p-4 sm:p-5 md:p-6"
     >
      <Link to={`/book-details/${book.id}`} className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
       <div className="w-24 h-32 sm:w-28 sm:h-36 rounded-2xl overflow-hidden shadow-lg border border-border relative bg-surface-secondary shrink-0">
        <KidsBookCover
         book={book}
         alt={book.title}
         imgClassName="absolute inset-0 w-full h-full object-cover"
        />
       </div>
       <div className="flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
         <div>
          <h3 className="font-bold text-xl text-foreground mb-1">{book.title}</h3>
          {book.author && (
           <p className="text-sm text-foreground-secondary font-medium">{book.author}</p>
          )}
         </div>
         {historyItem && (
          <span className="kids-book-meta-pill whitespace-nowrap">{formatDate(historyItem.lastRead)}</span>
         )}
        </div>
        <div className="flex items-center gap-2 flex-wrap mb-4">
         {historyItem && historyItem.page > 0 && (
          <span className="kids-book-meta-pill kids-book-meta-pill--progress">
           {t('page')} {historyItem.page + 1}/{book.page_count || '?'}
          </span>
         )}
         {book.category_name && (
          <span className="kids-book-meta-pill">{book.category_name}</span>
         )}
         <span className="kids-book-meta-pill">{progress}%</span>
        </div>
        {historyItem && book.page_count > 0 && (
         <div className="kids-reader-timeline-track h-3 rounded-full overflow-hidden">
          <div className="kids-reader-timeline-fill h-full rounded-full" style={{ width: `${progress}%` }} />
         </div>
        )}
       </div>
      </Link>
     </motion.article>
    );
   })}
  </div>
 )}
 </main>
 <KidsModal
  isOpen={showClearModal}
  onClose={() => setShowClearModal(false)}
  emoji="🗑️"
  title={t('history')}
  primaryLabel={t('confirmAction')}
  onPrimary={clearHistory}
  secondaryLabel={t('back')}
  onSecondary={() => setShowClearModal(false)}
 >
  {t('historyClearConfirm')}
 </KidsModal>
 </motion.div>
 </PlatformShell>
 );
}

export default History;

