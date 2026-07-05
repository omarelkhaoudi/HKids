import {
  AudioIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  PauseIcon,
  PlayIcon,
  VolumeIcon,
  XIcon,
} from '../Icons';

function formatTime(seconds = 0) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function AudioPlayer({
  book,
  playing,
  loading,
  currentTime,
  duration,
  volume,
  favorite,
  error,
  onTogglePlay,
  onSeekBy,
  onSeekTo,
  onVolumeChange,
  onToggleFavorite,
  onClose,
  voiceProfiles = [],
  selectedVoiceId = '',
  onVoiceChange,
}) {
  if (!book) return null;

  const progressMax = Math.max(0, Math.floor(duration || 0));
  const progressValue = Math.min(progressMax, Math.floor(currentTime || 0));

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/60 bg-white/95 px-4 py-4 shadow-2xl backdrop-blur dark:bg-surface-900/95">
      <div className="mx-auto grid max-w-7xl gap-3 lg:grid-cols-[1fr_1.4fr_0.7fr] lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <AudioIcon className="h-8 w-8" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-surface-900 dark:text-surface-100">
              {book.title}
            </p>
            <p className="text-xs font-semibold text-surface-500 dark:text-surface-300">
              {error || (loading ? 'Chargement...' : 'Pret a ecouter')}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-center gap-2">
            <button
              onClick={() => onSeekBy(-10)}
              className="grid h-14 w-14 place-items-center rounded-full bg-surface-100 text-surface-700 transition hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-100"
              aria-label="Reculer de 10 secondes"
            >
              <ChevronLeftIcon className="h-7 w-7" />
            </button>
            <button
              onClick={onTogglePlay}
              className="grid h-20 w-20 place-items-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:bg-emerald-600"
              aria-label={playing ? 'Pause' : 'Lecture'}
            >
              {playing ? <PauseIcon className="h-10 w-10" /> : <PlayIcon className="h-10 w-10" />}
            </button>
            <button
              onClick={() => onSeekBy(10)}
              className="grid h-14 w-14 place-items-center rounded-full bg-surface-100 text-surface-700 transition hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-100"
              aria-label="Avancer de 10 secondes"
            >
              <ChevronRightIcon className="h-7 w-7" />
            </button>
          </div>

          <div className="grid grid-cols-[3rem_1fr_3rem] items-center gap-3">
            <span className="text-right text-xs font-black text-surface-500 dark:text-surface-300">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={progressMax || 0}
              value={progressValue}
              onChange={(event) => onSeekTo(event.target.value)}
              className="h-3 w-full cursor-pointer accent-emerald-500"
              aria-label="Progression audio"
            />
            <span className="text-xs font-black text-surface-500 dark:text-surface-300">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          {voiceProfiles.length > 0 && (
            <select
              value={selectedVoiceId}
              onChange={(event) => onVoiceChange?.(event.target.value)}
              className="h-14 max-w-44 rounded-full border border-surface-200 bg-white px-3 text-sm font-black text-surface-700 outline-none dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
              aria-label="Voix de narration"
              title="Voix de narration"
            >
              <option value="">Voix originale</option>
              {voiceProfiles.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
          )}
          <div className="flex min-w-32 items-center gap-2">
            <VolumeIcon className="h-5 w-5 text-surface-500 dark:text-surface-300" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => onVolumeChange(event.target.value)}
              className="w-24 accent-emerald-500"
              aria-label="Volume"
            />
          </div>
          <button
            onClick={onToggleFavorite}
            className={`grid h-14 w-14 place-items-center rounded-full transition ${
              favorite ? 'bg-rose-100 text-rose-600' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-100'
            }`}
            aria-label="Favori"
          >
            <HeartIcon className="h-7 w-7" filled={favorite} />
          </button>
          <button
            onClick={onClose}
            className="grid h-14 w-14 place-items-center rounded-full bg-surface-100 text-surface-600 transition hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-100"
            aria-label="Fermer le lecteur"
          >
            <XIcon className="h-7 w-7" />
          </button>
        </div>
      </div>
    </div>
  );
}
