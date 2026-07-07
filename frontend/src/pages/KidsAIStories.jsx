import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {generatedStoriesAPI} from '../api/generatedStories';
import {speakText, stopSpeaking} from '../services/ai/browserTextToSpeech';
import {useOfflineContent} from '../hooks/useOfflineContent';
import {getDownloads, offlineContentIds} from '../services/offline/offlineContentService';
import {queueOfflineMutation} from '../services/offline/offlineSyncService';
import {AudioIcon, BookIcon, ChevronLeftIcon, ClockIcon, DownloadIcon, HeartIcon, HistoryIcon, RefreshIcon, SearchIcon, SparklesIcon, TrashIcon} from '../components/Icons';
import {Logo} from '../components/Logo';
import {VoiceAssistant} from '../components/kids/VoiceAssistant';

const filtersInitialState = {
 search: '',
 theme: '',
 language: '',
 age_level: '',
 educational_value: '',
 saved: '',
 favorite: ''
};

const collectionTabs = [
 {
 id: 'library',
 label: 'Bibliotheque',
 description: 'Histoires sauvegardees',
 icon: BookIcon
},
 {
 id: 'history',
 label: 'Historique',
 description: 'Toutes les generations',
 icon: HistoryIcon
}
];

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
 const [activeCollection, setActiveCollection] = useState('library');
 const [loading, setLoading] = useState(true);
 const [busyStoryId, setBusyStoryId] = useState(null);
 const [speaking, setSpeaking] = useState(false);
 const [error, setError] = useState('');
 const offlineContent = useOfflineContent();

 const selectedKid = kidProfiles.find((kid) => String(kid.id) === String(selectedKidProfileId));
 const themes = useMemo(() => (
 Array.from(new Set(stories.map((story) => story.theme).filter(Boolean))).sort()
 ), [stories]);
 const languages = useMemo(() => (
 Array.from(new Set(stories.map((story) => story.language).filter(Boolean))).sort()
 ), [stories]);
 const ageLevels = useMemo(() => (
 Array.from(new Set(stories.map((story) => story.age_level).filter(Boolean))).sort()
 ), [stories]);
 const educationalValues = useMemo(() => (
 Array.from(new Set(stories.map((story) => story.educational_value).filter(Boolean))).sort()
 ), [stories]);
 const favoriteStoriesCount = stories.filter((story) => story.favorite).length;

 const updateFilter = (key, value) => {
 setFilters((current) => ({...current, [key]: value}));
};

 const loadStories = async (
 kidProfileId = selectedKidProfileId,
 nextFilters = filters,
 collection = activeCollection
 ) => {
 if (!kidProfileId) return;
 setLoading(true);
 setError('');
 try {
 const savedFilter = collection === 'library' ? 'true' : nextFilters.saved;
 const response = await generatedStoriesAPI.getHistory({
 kid_profile_id: kidProfileId,
 search: nextFilters.search,
 theme: nextFilters.theme,
 language: nextFilters.language,
 age_level: nextFilters.age_level,
 educational_value: nextFilters.educational_value,
 saved: savedFilter,
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
 if (!navigator.onLine) {
 const downloads = await getDownloads();
 const offlineStories = downloads
 .filter((item) => item.type === 'generated-story' && item.status === 'downloaded')
 .map((item) => item.payload);
 setStories(offlineStories);
 setSelectedStory(offlineStories[0] || null);
 setError('Mode hors connexion: histoires telechargees uniquement.');
} else {
 setError(getErrorMessage(err));
}
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
 if (selectedKidProfileId) loadStories(selectedKidProfileId, filters, activeCollection);
}, [selectedKidProfileId]);

 const handleSearchSubmit = (event) => {
 event.preventDefault();
 loadStories(selectedKidProfileId, filters, activeCollection);
};

 const handleResetFilters = () => {
 setFilters(filtersInitialState);
 loadStories(selectedKidProfileId, filtersInitialState, activeCollection);
};

 const handleCollectionChange = (collection) => {
 setActiveCollection(collection);
 setSelectedStory(null);
 loadStories(selectedKidProfileId, filters, collection);
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
 if (!navigator.onLine) {
 queueOfflineMutation('generated_story_favorite', {storyId: story.id, favorite: !story.favorite}, `generated-story:${story.id}:favorite`);
 patchStory({...story, favorite: !story.favorite});
 return;
}
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
 if (!navigator.onLine) {
 queueOfflineMutation('generated_story_save', {storyId: story.id}, `generated-story:${story.id}:save`);
 patchStory({...story, saved: true});
 return;
}
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

 const handleDownloadStory = async (story) => {
 setBusyStoryId(story.id);
 setError('');
 try {
 await offlineContent.saveStoryContent(story);
} catch (err) {
 setError(getErrorMessage(err));
} finally {
 setBusyStoryId(null);
}
};

 const handleRemoveStoryDownload = async (story) => {
 setBusyStoryId(story.id);
 setError('');
 try {
 await offlineContent.deleteDownload(offlineContentIds.generatedStory(story.id));
} catch (err) {
 setError(getErrorMessage(err));
} finally {
 setBusyStoryId(null);
}
};

 return (
 <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-rose-50 text-foreground">
 <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
 <header className="mb-6 flex items-center justify-between gap-4">
 <Link to="/kids" className="shrink-0">
 <Logo size="default" showText={true} />
 </Link>
 <Link
 to="/kids"
 className="inline-flex items-center gap-2 rounded-2xl bg-card px-4 py-3 text-sm font-black text-foreground shadow-md"
 >
 <ChevronLeftIcon className="h-5 w-5" />
 <span>Retour</span>
 </Link>
 </header>

 <section className="mb-6 rounded-[2rem] bg-gradient-to-br from-cyan-500 via-primary-500 to-violet-500 p-6 text-white shadow-xl">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 <div>
 <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-card/20 px-4 py-2 text-sm font-black">
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
 className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-card px-5 py-3 text-base font-black text-foreground-700 shadow-lg transition hover:bg-primary-50"
 >
 <SparklesIcon className="h-5 w-5" />
 <span>Nouvelle histoire</span>
 </Link>
 </div>
 </section>

 <section className="mb-6 grid gap-3 md:grid-cols-2">
 {collectionTabs.map((tab) => {
 const Icon = tab.icon;
 const active = activeCollection === tab.id;
 return (
 <button
 key={tab.id}
 type="button"
 onClick={() => handleCollectionChange(tab.id)}
 className={`flex min-h-24 items-center justify-between gap-4 rounded-2xl border-2 p-5 text-left shadow-sm transition ${
 active
 ? 'border-primary-400 bg-primary-600 text-white shadow-lg'
 : 'border-border bg-card text-foreground hover:border-primary-200'
}`}
 >
 <span className="flex items-center gap-4">
 <span className={`grid h-12 w-12 place-items-center rounded-2xl ${active ? 'bg-card/20' : 'bg-primary-50 text-foreground-600'}`}>
 <Icon className="h-6 w-6" />
 </span>
 <span>
 <span className="block text-xl font-black">{tab.label}</span>
 <span className={`mt-1 block text-sm font-bold ${active ? 'text-white/80' : 'text-foreground-muted'}`}>
 {tab.description}
 </span>
 </span>
 </span>
 {active && (
 <span className="rounded-full bg-card px-3 py-1 text-sm font-black text-foreground-700">
 {stories.length}
 </span>
 )}
 </button>
 );
})}
 </section>

 <section className="mb-6 rounded-2xl border border-primary-100 bg-card p-4 shadow-lg">
 <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
 <div>
 <h2 className="text-xl font-black text-foreground">
 {activeCollection === 'library' ? 'Filtres de la bibliotheque' : 'Filtres de l historique'}
 </h2>
 <p className="mt-1 text-sm font-bold text-foreground-muted">
 {stories.length} histoire{stories.length > 1 ? 's' : ''} affichee{stories.length > 1 ? 's' : ''} - {favoriteStoriesCount} favori{favoriteStoriesCount > 1 ? 's' : ''}
 </p>
 </div>
 {activeCollection === 'library' && (
 <span className="rounded-full bg-green-50 px-3 py-2 text-xs font-black text-green-700">
 Sauvegardees uniquement
 </span>
 )}
 </div>

 <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 xl:grid-cols-4">
 <label className="relative block min-w-0 md:col-span-2">
 <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
 <input
 value={filters.search}
 onChange={(event) => updateFilter('search', event.target.value)}
 className="h-12 w-full rounded-3xl border-2 border-border pl-11 pr-4 text-sm font-bold outline-none transition focus:border-primary-300"
 placeholder="Rechercher titre, resume, theme..."
 />
 </label>
 <select
 value={selectedKidProfileId}
 onChange={(event) => setSelectedKidProfileId(event.target.value)}
 className="h-12 w-full min-w-0 rounded-3xl border-2 border-border px-3 text-sm font-bold outline-none focus:border-primary-300"
 >
 {kidProfiles.map((kid) => (
 <option key={kid.id} value={kid.id}>{kid.name}{kid.age ? ` - ${kid.age} ans` : ''}</option>
 ))}
 </select>
 <select
 value={filters.theme}
 onChange={(event) => updateFilter('theme', event.target.value)}
 className="h-12 w-full min-w-0 rounded-3xl border-2 border-border px-3 text-sm font-bold outline-none focus:border-primary-300"
 >
 <option value="">Tous themes</option>
 {themes.map((theme) => <option key={theme} value={theme}>{theme}</option>)}
 </select>
 <select
 value={filters.language}
 onChange={(event) => updateFilter('language', event.target.value)}
 className="h-12 w-full min-w-0 rounded-3xl border-2 border-border px-3 text-sm font-bold outline-none focus:border-primary-300"
 >
 <option value="">Toutes langues</option>
 {languages.map((language) => (
 <option key={language} value={language}>{language.toUpperCase()}</option>
 ))}
 </select>
 <select
 value={filters.age_level}
 onChange={(event) => updateFilter('age_level', event.target.value)}
 className="h-12 w-full min-w-0 rounded-3xl border-2 border-border px-3 text-sm font-bold outline-none focus:border-primary-300"
 >
 <option value="">Tous ages</option>
 {ageLevels.map((ageLevel) => <option key={ageLevel} value={ageLevel}>{ageLevel}</option>)}
 </select>
 <select
 value={filters.educational_value}
 onChange={(event) => updateFilter('educational_value', event.target.value)}
 className="h-12 w-full min-w-0 rounded-3xl border-2 border-border px-3 text-sm font-bold outline-none focus:border-primary-300"
 >
 <option value="">Toutes valeurs</option>
 {educationalValues.map((value) => <option key={value} value={value}>{value}</option>)}
 </select>
 <select
 value={filters.saved}
 onChange={(event) => updateFilter('saved', event.target.value)}
 disabled={activeCollection === 'library'}
 className="h-12 w-full min-w-0 rounded-3xl border-2 border-border px-3 text-sm font-bold outline-none focus:border-primary-300 disabled:bg-surface-secondary disabled:text-surface-400"
 >
 <option value="">Tous statuts</option>
 <option value="true">Sauvees</option>
 <option value="false">Non sauvees</option>
 </select>
 <select
 value={filters.favorite}
 onChange={(event) => updateFilter('favorite', event.target.value)}
 className="h-12 w-full min-w-0 rounded-3xl border-2 border-border px-3 text-sm font-bold outline-none focus:border-primary-300"
 >
 <option value="">Tous favoris</option>
 <option value="true">Favoris</option>
 <option value="false">Non favoris</option>
 </select>
 <div className="flex w-full gap-2 md:col-span-2 xl:col-span-4">
 <button type="submit" className="h-12 min-w-28 rounded-3xl bg-surface-900 px-4 text-sm font-black text-white">
 Filtrer
 </button>
 <button type="button" onClick={handleResetFilters} className="h-12 min-w-24 rounded-3xl bg-surface-secondary px-4 text-sm font-black text-foreground-secondary">
 Reset
 </button>
 </div>
 </form>
 </section>

 {error && (
 <div className="mb-6 rounded-2xl bg-accent-50 px-4 py-3 text-sm font-bold text-accent-800">
 {error}
 </div>
 )}

 <main className="grid gap-6 lg:grid-cols-[420px_1fr]">
 <section className="space-y-3">
 {loading ? (
 <div className="rounded-2xl bg-card p-5 text-sm font-bold text-foreground-muted shadow">Chargement...</div>
 ) : stories.length === 0 ? (
 <div className="rounded-2xl bg-card p-6 text-center shadow">
 <BookIcon className="mx-auto mb-3 h-10 w-10 text-foreground-500" />
 <p className="font-black">Aucune histoire IA</p>
 <p className="mt-1 text-sm font-bold text-foreground-muted">Cree ta premiere histoire personnalisee.</p>
 </div>
 ) : stories.map((story) => (
 (() => {
 const offlineRecord = offlineContent.getStoryStatus(story.id);
 const offlineReady = offlineRecord?.status === 'downloaded';
 return (
 <article
 key={story.id}
 className={`rounded-2xl border bg-card p-4 shadow-sm transition ${
 selectedStory?.id === story.id ? 'border-primary-300 ring-2 ring-primary-100' : 'border-border hover:border-primary-200'
}`}
 >
 <button type="button" onClick={() => setSelectedStory(story)} className="block w-full text-left">
 <div className="flex items-start justify-between gap-3">
 <h2 className="text-base font-black leading-snug text-foreground">{story.title}</h2>
 <HeartIcon className={`h-5 w-5 shrink-0 ${story.favorite ? 'text-rose-500' : 'text-surface-300'}`} filled={story.favorite} />
 </div>
 <p className="mt-2 line-clamp-2 text-sm font-bold text-foreground-muted">{story.summary || story.story_text}</p>
 <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black">
 <span className="rounded-full bg-primary-50 px-2 py-1 text-foreground-700">{story.theme || 'theme'}</span>
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
 <button onClick={() => handleRelire(story)} className="rounded-3xl bg-surface-900 px-3 py-2 text-xs font-black text-white">
 Relire
 </button>
 <button onClick={() => handleNewVersion(story)} disabled={busyStoryId === story.id} className="rounded-3xl bg-primary-500 px-3 py-2 text-xs font-black text-white disabled:opacity-60">
 Nouvelle version
 </button>
 <button onClick={() => handleFavorite(story)} disabled={busyStoryId === story.id} className="rounded-3xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 disabled:opacity-60">
 {story.favorite ? 'Retirer favori' : 'Favori'}
 </button>
 <button onClick={() => handleDelete(story)} disabled={busyStoryId === story.id} className="rounded-3xl bg-primary-50 px-3 py-2 text-xs font-black text-foreground-700 disabled:opacity-60">
 Supprimer
 </button>
 <button
 onClick={() => offlineReady ? handleRemoveStoryDownload(story) : handleDownloadStory(story)}
 disabled={busyStoryId === story.id}
 className={`col-span-2 inline-flex items-center justify-center gap-2 rounded-3xl px-3 py-2 text-xs font-black disabled:opacity-60 ${
 offlineReady ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-secondary text-foreground-secondary'
}`}
 >
 <DownloadIcon className="h-4 w-4" />
 {offlineReady ? 'Telecharge - retirer' : 'Telecharger hors connexion'}
 </button>
 </div>
 </article>
 );
})()
 ))}
 </section>

 <section className="min-h-[520px] rounded-2xl border border-primary-100 bg-card p-5 shadow-lg">
 {!selectedStory ? (
 <div className="grid min-h-[420px] place-items-center text-center">
 <div>
 <BookIcon className="mx-auto mb-3 h-12 w-12 text-foreground-500" />
 <p className="text-xl font-black">Choisis une histoire</p>
 </div>
 </div>
 ) : (
 <article>
 <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
 <div>
 <h2 className="text-3xl font-black">{selectedStory.title}</h2>
 <p className="mt-2 text-sm font-bold text-foreground-muted">{selectedStory.summary}</p>
 <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
 <span className="rounded-full bg-primary-50 px-3 py-1 text-foreground-700">{selectedStory.theme}</span>
 <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">{selectedStory.age_level || 'niveau'}</span>
 {selectedStory.saved && <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">Sauvee</span>}
 {selectedStory.favorite && <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">Favorite</span>}
 </div>
 </div>
 <div className="flex flex-wrap gap-2">
 <button onClick={() => handleRelire(selectedStory)} disabled={speaking} className="inline-flex items-center gap-2 rounded-3xl bg-surface-900 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
 <AudioIcon className="h-5 w-5" />
 {speaking ? 'Lecture...' : 'Relire'}
 </button>
 <button onClick={() => handleSave(selectedStory)} disabled={selectedStory.saved || busyStoryId === selectedStory.id} className="rounded-3xl bg-green-500 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
 {selectedStory.saved ? 'Sauvee' : 'Sauver'}
 </button>
 <button onClick={() => handleFavorite(selectedStory)} disabled={busyStoryId === selectedStory.id} className="rounded-3xl bg-rose-500 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
 {selectedStory.favorite ? 'Retirer' : 'Favori'}
 </button>
 <button onClick={() => handleNewVersion(selectedStory)} disabled={busyStoryId === selectedStory.id} className="inline-flex items-center gap-2 rounded-3xl bg-primary-500 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
 <RefreshIcon className="h-5 w-5" />
 Nouvelle version
 </button>
 <button onClick={() => handleDelete(selectedStory)} disabled={busyStoryId === selectedStory.id} className="rounded-3xl bg-primary-50 px-4 py-3 text-sm font-black text-foreground-700 disabled:opacity-60" aria-label="Supprimer">
 <TrashIcon className="h-5 w-5" />
 </button>
 <button
 onClick={() => offlineContent.getStoryStatus(selectedStory.id)?.status === 'downloaded' ? handleRemoveStoryDownload(selectedStory) : handleDownloadStory(selectedStory)}
 disabled={busyStoryId === selectedStory.id}
 className="inline-flex items-center gap-2 rounded-3xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 disabled:opacity-60"
 >
 <DownloadIcon className="h-5 w-5" />
 {offlineContent.getStoryStatus(selectedStory.id)?.status === 'downloaded' ? 'Retirer offline' : 'Telecharger'}
 </button>
 </div>
 </div>

 <div className="whitespace-pre-line rounded-2xl bg-primary-50/70 p-5 text-lg font-bold leading-9 text-foreground">
 {selectedStory.story_text}
 </div>
 </article>
 )}
 </section>
 </main>
 </div>
 <VoiceAssistant />
 </div>
 );
}

export default KidsAIStories;
