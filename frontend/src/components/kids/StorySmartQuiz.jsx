import { useState } from 'react';
import { motion } from 'framer-motion';
import { luLabel } from '../../constants/learningUniverseLabels';
import { playKidsUiSound } from '../../utils/kidsUiSound';

export function StorySmartQuiz({
  quiz,
  language = 'fr',
  onAnswer,
  onSkip,
  reducedMotion = false,
}) {
  const [feedback, setFeedback] = useState(null);

  if (!quiz) return null;

  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-32 bg-card/95 border border-border p-space-24 shadow-floating text-center"
      aria-label={luLabel(quiz.promptKey, language)}
    >
      <p className="text-caption font-bold text-primary-600 mb-2">🧠</p>
      <h3 className="text-heading-m font-black mb-space-16">
        {luLabel(quiz.promptKey, language)}
      </h3>
      {quiz.bookTitle ? (
        <p className="text-caption text-foreground-muted mb-space-16 line-clamp-1">{quiz.bookTitle}</p>
      ) : null}
      <div className="grid grid-cols-3 gap-3 mb-space-16">
        {quiz.options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={!!feedback}
            onClick={() => {
              const ok = Boolean(opt.correct);
              playKidsUiSound(ok ? 'success' : 'tap');
              setFeedback(ok ? 'ok' : 'no');
              onAnswer?.(ok);
            }}
            className="min-h-[5.5rem] rounded-24 border-2 border-border bg-surface-secondary text-5xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
          >
            {opt.label}
          </button>
        ))}
      </div>
      {feedback === 'ok' && (
        <p className="text-heading-m text-success-700 font-black mb-3">{luLabel('luCorrect', language)} ⭐</p>
      )}
      {feedback === 'no' && (
        <p className="text-caption font-bold text-warning-700 mb-3">{luLabel('luTryAgain', language)}</p>
      )}
      <button
        type="button"
        onClick={onSkip}
        className="min-h-touch text-caption font-bold text-foreground-muted underline"
      >
        {luLabel('luSkipQuiz', language)}
      </button>
    </motion.section>
  );
}

export default StorySmartQuiz;
