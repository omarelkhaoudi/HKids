import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Badge, ProgressBar } from '../ui';
import {
  BookIcon, EditIcon, LockIcon, StarIcon, TrashIcon,
} from '../Icons';
import { KidAvatar } from './KidAvatar';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion, getMotionProps, kidsCardAppear } from '../../constants/kidsMotion';
import { KidsBookCover } from '../kids/KidsBookCover';
import { collectFavoriteThemes, getThemeLabel } from '../../utils/parentInsights';

export function ParentChildProfilePanel({
  kid,
  data,
  t,
  onEdit,
  onAccount,
  onDelete,
  isSelected,
}) {
  const reducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const summary = data?.summary || {};
  const favorites = data?.favorites?.items || [];
  const interests = Array.isArray(kid?.interests) ? kid.interests : [];
  const goal = data?.goal;
  const goalPercent = Math.max(0, Math.min(100, Number(goal?.progress_percent || 0)));
  const continueBook = (data?.progress?.items || []).find(
    (book) => (book.progress_percent || 0) > 0 && (book.progress_percent || 0) < 100,
  ) || (data?.progress?.items || [])[0];

  const achievements = [];
  if (Number(summary.books_completed || 0) >= 1) {
    achievements.push({ emoji: '📚', label: t('parentProfileAchBooks', { count: summary.books_completed }) });
  }
  if (Number(summary.reading_streak_days || 0) >= 2) {
    achievements.push({ emoji: '🔥', label: t('parentProfileAchStreak', { days: summary.reading_streak_days }) });
  }
  if (Number(summary.quiz_successes || 0) >= 1) {
    achievements.push({ emoji: '🧠', label: t('parentProfileAchQuiz') });
  }
  if (favorites.length >= 3) {
    achievements.push({ emoji: '💛', label: t('parentProfileAchFavorites') });
  }

  const favoriteThemes = collectFavoriteThemes(data, 4);

  return (
    <motion.section
      {...getMotionProps(reducedMotion, kidsCardAppear)}
      className="parent-profile-panel parent-panel !p-0 overflow-hidden border-0"
      aria-labelledby="parent-profile-heading"
    >
      <div className="parent-profile-hero bg-gradient-to-br from-[#fffaf3] via-[#fff7ee] to-primary-50/70 dark:from-primary-950/30 dark:via-card dark:to-secondary-950/20 p-space-24 md:p-space-32">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-space-24">
          <motion.div {...getHoverMotion(reducedMotion)} className="shrink-0">
            <KidAvatar kid={kid} size="xl" className="!w-32 !h-32 md:!w-40 md:!h-40 ring-4 ring-white shadow-floating" />
          </motion.div>
          <div className="flex-1 text-center md:text-start min-w-0">
            <h2 id="parent-profile-heading" className="text-hero font-black text-foreground tracking-tight">
              {kid.name}
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-space-8">
              {kid.age && <Badge variant="secondary">{t('parentKidAgeYears', { age: kid.age })}</Badge>}
              {Number(summary.reading_streak_days || 0) > 0 && (
                <Badge variant="primary" className="gap-1">
                  <StarIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('parentHomeStreakDays', { days: summary.reading_streak_days })}
                </Badge>
              )}
            </div>
            {interests.length > 0 && (
              <div className="mt-space-16">
                <p className="text-caption font-bold text-foreground-muted uppercase tracking-wide mb-2">{t('parentProfileInterests')}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  {interests.slice(0, 6).map((interest) => (
                    <span key={interest} className="rounded-full bg-card px-3 py-1.5 text-body font-bold text-foreground-secondary shadow-soft border border-border/50">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-space-24 md:p-space-32 grid grid-cols-1 lg:grid-cols-2 gap-space-24">
        {continueBook ? (
          <div className="lg:col-span-2 parent-profile-adventure">
            <div className="parent-profile-adventure-cover">
              <KidsBookCover
                book={continueBook}
                alt={continueBook.title || ''}
                imgClassName="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-caption font-bold text-foreground-muted uppercase tracking-wide mb-1">
                {t('parentProfileCurrentAdventure')}
              </p>
              <p className="text-heading-m font-black text-foreground truncate">{continueBook.title}</p>
              <p className="text-body text-foreground-secondary font-medium mt-1">
                {t('parentHomeContinueProgress', { percent: continueBook.progress_percent || 0 })}
              </p>
            </div>
          </div>
        ) : null}

        <div>
          <h3 className="text-heading-m font-black text-foreground mb-space-16">{t('parentProfileFavoriteBooks')}</h3>
          {favorites.length === 0 ? (
            <p className="text-body text-foreground-muted font-medium">{t('parentAnalyticsNoFavorites')}</p>
          ) : (
            <div className="flex gap-space-12 overflow-x-auto parent-discovery-rail pb-space-4">
              {favorites.slice(0, 6).map((book) => (
                <div key={book.book_id} className="shrink-0 w-20">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-card bg-surface-secondary relative">
                    <KidsBookCover
                      book={book}
                      alt={book.title || ''}
                      imgClassName="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-heading-m font-black text-foreground mb-space-16">{t('parentProfileCategories')}</h3>
          {favoriteThemes.length === 0 ? (
            <p className="text-body text-foreground-muted font-medium">{t('parentProfileCategoriesEmpty')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {favoriteThemes.map((theme) => (
                <span key={theme.id} className="rounded-full bg-primary-50 dark:bg-primary-950/40 px-3 py-1.5 text-body font-bold text-primary-700 dark:text-primary-300">
                  {getThemeLabel(theme.id)}
                </span>
              ))}
            </div>
          )}
        </div>

        {goal && (
          <div className="lg:col-span-2 rounded-32 bg-surface-secondary/60 p-space-24 border border-border/40">
            <div className="flex items-center justify-between gap-space-16 mb-space-12">
              <h3 className="text-heading-m font-black text-foreground">{t('parentReadingGoal')}</h3>
              <span className="text-heading-l font-black text-primary-600">{goalPercent}%</span>
            </div>
            <ProgressBar progress={goalPercent} className="mb-space-8" />
            <p className="text-body text-foreground-secondary font-medium">
              {goal.progress_value} / {goal.target_value} {goal.goal_type === 'minutes' ? t('parentGoalMinutes').toLowerCase() : ''}
            </p>
          </div>
        )}

        {achievements.length > 0 && (
          <div className="lg:col-span-2">
            <h3 className="text-heading-m font-black text-foreground mb-space-16">{t('parentProfileAchievements')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-12">
              {achievements.map((ach) => (
                <motion.div
                  key={ach.label}
                  {...getHoverMotion(reducedMotion)}
                  className="parent-warm-card !p-space-16 text-center"
                >
                  <span className="text-3xl block mb-2" aria-hidden="true">{ach.emoji}</span>
                  <p className="text-caption font-bold text-foreground leading-snug">{ach.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isSelected && (
        <div className="border-t border-border/50 p-space-16 md:px-space-32 flex flex-wrap gap-space-8 justify-center md:justify-end">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 min-h-touch px-space-16 rounded-2xl bg-surface-secondary font-bold text-foreground-secondary hover:bg-primary-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <EditIcon className="w-4 h-4" aria-hidden="true" />
            {t('parentEditKid')}
          </button>
          <button
            type="button"
            onClick={onAccount}
            className="inline-flex items-center gap-2 min-h-touch px-space-16 rounded-2xl bg-surface-secondary font-bold text-foreground-secondary hover:bg-primary-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <LockIcon className="w-4 h-4" aria-hidden="true" />
            {t('parentKidAccount')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/parent/profiles')}
            className="inline-flex items-center gap-2 min-h-touch px-space-16 rounded-2xl bg-primary-500 font-bold text-white hover:bg-primary-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <BookIcon className="w-4 h-4" aria-hidden="true" />
            {t('parentProfileViewFull')}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-2 min-h-touch px-space-16 rounded-2xl font-bold text-danger-600 hover:bg-danger-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-400"
          >
            <TrashIcon className="w-4 h-4" aria-hidden="true" />
            {t('parentDeleteKid')}
          </button>
        </div>
      )}
    </motion.section>
  );
}

export default ParentChildProfilePanel;
