import {useEffect, useMemo, useState} from 'react';
import {Link, Navigate, useParams} from 'react-router-dom';
import {booksAPI} from '../api/books';
import {ContentCard} from '../components/content/ContentCard';
import {ContentFilters} from '../components/content/ContentFilters';
import {AudioPlayer} from '../components/audio/AudioPlayer';
import {Logo} from '../components/Logo';
import {ChevronLeftIcon} from '../components/Icons';
import {getContentLibraryCategory} from '../constants/contentLibrary';
import {filterContentItems, normalizeContentItem} from '../utils/contentLibrary';
import {useAudioPlayer} from '../hooks/useAudioPlayer';
import {storage} from '../utils/storage';
import {useLanguage} from '../context/LanguageContext';

const defaultFilters = {
 search: '',
 category: '',
 age: '',
 language: '',
};

function ContentCategoryContents() {
 const {categoryId} = useParams();
 const {language, isRtl} = useLanguage();
 const category = getContentLibraryCategory(categoryId, language);
 const [contents, setContents] = useState([]);
 const [filters, setFilters] = useState(() => ({...defaultFilters, language}));
 const [loading, setLoading] = useState(true);
 const audioPlayer = useAudioPlayer();

 useEffect(() => {
 if (category) {
 setFilters((current) => ({...current, language}));
 loadContents();
}
}, [categoryId, language]);

 const loadContents = async () => {
 try {
 setLoading(true);
 const response = await booksAPI.getPublishedBooks({language});
 setContents((response.data || []).map(normalizeContentItem));
} catch (error) {
 console.error('Error loading category contents:', error);
 setContents([]);
} finally {
 setLoading(false);
}
};

 const visibleContents = useMemo(
 () => filterContentItems(contents, filters, category),
 [contents, filters, category]
 );

 const toggleAudio = (content) => {
 if (!content.audio_url) return;
 audioPlayer.toggle(content);
 storage.addToHistory(content.id, content.title, 0);
};

 if (!category) {
 return <Navigate to="/content-library" replace />;
}

 return (
 <div className="min-h-screen bg-gradient-to-br from-surface-50 to-primary-50/40 dark:from-surface-900 dark:to-surface-800" dir={isRtl ? 'rtl' : 'ltr'}>
 <div className="mx-auto max-w-7xl px-4 py-8 pb-36 sm:px-6 lg:px-8">
 <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <Link to="/">
 <Logo size="default" showText={true} />
 </Link>
 <Link
 to="/content-library"
 className="inline-flex min-h-12 items-center justify-center gap-2 rounded-3xl bg-card px-5 py-3 font-black text-foreground shadow-sm transition hover:bg-surface-secondary"
 >
 <ChevronLeftIcon className="h-5 w-5" />
 <span>Bibliotheque</span>
 </Link>
 </header>

 <section className={`mb-6 rounded-2xl bg-gradient-to-br ${category.gradient} p-6 text-white shadow-lg`}>
 <span className="grid h-20 w-20 place-items-center rounded-2xl bg-card/20 text-5xl backdrop-blur">
 {category.pictogram}
 </span>
 <h1 className="mt-5 text-4xl font-black">{category.label}</h1>
 <p className="mt-2 max-w-xl font-semibold text-white/85">{category.description}</p>
 </section>

 <ContentFilters
 filters={filters}
 onChange={setFilters}
 showCategory={false}
 />

 <section className="mt-6">
 <div className="mb-4 flex items-center justify-between gap-3">
 <h2 className="text-xl font-black text-foreground">
 Contenus
 </h2>
 <span className="rounded-full bg-card px-4 py-2 text-sm font-bold text-foreground-secondary shadow-sm">
 {visibleContents.length}
 </span>
 </div>

 {loading ? (
 <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
 {Array.from({length: 4}).map((_, index) => (
 <div key={index} className="h-72 animate-pulse rounded-3xl bg-card" />
 ))}
 </div>
 ) : visibleContents.length === 0 ? (
 <div className="rounded-3xl bg-card p-10 text-center font-bold text-foreground-muted shadow-sm">
 Aucun contenu
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
 {visibleContents.map((content) => (
 <ContentCard
 key={content.id}
 content={content}
 playing={audioPlayer.activeBook?.id === content.id && audioPlayer.playing}
 onToggleAudio={toggleAudio}
 />
 ))}
 </div>
 )}
 </section>
 </div>

 <AudioPlayer
 book={audioPlayer.activeBook}
 playing={audioPlayer.playing}
 loading={audioPlayer.loading}
 currentTime={audioPlayer.currentTime}
 duration={audioPlayer.duration}
 volume={audioPlayer.volume}
 favorite={audioPlayer.activeBook ? storage.isFavorite(audioPlayer.activeBook.id) : false}
 error={audioPlayer.error}
 onTogglePlay={() => {
 if (audioPlayer.playing) {
 audioPlayer.pause();
} else if (audioPlayer.activeBook) {
 audioPlayer.play(audioPlayer.activeBook);
}
}}
 onSeekBy={audioPlayer.seekBy}
 onSeekTo={audioPlayer.seekTo}
 onVolumeChange={audioPlayer.setVolume}
 onToggleFavorite={() => {
 if (!audioPlayer.activeBook) return;
 if (storage.isFavorite(audioPlayer.activeBook.id)) {
 storage.removeFavorite(audioPlayer.activeBook.id);
} else {
 storage.addFavorite(audioPlayer.activeBook.id);
}
 setContents((current) => [...current]);
}}
 onClose={audioPlayer.stop}
 />
 </div>
 );
}

export default ContentCategoryContents;
