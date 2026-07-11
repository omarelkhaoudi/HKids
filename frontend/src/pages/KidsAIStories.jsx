import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { generatedStoriesAPI } from '../api/generatedStories';
import { speakText, stopSpeaking } from '../services/ai/browserTextToSpeech';
import { useOfflineContent } from '../hooks/useOfflineContent';
import { getDownloads, offlineContentIds } from '../services/offline/offlineContentService';
import { queueOfflineMutation } from '../services/offline/offlineSyncService';
import { 
  AudioIcon, BookIcon, ChevronLeftIcon, ClockIcon, DownloadIcon, 
  HeartIcon, HistoryIcon, RefreshIcon, SearchIcon, SparklesIcon, TrashIcon 
} from '../components/Icons';
import { Logo } from '../components/Logo';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { useLanguage } from '../context/LanguageContext';

// --- MAGIC CELEBRATION PARTICLES ---
function MagicCelebration({ active, onComplete }) {
  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  if (!active) return null;

  const particles = Array.from({ length: 30 });
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden">
      {particles.map((_, i) => {
        const angle = (i * 360) / particles.length;
        const distance = 100 + Math.random() * 200;
        const x = Math.cos((angle * Math.PI) / 180) * distance;
        const y = Math.sin((angle * Math.PI) / 180) * distance;
        const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 10 + Math.random() * 20;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
            animate={{ 
              opacity: 0, 
              scale: Math.random() * 1.5 + 0.5, 
              x: x, 
              y: y,
              rotate: Math.random() * 360 
            }}
            transition={{ duration: 1.5 + Math.random(), ease: "easeOut" }}
            className="absolute"
            style={{ color }}
          >
            {i % 3 === 0 ? '✨' : i % 2 === 0 ? '⭐' : '🎊'}
          </motion.div>
        );
      })}
    </div>
  );
}

// --- DYNAMIC COVER GENERATOR ---
function getThemeAssets(theme) {
  const t = (theme || '').toLowerCase();
  if (t.includes('espace') || t.includes('space') || t.includes('etoile')) {
    return { gradient: 'from-indigo-900 via-purple-900 to-slate-900', emoji: '🚀', icon: '⭐' };
  }
  if (t.includes('foret') || t.includes('nature') || t.includes('animaux')) {
    return { gradient: 'from-emerald-600 via-teal-700 to-green-900', emoji: '🦊', icon: '🍃' };
  }
  if (t.includes('magie') || t.includes('sorcier') || t.includes('fee')) {
    return { gradient: 'from-fuchsia-600 via-purple-600 to-pink-700', emoji: '🪄', icon: '✨' };
  }
  if (t.includes('ocean') || t.includes('mer') || t.includes('poisson')) {
    return { gradient: 'from-cyan-500 via-blue-600 to-indigo-800', emoji: '🐋', icon: '🌊' };
  }
  if (t.includes('chevalier') || t.includes('chateau') || t.includes('dragon')) {
    return { gradient: 'from-amber-600 via-orange-700 to-red-900', emoji: '🐉', icon: '🛡️' };
  }
  if (t.includes('reve') || t.includes('nuit') || t.includes('sommeil')) {
    return { gradient: 'from-blue-900 via-indigo-900 to-purple-900', emoji: '🌙', icon: '☁️' };
  }
  // Default magical gradient
  return { gradient: 'from-violet-500 via-fuchsia-500 to-cyan-500', emoji: '📚', icon: '✨' };
}

