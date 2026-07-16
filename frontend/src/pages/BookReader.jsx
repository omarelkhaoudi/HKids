import {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate, useSearchParams, useLocation} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {Button, Modal} from '../components/ui';

import {createWorker} from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import {booksAPI} from '../api/books';
import {subscriptionsAPI} from '../api/subscriptions';
import {parentalAPI} from '../api/parental';
import {syncOrQueueKidMutation} from '../services/parental/kidActivitySyncService';
import {voicesAPI} from '../api/voices';
import {storage} from '../utils/storage';
import {getFileUrl} from '../utils/fileUrl';
import {useToast} from '../components/ToastProvider';
import {useAuth} from '../context/AuthContext';
import {useLanguage} from '../context/LanguageContext';
import {ChevronLeftIcon, ChevronRightIcon, HomeIcon, BookIcon, StarIcon, PlayIcon, PauseIcon, SettingsIcon, WarningIcon} from '../components/Icons';
import ReadingAidPanel from '../components/ReadingAidPanel';
import {ContentReportModal} from '../components/parent/ContentReportModal';
import {AudioPlayer} from '../components/audio/AudioPlayer';
import {useAudioPlayer} from '../hooks/useAudioPlayer';
import {KidsCelebration} from '../components/kids/KidsCelebration';
import {KidsBedtimeAtmosphere} from '../components/kids/KidsBedtimeAtmosphere';
import {KidsStoryOpening} from '../components/kids/KidsStoryOpening';
import {useReducedMotion} from '../hooks/useReducedMotion';

// Configuration de pdfjs-dist
if (typeof window !== 'undefined') {
 // Utiliser jsdelivr CDN avec la version exacte installée (5.4.624)
 pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs';
}

const voiceProfiles = [
 {
 id: 'woman',
 label: 'Femme',
 description: 'Une voix douce et claire pour raconter calmement.',
 icon: 'F',
 preferredGender: 'female',
 sampleText: 'Bonjour, je vais lire cette histoire avec une voix de femme.',
 rate: 0.95,
 pitch: 1.05,
},
 {
 id: 'man',
 label: 'Homme',
 description: 'Une voix posee, profonde et rassurante.',
 icon: 'H',
 preferredGender: 'male',
 sampleText: 'Bonjour, je vais lire cette histoire avec une voix d homme.',
 rate: 0.92,
 pitch: 0.85,
},
 {
 id: 'girl',
 label: 'Petite fille',
 description: 'Une voix plus legere et expressive.',
 icon: 'PF',
 preferredGender: 'female',
 sampleText: 'Bonjour, je vais lire cette histoire avec une voix de petite fille.',
 rate: 1.02,
 pitch: 1.35,
},
 {
 id: 'boy',
 label: 'Petit garcon',
 description: 'Une voix vive avec un ton enfantin.',
 icon: 'PG',
 preferredGender: 'male',
 sampleText: 'Bonjour, je vais lire cette histoire avec une voix de petit garcon.',
 rate: 1.0,
 pitch: 1.22,
},
];

const femaleVoiceHints = ['amelie', 'amélie', 'denise', 'audrey', 'marie', 'hortense', 'sylvie', 'celine', 'céline', 'lea', 'léa', 'female', 'woman'];
const maleVoiceHints = ['henri', 'thomas', 'paul', 'claude', 'daniel', 'male', 'man'];
const NARRATION_PROFILE_STORAGE_KEY = 'hkids_narration_voice_profile';

function pickNarrationVoice(voices, profile) {
 const frenchVoices = voices.filter((voice) =>
 voice.lang?.toLowerCase().startsWith('fr') ||
 voice.name?.toLowerCase().includes('french') ||
 voice.name?.toLowerCase().includes('francais') ||
 voice.name?.toLowerCase().includes('français')
 );
 const candidates = frenchVoices.length > 0 ? frenchVoices : voices;
 const hints = profile.preferredGender === 'male' ? maleVoiceHints : femaleVoiceHints;

 return (
 candidates.find((voice) => hints.some((hint) => voice.name.toLowerCase().includes(hint))) ||
 candidates.find((voice) => voice.localService) ||
 candidates[0] ||
 null
 );
}

function applyNarrationProfile(utterance, voices, profile, baseRate = 1) {
 const narrationVoice = pickNarrationVoice(voices, profile);

 if (narrationVoice) {
 utterance.voice = narrationVoice;
}

 utterance.lang = narrationVoice?.lang?.toLowerCase().startsWith('fr') ? narrationVoice.lang : 'fr-FR';
 utterance.rate = Math.min(1.4, Math.max(0.65, baseRate * profile.rate));
 utterance.pitch = profile.pitch;
 utterance.volume = 1.0;

 return narrationVoice;
}

function waitForSpeechVoices() {
 return new Promise((resolve) => {
 if (!window.speechSynthesis) {
 resolve([]);
 return;
}

 const voices = window.speechSynthesis.getVoices();
 if (voices.length > 0) {
 resolve(voices);
 return;
}

 let timeoutId;
 const oldHandler = window.speechSynthesis.onvoiceschanged;
 const checkVoices = () => {
 if (!window.speechSynthesis) {
 resolve([]);
 return;
}

 const loadedVoices = window.speechSynthesis.getVoices();
 if (loadedVoices.length > 0) {
 if (window.speechSynthesis.onvoiceschanged === checkVoices) {
 window.speechSynthesis.onvoiceschanged = oldHandler;
}
 if (timeoutId) clearTimeout(timeoutId);
 resolve(loadedVoices);
}
};

 window.speechSynthesis.onvoiceschanged = checkVoices;
 timeoutId = setTimeout(() => {
 if (window.speechSynthesis?.onvoiceschanged === checkVoices) {
 window.speechSynthesis.onvoiceschanged = oldHandler;
}
 resolve(window.speechSynthesis?.getVoices() || []);
}, 2000);
});
}

