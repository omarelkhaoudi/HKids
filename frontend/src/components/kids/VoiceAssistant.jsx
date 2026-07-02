import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiAPI } from '../../api/ai';
import { MicrophoneIcon, SparklesIcon, XIcon } from '../Icons';
import { isMicrophoneSupported, isSpeechRecognitionSupported, recordAndTranscribe } from '../../services/ai/browserSpeechRecognition';
import { speakText, stopSpeaking } from '../../services/ai/browserTextToSpeech';

const initialMessages = [
  {
    role: 'assistant',
    text: 'Appuie sur le micro et demande une histoire.',
  },
];

export function VoiceAssistant({ language = 'fr-FR' }) {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [error, setError] = useState('');

  const canUseVoice = useMemo(() => (
    isMicrophoneSupported() && isSpeechRecognitionSupported()
  ), []);

  useEffect(() => () => stopSpeaking(), []);

  const addMessage = (role, text) => {
    setMessages((current) => [...current, { role, text }].slice(-8));
  };

  const handleAsk = async () => {
    setOpen(true);
    setError('');
    setTranscriptPreview('');

    if (!canUseVoice) {
      setError("Micro ou reconnaissance vocale indisponible sur ce navigateur.");
      return;
    }

    try {
      setListening(true);
      const result = await recordAndTranscribe({
        language,
        onRecordingStart: () => setTranscriptPreview(''),
        onTranscript: setTranscriptPreview,
      });
      setListening(false);

      const transcript = result.transcript.trim();
      if (!transcript) {
        setError("Je n ai pas bien entendu. Recommence doucement.");
        return;
      }

      addMessage('kid', transcript);
      setThinking(true);
      const response = await aiAPI.sendVoiceAssistantRequest(transcript);
      const replyText = response.data?.reply_text || "Je n ai pas encore de reponse.";
      addMessage('assistant', replyText);
      setThinking(false);

      try {
        await speakText(replyText, { language });
      } catch (speechError) {
        console.warn('TTS unavailable:', speechError);
        setError(speechError.message);
      }
    } catch (err) {
      console.error('Voice assistant error:', err);
      setListening(false);
      setThinking(false);
      setError(err.response?.data?.error || err.message || 'Erreur reseau avec l assistant.');
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleAsk}
        className={`fixed bottom-6 right-6 z-50 grid h-20 w-20 place-items-center rounded-full text-white shadow-2xl ${
          listening
            ? 'bg-gradient-to-br from-amber-400 to-orange-500'
            : 'bg-gradient-to-br from-red-500 via-pink-500 to-purple-500'
        }`}
        aria-label="Assistant vocal"
        title="Assistant vocal"
      >
        <MicrophoneIcon className="h-9 w-9" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            className="fixed bottom-28 right-4 z-50 w-[min(92vw,420px)] overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-red-100"
          >
            <div className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 p-4 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20">
                    <SparklesIcon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-lg font-black">Assistant vocal</p>
                    <p className="text-xs font-bold text-white/80">
                      {listening ? 'Je t ecoute...' : thinking ? 'Je reflechis...' : 'Pret'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setOpen(false);
                    stopSpeaking();
                  }}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/20 transition hover:bg-white/30"
                  aria-label="Fermer"
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
                      ? 'ml-8 bg-cyan-100 text-cyan-900'
                      : 'mr-8 bg-neutral-100 text-neutral-800'
                  }`}
                >
                  {message.text}
                </div>
              ))}

              {transcriptPreview && listening && (
                <div className="ml-8 rounded-2xl bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-800">
                  {transcriptPreview}
                </div>
              )}

              {(listening || thinking) && (
                <div className="mr-8 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {listening ? 'Parle maintenant...' : 'Recherche de reponse...'}
                </div>
              )}

              {error && (
                <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                  {error}
                </div>
              )}
            </div>

            <div className="border-t border-neutral-100 p-4">
              <button
                onClick={handleAsk}
                disabled={listening || thinking}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 text-base font-black text-white transition hover:bg-neutral-800 disabled:opacity-60"
              >
                <MicrophoneIcon className="h-6 w-6" />
                {listening ? 'Ecoute...' : thinking ? 'Patiente...' : 'Parler'}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
