import {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import {booksAPI} from '../api/books';
import {storage} from '../utils/storage';
import {useToast} from '../components/ToastProvider';
import {BookGridSkeleton} from '../components/SkeletonLoader';
import {HeartIcon, ChevronLeftIcon} from '../components/Icons';
import {Logo} from '../components/Logo';
import {KidsBookCover} from '../components/kids/KidsBookCover';
import {useLanguage} from '../context/LanguageContext';
import {useAuth} from '../context/AuthContext';
import {KidsPageShell} from '../components/kids/KidsPageShell';
import {KidsPageHeader} from '../components/kids/KidsPageHeader';
import {KidsHero} from '../components/kids/KidsHero';
import {KidsBottomNav} from '../components/kids/KidsBottomNav';
import {KidsMediaCard} from '../components/kids/KidsMediaCard';
import {KidsEmptyState} from '../components/kids/KidsEmptyState';
import {KidsBookCarousel} from '../components/kids/KidsBookCarousel';
import {getKidsContentPath} from '../utils/contentRouting';
import {VoiceAssistant} from '../components/kids/VoiceAssistant';
import {PlatformShell} from '../components/layout/PlatformShell';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {getMotionProps, kidsCardAppear, kidsPageEnter} from '../constants/kidsMotion';

function Favorites() {
 const [favoriteBooks, setFavoriteBooks] = useState([]);
 const [loading, setLoading] = useState(true);
 const {language, isRtl, t} = useLanguage();
 const {user} = useAuth();
 const navigate = useNavigate();
 const reducedMotion = useReducedMotion();
 const isKidMode = user?.role === 'kid';

 useEffect(() => {
 loadFavorites();
}, [language]);

 const loadFavorites = async () => {
 try {
 setLoading(true);
 const favoriteIds = storage.getFavorites();
 
 if (favoriteIds.length === 0) {
 setFavoriteBooks([]);
 setLoading(false);
 return;
}

 // Charger tous les livres publiés et filtrer les favoris
 const response = await booksAPI.getPublishedBooks({language});
 const favorites = response.data.filter(book => favoriteIds.includes(book.id));
 
 // Pour les livres manquants (non publiés), charger individuellement
 const missingBookIds = favoriteIds.filter(id => !favorites.find(b => b.id === id));
 const missingBooks = await Promise.all(
 missingBookIds.map(async (id) => {
 try {
 const bookResponse = await booksAPI.getBook(id);
 return bookResponse.data;
} catch (err) {
 console.warn(`[Favorites] Could not load book ${id}:`, err);
 return null;
}
})
 );
 
 // Combiner les livres trouvés
 const allFavorites = [...favorites, ...missingBooks.filter(Boolean)];
 
 // Trier selon l'ordre des favoris
 const sorted = favoriteIds.map(id => allFavorites.find(b => b.id === id)).filter(Boolean);
 
 setFavoriteBooks(sorted);
} catch (error) {
 console.error('Error loading favorites:', error);
} finally {
 setLoading(false);
}
};

 const {showToast} = useToast();

 const removeFavorite = (bookId) => {
 storage.removeFavorite(bookId);
 showToast('Livre retiré des favoris', 'info', 2000);
 loadFavorites();
};

 if (isKidMode) {
  return (
   <KidsPageShell isRtl={isRtl} variant="library" world="favorites" className="pb-32 kids-glow-audio" footer={<KidsBottomNav />}>
    <KidsPageHeader backTo="/kids" emoji="❤️" title={t('yourFavorites')} />
    <main className="kids-main kids-main-tablet-wide relative z-20">
     <KidsHero modality="favorites" emoji="❤️" title={t('yourFavorites')} subtitle={t('emptyFavoritesTitle')} />
     {loading ? (
      <BookGridSkeleton count={6} variant="carousel" />
     ) : favoriteBooks.length === 0 ? (
      <KidsEmptyState
       emoji="❤️"
       title={t('emptyFavoritesTitle')}
       description={t('emptyBooksDescription')}
       actionLabel={t('goToLibrary')}
       onAction={() => navigate('/kids/library')}
       showMascot
       mascotMood="encourage"
      />
     ) : (
      <>
       <KidsBookCarousel
        title={t('yourFavorites')}
        emoji="❤️"
        books={favoriteBooks}
        isRtl={isRtl}
        showActions={false}
        hideTitle={false}
        modality="favorites"
        onPlay={(book) => navigate(getKidsContentPath(book))}
       />
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
        {favoriteBooks.map((book) => (
         <KidsMediaCard
          key={book.id}
          book={book}
          variant="carousel"
          hideTitle={false}
          isRtl={isRtl}
          showActions
          isFavorite
          onPlay={(b) => navigate(getKidsContentPath(b))}
          onFavorite={() => removeFavorite(book.id)}
         />
        ))}
       </div>
      </>
     )}
    </main>
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
 <Link to="/" className="text-foreground-secondary hover:text-foreground font-medium flex items-center gap-2 transition-colors">
 <ChevronLeftIcon className="w-5 h-5" />
 <span>{t('back')}</span>
 </Link>
 </div>
 </header>

 <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
 <motion.section {...getMotionProps(reducedMotion, kidsCardAppear)} className="parent-today-hero mb-8">
 <p className="parent-today-hero-kicker">{t('yourFavorites')}</p>
 <h1 className="parent-today-hero-title">❤️ {t('yourFavorites')}</h1>
 <p className="parent-today-hero-message">
 {favoriteBooks.length > 0
  ? `${favoriteBooks.length} ${t('yourFavorites').toLowerCase()}`
  : t('emptyBooksDescription')}
 </p>
 </motion.section>

 {loading ? (
  <BookGridSkeleton count={8} />
 ) : favoriteBooks.length === 0 ? (
  <KidsEmptyState
   emoji="📚"
   title={t('emptyFavoritesTitle')}
   description={t('emptyBooksDescription')}
   actionLabel={t('goToLibrary')}
   onAction={() => navigate('/')}
   className="max-w-3xl mx-auto"
  />
 ) : (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
   {favoriteBooks.map((book, index) => (
    <motion.article
     key={book.id}
     {...getMotionProps(reducedMotion, {
      ...kidsCardAppear,
      transition: { ...kidsCardAppear.transition, delay: index * 0.04 },
     })}
     className="parent-warm-card p-0 overflow-hidden group h-full flex flex-col"
    >
     <Link to={`/book-details/${book.id}`} className="flex-1">
      <div className="aspect-[3/4] bg-surface-secondary overflow-hidden relative">
       <KidsBookCover
        book={book}
        alt={book.title}
        imgClassName="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
       />
      </div>
      <div className="p-5">
       <h3 className="kids-book-title mb-1">{book.title}</h3>
       {book.author && (
        <p className="kids-book-author">{book.author}</p>
       )}
      </div>
     </Link>
     <div className="px-5 pb-5">
      <button
       type="button"
       onClick={() => removeFavorite(book.id)}
       className="w-full min-h-[56px] px-4 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-3xl hover:from-primary-600 hover:to-secondary-600 transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
      >
       <HeartIcon className="w-4 h-4" filled />
       <span>{t('removeFromFavorites')}</span>
      </button>
     </div>
    </motion.article>
   ))}
  </div>
 )}
 </main>
 </motion.div>
 </PlatformShell>
 );
}

export default Favorites;

