import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { booksAPI } from '../api/books';
import { storage } from '../utils/storage';
import { getFileUrl } from '../utils/fileUrl';
import { useToast } from '../components/ToastProvider';
import { ChevronLeftIcon, ChevronRightIcon, HomeIcon, BookIcon, StarIcon, PlayIcon, PauseIcon, VolumeIcon, XIcon } from '../components/Icons';
import ReadingAidPanel from '../components/ReadingAidPanel';

// Configuration de pdfjs-dist
if (typeof window !== 'undefined') {
  // Utiliser jsdelivr CDN avec la version exacte installée (5.4.624)
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs';
}

// Composant pour afficher une page PDF
function PDFPageViewer({ pdfUrl, pageNumber, onLoad, onPdfLoaded }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    
    const loadPage = async () => {
      if (!pdfUrl) {
        setError('URL du PDF manquante');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setImageUrl(null);
        
        console.log('Chargement du PDF:', pdfUrl, 'Page:', pageNumber);
        
        // Charger le document PDF avec options CORS
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: false,
          httpHeaders: {},
          verbosity: 0 // Réduire les logs
        });
        
        const pdf = await loadingTask.promise;
        
        if (cancelled) return;
        
        console.log('PDF chargé, nombre de pages:', pdf.numPages);
        
        // Notifier le composant parent du nombre de pages
        if (onPdfLoaded) {
          onPdfLoaded(pdf.numPages);
        }
        
        // Vérifier que le numéro de page est valide
        const validPageNumber = Math.min(Math.max(1, pageNumber), pdf.numPages);
        const page = await pdf.getPage(validPageNumber);
        
        if (cancelled) return;
        
        // Calculer la taille du viewport pour s'adapter au conteneur
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        if (cancelled) return;
        
        const dataUrl = canvas.toDataURL('image/png');
        setImageUrl(dataUrl);
        if (onLoad) onLoad(dataUrl);
        console.log('Page PDF rendue avec succès');
      } catch (error) {
        if (cancelled) return;
        console.error('Erreur chargement PDF:', error);
        console.error('URL du PDF:', pdfUrl);
        
        // Messages d'erreur plus détaillés
        let errorMessage = 'Erreur lors du chargement du PDF';
        if (error.message) {
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Impossible de charger le PDF. Vérifiez votre connexion.';
          } else if (error.message.includes('Invalid PDF')) {
            errorMessage = 'Le fichier PDF est invalide ou corrompu.';
          } else if (error.message.includes('Missing PDF')) {
            errorMessage = 'Le fichier PDF est introuvable.';
          } else {
            errorMessage = error.message;
          }
        }
        setError(errorMessage);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    loadPage();
    
    return () => {
      cancelled = true;
    };
  }, [pdfUrl, pageNumber, reloadKey]);

  if (loading) {
    return (
      <div className="text-center p-8 w-full">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
        <p className="mt-4 text-purple-600">Chargement du PDF...</p>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="text-center p-8 w-full">
        <BookIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <p className="text-purple-600 mb-2">Erreur de chargement</p>
        {error && <p className="text-sm text-purple-400">{error}</p>}
        <button
          onClick={() => {
            setReloadKey(prev => prev + 1);
          }}
          className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <motion.img
      src={imageUrl}
      alt={`Page ${pageNumber}`}
      className="max-w-full max-h-full object-contain"
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      onError={() => {
        setError('Erreur lors de l\'affichage de l\'image');
        setImageUrl(null);
      }}
    />
  );
}

