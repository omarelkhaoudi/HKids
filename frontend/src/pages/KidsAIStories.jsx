import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { generatedStoriesAPI } from '../api/generatedStories';
import { speakText, stopSpeaking } from '../services/ai/browserTextToSpeech';
import { AudioIcon, BookIcon, ChevronLeftIcon, ClockIcon, HeartIcon, RefreshIcon, SearchIcon, SparklesIcon, TrashIcon } from '../components/Icons';
import { Logo } from '../components/Logo';

const filtersInitialState = {
  search: '',
  theme: '',
  language: '',
  saved: '',
  favorite: ''
};

function getErrorMessage(error) {
  return error.response?.data?.error || error.message || 'Action impossible pour le moment.';
}

function speechLanguage(language) {
  if (language === 'en') return 'en-US';
  if (language === 'ar') return 'ar-MA';
  return 'fr-FR';
}

function KidsAIStories() {
  const [kidProfiles, setKidProfiles] = useState([]);
  const [selectedKidProfileId, setSelectedKidProfileId] = useState('');
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [filters, setFilters] = useState(filtersInitialState);
  const [loading, setLoading] = useState(true);
  const [busyStoryId, setBusyStoryId] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');

  const selectedKid = kidProfiles.find((kid) => String(kid.id) === String(selectedKidProfileId));
  const themes = useMemo(() => (
    Array.from(new Set(stories.map((story) => story.theme).filter(Boolean))).sort()
  ), [stories]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const loadStories = async (kidProfileId = selectedKidProfileId, nextFilters = filters) => {
    if (!kidProfileId) return;
    setLoading(true);
    setError('');
    try {
      const response = await generatedStoriesAPI.getHistory({
        kid_profile_id: kidProfileId,
        search: nextFilters.search,
        theme: nextFilters.theme,
        language: nextFilters.language,
        saved: nextFilters.saved,
        favorite: nextFilters.favorite,
        limit: 100
      });
      const nextStories = response.data || [];
      setStories(nextStories);
      setSelectedStory((current) => {
        if (current && nextStories.some((item) => item.id === current.id)) {
          return nextStories.find((item) => item.id === current.id);
        }
        return nextStories[0] || null;
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    generatedStoriesAPI.getKidProfiles()
      .then((response) => {
        if (!active) return;
        const profiles = response.data || [];
        setKidProfiles(profiles);
        setSelectedKidProfileId(profiles[0]?.id || '');
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    if (selectedKidProfileId) loadStories(selectedKidProfileId, filters);
  }, [selectedKidProfileId]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadStories(selectedKidProfileId, filters);
  };

  const handleResetFilters = () => {
    setFilters(filtersInitialState);
    loadStories(selectedKidProfileId, filtersInitialState);
  };

  const patchStory = (nextStory) => {
    setStories((current) => current.map((story) => (story.id === nextStory.id ? nextStory : story)));
    setSelectedStory((current) => (current?.id === nextStory.id ? nextStory : current));
  };

  const handleRelire = async (story) => {
    setSelectedStory(story);
    setError('');
    if (!story?.story_text) return;
    setSpeaking(true);
    try {
      await speakText(`${story.title}. ${story.story_text}`, {
        language: speechLanguage(story.language)
      });
    } catch {
      // Reading the text on screen still works when system TTS is unavailable.
    } finally {
      setSpeaking(false);
    }
  };

  const handleFavorite = async (story) => {
    setBusyStoryId(story.id);
    setError('');
    try {
      const response = await generatedStoriesAPI.setFavorite(story.id, !story.favorite);
      patchStory(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyStoryId(null);
    }
  };

  const handleSave = async (story) => {
    if (story.saved) return;
    setBusyStoryId(story.id);
    setError('');
    try {
      const response = await generatedStoriesAPI.save(story.id);
      patchStory(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyStoryId(null);
    }
  };

  const handleNewVersion = async (story) => {
    setBusyStoryId(story.id);
    setError('');
    stopSpeaking();
    try {
      const response = await generatedStoriesAPI.createVersion(story.id);
      const nextStory = response.data;
      setStories((current) => [nextStory, ...current]);
      setSelectedStory(nextStory);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyStoryId(null);
    }
  };

  const handleDelete = async (story) => {
    if (!window.confirm('Supprimer cette histoire IA ?')) return;
    setBusyStoryId(story.id);
    setError('');
    try {
      await generatedStoriesAPI.delete(story.id);
      const nextStories = stories.filter((item) => item.id !== story.id);
      setStories(nextStories);
      setSelectedStory((current) => (current?.id === story.id ? nextStories[0] || null : current));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyStoryId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-rose-50 text-neutral-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link to="/kids" className="shrink-0">
            <Logo size="default" showText={true} />
          </Link>
          <Link
            to="/kids"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-neutral-800 shadow-md"
          >
            <ChevronLeftIcon className="h-5 w-5" />
            <span>Retour</span>
          </Link>
        </header>

        <section className="mb-6 rounded-[2rem] bg-gradient-to-br from-cyan-500 via-blue-500 to-violet-500 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-black">
                <SparklesIcon className="h-5 w-5" />
                <span>Le Lit Qui Lit</span>
              </div>
              <h1 className="text-4xl font-black leading-tight sm:text-5xl">Mes histoires IA</h1>
              <p className="mt-3 max-w-2xl text-base font-bold text-white/85">
                Retrouve, relis, garde et regenere tes histoires personnalisees.
              </p>
            </div>
            <Link
              to="/kids/story-studio"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-base font-black text-blue-700 shadow-lg transition hover:bg-blue-50"
            >
              <SparklesIcon className="h-5 w-5" />
              <span>Nouvelle histoire</span>
            </Link>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-blue-100 bg-white p-4 shadow-lg">
          <form onSubmit={handleSearchSubmit} className="grid gap-3 lg:grid-cols-[1.2fr_180px_150px_150px_150px_auto]">
            <label className="relative block">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
                className="h-12 w-full rounded-xl border-2 border-neutral-100 pl-11 pr-4 text-sm font-bold outline-none transition focus:border-blue-300"
                placeholder="Rechercher titre, resume, theme..."
              />
            </label>
            <select
              value={selectedKidProfileId}
              onChange={(event) => setSelectedKidProfileId(event.target.value)}
              className="h-12 rounded-xl border-2 border-neutral-100 px-3 text-sm font-bold outline-none focus:border-blue-300"
            >
              {kidProfiles.map((kid) => (
                <option key={kid.id} value={kid.id}>{kid.name}{kid.age ? ` - ${kid.age} ans` : ''}</option>
              ))}
            </select>
            <select
              value={filters.theme}
              onChange={(event) => updateFilter('theme', event.target.value)}
              className="h-12 rounded-xl border-2 border-neutral-100 px-3 text-sm font-bold outline-none focus:border-blue-300"
            >
              <option value="">Tous themes</option>
              {themes.map((theme) => <option key={theme} value={theme}>{theme}</option>)}
            </select>
            <select
              value={filters.saved}
              onChange={(event) => updateFilter('saved', event.target.value)}
              className="h-12 rounded-xl border-2 border-neutral-100 px-3 text-sm font-bold outline-none focus:border-blue-300"
            >
              <option value="">Tous statuts</option>
              <option value="true">Sauvees</option>
              <option value="false">Non sauvees</option>
            </select>
            <select
              value={filters.favorite}
              onChange={(event) => updateFilter('favorite', event.target.value)}
              className="h-12 rounded-xl border-2 border-neutral-100 px-3 text-sm font-bold outline-none focus:border-blue-300"
            >
              <option value="">Tous favoris</option>
              <option value="true">Favoris</option>
              <option value="false">Non favoris</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="h-12 rounded-xl bg-neutral-900 px-4 text-sm font-black text-white">
                Filtrer
              </button>
              <button type="button" onClick={handleResetFilters} className="h-12 rounded-xl bg-neutral-100 px-4 text-sm font-black text-neutral-700">
                Reset
              </button>
            </div>
          </form>
        </section>

        {error && (
          <div className="mb-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
            {error}
          </div>
        )}

        <main className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="space-y-3">
            {loading ? (
              <div className="rounded-2xl bg-white p-5 text-sm font-bold text-neutral-500 shadow">Chargement...</div>
            ) : stories.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center shadow">
                <BookIcon className="mx-auto mb-3 h-10 w-10 text-blue-500" />
                <p className="font-black">Aucune histoire IA</p>
                <p className="mt-1 text-sm font-bold text-neutral-500">Cree ta premiere histoire personnalisee.</p>
              </div>
            ) : stories.map((story) => (
              <article
                key={story.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
                  selectedStory?.id === story.id ? 'border-blue-300 ring-2 ring-blue-100' : 'border-neutral-100 hover:border-blue-200'
                }`}
              >
                <button type="button" onClick={() => setSelectedStory(story)} className="block w-full text-left">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-black leading-snug text-neutral-900">{story.title}</h2>
                    <HeartIcon className={`h-5 w-5 shrink-0 ${story.favorite ? 'text-rose-500' : 'text-neutral-300'}`} filled={story.favorite} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-bold text-neutral-500">{story.summary || story.story_text}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black">
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">{story.theme || 'theme'}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{story.language?.toUpperCase() || 'FR'}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-rose-700">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {story.estimated_duration_minutes} min
                    </span>
                    {story.version_number > 1 && (
                      <span className="rounded-full bg-violet-50 px-2 py-1 text-violet-700">v{story.version_number}</span>
                    )}
                  </div>
                </button>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={() => handleRelire(story)} className="rounded-xl bg-neutral-900 px-3 py-2 text-xs font-black text-white">
                    Relire
                  </button>
                  <button onClick={() => handleNewVersion(story)} disabled={busyStoryId === story.id} className="rounded-xl bg-blue-500 px-3 py-2 text-xs font-black text-white disabled:opacity-60">
                    Nouvelle version
                  </button>
                  <button onClick={() => handleFavorite(story)} disabled={busyStoryId === story.id} className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 disabled:opacity-60">
                    {story.favorite ? 'Retirer favori' : 'Favori'}
                  </button>
                  <button onClick={() => handleDelete(story)} disabled={busyStoryId === story.id} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-60">
                    Supprimer
                  </button>
                </div>
              </article>
            ))}
          </section>

          <section className="min-h-[520px] rounded-2xl border border-blue-100 bg-white p-5 shadow-lg">
            {!selectedStory ? (
              <div className="grid min-h-[420px] place-items-center text-center">
                <div>
                  <BookIcon className="mx-auto mb-3 h-12 w-12 text-blue-500" />
                  <p className="text-xl font-black">Choisis une histoire</p>
                </div>
              </div>
            ) : (
              <article>
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-3xl font-black">{selectedStory.title}</h2>
                    <p className="mt-2 text-sm font-bold text-neutral-500">{selectedStory.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{selectedStory.theme}</span>
                      <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">{selectedStory.age_level || 'niveau'}</span>
                      {selectedStory.saved && <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">Sauvee</span>}
                      {selectedStory.favorite && <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">Favorite</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleRelire(selectedStory)} disabled={speaking} className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
                      <AudioIcon className="h-5 w-5" />
                      {speaking ? 'Lecture...' : 'Relire'}
                    </button>
                    <button onClick={() => handleSave(selectedStory)} disabled={selectedStory.saved || busyStoryId === selectedStory.id} className="rounded-xl bg-green-500 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
                      {selectedStory.saved ? 'Sauvee' : 'Sauver'}
                    </button>
                    <button onClick={() => handleFavorite(selectedStory)} disabled={busyStoryId === selectedStory.id} className="rounded-xl bg-rose-500 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
                      {selectedStory.favorite ? 'Retirer' : 'Favori'}
                    </button>
                    <button onClick={() => handleNewVersion(selectedStory)} disabled={busyStoryId === selectedStory.id} className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
                      <RefreshIcon className="h-5 w-5" />
                      Nouvelle version
                    </button>
                    <button onClick={() => handleDelete(selectedStory)} disabled={busyStoryId === selectedStory.id} className="rounded-xl bg-red-50 px-4 py-3 text-sm font-black text-red-700 disabled:opacity-60" aria-label="Supprimer">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="whitespace-pre-line rounded-2xl bg-blue-50/70 p-5 text-lg font-bold leading-9 text-neutral-800">
                  {selectedStory.story_text}
                </div>
              </article>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default KidsAIStories;
