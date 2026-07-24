import { ParentProgressRing } from './ParentProgressRing';
import { Skeleton } from '../ui';
import { ParentEmptyState } from './ParentEmptyState';
import { collectFavoriteThemes, getThemeLabel, getTodayReadingSeconds } from '../../utils/parentInsights';

function MetricCard({ emoji, label, value, hint }) {
  return (
    <article className="parent-analytics-metric parent-panel">
      <span className="text-2xl" aria-hidden="true">{emoji}</span>
      <p className="parent-analytics-metric-value">{value}</p>
      <p className="parent-analytics-metric-label">{label}</p>
      {hint ? <p className="text-caption text-foreground-muted mt-1">{hint}</p> : null}
    </article>
  );
}

function formatMinutes(seconds) {
  return Math.max(0, Math.round(Number(seconds || 0) / 60));
}

export function ParentPremiumAnalytics({
  data,
  loading = false,
  t = (key) => key,
  kidName = '',
  language = 'fr',
}) {
  if (loading && !data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-16" aria-busy="true">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36 rounded-3xl" />)}
      </div>
    );
  }

  if (!data) {
    return (
      <ParentEmptyState
        emoji="📊"
        title={t('parentAnalyticsNoData')}
        description={t('parentHomeNoDataDesc')}
      />
    );
  }

  const summary = data.summary || {};
  const goal = data.goal;
  const streak = Number(summary.reading_streak_days || 0);
  const completed = Number(summary.completed_books || 0);
  const readingMin = formatMinutes(summary.total_time_seconds);
  const audioMin = formatMinutes(summary.total_audio_seconds || summary.audio_seconds);
  const todayMin = formatMinutes(getTodayReadingSeconds(data));
  const sessions = Number(summary.total_sessions || 0);
  const avgSession = sessions > 0 ? Math.round(readingMin / sessions) : 0;
  const themes = collectFavoriteThemes(data, 1);
  const favoriteTheme = themes[0] ? getThemeLabel(themes[0].id) : '—';
  const favoriteLanguage = (summary.favorite_language || data.kid?.preferred_language || language || 'fr').toUpperCase();
  const lastSession = summary.last_session_at
    ? new Date(summary.last_session_at).toLocaleString(
      language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-US' : 'fr-FR',
      { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' },
    )
    : t('parentNever');

  const weeklyBars = (data.daily_activity || []).slice(-7);
  const maxBar = Math.max(1, ...weeklyBars.map((day) => Number(day.reading_seconds || 0)));

  return (
    <section className="space-y-space-24" aria-label={t('pccTabAnalytics')}>
      <header>
        <h3 className="text-heading-l font-black text-foreground">{t('pccAnalyticsTitle')}</h3>
        <p className="text-body text-foreground-secondary font-medium mt-1">
          {t('pccAnalyticsSubtitle', { name: kidName || t('parentChild') })}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-16">
        <article className="parent-panel parent-analytics-hero flex flex-col items-center justify-center gap-space-16 p-space-24">
          <ParentProgressRing
            percent={goal?.progress_percent || Math.min(100, streak * 12)}
            size={132}
            valueLabel={goal ? `${Math.round(goal.progress_percent || 0)}%` : `${streak}d`}
            label={goal ? t('parentReadingGoal') : t('pccStreak')}
            tone={goal?.achieved ? 'success' : 'primary'}
          />
          {goal ? (
            <p className="text-body font-bold text-center">
              {goal.progress_value} / {goal.target_value}
            </p>
          ) : (
            <p className="text-body font-bold text-center">{t('pccStreakHint')}</p>
          )}
        </article>

        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-space-12">
          <MetricCard emoji="📚" label={t('pccBooksCompleted')} value={completed} />
          <MetricCard emoji="🎧" label={t('pccStoriesListened')} value={Number(summary.listened_books || summary.audio_books || 0)} />
          <MetricCard emoji="⏱️" label={t('pccReadingTime')} value={`${readingMin} min`} />
          <MetricCard emoji="🔊" label={t('pccAudioTime')} value={`${audioMin} min`} />
          <MetricCard emoji="🔥" label={t('pccStreak')} value={streak} hint={t('pccTodayMinutes', { minutes: todayMin })} />
          <MetricCard emoji="📈" label={t('pccAvgSession')} value={`${avgSession} min`} hint={lastSession} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-16">
        <article className="parent-panel p-space-24">
          <h4 className="font-black mb-space-12">{t('pccWeeklyActivity')}</h4>
          <div className="parent-analytics-bars" role="img" aria-label={t('pccWeeklyActivity')}>
            {weeklyBars.length === 0 ? (
              <ParentEmptyState compact emoji="📅" title={t('pccNoItems')} description="" />
            ) : weeklyBars.map((day) => {
              const seconds = Number(day.reading_seconds || 0);
              const height = `${Math.max(8, Math.round((seconds / maxBar) * 100))}%`;
              return (
                <div key={day.day || day.date} className="parent-analytics-bar-col">
                  <div className="parent-analytics-bar" style={{ height }} title={`${formatMinutes(seconds)} min`} />
                  <span>{String(day.day || day.date || '').slice(5)}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="parent-panel p-space-24 space-y-space-12">
          <h4 className="font-black">{t('pccFavoritesSnapshot')}</h4>
          <p className="text-body"><span className="text-foreground-muted">{t('pccFavoriteCategory')}:</span> <strong>{favoriteTheme}</strong></p>
          <p className="text-body"><span className="text-foreground-muted">{t('pccFavoriteLanguage')}:</span> <strong>{favoriteLanguage}</strong></p>
          <p className="text-body"><span className="text-foreground-muted">{t('pccLastSession')}:</span> <strong>{lastSession}</strong></p>
          {goal?.achieved ? (
            <div className="parent-achievement-card">
              <span aria-hidden="true">🏆</span>
              <div>
                <p className="font-black">{t('pccGoalAchieved')}</p>
                <p className="text-caption text-foreground-secondary">{t('pccGoalAchievedDesc')}</p>
              </div>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}

export default ParentPremiumAnalytics;
