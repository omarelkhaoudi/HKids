import { useEffect, useRef, useState } from 'react';
import { getFileUrl } from '../utils/fileUrl';
import { storage } from '../utils/storage';

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

  const loadBook = (book) => {
    recordListening(false);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audioUrl = getFileUrl(book.audio_url);
    const audio = new Audio(audioUrl);
    audio.volume = state.volume;
    attachAudioEvents(audio);

    audioRef.current = audio;
    activeBookRef.current = book;
    listenedFromRef.current = 0;
    setActiveBook(book);
    patchState({ currentTime: 0, duration: 0, loading: true, error: null, playing: false });

    return audio;
  };

  const play = async (book = activeBookRef.current) => {
    if (!book?.audio_url) {
      patchState({ error: 'Audio indisponible' });
      return false;
    }

    const audio = activeBookRef.current?.id === book.id && audioRef.current
      ? audioRef.current
      : loadBook(book);

    try {
      listenedFromRef.current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      await audio.play();
      return true;
    } catch {
      patchState({ playing: false, loading: false, error: "Le navigateur a bloque la lecture audio" });
      return false;
    }
  };

  const pause = () => {
    if (!audioRef.current) return;
    recordListening(false);
    audioRef.current.pause();
  };

  const toggle = (book) => {
    if (activeBookRef.current?.id === book.id && state.playing) {
      pause();
      return;
    }
    play(book);
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
    recordListening(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
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
