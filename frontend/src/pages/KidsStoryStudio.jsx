import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { generatedStoriesAPI } from '../api/generatedStories';
import { useAuth } from '../context/AuthContext';
import { speakText, stopSpeaking } from '../services/ai/browserTextToSpeech';
import {
  BookIcon, ChevronLeftIcon, PlayIcon, PauseIcon, HeartIcon, SparklesIcon,
} from '../components/Icons';
import { KidsPageShell } from '../components/kids/KidsPageShell';
import { Button, Avatar } from '../components/ui';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { getHoverMotion, getMotionProps, kidsCardAppear, kidsPageEnter } from '../constants/kidsMotion';
import { storyGradientAtIndex } from '../constants/brandTheme';

/** Worlds map to existing API theme ids — presentation only. */
const WORLD_DEFS = [
  { id: 'nature', worldKey: 'studioWorld_forest', descKey: 'studioWorldDesc_forest', pictogram: '🌲' },
  { id: 'ocean', worldKey: 'studioWorld_ocean', descKey: 'studioWorldDesc_ocean', pictogram: '🌊' },
  { id: 'magie', worldKey: 'studioWorld_magic', descKey: 'studioWorldDesc_magic', pictogram: '✨' },
  { id: 'dinosaures', worldKey: 'studioWorld_dinosaurs', descKey: 'studioWorldDesc_dinosaurs', pictogram: '🦕' },
  { id: 'espace', worldKey: 'studioWorld_space', descKey: 'studioWorldDesc_space', pictogram: '🚀' },
  { id: 'animaux', worldKey: 'studioWorld_animals', descKey: 'studioWorldDesc_animals', pictogram: '🦊' },
  { id: 'princesses', worldKey: 'studioWorld_dreams', descKey: 'studioWorldDesc_dreams', pictogram: '🌙' },
  { id: 'amitie', worldKey: 'studioWorld_friendship', descKey: 'studioWorldDesc_friendship', pictogram: '💛' },
  { id: 'aventure', worldKey: 'studioWorld_adventure', descKey: 'studioWorldDesc_adventure', pictogram: '🗺️' },
];

const HERO_DEFS = [
  { id: 'un petit renard', labelKey: 'studioHero_fox', traitKey: 'studioHeroTrait_curious', pictogram: '🦊' },
  { id: 'un jeune astronaute', labelKey: 'studioHero_astronaut', traitKey: 'studioHeroTrait_brave', pictogram: '🧑‍🚀' },
  { id: 'un lapin curieux', labelKey: 'studioHero_rabbit', traitKey: 'studioHeroTrait_curious', pictogram: '🐰' },
  { id: 'une exploratrice', labelKey: 'studioHero_explorer', traitKey: 'studioHeroTrait_bold', pictogram: '🧭' },
  { id: 'un petit dragon', labelKey: 'studioHero_tinydragon', traitKey: 'studioHeroTrait_brave', pictogram: '🐉' },
  { id: 'une tortue sage', labelKey: 'studioHero_turtle', traitKey: 'studioHeroTrait_kind', pictogram: '🐢' },
  { id: 'un inventeur', labelKey: 'studioHero_inventor', traitKey: 'studioHeroTrait_clever', pictogram: '🔬' },
  { id: 'une princesse', labelKey: 'studioHero_princess', traitKey: 'studioHeroTrait_kind', pictogram: '👑' },
  { id: 'un robot', labelKey: 'studioHero_robot', traitKey: 'studioHeroTrait_clever', pictogram: '🤖' },
];

