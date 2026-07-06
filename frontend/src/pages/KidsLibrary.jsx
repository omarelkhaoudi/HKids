import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { booksAPI } from '../api/books';
import { recommendationsAPI } from '../api/recommendations';
import { voicesAPI } from '../api/voices';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { BookGridSkeleton } from '../components/SkeletonLoader';
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
  AudioIcon,
  BookIcon,
  DownloadIcon,
  HeartIcon,
  HistoryIcon,
  LogOutIcon,
  PauseIcon,
  PlayIcon,
  SearchIcon,
  SparklesIcon,
  HomeIcon,
} from '../components/Icons';
import { Logo } from '../components/Logo';

const themes = [
  {
    id: 'all',
    label: 'Tous',
    pictogram: '★',
    gradient: 'from-sky-500 to-emerald-400',
    match: [],
  },
  {
    id: 'dinosaurs',
    label: 'Dinosaures',
    pictogram: 'D',
    gradient: 'from-lime-500 to-green-600',
    match: ['dinosaur', 'dinosaure', 'dino'],
  },
  {
    id: 'space',
    label: 'Espace',
    pictogram: 'R',
    gradient: 'from-indigo-500 to-cyan-500',
    match: ['space', 'espace', 'rocket', 'planete', 'planet'],
  },
  {
    id: 'animals',
    label: 'Animaux',
    pictogram: 'A',
    gradient: 'from-accent-400 to-accent-500',
    match: ['animal', 'animaux', 'nature'],
  },
  {
    id: 'princesses',
    label: 'Princesses',
    pictogram: 'P',
    gradient: 'from-secondary-500 to-rose-500',
    match: ['princess', 'princesse', 'fairy', 'conte'],
  },
  {
    id: 'jobs',
    label: 'Metiers',
    pictogram: 'M',
    gradient: 'from-primary-500 to-teal-500',
    match: ['job', 'metier', 'doctor', 'pompier', 'teacher'],
  },
  {
    id: 'world',
    label: 'Monde',
    pictogram: 'G',
    gradient: 'from-violet-500 to-fuchsia-500',
    match: ['world', 'monde', 'culture', 'voyage', 'science'],
  },
];

const languages = LANGUAGE_FILTERS;
const childThemes = [
  {
    id: 'all',
    label: 'Tous',
    shortLabel: 'Tout',
    pictogram: '⭐',
    cue: 'Go',
    gradient: 'from-sky-500 to-emerald-400',
    match: [],
  },
  ...KID_CATEGORIES,
];

