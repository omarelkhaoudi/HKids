import {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {booksAPI} from '../api/books';
import {storage} from '../utils/storage';
import {useToast} from '../components/ToastProvider';
import {BookGridSkeleton} from '../components/SkeletonLoader';
import {HeartIcon, ChevronLeftIcon, StarIcon} from '../components/Icons';
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

function Favorites() {
 const [favoriteBooks, setFavoriteBooks] = useState([]);
 const [loading, setLoading] = useState(true);
 const {language, isRtl, t} = useLanguage();
 const {user} = useAuth();
 const navigate = useNavigate();
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
 
 console.log('[Favorites] Loaded books:', sorted.map(b => ({id: b.id, title: b.title, cover_image: b.cover_image})));
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
 <div className="min-h-screen bg-card" dir={isRtl ? 'rtl' : 'ltr'}>
 {/* Header */}
 <motion.header 
 initial={{y: -100, opacity: 0}}
 animate={{y: 0, opacity: 1}}
 transition={{duration: 0.5}}
 className="sticky top-0 z-50 shadow-md bg-surface-900/95 backdrop-blur-md"
 >
 <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-3">
 <Link to="/" className="flex items-center">
 <Logo size="default" />
 </Link>
 <div className="flex items-center gap-2 sm:gap-4">
 <Link to="/" className="text-surface-100 hover:text-white font-medium flex items-center gap-1 sm:gap-2 transition-colors px-2 py-1 sm:px-0 sm:py-0">
 <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
 <span className="hidden sm:inline">Retour</span>
 </Link>
 <h1 className="text-base sm:text-lg md:text-xl font-semibold text-white flex items-center gap-1 sm:gap-2">
 <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5" filled={true} />
 <span className="text-sm sm:text-base md:text-lg">Mes Favoris</span>
 </h1>
 </div>
 </div>
 </motion.header>

 {/* Hero Section avec étoiles animées */}
 <section className="relative overflow-hidden bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12 md:py-16">
 {/* Étoiles animées en arrière-plan */}
 <div className="absolute inset-0 overflow-hidden pointer-events-none">
 {Array.from({length: 20}).map((_, i) => (
 <motion.div
 key={i}
 className="absolute text-accent-400"
 style={{
 left: `${Math.random() * 100}%`,
 top: `${Math.random() * 100}%`,
}}
 animate={{
 y: [0, -20, 0],
 opacity: [0.3, 1, 0.3],
 scale: [1, 1.2, 1],
}}
 transition={{
 duration: 3 + Math.random() * 2,
 repeat: Infinity,
 delay: Math.random() * 2,
}}
 >
 <StarIcon className="w-6 h-6" />
 </motion.div>
 ))}
 </div>

 <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
 <motion.div
 initial={{opacity: 0, y: 20}}
 animate={{opacity: 1, y: 0}}
 transition={{duration: 0.6}}
 className="text-center mb-12"
 >
 <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
 <span className="text-foreground-600 drop-shadow-lg">Mes Livres</span>
 <br />
 <span className="text-foreground">Favoris</span>
 </h1>
 <p className="text-lg sm:text-xl text-foreground-secondary max-w-2xl mx-auto">
 Retrouvez tous vos livres préférés en un seul endroit
 </p>
 </motion.div>
 </div>
 </section>

 {/* Content */}
 <section className="bg-card py-12 md:py-16">
 <div className="max-w-7xl mx-auto px-4 sm:px-6">
 {loading ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
 <BookGridSkeleton count={4} />
 </div>
 ) : favoriteBooks.length === 0 ? (
 <motion.div
 initial={{opacity: 0, y: 20}}
 animate={{opacity: 1, y: 0}}
 className="text-center py-20"
 >
 <div className="mb-6 flex justify-center">
 <motion.div
 initial={{scale: 0}}
 animate={{scale: 1}}
 transition={{type: 'spring', delay: 0.2}}
 className="p-6 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full shadow-lg"
 >
 <HeartIcon className="w-16 h-16 text-foreground-500" filled={false} />
 </motion.div>
 </div>
 <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Aucun favori</h2>
 <p className="text-lg text-foreground-secondary mb-8 max-w-md mx-auto">
 Vous n'avez pas encore de livres favoris. Explorez notre bibliothèque et ajoutez vos préférés !
 </p>
 <Link to="/">
 <motion.button
 whileHover={{scale: 1.05}}
 whileTap={{scale: 0.95}}
 className="px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
 >
 Découvrir des livres
 </motion.button>
 </Link>
 </motion.div>
 ) : (
 <>
 <motion.div
 initial={{opacity: 0, y: 20}}
 animate={{opacity: 1, y: 0}}
 className="mb-8"
 >
 <p className="text-xl sm:text-2xl text-foreground-secondary font-semibold">
 {favoriteBooks.length} livre{favoriteBooks.length > 1 ? 's' : ''} favori{favoriteBooks.length > 1 ? 's' : ''}
 </p>
 </motion.div>
 <AnimatePresence>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
 {favoriteBooks.map((book, index) => (
 <motion.div
 key={book.id}
 initial={{opacity: 0, y: 20, scale: 0.9}}
 animate={{opacity: 1, y: 0, scale: 1}}
 exit={{opacity: 0, scale: 0.8, y: -20}}
 transition={{
 delay: index * 0.05,
 duration: 0.4,
 type: 'spring',
 stiffness: 100
}}
 whileHover={{y: -12, scale: 1.03}}
 whileTap={{scale: 0.97}}
 layout
 >
 <div className="bg-card rounded-2xl border-2 border-border overflow-hidden group h-full flex flex-col hover:border-primary-300 hover:shadow-xl transition-all shadow-lg">
 <Link to={`/book-details/${book.id}`} className="flex-1">
 <div className="aspect-[3/4] bg-surface-secondary overflow-hidden relative">
 <KidsBookCover
 book={book}
 alt={book.title}
 imgClassName="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
 />
 </div>
 <div className="p-5">
 <h3 className="kids-book-title mb-1">
 {book.title}
 </h3>
 {book.author && (
 <p className="kids-book-author">par {book.author}</p>
 )}
 </div>
 </Link>
 <div className="p-5 pt-0">
 <motion.button
 onClick={() => removeFavorite(book.id)}
 className="w-full px-4 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-3xl hover:from-primary-600 hover:to-secondary-600 transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
 whileHover={{scale: 1.02}}
 whileTap={{scale: 0.98}}
 >
 <HeartIcon className="w-4 h-4" filled={true} />
 <span>Retirer des favoris</span>
 </motion.button>
 </div>
 </div>
 </motion.div>
 ))}
 </div>
 </AnimatePresence>
 </>
 )}
 </div>
 </section>
 </div>
 );
}

export default Favorites;

