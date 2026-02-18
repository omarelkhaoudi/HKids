import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { booksAPI } from '../api/books';
import { storage } from '../utils/storage';
import { useToast } from '../components/ToastProvider';
import { HistoryIcon, BookIcon, ChevronLeftIcon, TrashIcon, StarIcon } from '../components/Icons';
import { Logo } from '../components/Logo';
import { getImageUrl } from '../utils/imageUrl';

function History() {
  const [history, setHistory] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const historyData = storage.getReadingHistory();
      setHistory(historyData);

      if (historyData.length > 0) {
        // Charger les détails des livres
        const bookIds = historyData.map(h => h.bookId);
        const response = await booksAPI.getPublishedBooks();
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
        
        console.log('[History] Loaded books:', sorted.map(b => ({ id: b.id, title: b.title, cover_image: b.cover_image })));
        setBooks(sorted);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const { showToast } = useToast();

  const clearHistory = () => {
    if (confirm('Voulez-vous vraiment effacer tout l\'historique ?')) {
      localStorage.removeItem('hkids_history');
      setHistory([]);
      setBooks([]);
      showToast('Historique effacé', 'info', 2000);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  // Calculer les statistiques
  const totalPagesRead = history.reduce((sum, h) => sum + (h.page || 0), 0);
  const uniqueBooks = books.length;
  const avgPagesPerBook = uniqueBooks > 0 ? Math.round(totalPagesRead / uniqueBooks) : 0;

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
            <Link to="/" className="text-neutral-100 hover:text-white font-medium flex items-center gap-2 transition-colors">
              <ChevronLeftIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Retour</span>
            </Link>
            <h1 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
              <HistoryIcon className="w-5 h-5" />
              <span>Historique</span>
            </h1>
            {books.length > 0 && (
              <motion.button
                onClick={clearHistory}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 border border-red-400/30"
              >
                <TrashIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Effacer</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Hero Section avec étoiles animées */}
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
              <span className="text-red-600 drop-shadow-lg">Historique</span>
              <br />
              <span className="text-neutral-900">de Lecture</span>
            </h1>
            <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto">
              Retrouvez tous les livres que vous avez lus
            </p>
          </motion.div>

          {/* Statistiques */}
          {books.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-red-100"
              >
                <div className="text-3xl font-bold text-red-600 mb-2">{uniqueBooks}</div>
                <div className="text-sm text-neutral-600 font-medium">Livres lus</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-pink-100"
              >
                <div className="text-3xl font-bold text-pink-600 mb-2">{totalPagesRead}</div>
                <div className="text-sm text-neutral-600 font-medium">Pages lues</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-orange-100"
              >
                <div className="text-3xl font-bold text-orange-600 mb-2">{avgPagesPerBook}</div>
                <div className="text-sm text-neutral-600 font-medium">Pages moyennes</div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="text-center py-20">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-red-300 border-t-red-600"
              />
              <p className="mt-4 text-neutral-600 text-lg font-medium">Chargement...</p>
            </div>
          ) : books.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="mb-6 flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="p-6 bg-gradient-to-br from-red-100 to-pink-100 rounded-full shadow-lg"
                >
                  <BookIcon className="w-16 h-16 text-red-500" />
                </motion.div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3">Aucun historique</h2>
              <p className="text-lg text-neutral-600 mb-8 max-w-md mx-auto">
                Vous n'avez pas encore lu de livres. Commencez votre aventure de lecture dès maintenant !
              </p>
              <Link to="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Découvrir des livres
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <p className="text-xl sm:text-2xl text-neutral-700 font-semibold">
                  {books.length} livre{books.length > 1 ? 's' : ''} dans l'historique
                </p>
              </motion.div>
              <AnimatePresence>
                <div className="space-y-4">
                  {books.map((book, index) => {
                    const historyItem = history.find(h => h.bookId === book.id);
                    const progress = book.page_count > 0 ? Math.round(((historyItem?.page || 0) + 1) / book.page_count * 100) : 0;
                    const coverImageUrl = book.cover_image ? getImageUrl(book.cover_image) : null;
                    
                    // Debug: log pour vérifier les données
                    if (index === 0) {
                      console.log('[History] First book data:', {
                        id: book.id,
                        title: book.title,
                        cover_image: book.cover_image,
                        coverImageUrl: coverImageUrl
                      });
                    }
                    
                    return (
                      <motion.div
                        key={book.id}
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        transition={{ 
                          delay: index * 0.05,
                          duration: 0.4,
                          type: 'spring',
                          stiffness: 100
                        }}
                        whileHover={{ x: 5, scale: 1.02 }}
                        layout
                      >
                        <Link
                          to={`/book-details/${book.id}`}
                          className="bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden group block hover:border-red-300 hover:shadow-xl transition-all shadow-lg"
                        >
                          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 sm:p-6">
                            {/* Image de couverture circulaire */}
                            <div className="flex-shrink-0">
                              <motion.div
                                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-lg border-4 border-white ring-2 ring-neutral-200 group-hover:ring-red-300 transition-all relative bg-gradient-to-br from-neutral-100 to-neutral-50"
                                whileHover={{ scale: 1.05 }}
                              >
                                {coverImageUrl ? (
                                  <>
                                    <img
                                      src={coverImageUrl}
                                      alt={book.title}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        console.error('[History] Image load error:', coverImageUrl);
                                        e.target.style.display = 'none';
                                        const fallback = e.target.parentElement.querySelector('.image-fallback');
                                        if (fallback) fallback.style.display = 'flex';
                                      }}
                                      onLoad={() => {
                                        console.log('[History] Image loaded successfully:', coverImageUrl);
                                      }}
                                    />
                                    <div className="image-fallback w-full h-full absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-50" style={{ display: 'none' }}>
                                      <BookIcon className="w-12 h-12 text-neutral-400" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <BookIcon className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-400" />
                                  </div>
                                )}
                              </motion.div>
                            </div>
                            <div className="flex-1 w-full bg-gradient-to-br from-red-50/30 to-pink-50/30 rounded-xl p-4 sm:p-6">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                                <div className="flex-1">
                                  <h3 className="font-bold text-xl text-neutral-900 group-hover:text-red-600 transition-colors mb-2">
                                    {book.title}
                                  </h3>
                                  {book.author && (
                                    <p className="text-sm text-neutral-600 font-medium mb-3">par {book.author}</p>
                                  )}
                                </div>
                                {historyItem && (
                                  <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-sm text-neutral-500 font-medium bg-white/80 px-3 py-1.5 rounded-full whitespace-nowrap"
                                  >
                                    {formatDate(historyItem.lastRead)}
                                  </motion.span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 flex-wrap mb-4">
                                {historyItem && historyItem.page > 0 && (
                                  <span className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg shadow-md">
                                    Page {historyItem.page + 1} sur {book.page_count || '?'}
                                  </span>
                                )}
                                {book.category_name && (
                                  <span className="px-3 py-1.5 text-xs font-semibold bg-white text-neutral-700 rounded-lg border border-neutral-200">
                                    {book.category_name}
                                  </span>
                                )}
                              </div>
                              {historyItem && book.page_count > 0 && (
                                <div className="mt-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold text-neutral-600">Progression</span>
                                    <span className="text-xs font-bold text-red-600">{progress}%</span>
                                  </div>
                                  <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${progress}%` }}
                                      transition={{ duration: 0.5, delay: index * 0.1 }}
                                      className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default History;

