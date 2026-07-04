import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { generatedStoriesAPI } from '../api/generatedStories';
import { useAuth } from '../context/AuthContext';
import { speakText, stopSpeaking } from '../services/ai/browserTextToSpeech';
import { AudioIcon, BookIcon, CheckIcon, ClockIcon, SparklesIcon, StarIcon } from '../components/Icons';
import { Logo } from '../components/Logo';

const themeOptions = [
  { id: 'foret magique', label: 'Foret', pictogram: '🌳' },
  { id: 'espace', label: 'Espace', pictogram: '🚀' },
  { id: 'animaux', label: 'Animaux', pictogram: '🐻' },
  { id: 'ocean', label: 'Ocean', pictogram: '🌊' },
  { id: 'dinosaures', label: 'Dino', pictogram: '🦖' },
  { id: 'chateau', label: 'Chateau', pictogram: '👸' }
];

const valueOptions = [
  { id: 'friendship', label: 'Amitie' },
  { id: 'courage', label: 'Courage' },
  { id: 'respect', label: 'Respect' },
  { id: 'curiosity', label: 'Curiosite' }
];

const durationOptions = [2, 5, 8, 12, 15];

function getErrorMessage(error) {
  if (error.response?.status === 504) {
    return 'La creation a pris trop de temps. Reessaie avec une histoire plus courte.';
  }

  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.code === 'ECONNABORTED') {
    return 'Le serveur met trop de temps a repondre. Reessaie dans un instant.';
  }

  return error.message || 'Impossible de creer l histoire pour le moment.';
}

function storyLanguageToSpeechCode(language) {
  if (language === 'en') return 'en-US';
  if (language === 'ar') return 'ar-MA';
  return 'fr-FR';
}

