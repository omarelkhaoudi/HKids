import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AudioIcon, PlayIcon } from '../Icons';
import { getFileUrl } from '../../utils/fileUrl';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion } from '../../constants/kidsMotion';

function QuestionAudioButton({ audioUrl, label = 'Écouter' }) {
  const audioRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const play = () => {
    const url = getFileUrl(audioUrl);
    if (!url) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
    } else {
      audioRef.current.src = url;
    }
    audioRef.current.play().catch(() => {});
  };

  if (!audioUrl) return null;

  return (
    <motion.button
      type="button"
      {...getHoverMotion(reducedMotion, {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
      })}
      onClick={play}
      className="mx-auto mb-space-24 flex min-h-touch-kids items-center gap-space-12 rounded-full bg-success-600 px-space-32 py-space-16 text-body-lg font-black text-white shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-success-300"
      aria-label={label}
    >
      <AudioIcon className="h-8 w-8" />
      <PlayIcon className="h-6 w-6" filled />
      {label}
    </motion.button>
  );
}

function OptionGrid({ options, questionId, answers, onChoose, disabled, columns = 'grid-cols-2 md:grid-cols-3' }) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={`grid ${columns} gap-space-16`}>
      {(options || []).map((option) => {
        const active = answers[questionId] === option.id;
        return (
          <motion.button
            key={option.id}
            type="button"
            {...getHoverMotion(reducedMotion, {
              whileHover: { scale: disabled ? 1 : 1.02 },
              whileTap: { scale: disabled ? 1 : 0.92 },
            })}
            onClick={() => !disabled && onChoose(questionId, option.id)}
            disabled={disabled}
            className={`flex flex-col items-center justify-center min-h-[8rem] rounded-24 border-4 p-space-16 text-center transition-all shadow-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-success-300 ${
              active
                ? 'border-success-500 bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-300 scale-105 shadow-card'
                : 'border-transparent bg-card hover:border-success-300'
            }`}
            aria-label={option.label}
          >
            <span className="text-6xl mb-space-8">{option.pictogram || option.label}</span>
            {option.pictogram && <span className="text-heading-m">{option.label}</span>}
          </motion.button>
        );
      })}
    </div>
  );
}

export function LearningQuizQuestion({
  question,
  answers,
  onChoose,
  disabled = false,
  listenLabel = 'Écouter',
}) {
  const questionType = question.question_type || 'multiple_choice';
  const showPrompt = questionType !== 'listen_answer' || !question.audio_url;

  return (
    <div className="rounded-24 bg-surface-secondary/50 p-space-24 md:p-space-32 border border-border">
      {showPrompt && (
        <p className="mb-space-24 text-heading-l text-center text-foreground">{question.prompt}</p>
      )}

      {(questionType === 'listen_answer' || question.audio_url) && (
        <QuestionAudioButton audioUrl={question.audio_url} label={listenLabel} />
      )}

      {questionType === 'true_false' ? (
        <OptionGrid
          options={question.options?.length ? question.options : [
            { id: 'true', label: 'Vrai', pictogram: '✅' },
            { id: 'false', label: 'Faux', pictogram: '❌' },
          ]}
          questionId={question.id}
          answers={answers}
          onChoose={onChoose}
          disabled={disabled}
          columns="grid-cols-2"
        />
      ) : (
        <OptionGrid
          options={question.options}
          questionId={question.id}
          answers={answers}
          onChoose={onChoose}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export function LearningMemoryGame({ pairs = [], answers, onChoose, disabled }) {
  const reducedMotion = useReducedMotion();
  const gameKey = 'memory_game';
  const selected = answers[gameKey] || [];

  const handlePick = (pairId) => {
    if (disabled) return;
    const next = selected.includes(pairId)
      ? selected.filter((id) => id !== pairId)
      : [...selected, pairId];
    onChoose(gameKey, next);
  };

  return (
    <div className="rounded-24 bg-surface-secondary/50 p-space-24 md:p-space-32 border border-border">
      <p className="mb-space-24 text-heading-l text-center text-foreground">Trouve les paires !</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-16">
        {pairs.map((pair) => {
          const active = selected.includes(pair.id);
          return (
            <motion.button
              key={pair.id}
              type="button"
              {...getHoverMotion(reducedMotion, { whileTap: { scale: 0.95 } })}
              onClick={() => handlePick(pair.id)}
              disabled={disabled}
              className={`min-h-[7rem] rounded-20 border-4 p-space-16 text-5xl font-black transition shadow-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-success-300 ${
                active ? 'border-success-500 bg-success-50 dark:bg-success-900/30' : 'border-transparent bg-card'
              }`}
            >
              {active ? pair.pictogram : '❓'}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default LearningQuizQuestion;
