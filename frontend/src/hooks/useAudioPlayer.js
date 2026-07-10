import { useEffect, useRef, useState } from 'react';
import { voicesAPI } from '../api/voices';
import { getFileUrl } from '../utils/fileUrl';
import { storage } from '../utils/storage';
import { isAndroidAudioUnlocked, primeAudioElement, unlockAndroidAudio } from '../services/mobile/androidAudio';

const initialState = {
  currentTime: 0,
  duration: 0,
  volume: 0.85,
  playing: false,
  loading: false,
  error: null,
};

export function useAudioPlayer() {
  const audioRef = useRef(null);
  const activeBookRef = useRef(null);
  const objectUrlRef = useRef(null);
  const playRequestRef = useRef(0);
  const listenedFromRef = useRef(0);
  const [activeBook, setActiveBook] = useState(null);
  const [state, setState] = useState(initialState);

  useEffect(() => {
    return () => {
      recordListening(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const patchState = (partial) => {
    setState((current) => ({ ...current, ...partial }));
  };

  const recordListening = (completed = false) => {
    const book = activeBookRef.current;
    const audio = audioRef.current;
    if (!book || !audio) return;

    const currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const listenedSeconds = Math.max(0, currentTime - listenedFromRef.current);

    if (listenedSeconds < 1 && !completed) return;

    storage.addListeningHistory({
      bookId: book.id,
      bookTitle: book.title,
      audioUrl: book.audio_url,
      listenedSeconds,
      currentTime,
      duration,
      completed,
      offlineReady: storage.isDownloaded(book.id),
    });
  };

  const attachAudioEvents = (audio) => {
    audio.onloadedmetadata = () => {
      patchState({
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
        loading: false,
      });
    };

    audio.ontimeupdate = () => {
      patchState({
        currentTime: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
      });
    };

    audio.onplay = () => patchState({ playing: true, loading: false, error: null });
    audio.onpause = () => patchState({ playing: false });
    audio.onwaiting = () => patchState({ loading: true });
    audio.oncanplay = () => patchState({ loading: false });
    audio.onerror = () => {
      patchState({ playing: false, loading: false, error: "Impossible de lire l'audio" });
    };
    audio.onended = () => {
      recordListening(true);
      listenedFromRef.current = 0;
      patchState({ playing: false, currentTime: 0 });
    };
  };

  const releaseObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const loadBook = async (book, audioUrlOverride = null, requestId = playRequestRef.current) => {
    const sourceUrl = audioUrlOverride || book.audio_url;
    let audioUrl = getFileUrl(sourceUrl);
    let nextObjectUrl = null;
    if (String(sourceUrl || '').includes('/api/voices/files/')) {
      const response = await voicesAPI.getAudioBlob(sourceUrl);
      nextObjectUrl = URL.createObjectURL(response.data);
      audioUrl = nextObjectUrl;
    }
    if (requestId !== playRequestRef.current) {
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
      return null;
    }

    recordListening(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    releaseObjectUrl();
    objectUrlRef.current = nextObjectUrl;
    const audio = primeAudioElement(new Audio(audioUrl));
    audio.volume = state.volume;
    attachAudioEvents(audio);

    audioRef.current = audio;
    activeBookRef.current = { ...book, audio_url: sourceUrl };
    listenedFromRef.current = 0;
    setActiveBook(activeBookRef.current);
    patchState({ currentTime: 0, duration: 0, loading: true, error: null, playing: false });

    return audio;
  };

  const resolveAudioSource = async (book, { voiceId } = {}) => {
    if (!book) return null;
    if (!voiceId) return book.audio_url;

    try {
      patchState({ loading: true, error: null });
      const response = await voicesAPI.generateNarration({
        book_id: book.id,
        voice_profile_id: voiceId,
      });
      return response.data?.audio_url || book.audio_url;
    } catch (error) {
      console.warn('Cloned narration unavailable, falling back to original audio:', error);
      return book.audio_url;
    }
  };

  const play = async (book = activeBookRef.current, options = {}) => {
    const requestId = ++playRequestRef.current;
    if (!book) {
      patchState({ error: 'Audio indisponible' });
      return false;
    }

    const resolvedAudioUrl = await resolveAudioSource(book, options);
    if (requestId !== playRequestRef.current) return false;

    if (!resolvedAudioUrl) {
      patchState({ error: 'Audio indisponible' });
      return false;
    }

    const shouldReuseCurrentAudio = activeBookRef.current?.id === book.id
      && activeBookRef.current?.audio_url === resolvedAudioUrl
      && audioRef.current;

    try {
      if (!isAndroidAudioUnlocked()) {
        await unlockAndroidAudio();
      }
      let audio;
      try {
        audio = shouldReuseCurrentAudio
          ? audioRef.current
          : await loadBook(book, resolvedAudioUrl, requestId);
        if (!audio) return false;
      } catch (error) {
        console.warn('Protected narration could not be loaded, falling back to original audio:', error);
        if (!book.audio_url || book.audio_url === resolvedAudioUrl) throw error;
        audio = await loadBook(book, book.audio_url, requestId);
        if (!audio) return false;
      }
      listenedFromRef.current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      await audio.play();
      return true;
    } catch (error) {
      patchState({
        playing: false,
        loading: false,
        error: error?.response ? "Impossible de charger l'audio" : "Le navigateur a bloque la lecture audio"
      });
      return false;
    }
  };

  const pause = () => {
    if (!audioRef.current) return;
    recordListening(false);
    audioRef.current.pause();
  };

  const toggle = (book, options = {}) => {
    if (activeBookRef.current?.id === book.id && state.playing) {
      pause();
      return;
    }
    play(book, options);
  };

  const seekBy = (seconds) => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const nextTime = Math.max(0, Math.min(duration || Infinity, audio.currentTime + seconds));
    audio.currentTime = nextTime;
    patchState({ currentTime: nextTime });
  };

  const seekTo = (value) => {
    if (!audioRef.current) return;
    const nextTime = Math.max(0, Number(value) || 0);
    audioRef.current.currentTime = nextTime;
    patchState({ currentTime: nextTime });
  };

  const setVolume = (value) => {
    const volume = Math.max(0, Math.min(1, Number(value)));
    if (audioRef.current) audioRef.current.volume = volume;
    patchState({ volume });
  };

  const stop = () => {
    playRequestRef.current += 1;
    recordListening(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    releaseObjectUrl();
    activeBookRef.current = null;
    setActiveBook(null);
    patchState({ ...initialState, volume: state.volume });
  };

  return {
    activeBook,
    currentTime: state.currentTime,
    duration: state.duration,
    volume: state.volume,
    playing: state.playing,
    loading: state.loading,
    error: state.error,
    play,
    pause,
    toggle,
    seekBy,
    seekTo,
    setVolume,
    stop,
  };
}
