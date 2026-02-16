import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { booksAPI } from '../api/books';
import { storage } from '../utils/storage';
import { useToast } from '../components/ToastProvider';
import { 
  HeartIcon, BookIcon, ChevronLeftIcon, RefreshIcon, 
  StarIcon, ChildIcon, CategoryIcon, HistoryIcon 
} from '../components/Icons';
import { Logo } from '../components/Logo';

function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    loadBook();
  }, [id]);

  useEffect(() => {
    if (book) {
      setIsFavorite(storage.isFavorite(book.id));
      loadRelatedBooks();
    }
  }, [book]);

  const loadBook = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getBook(id);
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

  const startReading = () => {
    navigate(`/book/${id}`);
  };

  const continueReading = () => {
    const lastPage = storage.getLastPage(id);
    navigate(`/book/${id}?page=${lastPage}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-orange-50">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-red-300 border-t-red-600"></div>
          <p className="mt-4 text-neutral-600 text-lg font-medium">Chargement du livre...</p>
        </motion.div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-orange-50">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-6 flex justify-center">
            <div className="p-6 bg-white rounded-full shadow-lg">
              <BookIcon className="w-16 h-16 text-neutral-400" />
            </div>
          </div>
          <p className="text-neutral-700 text-xl mb-6 font-semibold">Livre non trouvé</p>
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
      'Aventure': 'from-pink-500 to-rose-500',
      'Animaux': 'from-orange-500 to-amber-500',
      'Espace': 'from-indigo-500 to-purple-500',
      'Fiction': 'from-purple-500 to-pink-500',
      'Educational': 'from-blue-500 to-cyan-500',
    };
    return colorMap[categoryName] || 'from-red-500 to-pink-500';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 shadow-md bg-neutral-900/95 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-3">
          <Link to="/" className="flex items-center">
            <Logo size="default" />
          </Link>
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="text-neutral-100 hover:text-white font-medium flex items-center gap-2 transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Retour</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleFavorite}
              className={`p-3 rounded-full transition-all ${
                isFavorite
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              <HeartIcon className="w-5 h-5" filled={isFavorite} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section avec étoiles animées et couverture */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-red-50/30 to-pink-50/30 py-12 md:py-16">
        {/* Étoiles animées en arrière-plan */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start"
          >
            {/* Couverture du livre */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-1 flex justify-center lg:justify-start"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-pink-500/20 to-orange-500/20 blur-2xl rounded-3xl"></div>
                <motion.div
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="relative bg-white rounded-3xl p-6 shadow-2xl border-4 border-white"
                >
                  {book.cover_image ? (
                    <img
                      src={`http://localhost:3000${book.cover_image}`}
                      alt={book.title}
                      className="w-full max-w-sm h-auto object-contain rounded-2xl shadow-xl"
                    />
                  ) : (
                    <div className="w-full max-w-sm h-96 flex items-center justify-center bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl">
                      <BookIcon className="w-32 h-32 text-red-400" />
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>

            {/* Informations du livre */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-neutral-900 mb-4 leading-tight">
                  {book.title}
                </h1>
                
                {book.author && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
                      <BookIcon className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-xl md:text-2xl text-neutral-700 font-medium">
                      par {book.author}
                    </p>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {book.category_name && (
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className={`px-4 py-2 bg-gradient-to-r ${getCategoryColor(book.category_name)} text-white rounded-full text-sm font-semibold shadow-lg flex items-center gap-2`}
                    >
                      <CategoryIcon className="w-4 h-4" />
                      {book.category_name}
                    </motion.span>
                  )}
                  {book.age_group_min !== undefined && book.age_group_max !== undefined && (
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-full text-sm font-semibold shadow-lg flex items-center gap-2"
                    >
                      <ChildIcon className="w-4 h-4" />
                      {book.age_group_min}-{book.age_group_max} ans
                    </motion.span>
                  )}
                  {book.page_count > 0 && (
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-400 to-cyan-400 text-white rounded-full text-sm font-semibold shadow-lg flex items-center gap-2"
                    >
                      <BookIcon className="w-4 h-4" />
                      {book.page_count} page{book.page_count > 1 ? 's' : ''}
                    </motion.span>
                  )}
                </div>

                {/* Description */}
                {book.description && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50"
                  >
                    <h3 className="font-bold text-neutral-900 mb-3 text-lg flex items-center gap-2">
                      <StarIcon className="w-5 h-5 text-yellow-500" />
                      À propos de ce livre
                    </h3>
                    <p className="text-neutral-700 leading-relaxed text-base">
                      {book.description}
                    </p>
                  </motion.div>
                )}

                {/* Progression si déjà lu */}
                {hasHistory && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <HistoryIcon className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-neutral-900">Votre progression</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-neutral-600">
                        <span>Page {lastPage + 1} sur {book.page_count || '?'}</span>
                        <span>{progress}% terminé</span>
                      </div>
                      <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 rounded-full shadow-lg"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Boutons d'action */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4 pt-4"
                >
                  {hasHistory ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={continueReading}
                        className="flex-1 px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                      >
                        <BookIcon className="w-6 h-6" />
                        Continuer la lecture
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startReading}
                        className="px-8 py-4 bg-white text-neutral-900 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all border-2 border-neutral-200 flex items-center justify-center gap-3"
                      >
                        <RefreshIcon className="w-5 h-5" />
                        Recommencer
                      </motion.button>
                    </>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startReading}
                      className="w-full px-8 py-4 bg-gradient-to-r from-red-600 via-pink-600 to-orange-600 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3"
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
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-8 flex items-center gap-3">
                <StarIcon className="w-8 h-8 text-yellow-500" />
                Livres similaires
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {relatedBooks.map((relatedBook, index) => (
                  <motion.div
                    key={relatedBook.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                  >
                    <Link
                      to={`/book-details/${relatedBook.id}`}
                      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border-2 border-transparent hover:border-red-200 block"
                    >
                      <div className="h-56 bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center overflow-hidden">
                        {relatedBook.cover_image ? (
                          <img
                            src={`http://localhost:3000${relatedBook.cover_image}`}
                            alt={relatedBook.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <BookIcon className="w-20 h-20 text-red-400" />
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-neutral-900 line-clamp-2 text-base mb-2">
                          {relatedBook.title}
                        </h3>
                        {relatedBook.author && (
                          <p className="text-sm text-neutral-600">par {relatedBook.author}</p>
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
