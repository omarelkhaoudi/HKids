import { useEffect, useState } from 'react';
import { learningAPI } from '../../api/learning';
import { EDUCATIONAL_WORLDS, LEARNING_ACHIEVEMENTS } from '../../constants/educationalWorlds';
import { eduLabel } from '../../constants/educationalWorldLabels';
import { getDashboardSnapshot } from '../../utils/educationalProgress';
import { Skeleton } from '../ui';

/**
 * Parent-facing learning progress for a kid (API summary + local edu progress).
 */
export function ParentLearningPanel({ kidId, language = 'fr', t = (k) => k }) {
  const [apiSummary, setApiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const local = getDashboardSnapshot(kidId);

  useEffect(() => {
    if (!kidId) return undefined;
    let cancelled = false;
    setLoading(true);
    learningAPI.getParentSummary(kidId)
      .then((res) => {
        if (!cancelled) setApiSummary(res.data || null);
      })
      .catch(() => {
        if (!cancelled) setApiSummary(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [kidId]);

  if (!kidId) return null;

  if (loading && !apiSummary) {
    return (
      <div className="grid grid-cols-2 gap-3" aria-busy="true">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-3xl" />)}
      </div>
    );
  }

  const attempts = Number(apiSummary?.attempts_count ?? apiSummary?.total_attempts ?? local.storiesCompleted);
  const successRate = Number(
    apiSummary?.success_rate
      ?? apiSummary?.success_percent
      ?? local.quizScore
      ?? 0,
  );
  const timeSec = Number(apiSummary?.time_spent_seconds ?? local.timeSpentMinutes * 60);
  const favoriteWorldIds = local.favoriteWorldIds?.length
    ? local.favoriteWorldIds
    : Object.entries(local.byWorld || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

  return (
    <section className="parent-panel space-y-space-20 p-space-24" aria-label={eduLabel('eduParentLearningTitle', language)}>
      <header>
        <h3 className="text-heading-m font-black text-foreground">{eduLabel('eduParentLearningTitle', language)}</h3>
        <p className="text-body text-foreground-secondary font-medium mt-1">
          {eduLabel('eduParentLearningDesc', language)}
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric emoji="📘" label={eduLabel('eduStoriesDone', language)} value={local.storiesCompleted} />
        <Metric emoji="🎯" label={eduLabel('eduChallengesDone', language)} value={local.challengesCompleted} />
        <Metric emoji="✅" label={t('parentAnalyticsSuccess')} value={`${Math.round(successRate)}%`} />
        <Metric emoji="⏱️" label={eduLabel('eduTimeSpent', language)} value={eduLabel('eduMinutes', language, { n: Math.round(timeSec / 60) })} />
        <Metric emoji="🌍" label={eduLabel('eduWorldsExplored', language)} value={local.worldsExplored} />
        <Metric emoji="⭐" label={eduLabel('eduLevel', language, { level: local.level?.level || 1 })} value={eduLabel('eduXp', language, { xp: local.level?.xp || 0 })} />
        <Metric emoji="📅" label={eduLabel('eduWeekly', language)} value={local.weeklyProgress} />
        <Metric emoji="🔥" label={t('parentAnalyticsStreak')} value={local.streakDays} />
      </div>

      <div>
        <h4 className="text-caption font-black uppercase tracking-wide text-foreground-muted mb-2">
          {eduLabel('eduParentFavoriteWorlds', language)}
        </h4>
        <div className="flex flex-wrap gap-2">
          {favoriteWorldIds.length === 0 ? (
            <p className="text-caption text-foreground-muted">—</p>
          ) : (
            favoriteWorldIds.map((id) => {
              const world = EDUCATIONAL_WORLDS.find((w) => w.id === id);
              if (!world) return null;
              return (
                <span key={id} className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${world.gradient} text-white px-3 py-1.5 text-caption font-bold`}>
                  {world.emoji} {eduLabel(world.labelKey, language)}
                </span>
              );
            })
          )}
        </div>
      </div>

      <div>
        <h4 className="text-caption font-black uppercase tracking-wide text-foreground-muted mb-2">
          {eduLabel('eduParentBySubject', language)}
        </h4>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EDUCATIONAL_WORLDS.filter((w) => (local.byWorld?.[w.id] || 0) > 0).slice(0, 8).map((world) => (
            <li key={world.id} className="flex items-center justify-between rounded-2xl bg-surface-secondary/80 px-3 py-2">
              <span className="font-bold text-sm">{world.emoji} {eduLabel(world.labelKey, language)}</span>
              <span className="text-caption font-black">⭐ {local.byWorld[world.id]}</span>
            </li>
          ))}
          {Object.keys(local.byWorld || {}).length === 0 && (
            <li className="text-caption text-foreground-muted">{t('parentAnalyticsNoData')}</li>
          )}
        </ul>
      </div>

      <div>
        <h4 className="text-caption font-black uppercase tracking-wide text-foreground-muted mb-2">
          {eduLabel('eduParentAchievements', language)}
        </h4>
        <div className="flex flex-wrap gap-2">
          {LEARNING_ACHIEVEMENTS.filter((b) => (local.badges || []).includes(b.id)).map((badge) => (
            <span key={badge.id} className="inline-flex items-center gap-1 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-caption font-bold">
              {badge.emoji} {eduLabel(badge.labelKey, language)}
            </span>
          ))}
          {(local.badges || []).length === 0 && (
            <p className="text-caption text-foreground-muted">—</p>
          )}
        </div>
      </div>

      {attempts > 0 && (
        <p className="text-caption text-foreground-muted">
          {t('parentAnalyticsAttempts')}: {attempts}
        </p>
      )}
    </section>
  );
}

function Metric({ emoji, label, value }) {
  return (
    <article className="rounded-2xl border border-border/60 bg-card p-3">
      <span className="text-xl" aria-hidden="true">{emoji}</span>
      <p className="text-heading-m font-black mt-1">{value}</p>
      <p className="text-caption text-foreground-muted">{label}</p>
    </article>
  );
}

export default ParentLearningPanel;
