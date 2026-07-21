import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { generatedStoriesAPI } from '../api/generatedStories';
import { speakText, stopSpeaking } from '../services/ai/browserTextToSpeech';
import { useOfflineContent } from '../hooks/useOfflineContent';
import { getDownloads, offlineContentIds } from '../services/offline/offlineContentService';
import { queueOfflineMutation } from '../services/offline/offlineSyncService';
import { 
  AudioIcon, BookIcon, ChevronLeftIcon, ChildIcon, ClockIcon, DownloadIcon, LanguageIcon,
  HeartIcon, HistoryIcon, RefreshIcon, SearchIcon, SparklesIcon, TrashIcon, WarningIcon
} from '../components/Icons';
import { Logo } from '../components/Logo';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { KidsPageShell } from '../components/kids/KidsPageShell';
import { KidsEmptyState } from '../components/kids/KidsEmptyState';
import { KidsErrorBanner } from '../components/kids/KidsErrorBanner';
import { KidsHero } from '../components/kids/KidsHero';
import { KidsModal } from '../components/kids/KidsModal';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ContentReportModal } from '../components/parent/ContentReportModal';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { getHoverMotion } from '../constants/kidsMotion';
import { KidsBookCover } from '../components/kids/KidsBookCover';
import {
  BRAND_HERO_GRADIENT, BRAND_SEMANTIC,
} from '../constants/brandTheme';

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
        const colorClasses = ['text-magic-500', 'text-primary-500', 'text-orange-500', 'text-magic-400', 'text-primary-400'];
        const color = colorClasses[Math.floor(Math.random() * colorClasses.length)];
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
            className={`absolute ${color}`}
          >
            {i % 3 === 0 ? '✨' : i % 2 === 0 ? '⭐' : '🎊'}
          </motion.div>
        );
      })}
    </div>
  );
}

