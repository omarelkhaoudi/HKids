import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiAPI } from '../../api/ai';
import { MicrophoneIcon, SparklesIcon, XIcon } from '../Icons';
import { useLanguage } from '../../context/LanguageContext';
import { isAudioRecordingSupported, recordAudioClip } from '../../services/ai/browserSpeechRecognition';
import { ensureMicrophonePermission } from '../../services/mobile/androidPermissions';
import { speakText, stopSpeaking } from '../../services/ai/browserTextToSpeech';
import { BRAND_HERO_GRADIENT } from '../../constants/brandTheme';

function isExpectedVoiceRecordingError(error) {
  const message = String(error?.message || error?.response?.data?.error || '').toLowerCase();
  return (
    message.includes('micro') ||
    message.includes('audio') ||
    message.includes('enregistrement') ||
    message.includes('transcription')
  );
}

function toSpeechLanguage(language) {
  if (language === 'en') return 'en-US';
  if (language === 'ar') return 'ar-MA';
  return 'fr-FR';
}

const NAVIGATION_INTENTS = [
  { path: '/kids/library', keywords: ['bibliotheque', 'bibliothèque', 'library', 'مكتبة', 'livres', 'books'] },
  { path: '/kids', keywords: ['accueil', 'home', 'maison', 'الرئيسية'] },
  { path: '/kids/library?theme=dinosaurs', keywords: ['dinosaure', 'dinosaur', 'dino', 'ديناصور'] },
  { path: '/kids/library?theme=space', keywords: ['espace', 'space', 'fusee', 'fusée', 'rocket', 'فضاء'] },
  { path: '/kids/learning', keywords: ['jouer', 'jeux', 'games', 'quiz', 'learning', 'لعب'] },
  { path: '/kids/audio', keywords: ['audio', 'ecouter', 'écouter', 'comptine', 'comptines', 'chanson', 'musique', 'استمع'] },
  { path: '/kids/story-studio', keywords: ['story studio', 'studio', 'creer une histoire', 'créer une histoire', 'استوديو'] },
  { path: '/kids/ai-stories', keywords: ['mes histoires', 'ai stories', 'histoires ia', 'قصصي'] },
  { path: '/kids#medals', keywords: ['medailles', 'médailles', 'medals', 'badge', 'ميداليات'] },
];

export function resolveVoiceNavigation(transcript = '') {
  const normalized = String(transcript).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const match = NAVIGATION_INTENTS.find((intent) => (
    intent.keywords.some((keyword) => normalized.includes(keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))
  ));
  return match?.path || null;
}

