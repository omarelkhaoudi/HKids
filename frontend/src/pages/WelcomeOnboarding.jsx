import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { booksAPI } from '../api/books';
import { OnboardingShell } from '../components/onboarding/OnboardingShell';
import KidsButton from '../components/kids/KidsButton';
import { KidsBookCover } from '../components/kids/KidsBookCover';
import { useReducedMotion } from '../hooks/useReducedMotion';
import {
  getOnboardingProfile,
  saveOnboardingProfile,
  setOnboardingComplete,
  ONBOARDING_WORLDS,
  ONBOARDING_AVATARS,
  ONBOARDING_AGE_BANDS,
  ONBOARDING_ANIMALS,
  ONBOARDING_READING_GOALS,
  groupBooksByWorlds,
  filterBooksForWorlds,
} from '../utils/onboarding';
import { getKidsContentPath } from '../utils/contentRouting';
import { getMotionProps, kidsCardAppear, kidsHoverLift, kidsStaggerContainer } from '../constants/kidsMotion';

const TOTAL_STEPS = 7;
const TOUR_SLIDES = ['library', 'stories', 'reading'];

function toggleSelection(list, value, max = 99) {
  if (list.includes(value)) return list.filter((item) => item !== value);
  if (list.length >= max) return list;
  return [...list, value];
}