function KidsStoryStudio() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    theme: themeOptions[0].id,
    characters: 'un doudou, une etoile',
    estimated_duration_minutes: 5,
    educational_value: 'friendship'
  });
  const [story, setStory] = useState(null);
  const [history, setHistory] = useState([]);
  const [kidProfiles, setKidProfiles] = useState([]);
  const [selectedKidProfileId, setSelectedKidProfileId] = useState('');
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');

  const canUseStoryStudio = ['kid', 'parent', 'admin'].includes(user?.role);
  const selectedKidProfile = kidProfiles.find((kid) => String(kid.id) === String(selectedKidProfileId));

  const characterPreview = useMemo(() => (
    form.characters
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4)
  ), [form.characters]);

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

    return () => {
      active = false;
      stopSpeaking();
    };
  }, [canUseStoryStudio]);

  useEffect(() => {
    if (!canUseStoryStudio || !selectedKidProfileId) return undefined;

    let active = true;
    generatedStoriesAPI.getHistory({ kid_profile_id: selectedKidProfileId })
      .then((response) => {
        if (active) setHistory(response.data || []);
      })
      .catch((err) => {
        console.warn('Could not load generated story history:', err);
      });

    return () => {
      active = false;
      stopSpeaking();
    };
  }, [canUseStoryStudio, selectedKidProfileId]);

  const patchForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!selectedKidProfileId) {
      setError('Choisis un profil enfant avant de creer une histoire.');
      return;
    }

    setError('');
    setLoading(true);
    stopSpeaking();
    setSpeaking(false);

    try {
      const response = await generatedStoriesAPI.generate({
        ...form,
        kid_profile_id: selectedKidProfileId
      });
      const nextStory = response.data;
      setStory(nextStory);
      setHistory((current) => [nextStory, ...current.filter((item) => item.id !== nextStory.id)].slice(0, 30));
    } catch (err) {
      console.error('Story generation failed:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = async (selectedStory = story) => {
    if (!selectedStory?.story_text) return;

    setError('');
    setSpeaking(true);
    try {
      await speakText(`${selectedStory.title}. ${selectedStory.story_text}`, {
        language: storyLanguageToSpeechCode(selectedStory.language)
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

  if (!canUseStoryStudio) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rose-50 px-4">
        <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
          <p className="mb-4 text-lg font-black text-neutral-900">Espace enfant ou parent requis</p>
          <button
            onClick={() => navigate('/kids')}
            className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-black text-white"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-rose-50 text-neutral-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link to="/kids" className="shrink-0">
            <Logo size="default" showText={true} />
          </Link>
          <Link
            to="/kids/ai-stories"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-neutral-800 shadow-md"
          >
            <BookIcon className="h-5 w-5" />
            <span>Mes histoires IA</span>
          </Link>
        </header>

        <section className="mb-6 rounded-[2rem] bg-gradient-to-br from-fuchsia-500 via-red-500 to-orange-400 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-black">
                <SparklesIcon className="h-5 w-5" />
                <span>Le Lit Qui Lit</span>
              </div>
              <h1 className="text-5xl font-black leading-tight sm:text-6xl">Cree</h1>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || profilesLoading || !selectedKidProfileId}
              className="inline-flex min-h-20 items-center justify-center gap-3 rounded-[1.75rem] bg-white px-8 py-4 text-2xl font-black text-red-600 shadow-lg transition hover:bg-red-50 disabled:opacity-60"
            >
              <SparklesIcon className="h-8 w-8" />
              <span>{loading ? '...' : 'Go'}</span>
            </button>
          </div>
        </section>

        <main className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-lg">
            <h2 className="mb-4 text-xl font-black">Ingredients</h2>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black text-neutral-700">Enfant</label>
                {profilesLoading ? (
                  <div className="rounded-xl border-2 border-red-100 px-4 py-3 text-sm font-bold text-neutral-500">
                    Chargement...
                  </div>
                ) : kidProfiles.length > 0 ? (
                  <select
                    value={selectedKidProfileId}
                    onChange={(event) => {
                      setSelectedKidProfileId(event.target.value);
                      setStory(null);
                      setHistory([]);
                    }}
                    className="w-full rounded-xl border-2 border-red-100 px-4 py-3 text-sm font-bold focus:border-red-400 focus:outline-none"
                  >
                    {kidProfiles.map((kid) => (
                      <option key={kid.id} value={kid.id}>
                        {kid.name}{kid.age ? ` - ${kid.age} ans` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-xl border-2 border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                    Aucun profil enfant disponible.
                  </div>
                )}
                {selectedKidProfile && (
                  <p className="mt-2 text-xs font-bold text-neutral-500">
                    Langue: {(selectedKidProfile.preferred_language || 'fr').toUpperCase()}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-neutral-700">Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  {themeOptions.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => patchForm('theme', theme.id)}
                      className={`grid min-h-24 place-items-center rounded-2xl border px-3 py-3 text-sm font-black transition ${
                        form.theme === theme.id
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                      aria-label={theme.label}
                    >
                      <span className="text-3xl">{theme.pictogram}</span>
                      <span>{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-neutral-700">Personnages</label>
                <input
                  value={form.characters}
                  onChange={(event) => patchForm('characters', event.target.value)}
                  className="w-full rounded-xl border-2 border-red-100 px-4 py-3 text-sm font-bold focus:border-red-400 focus:outline-none"
                  placeholder="ex: Lina, un dragon, une etoile"
                />
                {characterPreview.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {characterPreview.map((character) => (
                      <span key={character} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                        {character}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-neutral-700">Duree estimee</label>
                <div className="grid grid-cols-5 gap-2">
                  {durationOptions.map((duration) => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => patchForm('estimated_duration_minutes', duration)}
                      className={`min-h-14 rounded-xl border px-2 py-3 text-sm font-black transition ${
                        Number(form.estimated_duration_minutes) === duration
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {duration}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-neutral-700">Valeur educative</label>
                <select
                  value={form.educational_value}
                  onChange={(event) => patchForm('educational_value', event.target.value)}
                  className="w-full rounded-xl border-2 border-red-100 px-4 py-3 text-sm font-bold focus:border-red-400 focus:outline-none"
                >
                  {valueOptions.map((value) => (
                    <option key={value.id} value={value.id}>{value.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="min-h-[420px] rounded-2xl border border-red-100 bg-white p-5 shadow-lg">
              {error && (
                <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                  {error}
                </div>
              )}

              {!story ? (
                <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
                  <div className="mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-red-50 text-red-500">
                    <BookIcon className="h-10 w-10" />
                  </div>
                  <p className="text-2xl font-black">Ton histoire apparaitra ici</p>
                  <p className="mt-2 max-w-md text-sm font-bold text-neutral-500">
                    Le backend utilisera ton profil enfant pour adapter le texte.
                  </p>
                </div>
              ) : (
                <article>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-3xl font-black">{story.title}</h2>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-red-700">
                          <ClockIcon className="h-4 w-4" />
                          {story.estimated_duration_minutes} min
                        </span>
                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700">{story.theme}</span>
                        {story.age_level && (
                          <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">{story.age_level}</span>
                        )}
                        <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">{story.educational_value}</span>
                      </div>
                      {story.summary && (
                        <p className="mt-3 max-w-2xl text-sm font-bold text-neutral-500">{story.summary}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSpeak(story)}
                        disabled={speaking}
                        className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                      >
                        <AudioIcon className="h-5 w-5" />
                        {speaking ? 'Lecture...' : 'Ecouter'}
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving || story.saved}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                      >
                        <CheckIcon className="h-5 w-5" />
                        {story.saved ? 'Sauvee' : saving ? 'Sauvegarde...' : 'Sauver'}
                      </button>
                    </div>
                  </div>

                  <div className="whitespace-pre-line rounded-2xl bg-rose-50/70 p-5 text-lg font-bold leading-9 text-neutral-800">
                    {story.story_text}
                  </div>
                </article>
              )}
            </div>

            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <StarIcon className="h-5 w-5 text-red-500" />
                <h2 className="text-xl font-black">Historique</h2>
              </div>
              {history.length === 0 ? (
                <p className="text-sm font-bold text-neutral-500">Aucune histoire generee pour le moment.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {history.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStory(item)}
                      className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-left transition hover:border-red-200 hover:bg-red-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-black text-neutral-900">{item.title}</p>
                        {item.saved && (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-[11px] font-black text-green-700">Sauvee</span>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-bold text-neutral-500">{item.summary || item.story_text}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default KidsStoryStudio;
