import { motion } from 'framer-motion';
import { Card, ProgressBar, Skeleton } from '../ui';
import {
  BookIcon,
  BrainIcon,
  ClockIcon,
  HistoryIcon,
  StarIcon
} from '../Icons';
import { getFileUrl } from '../../utils/fileUrl';

function duration(seconds = 0) {
  const minutes = Math.floor(Number(seconds || 0) / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}

function dateLabel(value, locale) {
  if (!value) return '—';
  return new Date(value).toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function MetricCard({ icon, label, value, detail }) {
  return (
    <Card className="p-5 shadow-floating border-none">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 rounded-xl bg-primary-100 text-foreground-600">{icon}</div>
        <span className="font-bold text-foreground-muted">{label}</span>
      </div>
      <p className="text-3xl font-black">{value}</p>
      {detail && <p className="text-xs text-foreground-muted mt-1">{detail}</p>}
    </Card>
  );
}

function DailyActivityChart({ items = [], locale = 'fr-FR' }) {
  const maxSeconds = Math.max(1, ...items.map((item) => (
    Number(item.screen_seconds) || (Number(item.reading_seconds) + Number(item.quiz_seconds))
  )));

  return (
    <div role="img" aria-label="Daily activity chart">
      <div className="h-56 flex items-end gap-2 border-b border-s border-border px-3 pt-4">
        {items.map((item) => {
          const total = Number(item.screen_seconds)
            || (Number(item.reading_seconds) + Number(item.quiz_seconds));
          const height = Math.max(total > 0 ? 5 : 1, Math.round((total / maxSeconds) * 100));
          return (
            <div key={item.day} className="flex-1 h-full flex flex-col justify-end items-center group min-w-0">
              <span className="text-[10px] font-bold text-foreground-muted mb-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
                {Math.floor(total / 60)}m
              </span>
              <motion.div
                tabIndex={0}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-primary-600 to-secondary-400 outline-none focus:ring-2 focus:ring-primary-400"
                title={`${duration(item.screen_seconds)} / ${duration(item.reading_seconds)}`}
              />
              <span className="text-[10px] font-bold text-foreground-muted mt-2">
                {new Date(item.day).toLocaleDateString(locale, { weekday: 'short' }).slice(0, 2)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="sr-only">
        {items.map((item) => (
          <p key={item.day}>{item.day}: {item.screen_seconds} secondes écran, {item.reading_seconds} secondes lecture, {item.quiz_attempts} quiz.</p>
        ))}
      </div>
    </div>
  );
}

function GoalRing({ goal, t }) {
  const percent = Math.max(0, Math.min(100, Number(goal?.progress_percent || 0)));
  const circumference = 351;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32 flex items-center justify-center" role="img" aria-label={`Objectif atteint à ${percent}%`}>
        <svg className="w-full h-full -rotate-90" aria-hidden="true">
          <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-surface-100" />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (circumference * percent / 100) }}
            cx="64"
            cy="64"
            r="56"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeLinecap="round"
            className="text-foreground-secondary-500"
          />
        </svg>
        <span className="absolute text-3xl font-black">{percent}%</span>
      </div>
      <p className="mt-3 text-center text-sm font-bold text-foreground-secondary">
        {goal ? `${goal.progress_value} / ${goal.target_value} ${goal.goal_type === 'minutes' ? t('parentGoalMinutes').toLowerCase() : ''}` : t('parentAnalyticsNoGoal')}
      </p>
    </div>
  );
}

function EmptyBlock({ children }) {
  return <p className="py-8 text-center text-sm text-foreground-muted">{children}</p>;
}

export function ParentDashboardAnalytics({ data, loading, language = 'fr', t = (key) => key }) {
  const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-US' : 'fr-FR';

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-32 rounded-3xl" />)}
        </div>
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }
  if (!data) return <Card className="p-8"><EmptyBlock>{t('parentAnalyticsNoData')}</EmptyBlock></Card>;

  const summary = data.summary || {};
  const screenLimitSeconds = Number(summary.daily_screen_limit_minutes || 0) * 60;
  const screenPercent = screenLimitSeconds > 0
    ? Math.min(100, Math.round((Number(summary.screen_seconds_today || 0) / screenLimitSeconds) * 100))
    : 0;
  const quizRate = Number(summary.quiz_attempts || 0) > 0
    ? Math.round((Number(summary.quiz_successes || 0) / Number(summary.quiz_attempts)) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <MetricCard icon={<ClockIcon className="w-5 h-5" />} label={t('parentAnalyticsReading')} value={duration(summary.reading_seconds)} detail={`${summary.reading_sessions || 0} sessions`} />
        <MetricCard icon={<ClockIcon className="w-5 h-5" />} label={t('parentAnalyticsScreen')} value={duration(summary.screen_seconds_today)} detail={`${duration(summary.screen_remaining_seconds_today)}`} />
        <MetricCard icon={<BookIcon className="w-5 h-5" />} label={t('parentAnalyticsProgress')} value={`${summary.average_progress_percent || 0}%`} detail={`${summary.books_completed || 0}`} />
        <MetricCard icon={<BrainIcon className="w-5 h-5" />} label={t('parentAnalyticsQuiz')} value={`${summary.quiz_attempts || 0}`} detail={`${summary.quiz_successes || 0} / ${summary.average_quiz_score || 0}%`} />
        <MetricCard icon={<StarIcon className="w-5 h-5" />} label={t('parentAnalyticsFavorites')} value={data.favorites?.total || 0} detail="" />
        <MetricCard icon={<HistoryIcon className="w-5 h-5" />} label={t('parentAnalyticsStreak')} value={`${summary.reading_streak_days || 0}`} detail={`${data.history?.total || 0}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 shadow-floating">
          <h2 className="text-xl font-black mb-1">{t('parentAnalyticsDaily')}</h2>
          <p className="text-sm text-foreground-muted mb-5">{t('parentAnalyticsDailyDesc', { days: data.period?.days || 7 })}</p>
          <DailyActivityChart items={data.daily_activity || []} locale={locale} />
        </Card>
        <Card className="p-6 shadow-floating flex flex-col justify-center">
          <h2 className="text-xl font-black mb-5 text-center">{t('parentAnalyticsGoal')}</h2>
          <GoalRing goal={data.goal} t={t} />
          <div className="mt-6">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span>{t('parentAnalyticsScreen')}</span><span>{t('parentAnalyticsScreenLimit', { percent: screenPercent })}</span>
            </div>
            <ProgressBar progress={screenPercent} />
          </div>
        </Card>
      </div>

      <Card className="p-6 shadow-floating">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black">{t('parentAnalyticsBookProgress')}</h2>
          <span className="text-sm font-bold text-foreground-muted">{t('parentAnalyticsStarted', { count: summary.books_started || 0 })}</span>
        </div>
        {(data.progress?.items || []).length === 0 ? <EmptyBlock>{t('parentAnalyticsNoBooks')}</EmptyBlock> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.progress.items.map((book) => (
              <div key={book.book_id} className="p-4 rounded-2xl bg-surface-secondary">
                <div className="flex justify-between gap-3 mb-2">
                  <span className="font-bold truncate">{book.title}</span>
                  <span className="text-sm font-black">{book.progress_percent}%</span>
                </div>
                <ProgressBar progress={book.progress_percent} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-6 shadow-floating">
          <h2 className="text-xl font-black mb-5">{t('parentAnalyticsFavorites')}</h2>
          {(data.favorites?.items || []).length === 0 ? <EmptyBlock>{t('parentAnalyticsNoFavorites')}</EmptyBlock> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {data.favorites.items.map((book) => (
                <div key={book.book_id} className="min-w-0">
                  <img src={getFileUrl(book.cover_image)} alt="" className="w-full aspect-[3/4] object-cover rounded-xl bg-surface-secondary" />
                  <p className="font-bold text-sm mt-2 truncate">{book.title}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 shadow-floating">
          <h2 className="text-xl font-black mb-5">{t('parentAnalyticsQuizLearning')}</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-surface-secondary p-4"><p className="text-2xl font-black">{summary.quiz_attempts || 0}</p><p className="text-xs text-foreground-muted">{t('parentAnalyticsAttempts')}</p></div>
            <div className="rounded-2xl bg-surface-secondary p-4"><p className="text-2xl font-black">{quizRate}%</p><p className="text-xs text-foreground-muted">{t('parentAnalyticsSuccess')}</p></div>
            <div className="rounded-2xl bg-surface-secondary p-4"><p className="text-2xl font-black">{duration(summary.quiz_seconds)}</p><p className="text-xs text-foreground-muted">{t('parentAnalyticsTime')}</p></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-6 shadow-floating">
          <h2 className="text-xl font-black mb-5">{t('parentAnalyticsHistory')}</h2>
          <div className="max-h-[32rem] overflow-y-auto space-y-3 pe-2">
            {(data.history?.items || []).length === 0 ? <EmptyBlock>{t('parentAnalyticsNoHistory')}</EmptyBlock> : data.history.items.map((item) => (
              <div key={item.book_id} className="p-4 rounded-2xl bg-surface-secondary flex justify-between gap-3">
                <div className="min-w-0"><p className="font-bold truncate">{item.title}</p><p className="text-xs text-foreground-muted">{dateLabel(item.last_opened_at, locale)}</p></div>
                <span className="text-sm font-black shrink-0">{t('parentAnalyticsPage', { page: item.last_page })}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 shadow-floating">
          <h2 className="text-xl font-black mb-5">{t('parentAnalyticsRecent')}</h2>
          <div className="max-h-[32rem] overflow-y-auto space-y-4 pe-2">
            {(data.timeline?.items || []).length === 0 ? <EmptyBlock>{t('parentAnalyticsNoActivity')}</EmptyBlock> : data.timeline.items.map((event, index) => (
              <div key={`${event.type}-${event.occurred_at}-${index}`} className="border-s-2 border-primary-300 ps-4">
                <p className="font-bold">{event.type === 'quiz' ? t('parentAnalyticsEventQuiz') : event.type === 'favorite' ? t('parentAnalyticsEventFavorite') : t('parentAnalyticsEventReading')} : {event.title}</p>
                <p className="text-xs text-foreground-muted">{dateLabel(event.occurred_at, locale)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
