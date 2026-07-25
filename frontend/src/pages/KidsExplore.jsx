import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { KidsPageShell } from '../components/kids/KidsPageShell';
import { KidsPageHeader } from '../components/kids/KidsPageHeader';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { KidsHero } from '../components/kids/KidsHero';
import { DailySurpriseChest } from '../components/kids/DailySurpriseChest';
import { LearningUniverseDashboard } from '../components/kids/LearningUniverseDashboard';
import { LearningInteractiveChallenge } from '../components/kids/LearningInteractiveChallenge';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { getHoverMotion } from '../constants/kidsMotion';
import {
  EXPLORER_HUB_TILES,
  UNIVERSE_MINI_GAMES,
  getExtraMiniGame,
} from '../constants/learningUniverse';
import { luLabel, luTileLabel } from '../constants/learningUniverseLabels';
import { getWorldChallenges } from '../constants/worldChallenges';
import {
  claimDailyChest,
  getUniverseDashboard,
  setActiveAvatar,
} from '../utils/learningUniverseProgress';
import { recordLearningAttempt } from '../utils/educationalProgress';
import { playKidsUiSound } from '../utils/kidsUiSound';
import { useToast } from '../components/ToastProvider';
import { BRAND_CONFETTI } from '../constants/brandTheme';

const TABS = [
  { id: 'universes', labelKey: 'luTabUniverses' },
  { id: 'games', labelKey: 'luTabGames' },
  { id: 'quiz', labelKey: 'luTabQuiz' },
  { id: 'me', labelKey: 'luTabMe' },
];

function ConfettiBurst() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {Array.from({ length: 36 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, scale: 0 }}
          animate={{
            x: (Math.random() - 0.5) * 700,
            y: (Math.random() - 0.5) * 700,
            scale: [0, 1, 0],
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 1.2 + Math.random() }}
          className={`absolute w-3 h-3 rounded-sm ${BRAND_CONFETTI[i % BRAND_CONFETTI.length]}`}
        />
      ))}
    </div>
  );
}

