import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { booksAPI } from '../api/books';
import { storage } from '../utils/storage';
import { useToast } from '../components/ToastProvider';
import { HistoryIcon, BookIcon, ChevronLeftIcon, TrashIcon } from '../components/Icons';

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
        
        // Trier selon l'ordre de l'historique
        const sorted = historyData.map(h => 
          historyBooks.find(b => b.id === h.bookId)
        ).filter(Boolean);
        
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

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="glass-effect border-b border-neutral-200 py-4 px-6 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-neutral-600 hover:text-neutral-900 font-medium flex items-center gap-2 transition-colors">
            <ChevronLeftIcon className="w-4 h-4" />
            <span>Retour</span>
          </Link>
          <h1 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
            <HistoryIcon className="w-5 h-5" />
            <span>Historique de Lecture</span>
          </h1>
          {books.length > 0 && (
            <button
              onClick={clearHistory}
              className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Effacer</span>
            </button>
          )}
        </div>
      </motion.header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-neutral-100 rounded-full">
                <BookIcon className="w-12 h-12 text-neutral-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Aucun historique</h2>
            <p className="text-neutral-600 mb-6">Vous n'avez pas encore lu de livres</p>
            <Link to="/" className="btn-primary inline-block">
              Découvrir des livres
            </Link>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <p className="text-xl text-gray-600">
                {books.length} livre{books.length > 1 ? 's' : ''} dans l'historique
              </p>
            </motion.div>
            <AnimatePresence>
              <div className="space-y-4">
                {books.map((book, index) => {
                  const historyItem = history.find(h => h.bookId === book.id);
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
                      className="bg-white rounded-lg border border-neutral-200 overflow-hidden group block hover:border-neutral-300 transition-all"
                    >
                      <div className="flex">
                        <div className="w-32 h-40 flex-shrink-0 bg-neutral-100 overflow-hidden">
                          {book.cover_image ? (
                            <img
                              src={`http://localhost:3000${book.cover_image}`}
                              alt={book.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                              <BookIcon className="w-12 h-12 text-neutral-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 p-5">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg text-neutral-900 group-hover:text-neutral-600 transition-colors">
                              {book.title}
                            </h3>
                            {historyItem && (
                              <span className="text-xs text-neutral-500 ml-4">
                                {formatDate(historyItem.lastRead)}
                              </span>
                            )}
                          </div>
                          {book.author && (
                            <p className="text-sm text-neutral-600 mb-3">par {book.author}</p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            {historyItem && historyItem.page > 0 && (
                              <span className="px-2.5 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-md">
                                Page {historyItem.page + 1} sur {book.page_count || '?'}
                              </span>
                            )}
                            {book.category_name && (
                              <span className="px-2.5 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-md">
                                {book.category_name}
                              </span>
                            )}
                          </div>
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
    </div>
  );
}

export default History;

