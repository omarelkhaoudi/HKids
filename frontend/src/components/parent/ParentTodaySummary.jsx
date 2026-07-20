import { motion } from 'framer-motion';
import { HeartIcon } from '../Icons';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  getHoverMotion, getMotionProps, kidsCardAppear,
} from '../../constants/kidsMotion';
import { formatParentDuration } from './parentFormatters';
import { getTodayReadingSeconds } from '../../utils/parentInsights';
import { KidsBookCover } from '../kids/KidsBookCover';

function ContinueTogetherCard({ book, t }) {
  const reducedMotion = useReducedMotion();
  if (!book) {
    return (
      <motion.article
        {...getMotionProps(reducedMotion, kidsCardAppear)}
        className="parent-warm-card parent-today-continue"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100/80 to-orange-50/40 text-orange-700 mb-space-16 shadow-soft">
          <HeartIcon className="w-6 h-6" aria-hidden="true" />
        </div>
        <p className="text-caption font-bold text-foreground-muted uppercase tracking-wide mb-1">{t('parentHomeContinueTogether')}</p>
        <p className="text-heading-l font-black text-foreground">{t('parentHomeContinueEmpty')}</p>
        <p className="text-body text-foreground-secondary mt-2 font-medium">{t('parentHomeContinueEmptyDesc')}</p>
      </motion.article>
    );
  }

  return (
    <motion.article
      {...getMotionProps(reducedMotion, kidsCardAppear)}
      {...getHoverMotion(reducedMotion)}
      className="parent-warm-card parent-today-continue flex flex-col sm:flex-row gap-space-16 items-center"
    >
      <div className="shrink-0 w-24 h-32 rounded-2xl overflow-hidden shadow-card bg-surface-secondary relative">
        <KidsBookCover
          book={book}
          alt={book.title || ''}
          imgClassName="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="min-w-0 text-center sm:text-start">
        <p className="text-caption font-bold text-foreground-muted uppercase tracking-wide mb-1">{t('parentHomeContinueTogether')}</p>
        <p className="text-heading-l font-black text-foreground truncate">{book.title}</p>
        <p className="text-body-lg text-foreground-secondary font-medium mt-1">
          {t('parentHomeContinueProgress', { percent: book.progress_percent || 0 })}
        </p>
      </div>
    </motion.article>
  );
}

export function ParentTodaySummary({ data, kidName, t }) {
  const reducedMotion = useReducedMotion();
  const summary = data?.summary || {};
  const progressItems = data?.progress?.items || [];
  const continueBook = progressItems.find((b) => (b.progress_percent || 0) > 0 && (b.progress_percent || 0) < 100) || progressItems[0];
  const todaySeconds = getTodayReadingSeconds(data);
  const todayMinutes = Math.max(0, Math.floor(todaySeconds / 60));
  const name = kidName || t('parentChild');

  const heroMessage = todayMinutes > 0
    ? t('parentHomeHeroReadToday', { name, minutes: todayMinutes })
    : t('parentHomeHeroNoReadToday', { name });

  return (
    <section className="parent-section" aria-labelledby="parent-today-heading">
      <motion.div
        {...getMotionProps(reducedMotion, kidsCardAppear)}
        className="parent-today-hero"
      >
        <p className="parent-today-hero-kicker">{t('parentHomeTodaySubtitle')}</p>
        <h2 id="parent-today-heading" className="parent-today-hero-title">
          {t('parentHomeTodayTitle', { name })}
        </h2>
        <p className="parent-today-hero-message">{heroMessage}</p>

        <div className="parent-today-hero-meta" aria-label={t('parentHomeTodayReading')}>
          <div>
            <p className="parent-today-meta-label">{t('parentHomeTodayReading')}</p>
            <p className="parent-today-meta-value">{formatParentDuration(todaySeconds)}</p>
          </div>
          <div>
            <p className="parent-today-meta-label">{t('parentHomeBooksCompleted')}</p>
            <p className="parent-today-meta-value">{summary.books_completed || 0}</p>
          </div>
          <div>
            <p className="parent-today-meta-label">{t('parentHomeStreakLabel')}</p>
            <p className="parent-today-meta-value">
              {Number(summary.reading_streak_days || 0) > 0
                ? t('parentHomeStreakDays', { days: summary.reading_streak_days })
                : '—'}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="mt-space-16">
        <ContinueTogetherCard book={continueBook} t={t} />
      </div>
    </section>
  );
}

export default ParentTodaySummary;