/** Adventures map to existing educational_value ids. */
const ADVENTURE_DEFS = [
  { id: 'curiosity', adventureKey: 'studioAdventure_treasure', descKey: 'studioAdventureDesc_treasure', pictogram: '💎', cardId: 'treasure' },
  { id: 'friendship', adventureKey: 'studioAdventure_friend', descKey: 'studioAdventureDesc_friend', pictogram: '🤝', cardId: 'friend' },
  { id: 'curiosity', adventureKey: 'studioAdventure_stars', descKey: 'studioAdventureDesc_stars', pictogram: '🌌', cardId: 'stars' },
  { id: 'respect', adventureKey: 'studioAdventure_forest', descKey: 'studioAdventureDesc_forest', pictogram: '🌳', cardId: 'forest' },
  { id: 'curiosity', adventureKey: 'studioAdventure_world', descKey: 'studioAdventureDesc_world', pictogram: '🌍', cardId: 'world' },
  { id: 'courage', adventureKey: 'studioAdventure_flying', descKey: 'studioAdventureDesc_flying', pictogram: '✈️', cardId: 'flying' },
  { id: 'respect', adventureKey: 'studioAdventure_kindness', descKey: 'studioAdventureDesc_kindness', pictogram: '💗', cardId: 'kindness' },
];

/** Mood is journey UX only — does not alter the generation API payload. */
const MOOD_DEFS = [
  { moodId: 'bedtime', moodKey: 'studioMood_bedtime', descKey: 'studioMoodDesc_bedtime', pictogram: '🌙' },
  { moodId: 'funny', moodKey: 'studioMood_funny', descKey: 'studioMoodDesc_funny', pictogram: '😄' },
  { moodId: 'educational', moodKey: 'studioMood_educational', descKey: 'studioMoodDesc_educational', pictogram: '📚' },
  { moodId: 'adventure', moodKey: 'studioMood_adventure', descKey: 'studioMoodDesc_adventure', pictogram: '🗺️' },
  { moodId: 'calm', moodKey: 'studioMood_calm', descKey: 'studioMoodDesc_calm', pictogram: '🍃' },
  { moodId: 'mystery', moodKey: 'studioMood_mystery', descKey: 'studioMoodDesc_mystery', pictogram: '🔮' },
];

const LENGTH_DEFS = [
  { minutes: 5 },
  { minutes: 10 },
  { minutes: 15 },
  { minutes: 20 },
];

const LOADING_MESSAGE_KEYS = [
  'studioLoading_world',
  'studioLoading_heroes',
  'studioLoading_writing',
  'studioLoading_pages',
  'studioLoading_illustrations',
  'studioLoading_ready',
];

const JOURNEY_STEPS = [
  { id: 1, labelKey: 'studioStep_world' },
  { id: 2, labelKey: 'studioStep_hero' },
  { id: 3, labelKey: 'studioStep_adventure' },
  { id: 4, labelKey: 'studioStep_mood' },
  { id: 5, labelKey: 'studioStep_length' },
];

function getErrorMessage(error) {
  if (error.response?.status === 504) return 'La création a pris trop de temps. Réessaie avec une histoire plus courte.';
  if (error.response?.data?.error) return error.response.data.error;
  if (error.code === 'ECONNABORTED') return 'Le serveur met trop de temps à répondre. Réessaie dans un instant.';
  return error.message || "Impossible de créer l'histoire pour le moment.";
}

function storyLanguageToSpeechCode(language) {
  if (language === 'en') return 'en-US';
  if (language === 'ar') return 'ar-MA';
  return 'fr-FR';
}

function SoftParticles({ count = 10, reducedMotion }) {
  if (reducedMotion) return null;
  return (
    <div className="kids-studio-particles" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className="kids-studio-particle"
          style={{
            left: `${8 + (index * 7) % 84}%`,
            top: `${12 + (index * 11) % 70}%`,
            animationDelay: `${index * 0.45}s`,
          }}
        />
      ))}
    </div>
  );
}

function JourneyProgress({ step, t }) {
  return (
    <nav className="kids-studio-journey-progress" aria-label={t('studioJourneyProgress')}>
      {JOURNEY_STEPS.map((item) => {
        const active = item.id === step;
        const done = item.id < step;
        return (
          <div
            key={item.id}
            className={`kids-studio-journey-dot ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}`}
            aria-current={active ? 'step' : undefined}
          >
            <span className="kids-studio-journey-dot-num" aria-hidden="true">{item.id}</span>
            <span className="kids-studio-journey-dot-label">{t(item.labelKey)}</span>
          </div>
        );
      })}
    </nav>
  );
}

