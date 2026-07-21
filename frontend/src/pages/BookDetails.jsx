import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { booksAPI } from '../api/books';
import { subscriptionsAPI } from '../api/subscriptions';
import { useAuth } from '../context/AuthContext';
import { storage } from '../utils/storage';
import { useToast } from '../components/ToastProvider';
import { resolveBookCoverUrl } from '../utils/bookCover';
import { KidsBookCover } from '../components/kids/KidsBookCover';
import { KidsBookCarousel } from '../components/kids/KidsBookCarousel';
import KidsButton from '../components/kids/KidsButton';
import { useOfflineContent } from '../hooks/useOfflineContent';
import {
  HeartIcon, BookIcon, ChevronLeftIcon, RefreshIcon,
  ChildIcon, CategoryIcon, HistoryIcon, WarningIcon, AudioIcon, PlayIcon,
  ClockIcon, LanguageIcon, MicrophoneIcon, DownloadIcon,
} from '../components/Icons';
import { ContentReportModal } from '../components/parent/ContentReportModal';
import { useLanguage } from '../context/LanguageContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import {
  getHoverMotion,
  getMotionProps,
  kidsCardAppear,
  kidsHoverLift,
  kidsPageEnter,
} from '../constants/kidsMotion';

function formatReadingDuration(book, t) {
  if (book?.duration_minutes) {
    return t('readingMinutes', { count: book.duration_minutes });
  }
  const seconds = Number(book?.duration_seconds || 0);
  if (seconds > 0) {
    return t('readingMinutes', { count: Math.max(1, Math.round(seconds / 60)) });
  }
  if (book?.page_count > 0) {
    return t('readingMinutes', { count: Math.max(1, Math.round(book.page_count * 1.5)) });
  }
  return null;
}

function formatAgeLabel(book, t) {
  if (book?.age_level) return book.age_level;
  if (book?.age_group_min != null && book?.age_group_max != null) {
    return `${book.age_group_min}–${book.age_group_max} ${t('years')}`;
  }
  if (book?.age_group) return `${book.age_group} ${t('years')}`;
  return null;
}

function PremiumBookState({ icon: Icon = BookIcon, title, description, ctaLabel, onCta, reducedMotion }) {
  return (
    <div className="min-h-screen flex items-center justify-center kids-book-details-page px-space-20">
      <motion.div
        className="kids-premium-panel max-w-xl w-full text-center p-8 md:p-10 relative overflow-hidden"
        {...getMotionProps(reducedMotion, kidsPageEnter)}
      >
        <div className="absolute inset-0 kids-shimmer opacity-20 pointer-events-none" aria-hidden="true" />
        <div className="mx-auto mb-space-20 flex h-24 w-24 items-center justify-center rounded-full bg-white/70 shadow-soft">
          <Icon className="h-12 w-12 text-primary-500" />
        </div>
        <h1 className="kids-type-h1 !text-[1.7rem] md:!text-[2rem] mb-space-12">{title}</h1>
        {description ? (
          <p className="kids-shelf-subtitle !mx-auto mb-space-24 max-w-md">{description}</p>
        ) : null}
        {ctaLabel && onCta ? (
          <KidsButton onClick={onCta} className="mx-auto !min-h-[56px]">
            {ctaLabel}
          </KidsButton>
        ) : null}
      </motion.div>
    </div>
  );
}

