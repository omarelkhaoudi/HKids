import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui';
import { getImageUrl } from '../../utils/imageUrl';
import { KidsMediaCard } from './KidsMediaCard';
import { KidsEmptyState } from './KidsEmptyState';

export function KidsProfilePanel({
  kid,
  kidName,
  progressRows = [],
  favoriteBooks = [],
  lastActivity,
  t,
  isRtl,
  onPlayBook,
  onGoToLibrary,
}) {
  const navigate = useNavigate();
  const goToLibrary = onGoToLibrary || (() => navigate('/kids/library'));
  const avatarSrc = kid?.photo_url ? getImageUrl(kid.photo_url) : null;
  const avatarInitials = kid?.avatar || kidName?.trim().charAt(0).toUpperCase() || '?';
  const completedCount = progressRows.filter((p) => p.completed).length;
  const inProgressCount = progressRows.filter((p) => !p.completed && Number(p.progress_percent || 0) > 0).length;

  return (
    <section id="kids-profile" className="scroll-mt-24 space-y-8">
      <div className="kids-premium-panel p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <Avatar
            src={avatarSrc}
            initials={avatarInitials}
            alt={kidName}
            size="lg"
            className="w-28 h-28 md:w-32 md:h-32 border-4 border-white shadow-kids-soft bg-gradient-to-br from-primary-300 to-secondary-400 text-white"
          />
          <div className="flex-1 text-center md:text-left">
            <h2 className="kids-type-h1 mb-1">{kidName}</h2>
            {kid?.age && (
              <p className="kids-book-author !text-base mb-4">
                {t('kidProfileAge', { age: kid.age })}
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-[1.5rem] bg-primary-50 dark:bg-primary-900/30 p-4 text-center">
                <p className="text-2xl font-semibold text-primary-600">{completedCount}</p>
                <p className="kids-type-caption uppercase tracking-wide">{t('kidProfileBooksDone')}</p>
              </div>
              <div className="rounded-[1.5rem] bg-secondary-50 dark:bg-secondary-900/30 p-4 text-center">
                <p className="text-2xl font-semibold text-secondary-600">{inProgressCount}</p>
                <p className="kids-type-caption uppercase tracking-wide">{t('continueReading')}</p>
              </div>
              <div className="rounded-[1.5rem] bg-accent-50 dark:bg-accent-900/30 p-4 text-center col-span-2 sm:col-span-1">
                <p className="text-2xl font-semibold text-accent-600">{favoriteBooks.length}</p>
                <p className="kids-type-caption uppercase tracking-wide">{t('yourFavorites')}</p>
              </div>
            </div>
          </div>
        </div>
        {lastActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 rounded-[1.5rem] bg-white/60 dark:bg-surface-800/60 p-4 flex items-center gap-3"
          >
            <span className="text-3xl" aria-hidden="true">📖</span>
            <div>
              <p className="kids-type-caption uppercase tracking-wide">{t('kidProfileLastActivity')}</p>
              <p className="kids-book-title !line-clamp-1">{lastActivity}</p>
            </div>
          </motion.div>
        )}
      </div>

      {favoriteBooks.length > 0 ? (
        <div>
          <h3 className="kids-shelf-title mb-5 px-2">
            <span aria-hidden="true">❤️</span>
            <span>{t('kidProfileFavoriteBooks')}</span>
          </h3>
          <div className="flex gap-5 overflow-x-auto pb-4 px-2 snap-x custom-scrollbar kids-scroll-smooth">
            {favoriteBooks.slice(0, 8).map((book) => (
              <div key={book.id} className="snap-start shrink-0">
                <KidsMediaCard book={book} variant="carousel" hideTitle={false} isRtl={isRtl} onPlay={onPlayBook} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <KidsEmptyState
          emoji="❤️"
          title={t('emptyFavoritesTitle')}
          description={t('emptyBooksDescription')}
          compact
          showMascot
          actionLabel={t('goToLibrary')}
          onAction={goToLibrary}
        />
      )}

      <div className="kids-premium-panel p-6">
        <h3 className="kids-shelf-title mb-4">
          <span aria-hidden="true">⚙️</span>
          <span>{t('kidProfileSettings')}</span>
        </h3>
        <p className="kids-shelf-subtitle !mt-0 mb-4">{t('kidProfileSettingsHint')}</p>
        <button
          type="button"
          onClick={goToLibrary}
          className="kids-touch-target kids-type-button inline-flex items-center justify-center rounded-[1.5rem] bg-primary-500 px-6 py-3 text-white shadow-md"
        >
          {t('goToLibrary')}
        </button>
      </div>
    </section>
  );
}

export default KidsProfilePanel;