// Composant pour les confettis de célébration
function Confetti({ show }) {
  if (!show) return null;
  
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: '-10px',
          }}
          initial={{ y: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: window.innerHeight + 100,
            rotate: 360,
            opacity: 0,
            x: (Math.random() - 0.5) * 200,
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 0.5,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// Composant pour les étoiles animées
function StarParticles({ count = 20 }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-400"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${10 + Math.random() * 20}px`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        >
          <StarIcon className="w-4 h-4" />
        </motion.div>
      ))}
    </div>
  );
}

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
  const [showConfetti, setShowConfetti] = useState(false);
  const [pageDirection, setPageDirection] = useState('next');
  const [startTime] = useState(Date.now());
  const [readingTime, setReadingTime] = useState(0);
  const [showReadingAid, setShowReadingAid] = useState(false);
  const [readingSettings, setReadingSettings] = useState({
    font: 'system',
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    syllabification: false,
    lineSpacing: false,
    wordHighlight: false
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechUtterance, setSpeechUtterance] = useState(null);
  const [extractedTexts, setExtractedTexts] = useState({}); // Cache pour les textes extraits par OCR/PDF
  const [isExtracting, setIsExtracting] = useState(false);
  const [pdfDocuments, setPdfDocuments] = useState({}); // Cache pour les documents PDF chargés
  const [pdfPages, setPdfPages] = useState({}); // Cache pour les pages PDF rendues (canvas)
  const [pdfTotalPages, setPdfTotalPages] = useState(null); // Nombre total de pages dans le PDF actuel
  const [currentPdfUrl, setCurrentPdfUrl] = useState(null); // URL du PDF actuellement chargé
  const [isFullscreen, setIsFullscreen] = useState(false); // Mode plein écran
  const workerRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadBook();
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setReadingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Fonctions pour la lecture audio
  const stopAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setSpeechUtterance(null);
  };

  useEffect(() => {
    if (book && currentPage >= 0) {
      storage.addToHistory(book.id, book.title, currentPage);
    }
    // Arrêter la lecture audio quand on change de page
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setSpeechUtterance(null);
    }
  }, [currentPage, book]);

  // Enregistrer une session de lecture (durée + livre terminé ou non) au démontage
  useEffect(() => {
    return () => {
      if (!book) return;

      const durationSeconds = readingTime || Math.floor((Date.now() - startTime) / 1000);

      const totalPages = book?.pages?.length || 0;
      const finished = totalPages > 0 ? currentPage >= totalPages - 1 : false;

      storage.addReadingSession(book.id, book.title, durationSeconds, finished);

      // Nettoyer la synthèse vocale
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setSpeechUtterance(null);
    };
  }, [book, currentPage, readingTime, startTime]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') prevPage();
      if (e.key === 'ArrowRight') nextPage();
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          navigate('/');
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, book, isFullscreen]);

  const loadBook = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getBook(id);
      setBook(response.data);
      
      const pageParam = searchParams.get('page');
      const savedPage = pageParam ? parseInt(pageParam) : storage.getLastPage(id);
      setCurrentPage(savedPage || 0);
      
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
    // Calculer le nombre total de pages effectif (PDF ou pages normales)
    const firstPageData = book?.pages?.[0];
    const isPDF = firstPageData?.image_path?.toLowerCase().endsWith('.pdf');
    const firstPageUrl = firstPageData?.image_path ? getFileUrl(firstPageData.image_path) : null;
    const effectiveTotalPages = (isPDF && pdfTotalPages && currentPdfUrl === firstPageUrl) 
      ? pdfTotalPages 
      : (book?.pages?.length || 0);
    
    if (book && currentPage < effectiveTotalPages - 1 && !isTurning) {
      setPageDirection('next');
      setIsTurning(true);
      // Arrêter l'audio lors du changement de page
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setSpeechUtterance(null);
      }
      
      setTimeout(() => {
        setCurrentPage(prev => {
          const newPage = prev + 1;
          // Vérifier si on atteint la dernière page
          if (newPage === effectiveTotalPages - 1) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
            showToast('Bravo ! Tu as terminé le livre !', 'success', 4000);
          }
          return newPage;
        });
        setTimeout(() => setIsTurning(false), 100);
      }, 200);
    }
  };

  const prevPage = () => {
    if (currentPage > 0 && !isTurning) {
      setPageDirection('prev');
      setIsTurning(true);
      // Arrêter l'audio lors du changement de page
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setSpeechUtterance(null);
      }
      
      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setTimeout(() => setIsTurning(false), 100);
      }, 200);
    }
  };

  const playAudio = async () => {
    try {
      if (!book || !book.pages || book.pages.length === 0) {
        showToast('Cette page ne contient pas de texte à lire', 'info', 3000);
        return;
      }

      // Vérifier si la synthèse vocale est disponible
      if (!('speechSynthesis' in window)) {
        showToast('La lecture audio n\'est pas disponible sur votre navigateur', 'error', 3000);
        return;
      }

      // Arrêter toute lecture en cours
      stopAudio();

      // Pour un PDF, on utilise toujours la première entrée de la base
      // mais currentPage représente la page du PDF (0 à pdfTotalPages-1)
      const firstPageData = book.pages[0];
      const isPDF = firstPageData?.image_path?.toLowerCase().endsWith('.pdf');
      const pageData = isPDF ? firstPageData : book.pages[currentPage];
      
      if (!pageData) {
        showToast('Page introuvable', 'error', 3000);
        return;
      }

      let textToRead = pageData.content;

      // Si pas de texte dans la base de données, essayer d'extraire depuis le fichier
      if (!textToRead && pageData.image_path) {
        try {
          const fileUrl = getFileUrl(pageData.image_path);
          const fileExtension = pageData.image_path.toLowerCase().split('.').pop();
          
          // Vérifier si c'est un PDF
          if (fileExtension === 'pdf') {
            const cacheKey = `${fileUrl}-${currentPage + 1}`;
            
            // Vérifier si on a déjà extrait le texte de cette page du PDF
            if (extractedTexts[cacheKey]) {
              textToRead = extractedTexts[cacheKey];
            } else {
              // Extraire le texte du PDF (pageNumber est 1-indexed)
              textToRead = await extractTextFromPDF(fileUrl, currentPage + 1);
              if (textToRead) {
                setExtractedTexts(prev => ({ ...prev, [cacheKey]: textToRead }));
              }
            }
          } else {
            // C'est une image, utiliser OCR
            if (extractedTexts[fileUrl]) {
              textToRead = extractedTexts[fileUrl];
            } else {
              // Extraire le texte avec OCR
              textToRead = await extractTextFromImage(fileUrl);
              if (textToRead) {
                setExtractedTexts(prev => ({ ...prev, [fileUrl]: textToRead }));
              }
            }
          }
        } catch (extractError) {
          console.error('Erreur lors de l\'extraction du texte:', extractError);
          showToast('Impossible d\'extraire le texte de cette page', 'error', 3000);
          return;
        }
      }

      if (!textToRead || textToRead.trim().length === 0) {
        showToast('Cette page ne contient pas de texte à lire', 'info', 3000);
        return;
      }

      // Attendre que les voix soient chargées
      const waitForVoices = () => {
        return new Promise((resolve) => {
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            resolve(voices);
          } else {
            // Attendre que les voix soient chargées
            const checkVoices = () => {
              const loadedVoices = window.speechSynthesis.getVoices();
              if (loadedVoices.length > 0) {
                resolve(loadedVoices);
              } else {
                setTimeout(checkVoices, 100);
              }
            };
            window.speechSynthesis.onvoiceschanged = checkVoices;
            // Timeout après 2 secondes
            setTimeout(() => {
              if (window.speechSynthesis.onvoiceschanged === checkVoices) {
                window.speechSynthesis.onvoiceschanged = null;
              }
              resolve(window.speechSynthesis.getVoices());
            }, 2000);
          }
        });
      };

      const voices = await waitForVoices();

      const utterance = new SpeechSynthesisUtterance(textToRead.trim());
      
      // Configuration de la voix (essayer de trouver une voix française)
      const frenchVoice = voices.find(voice => 
        voice.lang.startsWith('fr') || voice.name.toLowerCase().includes('french')
      );
      
      if (frenchVoice) {
        utterance.voice = frenchVoice;
        utterance.lang = 'fr-FR';
      } else {
        utterance.lang = 'fr-FR';
      }

      utterance.rate = speechRate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setIsPlaying(true);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setSpeechUtterance(null);
      };

      utterance.onerror = (event) => {
        console.error('Erreur de synthèse vocale:', event);
        setIsPlaying(false);
        setSpeechUtterance(null);
        
        // Messages d'erreur plus spécifiques
        let errorMessage = 'Erreur lors de la lecture audio';
        if (event.error === 'not-allowed') {
          errorMessage = 'Permission refusée pour la lecture audio';
        } else if (event.error === 'network') {
          errorMessage = 'Erreur réseau lors de la lecture audio';
        } else if (event.error === 'synthesis-failed') {
          errorMessage = 'La synthèse vocale a échoué';
        } else if (event.error === 'synthesis-unavailable') {
          errorMessage = 'La synthèse vocale n\'est pas disponible';
        }
        
        showToast(errorMessage, 'error', 3000);
      };

      setSpeechUtterance(utterance);
      
      // Vérifier que speechSynthesis est toujours disponible avant de parler
      if (window.speechSynthesis && window.speechSynthesis.speak) {
        window.speechSynthesis.speak(utterance);
      } else {
        showToast('La synthèse vocale n\'est plus disponible', 'error', 3000);
      }
    } catch (error) {
      console.error('Erreur dans playAudio:', error);
      setIsPlaying(false);
      setSpeechUtterance(null);
      showToast('Une erreur est survenue lors de la lecture audio', 'error', 3000);
    }
  };

  const toggleAudio = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playAudio();
    }
  };

  // Initialiser le worker Tesseract
  useEffect(() => {
    const initOCR = async () => {
      try {
        const worker = await createWorker('fra'); // Langue française
        workerRef.current = worker;
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de Tesseract:', error);
      }
    };
    
    initOCR();
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Charger les voix disponibles au chargement
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Les voix peuvent ne pas être chargées immédiatement
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          console.log('Voix disponibles:', voices.map(v => `${v.name} (${v.lang})`));
        }
      };
      
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
      
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  // Fonction pour extraire le texte d'un PDF
  const extractTextFromPDF = async (pdfUrl, pageNumber) => {
    try {
      setIsExtracting(true);
      showToast('Extraction du texte du PDF en cours...', 'info', 2000);
      
      // Charger le document PDF
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      
      // Mettre en cache le document PDF
      setPdfDocuments(prev => ({
        ...prev,
        [pdfUrl]: pdf
      }));
      
      // Obtenir la page spécifique (pageNumber est 1-indexed dans PDF)
      const page = await pdf.getPage(pageNumber);
      
      // Extraire le texte de la page
      const textContent = await page.getTextContent();
      const textItems = textContent.items.map(item => item.str);
      const fullText = textItems.join(' ').trim();
      
      if (fullText) {
        // Mettre en cache le texte extrait avec la clé pdfUrl-pageNumber
        const cacheKey = `${pdfUrl}-${pageNumber}`;
        setExtractedTexts(prev => ({
          ...prev,
          [cacheKey]: fullText
        }));
        return fullText;
      } else {
        showToast('Aucun texte détecté dans cette page du PDF', 'info', 3000);
        return null;
      }
    } catch (error) {
      console.error('Erreur extraction PDF:', error);
      console.error('URL du PDF:', pdfUrl);
      
      let errorMessage = 'Erreur lors de l\'extraction du texte du PDF';
      if (error.message) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Impossible de charger le PDF pour l\'extraction du texte.';
        } else if (error.message.includes('Invalid PDF')) {
          errorMessage = 'Le fichier PDF est invalide ou corrompu.';
        } else {
          errorMessage = `Erreur: ${error.message}`;
        }
      }
      showToast(errorMessage, 'error', 3000);
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  // Fonction pour extraire le texte d'une image avec OCR
  const extractTextFromImage = async (imageUrl) => {
    if (!workerRef.current) {
      showToast('OCR non disponible. Veuillez recharger la page.', 'error', 3000);
      return null;
    }

    try {
      setIsExtracting(true);
      showToast('Extraction du texte de l\'image en cours...', 'info', 2000);
      
      const { data: { text } } = await workerRef.current.recognize(imageUrl);
      const cleanedText = text.trim();
      
      if (cleanedText) {
        // Mettre en cache le texte extrait
        setExtractedTexts(prev => ({
          ...prev,
          [imageUrl]: cleanedText
        }));
        return cleanedText;
      } else {
        showToast('Aucun texte détecté dans l\'image', 'info', 3000);
        return null;
      }
    } catch (error) {
      console.error('Erreur OCR:', error);
      showToast('Erreur lors de l\'extraction du texte', 'error', 3000);
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
          className="text-center"
        >
          <div className="text-6xl mb-4">📚</div>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-xl font-bold text-purple-600 mt-4"
          >
            Chargement de l'histoire...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!book || !book.pages || book.pages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-6 flex justify-center"
          >
            <div className="p-6 bg-white rounded-full shadow-lg">
              <BookIcon className="w-16 h-16 text-purple-400" />
            </div>
          </motion.div>
          <p className="text-2xl font-bold text-purple-700 mb-6">Livre non trouvé</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            Retour à la bibliothèque
          </motion.button>
        </div>
      </div>
    );
  }

  // Pour un PDF, on utilise toujours la première (et seule) entrée de la base
  // mais on navigue dans les pages du PDF avec currentPage
  const firstPageData = book.pages[0];
  const isPDF = firstPageData?.image_path?.toLowerCase().endsWith('.pdf');
  const currentPageData = isPDF ? firstPageData : book.pages[currentPage];
  
  // Si c'est un PDF, utiliser le nombre de pages du PDF, sinon utiliser le nombre de pages dans la base
  const firstPageUrl = firstPageData?.image_path ? getFileUrl(firstPageData.image_path) : null;
  const effectiveTotalPages = (isPDF && pdfTotalPages && currentPdfUrl === firstPageUrl) 
    ? pdfTotalPages 
    : book.pages.length;
  
  const totalPages = effectiveTotalPages;
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;
  const progress = ((currentPage + 1) / totalPages) * 100;

  return (
    <>
      {/* Mode plein écran pour PDF */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setIsFullscreen(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bouton fermer */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-colors"
                title="Fermer (Échap)"
              >
                <XIcon className="w-6 h-6" />
              </motion.button>

              {/* Bouton Écouter */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAudio();
                }}
                disabled={isExtracting || (!currentPageData?.content && !currentPageData?.image_path)}
                className={`absolute top-4 left-4 z-10 flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors backdrop-blur-sm ${
                  isPlaying
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : isExtracting
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                } ${(isExtracting || (!currentPageData?.content && !currentPageData?.image_path)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isExtracting ? 'Extraction du texte...' : isPlaying ? 'Arrêter la lecture' : 'Lire la page'}
              >
                {isExtracting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : isPlaying ? (
                  <PauseIcon className="w-6 h-6" />
                ) : (
                  <PlayIcon className="w-6 h-6" />
                )}
                <span className="text-lg">
                  {isExtracting ? 'OCR...' : isPlaying ? 'Pause' : 'Écouter'}
                </span>
              </motion.button>

              {/* Navigation pages */}
              {!isFirstPage && (
                <motion.button
                  whileHover={{ scale: 1.15, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    prevPage();
                  }}
                  disabled={isTurning}
                  className="absolute left-4 z-10 p-4 rounded-full shadow-2xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all"
                >
                  <ChevronLeftIcon className="w-8 h-8" />
                </motion.button>
              )}

              {!isLastPage && (
                <motion.button
                  whileHover={{ scale: 1.15, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    nextPage();
                  }}
                  disabled={isTurning}
                  className="absolute right-4 z-10 p-4 rounded-full shadow-2xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all"
                >
                  <ChevronRightIcon className="w-8 h-8" />
                </motion.button>
              )}

              {/* Page PDF en plein écran */}
              {currentPageData.image_path && (() => {
                const fileUrl = getFileUrl(currentPageData.image_path);
                const fileExtension = currentPageData.image_path.toLowerCase().split('.').pop();
                const isPDF = fileExtension === 'pdf';
                
                if (isPDF) {
                  return (
                    <div className="w-full h-full flex items-center justify-center">
                      <PDFPageViewer 
                        key={`pdf-fullscreen-${fileUrl}-${currentPage}`}
                        pdfUrl={fileUrl} 
                        pageNumber={currentPage + 1}
                        onPdfLoaded={(numPages) => {
                          if (numPages && numPages > 0) {
                            setPdfTotalPages(numPages);
                            setCurrentPdfUrl(fileUrl);
                          }
                        }}
                      />
                    </div>
                  );
                }
                
                return (
                  <motion.img
                    src={fileUrl}
                    alt={`Page ${currentPage + 1}`}
                    className="max-w-full max-h-full object-contain"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  />
                );
              })()}

              {/* Indicateur de page */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/20 text-white px-6 py-3 rounded-full font-bold text-lg backdrop-blur-sm shadow-lg"
              >
                {currentPage + 1} / {totalPages}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 flex flex-col relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Confetti show={showConfetti} />
        <StarParticles count={15} />

      {/* Header coloré et amusant */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white py-4 px-6 sticky top-0 z-40 shadow-lg"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full font-semibold transition-colors backdrop-blur-sm"
          >
            <HomeIcon className="w-5 h-5" />
            <span>Accueil</span>
          </motion.button>
          
          <div className="text-center flex-1 mx-4">
            <h1 className="text-xl md:text-2xl font-bold drop-shadow-lg">{book.title}</h1>
            {book.author && (
              <p className="text-sm md:text-base opacity-90 mt-1">par {book.author}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Bouton lecture audio */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleAudio}
              disabled={isExtracting || (!currentPageData?.content && !currentPageData?.image_path)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors backdrop-blur-sm ${
                isPlaying
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : isExtracting
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              } ${(isExtracting || (!currentPageData?.content && !currentPageData?.image_path)) ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isExtracting ? 'Extraction du texte...' : isPlaying ? 'Arrêter la lecture' : 'Lire la page (OCR si nécessaire)'}
            >
              {isExtracting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : isPlaying ? (
                <PauseIcon className="w-5 h-5" />
              ) : (
                <PlayIcon className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">
                {isExtracting ? 'OCR...' : isPlaying ? 'Pause' : 'Écouter'}
              </span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowReadingAid(true)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full font-semibold transition-colors backdrop-blur-sm"
              title="Aide à la lecture"
            >
              <span className="hidden sm:inline">Aide</span>
            </motion.button>
            <div className="text-right">
              <div className="text-lg font-bold mb-2">
                {currentPage + 1} / {totalPages}
              </div>
              <div className="w-32 h-3 bg-white/30 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  className="h-full bg-white rounded-full shadow-lg"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Panneau d'aide à la lecture */}
      <ReadingAidPanel
        isOpen={showReadingAid}
        onClose={() => setShowReadingAid(false)}
        settings={readingSettings}
        onSettingsChange={setReadingSettings}
      />

      {/* Zone de lecture principale */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
        <div className="relative max-w-6xl w-full h-full flex items-center">
          
          {/* Bouton précédent - Grand et coloré */}
          <motion.button
            whileHover={{ scale: 1.15, x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevPage}
            disabled={isFirstPage || isTurning}
            className={`absolute left-2 md:left-8 z-20 p-4 md:p-6 rounded-full shadow-2xl transition-all ${
              isFirstPage || isTurning
                ? 'bg-gray-300 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
            }`}
          >
            <ChevronLeftIcon className="w-8 h-8 md:w-10 md:h-10" />
          </motion.button>

          {/* Livre avec effet 3D */}
          <motion.div 
            className="flex-1 mx-16 md:mx-32"
            style={{ perspective: '1000px' }}
          >
            <motion.div
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-2xl p-4 md:p-8 lg:p-12 border-4 border-white"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ 
                    opacity: 0, 
                    x: pageDirection === 'next' ? 100 : -100,
                    rotateY: pageDirection === 'next' ? 90 : -90
                  }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    rotateY: 0,
                    scale: 1
                  }}
                  exit={{ 
                    opacity: 0, 
                    x: pageDirection === 'next' ? -100 : 100,
                    rotateY: pageDirection === 'next' ? -90 : 90
                  }}
                  transition={{ 
                    duration: 0.4,
                    ease: "easeInOut"
                  }}
                  className="aspect-[4/3] flex items-center justify-center rounded-2xl overflow-hidden shadow-inner relative"
                  style={{
                    backgroundColor: readingSettings.backgroundColor,
                    color: readingSettings.textColor
                  }}
                >
                  {currentPageData.image_path ? (() => {
                    const fileUrl = getFileUrl(currentPageData.image_path);
                    const fileExtension = currentPageData.image_path.toLowerCase().split('.').pop();
                    const isPDF = fileExtension === 'pdf';
                    
                    if (isPDF) {
                      return (
                        <motion.div
                          onClick={() => setIsFullscreen(true)}
                          className="cursor-pointer w-full h-full flex items-center justify-center"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <PDFPageViewer 
                            key={`pdf-${fileUrl}-${currentPage}`}
                            pdfUrl={fileUrl} 
                            pageNumber={currentPage + 1}
                            onPdfLoaded={(numPages) => {
                              // Mettre à jour le nombre total de pages si c'est un PDF
                              if (numPages && numPages > 0) {
                                setPdfTotalPages(numPages);
                                setCurrentPdfUrl(fileUrl);
                              }
                            }}
                          />
                        </motion.div>
                      );
                    }
                    
                    return (
                    <motion.img
                        src={fileUrl}
                      alt={`Page ${currentPage + 1}`}
                        className="max-w-full max-h-full object-contain"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      />
                    );
                  })() : (
                    <div className="text-center p-8 w-full">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="mb-4 flex justify-center"
                      >
                        <BookIcon className="w-16 h-16 text-purple-600" />
                      </motion.div>
                      <p 
                        className="font-bold mb-4"
                        style={{
                          fontSize: `${readingSettings.fontSize * 1.5}px`,
                          fontFamily: readingSettings.font === 'dyslexic' ? 'OpenDyslexic, sans-serif' : 
                                      readingSettings.font === 'times' ? 'Times New Roman, serif' :
                                      readingSettings.font === 'comic' ? 'Comic Sans MS, cursive' : 'Arial, sans-serif',
                          lineHeight: readingSettings.lineSpacing ? '2' : '1.5'
                        }}
                      >
                        Page {currentPage + 1}
                      </p>
                      {currentPageData.content && (
                        <p 
                          className="max-w-md mx-auto"
                          style={{
                            fontSize: `${readingSettings.fontSize}px`,
                            fontFamily: readingSettings.font === 'dyslexic' ? 'OpenDyslexic, sans-serif' : 
                                        readingSettings.font === 'times' ? 'Times New Roman, serif' :
                                        readingSettings.font === 'comic' ? 'Comic Sans MS, cursive' : 'Arial, sans-serif',
                            lineHeight: readingSettings.lineSpacing ? '2' : '1.5',
                            letterSpacing: readingSettings.syllabification ? '0.1em' : 'normal'
                          }}
                        >
                          {readingSettings.syllabification && currentPageData.content
                            ? currentPageData.content.split(' ').map((word, i) => (
                                <span key={i} className="inline-block mr-1">
                                  {word.split('').map((char, j) => (
                                    <span key={j} className={j % 2 === 0 ? '' : 'text-blue-500'}>
                                      {char}
                                    </span>
                                  ))}
                                </span>
                              ))
                            : currentPageData.content}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Numéro de page en bas */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute bottom-4 right-4 bg-purple-500/80 text-white px-4 py-2 rounded-full font-bold text-sm backdrop-blur-sm shadow-lg"
                  >
                    {currentPage + 1} / {totalPages}
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Bouton suivant - Grand et coloré */}
          <motion.button
            whileHover={{ scale: 1.15, x: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextPage}
            disabled={isLastPage || isTurning}
            className={`absolute right-2 md:right-8 z-20 p-4 md:p-6 rounded-full shadow-2xl transition-all ${
              isLastPage || isTurning
                ? 'bg-gray-300 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white'
            }`}
          >
            <ChevronRightIcon className="w-8 h-8 md:w-10 md:h-10" />
          </motion.button>
        </div>
      </div>

      {/* Footer avec indicateurs de pages */}
      <motion.footer
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white py-6 px-6 shadow-lg"
      >
        <div className="max-w-7xl mx-auto">
          {/* Indicateurs de pages - style amusant */}
          <div className="flex justify-center items-center gap-2 mb-4 flex-wrap">
            {book.pages.map((_, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.3, y: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (!isTurning) {
                    setPageDirection(index > currentPage ? 'next' : 'prev');
                    setIsTurning(true);
                    setTimeout(() => {
                      setCurrentPage(index);
                      setIsTurning(false);
                    }, 300);
                  }
                }}
                className={`rounded-full transition-all shadow-lg ${
                  index === currentPage
                    ? 'bg-white w-10 h-3 shadow-xl'
                    : 'bg-white/40 w-3 h-3 hover:bg-white/60 hover:w-6'
                }`}
              />
            ))}
          </div>

          {/* Stats et progression */}
          <div className="flex justify-center items-center gap-6 text-sm md:text-base font-semibold">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm"
            >
              <span>{Math.floor(readingTime / 60)}m {readingTime % 60}s</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm"
            >
              <StarIcon className="w-6 h-6" />
              <span>{Math.round(progress)}% terminé</span>
            </motion.div>
          </div>

          {/* Message de fin */}
          {isLastPage && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-4 text-center"
            >
              <div className="inline-flex items-center gap-2 bg-white/30 px-6 py-3 rounded-full backdrop-blur-sm">
                <StarIcon className="w-8 h-8 text-yellow-400" />
                <span className="font-bold text-lg">Bravo ! Tu as terminé l'histoire !</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.footer>
    </div>
    </>
  );
}

export default BookReader;