// --- DYNAMIC COVER GENERATOR ---
function DynamicCover({ story, className = '' }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <KidsBookCover
        book={{
          title: story.title,
          slug: story.slug,
          cover_image: story.cover_image_url || story.cover_image,
          cover_image_url: story.cover_image_url,
          theme: story.theme,
        }}
        alt={story.title}
        imgClassName="absolute inset-0 w-full h-full object-cover"
      />
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

function StoryTextWithIllustrations({ story }) {
  const scenes = story.illustration_plan?.scenes || [];
  const sceneMap = new Map(scenes.filter(s => s.url).map(s => [s.index, s.url]));
  
  if (sceneMap.size === 0) {
    return (
      <p className="text-lg font-bold leading-relaxed text-foreground whitespace-pre-line">
        {story.story_text}
      </p>
    );
  }

  const paragraphs = story.story_text.split(/\n{2,}/).filter(p => p.trim());
  const step = paragraphs.length > 0 ? Math.max(1, Math.floor(paragraphs.length / (sceneMap.size + 1))) : 1;
  let sceneIdx = 0;

  return (
    <div className="space-y-4">
      {paragraphs.map((para, i) => (
        <React.Fragment key={i}>
          <p className="text-lg font-bold leading-relaxed text-foreground">
            {para.trim()}
          </p>
          {(i + 1) % step === 0 && sceneMap.has(sceneIdx) && (() => {
            const url = sceneMap.get(sceneIdx);
            sceneIdx++;
            return (
              <div className="my-4 rounded-xl overflow-hidden shadow-lg">
                <img src={url} alt={`Scene ${sceneIdx}`} className="w-full h-auto rounded-xl" loading="lazy" />
              </div>
            );
          })()}
        </React.Fragment>
      ))}
    </div>
  );
}

function NarrationPlayer({ story, canGenerate = false }) {
  const { t, language } = useLanguage();
  const [narrationLocale, setNarrationLocale] = React.useState(story.language || language || 'fr');
  const [audioUrl, setAudioUrl] = React.useState(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const audioRef = React.useRef(null);

  const tracks = story.narration_tracks || [];
  const currentTrack = tracks.find(t => t.locale === narrationLocale);
  const hasTrack = currentTrack?.available && currentTrack?.url;

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setAudioUrl(hasTrack ? currentTrack.url : null);
  }, [narrationLocale, hasTrack, currentTrack?.url]);

  const handlePlayPause = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioUrl) {
      if (!audioRef.current) audioRef.current = new Audio(audioUrl);
      else audioRef.current.src = audioUrl;
      audioRef.current.onended = () => setIsPlaying(false);
      await audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setIsLoading(true);
    try {
      const langMap = { fr: 'fr-FR', en: 'en-US', ar: 'ar-MA' };
      await speakText(`${story.title}. ${story.story_text}`, { 
        language: langMap[narrationLocale] || 'fr-FR',
        preferServer: true 
      });
    } catch (e) {
      console.warn('TTS fallback failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${window.location.origin}/api/generated-stories/${story.id}/narrations/${narrationLocale}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) setAudioUrl(data.url);
      }
    } catch (e) {
      console.warn('Narration generation failed:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${story.title.replace(/[^a-zA-Z0-9]/g, '_')}-${narrationLocale}.mp3`;
    a.click();
  };

  const localeLabels = { fr: 'FR', en: 'EN', ar: 'AR' };

  return (
    <div className="flex items-center gap-2 flex-wrap bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 mt-3">
      {/* Language selector */}
      <div className="flex gap-1">
        {['fr', 'en', 'ar'].map((loc) => {
          const track = tracks.find(t => t.locale === loc);
          return (
            <button
              key={loc}
              onClick={() => setNarrationLocale(loc)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                narrationLocale === loc
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {localeLabels[loc]}
              {track?.available && <span className="ml-1 text-[10px]">●</span>}
            </button>
          );
        })}
      </div>

      {/* Play/Pause */}
      <button
        onClick={handlePlayPause}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <span>⏸</span>
        ) : (
          <span>▶</span>
        )}
        {isPlaying ? (t('kids_pause') || 'Pause') : (t('kids_listen') || 'Écouter')}
      </button>

      {/* Generate button (when no track available) */}
      {!hasTrack && canGenerate && (
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary-500 text-white text-sm font-bold hover:bg-secondary-600 transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>🎙️</span>
          )}
          {t('kids_generate_narration') || 'Générer'}
        </button>
      )}

      {/* Download button */}
      {audioUrl && (
        <button
          onClick={handleDownload}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm hover:bg-gray-200 transition-all"
          title={t('kids_download_offline') || 'Télécharger'}
        >
          <DownloadIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function KidsAIStories() {
  const { language, t, isRtl } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const canCreateStories = user?.role === 'parent' || user?.role === 'admin';
  const homePath = canCreateStories ? '/parent' : '/kids';
  const storyStudioPath = canCreateStories ? '/parent/story-studio' : null;
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
  const [showReportModal, setShowReportModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const canReport = user && (user.role === 'parent' || user.role === 'admin');

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
    setDeleteTarget(story);
  };

  const confirmDelete = async () => {
    const story = deleteTarget;
    if (!story) return;
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
      setDeleteTarget(null);
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
        {...getHoverMotion(reducedMotion, { whileHover: { y: -8, scale: 1.02 } })}
        className={`group relative kids-story-card flex flex-col ${featured ? 'min-w-[320px] md:min-w-[400px]' : 'w-full'}`}
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
              <span className="bg-white/20 backdrop-blur-md p-1.5 rounded-full text-secondary-300">
                <DownloadIcon className="w-5 h-5" />
              </span>
            )}
          </div>
          
          {/* Always-visible play affordance — never hover-only on touch */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-gradient-to-t from-black/25 via-transparent to-transparent">
            <div className="w-16 h-16 min-h-[64px] min-w-[64px] rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-white border border-white/40 shadow-soft">
              <AudioIcon className="w-8 h-8 ml-1" />
            </div>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2 gap-3">
            <h3 className="font-black text-lg text-foreground line-clamp-2 leading-tight cursor-pointer touch-manipulation" onClick={() => setSelectedStory(story)}>
              {story.title}
            </h3>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2.5 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-xs font-bold">
              {story.theme || 'Aventure'}
            </span>
            <span className={`px-2.5 py-1 ${BRAND_SEMANTIC.success.bg} ${BRAND_SEMANTIC.success.text} rounded-full text-xs font-bold`}>
              {story.language?.toUpperCase() || 'FR'}
            </span>
            <span className={`px-2.5 py-1 ${BRAND_SEMANTIC.warning.bg} ${BRAND_SEMANTIC.warning.text} flex items-center gap-1 rounded-full text-xs font-bold`}>
              <ClockIcon className="w-3.5 h-3.5" />
              {story.estimated_duration_minutes || 3} min
            </span>
          </div>
          
          <div className="mt-auto pt-4 border-t border-border flex flex-wrap justify-between items-center gap-2">
            <button 
              type="button"
              onClick={() => handleFavorite(story)} 
              disabled={busyStoryId === story.id}
              aria-label={story.favorite ? t('removeFromFavorites') : t('addToFavorites')}
              aria-pressed={Boolean(story.favorite)}
              className={`kids-touch-target touch-manipulation inline-grid place-items-center rounded-xl transition ${story.favorite ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-surface-secondary text-foreground-muted'}`}
            >
              <HeartIcon className="w-6 h-6" filled={story.favorite} />
            </button>
            
            {canCreateStories && (
              <button 
                type="button"
                onClick={() => handleNewVersion(story)} 
                disabled={busyStoryId === story.id}
                className="kids-touch-target touch-manipulation inline-grid place-items-center rounded-xl bg-surface-secondary text-foreground-muted"
                aria-label={t('storyStudioVariantAction')}
                title={t('storyStudioVariantAction')}
              >
                <RefreshIcon className="w-6 h-6" />
              </button>
            )}
            
            {offlineReady ? (
              <button 
                type="button"
                onClick={() => handleRemoveStoryDownload(story)} 
                disabled={busyStoryId === story.id}
                aria-label={t('downloaded')}
                className={`kids-touch-target touch-manipulation inline-grid place-items-center rounded-xl ${BRAND_SEMANTIC.success.bg} ${BRAND_SEMANTIC.success.text}`}
              >
                <TrashIcon className="w-6 h-6" />
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => handleDownloadStory(story)} 
                disabled={busyStoryId === story.id}
                aria-label={t('offlineMode')}
                className="kids-touch-target touch-manipulation inline-grid place-items-center rounded-xl bg-surface-secondary text-foreground-muted"
              >
                <DownloadIcon className="w-6 h-6" />
              </button>
            )}
            
            <button 
              type="button"
              onClick={() => handleDelete(story)} 
              disabled={busyStoryId === story.id}
              aria-label={t('parentDeleteKid')}
              className="kids-touch-target touch-manipulation inline-grid place-items-center rounded-xl bg-surface-secondary text-foreground-muted ml-auto"
            >
              <TrashIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.article>
    );
  };

  return (
    <KidsPageShell footer={canCreateStories ? null : <KidsBottomNav />} isRtl={isRtl} world="create" className="pb-32 kids-glow-create">
      <MagicCelebration active={showCelebration} onComplete={() => setShowCelebration(false)} />

      <div className="relative z-10 kids-main kids-main-tablet-wide">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link to={homePath} className="shrink-0">
            <Logo size="default" showText={true} />
          </Link>
          <Link
            to={homePath}
            className="inline-flex items-center gap-2 rounded-2xl bg-card/80 backdrop-blur-md px-5 py-3 text-sm font-black text-foreground shadow-sm hover:shadow-md transition border border-border"
          >
            <ChevronLeftIcon className="h-5 w-5" />
            <span>Retour</span>
          </Link>
        </header>

        <KidsHero
          modality="create"
          emoji="✨"
          badge="Le Lit Qui Lit Magique"
          title={`✨ ${t('kidsNavStories')}`}
          subtitle={canCreateStories ? t('storyStudioEmptyParentDescription') : t('storyStudioEmptyKidDescription')}
          className="mb-10"
        >
          {canCreateStories && storyStudioPath && (
            <motion.div {...getHoverMotion(reducedMotion, { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } })} className="mt-6">
              <Link
                to={storyStudioPath}
                className="kids-touch-target inline-flex min-h-touch-kids items-center justify-center gap-3 rounded-32 bg-white px-8 py-4 text-xl font-black text-magic-700 shadow-floating focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-magic-300"
              >
                <SparklesIcon className="h-6 w-6" />
                <span>{t('storyStudioCreateStory')}</span>
              </Link>
            </motion.div>
          )}
        </KidsHero>

        {canCreateStories && storyStudioPath && (
          <section className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Parcours de création">
            {[
              { step: '1', title: 'Imagine', desc: 'Choisis thème et héros', emoji: '🪄', path: storyStudioPath },
              { step: '2', title: 'Crée', desc: 'Laisse la magie écrire', emoji: '✨', path: storyStudioPath },
              { step: '3', title: 'Lis & écoute', desc: 'Retrouve tes histoires ici', emoji: '📖', path: null },
            ].map((item) => (
              <motion.div
                key={item.step}
                {...getHoverMotion(reducedMotion, { whileHover: { y: -4 } })}
                className="rounded-24 border-2 border-magic-100 bg-card/80 p-5 shadow-soft text-center"
              >
                <span className="text-4xl" aria-hidden="true">{item.emoji}</span>
                <p className="mt-2 text-caption font-bold text-magic-500">Étape {item.step}</p>
                <h3 className="text-heading-s font-black text-foreground">{item.title}</h3>
                <p className="text-caption text-foreground-muted mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </section>
        )}

        {/* Recent Creations Carousel */}
        {recentStories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <SparklesIcon className="w-7 h-7 text-magic-500" />
              Créations récentes
            </h2>
            <div className="flex gap-6 overflow-x-auto pb-8 pt-2 px-2 -mx-2 snap-x custom-scrollbar kids-scroll-smooth">
              {recentStories.map(story => (
                <div key={story.id} className="snap-start shrink-0 w-[280px] md:w-[320px]">
                  <StoryCard story={story} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Search & filters */}
        <section className="mb-12 rounded-32 bg-card/60 backdrop-blur-xl border border-border p-space-20 md:p-space-24 shadow-soft">
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

        {error && <KidsErrorBanner message={error} onDismiss={() => setError('')} className="mb-8" />}

        {/* Main Grid & Selected Story */}
        <main className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Main Collection */}
          <section>
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <BookIcon className="w-7 h-7 text-primary-500" />
              Toutes mes histoires
            </h2>
            
            {loading ? (
              <BookGridSkeleton count={4} />
            ) : stories.length === 0 ? (
              <KidsEmptyState
                emoji="🐉"
                title={canCreateStories ? t('storyStudioEmptyParentTitle') : t('storyStudioEmptyKidTitle')}
                description={canCreateStories ? t('storyStudioEmptyParentDescription') : t('storyStudioEmptyKidDescription')}
                actionLabel={canCreateStories ? t('storyStudioCreateFirstStory') : t('goToLibrary')}
                onAction={() => (canCreateStories && storyStudioPath ? navigate(storyStudioPath) : navigate('/kids/library'))}
                showMascot
                mascotMood="encourage"
              />
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

                {selectedStory.illustration_plan?.status === 'processing' && (
                  <div className="flex items-center gap-2 text-sm text-primary-500 mt-2 px-8">
                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <span>{t('kids_ai_illustrations_generating') || 'Illustrations en cours...'}</span>
                  </div>
                )}

                <div className="p-8 pt-0">
                  <h2 className="text-3xl font-black mb-4 leading-tight">{selectedStory.title}</h2>
                  
                  {/* Detailed Information Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-surface-secondary rounded-2xl p-4 flex items-center gap-3">
                      <ClockIcon className="w-6 h-6 text-magic-500" />
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
                      <LanguageIcon className="w-6 h-6 text-secondary-500" />
                      <div>
                        <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Langue</p>
                        <p className="font-black text-foreground uppercase">{selectedStory.language || 'FR'}</p>
                      </div>
                    </div>
                    <div className="bg-surface-secondary rounded-2xl p-4 flex items-center gap-3">
                      <ChildIcon className="w-6 h-6 text-primary-500" />
                      <div>
                        <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Âge</p>
                        <p className="font-black text-foreground">{selectedStory.age_level || 'Libre'}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm font-bold text-foreground-muted italic text-center mb-6">
                    Créée le {new Date(selectedStory.created_at || Date.now()).toLocaleDateString('fr-FR')}
                  </p>

                  <NarrationPlayer story={selectedStory} canGenerate={canCreateStories} />

                  {/* Playback & Text Area */}
                  <div className="rounded-2xl bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 p-6 max-h-96 overflow-y-auto custom-scrollbar">
                    <StoryTextWithIllustrations story={selectedStory} />
                  </div>
                  
                  {/* Actions Bar */}
                  <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    <button onClick={() => handleSave(selectedStory)} disabled={selectedStory.saved || busyStoryId === selectedStory.id} className={`flex-1 min-w-[120px] rounded-2xl ${BRAND_SEMANTIC.success.bg} ${BRAND_SEMANTIC.success.text} px-4 py-3 text-sm font-black disabled:opacity-60 hover:opacity-80 transition flex items-center justify-center gap-2`}>
                      <DownloadIcon className="w-5 h-5" />
                      {selectedStory.saved ? 'Sauvée' : 'Sauver'}
                    </button>
                    <button onClick={() => handleFavorite(selectedStory)} disabled={busyStoryId === selectedStory.id} className="flex-1 min-w-[120px] rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-4 py-3 text-sm font-black disabled:opacity-60 hover:opacity-80 transition flex items-center justify-center gap-2">
                      <HeartIcon className="w-5 h-5" filled={selectedStory.favorite} />
                      {selectedStory.favorite ? 'Retirer' : 'Favori'}
                    </button>
                    {canCreateStories && (
                      <button onClick={() => handleNewVersion(selectedStory)} disabled={busyStoryId === selectedStory.id} className="flex-1 min-w-[140px] rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-4 py-3 text-sm font-black disabled:opacity-60 hover:opacity-80 transition flex items-center justify-center gap-2">
                        <RefreshIcon className="w-5 h-5" />
                        {t('storyStudioVariantAction')}
                      </button>
                    )}
                    {canReport && (
                      <button
                        type="button"
                        onClick={() => setShowReportModal(true)}
                        className="flex-1 min-w-[140px] rounded-2xl bg-magic-50 text-magic-700 dark:bg-magic-900/30 dark:text-magic-300 px-4 py-3 text-sm font-black hover:opacity-80 transition flex items-center justify-center gap-2"
                      >
                        <WarningIcon className="w-5 h-5" />
                        {t('reportContentAction')}
                      </button>
                    )}
                  </div>
                </div>
              </motion.article>
            )}
          </section>
        </main>
      </div>
      <VoiceAssistant />
      <KidsModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        emoji="🗑️"
        title={t('kidsNavStories')}
        primaryLabel="OK"
        onPrimary={confirmDelete}
        secondaryLabel={t('back')}
        onSecondary={() => setDeleteTarget(null)}
      >
        Supprimer cette histoire magique ?
      </KidsModal>
      <ContentReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="generated_story"
        targetId={selectedStory?.id}
        targetTitle={selectedStory?.title}
      />
    </KidsPageShell>
  );
}

export default KidsAIStories;