export function VoiceAssistant({ language: requestedSpeechLanguage, onNavigate }) {
  const { language, t, isRtl } = useLanguage();
  const speechLanguage = requestedSpeechLanguage || toSpeechLanguage(language);
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState('');
  const [manualText, setManualText] = useState('');
  const [messages, setMessages] = useState(() => [
    {
      role: 'assistant',
      text: t('assistantTapAndTalk'),
      includeInContext: false,
    },
  ]);
  const [error, setError] = useState('');
  const [voiceUnavailable, setVoiceUnavailable] = useState(false);

  const canUseVoice = useMemo(() => isAudioRecordingSupported(), []);
  const quickVoiceActions = useMemo(() => [
    { icon: '🎧', label: t('assistantQuickAudio'), prompt: t('assistantPromptAudio') },
    { icon: '🦖', label: t('assistantQuickDino'), prompt: t('assistantPromptDino') },
    { icon: '🚀', label: t('assistantQuickRocket'), prompt: t('assistantPromptRocket') },
  ], [t]);

  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    setMessages((current) => {
      if (current.length > 1 || current[0]?.includeInContext !== false) return current;
      return [{ ...current[0], text: t('assistantTapAndTalk') }];
    });
  }, [t]);

  const addMessage = (role, text) => {
    setMessages((current) => [...current, { role, text }].slice(-8));
  };

  const sendTranscriptToAssistant = async (transcript) => {
    const navigationPath = resolveVoiceNavigation(transcript);
    if (navigationPath && onNavigate) {
      addMessage('kid', transcript);
      addMessage('assistant', t('assistantNavigating'));
      onNavigate(navigationPath);
      return;
    }

    const conversation = messages
      .filter((message) => message.includeInContext !== false)
      .map((message) => ({
        role: message.role,
        text: message.text,
      }));

    addMessage('kid', transcript);
    setThinking(true);
    setMessages((current) => [...current, { role: 'assistant', text: '' }].slice(-8));

    let streamedText = '';
    let reply;
    try {
      reply = await aiAPI.streamVoiceAssistantRequest(
        transcript,
        conversation,
        speechLanguage,
        {
          onDelta: (chunk) => {
            streamedText += chunk;
            setMessages((current) => current.map((message, index) => (
              index === current.length - 1 && message.role === 'assistant'
                ? { ...message, text: streamedText }
                : message
            )));
          }
        }
      );
    } catch (streamError) {
      // Keep the historical JSON endpoint as a compatibility fallback.
      if (streamError.response?.data?.code) {
        setMessages((current) => current.filter((message, index) => (
          index !== current.length - 1 || message.role !== 'assistant'
        )));
        throw streamError;
      }
      console.warn('Voice assistant stream unavailable, using JSON fallback:', streamError);
      const response = await aiAPI.sendVoiceAssistantRequest(transcript, conversation, speechLanguage);
      reply = response.data;
    }

    const replyText = reply?.reply_text || streamedText || t('assistantFallbackReply');
    setMessages((current) => current.map((message, index) => (
      index === current.length - 1 && message.role === 'assistant'
        ? { ...message, text: replyText }
        : message
    )));
    setThinking(false);

    try {
      await speakText(replyText, { language: reply?.language || speechLanguage });
    } catch {
      // Text is already displayed; audio playback is a progressive enhancement.
    }
  };

  const handleAsk = async () => {
    setOpen(true);
    setError('');
    setTranscriptPreview('');

    if (!canUseVoice || voiceUnavailable) {
      setVoiceUnavailable(true);
      setError(t('assistantMicUnavailable'));
      return;
    }

    try {
      setListening(true);
      const micAllowed = await ensureMicrophonePermission();
      if (!micAllowed) {
        setVoiceUnavailable(true);
        setError(t('assistantMicUnavailable'));
        setListening(false);
        return;
      }
      const result = await recordAudioClip({
        onRecordingStart: () => setTranscriptPreview(''),
      });
      const transcription = await aiAPI.transcribeVoice({
        audioBlob: result.audioBlob,
        language: speechLanguage,
      });
      const transcript = String(transcription.data?.transcript || '').trim();
      setListening(false);
      setTranscriptPreview(transcript);
      if (!transcript) {
        setError(t('assistantDidNotHear'));
        return;
      }

      await sendTranscriptToAssistant(transcript);
    } catch (err) {
      setListening(false);
      setThinking(false);
      const message = err.response?.data?.error || err.message || t('assistantNetworkError');
      if (isExpectedVoiceRecordingError(err)) {
        setVoiceUnavailable(true);
      } else {
        console.warn('Voice assistant error:', err);
      }
      setError(message);
    }
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    const text = manualText.trim();
    if (!text || thinking || listening) return;

    setOpen(true);
    setError('');
    setManualText('');
    setTranscriptPreview('');

    try {
      await sendTranscriptToAssistant(text);
    } catch (err) {
      console.warn('Voice assistant text fallback error:', err);
      setThinking(false);
      setError(err.response?.data?.error || err.message || t('assistantNetworkError'));
    }
  };

  const handleQuickAction = async (prompt) => {
    if (thinking || listening) return;
    setOpen(true);
    setError('');
    setTranscriptPreview('');

    try {
      await sendTranscriptToAssistant(prompt);
    } catch (err) {
      console.warn('Voice assistant quick action error:', err);
      setThinking(false);
      setError(err.response?.data?.error || err.message || t('assistantNetworkError'));
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (voiceUnavailable || !canUseVoice) {
            setOpen(true);
            setError(t('assistantMicUnavailable'));
            return;
          }
          handleAsk();
        }}
        className={`fixed bottom-40 z-50 grid h-20 w-20 place-items-center rounded-full text-white shadow-2xl ${isRtl ? 'left-6' : 'right-6'} ${
          listening
            ? 'bg-gradient-to-br from-accent-400 to-accent-500'
            : `bg-gradient-to-br ${BRAND_HERO_GRADIENT}`
        }`}
        aria-label={t('assistantVoice')}
        title={t('assistantVoice')}
      >
        <MicrophoneIcon className="h-9 w-9" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            className={`fixed bottom-52 z-50 w-[min(92vw,420px)] overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-primary-100 ${isRtl ? 'left-4' : 'right-4'}`}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className={`bg-gradient-to-r ${BRAND_HERO_GRADIENT} p-4 text-white`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20">
                    <SparklesIcon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-lg font-black">{t('assistantVoice')}</p>
                    <p className="text-xs font-bold text-white/80">
                      {listening ? t('assistantRecording') : thinking ? t('assistantThinking') : voiceUnavailable ? t('assistantTextAvailable') : t('assistantReady')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setOpen(false);
                    stopSpeaking();
                  }}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/20 transition hover:bg-white/30"
                  aria-label={t('close')}
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-80 space-y-3 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-2xl px-4 py-3 text-sm font-bold leading-relaxed ${
                    message.role === 'kid'
                      ? `${isRtl ? 'mr-8' : 'ml-8'} bg-primary-100 text-primary-900`
                      : `${isRtl ? 'ml-8' : 'mr-8'} bg-surface-100 text-surface-800`
                  }`}
                >
                  {message.text}
                </div>
              ))}

              {transcriptPreview && listening && (
                <div className={`${isRtl ? 'mr-8' : 'ml-8'} rounded-2xl bg-primary-50 px-4 py-3 text-sm font-bold text-primary-800`}>
                  {transcriptPreview}
                </div>
              )}

              {(listening || thinking) && (
                <div className={`${isRtl ? 'ml-8' : 'mr-8'} rounded-2xl bg-primary-50 px-4 py-3 text-sm font-bold text-foreground-700`}>
                  {listening ? t('assistantSpeakNow') : t('assistantSearching')}
                </div>
              )}

              {error && (
                <div className="rounded-2xl bg-accent-50 px-4 py-3 text-sm font-bold text-accent-800">
                  {error}
                </div>
              )}
            </div>

            <div className="border-t border-surface-100 p-4">
              <div className="mb-3 grid grid-cols-3 gap-2">
                {quickVoiceActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleQuickAction(action.prompt)}
                    disabled={listening || thinking}
                    className="grid min-h-20 place-items-center rounded-2xl bg-surface-100 text-surface-900 transition hover:bg-surface-200 disabled:opacity-60"
                    aria-label={action.prompt}
                    title={action.label}
                  >
                    <span className="text-3xl" aria-hidden="true">{action.icon}</span>
                    <span className="text-xs font-black">{action.label}</span>
                  </button>
                ))}
              </div>
              <form onSubmit={handleManualSubmit} className="mb-3 flex gap-2">
                <input
                  value={manualText}
                  onChange={(event) => setManualText(event.target.value)}
                  disabled={listening || thinking}
                  className="min-w-0 flex-1 rounded-2xl border-2 border-surface-100 px-4 py-3 text-sm font-bold text-surface-900 outline-none transition focus:border-secondary-300 disabled:opacity-60"
                  placeholder={t('assistantPlaceholder')}
                />
                <button
                  type="submit"
                  disabled={!manualText.trim() || listening || thinking}
                  className="rounded-2xl bg-secondary-500 px-4 py-3 text-sm font-black text-white transition hover:bg-secondary-600 disabled:opacity-60"
                >
                  {t('assistantSend')}
                </button>
              </form>
              <button
                onClick={handleAsk}
                disabled={listening || thinking || voiceUnavailable || !canUseVoice}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-surface-900 text-base font-black text-white transition hover:bg-surface-800 disabled:opacity-60"
              >
                <MicrophoneIcon className="h-6 w-6" />
                {listening ? t('assistantRecording') : thinking ? t('assistantWaiting') : voiceUnavailable || !canUseVoice ? t('assistantMicDisabled') : t('assistantTalk')}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
