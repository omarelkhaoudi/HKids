import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { booksAPI } from '../api/books';
import { recommendationsAPI } from '../api/recommendations';
import { voicesAPI } from '../api/voices';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { getImageUrl } from '../utils/imageUrl';
import { storage } from '../utils/storage';
import { LANGUAGE_FILTERS } from '../constants/contentOptions';
import { KID_CATEGORIES } from '../constants/kidCategories';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useOfflineContent } from '../hooks/useOfflineContent';
import { getDownloads, offlineContentIds } from '../services/offline/offlineContentService';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import {
  AudioIcon, BookIcon, DownloadIcon, HeartIcon, PlayIcon, PauseIcon,
  SearchIcon, SparklesIcon, ChevronLeftIcon, ChevronRightIcon,
  ClockIcon, InfoIcon, ShieldIcon, HomeIcon
} from '../components/Icons';
import { Logo } from '../components/Logo';

// --- THEMES & CONSTANTS ---
const themes = [
  { id: 'all', label: 'Tous', pictogram: '★', gradient: 'from-sky-500 to-emerald-400', match: [] },
  { id: 'dinosaurs', label: 'Dinosaures', pictogram: 'D', gradient: 'from-lime-500 to-green-600', match: ['dinosaur', 'dinosaure', 'dino'] },
  { id: 'space', label: 'Espace', pictogram: 'R', gradient: 'from-indigo-500 to-cyan-500', match: ['space', 'espace', 'rocket', 'planete', 'planet'] },
  { id: 'animals', label: 'Animaux', pictogram: 'A', gradient: 'from-amber-400 to-orange-500', match: ['animal', 'animaux', 'nature'] },
  { id: 'princesses', label: 'Princesses', pictogram: 'P', gradient: 'from-pink-500 to-rose-500', match: ['princess', 'princesse', 'fairy', 'conte'] },
  { id: 'jobs', label: 'Métiers', pictogram: 'M', gradient: 'from-primary-500 to-teal-500', match: ['job', 'metier', 'doctor', 'pompier', 'teacher'] },
  { id: 'world', label: 'Monde', pictogram: 'G', gradient: 'from-violet-500 to-fuchsia-500', match: ['world', 'monde', 'culture', 'voyage', 'science'] },
];

const languages = LANGUAGE_FILTERS;
const childThemes = [
  { id: 'all', label: 'Tous', shortLabel: 'Tout', pictogram: '⭐', cue: 'Go', gradient: 'from-sky-500 to-emerald-400', match: [] },
  ...KID_CATEGORIES,
];

function inferTheme(book) {
  if (book.theme) return book.theme;
  const searchable = [book.title, book.description, book.category_name, book.author].filter(Boolean).join(' ').toLowerCase();
  const matchedTheme = childThemes.find((theme) => theme.id !== 'all' && theme.match.some((keyword) => searchable.includes(keyword)));
  return matchedTheme?.id || 'all';
}

