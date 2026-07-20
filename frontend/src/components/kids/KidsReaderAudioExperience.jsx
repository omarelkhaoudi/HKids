import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { kidsProgressFill } from '../../constants/kidsMotion';

export const READER_AMBIENCE_OPTIONS = [
  { id: 'forest', icon: '🌲', labelKey: 'readerAmbienceForest' },
  { id: 'rain', icon: '🌧', labelKey: 'readerAmbienceRain' },
  { id: 'ocean', icon: '🌊', labelKey: 'readerAmbienceOcean' },
  { id: 'night', icon: '🌙', labelKey: 'readerAmbienceNight' },
  { id: 'fireplace', icon: '🔥', labelKey: 'readerAmbienceFireplace' },
  { id: 'wind', icon: '🍃', labelKey: 'readerAmbienceWind' },
];

/**
 * UI-only ambient layer picker — no audio generation or playback.
 */
export const KidsReaderAmbientPanel = memo(function KidsReaderAmbientPanel({
  t,
  selectedId = null,
  volume = 40,
  onSelect,
  onVolumeChange,
  open = false,
}) {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="kids-reader-ambience-panel"
          initial={reducedMotion ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={reducedMotion ? undefined : { opacity: 0, height: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          role="group"
          aria-label={t('readerAmbienceTitle')}
        >
          <p className="kids-reader-ambience-title">{t('readerAmbienceTitle')}</p>
          <p className="kids-reader-ambience-hint">{t('readerAmbienceHint')}</p>
          <div className="kids-reader-ambience-grid">
            {READER_AMBIENCE_OPTIONS.map((option) => {
              const active = selectedId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`kids-reader-ambience-card ${active ? 'is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => onSelect?.(active ? null : option.id)}
                >
                  <span className="kids-reader-ambience-icon" aria-hidden="true">{option.icon}</span>
                  <span className="kids-reader-ambience-label">{t(option.labelKey)}</span>
                </button>
              );
            })}
          </div>
          <label className="kids-reader-ambience-volume">
            <span>{t('readerAmbienceVolume')}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              disabled={!selectedId}
              onChange={(event) => onVolumeChange?.(Number(event.target.value))}
              aria-label={t('readerAmbienceVolume')}
            />
          </label>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

/**
 * Premium reading timeline — paper texture, markers, remaining estimate.
 */
export const KidsReaderTimeline = memo(function KidsReaderTimeline({
  progress = 0,
  currentPage = 0,
  totalPages = 1,
  remainingLabel = '',
  phaseLabel = '',
  ariaLabel = '',
  reducedMotion = false,
}) {
  const markers = [];
  const total = Math.max(1, totalPages);
  if (total <= 8) {
    for (let i = 0; i < total; i += 1) markers.push(i);
  } else {
    markers.push(0, Math.floor(total / 2), total - 1);
  }

  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="kids-reader-timeline">
      <div className="kids-reader-timeline-meta">
        <p className="kids-reader-timeline-phase">{phaseLabel}</p>
        {remainingLabel ? (
          <p className="kids-reader-timeline-remaining">{remainingLabel}</p>
        ) : null}
      </div>
      <div
        className="kids-reader-timeline-track"
        role="progressbar"
        aria-valuenow={currentPage + 1}
        aria-valuemin={1}
        aria-valuemax={totalPages}
        aria-label={ariaLabel}
      >
        <span className="kids-reader-timeline-paper" aria-hidden="true" />
        <motion.div
          className="kids-reader-timeline-fill"
          initial={false}
          animate={{ width: `${clamped}%` }}
          transition={reducedMotion ? { duration: 0 } : kidsProgressFill.transition}
        />
        <span
          className="kids-reader-timeline-thumb"
          style={{ insetInlineStart: `calc(${clamped}% - 7px)` }}
          aria-hidden="true"
        />
        {markers.map((pageIndex) => (
          <span
            key={pageIndex}
            className={`kids-reader-timeline-marker ${pageIndex <= currentPage ? 'is-passed' : ''}`}
            style={{ insetInlineStart: `${(pageIndex / Math.max(1, total - 1)) * 100}%` }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
});

/**
 * Voice experience metadata — narrator, style, speed, remaining.
 */
export const KidsReaderVoiceMeta = memo(function KidsReaderVoiceMeta({
  t,
  narrator = '',
  style = '',
  speedLabel = '',
  remainingLabel = '',
}) {
  const cards = [
    { key: 'narrator', label: t('readerVoiceNarrator'), value: narrator },
    { key: 'style', label: t('readerVoiceStyle'), value: style },
    { key: 'speed', label: t('readerVoiceSpeed'), value: speedLabel },
    { key: 'remaining', label: t('readerVoiceRemaining'), value: remainingLabel },
  ].filter((card) => Boolean(card.value));

  if (!cards.length) return null;

  return (
    <div className="kids-reader-voice-meta" role="group" aria-label={t('readerVoiceTitle')}>
      {cards.map((card) => (
        <div key={card.key} className="kids-reader-voice-card">
          <span className="kids-reader-voice-card-label">{card.label}</span>
          <span className="kids-reader-voice-card-value">{card.value}</span>
        </div>
      ))}
    </div>
  );
});

export default KidsReaderAmbientPanel;
