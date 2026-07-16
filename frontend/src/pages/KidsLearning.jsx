import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { learningAPI } from '../api/learning';
import { generatedStoriesAPI } from '../api/generatedStories';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { Logo } from '../components/Logo';
import { KidsPageShell } from '../components/kids/KidsPageShell';
import { BRAND_CONFETTI, BRAND_HERO_GRADIENT, BRAND_SEMANTIC } from '../constants/brandTheme';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { LearningQuizQuestion, LearningMemoryGame } from '../components/kids/LearningQuizQuestion';
import { useLanguage } from '../context/LanguageContext';
import { getRestrictionMessage } from '../services/parental/parentalAccessService';
import {
  AudioIcon, BookIcon, ChevronLeftIcon, CheckIcon, HomeIcon, 
  LogOutIcon, SparklesIcon, StarIcon, TrophyIcon, SearchIcon, PlayIcon
} from '../components/Icons';
import { KidsPageHeader } from '../components/kids/KidsPageHeader';
import { KidsHero } from '../components/kids/KidsHero';
import { KidsEmptyState } from '../components/kids/KidsEmptyState';
import { BookGridSkeleton } from '../components/SkeletonLoader';

// --- HELPER COMPONENTS ---

const Confetti = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => {
        const randomColor = BRAND_CONFETTI[Math.floor(Math.random() * BRAND_CONFETTI.length)];
        return (
          <motion.div
            key={i}
            initial={{ 
              x: 0, y: 0, scale: 0, rotate: 0 
            }}
            animate={{ 
              x: (Math.random() - 0.5) * 800, 
              y: (Math.random() - 0.5) * 800,
              scale: [0, 1, 0],
              rotate: Math.random() * 360
            }}
            transition={{ duration: 1.5 + Math.random(), ease: "easeOut" }}
            className={`absolute w-3 h-3 rounded-sm ${randomColor}`}
          />
        );
      })}
    </div>
  );
};

// --- MAIN COMPONENT ---

