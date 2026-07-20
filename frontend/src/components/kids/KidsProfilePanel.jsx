import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui';
import { getImageUrl } from '../../utils/imageUrl';
import { storage } from '../../utils/storage';
import { deriveBookTheme } from '../../utils/bookCover';
import { KidsMediaCard } from './KidsMediaCard';
import { KidsEmptyState } from './KidsEmptyState';
import { KidsBookCover } from './KidsBookCover';
import KidsButton from './KidsButton';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion, getMotionProps, kidsCardAppear, kidsCarouselReveal } from '../../constants/kidsMotion';
import { PlayIcon, BookIcon, StarIcon } from '../Icons';

function ProgressRing({ progress = 0, size = 132, label }) {
  const safeProgress = Math.min(100, Math.max(0, Number(progress) || 0));
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeProgress / 100) * circumference;

  return (
    <div
      className="kids-profile-progress-ring"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          className="kids-profile-progress-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="kids-profile-progress-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="kids-profile-progress-value">{Math.round(safeProgress)}%</span>
    </div>
  );
}

function ProfileShelf({ title, subtitle, books, emptyTitle, emptyDescription, emptyActionLabel, onEmptyAction, isRtl, onPlayBook, t }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.section
      className="kids-profile-shelf"
      aria-label={title}
      {...getMotionProps(reducedMotion, kidsCarouselReveal)}
    >
      <div className="kids-profile-shelf-head">
        <h3 className="kids-shelf-title !mb-1">{title}</h3>
        {subtitle ? <p className="kids-shelf-subtitle !mt-0">{subtitle}</p> : null}
      </div>
      {books.length > 0 ? (
        <div className="kids-profile-shelf-rail kids-scroll-smooth custom-scrollbar">
          {books.map((book) => (
            <div key={book.id} className="snap-start shrink-0">
              <KidsMediaCard book={book} variant="carousel" hideTitle={false} isRtl={isRtl} onPlay={onPlayBook} />
            </div>
          ))}
        </div>
      ) : (
        <KidsEmptyState
          title={emptyTitle}
          description={emptyDescription}
          compact
          showMascot
          mascotMood="encourage"
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
          className="kids-profile-empty"
        />
      )}
    </motion.section>
  );
}

function AchievementCard({ achievement, reducedMotion }) {
  return (
    <motion.article
      {...getHoverMotion(reducedMotion)}
      className={`kids-profile-achievement ${achievement.earned ? 'is-earned' : 'is-locked'}`}
      title={achievement.description}
    >
      <div className="kids-profile-achievement-art" aria-hidden="true">
        {achievement.earned ? (
          <span className="kids-profile-achievement-icon">{achievement.icon}</span>
        ) : (
          <span className="kids-profile-achievement-lock">✦</span>
        )}
      </div>
      <h4 className="kids-profile-achievement-title">{achievement.label}</h4>
      <p className="kids-profile-achievement-copy">{achievement.description}</p>
    </motion.article>
  );
}

function mapProgressToBook(row, publishedBooks = []) {
  const published = publishedBooks.find((book) => book.id === row.book_id);
  return {
    ...(published || {}),
    id: row.book_id,
    title: row.book_title || published?.title,
    cover_image: published?.cover_image || row.cover_image,
    slug: published?.slug || row.slug,
    theme: published?.theme || row.theme,
    author: published?.author || row.author,
    kid_progress_percent: row.progress_percent,
    current_page: row.current_page,
    completed: row.completed,
  };
}

