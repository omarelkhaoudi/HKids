import { useRef } from 'react';
import { motion } from 'framer-motion';
import { AudioIcon, PlayIcon } from '../Icons';
import { getFileUrl } from '../../utils/fileUrl';

function QuestionAudioButton({ audioUrl, label = 'Écouter' }) {
  const audioRef = useRef(null);

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
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={play}
      className="mx-auto mb-6 flex items-center gap-3 rounded-full bg-primary-500 px-8 py-4 text-xl font-black text-white shadow-lg"
      aria-label={label}
    >
      <AudioIcon className="h-8 w-8" />
      <PlayIcon className="h-6 w-6" filled />
      {label}
    </motion.button>
  );
}

function OptionGrid({ options, questionId, answers, onChoose, disabled, columns = 'grid-cols-2 md:grid-cols-3' }) {
  return (
    <div className={`grid ${columns} gap-4`}>
      {(options || []).map((option) => {
        const active = answers[questionId] === option.id;
        return (
          <motion.button
            key={option.id}
            type="button"
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.92 }}
            onClick={() => !disabled && onChoose(questionId, option.id)}
            disabled={disabled}
            className={`flex flex-col items-center justify-center min-h-32 rounded-[1.75rem] border-4 p-4 text-center transition-all shadow-sm ${
              active
                ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 scale-105 shadow-md'
                : 'border-transparent bg-card hover:border-primary-300'
            }`}
            aria-label={option.label}
          >
            <span className="text-6xl mb-2">{option.pictogram || option.label}</span>
            {option.pictogram && <span className="text-xl font-black">{option.label}</span>}
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
    <div className="rounded-[2rem] bg-surface-secondary/50 p-6 md:p-8 border border-border">
      {showPrompt && (
        <p className="mb-6 text-3xl font-black text-center text-foreground">{question.prompt}</p>
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
    <div className="rounded-[2rem] bg-surface-secondary/50 p-6 md:p-8 border border-border">
      <p className="mb-6 text-2xl font-black text-center text-foreground">Trouve les paires !</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {pairs.map((pair) => {
          const active = selected.includes(pair.id);
          return (
            <motion.button
              key={pair.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePick(pair.id)}
              disabled={disabled}
              className={`min-h-28 rounded-[1.5rem] border-4 p-4 text-5xl font-black transition ${
                active ? 'border-secondary-500 bg-secondary-50' : 'border-transparent bg-card'
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