function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();
  const { t, isRtl } = useLanguage();
  const reducedMotion = useReducedMotion();
  const offlineContent = useOfflineContent();
  const isKidAccount = user?.role === 'kid';
  const canReport = user && (user.role === 'parent' || user.role === 'admin');

  useEffect(() => {
    loadBook();
  }, [id]);

  useEffect(() => {
    if (book) {
      setIsFavorite(storage.isFavorite(book.id));
      loadRelatedBooks();
    }
  }, [book]);

  const loadBook = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getBook(id);
      setBook(response.data);
    } catch (error) {
      console.error('Error loading book:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedBooks = async () => {
    try {
      const response = await booksAPI.getPublishedBooks({
        category_id: book.category_id || undefined,
      });
      const filtered = response.data.filter((b) => b.id !== book.id).slice(0, 8);
      setRelatedBooks(filtered);
    } catch (error) {
      console.error('Error loading related books:', error);
    }
  };

  const toggleFavorite = () => {
    if (isFavorite) {
      storage.removeFavorite(book.id);
      showToast(t('removedFromFavorites'), 'info', 2000);
    } else {
      storage.addFavorite(book.id);
      showToast(t('addedToFavorites'), 'success', 2000);
    }
    setIsFavorite(!isFavorite);
  };

  const handleDownload = async () => {
    try {
      await offlineContent.downloadBookContent(book);
      storage.markDownloaded(book.id);
      showToast(t('downloaded'), 'success');
    } catch (error) {
      if (error?.name !== 'AbortError') {
        showToast(t('downloadError') || 'Impossible de telecharger ce livre pour le moment.', 'error');
      }
    }
  };

  const handleSubscriptionBlock = (status, context = 'start') => {
    if (status === 402) {
      showToast(
        isKidAccount
          ? 'Demande a ton parent d activer une formule pour lire ce livre.'
          : context === 'continue'
            ? 'Choisissez un abonnement pour continuer la lecture.'
            : 'Choisissez un abonnement pour lire ce livre.',
        'info',
        3000
      );
    } else if (status === 403) {
      showToast(
        isKidAccount
          ? 'La limite de livres du mois est atteinte. Demande a ton parent.'
          : 'Votre quota de livres du mois est atteint.',
        'info',
        3000
      );
    } else {
      showToast("Impossible de debloquer ce livre pour le moment.", 'error', 2500);
    }

    navigate(isKidAccount ? '/kids' : '/abonnements');
  };

  const startReading = async () => {
    try {
      await subscriptionsAPI.unlockBook(id);
      navigate(isKidAccount ? `/kids/read/${id}` : `/book/${id}`);
    } catch (error) {
      handleSubscriptionBlock(error.response?.status);
    }
  };

  const continueReading = async () => {
    const lastPage = storage.getLastPage(id);
    try {
      await subscriptionsAPI.unlockBook(id);
      const readerPath = isKidAccount ? `/kids/read/${id}` : `/book/${id}`;
      navigate(`${readerPath}?page=${lastPage}`);
    } catch (error) {
      handleSubscriptionBlock(error.response?.status, 'continue');
    }
  };

  const backPath = isKidAccount ? '/kids/library' : '/';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center kids-book-details-page px-space-20">
        <motion.div
          className="kids-premium-panel kids-book-details-loading max-w-5xl w-full p-6 md:p-8"
          {...getMotionProps(reducedMotion, kidsPageEnter)}
        >
          <div className="grid gap-6 md:grid-cols-[18rem,minmax(0,1fr)] md:items-center">
            <div className="aspect-[3/4] rounded-[2rem] bg-white/70 overflow-hidden relative">
              <div className="absolute inset-0 kids-shimmer opacity-40" aria-hidden="true" />
            </div>
            <div className="space-y-4">
              <div className="h-4 w-32 rounded-full bg-white/70" />
              <div className="h-8 w-3/4 rounded-full bg-white/80" />
              <div className="h-8 w-2/3 rounded-full bg-white/70" />
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="h-10 w-28 rounded-full bg-white/75" />
                <div className="h-10 w-24 rounded-full bg-white/70" />
                <div className="h-10 w-32 rounded-full bg-white/75" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <div className="h-14 flex-1 rounded-full bg-gradient-to-r from-primary-200/80 to-secondary-200/80" />
                <div className="h-14 flex-1 rounded-full bg-white/80" />
              </div>
              <p className="kids-type-body text-foreground-secondary pt-2">Préparation d&apos;une belle page de lecture...</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!book) {
    return (
      <PremiumBookState
        icon={BookIcon}
        title="Cette histoire n'est pas disponible pour le moment"
        description="Retournons vers la bibliothèque pour choisir une autre aventure douce et lumineuse."
        ctaLabel={t('goToLibrary')}
        onCta={() => navigate(backPath)}
        reducedMotion={reducedMotion}
      />
    );
  }

  const hasHistory = storage.getLastPage(id) > 0;
  const lastPage = storage.getLastPage(id);
  const progress = book.page_count > 0 ? Math.round((lastPage / book.page_count) * 100) : 0;
  const coverUrl = resolveBookCoverUrl(book);
  const ageLabel = formatAgeLabel(book, t);
  const durationLabel = formatReadingDuration(book, t);
  const languageLabel = book.language || book.lang || null;
  const narratorLabel = book.narrator || book.narrator_name || book.voice_name || null;
  const hasLongDescription = Boolean(book.description && book.description.length > 220);
  const canListen = Boolean(book.audio_url);
  const downloadStatus = offlineContent.getBookStatus(book.id);
  const isDownloading = downloadStatus?.status === 'pending' || downloadStatus?.status === 'running';
  const isDownloaded = downloadStatus?.status === 'downloaded' || storage.isDownloaded(book.id);
  return (
    <div className="min-h-screen kids-book-details-page" dir={isRtl ? 'rtl' : 'ltr'}>
      <motion.header
        {...getMotionProps(reducedMotion, kidsCardAppear)}
        className="kids-book-details-header sticky top-0 z-50"
      >
        <div className="kids-book-details-shell flex items-center justify-between gap-space-12 py-space-12">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="kids-book-details-back"
          >
            <ChevronLeftIcon className={`h-5 w-5 ${isRtl ? 'rotate-180' : ''}`} />
            <span className="kids-type-meta font-semibold">Retour</span>
          </button>
          <Link
            to={backPath}
            className="kids-book-details-mini-home"
          >
            HKids
          </Link>
        </div>
      </motion.header>

      <motion.main
        {...getMotionProps(reducedMotion, kidsPageEnter)}
        className="relative overflow-hidden kids-book-details-atmosphere"
      >
        {coverUrl ? (
          <div
            className="kids-book-details-bleed"
            style={{ backgroundImage: `url(${coverUrl})` }}
            aria-hidden="true"
          />
        ) : null}

        <div className="kids-book-details-shell relative z-10 py-space-32 md:py-space-48 lg:py-space-56">
          <div className="kids-book-details-orb kids-book-details-orb-a" aria-hidden="true" />
          <div className="kids-book-details-orb kids-book-details-orb-b" aria-hidden="true" />
          <div className="kids-book-details-hero">
            <motion.div
              {...getHoverMotion(reducedMotion, kidsHoverLift)}
              className="kids-book-details-cover"
            >
              <div className="aspect-[3/4] relative overflow-hidden">
                <KidsBookCover
                  book={book}
                  alt={book.title}
                  loading="eager"
                  imgClassName="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </motion.div>

            <div className="kids-book-details-copy">
              <p className="kids-book-details-kicker">Une histoire a savourer doucement</p>
              <h1 className="kids-book-details-title">{book.title}</h1>

              {book.author ? (
                <p className="kids-book-details-author">par {book.author}</p>
              ) : null}

              <div className="kids-book-details-badges" role="list">
                {book.category_name ? (
                  <span className="kids-book-details-badge" role="listitem">
                    <CategoryIcon className="h-3.5 w-3.5" />
                    {book.category_name}
                  </span>
                ) : null}
                {ageLabel ? (
                  <span className="kids-book-details-badge" role="listitem">
                    <ChildIcon className="h-3.5 w-3.5" />
                    {ageLabel}
                  </span>
                ) : null}
                {durationLabel ? (
                  <span className="kids-book-details-badge" role="listitem">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {durationLabel}
                  </span>
                ) : null}
                {book.is_new === true || book.is_new === 1 ? (
                  <span className="kids-book-details-badge kids-book-details-badge--accent" role="listitem">
                    Nouveau
                  </span>
                ) : null}
              </div>

              <div className="kids-book-details-actions">
                {hasHistory ? (
                  <>
                    <KidsButton
                      variant="primary"
                      size="lg"
                      icon={BookIcon}
                      onClick={continueReading}
                      className="w-full sm:flex-1 kids-book-details-cta"
                      aria-label={t('continueReading')}
                    >
                      Reprendre l&apos;histoire
                    </KidsButton>
                    <KidsButton
                      variant="glass"
                      size="md"
                      icon={RefreshIcon}
                      onClick={startReading}
                      className="w-full sm:flex-1 kids-book-details-secondary-cta"
                      aria-label="Recommencer"
                    >
                      Recommencer
                    </KidsButton>
                  </>
                ) : (
                  <KidsButton
                    variant="primary"
                    size="lg"
                    icon={PlayIcon}
                    onClick={startReading}
                    className="w-full sm:flex-1 kids-book-details-cta"
                    aria-label={t('readAction')}
                  >
                    Commencer l&apos;histoire
                  </KidsButton>
                )}

                {canListen ? (
                  <KidsButton
                    variant="glass"
                    size="md"
                    icon={AudioIcon}
                    onClick={() => navigate(`/kids/listen/${id}`)}
                    className="w-full sm:flex-1 kids-book-details-secondary-cta"
                    aria-label={t('listenAction')}
                  >
                    {t('listenAction')}
                  </KidsButton>
                ) : null}
              </div>

              <div className="kids-book-details-utility-actions">
                <button
                  type="button"
                  onClick={toggleFavorite}
                  className={`kids-book-details-utility-btn ${isFavorite ? 'is-active' : ''}`}
                  aria-label={isFavorite ? t('removedFromFavorites') : t('addToFavorites')}
                  aria-pressed={isFavorite}
                >
                  <HeartIcon className="h-5 w-5" filled={isFavorite} />
                  <span>{isFavorite ? t('yourFavorites') : 'Favori'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading || isDownloaded}
                  className="kids-book-details-utility-btn"
                  aria-label={isDownloaded ? 'Livre telecharge' : 'Telecharger ce livre'}
                >
                  <DownloadIcon className="h-5 w-5" />
                  <span>{isDownloading ? 'Téléchargement...' : isDownloaded ? 'Téléchargé' : 'Télécharger'}</span>
                </button>
              </div>
            </div>
          </div>

          {hasHistory ? (
            <section className="kids-book-details-continue" aria-label={t('continueReading')}>
              <div className="kids-book-details-continue-copy">
                <div className="flex items-center gap-space-8">
                  <HistoryIcon className="h-5 w-5 text-primary-600" />
                  <h2 className="kids-type-h2 !mb-0 !text-[1.15rem]">{t('continueReading')}</h2>
                </div>
                <p className="kids-type-meta mt-space-8 text-foreground-muted">
                  Page {lastPage + 1}
                  {book.page_count ? ` sur ${book.page_count}` : ''}
                  {' · '}
                  {progress}%
                </p>
                <div className="kids-book-progress kids-book-details-continue-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                  <motion.div
                    className="kids-book-progress-fill"
                    initial={reducedMotion ? false : { width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={reducedMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
              <KidsButton
                variant="primary"
                size="md"
                icon={PlayIcon}
                onClick={continueReading}
                aria-label={t('resume')}
              >
                {t('resume')}
              </KidsButton>
            </section>
          ) : null}

          {book.description ? (
            <section className="kids-book-details-section" aria-label="Description">
              <h2 className="kids-shelf-title kids-book-details-section-title !mb-space-12">L&apos;histoire</h2>
              {hasLongDescription ? (
                <details className="kids-book-details-desc">
                  <summary>
                    <p className="kids-book-details-desc-text kids-book-details-desc-preview">{book.description}</p>
                    <span className="kids-book-details-read-more kids-book-details-read-more--more">Lire plus</span>
                    <span className="kids-book-details-read-more kids-book-details-read-more--less">Lire moins</span>
                  </summary>
                  <p className="kids-book-details-desc-text kids-book-details-desc-full">{book.description}</p>
                </details>
              ) : (
                <p className="kids-book-details-desc-text">{book.description}</p>
              )}
            </section>
          ) : null}

          <section className="kids-book-details-section" aria-label="Informations">
            <h2 className="kids-shelf-title kids-book-details-section-title !mb-space-16">À propos</h2>
            <ul className="kids-book-details-info-grid">
              {ageLabel ? (
                <li className="kids-book-details-info-item">
                  <ChildIcon className="h-4 w-4" />
                  <div>
                    <p className="kids-book-details-info-label">Âge</p>
                    <p className="kids-book-details-info-value">{ageLabel}</p>
                  </div>
                </li>
              ) : null}
              {durationLabel ? (
                <li className="kids-book-details-info-item">
                  <ClockIcon className="h-4 w-4" />
                  <div>
                    <p className="kids-book-details-info-label">Lecture</p>
                    <p className="kids-book-details-info-value">{durationLabel}</p>
                  </div>
                </li>
              ) : null}
              {book.category_name ? (
                <li className="kids-book-details-info-item">
                  <CategoryIcon className="h-4 w-4" />
                  <div>
                    <p className="kids-book-details-info-label">Catégorie</p>
                    <p className="kids-book-details-info-value">{book.category_name}</p>
                  </div>
                </li>
              ) : null}
              {languageLabel ? (
                <li className="kids-book-details-info-item">
                  <LanguageIcon className="h-4 w-4" />
                  <div>
                    <p className="kids-book-details-info-label">Langue</p>
                    <p className="kids-book-details-info-value">{languageLabel}</p>
                  </div>
                </li>
              ) : null}
              {narratorLabel ? (
                <li className="kids-book-details-info-item">
                  <MicrophoneIcon className="h-4 w-4" />
                  <div>
                    <p className="kids-book-details-info-label">Narrateur</p>
                    <p className="kids-book-details-info-value">{narratorLabel}</p>
                  </div>
                </li>
              ) : null}
              {book.page_count > 0 ? (
                <li className="kids-book-details-info-item">
                  <BookIcon className="h-4 w-4" />
                  <div>
                    <p className="kids-book-details-info-label">Pages</p>
                    <p className="kids-book-details-info-value">{book.page_count}</p>
                  </div>
                </li>
              ) : null}
            </ul>
          </section>

          <aside className="kids-book-details-note" aria-label="Abonnement">
            <p className="kids-type-caption uppercase tracking-[0.12em] text-primary-600/80">
              {isKidAccount ? 'Accès géré par tes parents' : 'Abonnement mensuel'}
            </p>
            <p className="kids-type-body mt-space-8 text-foreground-secondary">
              {isKidAccount
                ? 'Si ce livre est bloqué, demande à ton parent de choisir une formule.'
                : 'Débloquez 1, 2 ou 3 livres par mois selon votre formule.'}
            </p>
            {!isKidAccount ? (
              <Link
                to="/abonnements"
                className="kids-touch-target mt-space-16 inline-flex min-h-[56px] items-center rounded-full border border-border/60 bg-card px-space-20 text-caption font-semibold text-primary-700 shadow-soft hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                Voir les formules
              </Link>
            ) : null}
          </aside>

          {canReport ? (
            <motion.button
              {...getHoverMotion(reducedMotion)}
              type="button"
              onClick={() => setShowReportModal(true)}
              className="mt-space-20 kids-touch-target inline-flex min-h-[56px] items-center gap-space-8 rounded-full px-space-16 text-caption font-semibold text-foreground-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            >
              <WarningIcon className="h-5 w-5" />
              {t('reportContentAction')}
            </motion.button>
          ) : null}

          <ContentReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            targetType="book"
            targetId={book?.id}
            targetTitle={book?.title}
          />
        </div>
      </motion.main>

      {relatedBooks.length > 0 ? (
        <section className="kids-book-details-related pb-space-48 pt-space-8">
          <div className="kids-book-details-shell">
            <KidsBookCarousel
              title="Tu pourrais aussi aimer"
              subtitle="D'autres couvertures douces et merveilleuses a ouvrir ensuite."
              books={relatedBooks}
              isRtl={isRtl}
              showActions={false}
              favorites={[]}
              onPlay={(related) => navigate(`/book-details/${related.id}`)}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default BookDetails;