// Composant pour afficher une page PDF
function PDFPageViewer({pdfUrl, pageNumber, onLoad, onPdfLoaded, imageClassName = 'max-w-full max-h-full object-contain', isKidMinimal = false}) {
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
 const viewport = page.getViewport({scale: 2.0});
 
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
 <div className="text-center p-space-8 w-full">
 <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
 {!isKidMinimal && <p className="mt-space-4 text-primary-600">Chargement du PDF...</p>}
 </div>
 );
}

 if (error || !imageUrl) {
 return (
 <div className="text-center p-space-8 w-full">
 <BookIcon className="w-16 h-16 text-primary-400 mx-auto mb-space-4" />
 {!isKidMinimal && (
  <>
   <p className="text-primary-600 mb-2">Erreur de chargement</p>
   {error && <p className="text-sm text-primary-400">{error}</p>}
  </>
 )}
 <button
 onClick={() => {
 setReloadKey(prev => prev + 1);
}}
 className="mt-space-4 px-space-4 py-2 bg-primary-500 text-white rounded-2xl hover:bg-primary-600 transition-colors"
 aria-label={isKidMinimal ? 'Retry' : undefined}
 >
 {isKidMinimal ? '↻' : 'Réessayer'}
 </button>
 </div>
 );
}

 return (
 <motion.img
 src={imageUrl}
 alt={`Page ${pageNumber}`}
 className={imageClassName}
 initial={{scale: 0.9}}
 animate={{scale: 1}}
 transition={{delay: 0.2, duration: 0.3}}
 onError={() => {
 setError('Erreur lors de l\'affichage de l\'image');
 setImageUrl(null);
}}
 />
 );
}

