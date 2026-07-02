import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { booksAPI } from '../api/books';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { getImageUrl } from '../utils/imageUrl';
import { getFileUrl } from '../utils/fileUrl';
import { storage } from '../utils/storage';
import { LANGUAGE_FILTERS } from '../constants/contentOptions';
import {
  AudioIcon,
  BookIcon,
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
    gradient: 'from-amber-400 to-orange-500',
    match: ['animal', 'animaux', 'nature'],
  },
  {
    id: 'princesses',
    label: 'Princesses',
    pictogram: 'P',
    gradient: 'from-pink-500 to-rose-500',
    match: ['princess', 'princesse', 'fairy', 'conte'],
  },
  {
    id: 'jobs',
    label: 'Metiers',
    pictogram: 'M',
    gradient: 'from-blue-500 to-teal-500',
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

  const matchedTheme = themes.find((theme) =>
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

function KidsLibrary() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const audioRef = useRef(null);
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [loading, setLoading] = useState(true);
  const [playingBookId, setPlayingBookId] = useState(null);
  const [readingStats, setReadingStats] = useState(() => storage.getReadingStats());

  useEffect(() => {
    if (!user || user.role !== 'kid') {
      navigate('/parent/login');
      return;
    }

    loadData();
    setReadingStats(storage.getReadingStats());

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const booksRes = await booksAPI.getPublishedBooks();
      setBooks(booksRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Erreur lors du chargement des livres', 'error');
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
  };

  const toggleAudio = (book) => {
    if (!book.audio_url) {
      showToast('Audio pas encore disponible pour cette histoire', 'info');
      return;
    }

    if (playingBookId === book.id && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingBookId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const nextAudio = new Audio(getFileUrl(book.audio_url));
    audioRef.current = nextAudio;
    setPlayingBookId(book.id);
    nextAudio.onended = () => setPlayingBookId(null);
    nextAudio.onerror = () => {
      setPlayingBookId(null);
      showToast("Impossible de lire l'audio", 'error');
    };
    nextAudio.play().catch(() => {
      setPlayingBookId(null);
      showToast("Le navigateur a bloque la lecture audio", 'error');
    });
  };

  return (
    <div className="min-h-screen bg-[#f7f3ea] text-neutral-900">
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
              className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200"
              title="Accueil"
            >
              <HomeIcon className="h-6 w-6" />
            </Link>
            <Link
              to="/content-library"
              className="grid h-12 w-12 place-items-center rounded-full bg-yellow-100 text-yellow-700 transition hover:bg-yellow-200"
              title="Contenus"
            >
              <BookIcon className="h-6 w-6" />
            </Link>
            <Link
              to="/favorites"
              className="grid h-12 w-12 place-items-center rounded-full bg-rose-100 text-rose-600 transition hover:bg-rose-200"
              title="Favoris"
            >
              <HeartIcon className="h-6 w-6" />
            </Link>
            <Link
              to="/history"
              className="grid h-12 w-12 place-items-center rounded-full bg-sky-100 text-sky-700 transition hover:bg-sky-200"
              title="Historique"
            >
              <HistoryIcon className="h-6 w-6" />
            </Link>
            <button
              onClick={handleLogout}
              className="grid h-12 w-12 place-items-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200"
              title="Deconnexion"
            >
              <LogOutIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[2rem] bg-gradient-to-br from-cyan-500 via-emerald-400 to-yellow-300 p-6 text-white shadow-xl">
            <div className="flex min-h-56 flex-col justify-between gap-6">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur">
                  <SparklesIcon className="h-5 w-5" />
                  Le Lit Qui Lit
                </div>
                <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
                  Choisis une image, ecoute une histoire.
                </h1>
              </div>

              <div className="grid max-w-xl grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/20 p-4 backdrop-blur">
                  <span className="block text-sm font-bold text-white/80">Livres</span>
                  <span className="text-3xl font-black">{books.length}</span>
                </div>
                <div className="rounded-2xl bg-white/20 p-4 backdrop-blur">
                  <span className="block text-sm font-bold text-white/80">Termines</span>
                  <span className="text-3xl font-black">{completedBooks}</span>
                </div>
                <div className="rounded-2xl bg-white/20 p-4 backdrop-blur">
                  <span className="block text-sm font-bold text-white/80">Minutes</span>
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
              <div>
                <p className="text-sm font-bold uppercase text-neutral-500">Recherche parentale</p>
                <p className="text-sm text-neutral-600">Utile si un adulte accompagne.</p>
              </div>
            </div>
            <input
              type="text"
              placeholder="Titre, theme, auteur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4 w-full rounded-2xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-base font-semibold outline-none transition focus:border-cyan-500 focus:bg-white"
            />
            <div className="grid grid-cols-4 gap-2">
              {languages.map((language) => (
                <button
                  key={language.id}
                  onClick={() => setSelectedLanguage(language.id)}
                  className={`rounded-2xl px-3 py-3 text-sm font-black transition ${
                    selectedLanguage === language.id
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
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
            <h2 className="text-2xl font-black text-neutral-900">Univers</h2>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-neutral-600 shadow-sm">
              {visibleBooks.length} contenus
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {themes.map((theme) => (
              <motion.button
                key={theme.id}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedTheme(theme.id)}
                className={`min-h-32 rounded-[1.75rem] bg-gradient-to-br ${theme.gradient} p-4 text-left text-white shadow-lg transition ${
                  selectedTheme === theme.id ? 'ring-4 ring-neutral-900 ring-offset-4' : 'hover:shadow-xl'
                }`}
              >
                <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white/25 text-3xl font-black backdrop-blur">
                  {theme.pictogram}
                </span>
                <span className="block text-lg font-black leading-tight">{theme.label}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {loading ? (
          <BookGridSkeleton />
        ) : visibleBooks.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-12 text-center shadow-lg">
            <BookIcon className="mx-auto mb-4 h-16 w-16 text-neutral-400" />
            <h3 className="mb-2 text-2xl font-black text-neutral-800">Aucun contenu disponible</h3>
            <p className="text-neutral-500">
              Demande a ton parent d'autoriser plus de contenus.
            </p>
          </div>
        ) : (
          <>
            {featuredBooks.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-black text-neutral-900">A ecouter maintenant</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {featuredBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      large
                      playing={playingBookId === book.id}
                      onToggleAudio={toggleAudio}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-4 text-2xl font-black text-neutral-900">Toutes les histoires</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                {visibleBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    playing={playingBookId === book.id}
                    onToggleAudio={toggleAudio}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function BookCard({ book, large = false, playing, onToggleAudio, onToggleFavorite }) {
  const coverImageUrl = getImageUrl(book.cover_image);
  const favorite = storage.isFavorite(book.id);
  const duration = formatDuration(book.duration_seconds);
  const hasAudio = Boolean(book.audio_url);

  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-[1.5rem] bg-white shadow-lg transition hover:shadow-xl"
    >
      <Link to={`/book/${book.id}`} className="block">
        <div className={`relative bg-neutral-100 ${large ? 'aspect-[4/3]' : 'aspect-[3/4]'}`}>
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
          <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-neutral-800 shadow-sm">
            {(book.language || 'fr').toUpperCase()}
          </div>
          <div className={`absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black backdrop-blur ${
            hasAudio ? 'bg-neutral-900/80 text-white' : 'bg-white/90 text-amber-700'
          }`}>
            <AudioIcon className="h-4 w-4" />
            {hasAudio ? (duration || 'Audio') : 'Sans audio'}
          </div>
          {hasAudio && (
            <div className="absolute bottom-3 right-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white shadow-lg">
              <AudioIcon className="h-4 w-4" />
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <h3 className={`${large ? 'text-lg' : 'text-sm'} mb-1 line-clamp-2 font-black text-neutral-900`}>
          {book.title}
        </h3>
        <p className="mb-3 line-clamp-1 text-xs font-semibold text-neutral-500">
          {book.category_name || book.content_type || 'Histoire'}
        </p>

        <button
          onClick={() => onToggleAudio(book)}
          className={`mb-2 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-black transition ${
            hasAudio
              ? playing
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-neutral-100 text-neutral-400'
          }`}
          title={hasAudio ? 'Ecouter' : 'Audio indisponible'}
        >
          {playing ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
          {hasAudio ? 'Ecouter' : 'Audio manquant'}
        </button>

        <Link
          to={`/book/${book.id}`}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-100 px-3 text-sm font-black text-cyan-800 transition hover:bg-cyan-200"
        >
          <BookIcon className="h-5 w-5" />
          Lire
        </Link>

        <button
          onClick={() => onToggleFavorite(book.id)}
          className={`mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black transition ${
            favorite
              ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <HeartIcon className="h-5 w-5" filled={favorite} />
          Favori
        </button>
      </div>
    </motion.article>
  );
}

export default KidsLibrary;