export default function WelcomeOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isRtl, language } = useLanguage();
  const reducedMotion = useReducedMotion();

  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState(() => getOnboardingProfile());
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);

  const updateProfile = useCallback((patch) => {
    setProfile((current) => {
      const next = { ...current, ...patch };
      saveOnboardingProfile(next);
      return next;
    });
  }, []);

  const finishOnboarding = useCallback((destination) => {
    setOnboardingComplete(profile.audience === 'parent' ? 'parent' : 'kid');
    navigate(destination, { replace: true });
  }, [navigate, profile.audience]);

  const handleSkip = useCallback(() => {
    if (profile.audience === 'parent') {
      finishOnboarding(user?.role === 'parent' || user?.role === 'admin' ? '/parent' : '/parent/login');
      return;
    }
    finishOnboarding(user?.role === 'kid' ? '/kids' : '/parent/login');
  }, [finishOnboarding, profile.audience, user?.role]);

  useEffect(() => {
    if (step !== 5) return undefined;
    let cancelled = false;
    setBooksLoading(true);
    booksAPI.getPublishedBooks({ language })
      .then((response) => {
        if (!cancelled) setBooks(response.data || []);
      })
      .catch(() => {
        if (!cancelled) setBooks([]);
      })
      .finally(() => {
        if (!cancelled) setBooksLoading(false);
      });
    return () => { cancelled = true; };
  }, [step, language]);

  const personalizedShelves = useMemo(
    () => groupBooksByWorlds(books, profile.favoriteWorlds, t),
    [books, profile.favoriteWorlds, t],
  );

  const recommendedBooks = useMemo(
    () => filterBooksForWorlds(books, profile.favoriteWorlds),
    [books, profile.favoriteWorlds],
  );

  const goNext = () => setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  const goBack = () => setStep((current) => Math.max(1, current - 1));

  const handleAudienceSelect = (audience) => {
    updateProfile({ audience });
    if (audience === 'parent') {
      if (user?.role === 'parent' || user?.role === 'admin') {
        setOnboardingComplete('parent');
        navigate('/parent', { replace: true });
      } else {
        setOnboardingComplete('parent');
        navigate('/parent/login', { replace: true });
      }
      return;
    }
    goNext();
  };

  const canContinueProfile = profile.nickname.trim().length >= 2;
  const canContinueWorlds = profile.favoriteWorlds.length >= 1;

  const skipVisible = step >= 3;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} lang={isRtl ? 'ar' : undefined}>
      <OnboardingShell
        step={step}
        totalSteps={TOTAL_STEPS}
        showMascot={step === 1 || step === TOTAL_STEPS}
        mascotMood={step === TOTAL_STEPS ? 'celebrate' : 'wave'}
        onSkip={skipVisible ? handleSkip : undefined}
        skipLabel={t('onboardingSkip')}
      >
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.section
              key="welcome"
              className="hkids-onboarding-panel w-full max-w-2xl text-center"
              {...getMotionProps(reducedMotion, kidsCardAppear)}
              aria-labelledby="onboarding-welcome-title"
            >
              <div className="hkids-onboarding-illustration mb-space-24" aria-hidden="true">
                <span className="hkids-onboarding-book" />
                <span className="hkids-onboarding-sparkle hkids-onboarding-sparkle--a" />
                <span className="hkids-onboarding-sparkle hkids-onboarding-sparkle--b" />
              </div>
              <p className="kids-type-caption uppercase tracking-[0.18em] text-primary-600/80 mb-space-12">
                HKids
              </p>
              <h1 id="onboarding-welcome-title" className="kids-type-display mb-space-16">
                {t('onboardingWelcomeTitle')}
              </h1>
              <p className="kids-shelf-subtitle !mx-auto mb-space-32 max-w-lg">
                {t('onboardingWelcomeSubtitle')}
              </p>
              <KidsButton size="lg" onClick={goNext} className="mx-auto min-w-[14rem]">
                {t('onboardingStart')}
              </KidsButton>
            </motion.section>
          )}

          {step === 2 && (
            <motion.section
              key="audience"
              className="w-full max-w-3xl"
              {...getMotionProps(reducedMotion, kidsCardAppear)}
              aria-labelledby="onboarding-audience-title"
            >
              <h2 id="onboarding-audience-title" className="kids-type-h1 text-center mb-space-12">
                {t('onboardingAudienceTitle')}
              </h2>
              <p className="kids-shelf-subtitle text-center !mx-auto mb-space-32 max-w-xl">
                {t('onboardingAudienceSubtitle')}
              </p>
              <div className="grid gap-space-16 md:grid-cols-2">
                {[
                  { id: 'child', emoji: '👧', label: t('onboardingAudienceChild') },
                  { id: 'parent', emoji: '👨‍👩‍👧', label: t('onboardingAudienceParent') },
                ].map((option) => (
                  <motion.button
                    key={option.id}
                    type="button"
                    {...getMotionProps(reducedMotion, kidsHoverLift)}
                    onClick={() => handleAudienceSelect(option.id)}
                    className="hkids-onboarding-choice-card kids-touch-target text-start"
                    aria-label={option.label}
                  >
                    <span className="text-5xl mb-space-16 block" aria-hidden="true">{option.emoji}</span>
                    <span className="kids-type-h2 block">{option.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.section>
          )}

          {step === 3 && (
            <motion.section
              key="profile"
              className="w-full max-w-3xl"
              {...getMotionProps(reducedMotion, kidsCardAppear)}
              aria-labelledby="onboarding-profile-title"
            >
              <h2 id="onboarding-profile-title" className="kids-type-h1 text-center mb-space-12">
                {t('onboardingProfileTitle')}
              </h2>
              <p className="kids-shelf-subtitle text-center !mx-auto mb-space-24 max-w-xl">
                {t('onboardingProfileSubtitle')}
              </p>

              <div className="kids-premium-panel p-space-24 md:p-space-32 space-y-space-24">
                <div>
                  <p className="kids-type-meta mb-space-12">{t('onboardingAvatarLabel')}</p>
                  <div className="flex flex-wrap gap-space-12 justify-center" role="listbox" aria-label={t('onboardingAvatarLabel')}>
                    {ONBOARDING_AVATARS.map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        role="option"
                        aria-selected={profile.avatar === avatar}
                        onClick={() => updateProfile({ avatar })}
                        className={`hkids-onboarding-avatar-btn ${profile.avatar === avatar ? 'is-selected' : ''}`}
                      >
                        <span aria-hidden="true">{avatar}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="kids-type-meta mb-space-8 block">{t('onboardingNicknameLabel')}</span>
                  <input
                    type="text"
                    value={profile.nickname}
                    onChange={(event) => updateProfile({ nickname: event.target.value.slice(0, 20) })}
                    placeholder={t('onboardingNicknamePlaceholder')}
                    className="hkids-onboarding-input w-full"
                    maxLength={20}
                    autoComplete="nickname"
                  />
                </label>

                <div>
                  <p className="kids-type-meta mb-space-12">{t('onboardingAgeLabel')}</p>
                  <div className="flex flex-wrap gap-space-10">
                    {ONBOARDING_AGE_BANDS.map((band) => (
                      <button
                        key={band}
                        type="button"
                        onClick={() => updateProfile({ ageBand: band })}
                        className={`hkids-onboarding-chip ${profile.ageBand === band ? 'is-selected' : ''}`}
                      >
                        {band} {t('years')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="kids-type-meta mb-space-12">{t('onboardingAnimalsLabel')}</p>
                  <div className="flex flex-wrap gap-space-10 justify-center">
                    {ONBOARDING_ANIMALS.map((animal) => (
                      <button
                        key={animal}
                        type="button"
                        onClick={() => updateProfile({
                          favoriteAnimals: toggleSelection(profile.favoriteAnimals, animal, 3),
                        })}
                        className={`hkids-onboarding-avatar-btn hkids-onboarding-avatar-btn--small ${
                          profile.favoriteAnimals.includes(animal) ? 'is-selected' : ''
                        }`}
                        aria-pressed={profile.favoriteAnimals.includes(animal)}
                      >
                        <span aria-hidden="true">{animal}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="kids-type-meta mb-space-12">{t('onboardingGoalLabel')}</p>
                  <div className="grid gap-space-10 sm:grid-cols-3">
                    {ONBOARDING_READING_GOALS.map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => updateProfile({ readingGoal: goal })}
                        className={`hkids-onboarding-chip hkids-onboarding-chip--block ${
                          profile.readingGoal === goal ? 'is-selected' : ''
                        }`}
                      >
                        {t(`onboardingGoal_${goal}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-space-12 justify-center mt-space-24">
                <KidsButton variant="ghost" onClick={goBack}>{t('back')}</KidsButton>
                <KidsButton onClick={goNext} disabled={!canContinueProfile}>
                  {t('onboardingContinue')}
                </KidsButton>
              </div>
            </motion.section>
          )}

          {step === 4 && (
            <motion.section
              key="worlds"
              className="w-full max-w-4xl"
              {...getMotionProps(reducedMotion, kidsCardAppear)}
              aria-labelledby="onboarding-worlds-title"
            >
              <h2 id="onboarding-worlds-title" className="kids-type-h1 text-center mb-space-12">
                {t('onboardingWorldsTitle')}
              </h2>
              <p className="kids-shelf-subtitle text-center !mx-auto mb-space-24 max-w-xl">
                {t('onboardingWorldsSubtitle')}
              </p>
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-space-12"
                {...getMotionProps(reducedMotion, kidsStaggerContainer)}
              >
                {ONBOARDING_WORLDS.map((world) => {
                  const selected = profile.favoriteWorlds.includes(world.id);
                  return (
                    <motion.button
                      key={world.id}
                      type="button"
                      {...getMotionProps(reducedMotion, kidsHoverLift)}
                      onClick={() => updateProfile({
                        favoriteWorlds: toggleSelection(profile.favoriteWorlds, world.id, 5),
                      })}
                      className={`hkids-onboarding-world-card ${selected ? 'is-selected' : ''}`}
                      aria-pressed={selected}
                    >
                      <span className="text-4xl mb-space-8 block" aria-hidden="true">{world.emoji}</span>
                      <span className="kids-type-body font-bold">{t(`onboardingWorld_${world.id}`)}</span>
                    </motion.button>
                  );
                })}
              </motion.div>
              <div className="flex flex-col sm:flex-row gap-space-12 justify-center mt-space-28">
                <KidsButton variant="ghost" onClick={goBack}>{t('back')}</KidsButton>
                <KidsButton onClick={goNext} disabled={!canContinueWorlds}>
                  {t('onboardingContinue')}
                </KidsButton>
              </div>
            </motion.section>
          )}

          {step === 5 && (
            <motion.section
              key="library"
              className="w-full max-w-5xl"
              {...getMotionProps(reducedMotion, kidsCardAppear)}
              aria-labelledby="onboarding-library-title"
            >
              <h2 id="onboarding-library-title" className="kids-type-h1 text-center mb-space-12">
                {t('onboardingLibraryTitle')}
              </h2>
              <p className="kids-shelf-subtitle text-center !mx-auto mb-space-24 max-w-xl">
                {t('onboardingLibrarySubtitle', { name: profile.nickname || t('onboardingFriend') })}
              </p>

              {booksLoading ? (
                <div className="kids-premium-panel p-space-32 text-center" role="status">
                  <div className="kids-shimmer absolute inset-0 opacity-20 rounded-[inherit]" aria-hidden="true" />
                  <p className="kids-type-body relative">{t('loading')}</p>
                </div>
              ) : (
                <div className="space-y-space-24">
                  {recommendedBooks.length > 0 && (
                    <div className="kids-premium-panel p-space-20">
                      <h3 className="kids-shelf-title !mb-space-16">
                        <span aria-hidden="true">✨ </span>
                        {t('onboardingRecommendedTitle')}
                      </h3>
                      <div className="flex gap-space-16 overflow-x-auto pb-space-8 kids-scroll-smooth snap-x snap-mandatory">
                        {recommendedBooks.slice(0, 6).map((book) => (
                          <button
                            key={book.id}
                            type="button"
                            onClick={() => navigate(getKidsContentPath(book))}
                            className="snap-start shrink-0 w-[7.5rem] text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-[1.25rem]"
                          >
                            <div className="kids-book-collectible-cover aspect-[3/4] relative overflow-hidden mb-space-8">
                              <KidsBookCover book={book} imgClassName="absolute inset-0 h-full w-full object-cover" />
                            </div>
                            <p className="kids-book-title line-clamp-2">{book.title}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {personalizedShelves.map((shelf) => (
                    <div key={shelf.worldId} className="kids-premium-panel p-space-20">
                      <p className="kids-type-meta text-primary-700 mb-space-8">{shelf.reason}</p>
                      <div className="flex gap-space-16 overflow-x-auto pb-space-8 kids-scroll-smooth snap-x snap-mandatory">
                        {shelf.books.map((book) => (
                          <button
                            key={book.id}
                            type="button"
                            onClick={() => navigate(getKidsContentPath(book))}
                            className="snap-start shrink-0 w-[7rem] text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-[1.25rem]"
                          >
                            <div className="kids-book-collectible-cover aspect-[3/4] relative overflow-hidden mb-space-8">
                              <KidsBookCover book={book} imgClassName="absolute inset-0 h-full w-full object-cover" />
                            </div>
                            <p className="kids-book-title line-clamp-2 text-sm">{book.title}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-space-12 justify-center mt-space-28">
                <KidsButton variant="ghost" onClick={goBack}>{t('back')}</KidsButton>
                <KidsButton onClick={goNext}>{t('onboardingContinue')}</KidsButton>
              </div>
            </motion.section>
          )}

          {step === 6 && (
            <motion.section
              key="tour"
              className="w-full max-w-2xl text-center"
              {...getMotionProps(reducedMotion, kidsCardAppear)}
              aria-labelledby="onboarding-tour-title"
            >
              <h2 id="onboarding-tour-title" className="kids-type-h1 mb-space-12">
                {t(`onboardingTour_${TOUR_SLIDES[tourIndex]}_title`)}
              </h2>
              <p className="kids-shelf-subtitle !mx-auto mb-space-32 max-w-lg">
                {t(`onboardingTour_${TOUR_SLIDES[tourIndex]}_body`)}
              </p>
              <div className="hkids-onboarding-tour-card kids-premium-panel p-space-32 mb-space-32">
                <span className="text-6xl" aria-hidden="true">
                  {tourIndex === 0 ? '📚' : tourIndex === 1 ? '✨' : '📖'}
                </span>
              </div>
              <div className="flex items-center justify-center gap-space-8 mb-space-24" aria-hidden="true">
                {TOUR_SLIDES.map((slide, index) => (
                  <span
                    key={slide}
                    className={`hkids-onboarding-dot ${index === tourIndex ? 'is-active' : ''}`}
                  />
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-space-12 justify-center">
                <KidsButton
                  variant="ghost"
                  onClick={() => {
                    if (tourIndex === 0) goBack();
                    else setTourIndex((index) => index - 1);
                  }}
                >
                  {t('back')}
                </KidsButton>
                <KidsButton
                  onClick={() => {
                    if (tourIndex >= TOUR_SLIDES.length - 1) goNext();
                    else setTourIndex((index) => index + 1);
                  }}
                >
                  {tourIndex >= TOUR_SLIDES.length - 1 ? t('onboardingContinue') : t('onboardingNext')}
                </KidsButton>
              </div>
            </motion.section>
          )}

          {step === 7 && (
            <motion.section
              key="ready"
              className="hkids-onboarding-panel w-full max-w-2xl text-center"
              {...getMotionProps(reducedMotion, kidsCardAppear)}
              aria-labelledby="onboarding-ready-title"
            >
              <div className="text-7xl mb-space-20" aria-hidden="true">{profile.avatar}</div>
              <h2 id="onboarding-ready-title" className="kids-type-display mb-space-16">
                {t('onboardingReadyTitle')}
              </h2>
              <p className="kids-shelf-subtitle !mx-auto mb-space-32 max-w-lg">
                {t('onboardingReadySubtitle', { name: profile.nickname || t('onboardingFriend') })}
              </p>
              <KidsButton
                size="lg"
                onClick={() => finishOnboarding(user?.role === 'kid' ? '/kids/library' : '/parent/login')}
                className="mx-auto min-w-[16rem]"
              >
                {t('onboardingReadyCta')}
              </KidsButton>
            </motion.section>
          )}
        </AnimatePresence>
      </OnboardingShell>
    </div>
  );
}
