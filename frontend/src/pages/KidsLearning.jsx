import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { learningAPI } from '../api/learning';
import { generatedStoriesAPI } from '../api/generatedStories';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { KidsPageShell } from '../components/kids/KidsPageShell';
import { BRAND_CONFETTI, BRAND_SEMANTIC } from '../constants/brandTheme';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { LearningQuizQuestion, LearningMemoryGame } from '../components/kids/LearningQuizQuestion';
import { LearningInteractiveChallenge } from '../components/kids/LearningInteractiveChallenge';
import { KidsWorldGrid } from '../components/kids/KidsWorldGrid';
import { KidsLearningProgressPanel } from '../components/kids/KidsLearningProgressPanel';
import { KidsAchievementBadges } from '../components/kids/KidsAchievementBadges';
import { useLanguage } from '../context/LanguageContext';
import { getRestrictionMessage } from '../services/parental/parentalAccessService';
import {
  AudioIcon, ChevronLeftIcon, CheckIcon, TrophyIcon, SearchIcon, PlayIcon,
} from '../components/Icons';
import { KidsPageHeader } from '../components/kids/KidsPageHeader';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { KidsHero } from '../components/kids/KidsHero';
import { KidsEmptyState } from '../components/kids/KidsEmptyState';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import {
  EDUCATIONAL_WORLDS,
  filterContentsForWorld,
  getEducationalWorld,
} from '../constants/educationalWorlds';
import { eduLabel } from '../constants/educationalWorldLabels';
import { getWorldChallenges } from '../constants/worldChallenges';
import {
  buildRecommendations,
  claimDailyReward,
  getDashboardSnapshot,
  getWorldPathProgress,
  loadEducationalProgress,
  recordLearningAttempt,
} from '../utils/educationalProgress';

const Confetti = () => (
  <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
    {Array.from({ length: 40 }).map((_, i) => {
      const randomColor = BRAND_CONFETTI[Math.floor(Math.random() * BRAND_CONFETTI.length)];
      return (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, scale: 0, rotate: 0 }}
          animate={{
            x: (Math.random() - 0.5) * 800,
            y: (Math.random() - 0.5) * 800,
            scale: [0, 1, 0],
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 1.5 + Math.random(), ease: 'easeOut' }}
          className={`absolute w-3 h-3 rounded-sm ${randomColor}`}
        />
      );
    })}
  </div>
);