function formatDuration(seconds = 0) {
  const safeSeconds = Math.max(0, Number(seconds || 0));
  if (!safeSeconds) return null;
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function getRecommendationContext() {
  return {
    favorites: storage.getFavorites(),
    readingHistory: storage.getReadingHistory(),
    listeningHistory: storage.getListeningHistory(),
    readingStats: storage.getReadingStats(),
  };
}

// --- PREMIUM COMPONENTS ---
const CinematicCard = ({ book, isFavorite, offlineReady, onPlay, onFavorite, onDownload }) => {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative h-72 w-52 md:h-80 md:w-56 shrink-0 cursor-pointer overflow-hidden rounded-3xl bg-surface-secondary shadow-sm transition-shadow hover:shadow-2xl"
      onClick={() => onPlay(book)}
    >
      {/* Cover Image */}
      <img
        src={getImageUrl(book.cover_image, 'book')}
        alt={book.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 pointer-events-none" />
      <div className="absolute inset-0 bg-primary-900/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

      {/* Top Badges */}
      <div className="absolute left-3 top-3 right-3 flex flex-wrap gap-2">
        {book.is_premium && (
          <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-black text-white shadow-md">
            <SparklesIcon className="h-3 w-3" /> PRO
          </span>
        )}
        {book.language && (
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md border border-white/30">
            {book.language.toUpperCase()}
          </span>
        )}
      </div>

      {/* Offline/Favorite Icons */}
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        {isFavorite && (
          <div className="rounded-full bg-rose-500 p-1.5 text-white shadow-md">
            <HeartIcon className="h-4 w-4" filled />
          </div>
        )}
        {offlineReady && (
          <div className="rounded-full bg-emerald-500 p-1.5 text-white shadow-md">
            <DownloadIcon className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Hover Action Buttons */}
      <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 transition-all duration-300 group-hover:opacity-100 bg-black/20 backdrop-blur-[2px]">
        <motion.button 
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onPlay(book); }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary-600 shadow-glow"
        >
          <PlayIcon className="h-6 w-6 ml-1" filled />
        </motion.button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 transition-transform duration-300 group-hover:translate-y-[-10px]">
        <h3 className="line-clamp-2 text-base font-black leading-tight text-white drop-shadow-md">
          {book.title}
        </h3>
        <div className="mt-2 flex items-center gap-3 text-xs font-bold text-white/80">
          {book.duration_seconds > 0 && (
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" />
              {formatDuration(book.duration_seconds)}
            </span>
          )}
          {book.age_level && (
            <span className="flex items-center gap-1">
              <ShieldIcon className="h-3.5 w-3.5" />
              {book.age_level}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const SectionCarousel = ({ title, icon: Icon, books, onPlay, favorites, offlineContent, onFavorite, onDownload }) => {
  const carouselRef = useRef(null);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!books || books.length === 0) return null;

  return (
    <section className="mb-12 relative group">
      <div className="mb-6 flex items-center justify-between px-4 md:px-8">
        <h2 className="flex items-center gap-3 text-2xl font-black text-foreground">
          {Icon && <Icon className="h-7 w-7 text-primary-500" />}
          {title}
        </h2>
        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => scroll('left')} className="p-2 rounded-full bg-card shadow-sm border border-border hover:bg-surface-100 transition">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button onClick={() => scroll('right')} className="p-2 rounded-full bg-card shadow-sm border border-border hover:bg-surface-100 transition">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div 
        ref={carouselRef}
        className="flex gap-4 overflow-x-auto px-4 md:px-8 pb-8 pt-2 snap-x snap-mandatory custom-scrollbar"
      >
        {books.map((book) => {
          const isFavorite = favorites.includes(book.id);
          const offlineReady = offlineContent.getBookStatus(book.id)?.status === 'downloaded';
          return (
            <div key={book.id} className="snap-start shrink-0">
              <CinematicCard 
                book={book} 
                isFavorite={isFavorite} 
                offlineReady={offlineReady} 
                onPlay={onPlay}
                onFavorite={() => onFavorite(book.id)}
                onDownload={() => onDownload(book)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

// --- MAIN COMPONENT ---
function KidsLibrary() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [loading, setLoading] = useState(true);
  const [recommendationSections, setRecommendationSections] = useState([]);
  const [voiceProfiles, setVoiceProfiles] = useState([]);
  const [readingStats, setReadingStats] = useState(() => storage.getReadingStats());
  
  const audioPlayer = useAudioPlayer();
  const offlineContent = useOfflineContent();

  useEffect(() => {
    if (!user) {
      navigate('/parent/login');
      return;
    }
    loadData();
    setReadingStats(storage.getReadingStats());
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [booksRes, recommendationsRes, voicesRes] = await Promise.all([
        booksAPI.getPublishedBooks(),
        recommendationsAPI.getForKid(getRecommendationContext()).catch(() => ({ data: { sections: [] } })),
        voicesAPI.getAvailableVoices().catch(() => ({ data: [] })),
      ]);
      setBooks(booksRes.data || []);
      setRecommendationSections(recommendationsRes.data?.sections || []);
      setVoiceProfiles(voicesRes.data || []);
    } catch (error) {
      if (!navigator.onLine) {
        const downloads = await getDownloads();
        const offlineBooks = downloads
          .filter((item) => item.type === 'book' && item.status === 'downloaded')
          .map((item) => item.payload);
        setBooks(offlineBooks);
        setRecommendationSections([]);
        showToast('Mode hors connexion: livres téléchargés chargés', 'info');
      } else {
        showToast('Erreur lors du chargement des livres', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const visibleBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return books.filter((book) => {
      const bookTheme = inferTheme(book);
      const bookLanguage = book.language || 'fr';
      const matchesTheme = selectedTheme === 'all' || bookTheme === selectedTheme;
      const matchesLanguage = selectedLanguage === 'all' || bookLanguage === selectedLanguage;
      const matchesSearch = !query || [book.title, book.author, book.description, book.category_name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
      return matchesTheme && matchesLanguage && matchesSearch;
    });
  }, [books, searchQuery, selectedLanguage, selectedTheme]);

  // Sections data
  const favoritesIds = storage.getFavorites();
  const favoriteBooks = books.filter(b => favoritesIds.includes(b.id));
  const newBooks = [...books].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 15);
  const downloadedBooks = books.filter(b => offlineContent.getBookStatus(b.id)?.status === 'downloaded');
  const recommendedBooks = recommendationSections.length > 0 && recommendationSections[0].items 
    ? books.filter(b => recommendationSections[0].items.some(item => item.book_id === b.id))
    : books.slice(0, 10);
  const featuredBook = recommendedBooks.length > 0 ? recommendedBooks[0] : books[0];

  const totalMinutes = Math.floor((readingStats.totalTimeSeconds || 0) / 60);

  const toggleFavorite = (bookId) => {
    if (storage.isFavorite(bookId)) {
      storage.removeFavorite(bookId);
      showToast('Retiré des favoris', 'info');
    } else {
      storage.addFavorite(bookId);
      showToast('Ajouté aux favoris', 'success');
    }
    setBooks((current) => [...current]);
  };

  const handleDownloadBook = async (book) => {
    try {
      await offlineContent.downloadBookContent(book);
      storage.markDownloaded(book.id);
      showToast('Contenu disponible hors connexion', 'success');
    } catch (error) {
      if (error.name !== 'AbortError') showToast('Téléchargement impossible', 'error');
    }
  };

  const handlePlayBook = (book) => {
    navigate(`/kids/read/${book.id}`);
  };

  const handleSurpriseMe = () => {
    if (books.length > 0) {
      const randomBook = books[Math.floor(Math.random() * books.length)];
      handlePlayBook(randomBook);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-0 overflow-hidden">
      {/* MAGICAL IMMERSIVE BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background" />
        <motion.div 
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary-500/10 via-purple-500/5 to-transparent blur-[100px]"
        />
        {/* Magic Particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-yellow-300 rounded-full blur-[1px] animate-pulse" />
        <div className="absolute top-40 right-20 w-3 h-3 bg-cyan-300 rounded-full blur-[2px] animate-pulse delay-700" />
        <div className="absolute top-80 left-1/4 w-1.5 h-1.5 bg-pink-300 rounded-full blur-[1px] animate-ping" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-0 md:px-6 lg:px-8 pt-4">
        
        {/* HEADER */}
        <header className="mb-6 flex items-center justify-between px-4 md:px-0 gap-4">
          <Link to="/kids" className="shrink-0">
            <Logo size="default" showText={true} />
          </Link>
          <button
            onClick={() => navigate('/kids')}
            className="inline-flex items-center gap-2 rounded-2xl bg-card/80 backdrop-blur-md px-5 py-3 text-sm font-black text-foreground shadow-sm hover:shadow-md transition border border-border"
          >
            <HomeIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Accueil</span>
          </button>
        </header>

        {/* PREMIUM HERO SECTION */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative mb-12 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-8 md:p-14 text-white shadow-2xl mx-4 md:mx-0"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-30 mix-blend-overlay"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 text-sm font-black mb-6 shadow-glass">
                <SparklesIcon className="h-5 w-5 text-yellow-300" />
                <span>Bibliothèque Magique</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4 filter drop-shadow-lg">
                Des milliers d'aventures t'attendent !
              </h1>
              <p className="text-lg md:text-xl font-bold text-white/90 filter drop-shadow-md max-w-lg">
                Découvre des histoires incroyables, apprends de nouvelles choses et voyage dans des mondes magiques.
              </p>
            </div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="shrink-0">
              <button
                onClick={handleSurpriseMe}
                className="inline-flex w-full md:w-auto items-center justify-center gap-3 rounded-3xl bg-white px-8 py-5 text-xl font-black text-purple-700 shadow-xl hover:shadow-2xl transition"
              >
                <SparklesIcon className="h-6 w-6" />
                <span>Surprise-moi !</span>
              </button>
            </motion.div>
          </div>
        </motion.section>

        {/* QUICK STATS */}
        <section className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-4 px-4 md:px-0">
          <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl p-6 text-white shadow-floating relative overflow-hidden">
            <BookIcon className="w-12 h-12 text-white/30 absolute right-4 bottom-4" />
            <p className="text-sm font-bold text-white/80 uppercase tracking-wider mb-1">Contenus</p>
            <p className="text-4xl font-black">{books.length}</p>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-rose-500 to-pink-500 rounded-3xl p-6 text-white shadow-floating relative overflow-hidden">
            <HeartIcon className="w-12 h-12 text-white/30 absolute right-4 bottom-4" filled />
            <p className="text-sm font-bold text-white/80 uppercase tracking-wider mb-1">Favoris</p>
            <p className="text-4xl font-black">{favoriteBooks.length}</p>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl p-6 text-white shadow-floating relative overflow-hidden">
            <DownloadIcon className="w-12 h-12 text-white/30 absolute right-4 bottom-4" />
            <p className="text-sm font-bold text-white/80 uppercase tracking-wider mb-1">Hors-ligne</p>
            <p className="text-4xl font-black">{downloadedBooks.length}</p>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-6 text-white shadow-floating relative overflow-hidden">
            <ClockIcon className="w-12 h-12 text-white/30 absolute right-4 bottom-4" />
            <p className="text-sm font-bold text-white/80 uppercase tracking-wider mb-1">Minutes lues</p>
            <p className="text-4xl font-black">{totalMinutes}</p>
          </motion.div>
        </section>

        {/* GLASSMORPHISM FILTERS */}
        <section className="mb-12 mx-4 md:mx-0">
          <div className="rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border p-6 shadow-glass">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <label className="relative block w-full md:flex-1">
                <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-foreground-muted" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-16 w-full rounded-[2rem] bg-surface-secondary/80 border border-border pl-14 pr-4 text-lg font-bold outline-none transition focus:border-primary-400 focus:bg-card focus:ring-4 focus:ring-primary-500/10 placeholder:text-foreground-muted"
                  placeholder="Chercher une histoire, un thème..."
                />
              </label>
              <div className="flex w-full md:w-auto gap-4">
                <select
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  className="h-16 flex-1 md:w-48 rounded-[2rem] bg-surface-secondary/80 border border-border px-5 font-bold outline-none transition focus:border-primary-400 appearance-none cursor-pointer"
                >
                  {childThemes.map((t) => <option key={t.id} value={t.id}>{t.shortLabel || t.label}</option>)}
                </select>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="h-16 flex-1 md:w-48 rounded-[2rem] bg-surface-secondary/80 border border-border px-5 font-bold outline-none transition focus:border-primary-400 appearance-none cursor-pointer"
                >
                  {languages.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED SELECTION (SÉLECTION DU JOUR) */}
        {featuredBook && !searchQuery && selectedTheme === 'all' && selectedLanguage === 'all' && (
          <section className="mb-12 px-4 md:px-0">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <SparklesIcon className="w-7 h-7 text-primary-500" />
              Sélection du jour
            </h2>
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="group relative overflow-hidden rounded-[2.5rem] bg-surface-secondary shadow-lg cursor-pointer flex flex-col md:flex-row min-h-[300px]"
              onClick={() => handlePlayBook(featuredBook)}
            >
              <div className="w-full md:w-1/2 relative h-64 md:h-auto">
                <img 
                  src={getImageUrl(featuredBook.cover_image, 'book')} 
                  alt={featuredBook.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface-secondary/90 md:bg-gradient-to-l" />
              </div>
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-card md:bg-transparent relative z-10">
                <div className="flex gap-2 mb-4">
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-black text-primary-700 uppercase">{inferTheme(featuredBook)}</span>
                  {featuredBook.language && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 uppercase">{featuredBook.language}</span>}
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-foreground mb-4 leading-tight">{featuredBook.title}</h3>
                <p className="text-foreground-muted font-bold line-clamp-3 mb-8 text-lg">{featuredBook.description}</p>
                <div className="flex items-center gap-4 mt-auto">
                  <button className="flex items-center gap-2 rounded-full bg-primary-500 px-8 py-4 text-white font-black hover:bg-primary-600 transition shadow-lg hover:shadow-xl">
                    <PlayIcon className="w-6 h-6" filled />
                    Lire
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(featuredBook.id); }}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-secondary text-foreground-muted hover:bg-rose-50 hover:text-rose-500 transition shadow-sm border border-border"
                  >
                    <HeartIcon className="w-6 h-6" filled={favoritesIds.includes(featuredBook.id)} />
                  </button>
                </div>
              </div>
            </motion.div>
          </section>
        )}

        {loading ? (
          <div className="px-4 md:px-0">
            <BookGridSkeleton count={8} />
          </div>
        ) : searchQuery || selectedTheme !== 'all' || selectedLanguage !== 'all' ? (
          /* FULL GRID FOR SEARCH RESULTS */
          <section className="mb-12 px-4 md:px-0">
            <h2 className="text-2xl font-black mb-6 text-foreground">Résultats de recherche</h2>
            {visibleBooks.length === 0 ? (
              <div className="rounded-[2.5rem] bg-card border border-border p-12 text-center shadow-sm">
                <div className="text-8xl mb-6">🐉</div>
                <h3 className="text-2xl font-black mb-2">Aucun contenu trouvé.</h3>
                <p className="text-foreground-muted font-bold mb-8">Essaie de chercher autre chose ou retire les filtres.</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedTheme('all'); setSelectedLanguage('all'); }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-8 py-4 text-lg font-black text-white shadow-lg hover:bg-primary-600 transition"
                >
                  <SparklesIcon className="h-6 w-6" />
                  Explorer la bibliothèque
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                <AnimatePresence>
                  {visibleBooks.map(book => (
                    <CinematicCard 
                      key={book.id} 
                      book={book} 
                      isFavorite={favoritesIds.includes(book.id)} 
                      offlineReady={offlineContent.getBookStatus(book.id)?.status === 'downloaded'} 
                      onPlay={handlePlayBook}
                      onFavorite={toggleFavorite}
                      onDownload={handleDownloadBook}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        ) : (
          /* HORIZONTAL CAROUSELS */
          <div className="space-y-12">
            <SectionCarousel 
              title="Recommandé pour toi" 
              icon={SparklesIcon} 
              books={recommendedBooks} 
              onPlay={handlePlayBook} 
              favorites={favoritesIds} 
              offlineContent={offlineContent} 
              onFavorite={toggleFavorite} 
              onDownload={handleDownloadBook} 
            />
            
            <SectionCarousel 
              title="Nouveautés" 
              icon={BookIcon} 
              books={newBooks} 
              onPlay={handlePlayBook} 
              favorites={favoritesIds} 
              offlineContent={offlineContent} 
              onFavorite={toggleFavorite} 
              onDownload={handleDownloadBook} 
            />
            
            {favoriteBooks.length > 0 && (
              <SectionCarousel 
                title="Mes Favoris" 
                icon={HeartIcon} 
                books={favoriteBooks} 
                onPlay={handlePlayBook} 
                favorites={favoritesIds} 
                offlineContent={offlineContent} 
                onFavorite={toggleFavorite} 
                onDownload={handleDownloadBook} 
              />
            )}
            
            {downloadedBooks.length > 0 && (
              <SectionCarousel 
                title="Disponible hors connexion" 
                icon={DownloadIcon} 
                books={downloadedBooks} 
                onPlay={handlePlayBook} 
                favorites={favoritesIds} 
                offlineContent={offlineContent} 
                onFavorite={toggleFavorite} 
                onDownload={handleDownloadBook} 
              />
            )}
          </div>
        )}

      </div>
      
      {/* Audio Player and Voice Assistant */}
      <AudioPlayer />
      <VoiceAssistant />
    </div>
  );
}

export default KidsLibrary;
