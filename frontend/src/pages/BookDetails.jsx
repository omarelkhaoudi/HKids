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
 StarIcon, ChildIcon, CategoryIcon, HistoryIcon 
} from '../components/Icons';
import {Logo} from '../components/Logo';

function BookDetails() {
 const {id} = useParams();
 const navigate = useNavigate();
 const [book, setBook] = useState(null);
 const [loading, setLoading] = useState(true);
 const [isFavorite, setIsFavorite] = useState(false);
 const [relatedBooks, setRelatedBooks] = useState([]);
 const [imageError, setImageError] = useState(false);
 const {showToast} = useToast();
 const {user} = useAuth();
 const isKidAccount = user?.role === 'kid';

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
 navigate(`/book/${id}`);
} catch (error) {
 handleSubscriptionBlock(error.response?.status);
}
};

 const continueReading = async () => {
 const lastPage = storage.getLastPage(id);
 try {
 await subscriptionsAPI.unlockBook(id);
 navigate(`/book/${id}?page=${lastPage}`);
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
 'Nature': 'from-green-500 to-emerald-500',
 'Aventure': 'from-secondary-500 to-rose-500',
 'Animaux': 'from-accent-500 to-accent-500',
 'Espace': 'from-indigo-500 to-purple-500',
 'Fiction': 'from-purple-500 to-secondary-500',
 'Educational': 'from-primary-500 to-cyan-500',
};
 return colorMap[categoryName] || 'from-primary-500 to-secondary-500';
};

 return (
 <div className="min-h-screen bg-card">
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
 <div className="flex items-center gap-4">
 <motion.button
 whileHover={{scale: 1.05}}
 whileTap={{scale: 0.95}}
 onClick={() => navigate(-1)}
 className="text-surface-100 hover:text-white font-medium flex items-center gap-2 transition-colors"
 >
 <ChevronLeftIcon className="w-4 h-4" />
 <span className="hidden sm:inline">Retour</span>
 </motion.button>
 <motion.button
 whileHover={{scale: 1.1}}
 whileTap={{scale: 0.9}}
 onClick={toggleFavorite}
 className={`p-3 rounded-full transition-all ${
 isFavorite
 ? 'bg-primary-500 text-white shadow-lg'
 : 'bg-surface-800 text-surface-300 hover:bg-surface-700'
}`}
 >
 <HeartIcon className="w-5 h-5" filled={isFavorite} />
 </motion.button>
 </div>
 </div>
 </motion.header>

 {/* Hero Section avec étoiles animées et couverture */}
 <section className="relative overflow-hidden bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12 md:py-16">
 {/* Étoiles animées en arrière-plan */}
 <div className="absolute inset-0 overflow-hidden pointer-events-none">
 {Array.from({length: 20}).map((_, i) => (
 <motion.div
 key={i}
 className="absolute text-yellow-400"
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
 <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 py-12">
 <motion.div
 initial={{opacity: 0, y: 30}}
 animate={{opacity: 1, y: 0}}
 transition={{duration: 0.6}}
 className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start"
 >
 {/* Couverture du livre */}
 <motion.div
 initial={{opacity: 0, scale: 0.9, rotateY: -15}}
 animate={{opacity: 1, scale: 1, rotateY: 0}}
 transition={{duration: 0.6, delay: 0.2}}
 className="lg:col-span-1 flex justify-center lg:justify-start"
 >
 <div className="relative">
 <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-secondary-500/20 to-accent-500/20 blur-2xl rounded-3xl"></div>
 <motion.div
 whileHover={{scale: 1.04, y: -4}}
 transition={{type: 'spring', stiffness: 300}}
 className="relative w-[300px] sm:w-[360px] md:w-[420px] rounded-3xl border-4 border-white bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 p-8 sm:p-10 shadow-2xl [perspective:1200px]"
 >
 <div className="relative mx-auto w-[78%] max-w-[300px] aspect-[3/4] [transform-style:preserve-3d] [transform:rotateY(-18deg)_rotateZ(-1deg)] transition-transform duration-300 hover:[transform:rotateY(-14deg)_rotateZ(-0.5deg)_translateY(-2px)]">
 <div className="absolute -right-[14%] top-[3%] h-[94%] w-[17%] rounded-r-lg bg-gradient-to-r from-surface-200 via-white to-surface-300 shadow-lg [transform:rotateY(72deg)_translateZ(1px)] origin-left">
 <div className="absolute inset-y-4 left-1/3 w-px bg-surface-300/80"></div>
 <div className="absolute inset-y-5 right-1/3 w-px bg-surface-200/80"></div>
 </div>
 <div className="absolute -right-[8%] top-[5%] h-[90%] w-[10%] rounded-r-md bg-gradient-to-r from-white via-surface-100 to-surface-300 [transform:translateZ(-12px)]"></div>
 <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-surface-900/10 to-surface-900/25 [transform:translateZ(-18px)]"></div>
 <div className="relative z-10 h-full w-full overflow-hidden rounded-3xl bg-card shadow-2xl ring-1 ring-black/10 [transform:translateZ(16px)]">
 {book.cover_image && !imageError ? (
 <img
 src={getImageUrl(book.cover_image)}
 alt={book.title}
 className="h-full w-full object-cover"
 onError={() => setImageError(true)}
 onLoad={() => setImageError(false)}
 />
 ) : (
 <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-100">
 <BookIcon className="w-28 h-28 text-foreground-400" />
 </div>
 )}
 <div className="pointer-events-none absolute inset-y-0 left-0 w-[14%] bg-gradient-to-r from-black/20 via-black/5 to-transparent"></div>
 <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/35"></div>
 </div>
 <div className="absolute -bottom-7 left-[9%] h-7 w-[95%] rounded-full bg-black/20 blur-xl [transform:rotateX(75deg)]"></div>
 </div>
 </motion.div>
 </div>
 </motion.div>

 {/* Informations du livre */}
 <div className="lg:col-span-2 space-y-6">
 <motion.div
 initial={{opacity: 0, x: 20}}
 animate={{opacity: 1, x: 0}}
 transition={{delay: 0.3}}
 >
 <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-4 leading-tight">
 {book.title}
 </h1>
 
 {book.author && (
 <div className="flex items-center gap-3 mb-6">
 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
 <BookIcon className="w-5 h-5 text-foreground-600" />
 </div>
 <p className="text-xl md:text-2xl text-foreground-secondary font-medium">
 par {book.author}
 </p>
 </div>
 )}

 {/* Tags */}
 <div className="flex flex-wrap gap-3 mb-6">
 {book.category_name && (
 <motion.span
 whileHover={{scale: 1.05}}
 className={`px-4 py-2 bg-gradient-to-r ${getCategoryColor(book.category_name)} text-white rounded-full text-sm font-semibold shadow-lg flex items-center gap-2`}
 >
 <CategoryIcon className="w-4 h-4" />
 {book.category_name}
 </motion.span>
 )}
 {book.age_group_min !== undefined && book.age_group_max !== undefined && (
 <motion.span
 whileHover={{scale: 1.05}}
 className="px-4 py-2 bg-gradient-to-r from-accent-400 to-secondary-400 text-white rounded-full text-sm font-semibold shadow-lg flex items-center gap-2"
 >
 <ChildIcon className="w-4 h-4" />
 {book.age_group_min}-{book.age_group_max} ans
 </motion.span>
 )}
 {book.page_count > 0 && (
 <motion.span
 whileHover={{scale: 1.05}}
 className="px-4 py-2 bg-gradient-to-r from-primary-400 to-cyan-400 text-white rounded-full text-sm font-semibold shadow-lg flex items-center gap-2"
 >
 <BookIcon className="w-4 h-4" />
 {book.page_count} page{book.page_count > 1 ? 's' : ''}
 </motion.span>
 )}
 </div>

 {/* Description */}
 {book.description && (
 <motion.div
 initial={{opacity: 0, y: 10}}
 animate={{opacity: 1, y: 0}}
 transition={{delay: 0.4}}
 className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50"
 >
 <h3 className="font-bold text-foreground mb-3 text-lg flex items-center gap-2">
 <StarIcon className="w-5 h-5 text-yellow-500" />
 À propos de ce livre
 </h3>
 <p className="text-foreground-secondary leading-relaxed text-base">
 {book.description}
 </p>
 </motion.div>
 )}

 {/* Progression si déjà lu */}
 {hasHistory && (
 <motion.div
 initial={{opacity: 0, y: 10}}
 animate={{opacity: 1, y: 0}}
 transition={{delay: 0.5}}
 className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50"
 >
 <div className="flex items-center gap-3 mb-3">
 <HistoryIcon className="w-5 h-5 text-foreground-600" />
 <h3 className="font-bold text-foreground">Votre progression</h3>
 </div>
 <div className="space-y-2">
 <div className="flex justify-between text-sm text-foreground-secondary">
 <span>Page {lastPage + 1} sur {book.page_count || '?'}</span>
 <span>{progress}% terminé</span>
 </div>
 <div className="w-full h-3 bg-surface-200 rounded-full overflow-hidden">
 <motion.div
 initial={{width: 0}}
 animate={{width: `${progress}%`}}
 transition={{duration: 1, ease: 'easeOut'}}
 className="h-full bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 rounded-full shadow-lg"
 />
 </div>
 </div>
 </motion.div>
 )}

 <motion.div
 initial={{opacity: 0, y: 10}}
 animate={{opacity: 1, y: 0}}
 transition={{delay: 0.55}}
 className="rounded-2xl bg-surface-900 text-white p-5 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
 >
 <div>
 <p className="text-sm font-bold text-accent-200 uppercase tracking-wide">
 {isKidAccount ? 'Acces gere par tes parents' : 'Abonnement mensuel'}
 </p>
 <p className="mt-1 text-lg font-bold">
 {isKidAccount
 ? 'Si ce livre est bloque, demande a ton parent de choisir une formule.'
 : 'Debloquez 1, 2 ou 3 livres par mois selon votre formule.'}
 </p>
 </div>
 {!isKidAccount && (
 <Link
 to="/abonnements"
 className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-card px-5 py-3 font-bold text-foreground hover:bg-accent-50 transition-colors"
 >
 Voir les formules
 </Link>
 )}
 </motion.div>

 {/* Boutons d'action */}
 <motion.div
 initial={{opacity: 0, y: 10}}
 animate={{opacity: 1, y: 0}}
 transition={{delay: 0.6}}
 className="flex flex-col sm:flex-row gap-4 pt-4"
 >
 {hasHistory ? (
 <>
 <motion.button
 whileHover={{scale: 1.05, y: -2}}
 whileTap={{scale: 0.95}}
 onClick={continueReading}
 className="flex-1 px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3"
 >
 <BookIcon className="w-6 h-6" />
 Continuer la lecture
 </motion.button>
 <motion.button
 whileHover={{scale: 1.05, y: -2}}
 whileTap={{scale: 0.95}}
 onClick={startReading}
 className="px-8 py-4 bg-card text-foreground rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all border-2 border-border flex items-center justify-center gap-3"
 >
 <RefreshIcon className="w-5 h-5" />
 Recommencer
 </motion.button>
 </>
 ) : (
 <motion.button
 whileHover={{scale: 1.05, y: -2}}
 whileTap={{scale: 0.95}}
 onClick={startReading}
 className="w-full px-8 py-4 bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3"
 >
 <BookIcon className="w-6 h-6" />
 Commencer la lecture
 </motion.button>
 )}
 </motion.div>
 </motion.div>
 </div>
 </motion.div>
 </div>
 </section>

 {/* Livres similaires */}
 {relatedBooks.length > 0 && (
 <section className="bg-card py-16">
 <div className="max-w-7xl mx-auto px-4">
 <motion.div
 initial={{opacity: 0, y: 20}}
 whileInView={{opacity: 1, y: 0}}
 viewport={{once: true}}
 transition={{duration: 0.6}}
 >
 <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 flex items-center gap-3">
 <StarIcon className="w-8 h-8 text-yellow-500" />
 Livres similaires
 </h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
 {relatedBooks.map((relatedBook, index) => (
 <motion.div
 key={relatedBook.id}
 initial={{opacity: 0, y: 20}}
 whileInView={{opacity: 1, y: 0}}
 viewport={{once: true}}
 transition={{delay: index * 0.1}}
 whileHover={{y: -8, scale: 1.02}}
 >
 <Link
 to={`/book-details/${relatedBook.id}`}
 className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border-2 border-transparent hover:border-primary-200 block"
 >
 <div className="h-56 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center overflow-hidden">
 {relatedBook.cover_image ? (
 <img
 src={getImageUrl(relatedBook.cover_image)}
 alt={relatedBook.title}
 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
 onError={(e) => {
 e.target.style.display = 'none';
 const fallback = e.target.parentElement.querySelector('.book-fallback');
 if (fallback) fallback.style.display = 'flex';
}}
 />
 ) : null}
 <div className={`${relatedBook.cover_image ? 'hidden' : 'flex'} book-fallback w-full h-full items-center justify-center`}>
 <BookIcon className="w-20 h-20 text-foreground-400" />
 </div>
 </div>
 <div className="p-5">
 <h3 className="font-bold text-foreground line-clamp-2 text-base mb-2">
 {relatedBook.title}
 </h3>
 {relatedBook.author && (
 <p className="text-sm text-foreground-secondary">par {relatedBook.author}</p>
 )}
 </div>
 </Link>
 </motion.div>
 ))}
 </div>
 </motion.div>
 </div>
 </section>
 )}
 </div>
 );
}

export default BookDetails;