// Composant pour les confettis de célébration
function Confetti({show}) {
 if (!show) return null;
 
 const colors = [
 'var(--color-secondary-400)',
 'var(--color-danger-500)',
 'var(--color-success-400)',
 'var(--color-primary-400)',
 'var(--color-orange-400)',
 'var(--color-magic-400)',
 'var(--color-secondary-300)'
 ];
 
 return (
 <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
 {Array.from({length: 50}).map((_, i) => (
 <motion.div
 key={i}
 className="absolute w-3 h-3 rounded-full"
 style={{
 backgroundColor: colors[i % colors.length],
 left: `${Math.random() * 100}%`,
 top: '-10px',
}}
 initial={{y: 0, rotate: 0, opacity: 1}}
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
function StarParticles({count = 20}) {
 return (
 <div className="absolute inset-0 pointer-events-none overflow-hidden">
 {Array.from({length: count}).map((_, i) => (
 <motion.div
 key={i}
 className="absolute text-secondary-400"
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
 const {id} = useParams();
 const [searchParams] = useSearchParams();
 const navigate = useNavigate();
 const location = useLocation();
 const isKidReader = location.pathname.startsWith('/kids/read/');
 const { t, isRtl } = useLanguage();
 const [book, setBook] = useState(null);
 const [currentPage, setCurrentPage] = useState(0);
 const [loading, setLoading] = useState(true);
 const [isTurning, setIsTurning] = useState(false);
 const [touchStart, setTouchStart] = useState(null);
 const [touchEnd, setTouchEnd] = useState(null);
 const [showConfetti, setShowConfetti] = useState(false);
 const [hasReachedEnd, setHasReachedEnd] = useState(false);
 const [pageDirection, setPageDirection] = useState('next');
 const [showReadingAid, setShowReadingAid] = useState(false);
 const [readingSettings, setReadingSettings] = useState(() => {
 const prefs = storage.getPreferences();
 return {
 font: 'system',
 fontSize: 16,
 backgroundColor: '#FFFFFF',
 textColor: '#000000',
 syllabification: false,
 lineSpacing: prefs.reading_wide_spacing ?? false,
 wordHighlight: false
};
});
 const [isPlaying, setIsPlaying] = useState(false);
 const [speechRate, setSpeechRate] = useState(1.0);
 const [selectedVoiceProfile, setSelectedVoiceProfile] = useState(() => {
 if (typeof window === 'undefined') return 'woman';
 const savedProfile = window.localStorage.getItem(NARRATION_PROFILE_STORAGE_KEY);
 return voiceProfiles.some((profile) => profile.id === savedProfile) ? savedProfile : 'woman';
});
 const [availableVoices, setAvailableVoices] = useState([]);
 const [, setSpeechUtterance] = useState(null);
 const [extractedTexts, setExtractedTexts] = useState({}); // Cache pour les textes extraits par OCR/PDF
 const [isExtracting, setIsExtracting] = useState(false);
 const [, setPdfDocuments] = useState({}); // Cache pour les documents PDF chargés
 const [pdfTotalPages, setPdfTotalPages] = useState(null); // Nombre total de pages dans le PDF actuel
 const [currentPdfUrl, setCurrentPdfUrl] = useState(null); // URL du PDF actuellement chargé
 const [isFullscreen, setIsFullscreen] = useState(false); // Mode plein écran
 const workerRef = useRef(null);
 const {showToast} = useToast();
 const {user} = useAuth();
 const audioPlayer = useAudioPlayer();
 const [showAudioPlayer, setShowAudioPlayer] = useState(false);
 const [familyVoiceProfiles, setFamilyVoiceProfiles] = useState([]);
 const [selectedFamilyVoiceId, setSelectedFamilyVoiceId] = useState('');
 const sessionRef = useRef({
 book: null,
 currentPage: 0,
 totalPages: 0,
 user: null,
 startedAt: Date.now(),
 completed: false,
 saved: false
});
 const readerExitPath = isKidReader ? '/kids' : '/';

 const getEffectiveTotalPages = (bookValue = book) => {
 const firstPageData = bookValue?.pages?.[0];
 const isPDFBook = firstPageData?.image_path?.toLowerCase().endsWith('.pdf');
 const firstPageUrl = firstPageData?.image_path ? getFileUrl(firstPageData.image_path) : null;

 return (isPDFBook && pdfTotalPages && currentPdfUrl === firstPageUrl)
 ? pdfTotalPages
 : (bookValue?.pages?.length || bookValue?.page_count || 0);
};

 const recordKidReadingProgress = (durationSeconds = 0, finished = false, pageOverride = currentPage) => {
 if (user?.role !== 'kid' || !book?.id) return;

 syncOrQueueKidMutation('reading_progress', {
 book_id: book.id,
 current_page: pageOverride,
 total_pages: getEffectiveTotalPages(),
 duration_seconds: durationSeconds,
 completed: finished
 }, `book:${book.id}:progress`);
};

 useEffect(() => {
 const now = Date.now();
 setHasReachedEnd(false);
 setShowAudioPlayer(false);
 setSelectedFamilyVoiceId('');
 audioPlayer.stop();
 sessionRef.current = {
 book: null,
 currentPage: 0,
 totalPages: 0,
 user,
 startedAt: now,
 completed: false,
 saved: false
};
 loadBook();

 // A route parameter change closes the previous reading session exactly once.
 return () => {
 const session = sessionRef.current;
 if (!session.book || session.saved) return;

 session.saved = true;
 const durationSeconds = Math.max(0, Math.floor((Date.now() - session.startedAt) / 1000));
 const finished = session.completed;

 storage.addReadingSession(
 session.book.id,
 session.book.title,
 durationSeconds,
 finished,
 session.currentPage,
 session.totalPages
 );

};
}, [id]);

 useEffect(() => {
 if (!book?.audio_url) {
 setFamilyVoiceProfiles([]);
 return;
}

 setShowAudioPlayer(true);
 voicesAPI.getAvailableVoices()
 .then((response) => setFamilyVoiceProfiles(Array.isArray(response.data) ? response.data : []))
 .catch((error) => {
 console.warn('Impossible de charger les voix familiales:', error);
 setFamilyVoiceProfiles([]);
});

 const prefs = storage.getPreferences();
 if (prefs.reading_auto_audio) {
 audioPlayer.play(book, { voiceId: selectedFamilyVoiceId || undefined })
 .catch((error) => console.warn('Lecture audio automatique indisponible:', error));
 }
}, [book?.id, book?.audio_url]);

 // Fonctions pour la lecture audio
 const stopAudio = () => {
 if (window.speechSynthesis) {
 // Arrêter proprement la synthèse vocale
 try {
 window.speechSynthesis.cancel();
 // Attendre un peu pour que l'annulation soit complète
 return new Promise((resolve) => {
 setTimeout(() => {
 setIsPlaying(false);
 setSpeechUtterance(null);
 resolve();
}, 100);
});
} catch (error) {
 console.error('Erreur lors de l\'arrêt de l\'audio:', error);
 setIsPlaying(false);
 setSpeechUtterance(null);
 return Promise.resolve();
}
}
 setIsPlaying(false);
 setSpeechUtterance(null);
 return Promise.resolve();
};

 const handleVoiceProfileChange = async (profileId, shouldPreview = true) => {
 const selectedProfile = voiceProfiles.find((profile) => profile.id === profileId) || voiceProfiles[0];
 setSelectedVoiceProfile(selectedProfile.id);

 try {
 window.localStorage.setItem(NARRATION_PROFILE_STORAGE_KEY, selectedProfile.id);
} catch (error) {
 console.warn('Impossible de sauvegarder le profil vocal:', error);
}

 if (!shouldPreview || !('speechSynthesis' in window)) return;

 await stopAudio();
 const voices = await waitForSpeechVoices();

 if (voices.length === 0) {
 showToast('Aucune voix disponible pour la lecture audio', 'error', 3000);
 return;
}

 const previewUtterance = new SpeechSynthesisUtterance(selectedProfile.sampleText);
 applyNarrationProfile(previewUtterance, voices, selectedProfile, speechRate);

 previewUtterance.onstart = () => {
 setIsPlaying(true);
};

 previewUtterance.onend = () => {
 setIsPlaying(false);
 setSpeechUtterance(null);
};

 previewUtterance.onerror = () => {
 setIsPlaying(false);
 setSpeechUtterance(null);
};

 setSpeechUtterance(previewUtterance);
 window.speechSynthesis.speak(previewUtterance);
};

 useEffect(() => {
 if (book && currentPage >= 0) {
 const effectiveTotalPages = getEffectiveTotalPages();
 const finished = hasReachedEnd
 && effectiveTotalPages > 0
 && currentPage >= effectiveTotalPages - 1;

 storage.addToHistory(book.id, book.title, currentPage);
 recordKidReadingProgress(0, finished, currentPage);

 // Refs keep the final cleanup independent from page-change re-renders.
 sessionRef.current.book = book;
 sessionRef.current.currentPage = currentPage;
 sessionRef.current.totalPages = effectiveTotalPages;
 sessionRef.current.user = user;
 sessionRef.current.completed = sessionRef.current.completed || finished;
}
 // Arrêter la lecture audio quand on change de page
 if (window.speechSynthesis && window.speechSynthesis.speaking) {
 try {
 window.speechSynthesis.cancel();
} catch (error) {
 console.error('Erreur lors de l\'arrêt de l\'audio au changement de page:', error);
}
 setIsPlaying(false);
 setSpeechUtterance(null);
}
}, [currentPage, book, hasReachedEnd, pdfTotalPages, currentPdfUrl, user]);

 useEffect(() => {
 return () => {
 // Nettoyer la synthèse vocale sans créer une nouvelle session de lecture.
 if (window.speechSynthesis && window.speechSynthesis.speaking) {
 try {
 window.speechSynthesis.cancel();
} catch (error) {
 console.error('Erreur lors du nettoyage de l\'audio:', error);
}
}
};
}, []);

 useEffect(() => {
 const handleKeyPress = (e) => {
 if (e.key === 'ArrowLeft') prevPage();
 if (e.key === 'ArrowRight') nextPage();
 if (e.key === 'Escape') {
 if (isFullscreen) {
 setIsFullscreen(false);
} else {
 navigate(readerExitPath);
}
}
};
 window.addEventListener('keydown', handleKeyPress);
 return () => window.removeEventListener('keydown', handleKeyPress);
}, [currentPage, book, isFullscreen, navigate, readerExitPath]);

 const loadBook = async () => {
 try {
 setLoading(true);
 setBook(null);
 console.log("Book ID:", id);
 await subscriptionsAPI.unlockBook(id);
 const response = await booksAPI.getBook(id);
 console.log("API response:", response.data);
 console.log("Book loaded:", response.data);
 console.log("Story loaded:", response.data);
 setBook(response.data);
 
 const pageParam = searchParams.get('page');
 const requestedPage = pageParam !== null ? Number.parseInt(pageParam, 10) : storage.getLastPage(id);
 const maxPage = Math.max(0, (response.data.pages?.length || response.data.page_count || 1) - 1);
 const savedPage = Number.isInteger(requestedPage)
 ? Math.min(Math.max(0, requestedPage), maxPage)
 : 0;
 setCurrentPage(savedPage);
 
 storage.addToHistory(id, response.data.title, savedPage);
} catch (error) {
 console.error('Error loading book:', error);
 const status = error.response?.status;
 if (status === 402 || status === 403) {
 showToast(
 isKidReader || user?.role === 'kid'
 ? status === 402
 ? t('kidAskParent')
 : t('kidAskParent')
 : status === 402
 ? 'Choisissez un abonnement pour lire ce livre.'
 : 'Votre quota de livres du mois est atteint.',
 'info',
 3000
 );
 navigate(user?.role === 'kid' ? '/kids/library' : '/abonnements');
}
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
 if (window.speechSynthesis && window.speechSynthesis.speaking) {
 try {
 window.speechSynthesis.cancel();
} catch (error) {
 console.error('Erreur lors de l\'arrêt de l\'audio:', error);
}
 setIsPlaying(false);
 setSpeechUtterance(null);
}
 
 setTimeout(() => {
 setCurrentPage(prev => {
 const newPage = prev + 1;
 // Vérifier si on atteint la dernière page
 if (newPage === effectiveTotalPages - 1) {
 setHasReachedEnd(true);
 setShowConfetti(true);
 setTimeout(() => setShowConfetti(false), 3000);
 if (!isKidReader) {
  showToast('Bravo ! Tu as terminé le livre !', 'success', 4000);
 }
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
 if (window.speechSynthesis && window.speechSynthesis.speaking) {
 try {
 window.speechSynthesis.cancel();
} catch (error) {
 console.error('Erreur lors de l\'arrêt de l\'audio:', error);
}
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

 // Vérifier si une lecture est déjà en cours
 if (window.speechSynthesis.speaking) {
 // Si on est déjà en train de jouer, on arrête
 await stopAudio();
 // Attendre un peu pour que l'arrêt soit complet
 await new Promise(resolve => setTimeout(resolve, 200));
} else {
 // Arrêter toute lecture en cours proprement
 await stopAudio();
 // Attendre un peu pour que l'arrêt soit complet
 await new Promise(resolve => setTimeout(resolve, 100));
}

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
 setExtractedTexts(prev => ({...prev, [cacheKey]: textToRead}));
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
 setExtractedTexts(prev => ({...prev, [fileUrl]: textToRead}));
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

 const voices = await waitForSpeechVoices();
 
 if (voices.length === 0) {
 showToast('Aucune voix disponible pour la lecture audio', 'error', 3000);
 return;
}

 const utterance = new SpeechSynthesisUtterance(textToRead.trim());
 const selectedProfile = voiceProfiles.find((profile) => profile.id === selectedVoiceProfile) || voiceProfiles[0];
 const narrationVoice = pickNarrationVoice(voices, selectedProfile);
 
 if (narrationVoice) {
 utterance.voice = narrationVoice;
 utterance.lang = 'fr-FR';
} else {
 utterance.lang = 'fr-FR';
}

 utterance.rate = Math.min(1.4, Math.max(0.65, speechRate * selectedProfile.rate));
 utterance.pitch = selectedProfile.pitch;
 utterance.volume = 1.0;
 applyNarrationProfile(utterance, voices, selectedProfile, speechRate);

 utterance.onstart = () => {
 setIsPlaying(true);
};

 utterance.onend = () => {
 setIsPlaying(false);
 setSpeechUtterance(null);
};

 utterance.onerror = (event) => {
 // L'erreur"interrupted" est normale quand on annule la lecture (changement de page, stop, etc.)
 // On ne l'affiche donc pas comme une erreur à l'utilisateur.
 if (event.error === 'interrupted' || event.error === 'canceled') {
 console.warn('Lecture audio interrompue (normal):', event);
 setIsPlaying(false);
 setSpeechUtterance(null);
 return;
}

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
 
 // Vérifier que speechSynthesis est toujours disponible et qu'il n'est pas déjà en train de parler
 if (!window.speechSynthesis) {
 showToast('La synthèse vocale n\'est plus disponible', 'error', 3000);
 setIsPlaying(false);
 setSpeechUtterance(null);
 return;
}

 // S'assurer qu'on n'est pas déjà en train de parler
 if (window.speechSynthesis.speaking) {
 // Attendre que la lecture en cours se termine
 await new Promise(resolve => {
 const checkSpeaking = setInterval(() => {
 if (!window.speechSynthesis.speaking) {
 clearInterval(checkSpeaking);
 resolve();
}
}, 100);
 // Timeout de sécurité après 5 secondes
 setTimeout(() => {
 clearInterval(checkSpeaking);
 resolve();
}, 5000);
});
 // Annuler au cas où
 window.speechSynthesis.cancel();
 await new Promise(resolve => setTimeout(resolve, 200));
}

 // Lancer la lecture
 try {
 window.speechSynthesis.speak(utterance);
} catch (speakError) {
 console.error('Erreur lors de l\'appel à speak():', speakError);
 setIsPlaying(false);
 setSpeechUtterance(null);
 showToast('Impossible de démarrer la lecture audio', 'error', 3000);
}
} catch (error) {
 console.error('Erreur dans playAudio:', error);
 setIsPlaying(false);
 setSpeechUtterance(null);
 showToast('Une erreur est survenue lors de la lecture audio', 'error', 3000);
}
};

 const toggleAudio = async () => {
 // Prefer the recorded narration when the book provides one; keep TTS as fallback.
 if (book?.audio_url) {
 await stopAudio();
 setShowAudioPlayer(true);
 audioPlayer.toggle(book, {voiceId: selectedFamilyVoiceId || undefined});
 return;
}

 if (isPlaying) {
 await stopAudio();
} else {
 await playAudio();
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
 setAvailableVoices(voices);
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
 
 const {data: {text}} = await workerRef.current.recognize(imageUrl);
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

 const [themeMode, setThemeMode] = useState(isKidReader ? 'night' : 'day'); // 'day' | 'sepia' | 'night'
 const [showMenu, setShowMenu] = useState(true);
 const [isFavorite, setIsFavorite] = useState(false);
 const [showEndModal, setShowEndModal] = useState(false);
 const [showKidCelebration, setShowKidCelebration] = useState(false);
 const [showStoryOpening, setShowStoryOpening] = useState(isKidReader);
 const [showReportModal, setShowReportModal] = useState(false);
 const reducedMotion = useReducedMotion();
 const canReport = user && (user.role === 'parent' || user.role === 'admin') && !isKidReader;

 useEffect(() => {
 setIsFavorite(book ? storage.isFavorite(book.id) : false);
}, [book?.id]);

 const toggleBookFavorite = () => {
 if (!book) return;
 if (storage.isFavorite(book.id)) {
 storage.removeFavorite(book.id);
 setIsFavorite(false);
} else {
 storage.addFavorite(book.id);
 setIsFavorite(true);
}
};

 const handleFamilyVoiceChange = async (voiceId) => {
 setSelectedFamilyVoiceId(voiceId);
 audioPlayer.stop();
 setShowAudioPlayer(true);
 await audioPlayer.play(book, {voiceId: voiceId || undefined});
};

 // Auto-hide menu (immersive bedtime — kids included)
 useEffect(() => {
 let timeout;
 if (showMenu && !showKidCelebration && !showStoryOpening) {
 timeout = setTimeout(() => setShowMenu(false), isKidReader ? 2800 : 3500);
}
 return () => clearTimeout(timeout);
}, [showMenu, currentPage, isPlaying, audioPlayer.playing, isKidReader, showKidCelebration, showStoryOpening]);

 // Keep bedtime night mode for kid readers
 useEffect(() => {
 if (isKidReader) setThemeMode('night');
}, [isKidReader]);

 // Reset opening when book id changes
 useEffect(() => {
 if (isKidReader && book?.id) setShowStoryOpening(true);
}, [isKidReader, book?.id]);

 // Handle End of book
 useEffect(() => {
 if (!book || !book.pages || book.pages.length === 0) return;
 const firstPageData = book.pages[0];
 const isPDF = firstPageData?.image_path?.toLowerCase().endsWith('.pdf');
 const effectiveTotalPages = (isPDF && pdfTotalPages) ? pdfTotalPages : book.pages.length;
 const isLastPage = currentPage === effectiveTotalPages - 1;

 if (hasReachedEnd && isLastPage && !isKidReader) {
 const timeoutId = setTimeout(() => setShowEndModal(true), 1500);
 return () => clearTimeout(timeoutId);
}
 if (hasReachedEnd && isLastPage && isKidReader) {
 const timeoutId = setTimeout(() => setShowKidCelebration(true), 600);
 return () => clearTimeout(timeoutId);
}
 return undefined;
}, [currentPage, book, pdfTotalPages, hasReachedEnd, isKidReader]);

 if (loading) {
 return (
 <div className={`min-h-screen flex items-center justify-center ${isKidReader ? 'bg-gradient-to-br from-surface-900 via-primary-900 to-primary-800' : 'bg-gradient-to-br from-primary-100 via-secondary-50 to-orange-100'}`}>
 <motion.div
 initial={{scale: 0.9, opacity: 0.6}}
 animate={{scale: 1, opacity: 1}}
 transition={{duration: 0.45}}
 className="text-center"
 >
 <div className="text-6xl mb-space-16" aria-hidden="true">{isKidReader ? '🌙' : '📚'}</div>
 {!isKidReader && (
 <motion.p
 animate={{opacity: [0.5, 1, 0.5]}}
 transition={{duration: 1.5, repeat: Infinity}}
 className="text-body-lg text-primary-600 mt-space-16"
 >
 Chargement de l'histoire...
 </motion.p>
 )}
 </motion.div>
 </div>
 );
}

 if (!book || !book.pages || book.pages.length === 0) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 via-secondary-50 to-orange-100">
 <div className="text-center">
 <motion.div
 initial={{scale: 0}}
 animate={{scale: 1}}
 className="mb-space-24 flex justify-center"
 >
 <div className="p-space-24 bg-card rounded-full shadow-card">
 <BookIcon className="w-16 h-16 text-primary-400" />
 </div>
 </motion.div>
 {!isKidReader && (
  <p className="text-heading-l text-primary-700 mb-space-24">{t('kidBookNotFound')}</p>
 )}
 <motion.button
 whileHover={{scale: 1.05}}
 whileTap={{scale: 0.95}}
 onClick={() => navigate(readerExitPath)}
 className={`${isKidReader ? 'p-space-24' : 'px-space-32 py-space-16'} min-h-touch-kids bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full font-bold text-body-lg shadow-card hover:shadow-floating transition-shadow flex items-center justify-center mx-auto focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300`}
 aria-label={t('kidReaderHome')}
 >
 {isKidReader ? <HomeIcon className="w-10 h-10" /> : 'Retour à la bibliothèque'}
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
 const audioPlaybackActive = book.audio_url ? audioPlayer.playing : isPlaying;

 // Handle theme colors — kid night is warm bedtime calm
 const themeColors = {
 day: isKidReader ? 'bg-gradient-to-br from-primary-50 via-success-50/40 to-secondary-50/50 text-foreground' : 'bg-background text-foreground',
 sepia: isKidReader ? 'bg-gradient-to-br from-secondary-50 via-orange-50/50 to-primary-50/30 text-warning-900' : 'bg-secondary-50 text-warning-900',
 night: isKidReader ? 'bg-gradient-to-br from-surface-900 via-primary-900 to-primary-800 text-surface-50' : 'bg-surface-900 text-surface-200'
};

 const navThemeColors = {
 day: isKidReader ? 'bg-white/75' : 'bg-card/70',
 sepia: isKidReader ? 'bg-secondary-100/80' : 'bg-secondary-100/80',
 night: isKidReader ? 'bg-surface-800/75' : 'bg-surface-800/70'
};


 return (
 <div 
 className={`h-screen w-full flex flex-col relative overflow-hidden transition-colors duration-700 ease-in-out ${themeColors[themeMode]} ${isKidReader ? 'kids-night-calm' : ''}`}
 onClick={() => setShowMenu(!showMenu)}
 onTouchStart={onTouchStart}
 onTouchMove={onTouchMove}
 onTouchEnd={onTouchEnd}
 >
 {isKidReader && <KidsBedtimeAtmosphere intensity="soft" />}
 <Confetti show={showConfetti && !isKidReader} />
 {isKidReader && themeMode === 'night' && !showStoryOpening && <StarParticles count={reducedMotion ? 0 : 8} />}

 {isKidReader && (
   <KidsStoryOpening
     active={showStoryOpening && Boolean(book)}
     coverUrl={book?.cover_image}
     title={book?.title}
     onDone={() => setShowStoryOpening(false)}
   />
 )}

 {/* Top Navbar (Glassmorphism) */}
 <AnimatePresence>
 {showMenu && (
 <motion.header
 initial={{y: -100, opacity: 0}}
 animate={{y: 0, opacity: 1}}
 exit={{y: -100, opacity: 0}}
 transition={{duration: 0.3, ease:"easeOut"}}
 onClick={(e) => e.stopPropagation()}
 className={`absolute top-0 inset-x-0 z-40 px-space-24 py-space-16 flex items-center ${isKidReader ? 'justify-start' : 'justify-between'} backdrop-blur-xl border-b border-white/10 ${navThemeColors[themeMode]} shadow-soft`}
 >
 <div className="flex items-center gap-space-16">
  <Button 
    variant="ghost" 
    size="icon" 
    onClick={() => navigate(readerExitPath)}
    className={`rounded-full w-14 h-14 min-h-touch-kids min-w-touch-kids bg-white/25 hover:bg-white/45 shadow-soft border-2 border-white/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300`}
    aria-label={t('kidReaderHome')}
  >
    <HomeIcon className="w-8 h-8 text-primary-700" />
  </Button>
  {!isKidReader && (
  <div>
    <h1 className="text-heading-l text-primary-800 line-clamp-1">{book.title}</h1>
  </div>
  )}
</div>

{!isKidReader && (
<div className="flex items-center gap-space-16">
  <Button 
    variant="ghost" 
    size="icon" 
    onClick={toggleBookFavorite}
    className={`rounded-full w-14 h-14 min-h-touch-kids min-w-touch-kids bg-white/20 hover:bg-white/40 shadow-soft transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300 ${isFavorite ? 'text-danger-500' : 'text-primary-700'}`}
  >
    <svg className="w-8 h-8" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  </Button>

  <Button 
    variant="ghost" 
    size="icon" 
    onClick={() => setShowReadingAid(true)}
    className={`rounded-full w-14 h-14 min-h-touch-kids min-w-touch-kids bg-white/20 hover:bg-white/40 shadow-soft text-primary-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300`}
  >
    <SettingsIcon className="w-8 h-8" />
  </Button>

  {canReport && (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setShowReportModal(true)}
      className="rounded-full w-14 h-14 min-h-touch-kids min-w-touch-kids bg-white/20 hover:bg-white/40 shadow-soft text-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300"
      aria-label={t('reportContentAction')}
    >
      <WarningIcon className="w-8 h-8" />
    </Button>
  )}
</div>
)}
 </motion.header>
 )}
 </AnimatePresence>

 {!isKidReader && (
 <ReadingAidPanel
 isOpen={showReadingAid}
 onClose={() => setShowReadingAid(false)}
 settings={readingSettings}
 onSettingsChange={setReadingSettings}
 voiceProfiles={voiceProfiles}
 selectedVoiceProfile={selectedVoiceProfile}
 onVoiceProfileChange={handleVoiceProfileChange}
 availableVoices={availableVoices}
 />
 )}

 {/* Main Content Area */}
 <div className="relative flex-1 w-full h-full flex items-center justify-center p-space-16 md:p-space-48 overflow-hidden">
 
 {/* Big Visible Arrows for Navigation */}
  {!isKidReader && (
  <>
  <div className="absolute left-4 inset-y-0 z-20 flex items-center justify-start pointer-events-none">
    {!isFirstPage && (
      <button onClick={(e) => {e.stopPropagation(); prevPage();}} aria-label={t('kidReaderPrev')} className="pointer-events-auto w-20 h-20 min-h-touch-kids min-w-touch-kids bg-white/60 backdrop-blur-md rounded-full flex items-center justify-center shadow-card hover:bg-white hover:scale-110 active:scale-95 transition-all border-4 border-white/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300">
        <ChevronLeftIcon className="w-10 h-10 text-primary-600" />
      </button>
    )}
  </div>
  <div className="absolute right-4 inset-y-0 z-20 flex items-center justify-end pointer-events-none">
    {!isLastPage && (
      <button onClick={(e) => {e.stopPropagation(); nextPage();}} aria-label={t('kidReaderNext')} className="pointer-events-auto w-20 h-20 min-h-touch-kids min-w-touch-kids bg-white/60 backdrop-blur-md rounded-full flex items-center justify-center shadow-card hover:bg-white hover:scale-110 active:scale-95 transition-all border-4 border-white/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300">
        <ChevronRightIcon className="w-10 h-10 text-primary-600" />
      </button>
    )}
  </div>
  </>
  )}

 {/* The Book Canvas */}
 <div className="relative w-full max-w-5xl h-full flex items-center justify-center" style={{perspective: '1200px'}}>
 <AnimatePresence mode="wait">
 <motion.div
 key={currentPage}
 initial={{opacity: 0, rotateY: pageDirection === 'next' ? (isKidReader ? 18 : 45) : (isKidReader ? -18 : -45), scale: isKidReader ? 0.97 : 0.95}}
 animate={{opacity: 1, rotateY: 0, scale: 1}}
 exit={{opacity: 0, rotateY: pageDirection === 'next' ? (isKidReader ? -18 : -45) : (isKidReader ? 18 : 45), scale: isKidReader ? 0.97 : 0.95}}
 transition={{duration: isKidReader ? 0.38 : 0.5, ease: [0.22, 1, 0.36, 1]}}
 className="w-full h-full flex flex-col items-center justify-center"
 style={{
 fontFamily: readingSettings.font === 'dyslexic' ? 'OpenDyslexic, sans-serif' : readingSettings.font === 'comic' ? 'Comic Sans MS, cursive' : 'Nunito, sans-serif'
}}
 >
 {currentPageData.image_path ? (() => {
 const fileUrl = getFileUrl(currentPageData.image_path);
 const isPDF = currentPageData.image_path.toLowerCase().endsWith('.pdf');
 
 if (isPDF) {
 return (
 <div className={`w-full max-h-[85vh] overflow-hidden rounded-24 shadow-floating bg-card`}>
 <PDFPageViewer 
 pdfUrl={fileUrl} 
 pageNumber={currentPage + 1}
 imageClassName="w-full h-full object-contain"
 isKidMinimal={isKidReader}
 onPdfLoaded={(numPages) => {
 if (numPages > 0) {
 setPdfTotalPages(numPages);
 setCurrentPdfUrl(fileUrl);
}
}}
 />
 </div>
 );
}
 
 return (
 <div className="w-full h-[85vh] flex items-center justify-center">
 <motion.img
 src={fileUrl}
 alt={`Page ${currentPage + 1}`}
 className="max-w-full max-h-full object-contain rounded-24 shadow-floating"
 initial={{opacity: 0, y: 10}}
 animate={{opacity: 1, y: 0}}
 transition={{delay: 0.2}}
 />
 </div>
 );
})() : (
 <div className={`w-full max-w-3xl p-space-40 md:p-space-64 rounded-32 shadow-floating text-center flex flex-col items-center justify-center ${themeMode === 'night' ? 'bg-surface-800/90 border border-white/10' : 'bg-card'}`}>
 {currentPageData.content && (
 <p 
 className={`text-left md:text-center w-full ${isKidReader ? 'font-bold tracking-wide' : ''}`}
 style={{
 fontSize: `${isKidReader ? Math.max(readingSettings.fontSize, 22) : readingSettings.fontSize}px`,
 lineHeight: isKidReader ? '1.85' : (readingSettings.lineSpacing ? '2' : '1.6'),
 letterSpacing: readingSettings.syllabification ? '0.1em' : (isKidReader ? '0.02em' : 'normal')
}}
 >
 {currentPageData.content}
 </p>
 )}
 </div>
 )}
 </motion.div>
 </AnimatePresence>
 </div>
 </div>

 {/* Floating Audio Controls */}
 {!isKidReader && (
 <div className="absolute bottom-24 inset-x-0 flex justify-center z-40 pointer-events-none">
 <AnimatePresence>
 {(showMenu || audioPlaybackActive) && (
 <motion.div
 initial={{y: 50, opacity: 0, scale: 0.9}}
 animate={{y: 0, opacity: 1, scale: 1}}
 exit={{y: 50, opacity: 0, scale: 0.9}}
 onClick={(e) => e.stopPropagation()}
 className={`pointer-events-auto flex items-center gap-6 px-space-16 py-space-16 rounded-32 backdrop-blur-xl border-4 border-white/40 shadow-floating bg-white/30`}
 >
              <button 
                onClick={toggleAudio}
                disabled={!book.audio_url && (isExtracting || (!currentPageData?.content && !currentPageData?.image_path))}
                aria-label={t('kidReaderPlay')}
                className={`w-24 h-24 min-h-touch-kids min-w-touch-kids rounded-full flex items-center justify-center shadow-glow transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300 ${audioPlaybackActive ? 'bg-primary-500 text-white' : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'} ${!book.audio_url && isExtracting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {!book.audio_url && isExtracting ? (
                  <motion.div animate={{rotate: 360}} transition={{repeat: Infinity, ease: 'linear'}} className="w-10 h-10 border-4 border-white border-t-transparent rounded-full" />
                ) : audioPlaybackActive ? (
                  <PauseIcon className="w-12 h-12" />
                ) : (
                  <PlayIcon className="w-12 h-12 ml-2" />
                )}
              </button>

              {audioPlaybackActive && (
                <div className="flex items-center gap-3 pr-6">
                  {[1,2,3,4,5].map(i => (
                    <motion.div
                      key={i}
                      animate={{height: [12, 36, 12]}}
                      transition={{duration: 0.8, repeat: Infinity, delay: i * 0.1}}
                      className="w-3 bg-primary-500 rounded-full"
                    />
                  ))}
                </div>
              )}
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 )}

 {isKidReader && (
 <AnimatePresence>
 {showMenu && (
 <motion.div
   initial={{ y: 40, opacity: 0 }}
   animate={{ y: 0, opacity: 1 }}
   exit={{ y: 40, opacity: 0 }}
   transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
   className="absolute bottom-8 inset-x-0 z-50 flex justify-center pointer-events-none"
   onClick={(e) => e.stopPropagation()}
 >
   <div className="pointer-events-auto flex items-center gap-space-16 md:gap-space-24 px-space-20 py-space-16 rounded-32 bg-white/85 backdrop-blur-xl border-4 border-white/60 shadow-card">
     <button
       type="button"
       onClick={prevPage}
       disabled={isFirstPage}
       aria-label={t('kidReaderPrev')}
       className="kids-touch-target min-h-touch-kids min-w-touch-kids w-[4.5rem] h-[4.5rem] md:w-20 md:h-20 rounded-full flex items-center justify-center bg-magic-100 text-magic-700 disabled:opacity-40 border-4 border-white shadow-soft active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-magic-300"
     >
       <ChevronLeftIcon className={`w-10 h-10 ${isRtl ? 'rotate-180' : ''}`} />
     </button>
     <button
       type="button"
       onClick={toggleAudio}
       disabled={!book.audio_url && (isExtracting || (!currentPageData?.content && !currentPageData?.image_path))}
       aria-label={t('kidReaderPlay')}
       className={`relative kids-touch-target min-h-touch-kids min-w-touch-kids kids-narration-glow w-28 h-28 rounded-full flex items-center justify-center text-white border-4 border-white active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary-300 ${!reducedMotion && audioPlaybackActive ? 'kids-audio-pulse' : ''} ${audioPlaybackActive ? 'bg-orange-500' : 'bg-gradient-to-br from-magic-500 via-primary-500 to-orange-400'}`}
     >
       {!book.audio_url && isExtracting ? (
         <motion.div animate={{rotate: 360}} transition={{repeat: Infinity, ease: 'linear'}} className="w-10 h-10 border-4 border-white border-t-transparent rounded-full" />
       ) : audioPlaybackActive ? (
         <>
           <PauseIcon className="w-12 h-12" />
           {!reducedMotion && (
             <span className="absolute -bottom-1 kids-sound-wave pointer-events-none" aria-hidden="true">
               {Array.from({ length: 5 }).map((_, i) => (
                 <span key={i} className="kids-sound-bar" style={{ animationDelay: `${i * 0.1}s` }} />
               ))}
             </span>
           )}
         </>
       ) : (
         <PlayIcon className={`w-12 h-12 ${isRtl ? '' : 'ml-1'}`} />
       )}
     </button>
     <button
       type="button"
       onClick={nextPage}
       disabled={isLastPage}
       aria-label={t('kidReaderNext')}
       className="kids-touch-target min-h-touch-kids min-w-touch-kids w-[4.5rem] h-[4.5rem] md:w-20 md:h-20 rounded-full flex items-center justify-center bg-magic-100 text-magic-700 disabled:opacity-40 border-4 border-white shadow-soft active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-magic-300"
     >
       <ChevronRightIcon className={`w-10 h-10 ${isRtl ? 'rotate-180' : ''}`} />
     </button>
   </div>
 </motion.div>
 )}
 </AnimatePresence>
 )}

 {/* Persistent Bottom Progress Bar — illustrated moon-soft for kids */}
 <div className={`absolute bottom-0 inset-x-0 z-30 px-space-4 md:px-space-12 ${isKidReader ? 'pb-3' : 'pb-6'} pt-10 bg-gradient-to-t from-black/25 to-transparent flex flex-col justify-end pointer-events-none gap-3`}>
        {isKidReader && totalPages > 1 && (
          <div className="w-full max-w-4xl mx-auto flex items-center justify-center gap-2 flex-wrap px-2">
            {Array.from({ length: Math.min(totalPages, 20) }).map((_, index) => (
              <span
                key={index}
                className={`rounded-full transition-all duration-300 ${
                  index === currentPage
                    ? 'h-3.5 w-9 bg-gradient-to-r from-secondary-200 to-orange-400 kids-progress-dot-active'
                    : index < currentPage
                      ? 'h-3.5 w-3.5 bg-secondary-300/80'
                      : 'h-3.5 w-3.5 bg-white/30'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        )}
        <div className={`w-full max-w-4xl mx-auto ${isKidReader ? 'h-5' : 'h-4'} bg-black/15 rounded-full overflow-hidden border border-white/20 shadow-inner`}>
          <motion.div 
            className={`h-full rounded-full ${isKidReader ? 'bg-gradient-to-r from-magic-300 via-secondary-200 to-orange-300' : 'bg-gradient-to-r from-primary-400 to-secondary-400'}`}
            initial={{width: 0}}
            animate={{width: `${progress}%`}}
            transition={{duration: isKidReader ? 0.4 : 0.5, ease: [0.22, 1, 0.36, 1]}}
          />
        </div>
 </div>

 {showAudioPlayer && book.audio_url && !isKidReader && (
 <div onClick={(event) => event.stopPropagation()}>
 <AudioPlayer
 book={book}
 playing={audioPlayer.playing}
 loading={audioPlayer.loading}
 currentTime={audioPlayer.currentTime}
 duration={audioPlayer.duration}
 volume={audioPlayer.volume}
 favorite={isFavorite}
 error={audioPlayer.error}
 onTogglePlay={() => {
 if (audioPlayer.playing) {
 audioPlayer.pause();
} else {
 audioPlayer.play(book, {voiceId: selectedFamilyVoiceId || undefined});
}
}}
 onSeekBy={audioPlayer.seekBy}
 onSeekTo={audioPlayer.seekTo}
 onVolumeChange={audioPlayer.setVolume}
 onToggleFavorite={toggleBookFavorite}
 onClose={() => {
 audioPlayer.stop();
 setShowAudioPlayer(false);
}}
 voiceProfiles={familyVoiceProfiles}
 selectedVoiceId={selectedFamilyVoiceId}
 onVoiceChange={handleFamilyVoiceChange}
 />
 </div>
 )}

 {/* End of Book Celebration Modal */}
 <Modal isOpen={showEndModal} onClose={() => setShowEndModal(false)} maxWidth="max-w-md">
 <div className="text-center p-space-4">
 <motion.div 
 initial={{scale: 0}}
 animate={{scale: 1, rotate: 360}}
 transition={{type:"spring", bounce: 0.5, delay: 0.2}}
 className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-space-24 shadow-glow"
 >
 <StarIcon className="w-12 h-12 text-white" />
 </motion.div>
          <h2 className="text-heading-xl mb-space-8 text-primary-600">Bravo !</h2>
          <p className="text-body-lg text-foreground-secondary mb-space-32">Tu as terminé "{book.title}"</p>
 
 <div className="flex flex-col gap-3">
 <Button variant="primary" fullWidth onClick={() => navigate(readerExitPath)}>
 Lire une autre histoire
 </Button>
 <Button variant="ghost" fullWidth onClick={() => setShowEndModal(false)}>
 Revoir l'histoire
 </Button>
 </div>
 </div>
 </Modal>

 {isKidReader && (
   <KidsCelebration
     active={showKidCelebration}
     variant="bedtime"
     title={t('bedtimeStoryDone')}
     subtitle={t('bedtimeStoryEncourage')}
     primaryLabel={t('kidReaderAnother')}
     onPrimary={() => {
       setShowKidCelebration(false);
       navigate('/kids/library');
     }}
     secondaryLabel={t('bedtimeListenAgain')}
     onSecondary={() => {
       setShowKidCelebration(false);
       setCurrentPage(0);
       setHasReachedEnd(false);
       setShowMenu(true);
       toggleAudio();
     }}
     tertiaryLabel={t('kidReaderHome')}
     onTertiary={() => {
       setShowKidCelebration(false);
       navigate('/kids');
     }}
     onComplete={() => setShowKidCelebration(false)}
   />
 )}

 <ContentReportModal
  isOpen={showReportModal}
  onClose={() => setShowReportModal(false)}
  targetType="book"
  targetId={book?.id}
  targetTitle={book?.title}
 />

 </div>
 );
}

export default BookReader;
