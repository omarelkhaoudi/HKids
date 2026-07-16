import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Future-ready ambient sound architecture — no streaming, no backend.
 * Presets are UI-selectable; playback hooks Web Audio oscillators lightly
 * when enabled, or stays silent until real assets are provided later.
 */
export const BEDTIME_SOUND_PRESETS = [
  { id: 'rain', emoji: '🌧️', labelKey: 'bedtimeSoundRain' },
  { id: 'forest', emoji: '🌲', labelKey: 'bedtimeSoundForest' },
  { id: 'ocean', emoji: '🌊', labelKey: 'bedtimeSoundOcean' },
  { id: 'night', emoji: '🌙', labelKey: 'bedtimeSoundNight' },
  { id: 'wind', emoji: '🍃', labelKey: 'bedtimeSoundWind' },
];

function createSoftNoise(ctx, type) {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < bufferSize; i += 1) {
    const white = Math.random() * 2 - 1;
    // Soft brown-ish noise for calm ambience
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * (type === 'ocean' ? 0.35 : 0.22);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = type === 'rain' ? 900 : type === 'wind' ? 500 : 700;
  const gain = ctx.createGain();
  gain.gain.value = 0.04;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  return { source, gain };
}

export const KidsAmbientSound = memo(function KidsAmbientSound({
  enabled = false,
  preset = 'night',
  className = '',
  onPresetChange,
  labels = {},
  compact = false,
}) {
  const reducedMotion = useReducedMotion();
  const [activePreset, setActivePreset] = useState(preset);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const stop = useCallback(() => {
    try {
      audioRef.current?.source?.stop?.();
    } catch {
      // already stopped
    }
    audioRef.current = null;
    setPlaying(false);
  }, []);

  const start = useCallback(async (nextPreset) => {
    if (typeof window === 'undefined' || !(window.AudioContext || window.webkitAudioContext)) return;
    stop();
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const nodes = createSoftNoise(ctx, nextPreset);
    nodes.source.start(0);
    audioRef.current = { ctx, ...nodes };
    setPlaying(true);
  }, [stop]);

  useEffect(() => {
    if (!enabled) {
      stop();
      return undefined;
    }
    return () => stop();
  }, [enabled, stop]);

  useEffect(() => () => stop(), [stop]);

  if (!enabled) return null;

  const handleSelect = async (id) => {
    setActivePreset(id);
    onPresetChange?.(id);
    if (playing) await start(id);
  };

  const togglePlay = async () => {
    if (playing) stop();
    else await start(activePreset);
  };

  return (
    <div className={`kids-ambient-sound ${compact ? 'kids-ambient-sound-compact' : ''} ${className}`} role="group" aria-label="Bedtime sounds">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {BEDTIME_SOUND_PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item.id)}
            className={`kids-touch-target !min-h-[48px] !min-w-[48px] rounded-full border-2 px-3 py-2 text-xl transition ${
              activePreset === item.id
                ? 'bg-accent-400/90 border-white text-white shadow-md'
                : 'bg-white/20 border-white/40 text-white/90 hover:bg-white/30'
            }`}
            aria-pressed={activePreset === item.id}
            aria-label={labels[item.labelKey] || item.id}
          >
            <span aria-hidden="true">{item.emoji}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={togglePlay}
          className="kids-touch-target !min-h-[48px] rounded-full bg-white/90 text-primary-700 font-black px-4 border-2 border-white shadow-md"
          aria-pressed={playing}
        >
          {playing ? '🔇' : '🔊'}
        </button>
      </div>
      {!reducedMotion && playing && (
        <div className="kids-sound-wave mt-2" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="kids-sound-bar" style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
      )}
    </div>
  );
});

export default KidsAmbientSound;
