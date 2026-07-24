import { motion } from 'framer-motion';
import { UNIVERSE_AVATARS, UNIVERSE_BADGES } from '../../constants/learningUniverse';
import { getEducationalWorld } from '../../constants/educationalWorlds';
import { luLabel } from '../../constants/learningUniverseLabels';
import { eduLabel } from '../../constants/educationalWorldLabels';

export function LearningUniverseDashboard({
  dashboard,
  language = 'fr',
  onSelectAvatar,
  reducedMotion = false,
}) {
  if (!dashboard) return null;

  const metrics = [
    { emoji: '📘', label: luLabel('luBooks', language), value: dashboard.booksCompleted },
    { emoji: '🧠', label: luLabel('luQuiz', language), value: `${dashboard.quizCorrect}/${dashboard.quizAttempts || 0}` },
    { emoji: '⭐', label: luLabel('luXp', language), value: dashboard.xp },
    { emoji: '🔥', label: luLabel('luStreak', language), value: dashboard.streakDays },
    { emoji: '🎧', label: luLabel('luListenTime', language), value: luLabel('luMinutes', language, { n: dashboard.listenMinutes }) },
    { emoji: '📖', label: luLabel('luReadTime', language), value: luLabel('luMinutes', language, { n: dashboard.readMinutes }) },
  ];

  return (
    <div className="space-y-space-24">
      <section className="rounded-32 bg-card border border-border p-space-24 shadow-soft">
        <div className="flex items-end justify-between gap-3 mb-space-16">
          <div>
            <h2 className="text-heading-l font-black">{luLabel('luDashboard', language)}</h2>
            <p className="text-caption text-foreground-muted">
              {luLabel('luLevel', language, { level: dashboard.level?.level || 1 })} · {dashboard.todayXp || 0} XP
            </p>
          </div>
          <span className="text-4xl" aria-hidden="true">
            {UNIVERSE_AVATARS.find((a) => a.id === dashboard.activeAvatar)?.emoji || '🐶'}
          </span>
        </div>
        <div className="h-3 rounded-full bg-surface-secondary overflow-hidden mb-space-16">
          <motion.div
            className="h-full bg-gradient-to-r from-success-400 to-success-600"
            initial={reducedMotion ? false : { width: 0 }}
            animate={{ width: `${dashboard.percent || 0}%` }}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {metrics.map((m) => (
            <article key={m.label} className="rounded-24 bg-surface-secondary/80 p-space-16 border border-border">
              <span className="text-2xl" aria-hidden="true">{m.emoji}</span>
              <p className="text-heading-m font-black mt-1">{m.value}</p>
              <p className="text-caption text-foreground-muted">{m.label}</p>
            </article>
          ))}
        </div>
        <p className="text-caption font-bold mt-space-16 text-foreground-muted">
          {luLabel('luThisWeek', language)}: {dashboard.weekBooks} · {luLabel('luDashboard', language)}: {dashboard.todayBooks}
        </p>
      </section>

      {dashboard.favoriteWorlds?.length > 0 && (
        <section>
          <h3 className="text-heading-m font-black mb-3">{luLabel('luFavoriteWorlds', language)}</h3>
          <div className="flex flex-wrap gap-2">
            {dashboard.favoriteWorlds.map((id) => {
              const world = getEducationalWorld(id);
              if (!world) return null;
              return (
                <span key={id} className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${world.gradient} text-white px-3 py-1.5 text-caption font-bold`}>
                  {world.emoji} {eduLabel(world.labelKey, language)}
                </span>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-heading-m font-black mb-3">{luLabel('luBadges', language)}</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {UNIVERSE_BADGES.map((badge) => {
            const earned = (dashboard.badges || []).includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`rounded-2xl border p-3 text-center ${earned ? 'border-amber-300 bg-amber-50' : 'border-border opacity-40 grayscale'}`}
              >
                <div className="text-2xl">{badge.emoji}</div>
                <p className="text-caption font-black leading-tight mt-1">{luLabel(badge.labelKey, language)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-heading-m font-black mb-3">{luLabel('luAvatars', language)}</h3>
        <div className="grid grid-cols-5 gap-2">
          {UNIVERSE_AVATARS.map((avatar) => {
            const unlocked = (dashboard.unlockedAvatars || []).includes(avatar.id);
            const active = dashboard.activeAvatar === avatar.id;
            return (
              <button
                key={avatar.id}
                type="button"
                disabled={!unlocked}
                onClick={() => onSelectAvatar?.(avatar.id)}
                className={`min-h-[64px] rounded-2xl border-2 text-3xl ${
                  active ? 'border-primary-400 bg-primary-50' : unlocked ? 'border-border bg-card' : 'border-border/40 opacity-40'
                }`}
                aria-label={luLabel(avatar.labelKey, language)}
                title={luLabel(avatar.labelKey, language)}
              >
                {avatar.emoji}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default LearningUniverseDashboard;