function DynamicCover({ story, className = "" }) {
  const assets = getThemeAssets(story.theme);
  
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${assets.gradient} ${className} flex flex-col items-center justify-center p-6 text-center shadow-inner`}>
      {/* Decorative background elements */}
      <div className="absolute top-2 left-2 text-white/20 text-2xl">{assets.icon}</div>
      <div className="absolute bottom-2 right-2 text-white/20 text-3xl">{assets.icon}</div>
      <div className="absolute top-1/2 left-1/4 text-white/10 text-4xl -translate-y-1/2">{assets.icon}</div>
      
      {/* Main Emoji Illustration */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-6xl md:text-7xl mb-4 filter drop-shadow-lg"
      >
        {assets.emoji}
      </motion.div>
      
      {/* Title */}
      <h3 className="text-white font-black text-xl md:text-2xl leading-tight filter drop-shadow-md line-clamp-3">
        {story.title}
      </h3>
      
      {/* Soft gradient overlay for premium feel */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
    </div>
  );
}

const filtersInitialState = {
  search: '',
  theme: '',
  language: '',
  age_level: '',
  educational_value: '',
  saved: '',
  favorite: ''
};

function getErrorMessage(error) {
  return error.response?.data?.error || error.message || 'Action impossible pour le moment.';
}

function speechLanguage(language) {
  if (language === 'en') return 'en-US';
  if (language === 'ar') return 'ar-MA';
  return 'fr-FR';
}

function KidsAIStories() {
  const { language, isRtl } = useLanguage();
  const [kidProfiles, setKidProfiles] = useState([]);
  const [selectedKidProfileId, setSelectedKidProfileId] = useState('');
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [filters, setFilters] = useState(() => ({ ...filtersInitialState, language }));
  const [activeCollection, setActiveCollection] = useState('library');
  const [loading, setLoading] = useState(true);
  const [busyStoryId, setBusyStoryId] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');
  const offlineContent = useOfflineContent();

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);

  const selectedKid = kidProfiles.find((kid) => String(kid.id) === String(selectedKidProfileId));
  const themes = useMemo(() => Array.from(new Set(stories.map((s) => s.theme).filter(Boolean))).sort(), [stories]);
  const languages = useMemo(() => Array.from(new Set(stories.map((s) => s.language).filter(Boolean))).sort(), [stories]);
  const ageLevels = useMemo(() => Array.from(new Set(stories.map((s) => s.age_level).filter(Boolean))).sort(), [stories]);
  const educationalValues = useMemo(() => Array.from(new Set(stories.map((s) => s.educational_value).filter(Boolean))).sort(), [stories]);
  
  const favoriteStories = stories.filter(s => s.favorite);
  const savedStories = stories.filter(s => s.saved);
  const recentStories = [...stories].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 10);

  const updateFilter = (key, value) => setFilters((current) => ({...current, [key]: value}));

  const loadStories = async (kidProfileId = selectedKidProfileId, nextFilters = filters, collection = activeCollection) => {
    if (!kidProfileId) return;
    setLoading(true);
    setError('');
    try {
      const savedFilter = collection === 'library' ? 'true' : nextFilters.saved;
      const response = await generatedStoriesAPI.getHistory({
        kid_profile_id: kidProfileId,
        search: nextFilters.search,
        theme: nextFilters.theme,
        language: nextFilters.language,
        age_level: nextFilters.age_level,
        educational_value: nextFilters.educational_value,
        saved: savedFilter,
        favorite: nextFilters.favorite,
        limit: 100
      });
      const nextStories = response.data || [];
      setStories(nextStories);
      setSelectedStory((current) => {
        if (current && nextStories.some((item) => item.id === current.id)) {
          return nextStories.find((item) => item.id === current.id);
        }
        return nextStories[0] || null;
      });
    } catch (err) {
      if (!navigator.onLine) {
        const downloads = await getDownloads();
        const offlineStories = downloads
          .filter((item) => item.type === 'generated-story' && item.status === 'downloaded')
          .map((item) => item.payload);
        setStories(offlineStories);
        setSelectedStory(offlineStories[0] || null);
        setError('Mode hors connexion: histoires telechargees uniquement.');
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    generatedStoriesAPI.getKidProfiles()
      .then((response) => {
        if (!active) return;
        const profiles = response.data || [];
        setKidProfiles(profiles);
        setSelectedKidProfileId(profiles[0]?.id || '');
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; stopSpeaking(); };
  }, []);

  useEffect(() => {
    if (selectedKidProfileId) loadStories(selectedKidProfileId, filters, activeCollection);
  }, [selectedKidProfileId]);

  useEffect(() => {
    const nextFilters = { ...filters, language };
    setFilters(nextFilters);
    if (selectedKidProfileId) loadStories(selectedKidProfileId, nextFilters, activeCollection);
  }, [language]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadStories(selectedKidProfileId, filters, activeCollection);
  };

  const handleResetFilters = () => {
    const nextFilters = { ...filtersInitialState, language };
    setFilters(nextFilters);
    loadStories(selectedKidProfileId, nextFilters, activeCollection);
  };
  
  const patchStory = (nextStory) => {
    setStories((current) => current.map((story) => (story.id === nextStory.id ? nextStory : story)));
    setSelectedStory((current) => (current?.id === nextStory.id ? nextStory : current));
  };

  const handleRelire = async (story) => {
    setSelectedStory(story);
    setError('');
    if (!story?.story_text) return;
    setSpeaking(true);
    try {
      await speakText(`${story.title}. ${story.story_text}`, { language: speechLanguage(story.language) });
    } catch {
      // Reading the text on screen still works when system TTS is unavailable.
    } finally {
      setSpeaking(false);
    }
  };

  const handleFavorite = async (story) => {
    setBusyStoryId(story.id);
    setError('');
    try {
      const response = await generatedStoriesAPI.setFavorite(story.id, !story.favorite);
      patchStory(response.data);
      if (!story.favorite) setShowCelebration(true);
    } catch (err) {
      if (!navigator.onLine) {
        queueOfflineMutation('generated_story_favorite', {storyId: story.id, favorite: !story.favorite}, `generated-story:${story.id}:favorite`);
        patchStory({...story, favorite: !story.favorite});
        if (!story.favorite) setShowCelebration(true);
        return;
      }
      setError(getErrorMessage(err));
    } finally {
      setBusyStoryId(null);
    }
  };

  const handleSave = async (story) => {
    if (story.saved) return;
    setBusyStoryId(story.id);
    setError('');
    try {
      const response = await generatedStoriesAPI.save(story.id);
      patchStory(response.data);
      setShowCelebration(true);
    } catch (err) {
      if (!navigator.onLine) {
        queueOfflineMutation('generated_story_save', {storyId: story.id}, `generated-story:${story.id}:save`);
        patchStory({...story, saved: true});
        setShowCelebration(true);
        return;
      }
      setError(getErrorMessage(err));
    } finally {
      setBusyStoryId(null);
    }
  };

  const handleNewVersion = async (story) => {
    setBusyStoryId(story.id);
    setError('');
    stopSpeaking();
    try {
      const response = await generatedStoriesAPI.createVersion(story.id);
      const nextStory = response.data;
      setStories((current) => [nextStory, ...current]);
      setSelectedStory(nextStory);
      setShowCelebration(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyStoryId(null);
    }
  };

  const handleDelete = async (story) => {
    if (!window.confirm('Supprimer cette histoire magique ?')) return;
    setBusyStoryId(story.id);
    setError('');
    try {
      await generatedStoriesAPI.delete(story.id);
      const nextStories = stories.filter((item) => item.id !== story.id);
      setStories(nextStories);
      setSelectedStory((current) => (current?.id === story.id ? nextStories[0] || null : current));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyStoryId(null);
    }
  };

  const handleDownloadStory = async (story) => {
    setBusyStoryId(story.id);
    setError('');
    try {
      await offlineContent.saveStoryContent(story);
      setShowCelebration(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyStoryId(null);
    }
  };

  const handleRemoveStoryDownload = async (story) => {
    setBusyStoryId(story.id);
    setError('');
    try {
      await offlineContent.deleteDownload(offlineContentIds.generatedStory(story.id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyStoryId(null);
    }
  };

  // UI Helper
  const StoryCard = ({ story, featured = false }) => {
    const offlineRecord = offlineContent.getStoryStatus(story.id);
    const offlineReady = offlineRecord?.status === 'downloaded';

    return (
      <motion.article
        layoutId={`story-${story.id}`}
        whileHover={{ y: -8, scale: 1.02 }}
        className={`group relative rounded-3xl bg-card shadow-floating border border-border overflow-hidden flex flex-col ${featured ? 'min-w-[320px] md:min-w-[400px]' : 'w-full'}`}
      >
        <div className="relative h-48 w-full cursor-pointer" onClick={() => setSelectedStory(story)}>
          <DynamicCover story={story} className="absolute inset-0" />
          
          <div className="absolute top-3 right-3 flex gap-2">
            {story.favorite && (
              <span className="bg-white/20 backdrop-blur-md p-1.5 rounded-full text-rose-300">
                <HeartIcon className="w-5 h-5" filled />
              </span>
            )}
            {offlineReady && (
              <span className="bg-white/20 backdrop-blur-md p-1.5 rounded-full text-emerald-300">
                <DownloadIcon className="w-5 h-5" />
              </span>
            )}
          </div>
          
          {/* Animated Play Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/40 shadow-glow"
            >
              <AudioIcon className="w-8 h-8 ml-1" />
            </motion.div>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2 gap-3">
            <h3 className="font-black text-lg text-foreground line-clamp-2 leading-tight cursor-pointer" onClick={() => setSelectedStory(story)}>
              {story.title}
            </h3>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2.5 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-xs font-bold">
              {story.theme || 'Aventure'}
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold">
              {story.language?.toUpperCase() || 'FR'}
            </span>
            <span className="px-2.5 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center gap-1 rounded-full text-xs font-bold">
              <ClockIcon className="w-3.5 h-3.5" />
              {story.estimated_duration_minutes || 3} min
            </span>
          </div>
          
          <div className="mt-auto pt-4 border-t border-border flex justify-between items-center gap-2">
            <button 
              onClick={() => handleFavorite(story)} 
              disabled={busyStoryId === story.id}
              className={`p-2 rounded-xl transition ${story.favorite ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-surface-secondary text-foreground-muted hover:bg-rose-50 hover:text-rose-500'}`}
            >
              <HeartIcon className="w-5 h-5" filled={story.favorite} />
            </button>
            
            <button 
              onClick={() => handleNewVersion(story)} 
              disabled={busyStoryId === story.id}
              className="p-2 rounded-xl bg-surface-secondary text-foreground-muted hover:bg-primary-50 hover:text-primary-500 transition"
              title="Nouvelle version"
            >
              <RefreshIcon className="w-5 h-5" />
            </button>
            
            {offlineReady ? (
              <button 
                onClick={() => handleRemoveStoryDownload(story)} 
                disabled={busyStoryId === story.id}
                className="p-2 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 transition"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={() => handleDownloadStory(story)} 
                disabled={busyStoryId === story.id}
                className="p-2 rounded-xl bg-surface-secondary text-foreground-muted hover:bg-emerald-50 hover:text-emerald-500 transition"
              >
                <DownloadIcon className="w-5 h-5" />
              </button>
            )}
            
            <button 
              onClick={() => handleDelete(story)} 
              disabled={busyStoryId === story.id}
              className="p-2 rounded-xl bg-surface-secondary text-foreground-muted hover:bg-danger-50 hover:text-danger-500 transition ml-auto"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.article>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden pb-32" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Immersive Magical Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/20 via-background to-background" />
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary-500/10 to-transparent blur-3xl opacity-50" />
      </div>

      <MagicCelebration active={showCelebration} onComplete={() => setShowCelebration(false)} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link to="/kids" className="shrink-0">
            <Logo size="default" showText={true} />
          </Link>
          <Link
            to="/kids"
            className="inline-flex items-center gap-2 rounded-2xl bg-card/80 backdrop-blur-md px-5 py-3 text-sm font-black text-foreground shadow-sm hover:shadow-md transition border border-border"
          >
            <ChevronLeftIcon className="h-5 w-5" />
            <span>Retour</span>
          </Link>
        </header>

        {/* Premium Immersive Hero */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-12 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-8 md:p-12 text-white shadow-2xl"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-30 mix-blend-overlay"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/20 blur-3xl rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-400/20 blur-3xl rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 text-sm font-black mb-6 shadow-glass">
                <SparklesIcon className="h-5 w-5 text-yellow-300" />
                <span>Le Lit Qui Lit Magique</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-4 filter drop-shadow-lg">
                ✨ Mes Histoires IA
              </h1>
              <p className="text-lg md:text-xl font-bold text-white/90 filter drop-shadow-md">
                Retrouve toutes tes aventures créées avec la magie de l'IA. Relis-les, écoute-les ou crée de nouvelles versions fantastiques !
              </p>
            </div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/kids/story-studio"
                className="inline-flex items-center justify-center gap-3 rounded-3xl bg-white px-8 py-5 text-xl font-black text-purple-700 shadow-xl hover:shadow-2xl transition"
              >
                <SparklesIcon className="h-6 w-6" />
                <span>Créer une histoire</span>
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* Quick KPI Statistics */}
        <section className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl p-6 text-white shadow-floating relative overflow-hidden">
            <BookIcon className="w-12 h-12 text-white/30 absolute right-4 bottom-4" />
            <p className="text-sm font-bold text-white/80 uppercase tracking-wider mb-1">Bibliothèque</p>
            <p className="text-4xl font-black">{stories.length}</p>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-rose-500 to-pink-500 rounded-3xl p-6 text-white shadow-floating relative overflow-hidden">
            <HeartIcon className="w-12 h-12 text-white/30 absolute right-4 bottom-4" filled />
            <p className="text-sm font-bold text-white/80 uppercase tracking-wider mb-1">Favoris</p>
            <p className="text-4xl font-black">{favoriteStories.length}</p>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl p-6 text-white shadow-floating relative overflow-hidden">
            <DownloadIcon className="w-12 h-12 text-white/30 absolute right-4 bottom-4" />
            <p className="text-sm font-bold text-white/80 uppercase tracking-wider mb-1">Sauvegardées</p>
            <p className="text-4xl font-black">{savedStories.length}</p>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-6 text-white shadow-floating relative overflow-hidden">
            <SparklesIcon className="w-12 h-12 text-white/30 absolute right-4 bottom-4" />
            <p className="text-sm font-bold text-white/80 uppercase tracking-wider mb-1">Récents</p>
            <p className="text-4xl font-black">{recentStories.length}</p>
          </motion.div>
        </section>

        {/* Recent Creations Carousel (Disney+ Style) */}
        {recentStories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <SparklesIcon className="w-7 h-7 text-amber-500" />
              Créations récentes
            </h2>
            <div className="flex gap-6 overflow-x-auto pb-8 pt-2 px-2 -mx-2 snap-x custom-scrollbar">
              {recentStories.map(story => (
                <div key={story.id} className="snap-start shrink-0 w-[280px] md:w-[320px]">
                  <StoryCard story={story} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Glassmorphism Filters */}
        <section className="mb-12 rounded-[2rem] bg-card/60 backdrop-blur-xl border border-border p-6 shadow-glass">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <SearchIcon className="w-6 h-6 text-primary-500" />
              Explorer ma magie
            </h2>
            <button onClick={handleResetFilters} className="text-sm font-bold text-primary-500 hover:text-primary-600 transition bg-primary-50 dark:bg-primary-900/30 px-4 py-2 rounded-full">
              Réinitialiser les filtres
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <label className="relative block lg:col-span-2">
              <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-muted" />
              <input
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="h-14 w-full rounded-2xl bg-surface-secondary/50 border border-border pl-12 pr-4 font-bold outline-none transition focus:border-primary-400 focus:bg-card focus:ring-4 focus:ring-primary-500/10 placeholder:text-foreground-muted"
                placeholder="Chercher un titre, héros..."
              />
            </label>
            <select
              value={filters.theme}
              onChange={(e) => updateFilter('theme', e.target.value)}
              className="h-14 w-full rounded-2xl bg-surface-secondary/50 border border-border px-4 font-bold outline-none transition focus:border-primary-400 appearance-none cursor-pointer"
            >
              <option value="">Tous les thèmes</option>
              {themes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={filters.language}
              onChange={(e) => updateFilter('language', e.target.value)}
              className="h-14 w-full rounded-2xl bg-surface-secondary/50 border border-border px-4 font-bold outline-none transition focus:border-primary-400 appearance-none cursor-pointer"
            >
              <option value="">Toutes les langues</option>
              {languages.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
            <select
              value={filters.age_level}
              onChange={(e) => updateFilter('age_level', e.target.value)}
              className="h-14 w-full rounded-2xl bg-surface-secondary/50 border border-border px-4 font-bold outline-none transition focus:border-primary-400 appearance-none cursor-pointer"
            >
              <option value="">Tous les âges</option>
              {ageLevels.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </form>
        </section>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 rounded-2xl bg-danger-50 border border-danger-200 px-6 py-4 text-danger-800 font-bold flex items-center gap-3 shadow-sm">
            <span className="text-2xl">⚠️</span> {error}
          </motion.div>
        )}

        {/* Main Grid & Selected Story */}
        <main className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Main Collection */}
          <section>
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <BookIcon className="w-7 h-7 text-primary-500" />
              Toutes mes histoires
            </h2>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-80 rounded-3xl bg-surface-secondary animate-pulse border border-border" />
                ))}
              </div>
            ) : stories.length === 0 ? (
              <div className="rounded-[2.5rem] bg-card border border-border p-12 text-center shadow-sm">
                <div className="text-8xl mb-6">🐉</div>
                <h3 className="text-2xl font-black mb-2">Tu n'as pas encore créé d'histoire magique.</h3>
                <p className="text-foreground-muted font-bold mb-8">Utilise la magie de l'IA pour imaginer ta première aventure !</p>
                <Link
                  to="/kids/story-studio"
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-8 py-4 text-lg font-black text-white shadow-lg hover:bg-primary-600 transition"
                >
                  <SparklesIcon className="h-6 w-6" />
                  Créer ma première histoire
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <AnimatePresence>
                  {stories.map(story => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* Selected Story Detailed Info Card */}
          <section className="lg:sticky lg:top-8 self-start">
            {!selectedStory ? (
              <div className="rounded-[2.5rem] bg-surface-secondary/50 border border-border border-dashed p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
                <BookIcon className="w-16 h-16 text-foreground-muted mb-4 opacity-50" />
                <p className="text-lg font-black text-foreground-muted">Sélectionne une histoire pour la relire</p>
              </div>
            ) : (
              <motion.article 
                layoutId={`story-detail-${selectedStory.id}`}
                className="rounded-[2.5rem] bg-card shadow-floating border border-border overflow-hidden"
              >
                {/* Header Cover */}
                <div className="relative h-56">
                  <DynamicCover story={selectedStory} className="absolute inset-0" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                  <button 
                    onClick={() => handleRelire(selectedStory)} 
                    disabled={speaking}
                    className="absolute bottom-6 right-6 w-16 h-16 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center shadow-glow text-white transition-transform hover:scale-110 disabled:opacity-50"
                  >
                    <AudioIcon className="w-8 h-8 ml-1" />
                  </button>
                </div>

                <div className="p-8 pt-0">
                  <h2 className="text-3xl font-black mb-4 leading-tight">{selectedStory.title}</h2>
                  
                  {/* Detailed Information Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-surface-secondary rounded-2xl p-4 flex items-center gap-3">
                      <ClockIcon className="w-6 h-6 text-orange-500" />
                      <div>
                        <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Durée</p>
                        <p className="font-black text-foreground">{selectedStory.estimated_duration_minutes || 3} min</p>
                      </div>
                    </div>
                    <div className="bg-surface-secondary rounded-2xl p-4 flex items-center gap-3">
                      <BookIcon className="w-6 h-6 text-primary-500" />
                      <div>
                        <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Thème</p>
                        <p className="font-black text-foreground capitalize truncate">{selectedStory.theme || 'Aventure'}</p>
                      </div>
                    </div>
                    <div className="bg-surface-secondary rounded-2xl p-4 flex items-center gap-3">
                      <LanguageIcon className="w-6 h-6 text-emerald-500" />
                      <div>
                        <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Langue</p>
                        <p className="font-black text-foreground uppercase">{selectedStory.language || 'FR'}</p>
                      </div>
                    </div>
                    <div className="bg-surface-secondary rounded-2xl p-4 flex items-center gap-3">
                      <ChildIcon className="w-6 h-6 text-violet-500" />
                      <div>
                        <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Âge</p>
                        <p className="font-black text-foreground">{selectedStory.age_level || 'Libre'}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm font-bold text-foreground-muted italic text-center mb-6">
                    Créée le {new Date(selectedStory.created_at || Date.now()).toLocaleDateString('fr-FR')}
                  </p>

                  {/* Playback & Text Area */}
                  <div className="rounded-2xl bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 p-6 max-h-96 overflow-y-auto custom-scrollbar">
                    <p className="text-lg font-bold leading-relaxed text-foreground whitespace-pre-line">
                      {selectedStory.story_text}
                    </p>
                  </div>
                  
                  {/* Actions Bar */}
                  <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    <button onClick={() => handleSave(selectedStory)} disabled={selectedStory.saved || busyStoryId === selectedStory.id} className="flex-1 min-w-[120px] rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-3 text-sm font-black disabled:opacity-60 hover:opacity-80 transition flex items-center justify-center gap-2">
                      <DownloadIcon className="w-5 h-5" />
                      {selectedStory.saved ? 'Sauvée' : 'Sauver'}
                    </button>
                    <button onClick={() => handleFavorite(selectedStory)} disabled={busyStoryId === selectedStory.id} className="flex-1 min-w-[120px] rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-4 py-3 text-sm font-black disabled:opacity-60 hover:opacity-80 transition flex items-center justify-center gap-2">
                      <HeartIcon className="w-5 h-5" filled={selectedStory.favorite} />
                      {selectedStory.favorite ? 'Retirer' : 'Favori'}
                    </button>
                    <button onClick={() => handleNewVersion(selectedStory)} disabled={busyStoryId === selectedStory.id} className="flex-1 min-w-[140px] rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-4 py-3 text-sm font-black disabled:opacity-60 hover:opacity-80 transition flex items-center justify-center gap-2">
                      <RefreshIcon className="w-5 h-5" />
                      Variante
                    </button>
                  </div>
                </div>
              </motion.article>
            )}
          </section>
        </main>
      </div>
      <VoiceAssistant />
      <KidsBottomNav />
    </div>
  );
}

export default KidsAIStories;
