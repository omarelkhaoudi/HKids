import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { eduLabel } from '../../constants/educationalWorldLabels';

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

export function LearningInteractiveChallenge({
  challenge,
  language = 'fr',
  onComplete,
  reducedMotion = false,
}) {
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matched, setMatched] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const rightOptions = useMemo(() => {
    if (challenge?.type !== 'match') return [];
    return shuffle(challenge.pairs.map((p) => ({ id: p.id, label: p.right })));
  }, [challenge]);

  if (!challenge) return null;

  const finishSuccess = () => {
    setFeedback('success');
    onComplete?.({ success: true, scorePercent: 100 });
  };

  const finishFail = () => {
    setFeedback('fail');
  };

  if (challenge.type === 'match') {
    const done = matched.length >= challenge.pairs.length;
    return (
      <div className="space-y-4">
        <h3 className="sr-only">{eduLabel('eduMatchTitle', language)}</h3>
        <p className="sr-only">{eduLabel('eduMatchHint', language)}</p>
        <div className="text-center text-6xl" aria-hidden="true">🧩</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            {challenge.pairs.map((pair) => {
              const isMatched = matched.includes(pair.id);
              return (
                <button
                  key={`l-${pair.id}`}
                  type="button"
                  disabled={isMatched || done}
                  onClick={() => setSelectedLeft(pair.id)}
                  className={`w-full min-h-touch-kids rounded-2xl border-2 px-4 py-3 text-2xl font-black transition ${
                    isMatched
                      ? 'border-success-300 bg-success-50 opacity-60'
                      : selectedLeft === pair.id
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-border bg-card'
                  }`}
                >
                  {pair.left}
                </button>
              );
            })}
          </div>
          <div className="space-y-2">
            {rightOptions.map((opt) => {
              const isMatched = matched.includes(opt.id);
              return (
                <button
                  key={`r-${opt.id}`}
                  type="button"
                  disabled={isMatched || done || !selectedLeft}
                  onClick={() => {
                    if (selectedLeft === opt.id) {
                      const next = [...matched, opt.id];
                      setMatched(next);
                      setSelectedLeft(null);
                      if (next.length >= challenge.pairs.length) finishSuccess();
                    } else {
                      setSelectedLeft(null);
                      finishFail();
                    }
                  }}
                  className={`w-full min-h-touch-kids rounded-2xl border-2 px-4 py-3 text-lg font-bold transition ${
                    isMatched ? 'border-success-300 bg-success-50 opacity-60' : 'border-border bg-card'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        {feedback === 'success' && (
          <motion.p
            initial={reducedMotion ? false : { scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center text-6xl text-success-700 font-black"
          >
            <span aria-hidden="true">⭐</span>
            <span className="sr-only">{eduLabel('eduChallengeComplete', language)}</span>
          </motion.p>
        )}
      </div>
    );
  }

  if (challenge.type === 'count') {
    return (
      <div className="space-y-4 text-center">
        <h3 className="sr-only">{eduLabel('eduCountTitle', language)}</h3>
        <p className="text-5xl tracking-normal" aria-hidden="true">{challenge.items.join(' ')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {challenge.options.map((n) => (
            <button
              key={n}
              type="button"
              disabled={!!feedback}
              onClick={() => (n === challenge.answer ? finishSuccess() : finishFail())}
              className="min-h-touch-kids rounded-2xl bg-card border-2 border-border text-heading-l font-black"
            >
              {n}
            </button>
          ))}
        </div>
        {feedback === 'success' && (
          <p className="text-6xl text-success-700 font-black" aria-label={eduLabel('eduChallengeComplete', language)}>⭐</p>
        )}
        {feedback === 'fail' && (
          <button type="button" className="mx-auto grid h-16 w-16 min-h-touch-kids min-w-touch-kids place-items-center rounded-full bg-hkids-brown-soft text-3xl font-black text-hkids-brown-dark" onClick={() => setFeedback(null)} aria-label={eduLabel('eduPracticeAgain', language)}>
            <span aria-hidden="true">↻</span>
          </button>
        )}
      </div>
    );
  }

  if (challenge.type === 'sequence') {
    return (
      <div className="space-y-4 text-center">
        <h3 className="sr-only">{eduLabel('eduSequenceTitle', language)}</h3>
        <p className="text-4xl font-black tracking-normal">{challenge.sequence.join('  ')}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {challenge.options.map((opt) => (
            <button
              key={String(opt)}
              type="button"
              disabled={!!feedback}
              onClick={() => (opt === challenge.answer ? finishSuccess() : finishFail())}
              className="min-h-touch-kids min-w-[4.5rem] rounded-2xl bg-card border-2 border-border px-4 text-heading-m font-black"
            >
              {opt}
            </button>
          ))}
        </div>
        {feedback === 'success' && (
          <p className="text-6xl text-success-700 font-black" aria-label={eduLabel('eduChallengeComplete', language)}>⭐</p>
        )}
        {feedback === 'fail' && (
          <button type="button" className="mx-auto grid h-16 w-16 min-h-touch-kids min-w-touch-kids place-items-center rounded-full bg-hkids-brown-soft text-3xl font-black text-hkids-brown-dark" onClick={() => setFeedback(null)} aria-label={eduLabel('eduPracticeAgain', language)}>
            <span aria-hidden="true">↻</span>
          </button>
        )}
      </div>
    );
  }

  if (challenge.type === 'shadow' || challenge.type === 'size') {
    return (
      <div className="space-y-4 text-center">
        <h3 className="sr-only">{challenge.type === 'size' ? 'Size' : 'Shadow'}</h3>
        <div className="text-5xl font-black" aria-hidden="true">{challenge.pictogram} {challenge.type === 'size' ? '📏' : '🌑'}</div>
        <p className="text-6xl" aria-hidden="true">{challenge.prompt === 'big' ? '⬆️' : challenge.prompt}</p>
        <div className="grid grid-cols-3 gap-3">
          {(challenge.options || []).map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={!!feedback}
              onClick={() => (opt.correct ? finishSuccess() : finishFail())}
              className="min-h-[5rem] rounded-2xl bg-card border-2 border-border text-4xl"
            >
              {opt.label}
            </button>
          ))}
        </div>
        {feedback === 'success' && (
          <p className="text-6xl text-success-700 font-black" aria-label={eduLabel('eduChallengeComplete', language)}>⭐</p>
        )}
        {feedback === 'fail' && (
          <button type="button" className="mx-auto grid h-16 w-16 min-h-touch-kids min-w-touch-kids place-items-center rounded-full bg-hkids-brown-soft text-3xl font-black text-hkids-brown-dark" onClick={() => setFeedback(null)} aria-label={eduLabel('eduPracticeAgain', language)}>
            <span aria-hidden="true">↻</span>
          </button>
        )}
      </div>
    );
  }

  if (challenge.type === 'puzzle') {
    return (
      <PuzzleChallenge
        challenge={challenge}
        language={language}
        onSuccess={finishSuccess}
        onFail={finishFail}
        feedback={feedback}
        setFeedback={setFeedback}
      />
    );
  }

  if (challenge.type === 'memory') {
    return (
      <SimpleMemoryChallenge
        challenge={challenge}
        language={language}
        onSuccess={finishSuccess}
        disabled={!!feedback}
      />
    );
  }

  // find
  return (
    <div className="space-y-4 text-center">
      <h3 className="sr-only">{eduLabel('eduFindTitle', language)}</h3>
      <p className="text-6xl" aria-hidden="true">{challenge.prompt}</p>
      <div className="grid grid-cols-2 gap-3">
        {(challenge.options || []).map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={!!feedback}
            onClick={() => (opt.correct ? finishSuccess() : finishFail())}
            className="min-h-[5rem] rounded-2xl bg-card border-2 border-border text-4xl"
          >
            {opt.label}
          </button>
        ))}
      </div>
      {feedback === 'success' && (
        <p className="text-6xl text-success-700 font-black" aria-label={eduLabel('eduChallengeComplete', language)}>⭐</p>
      )}
      {feedback === 'fail' && (
        <button type="button" className="mx-auto grid h-16 w-16 min-h-touch-kids min-w-touch-kids place-items-center rounded-full bg-hkids-brown-soft text-3xl font-black text-hkids-brown-dark" onClick={() => setFeedback(null)} aria-label={eduLabel('eduPracticeAgain', language)}>
          <span aria-hidden="true">↻</span>
        </button>
      )}
    </div>
  );
}

export default LearningInteractiveChallenge;
