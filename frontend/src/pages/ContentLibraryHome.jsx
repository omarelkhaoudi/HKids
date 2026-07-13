import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { booksAPI } from '../api/books';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { Logo } from '../components/Logo';
import { CONTENT_LIBRARY_CATEGORIES } from '../constants/contentLibrary';
import { filterContentItems, normalizeContentItem } from '../utils/contentLibrary';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useLanguage } from '../context/LanguageContext';
import { storage } from '../utils/storage';
import { getImageUrl } from '../utils/imageUrl';
import {
  AudioIcon, BookIcon, DownloadIcon, HeartIcon, PlayIcon, PauseIcon,
  SearchIcon, SparklesIcon, ChevronLeftIcon, ChevronRightIcon,
  ClockIcon, ShieldIcon, HomeIcon, StarIcon, LightBulbIcon, PaletteIcon
} from '../components/Icons';
import { PlatformShell } from '../components/layout/PlatformShell';
import { BRAND_HERO_GRADIENT, hubGradientAtIndex, storyGradientAtIndex } from '../constants/brandTheme';

const defaultFilters = {
  search: '',
  category: '',
  age: '',
  language: '',
};

function formatDuration(seconds = 0) {
  const safeSeconds = Math.max(0, Number(seconds || 0));
  if (!safeSeconds) return null;
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

// --- PREMIUM COMPONENTS ---
const CinematicCard = ({ content, isFavorite, playing, onToggleAudio, onToggleFavorite }) => {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative h-72 w-52 md:h-80 md:w-56 shrink-0 cursor-pointer overflow-hidden rounded-3xl bg-surface-secondary shadow-sm transition-shadow hover:shadow-2xl"
      onClick={() => onToggleAudio(content)}
    >
      <img
        src={getImageUrl(content.cover_image || content.image_url, 'book')}
        alt={content.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 pointer-events-none" />
      <div className="absolute inset-0 bg-primary-900/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

      {/* Top Badges */}
      <div className="absolute left-3 top-3 right-3 flex flex-wrap gap-2">
        {content.is_premium && (
          <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-accent-400 to-accent-600 px-2 py-0.5 text-[10px] font-black text-white shadow-md">
            <SparklesIcon className="h-3 w-3" /> PRO
          </span>
        )}
        {content.language && (
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md border border-white/30 uppercase">
            {content.language}
          </span>
        )}
      </div>

      {/* Favorite Icon */}
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        {isFavorite && (
          <div className="rounded-full bg-rose-500 p-1.5 text-white shadow-md">
            <HeartIcon className="h-4 w-4" filled />
          </div>
        )}
      </div>

      {/* Hover Action Buttons */}
      <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 transition-all duration-300 group-hover:opacity-100 bg-black/20 backdrop-blur-[2px]">
        <motion.button 
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onToggleAudio(content); }}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-glow ${playing ? 'bg-primary-500 text-white' : 'bg-white text-primary-600'}`}
        >
          {playing ? <PauseIcon className="h-6 w-6" filled /> : <PlayIcon className="h-6 w-6 ml-1" filled />}
        </motion.button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 transition-transform duration-300 group-hover:translate-y-[-10px]">
        <h3 className="line-clamp-2 text-base font-black leading-tight text-white drop-shadow-md">
          {content.title}
        </h3>
        <div className="mt-2 flex items-center gap-3 text-xs font-bold text-white/80">
          {content.duration_seconds > 0 && (
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" />
              {formatDuration(content.duration_seconds)}
            </span>
          )}
          {content.age_level && (
            <span className="flex items-center gap-1">
              <ShieldIcon className="h-3.5 w-3.5" />
              {content.age_level}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const SectionCarousel = ({ title, icon: Icon, contents, audioPlayer, onToggleAudio }) => {
  const carouselRef = useRef(null);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!contents || contents.length === 0) return null;

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
        {contents.map((content) => {
          const isFavorite = storage.isFavorite(content.id);
          const playing = audioPlayer.activeBook?.id === content.id && audioPlayer.playing;
          return (
            <div key={content.id} className="snap-start shrink-0">
              <CinematicCard 
                content={content} 
                isFavorite={isFavorite} 
                playing={playing}
                onToggleAudio={onToggleAudio}
                onToggleFavorite={() => {}}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

function ContentLibraryHome() {
  const { language, isRtl } = useLanguage();
  const [contents, setContents] = useState([]);
  const [filters, setFilters] = useState(() => ({ ...defaultFilters, language }));
  const [loading, setLoading] = useState(true);
  const audioPlayer = useAudioPlayer();

  useEffect(() => {
    loadContents();
    setFilters((current) => ({ ...current, language }));
  }, [language]);

  const loadContents = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getPublishedBooks({ language });
      setContents((response.data || []).map(normalizeContentItem));
    } catch (error) {
      console.error('Error loading content library:', error);
      setContents([]);
    } finally {
      setLoading(false);
    }
  };

  const categoryCounts = useMemo(() => {
    return CONTENT_LIBRARY_CATEGORIES.reduce((acc, category) => {
      acc[category.id] = contents.filter((content) =>
        category.contentTypes.includes(content.content_type || 'story')
      ).length;
      return acc;
    }, {});
  }, [contents]);

  const selectedCategory = CONTENT_LIBRARY_CATEGORIES.find((category) => category.id === filters.category) || null;
  
  const visibleContents = useMemo(
    () => filterContentItems(contents, filters, selectedCategory),
    [contents, filters, selectedCategory]
  );

  const toggleAudio = (content) => {
    if (!content.audio_url) return;
    audioPlayer.toggle(content);
    storage.addToHistory(content.id, content.title, 0);
  };

  const handleSurpriseMe = () => {
    if (contents.length > 0) {
      const randomContent = contents[Math.floor(Math.random() * contents.length)];
      if (randomContent.audio_url) {
        toggleAudio(randomContent);
      }
    }
  };

  // Sections data
  const favoritesIds = storage.getFavorites();
  const favoriteBooks = contents.filter(b => favoritesIds.includes(b.id));
  const newBooks = [...contents].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 15);
  const recommendedBooks = contents.slice(0, 10);
  const featuredBook = recommendedBooks.length > 0 ? recommendedBooks[0] : contents[0];

  const totalMinutes = Math.floor((storage.getReadingStats().totalTimeSeconds || 0) / 60);

  const isFiltering = filters.search || filters.category || filters.age || filters.language;

  return (
    <PlatformShell variant="library" className="pb-36">
      <div className="relative z-10 mx-auto max-w-7xl px-0 md:px-6 lg:px-8 pt-4">
        
        {/* HEADER */}
        <header className="mb-6 flex items-center justify-between px-4 md:px-0 gap-4">
          <Link to="/" className="shrink-0">
            <Logo size="default" showText={true} />
          </Link>
          <Link
            to="/kids"
            className="inline-flex items-center gap-2 rounded-2xl bg-card/80 backdrop-blur-md px-5 py-3 text-sm font-black text-foreground shadow-sm hover:shadow-md transition border border-border"
          >
            <HomeIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Espace enfant</span>
          </Link>
        </header>

        {/* PREMIUM HERO SECTION */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`relative mb-12 overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${BRAND_HERO_GRADIENT} p-8 md:p-14 text-white shadow-2xl mx-4 md:mx-0`}
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-30 mix-blend-overlay"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 text-sm font-black mb-6 shadow-glass">
                <SparklesIcon className="h-5 w-5 text-accent-200" />
                <span>Bibliothèque Magique</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4 filter drop-shadow-lg">
                Des centaines d'histoires et comptines !
              </h1>
              <p className="text-lg md:text-xl font-bold text-white/90 filter drop-shadow-md max-w-lg">
                Pour apprendre en s'amusant et découvrir des univers fabuleux.
              </p>
            </div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="shrink-0">
              <button
                onClick={handleSurpriseMe}
                className="inline-flex w-full md:w-auto items-center justify-center gap-3 rounded-3xl bg-white px-8 py-5 text-xl font-black text-primary-700 shadow-xl hover:shadow-2xl transition"
              >
                <SparklesIcon className="h-6 w-6" />
                <span>Surprise-moi !</span>
              </button>
            </motion.div>
          </div>
        </motion.section>

        {/* CATEGORY CARDS */}
        <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-0">
          {CONTENT_LIBRARY_CATEGORIES.map((category) => {
            const count = categoryCounts[category.id] || 0;
            return (
              <motion.button
                key={category.id}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => setFilters(prev => ({ ...prev, category: category.id }))}
                className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${category.color || 'from-primary-500 to-primary-600'} p-8 text-left text-white shadow-lg transition-all hover:shadow-2xl flex items-center justify-between group`}
              >
                <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-colors" />
                <div>
                  <h3 className="text-2xl font-black mb-1 flex items-center gap-3">
                    {category.id === 'stories' && <BookIcon className="w-8 h-8" />}
                    {category.id === 'education' && <LightBulbIcon className="w-8 h-8" />}
                    {category.id === 'entertainment' && <PaletteIcon className="w-8 h-8" />}
                    {category.title}
                  </h3>
                  <p className="text-white/80 font-bold">{category.description}</p>
                </div>
                <div className="rounded-full bg-white/20 px-4 py-2 font-black shadow-inner backdrop-blur-sm border border-white/30">
                  {count}
                </div>
              </motion.button>
            );
          })}
        </section>

        {/* QUICK STATS */}
        <section className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-4 px-4 md:px-0">
          <motion.div whileHover={{ y: -5 }} className={`bg-gradient-to-br ${hubGradientAtIndex(0)} rounded-3xl p-6 text-white shadow-floating relative overflow-hidden`}>
            <BookIcon className="w-12 h-12 text-white/30 absolute right-4 bottom-4" />
            <p className="text-sm font-bold text-white/80 uppercase tracking-wider mb-1">Total contenus</p>
            <p className="text-4xl font-black">{contents.length}</p>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className={`bg-gradient-to-br ${hubGradientAtIndex(1)} rounded-3xl p-6 text-white shadow-floating relative overflow-hidden`}>
            <HeartIcon className="w-12 h-12 text-white/30 absolute right-4 bottom-4" filled />
            <p className="text-sm font-bold text-white/80 uppercase tracking-wider mb-1">Favoris</p>
            <p className="text-4xl font-black">{favoriteBooks.length}</p>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className={`bg-gradient-to-br ${hubGradientAtIndex(2)} rounded-3xl p-6 text-white shadow-floating relative overflow-hidden`}>
            <StarIcon className="w-12 h-12 text-white/30 absolute right-4 bottom-4" />
            <p className="text-sm font-bold text-white/80 uppercase tracking-wider mb-1">Nouveautés</p>
            <p className="text-4xl font-black">{newBooks.length}</p>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className={`bg-gradient-to-br ${storyGradientAtIndex(3)} rounded-3xl p-6 text-white shadow-floating relative overflow-hidden`}>
            <ClockIcon className="w-12 h-12 text-white/30 absolute right-4 bottom-4" />
            <p className="text-sm font-bold text-white/80 uppercase tracking-wider mb-1">Minutes écoutées</p>
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
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="h-16 w-full rounded-[2rem] bg-surface-secondary/80 border border-border pl-14 pr-4 text-lg font-bold outline-none transition focus:border-primary-400 focus:bg-card focus:ring-4 focus:ring-primary-500/10 placeholder:text-foreground-muted"
                  placeholder="Chercher une histoire..."
                />
              </label>
              <div className="flex w-full md:w-auto gap-4">
                <select
                  value={filters.age}
                  onChange={(e) => setFilters(prev => ({ ...prev, age: e.target.value }))}
                  className="h-16 flex-1 md:w-40 rounded-[2rem] bg-surface-secondary/80 border border-border px-5 font-bold outline-none transition focus:border-primary-400 appearance-none cursor-pointer"
                >
                  <option value="">Tous les âges</option>
                  <option value="0-3">0-3 ans</option>
                  <option value="4-6">4-6 ans</option>
                  <option value="7+">7+ ans</option>
                </select>
                <select
                  value={filters.language}
                  onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
                  className="h-16 flex-1 md:w-40 rounded-[2rem] bg-surface-secondary/80 border border-border px-5 font-bold outline-none transition focus:border-primary-400 appearance-none cursor-pointer"
                >
                  <option value="">Toutes langues</option>
                  <option value="fr">Français</option>
                  <option value="en">Anglais</option>
                  <option value="es">Espagnol</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED SELECTION (SÉLECTION DU JOUR) */}
        {featuredBook && !isFiltering && (
          <section className="mb-12 px-4 md:px-0">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <SparklesIcon className="w-7 h-7 text-primary-500" />
              Sélection du jour
            </h2>
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="group relative overflow-hidden rounded-[2.5rem] bg-surface-secondary shadow-lg cursor-pointer flex flex-col md:flex-row min-h-[300px]"
              onClick={() => toggleAudio(featuredBook)}
            >
              <div className="w-full md:w-1/2 relative h-64 md:h-auto">
                <img 
                  src={getImageUrl(featuredBook.cover_image || featuredBook.image_url, 'book')} 
                  alt={featuredBook.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface-secondary/90 md:bg-gradient-to-l" />
              </div>
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-card md:bg-transparent relative z-10">
                <div className="flex gap-2 mb-4">
                  {featuredBook.category_name && <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-black text-primary-700 uppercase">{featuredBook.category_name}</span>}
                  {featuredBook.language && <span className="rounded-full bg-secondary-50 px-3 py-1 text-xs font-black text-secondary-700 uppercase">{featuredBook.language}</span>}
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-foreground mb-4 leading-tight">{featuredBook.title}</h3>
                <p className="text-foreground-muted font-bold line-clamp-3 mb-8 text-lg">{featuredBook.description}</p>
                <div className="flex items-center gap-4 mt-auto">
                  <button className="flex items-center gap-2 rounded-full bg-primary-500 px-8 py-4 text-white font-black hover:bg-primary-600 transition shadow-lg hover:shadow-xl">
                    <PlayIcon className="w-6 h-6" filled />
                    Écouter
                  </button>
                </div>
              </div>
            </motion.div>
          </section>
        )}

        {loading ? (
          <div className="px-4 md:px-0">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array.from({length: 10}).map((_, index) => (
                <div key={index} className="h-72 w-52 md:h-80 md:w-56 animate-pulse rounded-3xl bg-card shadow-sm" />
              ))}
            </div>
          </div>
        ) : isFiltering ? (
          /* FULL GRID FOR SEARCH RESULTS */
          <section className="mb-12 px-4 md:px-0">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-foreground">Résultats</h2>
              <span className="rounded-full bg-card px-4 py-2 text-sm font-bold text-foreground-secondary shadow-sm">
                {visibleContents.length}
              </span>
            </div>
            {visibleContents.length === 0 ? (
              <div className="rounded-[2.5rem] bg-card border border-border p-12 text-center shadow-sm">
                <div className="text-8xl mb-6">🦉</div>
                <h3 className="text-2xl font-black mb-2">Aucun contenu trouvé.</h3>
                <p className="text-foreground-muted font-bold mb-8">Essaie de changer tes filtres de recherche.</p>
                <button
                  onClick={() => setFilters(defaultFilters)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-8 py-4 text-lg font-black text-white shadow-lg hover:bg-primary-600 transition"
                >
                  <SparklesIcon className="h-6 w-6" />
                  Effacer les filtres
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                <AnimatePresence>
                  {visibleContents.map(content => (
                    <CinematicCard 
                      key={content.id} 
                      content={content} 
                      isFavorite={storage.isFavorite(content.id)} 
                      playing={audioPlayer.activeBook?.id === content.id && audioPlayer.playing}
                      onToggleAudio={toggleAudio}
                      onToggleFavorite={() => {}}
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
              contents={recommendedBooks} 
              audioPlayer={audioPlayer}
              onToggleAudio={toggleAudio}
            />
            
            <SectionCarousel 
              title="Nouveautés" 
              icon={BookIcon} 
              contents={newBooks} 
              audioPlayer={audioPlayer}
              onToggleAudio={toggleAudio}
            />
            
            {favoriteBooks.length > 0 && (
              <SectionCarousel 
                title="Mes Favoris" 
                icon={HeartIcon} 
                contents={favoriteBooks} 
                audioPlayer={audioPlayer}
                onToggleAudio={toggleAudio}
              />
            )}
          </div>
        )}

      </div>
      
      {/* Audio Player */}
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
            audioPlayer.play(audioPlayer.activeBook);
          }
        }}
        onSeekBy={audioPlayer.seekBy}
        onSeekTo={audioPlayer.seekTo}
        onVolumeChange={audioPlayer.setVolume}
        onToggleFavorite={() => {
          if (!audioPlayer.activeBook) return;
          if (storage.isFavorite(audioPlayer.activeBook.id)) {
            storage.removeFavorite(audioPlayer.activeBook.id);
          } else {
            storage.addFavorite(audioPlayer.activeBook.id);
          }
          setContents((current) => [...current]);
        }}
        onClose={audioPlayer.stop}
      />
    </PlatformShell>
  );
}

export default ContentLibraryHome;
