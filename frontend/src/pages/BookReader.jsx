import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { booksAPI } from '../api/books';
import { storage } from '../utils/storage';
import { useToast } from '../components/ToastProvider';
import { ChevronLeftIcon, ChevronRightIcon, ZoomInIcon, ZoomOutIcon, MaximizeIcon, MinimizeIcon, BookIcon } from '../components/Icons';

function BookReader() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTurning, setIsTurning] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [startTime] = useState(Date.now());
  const [readingTime, setReadingTime] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    loadBook();
  }, [id]);

  useEffect(() => {
    // Calculer le temps de lecture
    const interval = setInterval(() => {
      setReadingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    // Sauvegarder la page actuelle dans l'historique
    if (book && currentPage >= 0) {
      storage.addToHistory(book.id, book.title, currentPage);
    }
  }, [currentPage, book]);

  useEffect(() => {
    // Gérer le mode plein écran
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Erreur fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') prevPage();
      if (e.key === 'ArrowRight') nextPage();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, book]);

  const loadBook = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getBook(id);
      setBook(response.data);
      
      // Vérifier s'il y a une page spécifiée dans l'URL
      const pageParam = searchParams.get('page');
      const savedPage = pageParam ? parseInt(pageParam) : storage.getLastPage(id);
      setCurrentPage(savedPage || 0);
      
      // Sauvegarder dans l'historique
      storage.addToHistory(id, response.data.title, savedPage || 0);
    } catch (error) {
      console.error('Error loading book:', error);
    } finally {
      setLoading(false);
    }
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) nextPage();
    if (isRightSwipe) prevPage();
  };

  const nextPage = () => {
    if (book && currentPage < (book.pages?.length || 0) - 1 && !isTurning) {
      setIsTurning(true);
      setTimeout(() => {
        setCurrentPage(prev => {
          const newPage = prev + 1;
          if (newPage === book.pages.length - 1) {
            showToast('🎉 Félicitations! Vous avez terminé le livre!', 'success', 3000);
          }
          return newPage;
        });
        setIsTurning(false);
      }, 200);
    }
  };

  const prevPage = () => {
    if (currentPage > 0 && !isTurning) {
      setIsTurning(true);
      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setIsTurning(false);
      }, 200);
    }
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

  if (!book || !book.pages || book.pages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-neutral-100 rounded-full">
              <BookIcon className="w-12 h-12 text-neutral-400" />
            </div>
          </div>
          <p className="text-lg text-neutral-700 font-medium mb-6">Livre non trouvé</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Retour à la bibliothèque
          </button>
        </div>
      </div>
    );
  }

  const currentPageData = book.pages[currentPage];
  const totalPages = book.pages.length;
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;
  const progress = ((currentPage + 1) / totalPages) * 100;

  return (
    <div 
      className="min-h-screen bg-neutral-50 flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="glass-effect border-b border-neutral-200 py-4 px-6 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate('/')}
              className="text-neutral-600 hover:text-neutral-900 font-medium mb-2 flex items-center gap-2 group transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span>Retour</span>
            </button>
            <h1 className="text-xl font-semibold text-neutral-900">{book.title}</h1>
            {book.author && (
              <p className="text-sm text-neutral-500 mt-1">par {book.author}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-neutral-700 mb-1">
                {currentPage + 1} / {totalPages}
              </div>
              <div className="w-32 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-neutral-900 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Mode plein écran"
              >
                {isFullscreen ? <MinimizeIcon className="w-5 h-5" /> : <MaximizeIcon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Zoom"
              >
                {isZoomed ? <ZoomOutIcon className="w-5 h-5" /> : <ZoomInIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Book Reader */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
        <div className="relative max-w-5xl w-full h-full flex items-center">
          {/* Navigation Buttons - Left */}
          <button
            onClick={prevPage}
            disabled={isFirstPage || isTurning}
            className={`absolute left-4 md:left-8 z-10 p-4 rounded-lg transition-all ${
              isFirstPage || isTurning
                ? 'bg-neutral-200 cursor-not-allowed opacity-50'
                : 'bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 shadow-sm'
            }`}
          >
            <ChevronLeftIcon className="w-6 h-6 text-neutral-700" />
          </button>

          {/* Book Container */}
          <motion.div 
            className="flex-1 mx-20 md:mx-32"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`bg-white rounded-lg border border-neutral-200 shadow-sm p-4 md:p-8 lg:p-12 ${isFullscreen ? 'p-2' : ''}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0, scale: isZoomed ? 1.5 : 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ 
                    duration: 0.3,
                    ease: "easeInOut"
                  }}
                  className={`aspect-[4/3] flex items-center justify-center bg-neutral-50 rounded-lg overflow-hidden ${isZoomed ? 'cursor-move' : ''}`}
                  style={isZoomed ? { overflow: 'auto' } : {}}
                >
                  {currentPageData.image_path ? (
                    <motion.img
                      src={`http://localhost:3000${currentPageData.image_path}`}
                      alt={`Page ${currentPage + 1}`}
                      className={`max-w-full max-h-full object-contain ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                      initial={{ scale: 0.95 }}
                      animate={{ scale: isZoomed ? 1.5 : 1 }}
                      transition={{ delay: 0.1 }}
                      onClick={() => setIsZoomed(!isZoomed)}
                      style={isZoomed ? { minWidth: '150%', minHeight: '150%' } : {}}
                    />
                  ) : (
                    <div className="text-center text-neutral-400">
                      <p className="text-lg font-medium text-neutral-600">Page {currentPage + 1}</p>
                      {currentPageData.content && (
                        <p className="mt-4 text-neutral-600 max-w-md mx-auto">{currentPageData.content}</p>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Navigation Buttons - Right */}
          <button
            onClick={nextPage}
            disabled={isLastPage || isTurning}
            className={`absolute right-4 md:right-8 z-10 p-4 rounded-lg transition-all ${
              isLastPage || isTurning
                ? 'bg-neutral-200 cursor-not-allowed opacity-50'
                : 'bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 shadow-sm'
            }`}
          >
            <ChevronRightIcon className="w-6 h-6 text-neutral-700" />
          </button>
        </div>
      </div>

      {/* Page Indicators & Stats */}
      <div className="glass-effect border-t border-neutral-200 py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center gap-1.5 mb-4 flex-wrap">
            {book.pages.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!isTurning) {
                    setIsTurning(true);
                    setTimeout(() => {
                      setCurrentPage(index);
                      setIsTurning(false);
                    }, 200);
                  }
                }}
                className={`rounded-full transition-all ${
                  index === currentPage
                    ? 'bg-neutral-900 w-8 h-2'
                    : 'bg-neutral-300 w-2 h-2 hover:bg-neutral-400 hover:w-4'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-center items-center gap-6 text-xs text-neutral-500">
            <span>Temps: {Math.floor(readingTime / 60)}m {readingTime % 60}s</span>
            <span>•</span>
            <span>Progression: {Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookReader;

