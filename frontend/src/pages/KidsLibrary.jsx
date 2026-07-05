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
    <div className="min-h-screen bg-[#f7f3ea] text-surface-900">
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 border-b border-white/60 bg-white/90 px-4 py-3 shadow-sm backdrop-blur"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Logo size="default" showText={true} />

          <div className="flex items-center gap-2">
            <Link
              to="/kids"
              className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200"
              title="Accueil"
            >
              <HomeIcon className="h-7 w-7" />
            </Link>
            <Link
              to="/content-library"
              className="grid h-14 w-14 place-items-center rounded-full bg-yellow-100 text-yellow-700 transition hover:bg-yellow-200"
              title="Contenus"
            >
              <BookIcon className="h-7 w-7" />
            </Link>
            <Link
              to="/favorites"
              className="grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-rose-600 transition hover:bg-rose-200"
              title="Favoris"
            >
              <HeartIcon className="h-7 w-7" />
            </Link>
            <Link
              to="/history"
              className="grid h-14 w-14 place-items-center rounded-full bg-sky-100 text-sky-700 transition hover:bg-sky-200"
              title="Historique"
            >
              <HistoryIcon className="h-7 w-7" />
            </Link>
            <button
              onClick={handleLogout}
              className="grid h-14 w-14 place-items-center rounded-full bg-surface-100 text-surface-700 transition hover:bg-surface-200"
              title="Deconnexion"
            >
              <LogOutIcon className="h-7 w-7" />
            </button>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-7xl px-4 py-6 pb-36 sm:px-6 lg:px-8">
        <section className="mb-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[2rem] bg-gradient-to-br from-cyan-500 via-emerald-400 to-yellow-300 p-6 text-white shadow-xl">
            <div className="flex min-h-56 flex-col justify-between gap-6">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur">
                  <SparklesIcon className="h-5 w-5" />
                  Le Lit Qui Lit
                </div>
                <h1 className="max-w-2xl text-5xl font-black leading-tight sm:text-6xl">
                  Touche. Ecoute.
                </h1>
              </div>

              <div className="grid max-w-xl grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/20 p-4 backdrop-blur">
                  <BookIcon className="mb-2 h-7 w-7" />
                  <span className="text-3xl font-black">{books.length}</span>
                </div>
                <div className="rounded-2xl bg-white/20 p-4 backdrop-blur">
                  <SparklesIcon className="mb-2 h-7 w-7" />
                  <span className="text-3xl font-black">{completedBooks}</span>
                </div>
                <div className="rounded-2xl bg-white/20 p-4 backdrop-blur">
                  <AudioIcon className="mb-2 h-7 w-7" />
                  <span className="text-3xl font-black">{totalMinutes}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-600">
                <SearchIcon className="h-6 w-6" />
              </div>
              <p className="text-lg font-black text-surface-900">Adulte</p>
            </div>
            <input
              type="text"
              placeholder="Recherche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4 w-full rounded-2xl border-2 border-surface-200 bg-surface-50 px-4 py-3 text-base font-semibold outline-none transition focus:border-cyan-500 focus:bg-white"
            />
            <div className="grid grid-cols-4 gap-2">
              {languages.map((language) => (
                <button
                  key={language.id}
                  onClick={() => setSelectedLanguage(language.id)}
                  className={`min-h-14 rounded-2xl px-3 py-3 text-sm font-black transition ${
                    selectedLanguage === language.id
                      ? 'bg-surface-900 text-white'
                      : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
                  }`}
                >
                  {language.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-surface-900">Univers</h2>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-surface-600 shadow-sm">
              {visibleBooks.length} contenus
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {childThemes.map((theme) => (
              <motion.button
                key={theme.id}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedTheme(theme.id)}
                aria-label={theme.label}
                className={`min-h-36 rounded-[1.75rem] bg-gradient-to-br ${theme.gradient} p-4 text-left text-white shadow-lg transition ${
                  selectedTheme === theme.id ? 'ring-4 ring-surface-900 ring-offset-4' : 'hover:shadow-xl'
                }`}
              >
                <span className="mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-white/25 text-4xl font-black backdrop-blur">
                  {theme.pictogram}
                </span>
                <span className="mb-1 inline-flex min-h-7 items-center rounded-full bg-white/20 px-2 text-xs font-black">
                  {theme.cue}
                </span>
                <span className="block text-xl font-black leading-tight">{theme.shortLabel || theme.label}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {loading ? (
          <BookGridSkeleton />
        ) : visibleBooks.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-12 text-center shadow-lg">
            <BookIcon className="mx-auto mb-4 h-16 w-16 text-surface-400" />
            <h3 className="mb-2 text-2xl font-black text-surface-800">Aucun contenu disponible</h3>
            <p className="text-surface-500">
              Demande a ton parent d'autoriser plus de contenus.
            </p>
          </div>
        ) : (
          <>
            {featuredBooks.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-black text-surface-900">A ecouter maintenant</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {featuredBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      large
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

            {recommendationSections.length > 0 && (
              <section className="mb-8 space-y-8">
                {recommendationSections.map((section) => (
                  <RecommendationSection
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
              </section>
            )}

            <section>
              <h2 className="mb-4 text-2xl font-black text-surface-900">Toutes les histoires</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
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
          </>
        )}
      </main>

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
    </div>
  );
}

function RecommendationSection({ section, playingBookId, playing, onToggleAudio, onToggleFavorite, offlineContent, onDownload, onRemoveDownload, onCancelDownload }) {
  const books = Array.isArray(section.items) ? section.items : [];
  if (books.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-surface-900">{section.title}</h2>
          {section.subtitle && (
            <p className="mt-1 text-sm font-bold text-surface-500">{section.subtitle}</p>
          )}
        </div>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-surface-600 shadow-sm">
          {books.length} choix
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {books.map((book) => (
          <BookCard
            key={`${section.id}-${book.id}`}
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
        ))}
      </div>
    </section>
  );
}

function BookCard({
  book,
  large = false,
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
  const duration = formatDuration(book.duration_seconds);
  const hasAudio = Boolean(book.audio_url);
  const downloaded = downloadStatus?.status === 'downloaded';
  const downloading = downloadStatus?.status === 'downloading' || Number(downloadProgress) > 0;
  const progress = Math.max(0, Math.min(100, Number(downloadProgress || downloadStatus?.progress || 0)));

  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-[1.5rem] bg-white shadow-lg transition hover:shadow-xl"
    >
      <Link to={`/book/${book.id}`} className="block">
        <div className={`relative bg-surface-100 ${large ? 'aspect-[4/3]' : 'aspect-[3/4]'}`}>
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={book.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-cyan-100 to-emerald-100">
              <BookIcon className="h-16 w-16 text-cyan-700" />
            </div>
          )}
          <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-surface-800 shadow-sm">
            {(book.language || 'fr').toUpperCase()}
          </div>
          <div className={`absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black backdrop-blur ${
            hasAudio ? 'bg-surface-900/80 text-white' : 'bg-white/90 text-accent-700'
          }`}>
            <AudioIcon className="h-4 w-4" />
            {hasAudio ? (duration || 'Audio') : 'Sans audio'}
          </div>
          {hasAudio && (
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-3 right-3 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-lg"
              aria-hidden="true"
            >
              <PlayIcon className="h-6 w-6" />
            </motion.div>
          )}
          {downloaded && (
            <div className="absolute right-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-white shadow-sm">
              Telecharge
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <h3 className={`${large ? 'text-lg' : 'text-sm'} mb-1 line-clamp-2 font-black text-surface-900`}>
          {book.title}
        </h3>
        <p className="mb-3 line-clamp-1 text-xs font-semibold text-surface-500">
          {book.category_name || book.content_type || 'Histoire'}
        </p>

        <button
          onClick={() => onToggleAudio(book)}
          className={`mb-2 inline-flex h-16 w-full items-center justify-center gap-3 rounded-[1.4rem] text-lg font-black transition ${
            hasAudio
              ? playing
                ? 'bg-accent-500 text-white hover:bg-accent-600'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-surface-100 text-surface-400'
          }`}
          title={hasAudio ? 'Ecouter' : 'Audio indisponible'}
          aria-label={hasAudio ? `Ecouter ${book.title}` : 'Audio indisponible'}
        >
          {playing ? <PauseIcon className="h-8 w-8" /> : <PlayIcon className="h-8 w-8" />}
          <span>{hasAudio ? 'Ecouter' : 'Audio'}</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <Link
            to={`/book/${book.id}`}
            className="grid h-12 place-items-center rounded-2xl bg-cyan-100 px-3 text-cyan-800 transition hover:bg-cyan-200"
            aria-label={`Ouvrir ${book.title}`}
            title="Lire"
          >
            <BookIcon className="h-6 w-6" />
          </Link>

          <button
            onClick={() => onToggleFavorite(book.id)}
            className={`grid h-12 place-items-center rounded-2xl transition ${
              favorite
                ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
            aria-label="Favori"
            title="Favori"
          >
            <HeartIcon className="h-6 w-6" filled={favorite} />
          </button>
        </div>

        {downloading ? (
          <div className="mt-2 rounded-2xl bg-primary-50 p-2">
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-primary-100">
              <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${progress || 8}%` }} />
            </div>
            <button
              onClick={() => onCancelDownload(book)}
              className="inline-flex h-11 w-full items-center justify-center rounded-3xl bg-white text-xs font-black text-primary-700"
            >
              Annuler
            </button>
          </div>
        ) : downloaded ? (
          <button
            onClick={() => onRemoveDownload(book)}
            className="mt-2 grid h-12 w-full place-items-center rounded-2xl bg-emerald-100 px-3 text-emerald-700 transition hover:bg-emerald-200"
            aria-label="Retirer le telechargement"
            title="Telecharge"
          >
            <DownloadIcon className="h-6 w-6" />
          </button>
        ) : (
          <button
            onClick={() => onDownload(book)}
            className="mt-2 grid h-12 w-full place-items-center rounded-2xl bg-surface-100 px-3 text-surface-700 transition hover:bg-surface-200"
            aria-label="Telecharger"
            title="Telecharger"
          >
            <DownloadIcon className="h-6 w-6" />
          </button>
        )}
      </div>
    </motion.article>
  );
}

export default KidsLibrary;