function KidsStoryStudio() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const isStoryAuthor = user?.role === 'parent' || user?.role === 'admin';
  const storiesPath = isStoryAuthor ? '/parent/ai-stories' : '/kids/ai-stories';
  const backPath = isStoryAuthor ? '/parent' : '/kids/ai-stories';

  const worlds = useMemo(
    () => WORLD_DEFS.map((world, index) => ({
      ...world,
      label: t(world.worldKey),
      description: t(world.descKey),
      gradient: storyGradientAtIndex(index),
    })),
    [t],
  );

  const heroes = useMemo(
    () => HERO_DEFS.map((hero) => ({
      ...hero,
      label: t(hero.labelKey),
      trait: t(hero.traitKey),
    })),
    [t],
  );

  const adventures = useMemo(
    () => ADVENTURE_DEFS.map((item) => ({
      ...item,
      label: t(item.adventureKey),
      description: t(item.descKey),
      educationalValue: item.id,
    })),
    [t],
  );

  const moods = useMemo(
    () => MOOD_DEFS.map((item) => ({
      ...item,
      label: t(item.moodKey),
      description: t(item.descKey),
    })),
    [t],
  );

  const [hasStarted, setHasStarted] = useState(false);
  const [journeyStep, setJourneyStep] = useState(1);
  const [selectedMoodId, setSelectedMoodId] = useState(MOOD_DEFS[0].moodId);
  const [selectedAdventureCard, setSelectedAdventureCard] = useState(ADVENTURE_DEFS[0].cardId);
  const [form, setForm] = useState({
    theme: WORLD_DEFS[0].id,
    estimated_duration_minutes: 5,
    educational_value: ADVENTURE_DEFS[0].id,
  });
  const [selectedHero, setSelectedHero] = useState(HERO_DEFS[0].id);
  const [customCharacter, setCustomCharacter] = useState('');

  const [story, setStory] = useState(null);
  const [history, setHistory] = useState([]);
  const [kidProfiles, setKidProfiles] = useState([]);
  const [selectedKidProfileId, setSelectedKidProfileId] = useState('');

  const [profilesLoading, setProfilesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');
  const [readingOpen, setReadingOpen] = useState(false);

  const canUseStoryStudio = isStoryAuthor;
  const selectedKidProfile = kidProfiles.find((kid) => String(kid.id) === String(selectedKidProfileId));
  const showBookPreview = Boolean(story) && !loading;
  const showWelcome = !hasStarted && !showBookPreview && !loading;

  useEffect(() => {
    if (!canUseStoryStudio) return undefined;
    let active = true;
    setProfilesLoading(true);
    generatedStoriesAPI.getKidProfiles()
      .then((response) => {
        if (!active) return;
        const profiles = response.data || [];
        setKidProfiles(profiles);
        setSelectedKidProfileId((current) => current || profiles[0]?.id || '');
      })
      .catch((err) => {
        console.warn('Could not load kid profiles for story studio:', err);
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setProfilesLoading(false);
      });
    return () => { active = false; stopSpeaking(); };
  }, [canUseStoryStudio]);

  useEffect(() => {
    if (!canUseStoryStudio || !selectedKidProfileId) return undefined;
    let active = true;
    generatedStoriesAPI.getHistory({ kid_profile_id: selectedKidProfileId })
      .then((response) => { if (active) setHistory(response.data || []); })
      .catch((err) => console.warn('Could not load generated story history:', err));
    return () => { active = false; stopSpeaking(); };
  }, [canUseStoryStudio, selectedKidProfileId]);

  const patchForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const goNext = () => setJourneyStep((step) => Math.min(5, step + 1));
  const goBack = () => setJourneyStep((step) => Math.max(1, step - 1));

  const handleGenerate = async () => {
    if (!selectedKidProfileId) {
      setError(t('studioNeedKidProfile'));
      return;
    }
    setError('');
    setLoading(true);
    setLoadingStepIndex(0);
    setJourneyStep(5);
    setReadingOpen(false);
    stopSpeaking();
    setSpeaking(false);

    const stepInterval = setInterval(() => {
      setLoadingStepIndex((curr) => Math.min(curr + 1, LOADING_MESSAGE_KEYS.length - 1));
    }, 2800);

    const finalCharacters = [selectedHero, customCharacter.trim()].filter(Boolean).join(', ');

    try {
      const response = await generatedStoriesAPI.generate({
        ...form,
        characters: finalCharacters || 'un doudou magique',
        kid_profile_id: selectedKidProfileId,
      });
      clearInterval(stepInterval);
      setLoadingStepIndex(LOADING_MESSAGE_KEYS.length - 1);

      const nextStory = response.data;
      setTimeout(() => {
        setLoading(false);
        setStory(nextStory);
        setHasStarted(true);
        setHistory((current) => [nextStory, ...current.filter((item) => item.id !== nextStory.id)].slice(0, 30));
        window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
      }, reducedMotion ? 200 : 1000);
    } catch (err) {
      clearInterval(stepInterval);
      setLoading(false);
      setJourneyStep(5);
      console.error('Story generation failed:', err);
      setError(getErrorMessage(err));
    }
  };

  const handleSpeak = async (selectedStory = story) => {
    if (!selectedStory?.story_text) return;
    setError('');
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    setReadingOpen(true);
    try {
      await speakText(`${selectedStory.title}. ${selectedStory.story_text}`, {
        language: storyLanguageToSpeechCode(selectedStory.language),
      });
    } catch (err) {
      setError(err.message || 'Lecture audio indisponible.');
    } finally {
      setSpeaking(false);
    }
  };

  const handleSave = async () => {
    if (!story?.id) return;
    setError('');
    setSaving(true);
    try {
      const response = await generatedStoriesAPI.save(story.id);
      const savedStory = response.data;
      setStory(savedStory);
      setHistory((current) => current.map((item) => (item.id === savedStory.id ? savedStory : item)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const startNewStory = () => {
    setStory(null);
    setReadingOpen(false);
    setHasStarted(true);
    setJourneyStep(1);
    setError('');
    stopSpeaking();
    setSpeaking(false);
  };

  const editStory = () => {
    setStory(null);
    setReadingOpen(false);
    setHasStarted(true);
    setJourneyStep(1);
    setError('');
    stopSpeaking();
    setSpeaking(false);
  };

  const beginCreating = () => {
    setHasStarted(true);
    setJourneyStep(1);
    setError('');
  };

  if (!canUseStoryStudio) {
    return (
      <div className="flex min-h-screen items-center justify-center kids-studio-atmosphere px-4">
        <div className="kids-studio-gate-card max-w-md p-8 text-center">
          <p className="mb-4 text-xl font-black text-foreground">{t('storyStudioParentOnlyTitle')}</p>
          <p className="mb-6 text-sm font-bold text-foreground-secondary">
            {t('storyStudioParentOnlyDescription')}
          </p>
          <Button onClick={() => navigate('/kids/ai-stories')} variant="primary" className="rounded-full w-full font-black">
            {t('back')}
          </Button>
        </div>
      </div>
    );
  }

  const selectedWorld = worlds.find((w) => w.id === form.theme);
  const selectedHeroDef = heroes.find((h) => h.id === selectedHero);
  const selectedAdventure = adventures.find((a) => a.cardId === selectedAdventureCard);
  const selectedMood = moods.find((m) => m.moodId === selectedMoodId);

  return (
    <KidsPageShell variant="library" world="create" className="kids-studio-atmosphere kids-studio-quiet">
      <SoftParticles count={reducedMotion ? 0 : 8} reducedMotion={reducedMotion} />

      <header className="kids-studio-topbar">
        <Link to={backPath} className="kids-studio-back-link min-h-touch">
          <span className="kids-studio-back-icon">
            <ChevronLeftIcon className="w-6 h-6" />
          </span>
          <span className="font-black text-xl tracking-wide hidden sm:block">{t('studioBrand')}</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 kids-studio-profile-chip">
            <Avatar src={null} fallback={selectedKidProfile?.name?.charAt(0) || 'K'} className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold" />
            <span className="font-bold text-sm">{selectedKidProfile?.name || t('parentChild')}</span>
          </div>
          <Link to={storiesPath}>
            <Button variant="outline" className="kids-studio-ghost-btn rounded-full font-bold min-h-touch">
              <BookIcon className="w-5 h-5 mr-2" /> {t('studioMyStories')}
            </Button>
          </Link>
        </div>
      </header>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="kids-studio-generate-overlay"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <SoftParticles count={reducedMotion ? 0 : 12} reducedMotion={reducedMotion} />
            <div className="kids-studio-generate-glow" aria-hidden="true" />
            <div className="kids-studio-generate-stage">
              <motion.div
                className="kids-studio-magic-book"
                animate={reducedMotion ? undefined : { y: [0, -10, 0], rotate: [-1.2, 1.2, -1.2] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden="true"
              >
                <span className="kids-studio-magic-book-spine" />
                <motion.span
                  className="kids-studio-magic-book-page kids-studio-magic-book-page--turn"
                  animate={reducedMotion ? undefined : { rotateY: [0, -18, 0] }}
                  transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span className="kids-studio-magic-book-page" />
              </motion.div>
              <div className="kids-studio-generate-stars" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((star) => (
                  <span key={star} className="kids-studio-generate-star" style={{ animationDelay: `${star * 0.55}s` }} />
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.h2
                  key={loadingStepIndex}
                  initial={reducedMotion ? false : { y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={reducedMotion ? undefined : { y: -10, opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0.12 : 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="kids-studio-generate-message"
                >
                  {t(LOADING_MESSAGE_KEYS[loadingStepIndex])}
                </motion.h2>
              </AnimatePresence>
              <p className="kids-studio-generate-hint">{t('studioLoadingHint')}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-28">
        {error ? (
          <div className="mb-6 text-center">
            <div className="kids-studio-error inline-block px-6 py-3" role="alert">
              {error}
            </div>
          </div>
        ) : null}

        {showWelcome && (
          <motion.section
            {...getMotionProps(reducedMotion, kidsPageEnter)}
            className="kids-studio-welcome"
            aria-labelledby="studio-welcome-heading"
          >
            <div className="kids-studio-welcome-art" aria-hidden="true">
              <span className="kids-studio-welcome-book" />
              <span className="kids-studio-welcome-orb kids-studio-welcome-orb--a" />
              <span className="kids-studio-welcome-orb kids-studio-welcome-orb--b" />
            </div>
            <p className="kids-studio-kicker">
              <SparklesIcon className="w-4 h-4" aria-hidden="true" />
              {t('studioBrand')}
            </p>
            <h1 id="studio-welcome-heading" className="kids-studio-welcome-title">
              {t('studioWelcomeTitle')}
            </h1>
            <p className="kids-studio-welcome-subtitle">{t('studioWelcomeSubtitle')}</p>
            <motion.button
              type="button"
              {...getHoverMotion(reducedMotion, { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } })}
              onClick={beginCreating}
              className="kids-studio-welcome-cta"
            >
              {t('studioStartCreating')}
            </motion.button>
            {history.length > 0 ? (
              <button
                type="button"
                className="kids-studio-welcome-secondary"
                onClick={() => {
                  setStory(history[0]);
                  setHasStarted(true);
                  window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
                }}
              >
                {t('studioContinueEditing')}
              </button>
            ) : null}
          </motion.section>
        )}

        {!showWelcome && !showBookPreview && (
          <>
            <motion.div {...getMotionProps(reducedMotion, kidsPageEnter)} className="text-center mb-space-20">
              <p className="kids-studio-kicker">
                <SparklesIcon className="w-4 h-4" aria-hidden="true" />
                {t('studioKicker')}
              </p>
              <h1 className="kids-studio-title">{t('studioTitle')}</h1>
              <p className="kids-studio-subtitle">{t('storyStudioParentSubtitle')}</p>
            </motion.div>

            <JourneyProgress step={journeyStep} t={t} />

            <AnimatePresence mode="wait">
              {journeyStep === 1 && (
                <motion.section
                  key="world"
                  {...getMotionProps(reducedMotion, kidsCardAppear)}
                  className="kids-studio-step-panel"
                  aria-labelledby="studio-world-heading"
                >
                  <h2 id="studio-world-heading" className="kids-studio-step-title">{t('studioChooseWorld')}</h2>
                  <p className="kids-studio-step-desc">{t('studioChooseWorldDesc')}</p>
                  <div className="kids-studio-world-grid">
                    {worlds.map((world) => {
                      const active = form.theme === world.id;
                      return (
                        <motion.button
                          key={world.id}
                          type="button"
                          {...getHoverMotion(reducedMotion)}
                          onClick={() => patchForm('theme', world.id)}
                          aria-pressed={active}
                          className={`kids-studio-world-card ${active ? 'is-active' : ''}`}
                        >
                          <span className={`kids-studio-world-glow bg-gradient-to-br ${world.gradient}`} aria-hidden="true" />
                          <span className="kids-studio-world-emoji" aria-hidden="true">{world.pictogram}</span>
                          <span className="kids-studio-world-label">{world.label}</span>
                          <span className="kids-studio-card-desc">{world.description}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.section>
              )}

              {journeyStep === 2 && (
                <motion.section
                  key="hero"
                  {...getMotionProps(reducedMotion, kidsCardAppear)}
                  className="kids-studio-step-panel"
                  aria-labelledby="studio-hero-heading"
                >
                  <h2 id="studio-hero-heading" className="kids-studio-step-title">{t('studioChooseHero')}</h2>
                  <p className="kids-studio-step-desc">{t('studioChooseHeroDesc')}</p>
                  <div className="kids-studio-hero-grid">
                    {heroes.map((hero) => {
                      const active = selectedHero === hero.id;
                      return (
                        <motion.button
                          key={hero.id}
                          type="button"
                          {...getHoverMotion(reducedMotion)}
                          onClick={() => setSelectedHero(hero.id)}
                          aria-pressed={active}
                          className={`kids-studio-hero-card ${active ? 'is-active' : ''}`}
                        >
                          <span className="kids-studio-hero-portrait" aria-hidden="true">
                            <span className="kids-studio-hero-emoji">{hero.pictogram}</span>
                          </span>
                          <span className="kids-studio-hero-label">{hero.label}</span>
                          <span className="kids-studio-hero-trait">{hero.trait}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                  <label className="kids-studio-custom-hero">
                    <span className="sr-only">{t('studioCustomHero')}</span>
                    <input
                      value={customCharacter}
                      onChange={(e) => setCustomCharacter(e.target.value)}
                      placeholder={t('studioCustomHeroPlaceholder')}
                      className="kids-studio-custom-input"
                    />
                  </label>
                </motion.section>
              )}

              {journeyStep === 3 && (
                <motion.section
                  key="adventure"
                  {...getMotionProps(reducedMotion, kidsCardAppear)}
                  className="kids-studio-step-panel"
                  aria-labelledby="studio-adventure-heading"
                >
                  <h2 id="studio-adventure-heading" className="kids-studio-step-title">{t('studioChooseAdventure')}</h2>
                  <p className="kids-studio-step-desc">{t('studioChooseAdventureDesc')}</p>
                  <div className="kids-studio-adventure-grid">
                    {adventures.map((adventure) => {
                      const active = selectedAdventureCard === adventure.cardId;
                      return (
                        <motion.button
                          key={adventure.cardId}
                          type="button"
                          {...getHoverMotion(reducedMotion)}
                          onClick={() => {
                            setSelectedAdventureCard(adventure.cardId);
                            patchForm('educational_value', adventure.educationalValue);
                          }}
                          aria-pressed={active}
                          className={`kids-studio-adventure-card ${active ? 'is-active' : ''}`}
                        >
                          <span className="kids-studio-adventure-emoji" aria-hidden="true">{adventure.pictogram}</span>
                          <span className="kids-studio-adventure-label">{adventure.label}</span>
                          <span className="kids-studio-card-desc">{adventure.description}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.section>
              )}

              {journeyStep === 4 && (
                <motion.section
                  key="mood"
                  {...getMotionProps(reducedMotion, kidsCardAppear)}
                  className="kids-studio-step-panel"
                  aria-labelledby="studio-mood-heading"
                >
                  <h2 id="studio-mood-heading" className="kids-studio-step-title">{t('studioChooseMood')}</h2>
                  <p className="kids-studio-step-desc">{t('studioChooseMoodDesc')}</p>
                  <div className="kids-studio-style-grid">
                    {moods.map((mood) => {
                      const active = selectedMoodId === mood.moodId;
                      return (
                        <motion.button
                          key={mood.moodId}
                          type="button"
                          {...getHoverMotion(reducedMotion)}
                          onClick={() => setSelectedMoodId(mood.moodId)}
                          aria-pressed={active}
                          className={`kids-studio-style-card ${active ? 'is-active' : ''}`}
                        >
                          <span className="kids-studio-style-emoji" aria-hidden="true">{mood.pictogram}</span>
                          <span className="kids-studio-style-label">{mood.label}</span>
                          <span className="kids-studio-card-desc">{mood.description}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.section>
              )}

              {journeyStep === 5 && !loading && (
                <motion.section
                  key="length"
                  {...getMotionProps(reducedMotion, kidsCardAppear)}
                  className="kids-studio-step-panel kids-studio-ready-panel"
                  aria-labelledby="studio-length-heading"
                >
                  <h2 id="studio-length-heading" className="kids-studio-step-title">{t('studioChooseLength')}</h2>
                  <p className="kids-studio-step-desc">{t('studioChooseLengthDesc')}</p>
                  <div className="kids-studio-length-grid" role="group" aria-label={t('studioChooseLength')}>
                    {LENGTH_DEFS.map((length) => {
                      const active = form.estimated_duration_minutes === length.minutes;
                      return (
                        <motion.button
                          key={length.minutes}
                          type="button"
                          {...getHoverMotion(reducedMotion)}
                          onClick={() => patchForm('estimated_duration_minutes', length.minutes)}
                          aria-pressed={active}
                          className={`kids-studio-length-card ${active ? 'is-active' : ''}`}
                        >
                          <span className="kids-studio-length-value">{length.minutes}</span>
                          <span className="kids-studio-length-unit">{t('studioMinutesShort')}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <ul className="kids-studio-ready-summary">
                    <li>{t('studioReadyWorld', { world: selectedWorld?.label || form.theme })}</li>
                    <li>{t('studioReadyHero', { hero: selectedHeroDef?.label || selectedHero })}</li>
                    <li>{t('studioReadyAdventure', { adventure: selectedAdventure?.label || form.educational_value })}</li>
                    <li>{t('studioReadyMood', { mood: selectedMood?.label || selectedMoodId })}</li>
                    <li>{t('studioReadyLength', { minutes: form.estimated_duration_minutes })}</li>
                  </ul>

                  <motion.button
                    type="button"
                    {...getHoverMotion(reducedMotion, { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } })}
                    onClick={handleGenerate}
                    disabled={loading || profilesLoading || !selectedKidProfileId}
                    className="kids-studio-generate-cta"
                  >
                    <span className="kids-studio-generate-cta-bg" aria-hidden="true" />
                    <span className="kids-studio-generate-cta-label">
                      <SparklesIcon className="w-7 h-7" aria-hidden="true" />
                      {t('storyStudioGenerateAction')}
                    </span>
                  </motion.button>
                </motion.section>
              )}
            </AnimatePresence>

            {!loading && journeyStep < 5 && (
              <div className="kids-studio-nav-row">
                <Button
                  type="button"
                  variant="outline"
                  className="kids-studio-ghost-btn rounded-full font-bold min-h-touch"
                  onClick={goBack}
                  disabled={journeyStep === 1}
                >
                  {t('studioBack')}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="rounded-full font-black min-h-touch px-8"
                  onClick={goNext}
                >
                  {t('studioContinue')}
                </Button>
              </div>
            )}

            {!loading && journeyStep === 5 && (
              <div className="kids-studio-nav-row">
                <Button
                  type="button"
                  variant="outline"
                  className="kids-studio-ghost-btn rounded-full font-bold min-h-touch"
                  onClick={goBack}
                >
                  {t('studioBack')}
                </Button>
              </div>
            )}
          </>
        )}

        {showBookPreview && (
          <motion.section
            id="story-result"
            {...getMotionProps(reducedMotion, kidsCardAppear)}
            className="kids-studio-book-preview kids-studio-book-preview--premium"
            aria-labelledby="studio-book-title"
          >
            <div className="kids-studio-book-cover" aria-hidden="true">
              <span className="kids-studio-book-cover-glow" />
              <span className="kids-studio-book-cover-emoji">{selectedWorld?.pictogram || '📖'}</span>
              <p className="kids-studio-book-cover-theme">{story.theme}</p>
            </div>
            <div className="kids-studio-book-body">
              <div className="kids-studio-book-meta">
                <span>{story.theme}</span>
                <span>{t('studioMinutes', { minutes: story.estimated_duration_minutes || form.estimated_duration_minutes })}</span>
                {selectedKidProfile?.age ? (
                  <span>{t('studioAgeLabel', { age: selectedKidProfile.age })}</span>
                ) : null}
              </div>
              <h2 id="studio-book-title" className="kids-studio-book-title">{story.title}</h2>
              {story.summary ? <p className="kids-studio-book-summary">{story.summary}</p> : null}

              {readingOpen ? (
                <div className="kids-studio-book-text">{story.story_text}</div>
              ) : (
                <p className="kids-studio-book-teaser">{t('studioPreviewTeaser')}</p>
              )}

              <div className="kids-studio-book-actions">
                <Button
                  onClick={() => {
                    if (!readingOpen) setReadingOpen(true);
                    handleSpeak(story);
                  }}
                  className={`flex-1 rounded-2xl py-4 font-black shadow-lg min-h-touch ${speaking ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-primary-500 text-white hover:bg-primary-600'}`}
                >
                  {speaking ? <PauseIcon className="w-5 h-5 mr-2" /> : <PlayIcon className="w-5 h-5 mr-2" />}
                  {speaking ? t('pause') : t('studioStartReading')}
                </Button>
                <Button
                  onClick={editStory}
                  variant="outline"
                  className="px-6 rounded-2xl font-black min-h-touch"
                >
                  {t('studioEditStory')}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={story.saved || saving}
                  variant="ghost"
                  className="rounded-2xl font-bold min-h-touch"
                  aria-label={t('studioSaveStory')}
                >
                  <HeartIcon className="w-5 h-5" filled={story.saved} />
                </Button>
                <Button
                  onClick={startNewStory}
                  variant="ghost"
                  className="rounded-2xl font-bold text-foreground-secondary min-h-touch"
                >
                  {t('studioCreateAnother')}
                </Button>
              </div>
            </div>
          </motion.section>
        )}

        {history.length > 0 && !loading && (showWelcome || showBookPreview || hasStarted) && (
          <section className="kids-studio-bookshelf" aria-labelledby="studio-history-heading">
            <div className="kids-studio-bookshelf-header">
              <h2 id="studio-history-heading" className="kids-studio-bookshelf-title">
                {t('studioHistoryTitle')}
              </h2>
              <p className="kids-studio-bookshelf-subtitle">{t('studioHistorySubtitle')}</p>
            </div>
            <div className="kids-studio-shelf">
              <div className="kids-studio-shelf-board" aria-hidden="true" />
              <div className="kids-studio-shelf-grid">
                {history.slice(0, 8).map((item, index) => (
                  <motion.button
                    key={item.id}
                    type="button"
                    {...getHoverMotion(reducedMotion)}
                    onClick={() => {
                      setStory(item);
                      setReadingOpen(false);
                      setHasStarted(true);
                      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
                    }}
                    className="kids-studio-shelf-book"
                    style={{ '--shelf-tint': `hsl(${28 + (index * 18) % 40} 42% 62%)` }}
                  >
                    <span className="kids-studio-shelf-cover">
                      <span className="kids-studio-shelf-cover-mark" aria-hidden="true">📖</span>
                      {item.saved ? <HeartIcon className="kids-studio-shelf-heart w-4 h-4" filled /> : null}
                    </span>
                    <span className="kids-studio-shelf-title">{item.title}</span>
                    <span className="kids-studio-shelf-meta">{item.theme}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </KidsPageShell>
  );
}

export default KidsStoryStudio;
