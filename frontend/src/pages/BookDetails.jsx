import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { booksAPI } from '../api/books';
import { storage } from '../utils/storage';
import { useToast } from '../components/ToastProvider';
import { HeartIcon, BookIcon, ChevronLeftIcon, RefreshIcon } from '../components/Icons';

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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-neutral-300 border-t-neutral-900"></div>
          <p className="mt-4 text-neutral-600 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-neutral-100 rounded-full">
              <BookIcon className="w-12 h-12 text-neutral-400" />
            </div>
          </div>
          <p className="text-neutral-700 text-lg mb-4 font-medium">Livre non trouvé</p>
          <Link to="/" className="btn-primary inline-block">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const hasHistory = storage.getLastPage(id) > 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="glass-effect shadow-lg py-4 px-6 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-neutral-600 hover:text-neutral-900 font-medium flex items-center gap-2 transition-colors">
            <ChevronLeftIcon className="w-4 h-4" />
            <span>Retour</span>
          </Link>
          <button
            onClick={toggleFavorite}
            className={`p-2 rounded-lg transition-all ${
              isFavorite
                ? 'bg-red-50 text-red-600'
                : 'bg-neutral-100 text-neutral-600 hover:bg-red-50'
            }`}
          >
            <HeartIcon className="w-5 h-5" filled={isFavorite} />
          </button>
        </div>
      </motion.header>

      {/* Book Details */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden"
        >
          <div className="md:flex">
            {/* Cover Section */}
            <div className="md:w-1/3 bg-neutral-100 p-8 flex items-center justify-center">
              {book.cover_image ? (
                <motion.img
                  src={`http://localhost:3000${book.cover_image}`}
                  alt={book.title}
                  className="max-w-full max-h-96 object-contain rounded-lg shadow-xl"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookIcon className="w-32 h-32 text-neutral-300" />
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="md:w-2/3 p-8">
              <h1 className="text-3xl font-semibold text-neutral-900 mb-3">{book.title}</h1>
              
              {book.author && (
                <p className="text-lg text-neutral-600 mb-6">par {book.author}</p>
              )}

              {book.description && (
                <div className="mb-6">
                  <h3 className="font-medium text-neutral-700 mb-2">Description</h3>
                  <p className="text-neutral-600 leading-relaxed text-sm">{book.description}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-6">
                {book.category_name && (
                  <span className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-md text-sm font-medium">
                    {book.category_name}
                  </span>
                )}
                {book.age_group_min !== undefined && book.age_group_max !== undefined && (
                  <span className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-md text-sm font-medium">
                    {book.age_group_min}-{book.age_group_max} ans
                  </span>
                )}
                {book.page_count > 0 && (
                  <span className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-md text-sm font-medium">
                    {book.page_count} page{book.page_count > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                {hasHistory ? (
                  <>
                    <button onClick={continueReading} className="btn-primary flex-1">
                      Continuer la lecture
                    </button>
                    <button onClick={startReading} className="btn-secondary flex items-center gap-2">
                      <RefreshIcon className="w-4 h-4" />
                      <span>Recommencer</span>
                    </button>
                  </>
                ) : (
                  <button onClick={startReading} className="btn-primary flex-1">
                    Commencer la lecture
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Livres similaires</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedBooks.map((relatedBook, index) => (
                <Link
                  key={relatedBook.id}
                  to={`/book-details/${relatedBook.id}`}
                  className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:border-neutral-300 transition-all"
                >
                  <div className="h-48 bg-neutral-100 flex items-center justify-center">
                    {relatedBook.cover_image ? (
                      <img
                        src={`http://localhost:3000${relatedBook.cover_image}`}
                        alt={relatedBook.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                        <BookIcon className="w-16 h-16 text-neutral-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-neutral-900 line-clamp-2 text-sm">{relatedBook.title}</h3>
                    {relatedBook.author && (
                      <p className="text-xs text-neutral-600 mt-1">par {relatedBook.author}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default BookDetails;