function KidsLearning() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { language, t, isRtl } = useLanguage();
  
  const [contents, setContents] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kidProfiles, setKidProfiles] = useState([]);
  const [selectedKidProfileId, setSelectedKidProfileId] = useState('');
  const [startedAt, setStartedAt] = useState(Date.now());
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

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
      .catch((error) => {
        console.warn('Kid profiles unavailable for learning:', error);
        setKidProfiles([]);
      });
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
      showToast(getRestrictionMessage(error, 'Jeux indisponibles pour le moment'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedKidProfileId) return;
    learningAPI.getChallenges({ kid_profile_id: selectedKidProfileId })
      .then((response) => setChallenges(response.data || []))
      .catch((error) => console.warn('Learning challenges unavailable:', error));
  }, [selectedKidProfileId]);

  const categories = useMemo(() => {
    const map = new Map();
    contents.forEach((content) => {
      const key = content.category_id || content.category_code || content.content_type;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: content.category_name || content.content_type,
          pictogram: content.category_pictogram || content.metadata?.pictogram || '⭐',
          color: content.category_color || 'from-primary-500 to-primary-400',
        });
      }
    });
    return Array.from(map.values());
  }, [contents]);

  const visibleContents = useMemo(() => {
    return contents.filter(c => {
      const matchSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase());
      const cKey = c.category_id || c.category_code || c.content_type;
      const matchCat = selectedCategoryFilter === 'all' || cKey === selectedCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [contents, searchQuery, selectedCategoryFilter]);

  const openContent = async (content) => {
    try {
      setResult(null);
      setAnswers({});
      setStartedAt(Date.now());
      const response = await learningAPI.getContent(content.id);
      setSelectedContent(response.data);
    } catch (error) {
      console.error('Learning content error:', error);
      showToast(getRestrictionMessage(error, 'Activité impossible à ouvrir'), 'error');
    }
  };

  const chooseAnswer = (questionId, value) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const submit = async () => {
    if (!selectedContent) return;
    if (user?.role !== 'kid' && !selectedKidProfileId) {
      showToast('Choisis un profil enfant pour enregistrer le score', 'info');
      return;
    }

    const payload = {
      ...(selectedKidProfileId ? { kid_profile_id: selectedKidProfileId } : {}),
      answers: selectedContent.content_type === 'game'
        ? [{ question_id: 0, answer: { value: answers.memory_game || [] } }]
        : (selectedContent.questions || []).map((question) => ({
            question_id: question.id,
            answer: { value: answers[question.id] },
          })),
      time_spent_seconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
    };

    try {
      const response = await learningAPI.submitAttempt(selectedContent.id, payload);
      setResult(response.data);
      if (response.data?.attempt?.success) {
        showToast('Bravo !', 'success');
      }
      loadLearning();
    } catch (error) {
      console.error('Learning submit error:', error);
      const serverMessage = error?.response?.data?.error;
      showToast(
        getRestrictionMessage(error, serverMessage || 'Réponse impossible à enregistrer'),
        'error'
      );
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/parent/login');
  };

  const selectedProfile = kidProfiles.find(k => k.id === selectedKidProfileId);

  return (
    <KidsPageShell isRtl={isRtl} variant="library" className="pb-32 kids-glow-learn" footer={<KidsBottomNav />}>
      <KidsPageHeader backTo="/kids" emoji="🎮" title={t('kidsNavLearning')} />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 pb-8">
        <AnimatePresence mode="wait">
          {selectedContent ? (
            /* ========================================================
               QUIZ INTERFACE
               ======================================================== */
            <motion.section 
              key="quiz"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="rounded-[2.5rem] bg-card p-6 md:p-8 shadow-2xl border border-border relative overflow-hidden"
            >
              {result && result.attempt?.success && <Confetti />}
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <button
                  onClick={() => setSelectedContent(null)}
                  className="inline-flex h-14 items-center gap-2 rounded-2xl bg-surface-secondary px-6 font-black hover:bg-surface-100 transition shadow-sm border border-border"
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                  Quitter
                </button>
              </div>

              <div className={`mb-8 rounded-[2.5rem] bg-gradient-to-br ${selectedContent.category_color} p-8 text-white shadow-lg relative overflow-hidden`}>
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="text-8xl drop-shadow-lg mb-4">{selectedContent.category_pictogram}</div>
                  <h2 className="text-4xl font-black drop-shadow-md">{selectedContent.title}</h2>
                  {selectedContent.audio_url && <AudioIcon className="mt-4 h-8 w-8 opacity-80" />}
                </div>
              </div>

              <div className="space-y-6 relative z-10">
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={submit}
                  className="mt-8 inline-flex h-20 w-full items-center justify-center gap-3 rounded-[2rem] bg-gradient-to-r from-secondary-400 to-secondary-600 text-2xl font-black text-white shadow-xl hover:shadow-2xl transition"
                >
                  <CheckIcon className="h-8 w-8" />
                  Valider mes réponses !
                </motion.button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`mt-8 rounded-[2rem] p-8 text-center shadow-xl border ${result.attempt?.success ? `${BRAND_SEMANTIC.success.bg} ${BRAND_SEMANTIC.success.border}` : `${BRAND_SEMANTIC.warning.bg} ${BRAND_SEMANTIC.warning.border}`}`}
                >
                  <div className="text-8xl mb-4 drop-shadow-md">{result.attempt?.success ? '🎉' : '⭐'}</div>
                  <p className="text-4xl font-black text-foreground mb-4">
                    Score : <span className={result.attempt?.success ? BRAND_SEMANTIC.success.text : BRAND_SEMANTIC.warning.text}>{result.attempt?.score} / {result.attempt?.max_score}</span>
                  </p>
                  {result.reward?.icon && (
                    <div className="inline-flex items-center gap-3 rounded-full bg-white/80 px-6 py-3 shadow-sm border border-border font-black text-2xl">
                      <span>{result.reward.icon}</span>
                      <span className="text-foreground">{result.reward.name}</span>
                    </div>
                  )}
                  <div className="mt-8">
                    <button
                      onClick={() => setSelectedContent(null)}
                      className="inline-flex h-16 items-center gap-3 rounded-2xl bg-surface-900 px-8 text-xl font-black text-white shadow-md hover:bg-surface-800 transition"
                    >
                      Continuer à jouer
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.section>
          ) : (
            /* ========================================================
               MAIN DASHBOARD (LEARNING CENTER)
               ======================================================== */
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              
              {/* PREMIUM HERO */}
              <KidsHero
                modality="learn"
                emoji="🎮"
                badge={t('kidsNavLearning')}
                title="Apprends en t'amusant !"
                subtitle="Choisis une activité illustrée et gagne des récompenses."
                className="mb-10"
              />

              {/* PROFILE CARD SELECTOR */}
              {user?.role !== 'kid' && (
                <section className="mb-10">
                  <div className="rounded-[2rem] bg-card p-6 shadow-sm border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-black flex items-center gap-2 text-foreground">
                        <span className="text-2xl">👦</span> Profil enfant
                      </h3>
                    </div>
                    {kidProfiles.length > 0 ? (
                      <div className="relative">
                        <button 
                          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                          className="w-full md:w-96 flex items-center justify-between p-4 rounded-2xl bg-surface-secondary border-2 border-primary-100 hover:border-primary-300 dark:border-primary-900/30 transition-all text-left"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-2xl shadow-inner">
                              {selectedProfile?.pictogram || '👧'}
                            </div>
                            <div>
                              <p className="font-black text-lg text-foreground">{selectedProfile?.name}</p>
                              <p className="text-sm font-bold text-foreground-muted">{selectedProfile?.age ? `${selectedProfile.age} ans` : 'Niveau standard'}</p>
                            </div>
                          </div>
                          <div className={`transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-90' : 'rotate-0'}`}>
                            <ChevronLeftIcon className="w-6 h-6 text-foreground-muted rotate-180" />
                          </div>
                        </button>

                        <AnimatePresence>
                          {isProfileMenuOpen && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full mt-2 w-full md:w-96 bg-card rounded-2xl shadow-xl border border-border z-40 overflow-hidden"
                            >
                              {kidProfiles.map((kid) => (
                                <button
                                  key={kid.id}
                                  onClick={() => { setSelectedKidProfileId(String(kid.id)); setIsProfileMenuOpen(false); }}
                                  className="w-full flex items-center gap-4 p-4 hover:bg-surface-secondary transition text-left border-b border-border last:border-0"
                                >
                                  <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-xl">
                                    {kid.pictogram || '👧'}
                                  </div>
                                  <div>
                                    <p className="font-black text-foreground">{kid.name}</p>
                                  </div>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <p className="rounded-2xl bg-accent-50 px-4 py-3 text-sm font-black text-accent-800 border border-accent-100">
                        Aucun profil enfant disponible. Créez-en un dans l'espace parent.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* QUICK STATS (KPIs) */}
              <section className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div whileHover={{ y: -5 }} className="bg-card/60 backdrop-blur-md rounded-[2rem] p-5 shadow-glass border border-border relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-16 h-16 bg-primary-500/10 rounded-bl-full transition-transform group-hover:scale-150" />
                  <BookIcon className="w-8 h-8 text-primary-500 mb-3 relative z-10" />
                  <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider mb-1">Activités</p>
                  <p className="text-3xl font-black text-foreground">{contents.length}</p>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="bg-card/60 backdrop-blur-md rounded-[2rem] p-5 shadow-glass border border-border relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-16 h-16 bg-secondary-500/10 rounded-bl-full transition-transform group-hover:scale-150" />
                  <TrophyIcon className="w-8 h-8 text-secondary-500 mb-3 relative z-10" />
                  <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider mb-1">Missions</p>
                  <p className="text-3xl font-black text-foreground">{challenges.length}</p>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="bg-card/60 backdrop-blur-md rounded-[2rem] p-5 shadow-glass border border-border relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-16 h-16 bg-accent-500/10 rounded-bl-full transition-transform group-hover:scale-150" />
                  <StarIcon className="w-8 h-8 text-accent-500 mb-3 relative z-10" />
                  <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider mb-1">XP Total</p>
                  <p className="text-lg font-black text-accent-600 dark:text-accent-400 mt-1">À venir</p>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="bg-card/60 backdrop-blur-md rounded-[2rem] p-5 shadow-glass border border-border relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-16 h-16 bg-primary-500/10 rounded-bl-full transition-transform group-hover:scale-150" />
                  <SparklesIcon className="w-8 h-8 text-primary-500 mb-3 relative z-10" />
                  <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider mb-1">Série</p>
                  <p className="text-lg font-black text-primary-600 dark:text-primary-400 mt-1">Bientôt dispo.</p>
                </motion.div>
              </section>

              {/* MISSIONS / CHALLENGES */}
              {challenges.length > 0 && (
                <section className="mb-10">
                  <h2 className="mb-6 text-2xl font-black flex items-center gap-3">
                    <TrophyIcon className="w-7 h-7 text-secondary-500" />
                    Missions Quotidiennes
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {challenges.map((challenge) => {
                      const progress = Math.min(100, (Number(challenge.progress_value || 0) / Math.max(1, Number(challenge.target_value || 1))) * 100);
                      const isComplete = progress >= 100;
                      return (
                        <motion.div 
                          key={challenge.id} 
                          whileHover={{ y: -4, scale: 1.01 }}
                          className={`rounded-[2rem] p-5 shadow-md relative overflow-hidden ${isComplete ? `${BRAND_SEMANTIC.success.bg} ${BRAND_SEMANTIC.success.border}` : 'bg-card border border-border'}`}
                        >
                          {isComplete && <div className="absolute -right-6 -top-6 w-24 h-24 bg-secondary-400/20 rounded-full blur-xl" />}
                          <div className="flex items-start gap-4 relative z-10">
                            <div className="text-4xl drop-shadow-sm">{challenge.metadata?.pictogram || challenge.reward_icon || '🏅'}</div>
                            <div className="flex-1">
                              <p className="text-lg font-black text-foreground mb-1">{challenge.title}</p>
                              <div className="flex justify-between text-xs font-bold mb-2">
                                <span className={isComplete ? BRAND_SEMANTIC.success.text : 'text-foreground-muted'}>
                                  {isComplete ? 'Terminé !' : 'En cours'}
                                </span>
                                <span className="text-foreground-muted">{challenge.progress_value || 0} / {challenge.target_value || 1}</span>
                              </div>
                              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-secondary shadow-inner">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className={`h-full rounded-full shadow-md ${isComplete ? 'bg-gradient-to-r from-secondary-400 to-secondary-600' : 'bg-gradient-to-r from-accent-400 to-accent-600'}`}
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* SEARCH & FILTERS (GLASSMORPHISM) */}
              <section className="mb-10">
                <div className="rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border p-4 shadow-glass">
                  <div className="flex flex-col md:flex-row gap-4">
                    <label className="relative flex-1 block">
                      <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-foreground-muted" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-16 w-full rounded-[2rem] bg-surface-secondary/80 border border-border pl-14 pr-4 text-lg font-bold outline-none transition focus:border-primary-400 focus:bg-card focus:ring-4 focus:ring-primary-500/10 placeholder:text-foreground-muted"
                        placeholder="Chercher une activité..."
                      />
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar items-center px-2">
                      <button 
                        onClick={() => setSelectedCategoryFilter('all')}
                        className={`shrink-0 px-6 h-12 rounded-full font-black text-sm transition-all shadow-sm ${selectedCategoryFilter === 'all' ? 'bg-primary-500 text-white shadow-md' : 'bg-card text-foreground-muted hover:bg-surface-secondary'}`}
                      >
                        Tous
                      </button>
                      {categories.map(cat => (
                        <button 
                          key={cat.id}
                          onClick={() => setSelectedCategoryFilter(cat.id)}
                          className={`shrink-0 px-6 h-12 rounded-full font-black text-sm flex items-center gap-2 transition-all shadow-sm ${selectedCategoryFilter === cat.id ? 'bg-primary-500 text-white shadow-md' : 'bg-card text-foreground hover:bg-surface-secondary border border-border'}`}
                        >
                          <span>{cat.pictogram}</span> {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* ACTIVITIES GRID (NINTENDO STYLE) */}
              <section>
                <h2 className="mb-6 text-2xl font-black flex items-center gap-3 text-foreground">
                  <PlayIcon className="w-7 h-7 text-primary-500" filled />
                  Mini-Jeux
                </h2>
                
                {loading ? (
                  <BookGridSkeleton count={8} />
                ) : visibleContents.length === 0 ? (
                  <KidsEmptyState
                    emoji="🦕"
                    title={t('nothingFound')}
                    description={t('tryAnotherWord')}
                    actionLabel={t('allCategories')}
                    onAction={() => { setSearchQuery(''); setSelectedCategoryFilter('all'); }}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6">
                    <AnimatePresence>
                      {visibleContents.map((content) => (
                        <motion.button
                          key={content.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ y: -8, scale: 1.03 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openContent(content)}
                          className={`group relative overflow-hidden min-h-[14rem] rounded-[2rem] bg-gradient-to-br ${content.category_color} p-5 text-left text-white shadow-xl transition-all hover:shadow-2xl flex flex-col`}
                        >
                          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/20 blur-xl group-hover:bg-white/30 transition-colors" />
                          
                          <div className="flex justify-between items-start relative z-10">
                            <span className="grid h-16 w-16 place-items-center rounded-[1.25rem] bg-black/20 text-4xl shadow-inner backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform">
                              {content.category_pictogram}
                            </span>
                            <span className="inline-flex rounded-full bg-black/30 backdrop-blur-md px-3 py-1 text-xs font-black shadow-sm border border-white/20">
                              {content.reward?.icon || '⭐'} XP
                            </span>
                          </div>
                          
                          <div className="mt-auto relative z-10 pt-4">
                            <span className="block text-xl font-black leading-tight drop-shadow-md mb-1">{content.title}</span>
                            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">{content.category_name || content.content_type}</span>
                          </div>
                          
                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-primary-500 shadow-glow transform scale-50 group-hover:scale-100 transition-transform duration-300">
                              <PlayIcon className="w-8 h-8 ml-1" filled />
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
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
