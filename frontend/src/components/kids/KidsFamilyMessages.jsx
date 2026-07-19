import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { voicesAPI } from '../../api/voices';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../ToastProvider';
import { PlayIcon, PauseIcon } from '../Icons';
import KidsButton from './KidsButton';

export function KidsFamilyMessages({ className = '' }) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    let active = true;

    const loadMessages = async () => {
      try {
        setLoading(true);
        const response = await voicesAPI.getAvailableMessages();
        if (!active) return;
        setMessages(Array.isArray(response.data) ? response.data : []);
      } catch {
        if (active) setMessages([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMessages();
    return () => {
      active = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingId(null);
  };

  const handlePlay = async (message) => {
    if (playingId === message.id) {
      stopPlayback();
      return;
    }

    try {
      stopPlayback();
      const response = await voicesAPI.getMessageAudioBlob(message.id);
      const blobUrl = URL.createObjectURL(response.data);
      const audio = new Audio(blobUrl);
      audioRef.current = audio;
      setPlayingId(message.id);
      audio.onended = () => {
        URL.revokeObjectURL(blobUrl);
        stopPlayback();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        stopPlayback();
        showToast(t('familyMessagePlayError'), 'error');
      };
      await audio.play();
    } catch {
      showToast(t('familyMessagePlayError'), 'error');
      stopPlayback();
    }
  };

  if (loading) {
    return (
      <section className={className}>
        <h2 className="kids-shelf-title mb-4 pl-2">
          <span aria-hidden="true">💌</span>
          <span>{t('familyMessagesTitle')}</span>
        </h2>
        <div className="flex gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 w-56 rounded-[2rem] bg-surface-secondary animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (messages.length === 0) {
    return (
      <section className={`${className} rounded-[2rem] border border-dashed border-border bg-card/60 p-6 text-center`}>
        <p className="text-4xl mb-2" aria-hidden="true">🎙️</p>
        <p className="kids-shelf-subtitle !mx-auto !mt-0">{t('parentFamilyMessagesEmpty')}</p>
      </section>
    );
  }

  return (
    <section className={className}>
      <h2 className="kids-shelf-title mb-4 pl-2">
        <span aria-hidden="true">💌</span>
        <span>{t('familyMessagesTitle')}</span>
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x custom-scrollbar">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="snap-start shrink-0 w-56 rounded-[2rem] bg-gradient-to-br from-rose-100 via-primary-50 to-secondary-50 border-4 border-white shadow-lg p-5 flex flex-col items-center text-center gap-4"
          >
            <div className="text-5xl" aria-hidden="true">🎙️</div>
            <p className="kids-book-title text-center">
              {message.title || t('familyMessageDefault')}
            </p>
            <KidsButton
              size="sm"
              variant={playingId === message.id ? 'accent' : 'secondary'}
              icon={playingId === message.id ? PauseIcon : PlayIcon}
              className="w-full"
              onClick={() => handlePlay(message)}
              aria-label={t('familyMessageListen')}
            >
              {playingId === message.id ? t('pause') : t('listenAction')}
            </KidsButton>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default KidsFamilyMessages;
