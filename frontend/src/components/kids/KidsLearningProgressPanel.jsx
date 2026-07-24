import { eduLabel } from '../../constants/educationalWorldLabels';
import { getEducationalWorld } from '../../constants/educationalWorlds';
import { KidsAchievementBadges } from './KidsAchievementBadges';

export function KidsLearningProgressPanel({
  snapshot,
  language = 'fr',
  nextWorldId = null,
  onOpenWorld = null,
}) {
  if (!snapshot) return null;
  const nextWorld = nextWorldId ? getEducationalWorld(nextWorldId) : null;

  const metrics = [
    { emoji: '📘', label: eduLabel('eduStoriesDone', language), value: snapshot.storiesCompleted },
    { emoji: '🎯', label: eduLabel('eduChallengesDone', language), value: snapshot.challengesCompleted },
    { emoji: '✅', label: eduLabel('eduQuizScore', language), value: `${snapshot.quizScore}%` },
    { emoji: '🌍', label: eduLabel('eduWorldsExplored', language), value: snapshot.worldsExplored },
    { emoji: '⏱️', label: eduLabel('eduTimeSpent', language), value: eduLabel('eduMinutes', language, { n: snapshot.timeSpentMinutes }) },
    { emoji: '📅', label: eduLabel('eduWeekly', language), value: snapshot.weeklyProgress },
    { emoji: '🗓️', label: eduLabel('eduMonthly', language), value: snapshot.monthlyProgress },
    { emoji: '⭐', label: eduLabel('eduLevel', language, { level: snapshot.level?.level || 1 }), value: eduLabel('eduXp', language, { xp: snapshot.level?.xp || 0 }) },
  ];

  return (
    <section className="rounded-32 bg-card/70 backdrop-blur-md border border-border p-space-24 shadow-soft space-y-space-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-heading-l font-black text-foreground">{eduLabel('eduDashboardTitle', language)}</h2>
          <p className="text-caption text-foreground-muted mt-1">🔥 {snapshot.streakDays || 0}</p>
        </div>
        <div className="w-full sm:w-56">
          <div className="h-3 rounded-full bg-surface-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-success-400 to-success-600"
              style={{ width: `${snapshot.level?.percent || 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <article key={m.label} className="rounded-24 bg-surface-secondary/80 border border-border p-space-16">
            <span className="text-2xl" aria-hidden="true">{m.emoji}</span>
            <p className="text-heading-m font-black mt-2 text-foreground">{m.value}</p>
            <p className="text-caption text-foreground-muted">{m.label}</p>
          </article>
        ))}
      </div>

      {nextWorld && (
        <button
          type="button"
          onClick={() => onOpenWorld?.(nextWorld.id)}
          className={`w-full text-start rounded-24 bg-gradient-to-r ${nextWorld.gradient} p-space-20 text-white shadow-card min-h-touch-kids`}
        >
          <p className="text-caption font-bold opacity-90">{eduLabel('eduNextRec', language)}</p>
          <p className="text-heading-m font-black mt-1">
            {nextWorld.emoji} {eduLabel(nextWorld.labelKey, language)}
          </p>
        </button>
      )}

      <div>
        <h3 className="text-heading-m font-black mb-3">{eduLabel('eduParentAchievements', language)}</h3>
        <KidsAchievementBadges unlockedIds={snapshot.badges || []} language={language} compact />
      </div>
    </section>
  );
}

export default KidsLearningProgressPanel;
