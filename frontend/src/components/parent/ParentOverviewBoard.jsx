import { BookIcon, ClockIcon, SparklesIcon, StarIcon } from '../Icons';
import { KidAvatar } from './KidAvatar';
import {
  buildWeeklyProgress,
  collectFavoriteThemes,
  getThemeLabel,
  getTodayReadingSeconds,
} from '../../utils/parentInsights';
import { formatParentDuration } from './parentFormatters';

const THEME_COLORS = ['#6d5ae6', '#1f9d67', '#d97745', '#d4537e', '#3b82f6', '#0d9488'];

function relativeTime(value, locale, t) {
  if (!value) return t('parentNever');
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 60) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-minutes, 'minute');
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 48) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-hours, 'hour');
  }
  return new Date(value).toLocaleDateString(locale, { day: '2-digit', month: 'short' });
}

function buildDonutGradient(themes) {
  if (!themes.length) return 'conic-gradient(#e8e6e1 0 100%)';
  const total = themes.reduce((sum, item) => sum + item.count, 0) || 1;
  let cursor = 0;
  const stops = themes.map((theme, index) => {
    const share = (theme.count / total) * 100;
    const start = cursor;
    cursor += share;
    return `${THEME_COLORS[index % THEME_COLORS.length]} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(', ')})`;
}

/**
 * Premium overview board: KPIs, recent activity, weekly bars, theme donut.
 * Uses existing dashboard payload only — no API changes.
 */
export function ParentOverviewBoard({
  kids = [],
  selectedKid = null,
  data = null,
  language = 'fr',
  t = (key) => key,
}) {
  const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-US' : 'fr-FR';
  const summary = data?.summary || {};
  const todayMinutes = Math.floor(getTodayReadingSeconds(data) / 60);
  const themes = collectFavoriteThemes(data || {}, 5);
  const weekly = buildWeeklyProgress(data || {}, 7);
  const timeline = (data?.timeline?.items || []).slice(0, 5);
  const historyFallback = (data?.history?.items || []).slice(0, 5).map((item) => ({
    type: 'reading',
    title: item.title,
    occurred_at: item.last_opened_at || item.last_read_at,
  }));
  const activity = (timeline.length > 0 ? timeline : historyFallback).slice(0, 5);

  const kpis = [
    {
      id: 'kids',
      label: t('parentProfilesStatProfiles'),
      value: String(kids.length),
      icon: SparklesIcon,
      tone: 'violet',
    },
    {
      id: 'done',
      label: t('parentHomeBooksCompleted'),
      value: String(summary.books_completed || 0),
      icon: BookIcon,
      tone: 'mint',
    },
    {
      id: 'today',
      label: t('parentHomeTodayReading'),
      value: todayMinutes > 0 ? `${todayMinutes} min` : formatParentDuration(0),
      icon: ClockIcon,
      tone: 'peach',
    },
    {
      id: 'streak',
      label: t('parentHomeStreakLabel'),
      value: Number(summary.reading_streak_days || 0) > 0
        ? t('parentHomeStreakDays', { days: summary.reading_streak_days })
        : '—',
      icon: StarIcon,
      tone: 'rose',
    },
  ];

  return (
    <div className="flex flex-col gap-space-24">
      <section className="parent-kpi-grid" aria-label={t('parentInsightsTitle')}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article key={kpi.id} className={`parent-kpi-card parent-kpi-card--${kpi.tone}`}>
              <div className={`parent-kpi-icon parent-kpi-icon--${kpi.tone}`} aria-hidden="true">
                <Icon className="h-5 w-5" />
              </div>
              <p className="parent-kpi-label">{kpi.label}</p>
              <p className="parent-kpi-value">{kpi.value}</p>
            </article>
          );
        })}
      </section>

      <section className="parent-board-grid" aria-label={t('parentInsightsTitle')}>
        <article className="parent-panel">
          <h3 className="parent-panel-title">{t('parentJourneyTitle')}</h3>
          <p className="parent-panel-subtitle">
            {t('parentInsightsSubtitle', { name: selectedKid?.name || t('parentChild') })}
          </p>
          {activity.length === 0 ? (
            <p className="text-body text-foreground-muted font-medium">{t('parentHomeNoDataDesc')}</p>
          ) : (
            <ul className="parent-activity-list">
              {activity.map((event, index) => (
                <li key={`${event.title}-${event.occurred_at}-${index}`} className="parent-activity-item">
                  {selectedKid ? (
                    <KidAvatar kid={selectedKid} size="sm" />
                  ) : (
                    <div className="parent-activity-avatar" aria-hidden="true">·</div>
                  )}
                  <div className="min-w-0">
                    <p className="parent-activity-title">{event.title || t('parentProgressCurrentStory')}</p>
                    <p className="parent-activity-meta">{relativeTime(event.occurred_at, locale, t)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="parent-panel">
          <h3 className="parent-panel-title">{t('parentProgressWeekly')}</h3>
          <p className="parent-week-total">{formatParentDuration(weekly.totalReadingSeconds)}</p>
          <div className="parent-week-bars" role="img" aria-label={t('parentProgressChartLabel')}>
            {weekly.days.length === 0 ? (
              <p className="text-body text-foreground-muted font-medium w-full text-center py-space-24">
                {t('parentProgressEmpty')}
              </p>
            ) : (
              weekly.days.map((day) => {
                const label = new Date(`${day.day}T12:00:00`).toLocaleDateString(locale, { weekday: 'short' });
                const height = Math.max(8, day.heightPercent);
                return (
                  <div key={day.day} className="parent-week-col">
                    <div className="parent-week-track" aria-hidden="true">
                      <div className="parent-week-fill" style={{ height: `${height}%` }} />
                    </div>
                    <span className="parent-week-label">{label}</span>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article className="parent-panel">
          <h3 className="parent-panel-title">{t('parentProfileCategories')}</h3>
          <p className="parent-panel-subtitle">{t('parentHomeCategoriesHint')}</p>
          {themes.length === 0 ? (
            <p className="text-body text-foreground-muted font-medium">{t('parentProfileCategoriesEmpty')}</p>
          ) : (
            <>
              <div
                className="parent-donut"
                style={{ background: buildDonutGradient(themes) }}
                role="img"
                aria-label={t('parentProfileCategories')}
              >
                <div className="parent-donut-hole">
                  {themes[0] ? getThemeLabel(themes[0].id) : '—'}
                </div>
              </div>
              <ul className="parent-theme-legend">
                {themes.map((theme, index) => {
                  const total = themes.reduce((sum, item) => sum + item.count, 0) || 1;
                  const percent = Math.round((theme.count / total) * 100);
                  return (
                    <li key={theme.id} className="parent-theme-row">
                      <span>
                        <span
                          className="parent-theme-swatch"
                          style={{ background: THEME_COLORS[index % THEME_COLORS.length] }}
                          aria-hidden="true"
                        />
                        {getThemeLabel(theme.id)}
                      </span>
                      <span>{percent}%</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </article>
      </section>
    </div>
  );
}

export default ParentOverviewBoard;
