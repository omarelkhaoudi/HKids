import {useState, useEffect, useRef, useCallback} from 'react';
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
import {ChevronLeftIcon, ChevronRightIcon, BookIcon, StarIcon, PlayIcon, PauseIcon, SettingsIcon, WarningIcon, MoonIcon, SunIcon} from '../components/Icons';
import {getImageUrl} from '../utils/imageUrl';
import {resolveBookCoverUrl} from '../utils/bookCover';
import {kidsReaderPageTurn, kidsRouteExit, KIDS_MOTION_DURATION} from '../constants/kidsMotion';
import {deriveReaderMood, getReaderAmbientStyle} from '../utils/readerAtmosphere';
import {
 detectReadingMilestone,
 getReadingPhaseKey,
 getReadingPhaseLabelKey,
} from '../utils/readerCompanion';
import {
 splitTextIntoSentences,
 sentenceIndexAtChar,
 countWords,
} from '../utils/readerNarration';
import {
 estimateRemainingReadSeconds,
 formatRemainingReadLabel,
} from '../utils/readerRecommendations';
import ReadingAidPanel from '../components/ReadingAidPanel';
import {ContentReportModal} from '../components/parent/ContentReportModal';
import {useAudioPlayer} from '../hooks/useAudioPlayer';
import {KidsCelebration} from '../components/kids/KidsCelebration';
import {KidsBedtimeAtmosphere} from '../components/kids/KidsBedtimeAtmosphere';
import {KidsStoryOpening} from '../components/kids/KidsStoryOpening';
import {KidsReadingCompanion} from '../components/kids/KidsReadingCompanion';
import {ReaderLivingPresence} from '../components/kids/ReaderLivingPresence';
import {LivingIllustration} from '../components/kids/LivingIllustration';
import {
 KidsReaderAmbientPanel,
 KidsReaderTimeline,
 KidsReaderVoiceMeta,
} from '../components/kids/KidsReaderAudioExperience';
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
 
 // Charger le document PDF avec options CORS
 const loadingTask = pdfjsLib.getDocument({
 url: pdfUrl,
 withCredentials: false,
 httpHeaders: {},
 verbosity: 0 // Réduire les logs
});
 
 const pdf = await loadingTask.promise;
 
 if (cancelled) return;
 
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
<div className="w-full p-space-8">
<div className="kids-reader-page-card relative overflow-hidden min-h-[16rem] md:min-h-[22rem] flex items-center justify-center">
<div className="absolute inset-0 kids-shimmer opacity-30" aria-hidden="true" />
<div className="relative z-10 text-center px-space-16">
<div className="mx-auto mb-space-12 h-16 w-12 rounded-md bg-white/70 shadow-soft border border-white/50" />
{!isKidMinimal && <p className="kids-type-body text-foreground-secondary">Préparation de la page...</p>}
</div>
</div>
</div>
 );
}

 if (error || !imageUrl) {
 return (
<div className="w-full p-space-8">
<div className="kids-reader-page-card text-center p-space-24">
 <BookIcon className="w-16 h-16 text-primary-400 mx-auto mb-space-4" />
 {!isKidMinimal && (
  <>
  <p className="kids-type-h2 !text-[1.2rem] mb-2">La page a besoin d&apos;un nouvel essai</p>
  {error && <p className="text-sm text-foreground-secondary">{error}</p>}
  </>
 )}
 <button
 onClick={() => {
 setReloadKey(prev => prev + 1);
}}
className="mt-space-4 px-space-5 py-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
 aria-label={isKidMinimal ? 'Retry' : undefined}
 >
{isKidMinimal ? '↻' : 'Réessayer calmement'}
 </button>
</div>
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

// Gentle page-turn sparkle (kid reader)
function PageSparkle({ active, reducedMotion }) {
 if (!active || reducedMotion) return null;
 return (
 <div className="kids-reader-sparkle" aria-hidden="true">
 <span className="kids-reader-sparkle-burst" />
 </div>
 );
}

// Soft clouds for reading atmosphere
function ReaderClouds() {
 return (
 <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]" aria-hidden="true">
 <span className="kids-reader-cloud kids-reader-cloud-a" />
 <span className="kids-reader-cloud kids-reader-cloud-b" />
 <span className="kids-reader-cloud kids-reader-cloud-c" />
 </div>
 );
}

function PremiumReaderState({ title, description, actionLabel, onAction, reducedMotion, icon = '📖' }) {
 return (
  <div className="min-h-screen flex items-center justify-center kids-reader-shell" data-reader-theme="warm">
   <ReaderPaperAtmosphere />
   <motion.div
    initial={reducedMotion ? false : {scale: 0.96, opacity: 0.7}}
    animate={{scale: 1, opacity: 1}}
    transition={{duration: reducedMotion ? 0 : 0.35}}
    className="kids-premium-panel max-w-xl w-full mx-5 md:mx-8 p-8 md:p-10 text-center relative overflow-hidden z-10"
   >
    <div className="absolute inset-0 kids-shimmer opacity-20 pointer-events-none" aria-hidden="true" />
    <div className="text-6xl mb-4" aria-hidden="true">{icon}</div>
    <h2 className="kids-reader-header-title mb-space-12">{title}</h2>
    {description ? <p className="kids-type-body text-foreground-secondary mb-space-24">{description}</p> : null}
    {actionLabel && onAction ? (
     <button
      type="button"
      onClick={onAction}
      className="kids-reader-toolbar-btn !min-w-[12rem] !w-auto !px-6 mx-auto"
     >
      {actionLabel}
     </button>
    ) : null}
   </motion.div>
  </div>
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

function normalizePageContent(content) {
 if (content == null) return '';
 if (typeof content === 'string') return content;
 if (Array.isArray(content)) {
 return content.map(normalizePageContent).filter(Boolean).join(' ').trim();
 }
 if (typeof content === 'object') {
 if (typeof content.text === 'string') return content.text;
 if (typeof content.content === 'string') return content.content;
 }
 return String(content);
}

function formatReaderTime(seconds = 0) {
 const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
 const minutes = Math.floor(safeSeconds / 60);
 const rest = safeSeconds % 60;
 return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function BookmarkGlyph({ className = 'w-5 h-5' }) {
 return (
 <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 5.5A1.5 1.5 0 018.5 4h7A1.5 1.5 0 0117 5.5V20l-5-3-5 3V5.5z" />
 </svg>
 );
}

function ReaderPaperAtmosphere({ mood = 'warm' }) {
 return (
 <div className="kids-reader-paper-atmosphere" aria-hidden="true">
   <span className={`kids-reader-mood-glow kids-reader-mood-glow--${mood}`} />
   <span className="kids-reader-paper-glow kids-reader-paper-glow-a" />
   <span className="kids-reader-paper-glow kids-reader-paper-glow-b" />
   <span className="kids-reader-paper-grain" />
 </div>
 );
}

function ReaderAudioWave({ active, reducedMotion }) {
 const heights = [0.35, 0.62, 0.88, 0.55, 0.78, 0.42, 0.68, 0.5];
 return (
 <div className={`kids-reader-audio-wave ${active ? 'is-playing' : ''}`} aria-hidden="true">
   {heights.map((height, index) => (
     <span
       key={index}
       className="kids-reader-audio-wave-bar"
       style={{
         '--bar-scale': height,
         animationDelay: reducedMotion ? undefined : `${index * 0.08}s`,
       }}
     />
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
 const readerRef = useRef(null);
 const pageTurnMountRef = useRef(true);
 const [pageSparkle, setPageSparkle] = useState(false);
 const [isExitingReader, setIsExitingReader] = useState(false);
 const workerRef = useRef(null);
 const {showToast} = useToast();
 const {user} = useAuth();
 const audioPlayer = useAudioPlayer();
 const [, setShowAudioPlayer] = useState(false);
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
 setCurrentSentenceIndex(-1);
 resolve();
}, 100);
});
} catch (error) {
 console.error('Erreur lors de l\'arrêt de l\'audio:', error);
 setIsPlaying(false);
 setSpeechUtterance(null);
 setCurrentSentenceIndex(-1);
 return Promise.resolve();
}
}
 setIsPlaying(false);
 setSpeechUtterance(null);
 setCurrentSentenceIndex(-1);
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

 skipPauseEncourageRef.current = true;
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

 const loadBook = async () => {
 try {
 setLoading(true);
 setBook(null);
 await subscriptionsAPI.unlockBook(id);
 const response = await booksAPI.getBook(id);
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

 const minSwipeDistance = 64;

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
 skipPauseEncourageRef.current = true;
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
 setTimeout(() => setIsTurning(false), Math.round(KIDS_MOTION_DURATION.slow * 1000));
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
 skipPauseEncourageRef.current = true;
 window.speechSynthesis.cancel();
} catch (error) {
 console.error('Erreur lors de l\'arrêt de l\'audio:', error);
}
 setIsPlaying(false);
 setSpeechUtterance(null);
}
 
 setTimeout(() => {
 setCurrentPage(prev => prev - 1);
 setTimeout(() => setIsTurning(false), Math.round(KIDS_MOTION_DURATION.slow * 1000));
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

 let textToRead = normalizePageContent(pageData.content);

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
 const narrationSentences = splitTextIntoSentences(textToRead);
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
 setCurrentSentenceIndex(narrationSentences.length ? 0 : -1);
};

 utterance.onend = () => {
 setIsPlaying(false);
 setSpeechUtterance(null);
 setCurrentSentenceIndex(-1);
};

 utterance.onerror = (event) => {
 // L'erreur"interrupted" est normale quand on annule la lecture (changement de page, stop, etc.)
 // On ne l'affiche donc pas comme une erreur à l'utilisateur.
 if (event.error === 'interrupted' || event.error === 'canceled') {
 console.warn('Lecture audio interrompue (normal):', event);
 setIsPlaying(false);
 setSpeechUtterance(null);
 setCurrentSentenceIndex(-1);
 return;
}

 console.error('Erreur de synthèse vocale:', event);
 setIsPlaying(false);
 setSpeechUtterance(null);
 setCurrentSentenceIndex(-1);
 
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

 utterance.onboundary = (event) => {
 if (!narrationSentences.length || event.name !== 'word') return;
 const nextIndex = sentenceIndexAtChar(narrationSentences, event.charIndex);
 if (nextIndex >= 0) setCurrentSentenceIndex(nextIndex);
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

 const [themeMode, setThemeMode] = useState('warm'); // warm | night
 const [showMenu, setShowMenu] = useState(true);
 const [isFavorite, setIsFavorite] = useState(false);
 const [showEndModal, setShowEndModal] = useState(false);
 const [showKidCelebration, setShowKidCelebration] = useState(false);
 const [showStoryOpening, setShowStoryOpening] = useState(isKidReader);
 const [showReportModal, setShowReportModal] = useState(false);
 const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
 const [bookmarkPulse, setBookmarkPulse] = useState(false);
 const [showReaderTools, setShowReaderTools] = useState(false);
 const [companionMessage, setCompanionMessage] = useState('');
 const [companionMessageKey, setCompanionMessageKey] = useState('');
 const [companionActive, setCompanionActive] = useState(false);
 const milestoneShownRef = useRef(new Set());
 const wasNarratingRef = useRef(false);
 const skipPauseEncourageRef = useRef(false);
 const pauseEncourageIndexRef = useRef(0);
 const [ambienceId, setAmbienceId] = useState(null);
 const [ambienceVolume, setAmbienceVolume] = useState(40);
 const [showAmbiencePanel, setShowAmbiencePanel] = useState(false);
 const reducedMotion = useReducedMotion();
 const canReport = user && (user.role === 'parent' || user.role === 'admin') && !isKidReader;

 const exitReader = useCallback(() => {
  if (isExitingReader) return;
  if (reducedMotion) {
   navigate(readerExitPath);
   return;
  }
  setIsExitingReader(true);
  window.setTimeout(() => navigate(readerExitPath), Math.round(KIDS_MOTION_DURATION.fast * 1000));
 }, [isExitingReader, reducedMotion, navigate, readerExitPath]);

 useEffect(() => {
 const handleKeyPress = (e) => {
 if (e.key === 'ArrowLeft') prevPage();
 if (e.key === 'ArrowRight') nextPage();
 if (e.key === 'Escape') {
 exitReader();
}
};
 window.addEventListener('keydown', handleKeyPress);
 return () => window.removeEventListener('keydown', handleKeyPress);
}, [exitReader]);

 useEffect(() => {
 setIsFavorite(book ? storage.isFavorite(book.id) : false);
}, [book?.id]);

 useEffect(() => {
 setCurrentSentenceIndex(-1);
 }, [currentPage, book?.id]);

 useEffect(() => {
 milestoneShownRef.current = new Set();
 setCompanionActive(false);
 setCompanionMessage('');
 setCompanionMessageKey('');
 }, [book?.id]);

 useEffect(() => {
 if (!isKidReader || loading || !book?.pages?.length || showStoryOpening || showKidCelebration) {
 return;
 }

 const firstPageData = book.pages[0];
 const isPdfBook = firstPageData?.image_path?.toLowerCase().endsWith('.pdf');
 const firstPageUrl = firstPageData?.image_path ? getFileUrl(firstPageData.image_path) : null;
 const total = (isPdfBook && pdfTotalPages && currentPdfUrl === firstPageUrl)
 ? pdfTotalPages
 : book.pages.length;

 const milestone = detectReadingMilestone(currentPage, total, milestoneShownRef.current);
 if (!milestone) return;

 milestoneShownRef.current.add(milestone.id);
 setCompanionMessageKey(milestone.messageKey);
 setCompanionMessage(t(milestone.messageKey));
 setCompanionActive(true);
 }, [
 book?.id,
 book?.pages,
 currentPage,
 currentPdfUrl,
 isKidReader,
 loading,
 pdfTotalPages,
 showKidCelebration,
 showStoryOpening,
 t,
 ]);

 const dismissCompanion = useCallback(() => {
 setCompanionActive(false);
 setCompanionMessage('');
 setCompanionMessageKey('');
 }, []);

 const showPauseEncouragement = useCallback(() => {
 if (!isKidReader || showStoryOpening || showKidCelebration) return;
 const keys = ['companionPauseWonderful', 'companionPauseContinue', 'companionPauseGreat'];
 const index = pauseEncourageIndexRef.current % keys.length;
 pauseEncourageIndexRef.current += 1;
 const messageKey = keys[index];
 setCompanionMessageKey(messageKey);
 setCompanionMessage(t(messageKey));
 setCompanionActive(true);
 }, [isKidReader, showKidCelebration, showStoryOpening, t]);

 // Natural pause encouragements — never during narration; skip page-turn stops
 useEffect(() => {
 if (!isKidReader || !book) return;
 const active = book.audio_url ? audioPlayer.playing : isPlaying;
 if (wasNarratingRef.current && !active) {
 if (skipPauseEncourageRef.current) {
 skipPauseEncourageRef.current = false;
 } else {
 showPauseEncouragement();
 }
 }
 wasNarratingRef.current = active;
 }, [isKidReader, book, book?.audio_url, audioPlayer.playing, isPlaying, showPauseEncouragement]);

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

 const handleBookmark = () => {
 if (!book?.id) return;
 storage.addToHistory(book.id, book.title, currentPage);
 setBookmarkPulse(true);
 setTimeout(() => setBookmarkPulse(false), 700);
 showToast('Page mémorisée', 'success', 1500);
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

 useEffect(() => {
 if (!showMenu) {
 setShowReaderTools(false);
 setShowAmbiencePanel(false);
 }
 }, [showMenu]);

 // Kid page-turn sparkle (UI only)
 useEffect(() => {
 if (!isKidReader || pageTurnMountRef.current) {
 pageTurnMountRef.current = false;
 return undefined;
 }
 setPageSparkle(true);
 const timer = setTimeout(() => setPageSparkle(false), 650);
 return () => clearTimeout(timer);
 }, [currentPage, isKidReader]);

 const cycleThemeMode = () => {
 setThemeMode((current) => {
 if (current === 'night') return 'warm';
 return 'night';
 });
 };

 const cycleSpeechRate = () => {
 setSpeechRate((current) => {
 if (current < 0.9) return 1;
 if (current < 1.15) return 1.25;
 return 0.75;
 });
 };

 const readerTheme = themeMode === 'night' ? 'night' : 'warm';

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

 useEffect(() => {
 if (loading || !book?.pages?.length) return undefined;

 const firstPageData = book.pages[0];
 const isPdfBook = firstPageData?.image_path?.toLowerCase().endsWith('.pdf');
 const pageData = isPdfBook ? firstPageData : book.pages[currentPage];
 const pageText = normalizePageContent(pageData?.content);
 const sentences = splitTextIntoSentences(pageText);

 if (isPdfBook || pageData?.image_path || !sentences.length) return undefined;

 const preloadPage = (nextPageData) => {
 if (!nextPageData?.image_path) return;
 const nextUrl = getFileUrl(nextPageData.image_path);
 if (!nextUrl || nextUrl.toLowerCase().endsWith('.pdf')) return;
 const img = new Image();
 img.decoding = 'async';
 img.src = nextUrl;
 };

 preloadPage(book.pages[currentPage - 1]);
 preloadPage(book.pages[currentPage + 1]);
 return undefined;
 }, [loading, book, currentPage]);

 if (loading) {
 return (
<PremiumReaderState
 title={isKidReader ? 'Ton histoire arrive' : "Préparation de l'histoire"}
 description={isKidReader ? null : 'Le livre s’ouvre doucement pour une lecture sans distraction.'}
 reducedMotion={reducedMotion}
 icon="📖"
/>
 );
}

 if (!book || !book.pages || book.pages.length === 0) {
 return (
<PremiumReaderState
 title={isKidReader ? 'Choisissons une autre histoire' : t('kidBookNotFound')}
 description={isKidReader ? 'Cette lecture n’est pas prête pour le moment. La bibliothèque t’attend avec d’autres aventures.' : 'Le livre n’est pas disponible pour le moment.'}
 actionLabel={isKidReader ? 'Retour aux histoires' : 'Retour à la bibliothèque'}
 onAction={exitReader}
 reducedMotion={reducedMotion}
 icon={isKidReader ? '✨' : '📚'}
/>
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
 const coverBleedUrl = resolveBookCoverUrl(book);
 const pageTurnMotion = kidsReaderPageTurn(reducedMotion, pageDirection);

 const themeLabel = readerTheme === 'night' ? 'Mode nuit' : 'Papier chaud';

 const progressRounded = Math.round(progress);
 const audioProgressMax = Math.max(0, Math.floor(audioPlayer.duration || 0));
 const audioProgressValue = Math.min(audioProgressMax, Math.floor(audioPlayer.currentTime || 0));
 const pageText = normalizePageContent(currentPageData?.content);
 const textSentences = splitTextIntoSentences(pageText);
 const storyMood = isKidReader ? deriveReaderMood(book) : 'warm';
 const readingPhaseKey = isKidReader ? getReadingPhaseKey(currentPage, totalPages) : null;
 const readingPhaseLabel = readingPhaseKey ? t(getReadingPhaseLabelKey(readingPhaseKey)) : null;
 const ambientStyle = isKidReader ? getReaderAmbientStyle(storyMood) : undefined;
 const isReadAlongActive = isPlaying && textSentences.length > 0 && !book.audio_url;
 const pageWordCount = countWords(pageText) || 70;
 const audioRemainingSeconds = book.audio_url && audioPlayer.duration > 0
   ? Math.max(0, audioPlayer.duration - (audioPlayer.currentTime || 0))
   : null;
 const remainingReadSeconds = estimateRemainingReadSeconds({
   totalPages,
   currentPage,
   speechRate,
   pageWordCount,
   audioRemaining: audioRemainingSeconds,
 });
 const remainingReadLabel = formatRemainingReadLabel(remainingReadSeconds);
 const activeVoiceProfile = voiceProfiles.find((profile) => profile.id === selectedVoiceProfile) || voiceProfiles[0];
 const activeFamilyVoice = familyVoiceProfiles.find((voice) => String(voice.id) === String(selectedFamilyVoiceId));
 const voiceNarratorLabel = activeFamilyVoice?.name || activeFamilyVoice?.label || t(`readerVoiceProfile_${activeVoiceProfile.id}`);
 const voiceStyleLabel = activeFamilyVoice
   ? t('readerVoiceStyleFamily')
   : t(`readerVoiceStyle_${activeVoiceProfile.id}`);

 return (
 <motion.div 
 ref={readerRef}
 data-reader-theme={readerTheme}
 data-reader-mood={isKidReader ? storyMood : undefined}
 data-read-along={isReadAlongActive ? 'true' : undefined}
 style={ambientStyle}
 className={`kids-reader-shell h-screen w-full flex flex-col relative overflow-hidden ${!showMenu ? 'is-focus' : ''} ${showStoryOpening && isKidReader ? 'is-opening' : ''} ${isReadAlongActive ? 'is-read-along' : ''} ${audioPlaybackActive ? 'is-narrating' : ''} ${readerTheme === 'night' ? 'kids-night-calm' : ''} ${isExitingReader ? 'is-exiting' : ''}`}
 animate={isExitingReader && !reducedMotion ? kidsRouteExit.exit : { opacity: 1, y: 0, scale: 1 }}
 transition={isExitingReader && !reducedMotion ? kidsRouteExit.transition : { duration: 0 }}
 onClick={() => setShowMenu(!showMenu)}
 onTouchStart={onTouchStart}
 onTouchMove={onTouchMove}
 onTouchEnd={onTouchEnd}
 >
 {coverBleedUrl && (
 <div className="kids-reader-cover-bleed" style={{ backgroundImage: `url(${coverBleedUrl})` }} aria-hidden="true" />
 )}
 <ReaderPaperAtmosphere mood={storyMood} />
 {isKidReader && readerTheme === 'night' && <ReaderClouds />}
 {isKidReader && readerTheme === 'night' && <KidsBedtimeAtmosphere intensity="soft" />}
 <Confetti show={showConfetti && !isKidReader} />
 {isKidReader && readerTheme === 'night' && !showStoryOpening && !showMenu && !audioPlaybackActive && (
   <StarParticles count={reducedMotion ? 0 : 3} />
 )}
 {isKidReader && <PageSparkle active={pageSparkle} reducedMotion={reducedMotion} />}

 {isKidReader && (
   <KidsReadingCompanion
     message={companionMessage}
     messageKey={companionMessageKey}
     active={companionActive}
     onDismiss={dismissCompanion}
   />
 )}

 {isKidReader && (
   <KidsStoryOpening
     active={showStoryOpening && Boolean(book)}
     book={book}
     coverUrl={book?.cover_image}
     title={book?.title}
     mood={storyMood}
     onDone={() => setShowStoryOpening(false)}
   />
 )}

 {/* Focus mode: chrome auto-hides via showMenu */}
 <AnimatePresence>
 {showMenu && (
 <motion.header
 initial={reducedMotion ? false : {y: -24, opacity: 0}}
 animate={{y: 0, opacity: 1}}
 exit={reducedMotion ? undefined : {y: -16, opacity: 0}}
 transition={{duration: 0.22, ease: [0.22, 1, 0.36, 1]}}
 onClick={(e) => e.stopPropagation()}
 className="kids-reader-header"
 >
  <button
    type="button"
    onClick={exitReader}
    className="kids-reader-toolbar-btn"
    aria-label={t('kidReaderHome')}
  >
    <ChevronLeftIcon className={`w-7 h-7 ${isRtl ? 'rotate-180' : ''}`} />
  </button>

  <div className="min-w-0 px-1">
    <h1 className="kids-reader-header-title">{book.title}</h1>
  </div>

  <div
    className={`kids-reader-header-progress ${isKidReader ? 'kids-reader-emotional-progress' : ''}`}
    role="progressbar"
    aria-valuenow={currentPage + 1}
    aria-valuemin={1}
    aria-valuemax={totalPages}
    aria-label={isKidReader && readingPhaseLabel
      ? `${readingPhaseLabel} · ${currentPage + 1} / ${totalPages}`
      : `Page ${currentPage + 1} sur ${totalPages}`}
  >
    {isKidReader ? (
      <>
        <span className="kids-reader-phase-label">{readingPhaseLabel}</span>
        <span className="sr-only">{currentPage + 1} / {totalPages}</span>
      </>
    ) : (
      <>
        <span>{currentPage + 1}</span>
        <span aria-hidden="true">/</span>
        <span>{totalPages}</span>
      </>
    )}
  </div>
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
 <div className={`kids-reader-canvas relative flex-1 w-full h-full flex items-center justify-center overflow-hidden z-10 ${showMenu ? 'pb-36 md:pb-40' : 'pb-4'} ${isKidReader && !showStoryOpening ? 'is-revealed' : ''}`}>

 {/* The Book Canvas */}
 <div className="kids-reader-book-shell relative h-full flex items-center justify-center">
 {isKidReader && !showStoryOpening && !audioPlaybackActive && (
   <ReaderLivingPresence mood={storyMood} active={!showKidCelebration} />
 )}
 <AnimatePresence mode="wait">
 <motion.div
 key={currentPage}
 {...(isKidReader ? pageTurnMotion : (reducedMotion ? { initial: false, animate: { opacity: 1 } } : {
  ...kidsReaderPageTurn(false, pageDirection),
 }))}
 className="w-full h-full flex flex-col items-center justify-center"
 style={{
 fontFamily: readingSettings.font === 'dyslexic' ? 'OpenDyslexic, sans-serif' : readingSettings.font === 'comic' ? 'Comic Sans MS, cursive' : undefined
}}
 >
 {(() => {
 const fileUrl = currentPageData.image_path ? getFileUrl(currentPageData.image_path) : null;
 const isPagePDF = currentPageData.image_path?.toLowerCase().endsWith('.pdf');

 if (isPagePDF) {
 return (
 <div className="w-full max-h-[85vh] overflow-hidden kids-reader-page-card">
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

 if (isKidReader) {
 return (
 <article className="kids-reader-spread">
 {currentPageData.image_path ? (
 <div className="kids-reader-spread-art">
 <LivingIllustration
 src={fileUrl}
 alt={`Page ${currentPage + 1}`}
 />
 </div>
 ) : null}
 {pageText ? (
 <div className="kids-reader-spread-text">
 <div className="kids-reader-text-page">
 <div className="kids-reader-text-body">
 {textSentences.length > 0 ? textSentences.map((sentence, index) => (
   <span
     key={`${index}-${sentence.start}`}
     className={`kids-reader-sentence ${isReadAlongActive && index === currentSentenceIndex ? 'is-active' : ''} ${isReadAlongActive && index < currentSentenceIndex ? 'is-passed' : ''}`}
   >
     {sentence.text}{' '}
   </span>
 )) : pageText}
 </div>
 </div>
 </div>
 ) : null}
 </article>
 );
}

 if (currentPageData.image_path) {
 return (
 <div className="kids-reader-illustration-wrap w-full">
 <motion.img
 src={fileUrl}
 alt={`Page ${currentPage + 1}`}
 loading="lazy"
 decoding="async"
 className="kids-reader-illustration"
 />
 </div>
 );
}

 return (
 <div className="w-full kids-reader-page-card">
 <div className="kids-reader-text-page">
 {pageText && (
 <div 
 className="kids-reader-text-body"
 style={{
 fontSize: isKidReader ? undefined : `${readingSettings.fontSize}px`,
 lineHeight: isKidReader ? undefined : (readingSettings.lineSpacing ? '2' : '1.75'),
 letterSpacing: readingSettings.syllabification ? '0.1em' : undefined
}}
 >
 {textSentences.length > 0 ? textSentences.map((sentence, index) => (
   <span
     key={`${index}-${sentence.start}`}
     className={`kids-reader-sentence ${isReadAlongActive && index === currentSentenceIndex ? 'is-active' : ''} ${isReadAlongActive && index < currentSentenceIndex ? 'is-passed' : ''}`}
   >
     {sentence.text}{' '}
   </span>
 )) : pageText}
 </div>
 )}
 </div>
 </div>
 );
})()}
 </motion.div>
 </AnimatePresence>
 </div>
 </div>

 <p className="kids-reader-focus-hint" aria-hidden="true">{t('kidReaderFocusHint')}</p>

 {/* Floating Audio Controls — premium glass dock */}
 <AnimatePresence>
 {showMenu && (
 <motion.div
 initial={reducedMotion ? false : {y: 20, opacity: 0}}
 animate={{y: 0, opacity: 1}}
 exit={reducedMotion ? undefined : {y: 12, opacity: 0}}
 transition={{duration: reducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1]}}
 className="kids-reader-audio-dock"
 onClick={(e) => e.stopPropagation()}
 >
   <div className="kids-reader-audio-panel kids-reader-audio-panel--premium">
     <KidsReaderTimeline
       progress={progress}
       currentPage={currentPage}
       totalPages={totalPages}
       remainingLabel={t('kidReaderRemainingTime', { time: remainingReadLabel })}
       phaseLabel={isKidReader && readingPhaseLabel
         ? readingPhaseLabel
         : t('kidReaderProgressLabel', { percent: progressRounded })}
       ariaLabel={isKidReader && readingPhaseLabel
         ? `${readingPhaseLabel} · ${progressRounded}%`
         : `Progression · ${progressRounded}%`}
       reducedMotion={reducedMotion}
     />

     {isKidReader && (
       <KidsReaderVoiceMeta
         t={t}
         narrator={voiceNarratorLabel}
         style={voiceStyleLabel}
         speedLabel={`${speechRate}x`}
         remainingLabel={remainingReadLabel}
       />
     )}

     {(book.audio_url || audioPlaybackActive) && (
       <div className="kids-reader-audio-strip">
         {book.audio_url ? (
           <ReaderAudioWave active={audioPlaybackActive} reducedMotion={reducedMotion} />
         ) : null}
         {book.audio_url && audioProgressMax > 0 && (
           <div className="kids-reader-timeline-wrap">
             <span className="kids-reader-time">{formatReaderTime(audioPlayer.currentTime)}</span>
             <input
               type="range"
               min={0}
               max={audioProgressMax}
               value={audioProgressValue}
               onChange={(event) => audioPlayer.seekTo(Number(event.target.value))}
               className="kids-reader-audio-timeline"
               aria-label={t('kidReaderAudioProgress')}
             />
             <span className="kids-reader-time">{formatReaderTime(audioPlayer.duration)}</span>
           </div>
         )}
       </div>
     )}

     <div className="kids-reader-primary-row">
       <button
         type="button"
         onClick={prevPage}
         disabled={isFirstPage}
         aria-label={t('kidReaderPrev')}
         className="kids-reader-nav-edge"
       >
         <ChevronLeftIcon className={`w-7 h-7 ${isRtl ? 'rotate-180' : ''}`} />
       </button>
       <button
         type="button"
         onClick={toggleAudio}
         disabled={!book.audio_url && (isExtracting || (!currentPageData?.content && !currentPageData?.image_path))}
         aria-label={audioPlaybackActive ? t('pause') : t('kidReaderPlay')}
         className="kids-reader-play-btn"
       >
         {!book.audio_url && isExtracting ? (
           <span className="inline-block h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" />
         ) : audioPlaybackActive ? (
           <PauseIcon className="w-8 h-8" />
         ) : (
           <PlayIcon className={`w-8 h-8 ${isRtl ? '' : 'ms-0.5'}`} />
         )}
       </button>
       <button
         type="button"
         onClick={nextPage}
         disabled={isLastPage}
         aria-label={t('kidReaderNext')}
         className="kids-reader-nav-edge"
       >
         <ChevronRightIcon className={`w-7 h-7 ${isRtl ? 'rotate-180' : ''}`} />
       </button>
       <button
         type="button"
         onClick={cycleSpeechRate}
         className="kids-reader-speed-chip"
         aria-label={t('kidReaderSpeedLabel', { rate: speechRate })}
         title={t('kidReaderSpeedLabel', { rate: speechRate })}
       >
         {speechRate}x
       </button>
       {isKidReader && (
         <button
           type="button"
           onClick={(e) => {
             e.stopPropagation();
             setShowAmbiencePanel((open) => !open);
             setShowReaderTools(false);
           }}
           className={`kids-reader-ambience-toggle ${showAmbiencePanel ? 'is-open' : ''} ${ambienceId ? 'is-active' : ''}`}
           aria-label={t('readerAmbienceTitle')}
           aria-expanded={showAmbiencePanel}
           aria-pressed={Boolean(ambienceId)}
         >
           <span aria-hidden="true">🌿</span>
         </button>
       )}
       <button
         type="button"
         onClick={(e) => {
           e.stopPropagation();
           setShowReaderTools((open) => !open);
           setShowAmbiencePanel(false);
         }}
         className={`kids-reader-more-btn ${showReaderTools ? 'is-open' : ''}`}
         aria-label={t('kidReaderMoreOptions')}
         aria-expanded={showReaderTools}
       >
         <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
           <circle cx="5" cy="12" r="1.75" />
           <circle cx="12" cy="12" r="1.75" />
           <circle cx="19" cy="12" r="1.75" />
         </svg>
       </button>
     </div>

     {isKidReader && (
       <KidsReaderAmbientPanel
         t={t}
         open={showAmbiencePanel}
         selectedId={ambienceId}
         volume={ambienceVolume}
         onSelect={setAmbienceId}
         onVolumeChange={setAmbienceVolume}
       />
     )}

     <AnimatePresence>
       {showReaderTools && (
         <motion.div
           initial={reducedMotion ? false : { opacity: 0, height: 0 }}
           animate={{ opacity: 1, height: 'auto' }}
           exit={reducedMotion ? undefined : { opacity: 0, height: 0 }}
           transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
           className="kids-reader-more-tools"
           onClick={(e) => e.stopPropagation()}
         >
           <button
             type="button"
             onClick={handleBookmark}
             className={`kids-reader-toolbar-btn ${bookmarkPulse ? 'is-bookmarked' : ''}`}
             aria-label={t('kidReaderBookmark')}
           >
             <BookmarkGlyph className="w-6 h-6" />
           </button>
           <button
             type="button"
             onClick={toggleBookFavorite}
             className={`kids-reader-toolbar-btn ${isFavorite ? 'is-active' : ''}`}
             aria-label={t('yourFavorites')}
             aria-pressed={isFavorite}
           >
             <svg className="w-6 h-6" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
             </svg>
           </button>
           <button
             type="button"
             onClick={cycleThemeMode}
             className="kids-reader-toolbar-btn"
             aria-label={themeLabel}
             title={themeLabel}
           >
             {readerTheme === 'night' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
           </button>
           {!isKidReader && (
             <button
               type="button"
               onClick={() => setShowReadingAid(true)}
               className="kids-reader-toolbar-btn"
               aria-label="Aide à la lecture"
             >
               <SettingsIcon className="w-6 h-6" />
             </button>
           )}
           {canReport && (
             <button
               type="button"
               onClick={() => setShowReportModal(true)}
               className="kids-reader-toolbar-btn"
               aria-label={t('reportContentAction')}
             >
               <WarningIcon className="w-6 h-6" />
             </button>
           )}
         </motion.div>
       )}
     </AnimatePresence>
   </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* End of Book Celebration Modal */}
 <Modal isOpen={showEndModal} onClose={() => setShowEndModal(false)} maxWidth="max-w-md">
 <div className="text-center p-space-4">
 <div className="mx-auto mb-space-20 w-32">
   <div className="kids-book-collectible-cover aspect-[3/4] relative overflow-hidden">
     <img src={coverBleedUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
   </div>
 </div>
 <p className="kids-type-caption uppercase tracking-[0.14em] text-primary-600/80 mb-space-8">Histoire terminée</p>
 <h2 className="kids-type-h1 mb-space-8">Bravo</h2>
 <p className="kids-shelf-subtitle !mx-auto mb-space-24">Tu as terminé « {book.title} »</p>
 <div className="flex flex-col gap-3">
 <Button variant="primary" fullWidth onClick={exitReader}>
 Continuer à explorer
 </Button>
 <Button variant="ghost" fullWidth onClick={() => { setShowEndModal(false); setCurrentPage(0); setHasReachedEnd(false); }}>
 Relire
 </Button>
 </div>
 </div>
 </Modal>

 {isKidReader && (
   <KidsCelebration
     active={showKidCelebration}
     variant="story"
     title={t('kidReaderBravo')}
     subtitle={t('kidReaderStoryJustFinished')}
     coverUrl={coverBleedUrl}
     book={book}
     bookTitle={book.title}
     relatedLimit={3}
     onPlayBook={(relatedBook) => {
       if (!relatedBook?.id) return;
       setShowKidCelebration(false);
       navigate(`/kids/read/${relatedBook.id}`);
     }}
     primaryLabel={t('kidReaderBackToLibrary')}
     onPrimary={() => {
       setShowKidCelebration(false);
       navigate('/kids/library');
     }}
     secondaryLabel={t('kidReaderReadAgain')}
     onSecondary={() => {
       setShowKidCelebration(false);
       setCurrentPage(0);
       setHasReachedEnd(false);
       setShowMenu(true);
       setShowStoryOpening(true);
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

 </motion.div>
 );
}

export default BookReader;