function inferTheme(book) {
  if (book.theme) return book.theme;

  const searchable = [
    book.title,
    book.description,
    book.category_name,
    book.author,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matchedTheme = childThemes.find((theme) =>
    theme.id !== 'all' && theme.match.some((keyword) => searchable.includes(keyword))
  );

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
  const [selectedVoiceId, setSelectedVoiceId] = useState(() => localStorage.getItem('hkids_selected_voice_id') || '');
  const [readingStats, setReadingStats] = useState(() => storage.getReadingStats());
  const audioPlayer = useAudioPlayer();
  const offlineContent = useOfflineContent();

  useEffect(() => {
    if (!user || user.role !== 'kid') {
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
        recommendationsAPI.getForKid(getRecommendationContext()).catch((error) => {
          console.warn('Recommendations unavailable:', error);
          return { data: { sections: [] } };
        }),
        voicesAPI.getAvailableVoices().catch((error) => {
          console.warn('Family voices unavailable:', error);
          return { data: [] };
        }),
      ]);
      setBooks(booksRes.data || []);
      setRecommendationSections(recommendationsRes.data?.sections || []);
      setVoiceProfiles(voicesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      if (!navigator.onLine) {
        const downloads = await getDownloads();
        const offlineBooks = downloads
          .filter((item) => item.type === 'book' && item.status === 'downloaded')
          .map((item) => item.payload);
        setBooks(offlineBooks);
        setRecommendationSections([]);
        showToast('Mode hors connexion: livres telecharges charges', 'info');
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

  const featuredBooks = visibleBooks.slice(0, 4);
  const completedBooks = readingStats.completedBookIds?.length || 0;
  const totalMinutes = Math.floor((readingStats.totalTimeSeconds || 0) / 60);

  const handleLogout = () => {
    logout();
    navigate('/parent/login');
  };

  const toggleFavorite = (bookId) => {
    if (storage.isFavorite(bookId)) {
      storage.removeFavorite(bookId);
      showToast('Retire des favoris', 'info');
    } else {
      storage.addFavorite(bookId);
      showToast('Ajoute aux favoris', 'success');
    }
    setBooks((current) => [...current]);
    loadRecommendations();
  };

  const handleDownloadBook = async (book) => {
    try {
      await offlineContent.downloadBookContent(book);
      storage.markDownloaded(book.id);
      showToast('Contenu disponible hors connexion', 'success');
    } catch (error) {
      if (error.name === 'AbortError') {
        showToast('Telechargement annule', 'info');
        return;
      }
      console.error('Book download failed:', error);
      showToast('Telechargement impossible pour le moment', 'error');
    }
  };

  const handleRemoveDownload = async (book) => {
    try {
      await offlineContent.deleteDownload(offlineContentIds.book(book.id));
      storage.unmarkDownloaded(book.id);
      showToast('Contenu hors connexion supprime', 'info');
    } catch (error) {
      console.error('Download removal failed:', error);
      showToast('Suppression impossible pour le moment', 'error');
    }
  };

  const handleCancelDownload = (book) => {
    offlineContent.cancelDownload(offlineContentIds.book(book.id));
  };

  const loadRecommendations = async () => {
    try {
      const response = await recommendationsAPI.getForKid(getRecommendationContext());
      setRecommendationSections(response.data?.sections || []);
    } catch (error) {
      console.warn('Recommendations refresh unavailable:', error);
    }
  };

  const toggleAudio = async (book) => {
    if (!book.audio_url && !selectedVoiceId) {
      showToast('Audio pas encore disponible pour cette histoire', 'info');
      return;
    }

    const wasPlayingCurrent = audioPlayer.activeBook?.id === book.id && audioPlayer.playing;
    await audioPlayer.toggle(book, { voiceId: selectedVoiceId || '' });
    if (!wasPlayingCurrent) {
      storage.addToHistory(book.id, book.title, 0);
      if (selectedVoiceId) {
        const selectedVoice = voiceProfiles.find((voice) => String(voice.id) === String(selectedVoiceId));
        if (selectedVoice) {
          showToast(`Lecture associee a la voix de ${selectedVoice.name}`, 'info', 2000);
        }
      }
    }
  };

  const handleVoiceChange = (voiceId) => {
    setSelectedVoiceId(voiceId);
    if (voiceId) {
      localStorage.setItem('hkids_selected_voice_id', voiceId);
    } else {
      localStorage.removeItem('hkids_selected_voice_id');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-primary-500 selection:text-white">
      {/* HEADER */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 shadow-lg"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Logo size="default" showText={true} className="text-white" />

          <div className="flex items-center gap-2">
            <Link to="/kids" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" title="Accueil">
              <HomeIcon className="h-6 w-6" />
            </Link>
            <Link to="/content-library" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" title="Contenus">
              <BookIcon className="h-6 w-6" />
            </Link>
            <Link to="/favorites" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" title="Favoris">
              <HeartIcon className="h-6 w-6" />
            </Link>
            <Link to="/history" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" title="Historique">
              <HistoryIcon className="h-6 w-6" />
            </Link>
            <button onClick={handleLogout} className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" title="Déconnexion">
              <LogOutIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </motion.header>

      {loading ? (
        <div className="mx-auto max-w-7xl px-4 py-8">
           <BookGridSkeleton />
        </div>
      ) : visibleBooks.length === 0 && !searchQuery ? (
        <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <BookIcon className="h-12 w-12 text-slate-500" />
          </div>
          <h3 className="mb-2 text-3xl font-black text-white">Bibliothèque vide</h3>
          <p className="text-slate-400 text-lg">Demande à ton parent d'autoriser plus de contenus.</p>
        </div>
      ) : (
        <>
          <main className="pb-36">
            
            {/* HERO BANNER (NETFLIX STYLE) */}
            {visibleBooks.length > 0 && selectedTheme === 'all' && !searchQuery && (
              <div className="relative w-full h-[50vh] min-h-[400px] max-h-[600px] mb-12 overflow-hidden flex items-end">
                {/* Background Cover */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={getImageUrl(visibleBooks[0].cover_image)} 
                    alt="Hero Background" 
                    className="w-full h-full object-cover object-top opacity-60"
                  />
                  {/* Gradients to fade into background */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent"></div>
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md text-white rounded-full text-xs font-bold mb-4 uppercase tracking-wider border border-white/10">
                      <SparklesIcon className="h-4 w-4 text-yellow-400" /> Nouveauté
                    </div>
                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white mb-4 leading-tight drop-shadow-2xl">
                      {visibleBooks[0].title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm font-semibold text-slate-300 mb-6">
                      <span className="bg-slate-800 px-2 py-1 rounded text-white">{visibleBooks[0].age_group_min || '3'}+ ans</span>
                      {visibleBooks[0].duration_seconds > 0 && (
                        <span>{formatDuration(visibleBooks[0].duration_seconds)}</span>
                      )}
                      <span className="hidden sm:inline">{visibleBooks[0].category_name}</span>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => toggleAudio(visibleBooks[0])}
                        className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-full font-black text-lg hover:bg-slate-200 transition-all hover:scale-105"
                      >
                        {audioPlayer.activeBook?.id === visibleBooks[0].id && audioPlayer.playing ? (
                          <><PauseIcon className="h-6 w-6" /> Pause</>
                        ) : (
                          <><PlayIcon className="h-6 w-6" /> Écouter</>
                        )}
                      </button>
                      <Link 
                        to={`/book/${visibleBooks[0].id}`}
                        className="flex items-center gap-2 bg-white/20 backdrop-blur-md text-white border border-white/30 px-6 py-3 rounded-full font-bold text-lg hover:bg-white/30 transition-all"
                      >
                        <BookIcon className="h-6 w-6" /> Lire
                      </Link>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              {/* STICKY SEARCH & FILTERS */}
              <div className="sticky top-20 z-40 mb-12 bg-slate-900/90 backdrop-blur-md py-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96 group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-white transition-colors">
                    <SearchIcon className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Chercher une histoire..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-full pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-slate-800 transition-all font-medium"
                  />
                </div>
                <div className="flex overflow-x-auto hide-scrollbar gap-2 w-full sm:w-auto pb-2 sm:pb-0">
                  {languages.map((language) => (
                    <button
                      key={language.id}
                      onClick={() => setSelectedLanguage(language.id)}
                      className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                        selectedLanguage === language.id
                          ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {language.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* EMPTY STATE FOR SEARCH */}
              {visibleBooks.length === 0 && searchQuery && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <SearchIcon className="h-16 w-16 text-slate-600 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Aucun résultat</h3>
                  <p className="text-slate-400">Aucune histoire ne correspond à "{searchQuery}".</p>
                </div>
              )}

              {/* UNIVERS / CATEGORIES (DISNEY+ STYLE CAROUSEL) */}
              {visibleBooks.length > 0 && !searchQuery && (
                <section className="mb-12">
                  <h2 className="text-2xl font-black text-white mb-4 px-2">Univers</h2>
                  <div className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-4 pb-4 px-2 -mx-2">
                    {childThemes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`group relative snap-start shrink-0 w-40 sm:w-48 aspect-[4/3] rounded-[1.5rem] p-4 text-left overflow-hidden transition-all duration-300 ${
                          selectedTheme === theme.id ? 'ring-4 ring-white ring-offset-4 ring-offset-slate-900 scale-100 shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'hover:scale-105 hover:shadow-xl'
                        }`}
                      >
                        {/* Gradient Background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                          <span className="text-4xl filter drop-shadow-md">{theme.pictogram}</span>
                          <div>
                            <span className="inline-block bg-white/20 backdrop-blur text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1">
                              {theme.cue}
                            </span>
                            <span className="block text-white font-black text-lg sm:text-xl drop-shadow-md">
                              {theme.shortLabel || theme.label}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* FEATURED CAROUSEL */}
              {featuredBooks.length > 0 && !searchQuery && selectedTheme === 'all' && (
                <section className="mb-12">
                  <h2 className="text-2xl font-black text-white mb-4 px-2">À écouter maintenant</h2>
                  <div className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-4 pb-6 px-2 -mx-2">
                    {featuredBooks.map((book) => (
                      <div key={book.id} className="snap-start shrink-0 w-[160px] sm:w-[200px] md:w-[240px]">
                        <BookCard
                          book={book}
                          playing={audioPlayer.activeBook?.id === book.id && audioPlayer.playing}
                          onToggleAudio={toggleAudio}
                          onToggleFavorite={toggleFavorite}
                          downloadStatus={offlineContent.getBookStatus(book.id)}
                          downloadProgress={offlineContent.progressById[offlineContentIds.book(book.id)]}
                          onDownload={handleDownloadBook}
                          onRemoveDownload={handleRemoveDownload}
                          onCancelDownload={handleCancelDownload}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* RECOMMENDATIONS CAROUSELS */}
              {!searchQuery && selectedTheme === 'all' && recommendationSections.length > 0 && (
                <div className="space-y-12 mb-12">
                  {recommendationSections.map((section) => (
                    <RecommendationCarousel
                      key={section.id}
                      section={section}
                      playingBookId={audioPlayer.activeBook?.id}
                      playing={audioPlayer.playing}
                      onToggleAudio={toggleAudio}
                      onToggleFavorite={toggleFavorite}
                      offlineContent={offlineContent}
                      onDownload={handleDownloadBook}
                      onRemoveDownload={handleRemoveDownload}
                      onCancelDownload={handleCancelDownload}
                    />
                  ))}
                </div>
              )}

              {/* ALL STORIES GRID */}
              {visibleBooks.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-2xl font-black text-white mb-6 px-2">
                    {searchQuery ? 'Résultats de recherche' : selectedTheme !== 'all' ? 'Dans cet univers' : 'Toutes les histoires'}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 px-2">
                    {visibleBooks.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        playing={audioPlayer.activeBook?.id === book.id && audioPlayer.playing}
                        onToggleAudio={toggleAudio}
                        onToggleFavorite={toggleFavorite}
                        downloadStatus={offlineContent.getBookStatus(book.id)}
                        downloadProgress={offlineContent.progressById[offlineContentIds.book(book.id)]}
                        onDownload={handleDownloadBook}
                        onRemoveDownload={handleRemoveDownload}
                        onCancelDownload={handleCancelDownload}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </main>
        </>
      )}

      {/* AUDIO PLAYER & ASSISTANT */}
      <AudioPlayer
        book={audioPlayer.activeBook}
        playing={audioPlayer.playing}
        loading={audioPlayer.loading}
        currentTime={audioPlayer.currentTime}
        duration={audioPlayer.duration}
        volume={audioPlayer.volume}
        favorite={audioPlayer.activeBook ? storage.isFavorite(audioPlayer.activeBook.id) : false}
        error={audioPlayer.error}
        onTogglePlay={() => {
          if (audioPlayer.playing) {
            audioPlayer.pause();
          } else if (audioPlayer.activeBook) {
            audioPlayer.play(audioPlayer.activeBook, { voiceId: selectedVoiceId || '' });
          }
        }}
        onSeekBy={audioPlayer.seekBy}
        onSeekTo={audioPlayer.seekTo}
        onVolumeChange={audioPlayer.setVolume}
        onToggleFavorite={() => {
          if (audioPlayer.activeBook) {
            toggleFavorite(audioPlayer.activeBook.id);
          }
        }}
        onClose={audioPlayer.stop}
        voiceProfiles={voiceProfiles}
        selectedVoiceId={selectedVoiceId}
        onVoiceChange={handleVoiceChange}
      />
      <VoiceAssistant />

      {/* Add custom CSS for hide-scrollbar if not in index.css */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------
// NEW COMPONENTS
// ---------------------------------------------------------

function RecommendationCarousel({ section, playingBookId, playing, onToggleAudio, onToggleFavorite, offlineContent, onDownload, onRemoveDownload, onCancelDownload }) {
  const books = Array.isArray(section.items) ? section.items : [];
  if (books.length === 0) return null;

  return (
    <section>
      <div className="mb-4 px-2">
        <h2 className="text-2xl font-black text-white">{section.title}</h2>
        {section.subtitle && (
          <p className="text-slate-400 font-medium text-sm mt-1">{section.subtitle}</p>
        )}
      </div>
      <div className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-4 pb-6 px-2 -mx-2">
        {books.map((book) => (
          <div key={`${section.id}-${book.id}`} className="snap-start shrink-0 w-[160px] sm:w-[200px] md:w-[240px]">
            <BookCard
              book={book}
              playing={playingBookId === book.id && playing}
              onToggleAudio={onToggleAudio}
              onToggleFavorite={onToggleFavorite}
              downloadStatus={offlineContent.getBookStatus(book.id)}
              downloadProgress={offlineContent.progressById[offlineContentIds.book(book.id)]}
              onDownload={onDownload}
              onRemoveDownload={onRemoveDownload}
              onCancelDownload={onCancelDownload}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function BookCard({
  book,
  playing,
  onToggleAudio,
  onToggleFavorite,
  downloadStatus,
  downloadProgress,
  onDownload,
  onRemoveDownload,
  onCancelDownload
}) {
  const coverImageUrl = getImageUrl(book.cover_image);
  const favorite = storage.isFavorite(book.id);
  const hasAudio = Boolean(book.audio_url);
  const downloaded = downloadStatus?.status === 'downloaded';
  const downloading = downloadStatus?.status === 'downloading' || Number(downloadProgress) > 0;
  const progress = Math.max(0, Math.min(100, Number(downloadProgress || downloadStatus?.progress || 0)));

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative flex flex-col w-full h-full"
    >
      <div className="relative aspect-[3/4] w-full rounded-[1.5rem] bg-slate-800 shadow-lg overflow-hidden border border-slate-700/50 group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] transition-all duration-300">
        
        {/* Cover Image */}
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
            <BookIcon className="h-12 w-12 text-white/30" />
          </div>
        )}

        {/* Gradient Overlay for Text Visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <div className="px-2 py-1 bg-white/20 backdrop-blur-md rounded text-[10px] font-black text-white shadow-sm border border-white/20">
            {(book.language || 'FR').toUpperCase()}
          </div>
          {downloaded && (
            <div className="px-2 py-1 bg-emerald-500/90 backdrop-blur-md rounded text-[10px] font-black text-white shadow-sm">
              <DownloadIcon className="h-3 w-3 inline" />
            </div>
          )}
        </div>

        {/* Quick Actions (Appear on Hover) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 translate-x-2 group-hover:translate-x-0">
          <button
            onClick={(e) => { e.preventDefault(); onToggleFavorite(book.id); }}
            className={`p-2 rounded-full backdrop-blur-md shadow-lg transition-colors ${
              favorite ? 'bg-rose-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'
            }`}
          >
            <HeartIcon className="h-4 w-4" filled={favorite} />
          </button>
          
          {!downloaded && !downloading && (
             <button
               onClick={(e) => { e.preventDefault(); onDownload(book); }}
               className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 shadow-lg transition-colors"
             >
               <DownloadIcon className="h-4 w-4" />
             </button>
          )}
        </div>

        {/* Center Play Button (Large, appears on hover) */}
        {hasAudio && (
          <button
            onClick={(e) => { e.preventDefault(); onToggleAudio(book); }}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-xl backdrop-blur-md border border-white/30 transition-all duration-300 z-20 ${
              playing 
                ? 'bg-accent-500/90 text-white opacity-100 scale-100' 
                : 'bg-white/20 text-white opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 hover:bg-white/40'
            }`}
          >
            {playing ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6 ml-1" />}
          </button>
        )}

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <h3 className="text-white font-black leading-tight line-clamp-2 text-sm sm:text-base drop-shadow-md">
            {book.title}
          </h3>
          <div className="flex items-center gap-2 mt-2 text-[10px] sm:text-xs font-bold text-slate-300">
            <span>{book.category_name || 'Histoire'}</span>
            {hasAudio && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                <span className="flex items-center gap-1"><AudioIcon className="h-3 w-3" /> Audio</span>
              </>
            )}
          </div>
        </div>

        {/* Downloading Progress Bar */}
        {downloading && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
            <div className="h-full bg-primary-500 transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </div>
      
      {/* Invisible link covering the card for navigation */}
      <Link to={`/book/${book.id}`} className="absolute inset-0 z-0 rounded-[1.5rem]" aria-label={book.title}></Link>
    </motion.div>
  );
}

export default KidsLibrary;
