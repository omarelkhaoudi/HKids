import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { generatedStoriesAPI } from '../api/generatedStories';
import { useAuth } from '../context/AuthContext';
import { speakText, stopSpeaking } from '../services/ai/browserTextToSpeech';
import {
  BookIcon, ChevronLeftIcon, PlayIcon, PauseIcon, HeartIcon, HistoryIcon, SparklesIcon,
} from '../components/Icons';
import { KidsPageShell } from '../components/kids/KidsPageShell';
import { Button, Badge, Avatar } from '../components/ui';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { getHoverMotion, getMotionProps, kidsCardAppear, kidsPageEnter } from '../constants/kidsMotion';
import { BRAND_HERO_GRADIENT, storyGradientAtIndex } from '../constants/brandTheme';

/** Worlds map to existing API theme ids — presentation only. */
const WORLD_DEFS = [
  { id: 'nature', worldKey: 'studioWorld_forest', pictogram: '🌲' },
  { id: 'aventure', worldKey: 'studioWorld_ocean', pictogram: '🌊' },
  { id: 'espace', worldKey: 'studioWorld_space', pictogram: '🚀' },
  { id: 'magie', worldKey: 'studioWorld_magic', pictogram: '✨' },
  { id: 'dinosaures', worldKey: 'studioWorld_dinosaurs', pictogram: '🦕' },
  { id: 'animaux', worldKey: 'studioWorld_animals', pictogram: '🦊' },
  { id: 'amitie', worldKey: 'studioWorld_friendship', pictogram: '💛' },
  { id: 'princesses', worldKey: 'studioWorld_dreams', pictogram: '🌙' },
];

const HERO_DEFS = [
  { id: 'un dragon', labelKey: 'studioHero_dragon', pictogram: '🐉', traitKey: 'studioHeroTrait_brave' },
  { id: 'un robot', labelKey: 'studioHero_robot', pictogram: '🤖', traitKey: 'studioHeroTrait_clever' },
  { id: 'une fée', labelKey: 'studioHero_fairy', pictogram: '🧚', traitKey: 'studioHeroTrait_kind' },
  { id: 'un chat', labelKey: 'studioHero_cat', pictogram: '🐱', traitKey: 'studioHeroTrait_curious' },
  { id: 'un pirate', labelKey: 'studioHero_pirate', pictogram: '🏴‍☠️', traitKey: 'studioHeroTrait_bold' },
  { id: 'un extra-terrestre', labelKey: 'studioHero_alien', pictogram: '👽', traitKey: 'studioHeroTrait_wonder' },
];

/** Adventures map to existing educational_value ids. */
const ADVENTURE_DEFS = [
  { id: 'curiosity', adventureKey: 'studioAdventure_treasure', pictogram: '💎', cardId: 'treasure' },
  { id: 'friendship', adventureKey: 'studioAdventure_friend', pictogram: '🤝', cardId: 'friend' },
  { id: 'courage', adventureKey: 'studioAdventure_courage', pictogram: '⭐', cardId: 'courage' },
  { id: 'curiosity', adventureKey: 'studioAdventure_stars', pictogram: '🌌', cardId: 'stars' },
  { id: 'respect', adventureKey: 'studioAdventure_forest', pictogram: '🌳', cardId: 'forest' },
];

/** Styles map to estimated_duration_minutes. */
const STYLE_DEFS = [
  { minutes: 8, styleKey: 'studioStyle_bedtime', pictogram: '🌙' },
  { minutes: 5, styleKey: 'studioStyle_funny', pictogram: '😄' },
  { minutes: 8, styleKey: 'studioStyle_educational', pictogram: '📚', styleId: 'educational' },
  { minutes: 5, styleKey: 'studioStyle_adventure', pictogram: '🗺️', styleId: 'adventure' },
  { minutes: 12, styleKey: 'studioStyle_calm', pictogram: '🍃' },
];

const LOADING_MESSAGE_KEYS = [
  'studioLoading_ideas',
  'studioLoading_world',
  'studioLoading_heroes',
  'studioLoading_pages',
  'studioLoading_writing',
  'studioLoading_ready',
];

