import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { booksAPI } from '../api/books';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { useLanguage } from '../context/LanguageContext';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { getImageUrl } from '../utils/imageUrl';
import { storage } from '../utils/storage';
import { getRestrictionMessage } from '../services/parental/parentalAccessService';
import { KidsPageShell } from '../components/kids/KidsPageShell';
import { KidsPageHeader } from '../components/kids/KidsPageHeader';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { KidsErrorBanner } from '../components/kids/KidsErrorBanner';
import { KidsFeedbackBurst } from '../components/kids/KidsFeedbackBurst';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import {
  AudioIcon, ChevronLeftIcon, HeartIcon,
  PauseIcon, PlayIcon, ChevronRightIcon,
} from '../components/Icons';

function formatTime(seconds = 0) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function KidsListen() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { language, isRtl, t } = useLanguage();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const playFeedbackShown = useRef(false);

  const player = useAudioPlayer();

  const flashFeedback = (type) => {
    setFeedback(type);
    window.setTimeout(() => setFeedback(null), 700);
  };

  useEffect(() => {
    if (!user) {
      navigate('/parent/login');
      return;
    }
    let active = true;
    setLoading(true);
    booksAPI.getBook(id)
      .then((response) => {
        if (!active) return;
        const data = response.data;
        setBook(data);
        setFavorite(storage.isFavorite(data.id));
        if (data.audio_url) {
          player.play(data).catch(() => {});
        }
      })
      .catch((error) => {
        if (!active) return;
        showToast(getRestrictionMessage(error, t('loadError')), 'error');
        navigate('/kids/audio');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      player.stop();
    };
  }, [id, user]);

  useEffect(() => {
    if (player.playing && !playFeedbackShown.current) {
      playFeedbackShown.current = true;
      flashFeedback('play');
    }
  }, [player.playing]);

  const toggleFavorite = () => {
    if (!book) return;
    if (storage.isFavorite(book.id)) {
      storage.removeFavorite(book.id);
      setFavorite(false);
      showToast(t('removedFromFavorites'), 'info');
    } else {
      storage.addFavorite(book.id);
      setFavorite(true);
      flashFeedback('favorite');
      showToast(t('addedToFavorites'), 'success');
    }
  };

  const progressMax = Math.max(0, Math.floor(player.duration || 0));
  const progressValue = Math.min(progressMax, Math.floor(player.currentTime || 0));
  const typeLabel = book?.content_type === 'song' ? t('rhymes') : t('audioStory');

  if (loading) {
    return (
      <KidsPageShell isRtl={isRtl} variant="library" world="audio" className="pb-32" footer={<KidsBottomNav />}>
        <KidsPageHeader backTo="/kids/audio" emoji="🎧" />
        <div className="px-6 py-12">
          <BookGridSkeleton count={1} variant="carousel" />
        </div>
      </KidsPageShell>
    );
  }

  if (!book) return null;

  return (
    <KidsPageShell isRtl={isRtl} variant="library" world="audio" className="pb-32 kids-glow-audio" footer={<KidsBottomNav />}>
      <KidsPageHeader backTo="/kids/audio" onBack={() => navigate('/kids/audio')} emoji="🎧" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-4 md:px-8 lg:max-w-4xl">
        <motion.main
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="kids-premium-panel p-6 md:p-10 flex flex-col items-center text-center relative"
        >
          <KidsFeedbackBurst type={feedback} active={Boolean(feedback)} />
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-100 text-accent-700 px-4 py-2 text-sm font-black">
            <AudioIcon className="h-5 w-5" />
            {typeLabel}
          </span>

          <motion.div
            animate={player.playing ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={{ duration: 2, repeat: player.playing ? Infinity : 0 }}
            className="mb-8 w-56 h-56 md:w-72 md:h-72 rounded-[2.5rem] overflow-hidden shadow-kids-soft border-4 border-white/70"
          >
            {book.cover_image ? (
              <img src={getImageUrl(book.cover_image, 'book')} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center bg-gradient-to-br from-primary-100 to-secondary-100 text-8xl">🎵</div>
            )}
          </motion.div>

          <h1 className="text-2xl md:text-4xl font-black mb-4 text-foreground">{book.title}</h1>

          {player.error && <KidsErrorBanner message={player.error} className="mb-4 w-full" />}

          {!book.audio_url && (
            <KidsErrorBanner message={t('audioUnavailable')} className="mb-6 w-full" />
          )}

          <div className="w-full max-w-md mb-8">
            <input
              type="range"
              min={0}
              max={progressMax || 1}
              value={progressValue}
              onChange={(e) => player.seekTo(e.target.value)}
              className="w-full h-4 rounded-full appearance-none bg-primary-100 accent-primary-500"
              aria-label="Progression"
            />
            <div className="flex justify-between text-sm font-bold text-foreground-muted mt-2">
              <span>{formatTime(player.currentTime)}</span>
              <span>{formatTime(player.duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-8">
            <button
              type="button"
              onClick={() => player.seekBy(-10)}
              className="kids-touch-target grid h-16 w-16 place-items-center rounded-full bg-primary-50 border-2 border-primary-100 text-primary-600"
              aria-label="-10s"
            >
              <ChevronLeftIcon className="h-8 w-8" />
            </button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              animate={player.playing ? { scale: [1, 1.05, 1], boxShadow: ['0 0 0 0 rgba(251,191,36,0.4)', '0 0 0 14px rgba(251,191,36,0)', '0 0 0 0 rgba(251,191,36,0.4)'] } : { scale: 1 }}
              transition={player.playing ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
              onClick={() => (player.playing ? player.pause() : player.play(book))}
              disabled={!book.audio_url}
              className="kids-touch-target grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-glow disabled:opacity-40 border-4 border-white"
              aria-label={player.playing ? t('pause') : t('listenAction')}
            >
              {player.playing ? <PauseIcon className="h-14 w-14" /> : <PlayIcon className={`h-14 w-14 ${isRtl ? 'rotate-180' : ''}`} filled />}
            </motion.button>
            <button
              type="button"
              onClick={() => player.seekBy(10)}
              className="kids-touch-target grid h-16 w-16 place-items-center rounded-full bg-primary-50 border-2 border-primary-100 text-primary-600"
              aria-label="+10s"
            >
              <ChevronRightIcon className="h-8 w-8" />
            </button>
          </div>

          <button
            type="button"
            onClick={toggleFavorite}
            className="kids-touch-target inline-flex items-center gap-3 rounded-full bg-accent-100 text-accent-800 px-8 py-4 font-black border-2 border-accent-200 hover:bg-accent-200 transition"
          >
            <HeartIcon className="h-7 w-7" filled={favorite} />
            {favorite ? t('yourFavorites') : t('addedToFavorites')}
          </button>
        </motion.main>
      </div>

      <VoiceAssistant
        language={language === 'en' ? 'en-US' : language === 'ar' ? 'ar-MA' : 'fr-FR'}
        onNavigate={(path) => navigate(path)}
      />
    </KidsPageShell>
  );
}

export default KidsListen;