function KidsExplore() {
  const { user } = useAuth();
  const { language, isRtl } = useLanguage();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const reducedMotion = useReducedMotion();
  const { showToast } = useToast();
  const [tick, setTick] = useState(0);
  const [activeGame, setActiveGame] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const kidId = user?.role === 'kid' ? (user.kid_profile_id || user.id) : (user?.id || 'guest');
  const tab = params.get('tab') || 'universes';

  const dashboard = useMemo(() => getUniverseDashboard(kidId), [kidId, tick]);

  useEffect(() => {
    if (!TABS.some((t) => t.id === tab)) {
      setParams({ tab: 'universes' }, { replace: true });
    }
  }, [tab, setParams]);

  const setTab = (id) => setParams({ tab: id });

  const resolveGameChallenge = (game) => {
    const extra = getExtraMiniGame(game.id);
    if (extra) return extra;
    if (game.worldId) {
      const list = getWorldChallenges(game.worldId);
      return list.find((c) => c.type === game.type) || list[0];
    }
    return getWorldChallenges('animals')[0];
  };

  const onGameComplete = ({ success }) => {
    const result = recordLearningAttempt(kidId, {
      worldId: activeGame?.worldId || null,
      challengeId: activeGame?.id,
      success,
      scorePercent: success ? 100 : 0,
    });
    setTick((n) => n + 1);
    if (success) {
      setShowConfetti(true);
      showToast(luLabel('luCorrect', language), 'success');
      setTimeout(() => setShowConfetti(false), 1400);
    }
    if (result.newlyUnlocked?.length) {
      showToast('⭐', 'success');
    }
  };

  const openChest = () => {
    const result = claimDailyChest(kidId);
    setTick((n) => n + 1);
    if (result.claimed) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1400);
    }
    return result;
  };

  return (
    <KidsPageShell isRtl={isRtl} variant="library" world="learn" className="pb-space-32 kids-glow-learn" footer={<KidsBottomNav />}>
      <KidsPageHeader backTo="/kids" emoji="✨" title={luLabel('luExplore', language)} />
      {showConfetti && !reducedMotion && <ConfettiBurst />}

      <div className="relative z-10 kids-main kids-main-tablet-wide space-y-space-24">
        <KidsHero
          modality="learn"
          emoji="🌌"
          badge={luLabel('luExplore', language)}
          title={luLabel('luExploreTitle', language)}
          subtitle={luLabel('luExploreSubtitle', language)}
        />

        <DailySurpriseChest
          claimed={dashboard.chestClaimedToday}
          language={language}
          onOpen={openChest}
          reducedMotion={reducedMotion}
        />

        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                playKidsUiSound('tap');
                setTab(item.id);
                setActiveGame(null);
              }}
              className={`shrink-0 min-h-touch px-space-20 rounded-full font-black text-caption border ${
                tab === item.id
                  ? 'bg-success-600 text-white border-success-600 shadow-card'
                  : 'bg-card text-foreground border-border'
              }`}
            >
              {luLabel(item.labelKey, language)}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeGame ? (
            <motion.section
              key="game"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-32 bg-card border border-border p-space-24 shadow-floating"
            >
              <button
                type="button"
                className="mb-space-16 min-h-touch font-black"
                onClick={() => setActiveGame(null)}
              >
                ← {luLabel('luTabGames', language)}
              </button>
              <div className="text-5xl text-center mb-space-16">{activeGame.emoji}</div>
              <LearningInteractiveChallenge
                challenge={resolveGameChallenge(activeGame)}
                language={language}
                reducedMotion={reducedMotion}
                onComplete={onGameComplete}
              />
            </motion.section>
          ) : tab === 'universes' ? (
            <motion.div
              key="universes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-space-16"
            >
              {EXPLORER_HUB_TILES.map((tile, index) => (
                <motion.button
                  key={tile.id}
                  type="button"
                  initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reducedMotion ? 0 : Math.min(index * 0.03, 0.35) }}
                  {...getHoverMotion(reducedMotion)}
                  onClick={() => {
                    playKidsUiSound('tap');
                    if (tile.tab) {
                      setTab(tile.tab);
                      return;
                    }
                    navigate(tile.path);
                  }}
                  className={`relative overflow-hidden min-h-[9.5rem] rounded-24 bg-gradient-to-br ${tile.gradient} p-space-16 text-start text-white shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-success-300`}
                >
                  <span className="text-4xl block mb-2" aria-hidden="true">{tile.emoji}</span>
                  <span className="block text-heading-m font-black leading-tight">
                    {luTileLabel(tile.id, language)}
                  </span>
                  <span className="absolute bottom-3 end-3 text-2xl opacity-80" aria-hidden="true">{tile.mascot}</span>
                </motion.button>
              ))}
            </motion.div>
          ) : tab === 'games' || tab === 'quiz' ? (
            <motion.div
              key={tab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              {UNIVERSE_MINI_GAMES
                .filter((game) => (tab === 'quiz' ? ['find_animal', 'image_word', 'count', 'alphabet', 'shapes'].includes(game.id) : true))
                .map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => {
                      playKidsUiSound('tap');
                      setActiveGame(game);
                    }}
                    className="rounded-24 border border-border bg-card p-space-20 text-start min-h-touch-kids shadow-soft"
                  >
                    <span className="text-4xl block mb-2">{game.emoji}</span>
                    <span className="font-black text-foreground block">{luLabel(game.labelKey, language)}</span>
                    <span className="text-caption text-foreground-muted">{luLabel('luPlay', language)}</span>
                  </button>
                ))}
            </motion.div>
          ) : (
            <motion.div key="me" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LearningUniverseDashboard
                dashboard={dashboard}
                language={language}
                reducedMotion={reducedMotion}
                onSelectAvatar={(id) => {
                  setActiveAvatar(kidId, id);
                  setTick((n) => n + 1);
                  playKidsUiSound('favorite');
                }}
              />
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

export default KidsExplore;
