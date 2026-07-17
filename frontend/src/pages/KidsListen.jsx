import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { booksAPI } from '../api/books';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { useLanguage } from '../context/LanguageContext';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { getMotionProps, kidsCardAppear } from '../constants/kidsMotion';
import { KidsBookCover } from '../components/kids/KidsBookCover';
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
  const reducedMotion = useReducedMotion();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const playFeedbackShown = useRef(false);

  const player = useAudioPlayer();
  const listeningHistory = storage.getListeningHistory().filter((item) => String(item.bookId) !== String(id));

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
      <KidsPageShell isRtl={isRtl} variant="library" world="audio" className="pb-space-32 kids-listen-atmosphere" footer={<KidsBottomNav />}>
        <KidsPageHeader backTo="/kids/audio" emoji="🎧" />
        <div className="px-6 py-space-32">
          <BookGridSkeleton count={1} variant="carousel" />
        </div>
      </KidsPageShell>
    );
  }

  if (!book) return null;

  return (
    <KidsPageShell isRtl={isRtl} variant="library" world="audio" className="pb-space-32 kids-listen-atmosphere kids-glow-audio" footer={<KidsBottomNav />}>
      <KidsPageHeader backTo="/kids/audio" onBack={() => navigate('/kids/audio')} emoji="🎧" />

      <div className="relative z-10 mx-auto max-w-4xl px-space-16 py-space-16 md:px-space-32">
        <motion.main
          {...getMotionProps(reducedMotion, kidsCardAppear)}
          className="kids-listen-panel p-space-24 md:p-space-40 flex flex-col items-center text-center relative"
        >
          <KidsFeedbackBurst type={feedback} active={Boolean(feedback)} />

          <span className="mb-space-16 inline-flex min-h-touch items-center gap-space-8 rounded-full bg-orange-100 text-orange-700 px-space-16 py-space-8 text-caption font-black border border-orange-200">
            <AudioIcon className="h-5 w-5" />
            {typeLabel}
          </span>

          <motion.div
            className={`relative mb-space-24 w-56 h-56 md:w-72 md:h-72 rounded-32 overflow-hidden shadow-floating border-4 border-white/80 ${!reducedMotion && player.playing ? 'kids-audio-pulse' : ''}`}
          >
            <KidsBookCover
              book={book}
              alt={book.title}
              imgClassName="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-900/35 via-transparent to-transparent pointer-events-none" />
          </motion.div>

          <h1 className="text-heading-l md:text-heading-xl mb-space-16 text-foreground max-w-2xl">{book.title}</h1>

          {player.playing && !reducedMotion && (
            <div className="kids-listen-wave mb-space-16" aria-hidden="true">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} style={{ animationDelay: `${i * 0.12}s`, height: `${10 + (i % 3) * 6}px` }} />
              ))}
            </div>
          )}

          {player.error && <KidsErrorBanner message={player.error} className="mb-space-16 w-full" />}

          {!book.audio_url && (
            <KidsErrorBanner message={t('audioUnavailable')} className="mb-space-24 w-full" />
          )}

          <div className="w-full max-w-md mb-space-24">
            <input
              type="range"
              min={0}
              max={progressMax || 1}
              value={progressValue}
              onChange={(e) => player.seekTo(e.target.value)}
              className="kids-audio-scrubber w-full mb-space-8 accent-orange-500"
              aria-label="Progression"
            />
            <div className="flex justify-between text-caption font-bold text-foreground-muted">
              <span>{formatTime(player.currentTime)}</span>
              <span>{formatTime(player.duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-space-24 mb-space-24">
            <button
              type="button"
              onClick={() => player.seekBy(-10)}
              className="kids-touch-target grid h-16 w-16 min-h-touch-kids min-w-touch-kids place-items-center rounded-full bg-primary-50 border-2 border-primary-100 text-primary-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
              aria-label="-10s"
            >
              <ChevronLeftIcon className="h-8 w-8" />
            </button>
            <button
              type="button"
              onClick={() => (player.playing ? player.pause() : player.play(book))}
              disabled={!book.audio_url}
              className={`kids-touch-target grid h-28 w-28 min-h-touch-kids min-w-touch-kids place-items-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-glow disabled:opacity-40 border-4 border-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300 ${!reducedMotion && player.playing ? 'kids-audio-pulse' : ''}`}
              aria-label={player.playing ? t('pause') : t('listenAction')}
            >
              {player.playing ? <PauseIcon className="h-14 w-14" /> : <PlayIcon className={`h-14 w-14 ${isRtl ? 'rotate-180' : ''}`} filled />}
            </button>
            <button
              type="button"
              onClick={() => player.seekBy(10)}
              className="kids-touch-target grid h-16 w-16 min-h-touch-kids min-w-touch-kids place-items-center rounded-full bg-primary-50 border-2 border-primary-100 text-primary-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
              aria-label="+10s"
            >
              <ChevronRightIcon className="h-8 w-8" />
            </button>
          </div>

          <button
            type="button"
            onClick={toggleFavorite}
            className="kids-touch-target inline-flex min-h-touch-kids items-center gap-space-12 rounded-full bg-orange-100 text-orange-800 px-space-24 py-space-12 font-black border-2 border-orange-200 hover:bg-orange-200 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300"
          >
            <HeartIcon className="h-7 w-7" filled={favorite} />
            {favorite ? t('yourFavorites') : t('addToFavorites')}
          </button>
        </motion.main>

        {listeningHistory.length > 0 && (
          <section className="mt-space-32" aria-label={t('continueReading')}>
            <h2 className="kids-shelf-title mb-space-16 px-space-8">
              <span aria-hidden="true">🎧</span>
              <span>{t('continueReading')}</span>
            </h2>
            <div className="kids-gallery-rail">
              {listeningHistory.slice(0, 8).map((item) => (
                <button
                  key={item.bookId}
                  type="button"
                  onClick={() => navigate(`/kids/listen/${item.bookId}`)}
                  className="snap-start shrink-0 w-44 rounded-24 bg-card border-4 border-border shadow-card p-space-16 text-left hover:shadow-floating transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300"
                >
                  <div className="relative aspect-[3/4] rounded-16 overflow-hidden mb-space-12 bg-surface-secondary">
                    <KidsBookCover
                      book={{ id: item.bookId, title: item.bookTitle, slug: item.slug, cover_image: item.cover_image }}
                      alt={item.bookTitle}
                      imgClassName="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <p className="kids-book-title text-sm line-clamp-2">{item.bookTitle}</p>
                  {item.duration > 0 && (
                    <p className="text-caption text-foreground-muted mt-space-4">
                      {Math.round((item.currentTime / item.duration) * 100)}%
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <VoiceAssistant
        language={language === 'en' ? 'en-US' : language === 'ar' ? 'ar-MA' : 'fr-FR'}
        onNavigate={(path) => navigate(path)}
      />
    </KidsPageShell>
  );
}

export default KidsListen;
