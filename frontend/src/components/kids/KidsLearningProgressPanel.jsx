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
          <h2 className="sr-only">{eduLabel('eduDashboardTitle', language)}</h2>
          <p className="text-4xl" aria-label={`${snapshot.streakDays || 0}`}>🔥</p>
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
          <article key={m.label} className="kids-visual-stat-card !min-h-[6.5rem]">
            <span className="kids-visual-stat-emoji !text-3xl" aria-hidden="true">{m.emoji}</span>
            <p className="kids-visual-stat-value !text-lg">{m.value}</p>
            <p className="sr-only">{m.label}</p>
          </article>
        ))}
      </div>

      {nextWorld && (
        <button
          type="button"
          onClick={() => onOpenWorld?.(nextWorld.id)}
          className={`w-full text-start rounded-24 bg-gradient-to-r ${nextWorld.gradient} p-space-20 text-white shadow-card min-h-touch-kids`}
        >
          <p className="sr-only">{eduLabel('eduNextRec', language)}</p>
          <p className="text-heading-m font-black mt-1">
            <span className="text-5xl" aria-hidden="true">{nextWorld.emoji}</span>
            <span className="sr-only">{eduLabel(nextWorld.labelKey, language)}</span>
          </p>
        </button>
      )}

      <div>
        <h3 className="sr-only">{eduLabel('eduParentAchievements', language)}</h3>
        <KidsAchievementBadges unlockedIds={snapshot.badges || []} language={language} compact />
      </div>
    </section>
  );
}

export default KidsLearningProgressPanel;