const JOURNEY_STEPS = [
  { id: 1, labelKey: 'studioStep_world' },
  { id: 2, labelKey: 'studioStep_hero' },
  { id: 3, labelKey: 'studioStep_adventure' },
  { id: 4, labelKey: 'studioStep_style' },
  { id: 5, labelKey: 'studioStep_create' },
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

function SoftParticles({ count = 12, reducedMotion }) {
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
      educationalValue: item.id,
    })),
    [t],
  );

  const styles = useMemo(
    () => STYLE_DEFS.map((item, index) => ({
      ...item,
      styleId: item.styleId || `${item.styleKey}-${item.minutes}`,
      label: t(item.styleKey),
      uniqueKey: `${item.styleKey}-${index}`,
    })),
    [t],
  );

  const [journeyStep, setJourneyStep] = useState(1);
  const [selectedStyleId, setSelectedStyleId] = useState(styles[0]?.uniqueKey);
  const [selectedAdventureCard, setSelectedAdventureCard] = useState(adventures[0]?.cardId);
  const [form, setForm] = useState({
    theme: WORLD_DEFS[0].id,
    estimated_duration_minutes: 5,
    educational_value: 'friendship',
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

  const canUseStoryStudio = isStoryAuthor;
  const selectedKidProfile = kidProfiles.find((kid) => String(kid.id) === String(selectedKidProfileId));
  const showBookPreview = Boolean(story) && !loading;

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
    stopSpeaking();
    setSpeaking(false);

    const stepInterval = setInterval(() => {
      setLoadingStepIndex((curr) => Math.min(curr + 1, LOADING_MESSAGE_KEYS.length - 1));
    }, 2500);

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
        setHistory((current) => [nextStory, ...current.filter((item) => item.id !== nextStory.id)].slice(0, 30));
        window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
      }, reducedMotion ? 200 : 900);
    } catch (err) {
      clearInterval(stepInterval);
      setLoading(false);
      setJourneyStep(4);
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
    setJourneyStep(1);
    setError('');
    stopSpeaking();
    setSpeaking(false);
  };

  if (!canUseStoryStudio) {
    return (
      <div className="flex min-h-screen items-center justify-center kids-studio-atmosphere px-4">
        <div className="max-w-md rounded-32 bg-card p-8 text-center shadow-floating">
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

  return (
    <KidsPageShell variant="library" world="create" className="kids-studio-atmosphere kids-glow-create text-white">
      <SoftParticles count={reducedMotion ? 0 : 10} reducedMotion={reducedMotion} />

      <header className="sticky top-0 z-40 bg-magic-900/80 backdrop-blur-xl border-b border-white/10 shadow-lg px-4 py-4 flex items-center justify-between">
        <Link to={backPath} className="flex items-center gap-2 group min-h-touch">
          <div className="p-2 rounded-full bg-card/10 group-hover:bg-card/20 transition-colors">
            <ChevronLeftIcon className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-xl tracking-wide hidden sm:block">{t('studioBrand')}</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-card/10 rounded-full">
            <Avatar src={null} fallback={selectedKidProfile?.name?.charAt(0) || 'K'} className="w-8 h-8 bg-gradient-to-br from-primary-400 to-secondary-500 text-white font-bold" />
            <span className="font-bold text-sm">{selectedKidProfile?.name || t('parentChild')}</span>
          </div>
          <Link to={storiesPath}>
            <Button variant="outline" className="rounded-full bg-card/10 border-none text-white hover:bg-card/20 font-bold shadow-lg min-h-touch">
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
            <SoftParticles count={reducedMotion ? 0 : 14} reducedMotion={reducedMotion} />
            <div className="kids-studio-generate-stage">
              <motion.div
                className="kids-studio-magic-book"
                animate={reducedMotion ? undefined : { y: [0, -8, 0], rotate: [-1.5, 1.5, -1.5] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden="true"
              >
                <span className="kids-studio-magic-book-spine" />
                <span className="kids-studio-magic-book-page" />
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.h2
                  key={loadingStepIndex}
                  initial={reducedMotion ? false : { y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={reducedMotion ? undefined : { y: -10, opacity: 0 }}
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
        <motion.div {...getMotionProps(reducedMotion, kidsPageEnter)} className="text-center mb-space-24">
          <p className="kids-studio-kicker">
            <SparklesIcon className="w-4 h-4" aria-hidden="true" />
            {t('studioKicker')}
          </p>
          <h1 className="kids-studio-title">{t('studioTitle')}</h1>
          <p className="kids-studio-subtitle">{t('storyStudioParentSubtitle')}</p>
          {error ? (
            <div className="mt-6 inline-block bg-danger-500/20 border border-danger-500/50 text-danger-200 px-6 py-3 rounded-full font-bold" role="alert">
              {error}
            </div>
          ) : null}
        </motion.div>

        {!showBookPreview && (
          <>
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
                          <span className="kids-studio-hero-emoji" aria-hidden="true">{hero.pictogram}</span>
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
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.section>
              )}

              {journeyStep === 4 && (
                <motion.section
                  key="style"
                  {...getMotionProps(reducedMotion, kidsCardAppear)}
                  className="kids-studio-step-panel"
                  aria-labelledby="studio-style-heading"
                >
                  <h2 id="studio-style-heading" className="kids-studio-step-title">{t('studioChooseStyle')}</h2>
                  <p className="kids-studio-step-desc">{t('studioChooseStyleDesc')}</p>
                  <div className="kids-studio-style-grid">
                    {styles.map((style) => {
                      const active = selectedStyleId === style.uniqueKey;
                      return (
                        <motion.button
                          key={style.uniqueKey}
                          type="button"
                          {...getHoverMotion(reducedMotion)}
                          onClick={() => {
                            setSelectedStyleId(style.uniqueKey);
                            patchForm('estimated_duration_minutes', style.minutes);
                          }}
                          aria-pressed={active}
                          className={`kids-studio-style-card ${active ? 'is-active' : ''}`}
                        >
                          <span className="kids-studio-style-emoji" aria-hidden="true">{style.pictogram}</span>
                          <span className="kids-studio-style-label">{style.label}</span>
                          <span className="kids-studio-style-meta">{t('studioMinutes', { minutes: style.minutes })}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.section>
              )}

              {journeyStep === 5 && !loading && (
                <motion.section
                  key="ready"
                  {...getMotionProps(reducedMotion, kidsCardAppear)}
                  className="kids-studio-step-panel kids-studio-ready-panel"
                  aria-labelledby="studio-ready-heading"
                >
                  <h2 id="studio-ready-heading" className="kids-studio-step-title">{t('studioReadyTitle')}</h2>
                  <p className="kids-studio-step-desc">{t('studioReadyDesc')}</p>
                  <ul className="kids-studio-ready-summary">
                    <li>{t('studioReadyWorld', { world: worlds.find((w) => w.id === form.theme)?.label || form.theme })}</li>
                    <li>{t('studioReadyHero', { hero: heroes.find((h) => h.id === selectedHero)?.label || selectedHero })}</li>
                    <li>{t('studioReadyAdventure', { adventure: adventures.find((a) => a.cardId === selectedAdventureCard)?.label || form.educational_value })}</li>
                    <li>{t('studioReadyStyle', { style: styles.find((s) => s.uniqueKey === selectedStyleId)?.label || form.estimated_duration_minutes })}</li>
                  </ul>
                  <motion.button
                    type="button"
                    {...getHoverMotion(reducedMotion, { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } })}
                    onClick={handleGenerate}
                    disabled={loading || profilesLoading || !selectedKidProfileId}
                    className="kids-studio-generate-cta"
                  >
                    <span className={`kids-studio-generate-cta-bg bg-gradient-to-r ${BRAND_HERO_GRADIENT}`} aria-hidden="true" />
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
                  className="rounded-full bg-card/10 border-none text-white hover:bg-card/20 font-bold min-h-touch"
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
                  className="rounded-full bg-card/10 border-none text-white hover:bg-card/20 font-bold min-h-touch"
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
            className="kids-studio-book-preview"
            aria-labelledby="studio-book-title"
          >
            <div className="kids-studio-book-cover" aria-hidden="true">
              <span className="kids-studio-book-cover-emoji">📖</span>
              <p className="kids-studio-book-cover-theme">{story.theme}</p>
            </div>
            <div className="kids-studio-book-body">
              <div className="flex flex-wrap gap-2 mb-space-16">
                <Badge variant="soft" className="bg-card/70 font-black">{story.theme}</Badge>
                <Badge variant="soft" className="bg-card/70 font-black">
                  {t('studioMinutes', { minutes: story.estimated_duration_minutes || form.estimated_duration_minutes })}
                </Badge>
                <Badge variant="soft" className="bg-card/70 font-black">{story.educational_value}</Badge>
                {selectedKidProfile?.age ? (
                  <Badge variant="soft" className="bg-card/70 font-black">
                    {t('studioAgeLabel', { age: selectedKidProfile.age })}
                  </Badge>
                ) : null}
              </div>
              <h2 id="studio-book-title" className="kids-studio-book-title">{story.title}</h2>
              {story.summary ? <p className="kids-studio-book-summary">{story.summary}</p> : null}
              <div className="kids-studio-book-text">{story.story_text}</div>
              <div className="kids-studio-book-actions">
                <Button
                  onClick={() => handleSpeak(story)}
                  className={`flex-1 rounded-2xl py-4 font-black shadow-lg min-h-touch ${speaking ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-primary-500 text-white hover:bg-primary-600'}`}
                >
                  {speaking ? <PauseIcon className="w-5 h-5 mr-2" /> : <PlayIcon className="w-5 h-5 mr-2" />}
                  {speaking ? t('pause') : t('studioStartReading')}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={story.saved || saving}
                  variant="outline"
                  className="px-6 rounded-2xl font-black min-h-touch"
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

        {history.length > 0 && !loading && (
          <section className="mt-space-32" aria-labelledby="studio-history-heading">
            <h2 id="studio-history-heading" className="text-2xl font-black mb-space-16 flex items-center gap-3">
              <HistoryIcon className="w-7 h-7 text-white/70" aria-hidden="true" />
              {t('studioHistoryTitle')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-space-16">
              {history.slice(0, 6).map((item) => (
                <motion.button
                  key={item.id}
                  type="button"
                  {...getHoverMotion(reducedMotion)}
                  onClick={() => {
                    setStory(item);
                    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
                  }}
                  className="kids-studio-history-card"
                >
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h3 className="font-black text-lg text-white line-clamp-2 text-start">{item.title}</h3>
                    {item.saved ? <HeartIcon className="w-5 h-5 text-rose-400 shrink-0" filled /> : null}
                  </div>
                  <p className="text-sm font-medium text-white/55 line-clamp-2 mb-3 text-start">{item.summary || item.story_text}</p>
                  <Badge variant="soft" className="bg-card/10 text-white/80 text-xs font-bold">{item.theme}</Badge>
                </motion.button>
              ))}
            </div>
          </section>
        )}
      </main>
    </KidsPageShell>
  );
}

export default KidsStoryStudio;
