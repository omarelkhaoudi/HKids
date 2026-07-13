import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { booksAPI } from '../api/books';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { useLanguage } from '../context/LanguageContext';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { getImageUrl } from '../utils/imageUrl';
import { storage } from '../utils/storage';
import { getRestrictionMessage } from '../services/parental/parentalAccessService';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { Logo } from '../components/Logo';
import { BRAND_HERO_GRADIENT } from '../constants/brandTheme';
import {
  AudioIcon, ChevronLeftIcon, HeartIcon, HomeIcon, LogOutIcon,
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { language, isRtl, t } = useLanguage();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState(false);

  const player = useAudioPlayer();

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

  const toggleFavorite = () => {
    if (!book) return;
    if (storage.isFavorite(book.id)) {
      storage.removeFavorite(book.id);
      setFavorite(false);
      showToast(t('removedFromFavorites'), 'info');
    } else {
      storage.addFavorite(book.id);
      setFavorite(true);
      showToast(t('addedToFavorites'), 'success');
    }
  };

  const handleLogout = () => {
    player.stop();
    logout();
    navigate('/parent/login');
  };

  const progressMax = Math.max(0, Math.floor(player.duration || 0));
  const progressValue = Math.min(progressMax, Math.floor(player.currentTime || 0));
  const typeLabel = book?.content_type === 'song' ? t('rhymes') : t('audioStory');

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${BRAND_HERO_GRADIENT} flex items-center justify-center pb-32`}>
        <div className="text-white text-2xl font-black animate-pulse">{t('loading')}</div>
        <KidsBottomNav />
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${BRAND_HERO_GRADIENT} text-white pb-32 overflow-hidden relative`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-secondary-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-6">
        <header className="mb-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/kids/audio')}
            className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20"
            aria-label={t('back')}
          >
            <ChevronLeftIcon className="h-7 w-7" />
          </button>
          <Link to="/kids" className="shrink-0">
            <Logo size="default" showText={false} />
          </Link>
          <div className="flex gap-2">
            <Link to="/kids" className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 border border-white/20" aria-label={t('kidsNavHome')}>
              <HomeIcon className="h-6 w-6" />
            </Link>
            <button type="button" onClick={handleLogout} className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 border border-white/20" aria-label="Logout">
              <LogOutIcon className="h-6 w-6" />
            </button>
          </div>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black backdrop-blur-md border border-white/25">
            <AudioIcon className="h-5 w-5" />
            {typeLabel}
          </span>

          <motion.div
            animate={player.playing ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={{ duration: 2, repeat: player.playing ? Infinity : 0 }}
            className="mb-8 w-56 h-56 md:w-72 md:h-72 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/30"
          >
            {book.cover_image ? (
              <img src={getImageUrl(book.cover_image, 'book')} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center bg-white/10 text-8xl">🎵</div>
            )}
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-black mb-2 drop-shadow-lg hidden sm:block">{book.title}</h1>

          {player.error && (
            <p className="mb-4 rounded-2xl bg-rose-500/30 px-4 py-2 text-sm font-bold border border-rose-300/40">
              {player.error}
            </p>
          )}

          {!book.audio_url && (
            <p className="mb-6 rounded-2xl bg-accent-500/30 px-4 py-3 font-bold border border-accent-300/40">
              {t('audioUnavailable')}
            </p>
          )}

          <div className="w-full max-w-md mb-8">
            <input
              type="range"
              min={0}
              max={progressMax || 1}
              value={progressValue}
              onChange={(e) => player.seekTo(e.target.value)}
              className="w-full h-3 rounded-full appearance-none bg-white/20 accent-secondary-400"
              aria-label="Progression"
            />
            <div className="flex justify-between text-sm font-bold text-white/70 mt-2">
              <span>{formatTime(player.currentTime)}</span>
              <span>{formatTime(player.duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-8">
            <button
              type="button"
              onClick={() => player.seekBy(-10)}
              className="grid h-16 w-16 place-items-center rounded-full bg-white/15 border border-white/25"
              aria-label="-10s"
            >
              <ChevronLeftIcon className="h-8 w-8" />
            </button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => (player.playing ? player.pause() : player.play(book))}
              disabled={!book.audio_url}
              className="grid h-28 w-28 place-items-center rounded-full bg-white text-primary-600 shadow-2xl disabled:opacity-40"
              aria-label={player.playing ? t('pause') : t('listenAction')}
            >
              {player.playing ? <PauseIcon className="h-14 w-14" /> : <PlayIcon className={`h-14 w-14 ${isRtl ? 'rotate-180' : ''}`} filled />}
            </motion.button>
            <button
              type="button"
              onClick={() => player.seekBy(10)}
              className="grid h-16 w-16 place-items-center rounded-full bg-white/15 border border-white/25"
              aria-label="+10s"
            >
              <ChevronRightIcon className="h-8 w-8" />
            </button>
          </div>

          <button
            type="button"
            onClick={toggleFavorite}
            className="inline-flex items-center gap-3 rounded-full bg-white/15 px-8 py-4 font-black border border-white/25 hover:bg-white/25 transition"
          >
            <HeartIcon className="h-7 w-7" filled={favorite} />
            {favorite ? t('yourFavorites') : t('addFavorite')}
          </button>
        </motion.main>
      </div>

      <VoiceAssistant
        language={language === 'en' ? 'en-US' : language === 'ar' ? 'ar-MA' : 'fr-FR'}
        onNavigate={(path) => navigate(path)}
      />
      <KidsBottomNav />
    </div>
  );
}

export default KidsListen;
