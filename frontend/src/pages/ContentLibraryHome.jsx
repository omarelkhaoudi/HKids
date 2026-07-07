import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {motion} from 'framer-motion';
import {booksAPI} from '../api/books';
import {ContentCategoryCard} from '../components/content/ContentCategoryCard';
import {ContentFilters} from '../components/content/ContentFilters';
import {ContentCard} from '../components/content/ContentCard';
import {AudioPlayer} from '../components/audio/AudioPlayer';
import {Logo} from '../components/Logo';
import {CONTENT_LIBRARY_CATEGORIES} from '../constants/contentLibrary';
import {filterContentItems, normalizeContentItem} from '../utils/contentLibrary';
import {useAudioPlayer} from '../hooks/useAudioPlayer';
import {storage} from '../utils/storage';

const defaultFilters = {
 search: '',
 category: '',
 age: '',
 language: '',
};

function ContentLibraryHome() {
 const [contents, setContents] = useState([]);
 const [filters, setFilters] = useState(defaultFilters);
 const [loading, setLoading] = useState(true);
 const audioPlayer = useAudioPlayer();

 useEffect(() => {
 loadContents();
}, []);

 const loadContents = async () => {
 try {
 setLoading(true);
 const response = await booksAPI.getPublishedBooks();
 setContents((response.data || []).map(normalizeContentItem));
} catch (error) {
 console.error('Error loading content library:', error);
 setContents([]);
} finally {
 setLoading(false);
}
};

 const categoryCounts = useMemo(() => {
 return CONTENT_LIBRARY_CATEGORIES.reduce((acc, category) => {
 acc[category.id] = contents.filter((content) =>
 category.contentTypes.includes(content.content_type || 'story')
 ).length;
 return acc;
}, {});
}, [contents]);

 const selectedCategory = CONTENT_LIBRARY_CATEGORIES.find((category) => category.id === filters.category) || null;
 const visibleContents = useMemo(
 () => filterContentItems(contents, filters, selectedCategory).slice(0, 8),
 [contents, filters, selectedCategory]
 );

 const toggleAudio = (content) => {
 if (!content.audio_url) return;
 audioPlayer.toggle(content);
 storage.addToHistory(content.id, content.title, 0);
};

 return (
 <div className="min-h-screen bg-gradient-to-br from-surface-50 to-primary-50/40 dark:from-surface-900 dark:to-surface-800">
 <div className="mx-auto max-w-7xl px-4 py-8 pb-36 sm:px-6 lg:px-8">
 <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <Link to="/">
 <Logo size="default" showText={true} />
 </Link>
 <Link
 to="/kids"
 className="inline-flex min-h-12 items-center justify-center rounded-3xl bg-surface-900 px-5 py-3 font-black text-white shadow-md transition hover:bg-surface-800"
 >
 Espace enfant
 </Link>
 </header>

 <section className="mb-6 rounded-2xl bg-card p-6 shadow-sm">
 <p className="text-sm font-black uppercase text-foreground-500">Le Lit Qui Lit</p>
 <h1 className="mt-2 text-3xl font-black text-foreground sm:text-4xl">
 Bibliotheque de contenus
 </h1>
 </section>

 <section className="mb-6">
 <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
 {CONTENT_LIBRARY_CATEGORIES.map((category) => (
 <ContentCategoryCard
 key={category.id}
 category={category}
 count={categoryCounts[category.id] || 0}
 />
 ))}
 </div>
 </section>

 <ContentFilters filters={filters} onChange={setFilters} />

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
 <motion.div
 initial={{opacity: 0}}
 animate={{opacity: 1}}
 className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
 >
 {visibleContents.map((content) => (
 <ContentCard
 key={content.id}
 content={content}
 playing={audioPlayer.activeBook?.id === content.id && audioPlayer.playing}
 onToggleAudio={toggleAudio}
 />
 ))}
 </motion.div>
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

export default ContentLibraryHome;
