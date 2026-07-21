import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, kidsCardAppear } from '../../constants/kidsMotion';
import {
  buildMonthlyReadingSeconds,
  buildWeeklyProgress,
  collectFavoriteThemes,
  getThemeLabel,
  getTodayReadingSeconds,
} from '../../utils/parentInsights';
import { formatParentDuration } from './parentFormatters';
import { KidsBookCover } from '../kids/KidsBookCover';

function StatPill({ label, value }) {
  return (
    <div className="parent-progress-pill">
      <p className="parent-progress-pill-label">{label}</p>
      <p className="parent-progress-pill-value">{value}</p>
    </div>
  );
}

export function ParentReadingProgress({ data, kidName, t, language = 'fr' }) {
  const reducedMotion = useReducedMotion();
  const weekly = buildWeeklyProgress(data, 7);
  const monthlySeconds = buildMonthlyReadingSeconds(data);
  const todaySeconds = getTodayReadingSeconds(data);
  const summary = data?.summary || {};
  const favoriteTheme = collectFavoriteThemes(data, 1)[0];
  const continueBook = (data?.progress?.items || []).find(
    (book) => (book.progress_percent || 0) > 0 && (book.progress_percent || 0) < 100,
  ) || (data?.progress?.items || [])[0];
  const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-US' : 'fr-FR';

  return (
    <section className="parent-section" aria-labelledby="parent-progress-heading">
      <header className="mb-space-24">
        <h2 id="parent-progress-heading" className="text-heading-xl font-black text-foreground">
          {t('parentProgressTitle')}
        </h2>
        <p className="text-body-lg text-foreground-secondary font-medium mt-1">
          {t('parentProgressSubtitle', { name: kidName || t('parentChild') })}
        </p>
      </header>

      <motion.div
        {...getMotionProps(reducedMotion, kidsCardAppear)}
        className="parent-progress-panel"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-12 mb-space-24">
          <StatPill label={t('parentProgressToday')} value={formatParentDuration(todaySeconds)} />
          <StatPill label={t('parentProgressWeekly')} value={formatParentDuration(weekly.totalReadingSeconds)} />
          <StatPill label={t('parentHomeListening')} value={formatParentDuration(weekly.totalListeningSeconds)} />
          <StatPill label={t('parentProgressBooksDone')} value={String(summary.books_completed || 0)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-12 mb-space-24">
          <div className="parent-progress-spotlight">
            <p className="parent-progress-pill-label">{t('parentProgressMonthly')}</p>
            <p className="parent-progress-spotlight-value">{formatParentDuration(monthlySeconds)}</p>
          </div>
          <div className="parent-progress-spotlight">
            <p className="parent-progress-pill-label">{t('parentProfileCategories')}</p>
            <p className="parent-progress-spotlight-value">{favoriteTheme ? getThemeLabel(favoriteTheme.id) : '—'}</p>
          </div>
        </div>

        <div className="parent-progress-chart" role="img" aria-label={t('parentProgressChartLabel')}>
          {weekly.days.length === 0 ? (
            <p className="text-body text-foreground-muted font-medium py-space-24 text-center">
              {t('parentProgressEmpty')}
            </p>
          ) : (
            weekly.days.map((day) => {
              const label = new Date(`${day.day}T12:00:00`).toLocaleDateString(locale, { weekday: 'short' });
              const height = Math.max(8, day.heightPercent);
              return (
                <div key={day.day} className="parent-progress-bar-col">
                  <div className="parent-progress-bar-track" aria-hidden="true">
                    <motion.div
                      className="parent-progress-bar-fill"
                      initial={reducedMotion ? false : { height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: reducedMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <span className="parent-progress-bar-label">{label}</span>
                </div>
              );
            })
          )}
        </div>

        {continueBook ? (
          <div className="parent-progress-current mt-space-24">
            <div className="parent-progress-current-cover">
              <KidsBookCover
                book={continueBook}
                alt={continueBook.title || ''}
                imgClassName="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-caption font-bold text-foreground-muted uppercase tracking-wide mb-1">
                {t('parentProgressCurrentStory')}
              </p>
              <p className="text-heading-m font-black text-foreground truncate">{continueBook.title}</p>
              <p className="text-body text-foreground-secondary font-medium mt-1">
                {t('parentHomeContinueProgress', { percent: continueBook.progress_percent || 0 })}
              </p>
              <div className="parent-progress-mini-track mt-space-12" role="progressbar" aria-valuenow={continueBook.progress_percent || 0} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className="parent-progress-mini-fill"
                  style={{ width: `${Math.min(100, Math.max(0, continueBook.progress_percent || 0))}%` }}
                />
              </div>
            </div>
          </div>
        ) : null}
      </motion.div>
    </section>
  );
}

export default ParentReadingProgress;