function KidsLearning() {
  const { worldId: worldIdParam } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { language, t, isRtl } = useLanguage();
  const reducedMotion = useReducedMotion();

  const [contents, setContents] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kidProfiles, setKidProfiles] = useState([]);
  const [selectedKidProfileId, setSelectedKidProfileId] = useState('');
  const [startedAt, setStartedAt] = useState(Date.now());
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [eduTick, setEduTick] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const progressKidId = user?.role === 'kid'
    ? (user.kid_profile_id || user.id)
    : (selectedKidProfileId || 'guest');

  const activeWorld = worldIdParam ? getEducationalWorld(worldIdParam) : null;

  useEffect(() => {
    if (!user) return;
    loadLearning();
  }, [user]);

  useEffect(() => {
    if (!user || user.role === 'kid') return;
    generatedStoriesAPI.getKidProfiles()
      .then((response) => {
        const profiles = response.data || [];
        setKidProfiles(profiles);
        setSelectedKidProfileId((current) => current || String(profiles[0]?.id || ''));
      })
      .catch(() => setKidProfiles([]));
  }, [user]);

  const loadLearning = async () => {
    try {
      setLoading(true);
      const [contentsRes, challengesRes] = await Promise.all([
        learningAPI.getContents(),
        learningAPI.getChallenges(selectedKidProfileId ? { kid_profile_id: selectedKidProfileId } : {}).catch(() => ({ data: [] })),
      ]);
      setContents(contentsRes.data || []);
      setChallenges(challengesRes.data || []);
    } catch (error) {
      console.error('Learning load error:', error);
      showToast(getRestrictionMessage(error, t('kidsLearningUnavailable')), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedKidProfileId) return;
    learningAPI.getChallenges({ kid_profile_id: selectedKidProfileId })
      .then((response) => setChallenges(response.data || []))
      .catch(() => {});
  }, [selectedKidProfileId]);

  const eduProgress = useMemo(
    () => loadEducationalProgress(progressKidId),
    [progressKidId, eduTick],
  );
  const dashboard = useMemo(
    () => getDashboardSnapshot(progressKidId),
    [progressKidId, eduTick],
  );
  const recommendations = useMemo(
    () => buildRecommendations({
      kidId: progressKidId,
      contents,
      ageGroup: kidProfiles.find((k) => String(k.id) === String(selectedKidProfileId))?.age_group
        || user?.age_group
        || null,
      favoriteWorldIds: eduProgress.favoriteWorldIds,
    }),
    [progressKidId, contents, kidProfiles, selectedKidProfileId, user, eduProgress.favoriteWorldIds, eduTick],
  );

  const worldContents = useMemo(() => {
    if (!activeWorld) return contents;
    return filterContentsForWorld(contents, activeWorld.id);
  }, [contents, activeWorld]);

  const visibleContents = useMemo(() => {
    const base = activeWorld ? worldContents : contents;
    if (!searchQuery) return base;
    const q = searchQuery.toLowerCase();
    return base.filter((c) => (c.title || '').toLowerCase().includes(q));
  }, [contents, worldContents, activeWorld, searchQuery]);

  const pathProgress = useMemo(
    () => (activeWorld ? getWorldPathProgress(progressKidId, activeWorld.id) : null),
    [activeWorld, progressKidId, eduTick],
  );

  const worldBuiltInChallenges = useMemo(
    () => (activeWorld ? getWorldChallenges(activeWorld.id) : []),
    [activeWorld],
  );

  const refreshEdu = (newlyUnlocked = []) => {
    setEduTick((n) => n + 1);
    if (newlyUnlocked.length) {
      setShowConfetti(true);
      showToast(eduLabel('eduMasterUnlocked', language), 'success');
      setTimeout(() => setShowConfetti(false), 1800);
    }
  };

  const openWorld = (id) => navigate(`/kids/learning/${id}`);
  const backToHub = () => {
    setSelectedContent(null);
    setActiveChallenge(null);
    setResult(null);
    navigate('/kids/learning');
  };

  const openContent = async (content) => {
    try {
      setResult(null);
      setAnswers({});
      setActiveChallenge(null);
      setStartedAt(Date.now());
      const response = await learningAPI.getContent(content.id);
      setSelectedContent(response.data);
    } catch (error) {
      showToast(getRestrictionMessage(error, 'Activité impossible à ouvrir'), 'error');
    }
  };

  const chooseAnswer = (questionId, value) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const submit = async () => {
    if (!selectedContent) return;
    if (user?.role !== 'kid' && !selectedKidProfileId) {
      showToast(t('kidsLearningSelectProfile'), 'info');
      return;
    }

    const duration = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const payload = {
      ...(selectedKidProfileId ? { kid_profile_id: selectedKidProfileId } : {}),
      answers: selectedContent.content_type === 'game'
        ? [{ question_id: 0, answer: { value: answers.memory_game || [] } }]
        : (selectedContent.questions || []).map((question) => ({
            question_id: question.id,
            answer: { value: answers[question.id] },
          })),
      time_spent_seconds: duration,
    };

    try {
      const response = await learningAPI.submitAttempt(selectedContent.id, payload);
      setResult(response.data);
      const success = !!response.data?.attempt?.success;
      const max = Number(response.data?.attempt?.max_score || 1);
      const score = Number(response.data?.attempt?.score || 0);
      const { newlyUnlocked } = recordLearningAttempt(progressKidId, {
        worldId: activeWorld?.id || null,
        contentId: selectedContent.id,
        success,
        scorePercent: max ? Math.round((score / max) * 100) : 0,
        durationSeconds: duration,
      });
      refreshEdu(newlyUnlocked);
      if (success) showToast(t('kidsLearningBravo'), 'success');
      loadLearning();
    } catch (error) {
      const serverMessage = error?.response?.data?.error;
      showToast(getRestrictionMessage(error, serverMessage || 'Réponse impossible à enregistrer'), 'error');
    }
  };

  const onChallengeComplete = ({ success, scorePercent }) => {
    const duration = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const { newlyUnlocked } = recordLearningAttempt(progressKidId, {
      worldId: activeWorld?.id || null,
      challengeId: activeChallenge?.id,
      success,
      scorePercent: scorePercent || (success ? 100 : 0),
      durationSeconds: duration,
    });
    refreshEdu(newlyUnlocked);
    if (success) {
      setShowConfetti(true);
      showToast(eduLabel('eduChallengeComplete', language), 'success');
      setTimeout(() => setShowConfetti(false), 1600);
    }
  };

  const handleClaimDaily = () => {
    const res = claimDailyReward(progressKidId);
    if (res.claimed) {
      showToast(eduLabel('eduClaimReward', language, { xp: res.bonus }), 'success');
      refreshEdu();
    } else {
      showToast(eduLabel('eduRewardClaimed', language), 'info');
    }
  };

  const selectedProfile = kidProfiles.find((k) => String(k.id) === String(selectedKidProfileId));
  const headerTitle = activeWorld
    ? eduLabel(activeWorld.labelKey, language)
    : t('kidsNavLearning');
  const headerEmoji = activeWorld?.emoji || '🎮';

  return (
    <KidsPageShell isRtl={isRtl} variant="library" world="learn" className="pb-space-32 kids-glow-learn" footer={<KidsBottomNav />}>
      <KidsPageHeader
        backTo={activeWorld || selectedContent || activeChallenge ? undefined : '/kids'}
        onBack={activeWorld || selectedContent || activeChallenge
          ? () => {
            if (selectedContent || activeChallenge) {
              setSelectedContent(null);
              setActiveChallenge(null);
              setResult(null);
              return;
            }
            backToHub();
          }
          : undefined}
        emoji={headerEmoji}
        title={headerTitle}
      />
      <div className="relative z-10 kids-main kids-main-tablet-wide">
        {showConfetti && !reducedMotion && <Confetti />}

        <AnimatePresence mode="wait">
          {selectedContent ? (
            <motion.section
              key="quiz"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="rounded-32 bg-card p-space-24 md:p-space-32 shadow-floating border border-border relative overflow-hidden"
            >
              {result && result.attempt?.success && !reducedMotion && <Confetti />}

              <div className="flex items-center justify-between mb-space-32 relative z-10">
                <button
                  type="button"
                  onClick={() => setSelectedContent(null)}
                  className="inline-flex min-h-touch-kids items-center gap-space-8 rounded-16 bg-surface-secondary px-space-24 font-black hover:bg-surface-100 transition shadow-soft border border-border"
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                  {eduLabel('eduBackWorlds', language)}
                </button>
              </div>

              <div className={`mb-space-32 rounded-32 bg-gradient-to-br ${selectedContent.category_color || activeWorld?.gradient || 'from-success-400 to-success-600'} p-space-32 text-white shadow-card relative overflow-hidden`}>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="text-8xl drop-shadow-lg mb-space-16">{selectedContent.category_pictogram || '⭐'}</div>
                  <h2 className="text-heading-xl drop-shadow-md">{selectedContent.title}</h2>
                  {selectedContent.audio_url && <AudioIcon className="mt-space-4 h-8 w-8 opacity-80" />}
                </div>
              </div>

              <div className="space-y-space-24 relative z-10">
                {selectedContent.content_type === 'game' ? (
                  <LearningMemoryGame
                    pairs={selectedContent.metadata?.pairs || [
                      { id: '1', pictogram: '🐶' }, { id: '2', pictogram: '🐱' },
                      { id: '3', pictogram: '🐻' }, { id: '4', pictogram: '🦊' },
                    ]}
                    answers={answers}
                    onChoose={chooseAnswer}
                    disabled={!!result}
                  />
                ) : (
                  (selectedContent.questions || []).map((question) => (
                    <LearningQuizQuestion
                      key={question.id}
                      question={question}
                      answers={answers}
                      onChoose={chooseAnswer}
                      disabled={!!result}
                      listenLabel="Écouter"
                    />
                  ))
                )}
              </div>

              {!result ? (
                <motion.button
                  whileHover={reducedMotion ? undefined : { scale: 1.02 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                  onClick={submit}
                  className="mt-space-32 inline-flex h-20 min-h-touch-kids w-full items-center justify-center gap-space-12 rounded-24 bg-gradient-to-r from-success-500 to-success-600 text-heading-m text-white shadow-card"
                >
                  <CheckIcon className="h-8 w-8" />
                  Valider mes réponses !
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`mt-space-32 rounded-24 p-space-32 text-center shadow-card border ${result.attempt?.success ? `${BRAND_SEMANTIC.success.bg} ${BRAND_SEMANTIC.success.border}` : `${BRAND_SEMANTIC.warning.bg} ${BRAND_SEMANTIC.warning.border}`}`}
                >
                  <div className="text-8xl mb-space-16">{result.attempt?.success ? '🎉' : '⭐'}</div>
                  <p className="text-heading-xl text-foreground mb-space-16">
                    Score : <span className={result.attempt?.success ? BRAND_SEMANTIC.success.text : BRAND_SEMANTIC.warning.text}>{result.attempt?.score} / {result.attempt?.max_score}</span>
                  </p>
                  {result.reward?.icon && (
                    <div className="inline-flex items-center gap-space-12 rounded-full bg-white/80 px-space-24 py-space-12 shadow-soft border border-border font-black text-heading-m">
                      <span>{result.reward.icon}</span>
                      <span className="text-foreground">{result.reward.name}</span>
                    </div>
                  )}
                  <div className="mt-space-32">
                    <button
                      type="button"
                      onClick={() => setSelectedContent(null)}
                      className="inline-flex h-16 min-h-touch-kids items-center gap-space-12 rounded-16 bg-success-600 px-space-32 text-body-lg font-black text-white shadow-soft"
                    >
                      Continuer à jouer
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.section>
          ) : activeChallenge ? (
            <motion.section
              key="challenge"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="rounded-32 bg-card p-space-24 md:p-space-32 shadow-floating border border-border relative overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setActiveChallenge(null)}
                className="mb-space-24 inline-flex min-h-touch-kids items-center gap-space-8 rounded-16 bg-surface-secondary px-space-24 font-black border border-border"
              >
                <ChevronLeftIcon className="h-6 w-6" />
                {eduLabel('eduChallenges', language)}
              </button>
              <div className="text-5xl mb-space-16 text-center">{activeChallenge.pictogram || '⭐'}</div>
              <LearningInteractiveChallenge
                challenge={activeChallenge}
                language={language}
                reducedMotion={reducedMotion}
                onComplete={onChallengeComplete}
              />
            </motion.section>
          ) : activeWorld ? (
            <motion.div key={`world-${activeWorld.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className={`mb-space-32 rounded-32 bg-gradient-to-br ${activeWorld.gradient} p-space-28 text-white shadow-card`}>
                <p className="text-5xl mb-space-8">{activeWorld.emoji}</p>
                <h1 className="text-heading-xl font-black">{eduLabel(activeWorld.labelKey, language)}</h1>
                <p className="text-body mt-space-8 opacity-95">{eduLabel(activeWorld.descKey, language)}</p>
                {pathProgress && (
                  <div className="mt-space-20">
                    <div className="h-3 rounded-full bg-white/25 overflow-hidden">
                      <div className="h-full rounded-full bg-white" style={{ width: `${pathProgress.percent}%` }} />
                    </div>
                    <p className="text-caption font-bold mt-2 opacity-90">{pathProgress.percent}%</p>
                  </div>
                )}
              </div>

              {pathProgress && (
                <section className="mb-space-32">
                  <h2 className="text-heading-l font-black mb-space-16">{eduLabel('eduLearningPath', language)}</h2>
                  <ol className="space-y-3">
                    {pathProgress.steps.map((step, index) => (
                      <li
                        key={step.id}
                        className={`flex items-center gap-3 rounded-24 border p-space-16 ${
                          step.done
                            ? 'border-success-300 bg-success-50'
                            : step.unlocked
                              ? 'border-border bg-card'
                              : 'border-border/50 bg-surface-secondary opacity-60'
                        }`}
                      >
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-secondary font-black">
                          {step.done ? '✓' : index + 1}
                        </span>
                        <span className="font-black text-foreground">{eduLabel(step.labelKey, language)}</span>
                        {step.master && step.done && <span className="ms-auto text-2xl">🏅</span>}
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              <section className="mb-space-32">
                <h2 className="text-heading-l font-black mb-space-16 flex items-center gap-2">
                  <TrophyIcon className="w-6 h-6 text-success-600" />
                  {eduLabel('eduChallenges', language)}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {worldBuiltInChallenges.map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        setStartedAt(Date.now());
                        setActiveChallenge(ch);
                      }}
                      className="rounded-24 border border-border bg-card p-space-20 text-start min-h-touch-kids shadow-soft hover:shadow-card transition"
                    >
                      <span className="text-3xl block mb-2">{ch.pictogram}</span>
                      <span className="font-black text-foreground">{eduLabel('eduPlayChallenge', language)}</span>
                      <span className="block text-caption text-foreground-muted capitalize mt-1">{ch.type}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-space-16">
                  <h2 className="text-heading-l font-black flex items-center gap-2">
                    <PlayIcon className="w-6 h-6 text-success-600" filled />
                    {eduLabel('eduActivities', language)}
                  </h2>
                  <label className="relative block w-full sm:w-72">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-muted" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12 min-h-touch w-full rounded-2xl bg-surface-secondary border border-border pl-12 pr-4 outline-none focus:ring-4 focus:ring-success-500/10"
                      placeholder={t('kidsLearningSearchPlaceholder')}
                    />
                  </label>
                </div>
                {loading ? (
                  <BookGridSkeleton count={6} />
                ) : visibleContents.length === 0 ? (
                  <KidsEmptyState
                    emoji={activeWorld.emoji}
                    title={t('nothingFound')}
                    description={eduLabel(activeWorld.descKey, language)}
                    actionLabel={eduLabel('eduPlayChallenge', language)}
                    onAction={() => worldBuiltInChallenges[0] && setActiveChallenge(worldBuiltInChallenges[0])}
                    showMascot
                    mascotMood="encourage"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-space-16 md:grid-cols-3 lg:grid-cols-4">
                    {visibleContents.map((content) => (
                      <motion.button
                        key={content.id}
                        type="button"
                        whileHover={reducedMotion ? undefined : { y: -6, scale: 1.02 }}
                        onClick={() => openContent(content)}
                        className={`group relative overflow-hidden min-h-[12rem] rounded-24 bg-gradient-to-br ${content.category_color || activeWorld.gradient} p-space-16 text-left text-white shadow-card`}
                      >
                        <span className="text-4xl">{content.category_pictogram || activeWorld.emoji}</span>
                        <span className="block mt-auto pt-space-12 text-heading-m font-black leading-tight">{content.title}</span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </section>
            </motion.div>
          ) : (
            <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <KidsHero
                modality="learn"
                emoji="🎮"
                badge={eduLabel('eduHubTitle', language)}
                title={eduLabel('eduHubTitle', language)}
                subtitle={eduLabel('eduHubSubtitle', language)}
                className="mb-space-32"
              />

              {user?.role !== 'kid' && (
                <section className="mb-space-32">
                  <div className="rounded-24 bg-card p-space-20 shadow-soft border border-border">
                    <h3 className="text-heading-m mb-space-12 text-foreground">👦 Profil enfant</h3>
                    {kidProfiles.length > 0 ? (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                          className="w-full md:w-96 min-h-touch-kids flex items-center justify-between p-space-16 rounded-16 bg-surface-secondary border-2 border-success-100"
                        >
                          <div className="flex items-center gap-space-4">
                            <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center text-2xl">
                              {selectedProfile?.pictogram || '👧'}
                            </div>
                            <div>
                              <p className="text-heading-m text-foreground">{selectedProfile?.name}</p>
                            </div>
                          </div>
                          <ChevronLeftIcon className="w-6 h-6 text-foreground-muted rotate-180" />
                        </button>
                        <AnimatePresence>
                          {isProfileMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full mt-space-8 w-full md:w-96 bg-card rounded-16 shadow-floating border border-border z-40 overflow-hidden"
                            >
                              {kidProfiles.map((kid) => (
                                <button
                                  key={kid.id}
                                  type="button"
                                  onClick={() => { setSelectedKidProfileId(String(kid.id)); setIsProfileMenuOpen(false); }}
                                  className="w-full min-h-touch-kids flex items-center gap-space-16 p-space-16 hover:bg-surface-secondary text-left border-b border-border last:border-0"
                                >
                                  <span className="text-xl">{kid.pictogram || '👧'}</span>
                                  <span className="font-black">{kid.name}</span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <p className="rounded-16 bg-info-50 px-space-16 py-space-12 text-caption font-black text-info-700 border border-info-100">
                        Aucun profil enfant disponible.
                      </p>
                    )}
                  </div>
                </section>
              )}

              <section className="mb-space-32 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-24 bg-card border border-border p-space-16">
                  <p className="text-caption text-foreground-muted">{eduLabel('eduLevel', language, { level: dashboard.level?.level || 1 })}</p>
                  <p className="text-heading-l font-black">{eduLabel('eduXp', language, { xp: dashboard.level?.xp || 0 })}</p>
                  <div className="mt-2 h-2 rounded-full bg-surface-secondary overflow-hidden">
                    <div className="h-full bg-success-500" style={{ width: `${dashboard.level?.percent || 0}%` }} />
                  </div>
                </div>
                <div className="rounded-24 bg-card border border-border p-space-16">
                  <p className="text-caption text-foreground-muted">{eduLabel('eduStars', language)}</p>
                  <p className="text-heading-l font-black">⭐ {dashboard.challengesCompleted + dashboard.storiesCompleted}</p>
                </div>
                <div className="rounded-24 bg-card border border-border p-space-16">
                  <p className="text-caption text-foreground-muted">{eduLabel('eduWorldsExplored', language)}</p>
                  <p className="text-heading-l font-black">{dashboard.worldsExplored}/{EDUCATIONAL_WORLDS.length}</p>
                </div>
                <button
                  type="button"
                  onClick={handleClaimDaily}
                  className="rounded-24 bg-gradient-to-br from-amber-400 to-orange-500 text-white p-space-16 text-start shadow-card min-h-touch-kids"
                >
                  <p className="text-caption font-bold opacity-90">{eduLabel('eduDailyReward', language)}</p>
                  <p className="text-heading-m font-black mt-1">{eduLabel('eduClaimReward', language, { xp: 15 })}</p>
                </button>
              </section>

              <section className="mb-space-32">
                <KidsLearningProgressPanel
                  snapshot={dashboard}
                  language={language}
                  nextWorldId={recommendations.continueLearning.worldId}
                  onOpenWorld={openWorld}
                />
              </section>

              <section className="mb-space-32">
                <h2 className="text-heading-l font-black mb-space-12">{eduLabel('eduContinueLearning', language)}</h2>
                <button
                  type="button"
                  onClick={() => openWorld(recommendations.continueLearning.worldId)}
                  className="w-full rounded-24 border border-border bg-card p-space-20 text-start min-h-touch-kids shadow-soft"
                >
                  {(() => {
                    const w = getEducationalWorld(recommendations.continueLearning.worldId);
                    return w ? `${w.emoji} ${eduLabel(w.labelKey, language)}` : '…';
                  })()}
                </button>
              </section>

              <section className="mb-space-32">
                <h2 className="text-heading-l font-black mb-space-12">{eduLabel('eduRecommended', language)}</h2>
                <KidsWorldGrid
                  language={language}
                  progressByWorld={eduProgress.byWorld}
                  onSelectWorld={openWorld}
                  reducedMotion={reducedMotion}
                  highlightIds={recommendations.recommendedForYou.map((w) => w.id)}
                />
              </section>

              {recommendations.practiceAgain.length > 0 && (
                <section className="mb-space-32">
                  <h2 className="text-heading-l font-black mb-space-12">{eduLabel('eduPracticeAgain', language)}</h2>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.practiceAgain.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => openContent(c)}
                        className="rounded-full border border-border bg-card px-4 py-2 font-bold min-h-touch"
                      >
                        {c.title}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section className="mb-space-32">
                <h2 className="text-heading-l font-black mb-space-12">{eduLabel('eduNewChallenge', language)}</h2>
                {recommendations.newChallenge && (
                  <button
                    type="button"
                    onClick={() => openWorld(recommendations.newChallenge.id)}
                    className={`w-full rounded-24 bg-gradient-to-r ${recommendations.newChallenge.gradient} p-space-20 text-white text-start font-black min-h-touch-kids shadow-card`}
                  >
                    {recommendations.newChallenge.emoji} {eduLabel(recommendations.newChallenge.labelKey, language)}
                  </button>
                )}
              </section>

              <section className="mb-space-32">
                <h2 className="text-heading-l font-black mb-space-16">{eduLabel('eduExploreMore', language)}</h2>
                <KidsWorldGrid
                  language={language}
                  progressByWorld={eduProgress.byWorld}
                  onSelectWorld={openWorld}
                  reducedMotion={reducedMotion}
                />
              </section>

              {challenges.length > 0 && (
                <section className="mb-space-32">
                  <h2 className="mb-space-16 text-heading-l flex items-center gap-space-12">
                    <TrophyIcon className="w-7 h-7 text-success-600" />
                    {t('kidsLearningDailyMissions')}
                  </h2>
                  <div className="grid gap-space-16 md:grid-cols-2 lg:grid-cols-3">
                    {challenges.map((challenge) => {
                      const progress = Math.min(100, (Number(challenge.progress_value || 0) / Math.max(1, Number(challenge.target_value || 1))) * 100);
                      const isComplete = progress >= 100;
                      return (
                        <div
                          key={challenge.id}
                          className={`rounded-24 p-space-20 shadow-card ${isComplete ? `${BRAND_SEMANTIC.success.bg} ${BRAND_SEMANTIC.success.border}` : 'bg-card border border-border'}`}
                        >
                          <p className="text-heading-m text-foreground mb-space-4">{challenge.title}</p>
                          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-secondary">
                            <div className="h-full rounded-full bg-success-500" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <section className="mb-space-24">
                <h2 className="text-heading-l font-black mb-space-12">{eduLabel('eduParentAchievements', language)}</h2>
                <KidsAchievementBadges unlockedIds={dashboard.badges} language={language} reducedMotion={reducedMotion} />
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <VoiceAssistant
        language={language === 'en' ? 'en-US' : language === 'ar' ? 'ar-MA' : 'fr-FR'}
        onNavigate={(path) => navigate(path)}
      />
    </KidsPageShell>
  );
}

export default KidsLearning;