function buildReadingAchievements({ badges = [], completedCount = 0, favoriteCount = 0, t }) {
  const fromApi = badges.map((badge) => ({
    id: badge.id,
    label: badge.label,
    description: badge.description,
    icon: badge.icon || '📖',
    earned: Boolean(badge.earned),
  }));

  const derived = [
    {
      id: 'first-story',
      label: t('kidProfileAchFirstStory'),
      description: t('kidProfileAchFirstStoryDesc'),
      icon: '🌱',
      earned: completedCount >= 1,
    },
    {
      id: 'ten-stories',
      label: t('kidProfileAchTenStories'),
      description: t('kidProfileAchTenStoriesDesc'),
      icon: '📚',
      earned: completedCount >= 10,
    },
    {
      id: 'curious-mind',
      label: t('kidProfileAchCurious'),
      description: t('kidProfileAchCuriousDesc'),
      icon: '🔍',
      earned: completedCount >= 3,
    },
    {
      id: 'bedtime-reader',
      label: t('kidProfileAchBedtime'),
      description: t('kidProfileAchBedtimeDesc'),
      icon: '🌙',
      earned: completedCount >= 5,
    },
    {
      id: 'heart-collector',
      label: t('kidProfileAchFavorites'),
      description: t('kidProfileAchFavoritesDesc'),
      icon: '💛',
      earned: favoriteCount >= 3,
    },
  ];

  const seen = new Set(fromApi.map((item) => item.id));
  return [...fromApi, ...derived.filter((item) => !seen.has(item.id))];
}

function inferFavoriteCategory(favoriteBooks = [], t) {
  const counts = new Map();
  favoriteBooks.forEach((book) => {
    const theme = deriveBookTheme(book);
    if (!theme) return;
    counts.set(theme, (counts.get(theme) || 0) + 1);
  });
  if (counts.size === 0) return t('kidProfileCategoryExplorer');
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const labels = {
    animals: t('kidProfileCategoryAnimals'),
    bedtime: t('kidProfileCategoryBedtime'),
    space: t('kidProfileCategorySpace'),
    princesses: t('kidProfileCategoryPrincesses'),
    dinosaurs: t('kidProfileCategoryDinosaurs'),
    ocean: t('kidProfileCategoryOcean'),
    world: t('kidProfileCategoryWorld'),
    rhymes: t('kidProfileCategoryRhymes'),
  };
  return labels[top] || top;
}

