import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { learningAPI } from '../api/learning';
import { generatedStoriesAPI } from '../api/generatedStories';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { AudioIcon, BookIcon, ChevronLeftIcon, CheckIcon, HomeIcon, LogOutIcon, SparklesIcon, StarIcon } from '../components/Icons';
import { Logo } from '../components/Logo';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';

function KidsLearning() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [contents, setContents] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kidProfiles, setKidProfiles] = useState([]);
  const [selectedKidProfileId, setSelectedKidProfileId] = useState('');
  const [startedAt, setStartedAt] = useState(Date.now());

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
      showToast('Jeux indisponibles pour le moment', 'error');
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
          color: content.category_color || 'from-sky-500 to-cyan-400',
        });
      }
    });
    return Array.from(map.values());
  }, [contents]);

  const openContent = async (content) => {
    try {
      setResult(null);
      setAnswers({});
      setStartedAt(Date.now());
      const response = await learningAPI.getContent(content.id);
      setSelectedContent(response.data);
    } catch (error) {
      console.error('Learning content error:', error);
      showToast('Activite impossible a ouvrir', 'error');
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
      answers: (selectedContent.questions || []).map((question) => ({
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
      showToast('Reponse impossible a enregistrer', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/parent/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-rose-50 text-neutral-900">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-32 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link to="/kids" className="shrink-0">
            <Logo size="default" showText={true} />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/kids"
              className="grid h-14 w-14 place-items-center rounded-full bg-white text-emerald-700 shadow-md"
              aria-label="Accueil"
            >
              <HomeIcon className="h-7 w-7" />
            </Link>
            <button
              onClick={handleLogout}
              className="grid h-14 w-14 place-items-center rounded-full bg-white text-red-500 shadow-md"
              aria-label="Deconnexion"
            >
              <LogOutIcon className="h-7 w-7" />
            </button>
          </div>
        </header>

        <section className="mb-6 rounded-[2rem] bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-black">
                <SparklesIcon className="h-5 w-5" />
                <span>Le Lit Qui Lit</span>
              </div>
              <h1 className="text-5xl font-black leading-tight sm:text-6xl">Joue</h1>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {categories.slice(0, 3).map((category) => (
                <div key={category.id} className="grid min-h-24 min-w-24 place-items-center rounded-[1.75rem] bg-white/20 p-3">
                  <span className="text-4xl">{category.pictogram}</span>
                  <span className="text-xs font-black">{category.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {user?.role !== 'kid' && (
          <section className="mb-6 rounded-[1.5rem] bg-white p-4 shadow-lg">
            <label className="mb-2 block text-sm font-black text-neutral-600">
              Profil enfant
            </label>
            {kidProfiles.length > 0 ? (
              <select
                value={selectedKidProfileId}
                onChange={(event) => setSelectedKidProfileId(event.target.value)}
                className="h-14 w-full rounded-2xl border-2 border-violet-100 px-4 text-base font-black outline-none focus:border-violet-400"
              >
                {kidProfiles.map((kid) => (
                  <option key={kid.id} value={kid.id}>
                    {kid.name}{kid.age ? ` - ${kid.age} ans` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-800">
                Aucun profil enfant disponible pour enregistrer les scores.
              </p>
            )}
          </section>
        )}

        {selectedContent ? (
          <section className="rounded-[2rem] bg-white p-5 shadow-xl">
            <button
              onClick={() => setSelectedContent(null)}
              className="mb-4 inline-flex h-14 items-center gap-2 rounded-2xl bg-neutral-100 px-4 font-black"
            >
              <ChevronLeftIcon className="h-6 w-6" />
              Retour
            </button>
            <div className={`mb-5 rounded-[2rem] bg-gradient-to-br ${selectedContent.category_color} p-5 text-white`}>
              <div className="text-7xl">{selectedContent.category_pictogram}</div>
              <h2 className="mt-3 text-3xl font-black">{selectedContent.title}</h2>
              {selectedContent.audio_url && <AudioIcon className="mt-3 h-7 w-7" />}
            </div>

            <div className="space-y-5">
              {(selectedContent.questions || []).map((question) => (
                <div key={question.id} className="rounded-[1.5rem] bg-neutral-50 p-4">
                  <p className="mb-4 text-2xl font-black">{question.prompt}</p>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {(question.options || []).map((option) => {
                      const active = answers[question.id] === option.id;
                      return (
                        <motion.button
                          key={option.id}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => chooseAnswer(question.id, option.id)}
                          className={`grid min-h-28 place-items-center rounded-[1.5rem] border-4 p-3 text-center transition ${
                            active ? 'border-emerald-500 bg-emerald-50' : 'border-white bg-white'
                          }`}
                          aria-label={option.label}
                        >
                          <span className="text-5xl">{option.pictogram || option.label}</span>
                          <span className="text-lg font-black">{option.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {!result ? (
              <button
                onClick={submit}
                className="mt-5 inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-[1.5rem] bg-neutral-900 text-xl font-black text-white"
              >
                <CheckIcon className="h-7 w-7" />
                Valider
              </button>
            ) : (
              <div className="mt-5 rounded-[1.5rem] bg-emerald-50 p-5 text-center">
                <div className="text-6xl">{result.attempt?.success ? '🎉' : '⭐'}</div>
                <p className="mt-2 text-3xl font-black">
                  {result.attempt?.score} / {result.attempt?.max_score}
                </p>
                {result.reward?.icon && (
                  <p className="mt-2 text-2xl font-black">{result.reward.icon} {result.reward.name}</p>
                )}
              </div>
            )}
          </section>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-black">Activites</h2>
              {loading ? (
                <div className="rounded-[2rem] bg-white p-8 text-center font-black shadow-lg">...</div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {contents.map((content) => (
                    <motion.button
                      key={content.id}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => openContent(content)}
                      className={`min-h-52 rounded-[2rem] bg-gradient-to-br ${content.category_color} p-5 text-left text-white shadow-xl`}
                    >
                      <span className="grid h-20 w-20 place-items-center rounded-[1.5rem] bg-white/25 text-5xl">
                        {content.category_pictogram}
                      </span>
                      <span className="mt-5 block text-2xl font-black">{content.title}</span>
                      <span className="mt-2 inline-flex rounded-full bg-white/20 px-3 py-1 text-sm font-black">
                        {content.reward?.icon || '⭐'}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-black">Defis</h2>
              <div className="grid gap-3 md:grid-cols-3">
                {challenges.map((challenge) => (
                  <div key={challenge.id} className="rounded-[1.5rem] bg-white p-4 shadow-lg">
                    <div className="text-4xl">{challenge.metadata?.pictogram || challenge.reward_icon || '🏅'}</div>
                    <p className="mt-2 text-lg font-black">{challenge.title}</p>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(100, (Number(challenge.progress_value || 0) / Math.max(1, Number(challenge.target_value || 1))) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
      <VoiceAssistant />
    </div>
  );
}

export default KidsLearning;
