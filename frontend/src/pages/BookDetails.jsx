import {useState, useEffect} from 'react';
import {useParams, useNavigate, Link} from 'react-router-dom';
import {motion} from 'framer-motion';
import {booksAPI} from '../api/books';
import {subscriptionsAPI} from '../api/subscriptions';
import {useAuth} from '../context/AuthContext';
import {storage} from '../utils/storage';
import {useToast} from '../components/ToastProvider';
import {getImageUrl} from '../utils/imageUrl';
import {
 HeartIcon, BookIcon, ChevronLeftIcon, RefreshIcon,
 ChildIcon, CategoryIcon, HistoryIcon, WarningIcon, AudioIcon, PlayIcon
} from '../components/Icons';
import {Logo} from '../components/Logo';
import {ContentReportModal} from '../components/parent/ContentReportModal';
import {useLanguage} from '../context/LanguageContext';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {getHoverMotion, getMotionProps, kidsCardAppear, kidsCarouselReveal} from '../constants/kidsMotion';

function BookDetails() {
 const {id} = useParams();
 const navigate = useNavigate();
 const [book, setBook] = useState(null);
 const [loading, setLoading] = useState(true);
 const [isFavorite, setIsFavorite] = useState(false);
 const [relatedBooks, setRelatedBooks] = useState([]);
 const [imageError, setImageError] = useState(false);
 const [showReportModal, setShowReportModal] = useState(false);
 const {showToast} = useToast();
 const {user} = useAuth();
 const {t} = useLanguage();
 const reducedMotion = useReducedMotion();
 const isKidAccount = user?.role === 'kid';
 const canReport = user && (user.role === 'parent' || user.role === 'admin');

 useEffect(() => {
 loadBook();
}, [id]);

 useEffect(() => {
 if (book) {
 setIsFavorite(storage.isFavorite(book.id));
 loadRelatedBooks();
 setImageError(false); // Reset image error when book changes
}
}, [book]);

 const loadBook = async () => {
 try {
 setLoading(true);
 console.log("Book ID:", id);
 const response = await booksAPI.getBook(id);
 console.log("API response:", response.data);
 console.log("Book loaded:", response.data);
 console.log("Story loaded:", response.data);
 setBook(response.data);
} catch (error) {
 console.error('Error loading book:', error);
} finally {
 setLoading(false);
}
};

 const loadRelatedBooks = async () => {
 try {
 const response = await booksAPI.getPublishedBooks({
 category_id: book.category_id || undefined
});
 const filtered = response.data.filter(b => b.id !== book.id).slice(0, 4);
 setRelatedBooks(filtered);
} catch (error) {
 console.error('Error loading related books:', error);
}
};

 const toggleFavorite = () => {
 if (isFavorite) {
 storage.removeFavorite(book.id);
 showToast('Livre retiré des favoris', 'info', 2000);
} else {
 storage.addFavorite(book.id);
 showToast('Livre ajouté aux favoris', 'success', 2000);
}
 setIsFavorite(!isFavorite);
};

 const handleSubscriptionBlock = (status, context = 'start') => {
 if (status === 402) {
 showToast(
 isKidAccount
 ? 'Demande a ton parent d activer une formule pour lire ce livre.'
 : context === 'continue'
 ? 'Choisissez un abonnement pour continuer la lecture.'
 : 'Choisissez un abonnement pour lire ce livre.',
 'info',
 3000
 );
} else if (status === 403) {
 showToast(
 isKidAccount
 ? 'La limite de livres du mois est atteinte. Demande a ton parent.'
 : 'Votre quota de livres du mois est atteint.',
 'info',
 3000
 );
} else {
 showToast("Impossible de debloquer ce livre pour le moment.", 'error', 2500);
}

 navigate(isKidAccount ? '/kids' : '/abonnements');
};

 const startReading = async () => {
 try {
 await subscriptionsAPI.unlockBook(id);
 navigate(isKidAccount ? `/kids/read/${id}` : `/book/${id}`);
} catch (error) {
 handleSubscriptionBlock(error.response?.status);
}
};

 const continueReading = async () => {
 const lastPage = storage.getLastPage(id);
 try {
 await subscriptionsAPI.unlockBook(id);
 const readerPath = isKidAccount ? `/kids/read/${id}` : `/book/${id}`;
 navigate(`${readerPath}?page=${lastPage}`);
} catch (error) {
 handleSubscriptionBlock(error.response?.status, 'continue');
}
};

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50">
 <motion.div 
 className="text-center"
 initial={{opacity: 0, scale: 0.9}}
 animate={{opacity: 1, scale: 1}}
 >
 <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-300 border-t-primary-600"></div>
 <p className="mt-4 text-foreground-secondary text-lg font-medium">Chargement du livre...</p>
 </motion.div>
 </div>
 );
}

 if (!book) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50">
 <motion.div 
 className="text-center"
 initial={{opacity: 0, y: 20}}
 animate={{opacity: 1, y: 0}}
 >
 <div className="mb-6 flex justify-center">
 <div className="p-6 bg-card rounded-full shadow-lg">
 <BookIcon className="w-16 h-16 text-surface-400" />
 </div>
 </div>
 <p className="text-foreground-secondary text-xl mb-6 font-semibold">Livre non trouvé</p>
 <Link to="/" className="btn-primary inline-block px-8 py-3">
 Retour à l'accueil
 </Link>
 </motion.div>
 </div>
 );
}

 const hasHistory = storage.getLastPage(id) > 0;
 const lastPage = storage.getLastPage(id);
 const progress = book.page_count > 0 ? Math.round((lastPage / book.page_count) * 100) : 0;

 const getCategoryColor = (categoryName) => {
 const colorMap = {
 'Nature': 'from-success-500 to-success-600',
 'Aventure': 'from-primary-500 to-primary-600',
 'Animaux': 'from-orange-500 to-orange-600',
 'Espace': 'from-primary-600 to-magic-700',
 'Fiction': 'from-magic-500 to-primary-500',
 'Educational': 'from-success-500 to-primary-500',
};
 return colorMap[categoryName] || 'from-primary-500 to-secondary-500';
};

 const coverUrl = book?.cover_image && !imageError ? getImageUrl(book.cover_image) : null;

 return (
 <div className="min-h-screen kids-book-details-page">
 <motion.header 
 {...getMotionProps(reducedMotion, kidsCardAppear)}
 className="sticky top-0 z-50 shadow-md bg-surface-900/90 backdrop-blur-md"
 >
 <div className="max-w-5xl mx-auto px-space-16 sm:px-space-24 py-space-12 flex justify-between items-center gap-space-12">
 <Link to="/" className="flex items-center shrink-0">
 <Logo size="default" />
 </Link>
 <div className="flex items-center gap-space-12">
 <button
 type="button"
 onClick={() => navigate(-1)}
 className="kids-touch-target inline-flex items-center gap-space-8 text-surface-100 hover:text-white font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300 rounded-full px-space-12"
 >
 <ChevronLeftIcon className="w-5 h-5" />
 <span className="hidden sm:inline">Retour</span>
 </button>
 <button
 type="button"
 onClick={toggleFavorite}
 className={`kids-touch-target grid h-14 w-14 min-h-touch min-w-touch place-items-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300 ${
 isFavorite ? 'bg-orange-500 text-white shadow-floating' : 'bg-surface-800 text-surface-300 hover:bg-surface-700'
}`}
 aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
 >
 <HeartIcon className="w-6 h-6" filled={isFavorite} />
 </button>
 </div>
 </div>
 </motion.header>

 <section className="relative overflow-hidden kids-book-details-atmosphere py-space-40 md:py-space-56">
 {coverUrl && (
 <div className="kids-book-details-bleed" style={{ backgroundImage: `url(${coverUrl})` }} aria-hidden="true" />
 )}
 <div className="max-w-5xl mx-auto px-space-16 sm:px-space-24 relative z-10">
 <motion.div
 {...getMotionProps(reducedMotion, kidsCardAppear)}
 className="flex flex-col items-center text-center"
 >
 <motion.div
 {...getHoverMotion(reducedMotion, { whileHover: { y: -6, scale: 1.02 } })}
 className="relative mb-space-24 w-56 sm:w-64 md:w-72 rounded-32 overflow-hidden border-4 border-white/80 shadow-floating kids-book-glow"
 >
 {coverUrl ? (
 <img src={coverUrl} alt={book.title} className="w-full aspect-[3/4] object-cover" onError={() => setImageError(true)} onLoad={() => setImageError(false)} />
 ) : (
 <div className="w-full aspect-[3/4] grid place-items-center bg-gradient-to-br from-primary-100 to-magic-100">
 <BookIcon className="w-24 h-24 text-magic-300" />
 </div>
 )}
 </motion.div>

 <h1 className="text-heading-xl md:text-display-s font-extrabold text-foreground mb-space-12 max-w-2xl leading-tight">
 {book.title}
 </h1>

 {book.author && (
 <p className="text-heading-s text-foreground-secondary font-medium mb-space-16">par {book.author}</p>
 )}

 <div className="flex flex-wrap justify-center gap-space-8 mb-space-24">
 {book.category_name && (
 <span className={`inline-flex items-center gap-space-8 px-space-16 py-space-8 bg-gradient-to-r ${getCategoryColor(book.category_name)} text-white rounded-full text-caption font-bold shadow-soft`}>
 <CategoryIcon className="w-4 h-4" />
 {book.category_name}
 </span>
 )}
 {book.age_group_min !== undefined && book.age_group_max !== undefined && (
 <span className="inline-flex items-center gap-space-8 px-space-16 py-space-8 bg-orange-100 text-orange-800 rounded-full text-caption font-bold border border-orange-200">
 <ChildIcon className="w-4 h-4" />
 {book.age_group_min}-{book.age_group_max} ans
 </span>
 )}
 {book.page_count > 0 && (
 <span className="inline-flex items-center gap-space-8 px-space-16 py-space-8 bg-primary-50 text-primary-700 rounded-full text-caption font-bold border border-primary-100">
 <BookIcon className="w-4 h-4" />
 {book.page_count} page{book.page_count > 1 ? 's' : ''}
 </span>
 )}
 </div>

 {book.description && (
 <p className="text-body text-foreground-secondary leading-relaxed max-w-xl mb-space-24 line-clamp-4">
 {book.description}
 </p>
 )}

 {hasHistory && (
 <div className="w-full max-w-md mb-space-24 rounded-24 bg-card/80 backdrop-blur-sm border border-border p-space-16 shadow-soft text-left">
 <div className="flex items-center gap-space-8 mb-space-8">
 <HistoryIcon className="w-5 h-5 text-primary-600" />
 <span className="text-body font-black text-foreground">Ta progression</span>
 </div>
 <div className="flex justify-between text-caption text-foreground-muted mb-space-8">
 <span>Page {lastPage + 1} sur {book.page_count || '?'}</span>
 <span>{progress}%</span>
 </div>
 <div className="h-space-12 w-full overflow-hidden rounded-full bg-surface-secondary">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${progress}%` }}
 transition={reducedMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
 className="h-full rounded-full bg-gradient-to-r from-primary-400 to-secondary-400"
 />
 </div>
 </div>
 )}

 <div className="flex flex-col sm:flex-row gap-space-16 w-full max-w-lg mb-space-24">
 {hasHistory ? (
 <>
 <motion.button
 {...getHoverMotion(reducedMotion, { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } })}
 type="button"
 onClick={continueReading}
 className="kids-touch-target flex-1 inline-flex min-h-touch-kids items-center justify-center gap-space-12 rounded-32 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-heading-s font-black shadow-floating focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
 >
 <BookIcon className="w-7 h-7" />
 Continuer
 </motion.button>
 <motion.button
 {...getHoverMotion(reducedMotion, { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } })}
 type="button"
 onClick={startReading}
 className="kids-touch-target flex-1 inline-flex min-h-touch-kids items-center justify-center gap-space-12 rounded-32 bg-card text-foreground text-body font-black border-4 border-border shadow-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
 >
 <RefreshIcon className="w-6 h-6" />
 Recommencer
 </motion.button>
 </>
 ) : (
 <motion.button
 {...getHoverMotion(reducedMotion, { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } })}
 type="button"
 onClick={startReading}
 className="kids-touch-target w-full inline-flex min-h-touch-kids items-center justify-center gap-space-12 rounded-32 bg-gradient-to-r from-primary-500 via-secondary-500 to-magic-500 text-white text-heading-s font-black shadow-floating focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
 >
 <PlayIcon className="w-8 h-8" filled />
 Lire l'histoire
 </motion.button>
 )}
 {book.audio_url && isKidAccount && (
 <motion.button
 {...getHoverMotion(reducedMotion, { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } })}
 type="button"
 onClick={() => navigate(`/kids/listen/${id}`)}
 className="kids-touch-target flex-1 inline-flex min-h-touch-kids items-center justify-center gap-space-12 rounded-32 bg-gradient-to-r from-orange-400 to-orange-600 text-white text-body font-black shadow-floating focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300"
 >
 <AudioIcon className="w-7 h-7" />
 Écouter
 </motion.button>
 )}
 </div>

 <div className="w-full max-w-lg rounded-24 bg-surface-900/90 text-white p-space-20 shadow-card text-left">
 <p className="text-caption font-bold text-orange-200 uppercase tracking-wide">
 {isKidAccount ? 'Acces gere par tes parents' : 'Abonnement mensuel'}
 </p>
 <p className="mt-space-8 text-body font-bold leading-snug">
 {isKidAccount
 ? 'Si ce livre est bloque, demande a ton parent de choisir une formule.'
 : 'Debloquez 1, 2 ou 3 livres par mois selon votre formule.'}
 </p>
 {!isKidAccount && (
 <Link to="/abonnements" className="mt-space-16 inline-flex min-h-touch items-center rounded-full bg-card px-space-20 py-space-12 font-bold text-foreground hover:bg-primary-50 transition-colors">
 Voir les formules
 </Link>
 )}
 </div>

 {canReport && (
 <motion.button
 {...getHoverMotion(reducedMotion, { whileTap: { scale: 0.98 } })}
 type="button"
 onClick={() => setShowReportModal(true)}
 className="mt-space-16 kids-touch-target inline-flex items-center gap-space-8 text-caption font-bold text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300 rounded-full px-space-16 py-space-8"
 >
 <WarningIcon className="w-5 h-5" />
 {t('reportContentAction')}
 </motion.button>
 )}
 <ContentReportModal
 isOpen={showReportModal}
 onClose={() => setShowReportModal(false)}
 targetType="book"
 targetId={book?.id}
 targetTitle={book?.title}
 />
 </motion.div>
 </div>
 </section>

 {relatedBooks.length > 0 && (
 <motion.section
 className="py-space-40 bg-card"
 {...getMotionProps(reducedMotion, kidsCarouselReveal)}
 >
 <div className="max-w-5xl mx-auto px-space-16 sm:px-space-24">
 <h2 className="kids-shelf-title mb-space-20 px-space-8">
 <span aria-hidden="true">✨</span>
 <span>Histoires similaires</span>
 </h2>
 <div className="kids-discovery-rail">
 {relatedBooks.map((relatedBook, index) => (
 <motion.div
 key={relatedBook.id}
 {...getMotionProps(reducedMotion, { ...kidsCardAppear, transition: { ...kidsCardAppear.transition, delay: index * 0.05 } })}
 className="shrink-0 w-44 sm:w-52"
 >
 <Link
 to={`/book-details/${relatedBook.id}`}
 className="block rounded-24 overflow-hidden bg-card border-4 border-border shadow-card hover:shadow-floating transition-shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
 >
 <div className="aspect-[3/4] bg-gradient-to-br from-primary-100 to-magic-100 overflow-hidden">
 {relatedBook.cover_image ? (
 <img src={getImageUrl(relatedBook.cover_image)} alt="" className="w-full h-full object-cover" loading="lazy" />
 ) : (
 <div className="w-full h-full grid place-items-center"><BookIcon className="w-16 h-16 text-magic-300" /></div>
 )}
 </div>
 <div className="p-space-16">
 <h3 className="text-body font-black text-foreground line-clamp-2">{relatedBook.title}</h3>
 </div>
 </Link>
 </motion.div>
 ))}
 </div>
 </div>
 </motion.section>
 )}
 </div>
 );
}

export default BookDetails;
