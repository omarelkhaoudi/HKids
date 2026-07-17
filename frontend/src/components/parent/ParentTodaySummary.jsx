import { motion } from 'framer-motion';
import {
  BookIcon, BrainIcon, ClockIcon, HeartIcon, SparklesIcon, StarIcon,
} from '../Icons';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  getHoverMotion, getMotionProps, kidsCardAppear, kidsStaggerContainer,
} from '../../constants/kidsMotion';
import { formatParentDuration } from './parentFormatters';
import { getFileUrl } from '../../utils/fileUrl';

function SummaryCard({ icon, label, value, detail, accent = 'primary', index = 0 }) {
  const reducedMotion = useReducedMotion();
  const accentMap = {
    primary: 'from-primary-100/80 to-primary-50/40 text-primary-700 dark:text-primary-300',
    secondary: 'from-secondary-100/80 to-secondary-50/40 text-secondary-700 dark:text-secondary-300',
    magic: 'from-magic-100/80 to-magic-50/40 text-magic-700 dark:text-magic-300',
    success: 'from-success-100/80 to-success-50/40 text-success-700 dark:text-success-300',
    orange: 'from-orange-100/80 to-orange-50/40 text-orange-700 dark:text-orange-300',
  };

  return (
    <motion.article
      {...getMotionProps(reducedMotion, {
        ...kidsCardAppear,
        transition: { ...kidsCardAppear.transition, delay: index * 0.05 },
      })}
      {...getHoverMotion(reducedMotion)}
      className="parent-warm-card group"
      aria-label={`${label}: ${value}`}
    >
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${accentMap[accent] || accentMap.primary} mb-space-16 shadow-soft`}>
        {icon}
      </div>
      <p className="text-caption font-bold text-foreground-muted uppercase tracking-wide mb-1">{label}</p>
      <p className="text-heading-xl font-black text-foreground leading-tight">{value}</p>
      {detail && <p className="text-body text-foreground-secondary mt-2 font-medium">{detail}</p>}
    </motion.article>
  );
}

function ContinueTogetherCard({ book, t, index }) {
  const reducedMotion = useReducedMotion();
  if (!book) {
    return (
      <SummaryCard
        index={index}
        icon={<HeartIcon className="w-6 h-6" aria-hidden="true" />}
        label={t('parentHomeContinueTogether')}
        value={t('parentHomeContinueEmpty')}
        detail={t('parentHomeContinueEmptyDesc')}
        accent="orange"
      />
    );
  }

  return (
    <motion.article
      {...getMotionProps(reducedMotion, {
        ...kidsCardAppear,
        transition: { ...kidsCardAppear.transition, delay: index * 0.05 },
      })}
      {...getHoverMotion(reducedMotion)}
      className="parent-warm-card md:col-span-2 flex flex-col sm:flex-row gap-space-16 items-center"
    >
      <div className="shrink-0 w-24 h-32 rounded-2xl overflow-hidden shadow-card bg-surface-secondary">
        {book.cover_image ? (
          <img src={getFileUrl(book.cover_image)} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-primary-100 to-secondary-100" aria-hidden="true">📖</div>
        )}
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

export function ParentTodaySummary({ data, kidName, t, language = 'fr' }) {
  const reducedMotion = useReducedMotion();
  const summary = data?.summary || {};
  const timeline = data?.timeline?.items || [];
  const progressItems = data?.progress?.items || [];
  const continueBook = progressItems.find((b) => (b.progress_percent || 0) > 0 && (b.progress_percent || 0) < 100) || progressItems[0];
  const latestEvent = timeline[0];
  const quizRate = Number(summary.quiz_attempts || 0) > 0
    ? Math.round((Number(summary.quiz_successes || 0) / Number(summary.quiz_attempts)) * 100)
    : 0;

  let achievementLabel = t('parentHomeAchievementStart');
  if (Number(summary.reading_streak_days || 0) >= 3) {
    achievementLabel = t('parentHomeAchievementStreak', { days: summary.reading_streak_days });
  } else if (Number(summary.books_completed || 0) > 0) {
    achievementLabel = t('parentHomeAchievementBooks', { count: summary.books_completed });
  } else if (latestEvent?.title) {
    achievementLabel = latestEvent.title;
  }

  return (
    <section className="parent-section" aria-labelledby="parent-today-heading">
      <header className="mb-space-24">
        <h2 id="parent-today-heading" className="text-heading-xl font-black text-foreground">
          {t('parentHomeTodayTitle', { name: kidName || t('parentChild') })}
        </h2>
        <p className="text-body-lg text-foreground-secondary font-medium mt-1">{t('parentHomeTodaySubtitle')}</p>
      </header>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-space-16"
        {...(reducedMotion ? {} : kidsStaggerContainer)}
      >
        <SummaryCard
          index={0}
          icon={<ClockIcon className="w-6 h-6" aria-hidden="true" />}
          label={t('parentHomeTodayReading')}
          value={formatParentDuration(summary.reading_seconds)}
          detail={t('parentHomeSessions', { count: summary.reading_sessions || 0 })}
          accent="primary"
        />
        <SummaryCard
          index={1}
          icon={<BookIcon className="w-6 h-6" aria-hidden="true" />}
          label={t('parentHomeBooksCompleted')}
          value={String(summary.books_completed || 0)}
          detail={t('parentHomeBooksStarted', { count: summary.books_started || 0 })}
          accent="secondary"
        />
        <SummaryCard
          index={2}
          icon={<SparklesIcon className="w-6 h-6" aria-hidden="true" />}
          label={t('parentHomeListening')}
          value={formatParentDuration(summary.reading_seconds)}
          detail={t('parentHomeListeningDesc')}
          accent="magic"
        />
        <SummaryCard
          index={3}
          icon={<BrainIcon className="w-6 h-6" aria-hidden="true" />}
          label={t('parentHomeLearning')}
          value={quizRate > 0 ? `${quizRate}%` : '—'}
          detail={t('parentHomeLearningDesc', { attempts: summary.quiz_attempts || 0 })}
          accent="success"
        />
        <SummaryCard
          index={4}
          icon={<StarIcon className="w-6 h-6" aria-hidden="true" />}
          label={t('parentHomeAchievement')}
          value={achievementLabel}
          detail={Number(summary.reading_streak_days || 0) > 0
            ? t('parentHomeStreakDays', { days: summary.reading_streak_days })
            : t('parentHomeAchievementEncourage')}
          accent="orange"
        />
        <ContinueTogetherCard book={continueBook} t={t} index={5} />
      </motion.div>
    </section>
  );
}

export default ParentTodaySummary;