export function KidsProfilePanel({
  kid,
  kidName,
  greeting,
  progressRows = [],
  favoriteBooks = [],
  publishedBooks = [],
  badges = [],
  lastActivity,
  t,
  isRtl,
  onPlayBook,
  onGoToLibrary,
}) {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const goToLibrary = onGoToLibrary || (() => navigate('/kids/library'));

  const avatarSrc = kid?.photo_url ? getImageUrl(kid.photo_url) : null;
  const avatarInitials = kid?.avatar || kidName?.trim().charAt(0).toUpperCase() || '?';

  const completedCount = progressRows.filter((row) => row.completed).length;
  const inProgressRows = progressRows.filter((row) => !row.completed && Number(row.progress_percent || 0) > 0);
  const continueBook = inProgressRows[0] ? mapProgressToBook(inProgressRows[0], publishedBooks) : null;
  const continueProgress = Math.min(100, Math.max(0, Number(continueBook?.kid_progress_percent || 0)));

  const continueShelfBooks = useMemo(
    () => inProgressRows.map((row) => mapProgressToBook(row, publishedBooks)).filter((book) => book.id),
    [inProgressRows, publishedBooks],
  );

  const finishedBooks = useMemo(
    () => progressRows
      .filter((row) => row.completed)
      .map((row) => mapProgressToBook(row, publishedBooks))
      .filter((book) => book.id),
    [progressRows, publishedBooks],
  );

  const recentlyReadBooks = useMemo(() => {
    const history = storage.getReadingHistory();
    const listening = storage.getListeningHistory();
    const ids = [...history, ...listening].map((item) => item.bookId).filter(Boolean);
    const uniqueIds = [...new Set(ids)];
    return uniqueIds
      .map((id) => publishedBooks.find((book) => book.id === id) || progressRows.find((row) => row.book_id === id))
      .filter(Boolean)
      .slice(0, 8)
      .map((item) => (item.book_id ? mapProgressToBook(item, publishedBooks) : item))
      .filter((book) => book?.id);
  }, [publishedBooks, progressRows]);

  const readingStats = useMemo(() => storage.getReadingStats(), []);
  const listeningHistory = useMemo(() => storage.getListeningHistory(), []);
  const listenedMinutes = Math.round(
    (Number(readingStats.totalTimeSeconds || 0)
      + listeningHistory.reduce((sum, item) => sum + Number(item.listenedSeconds || 0), 0)) / 60,
  );

  const achievements = buildReadingAchievements({
    badges,
    completedCount,
    favoriteCount: favoriteBooks.length,
    t,
  });

  const favoriteCategory = inferFavoriteCategory(favoriteBooks, t);
  const earnedAchievements = achievements.filter((item) => item.earned);

  const resumeCurrentBook = () => {
    if (!continueBook?.id) {
      goToLibrary();
      return;
    }
    onPlayBook?.(continueBook);
  };

  return (
    <section id="kids-profile" className="kids-profile-universe scroll-mt-24" aria-labelledby="kids-profile-heading">
      <motion.header
        className="kids-profile-hero"
        {...getMotionProps(reducedMotion, kidsCardAppear)}
      >
        <div className="kids-profile-hero-bg" aria-hidden="true">
          <span className="kids-profile-hero-glow kids-profile-hero-glow-a" />
          <span className="kids-profile-hero-glow kids-profile-hero-glow-b" />
          <span className="kids-profile-hero-grain" />
        </div>

        <div className="kids-profile-hero-body">
          <Avatar
            src={avatarSrc}
            initials={avatarInitials}
            alt={kidName}
            size="lg"
            className="kids-profile-avatar"
          />
          <div className="kids-profile-hero-copy">
            <p className="kids-profile-eyebrow">{greeting || t('goodMorning')}</p>
            <h2 id="kids-profile-heading" className="kids-profile-name">
              {kidName}
              <span aria-hidden="true"> 🌞</span>
            </h2>
            <p className="kids-profile-tagline">{t('kidProfileAdventureReady')}</p>
            {kid?.age ? (
              <p className="kids-profile-age">{t('kidProfileAge', { age: kid.age })}</p>
            ) : null}
          </div>
        </div>
      </motion.header>

      <motion.section
        className="kids-profile-journey"
        aria-label={t('kidProfileCurrentlyReading')}
        {...getMotionProps(reducedMotion, kidsCardAppear)}
      >
        <div className="kids-profile-journey-head">
          <h3 className="kids-shelf-title">{t('kidProfileCurrentlyReading')}</h3>
          <p className="kids-shelf-subtitle !mt-0">{t('kidProfileJourneySubtitle')}</p>
        </div>

        {continueBook?.id ? (
          <div className="kids-profile-journey-card">
            <div className="kids-profile-journey-cover-wrap">
              <ProgressRing
                progress={continueProgress}
                label={`${continueBook.title} — ${Math.round(continueProgress)}%`}
              />
              <div className="kids-profile-journey-cover">
                <KidsBookCover
                  book={continueBook}
                  alt={continueBook.title || ''}
                  imgClassName="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="kids-profile-journey-meta">
              <p className="kids-type-caption uppercase tracking-[0.12em] text-primary-600/80">
                {t('continueReading')}
              </p>
              <h4 className="kids-book-title">{continueBook.title}</h4>
              {lastActivity && continueBook.title !== lastActivity ? (
                <p className="kids-shelf-subtitle !mt-2 !text-left">{t('kidProfileLastActivity')}: {lastActivity}</p>
              ) : null}
              <KidsButton
                icon={PlayIcon}
                onClick={resumeCurrentBook}
                className="mt-space-16 !min-h-[56px]"
                aria-label={`${t('resume')} — ${continueBook.title}`}
              >
                {t('resume')}
              </KidsButton>
            </div>
          </div>
        ) : (
          <KidsEmptyState
            title={t('kidProfileEmptyAdventure')}
            description={t('kidProfileEmptyAdventureHint')}
            compact
            showMascot
            mascotMood="encourage"
            actionLabel={t('goToLibrary')}
            onAction={goToLibrary}
            className="kids-profile-empty"
          />
        )}
      </motion.section>

      <section className="kids-profile-stats" aria-label={t('kidProfileStatsTitle')}>
        <motion.div className="kids-profile-stat" {...getHoverMotion(reducedMotion)}>
          <span className="kids-profile-stat-icon" aria-hidden="true"><BookIcon className="w-6 h-6" /></span>
          <p className="kids-profile-stat-value">{completedCount}</p>
          <p className="kids-profile-stat-label">{t('kidProfileStoriesRead')}</p>
        </motion.div>
        <motion.div className="kids-profile-stat" {...getHoverMotion(reducedMotion)}>
          <span className="kids-profile-stat-icon" aria-hidden="true">🎧</span>
          <p className="kids-profile-stat-value">{listenedMinutes}</p>
          <p className="kids-profile-stat-label">{t('kidProfileMinutesListened')}</p>
        </motion.div>
        <motion.div className="kids-profile-stat" {...getHoverMotion(reducedMotion)}>
          <span className="kids-profile-stat-icon" aria-hidden="true"><StarIcon className="w-6 h-6" /></span>
          <p className="kids-profile-stat-value kids-profile-stat-value-text">{favoriteCategory}</p>
          <p className="kids-profile-stat-label">{t('kidProfileFavoriteCategory')}</p>
        </motion.div>
      </section>

      <div className="kids-profile-collection">
        <ProfileShelf
          title={t('continueReading')}
          subtitle={t('kidProfileShelfContinue')}
          books={continueShelfBooks}
          emptyTitle={t('kidProfileEmptyContinue')}
          emptyDescription={t('kidProfileEmptyAdventureHint')}
          emptyActionLabel={t('goToLibrary')}
          onEmptyAction={goToLibrary}
          isRtl={isRtl}
          onPlayBook={onPlayBook}
          t={t}
        />

        <ProfileShelf
          title={t('kidProfileRecentlyRead')}
          subtitle={t('kidProfileShelfRecent')}
          books={recentlyReadBooks}
          emptyTitle={t('kidProfileEmptyRecent')}
          emptyDescription={t('kidProfileEmptyAdventureHint')}
          emptyActionLabel={t('goToLibrary')}
          onEmptyAction={goToLibrary}
          isRtl={isRtl}
          onPlayBook={onPlayBook}
          t={t}
        />

        <ProfileShelf
          title={t('yourFavorites')}
          subtitle={t('kidProfileShelfFavorites')}
          books={favoriteBooks.slice(0, 8)}
          emptyTitle={t('emptyFavoritesTitle')}
          emptyDescription={t('emptyBooksDescription')}
          emptyActionLabel={t('goToLibrary')}
          onEmptyAction={goToLibrary}
          isRtl={isRtl}
          onPlayBook={onPlayBook}
          t={t}
        />

        <ProfileShelf
          title={t('kidProfileFinishedStories')}
          subtitle={t('kidProfileShelfFinished')}
          books={finishedBooks.slice(0, 8)}
          emptyTitle={t('kidProfileEmptyFinished')}
          emptyDescription={t('emptyBadgesDescription')}
          emptyActionLabel={t('goToLibrary')}
          onEmptyAction={goToLibrary}
          isRtl={isRtl}
          onPlayBook={onPlayBook}
          t={t}
        />
      </div>

      <motion.section
        id="kids-medals"
        className="kids-profile-achievements scroll-mt-24"
        aria-label={t('kidProfileAchievementsTitle')}
        {...getMotionProps(reducedMotion, kidsCarouselReveal)}
      >
        <div className="kids-profile-shelf-head">
          <h3 className="kids-shelf-title">{t('kidProfileAchievementsTitle')}</h3>
          <p className="kids-shelf-subtitle !mt-0">{t('kidProfileAchievementsSubtitle')}</p>
        </div>

        {earnedAchievements.length > 0 || achievements.length > 0 ? (
          <div className="kids-profile-achievement-grid">
            {achievements.slice(0, 8).map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} reducedMotion={reducedMotion} />
            ))}
          </div>
        ) : (
          <KidsEmptyState
            title={t('emptyBadgesTitle')}
            description={t('emptyBadgesDescription')}
            compact
            showMascot
            mascotMood="encourage"
            actionLabel={t('goToLibrary')}
            onAction={goToLibrary}
            className="kids-profile-empty"
          />
        )}
      </motion.section>

      <p className="kids-profile-footnote">{t('kidProfileSettingsHint')}</p>
    </section>
  );
}

export default KidsProfilePanel;
