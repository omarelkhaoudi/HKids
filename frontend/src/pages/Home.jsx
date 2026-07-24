import {useState, useEffect} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {booksAPI, categoriesAPI} from '../api/books';
import {newsletterAPI} from '../api/newsletter';
import {storage} from '../utils/storage';
import {useToast} from '../components/ToastProvider';
import {BookGridSkeleton} from '../components/SkeletonLoader';
import {
 BookIcon, SearchIcon, HeartIcon, HistoryIcon, 
 MoonIcon, SunIcon, LockIcon, GridIcon, ListIcon, XIcon,
 CategoryIcon, StarIcon, ChildIcon, PaletteIcon, SparklesIcon,
 AudioIcon, MicrophoneIcon, TheaterIcon, FontIcon, RulerIcon, VolumeIcon,
 ChevronRightIcon, UserIcon, ComputerIcon, TabletIcon, SmartphoneIcon,
 FacebookIcon, InstagramIcon, WhatsAppIcon, TwitterIcon, YouTubeIcon, LinkedInIcon,
 ClockIcon, BrainIcon, GraduationIcon, LanguageIcon
} from '../components/Icons';
import {Logo} from '../components/Logo';
import LibraryMenu from '../components/LibraryMenu';
import LanguageSelector from '../components/LanguageSelector';
import {useLanguage} from '../context/LanguageContext';
import {translations} from '../utils/translations';
import {
 AGE_GROUPS,
 ALL_AGES_ID,
 bookOverlapsAgeGroup,
 getAgeGroupById,
 parseAgeGroupId,
} from '../constants/ageGroups';

import HeroSection from '../components/home/HeroSection';
import BookOfTheWeekSection from '../components/home/BookOfTheWeekSection';
import BrowseByAgeSection from '../components/home/BrowseByAgeSection';
import StoryPreviewSection from '../components/home/StoryPreviewSection';
import FeaturesSection from '../components/home/FeaturesSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import NewsletterSection from '../components/home/NewsletterSection';
import FooterSection from '../components/home/FooterSection';
const HOME_DATA_CACHE_KEY = 'hkids_home_data_cache_v2';
const HOME_DATA_CACHE_TTL_MS = 10 * 60 * 1000;
const FALLBACK_BOOK_COUNT = 12;

const readHomeDataCache = (language = 'fr') => {
 try {
 const rawCache = localStorage.getItem(HOME_DATA_CACHE_KEY);
 if (!rawCache) return null;

 const cache = JSON.parse(rawCache);
 if (!cache?.cachedAt || cache.language !== language || Date.now() - cache.cachedAt > HOME_DATA_CACHE_TTL_MS) {
 return null;
}

 return {
 books: Array.isArray(cache.books) ? cache.books : [],
 categories: Array.isArray(cache.categories) ? cache.categories : [],
};
} catch (error) {
 return null;
}
};

const writeHomeDataCache = (books, categories, language = 'fr') => {
 try {
 localStorage.setItem(
 HOME_DATA_CACHE_KEY,
 JSON.stringify({books, categories, language, cachedAt: Date.now()})
 );
} catch (error) {
 // Optional cache only; API data stays the source of truth.
}
};

function Home({darkMode, setDarkMode}) {
 const navigate = useNavigate();
 const [searchParams, setSearchParams] = useSearchParams();
 const {language} = useLanguage();
 const t = translations[language];
 const [books, setBooks] = useState([]);
 const [allBooks, setAllBooks] = useState([]); // Tous les livres pour la recherche
 const [categories, setCategories] = useState([]);
 const [selectedCategory, setSelectedCategory] = useState('');
 const [selectedAge, setSelectedAge] = useState(() => {
   const fromUrl = parseAgeGroupId(searchParams.get('age'));
   return fromUrl === ALL_AGES_ID ? '' : fromUrl;
 });
 const [searchQuery, setSearchQuery] = useState('');
 const [sortBy, setSortBy] = useState('recent'); // recent, title, author
 const [viewMode, setViewMode] = useState('grid'); // grid, list
 const [loading, setLoading] = useState(true);
 const [favoritesUpdate, setFavoritesUpdate] = useState(0); // Pour forcer le re-render
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const [newsletterEmail, setNewsletterEmail] = useState('');
 const [newsletterStatus, setNewsletterStatus] = useState('');
 const [newsletterLoading, setNewsletterLoading] = useState(false);
 const {showToast} = useToast();

 // Fonction pour obtenir une couleur basée sur la catégorie
 const getCategoryColor = (categoryName, index) => {
 const colorMap = {
 'Nature': '#4CAF50',
 'Aventure': '#FF6B9D',
 'Animaux': '#FFA500',
 'Espace': '#1a1a2e',
 'Fiction': '#9C27B0',
 'Educational': '#2196F3',
};
 
 if (categoryName && colorMap[categoryName]) {
 return colorMap[categoryName];
}
 
 // Couleurs par défaut basées sur l'index si pas de catégorie
 const defaultColors = [
 '#FF6B9D', // Rose
 '#4CAF50', // Vert
 '#1a1a2e', // Bleu foncé
 '#FFA500', // Orange
 '#9C27B0', // Violet
 '#2196F3', // Bleu
 '#E91E63', // Rose foncé
 '#00BCD4', // Cyan
 ];
 
 return defaultColors[index % defaultColors.length];
};

 useEffect(() => {
 loadData();
}, [language]);

 useEffect(() => {
 filterAndSortBooks(allBooks);
}, [searchQuery, allBooks, sortBy, selectedCategory, selectedAge]);

 const handleNewsletterSubmit = async (event) => {
 event.preventDefault();
 const email = newsletterEmail.trim();

 if (!email) {
 setNewsletterStatus('error');
 showToast(t.homeNewsletterEmailRequired, 'info', 2500);
 return;
}

 try {
 setNewsletterLoading(true);
 const response = await newsletterAPI.subscribe(email);
 const emailSent = response.data?.email_sent !== false;
 setNewsletterStatus(emailSent ? 'success' : 'saved');
 setNewsletterEmail('');
 if (!emailSent) {
 showToast(t.homeNewsletterPending, 'info', 4500);
 return;
}
 showToast(t.homeNewsletterSuccess, 'success', 3500);
} catch (error) {
 console.error('Newsletter subscription error:', error);
 setNewsletterStatus('error');
 if (error.response?.data?.setup_required) {
 showToast(t.homeNewsletterSetup, 'error', 3500);
} else {
 showToast(t.homeNewsletterError, 'error', 3000);
}
} finally {
 setNewsletterLoading(false);
}
};

 const filterAndSortBooks = (booksToFilter) => {
 let filtered = [...booksToFilter];

 // Filtre par recherche
 if (searchQuery.trim()) {
 const query = searchQuery.toLowerCase();
 filtered = filtered.filter(book =>
 book.title?.toLowerCase().includes(query) ||
 book.author?.toLowerCase().includes(query) ||
 book.description?.toLowerCase().includes(query)
 );
}

 // Filtre par catégorie
 if (selectedCategory) {
 filtered = filtered.filter(book => book.category_id == selectedCategory);
}

 // Filtre par âge (plage officielle HKids — chevauchement)
 if (selectedAge) {
 const group = getAgeGroupById(parseAgeGroupId(selectedAge));
 if (group) {
 filtered = filtered.filter((book) => bookOverlapsAgeGroup(book, group));
 }
 }

 // Tri
 filtered.sort((a, b) => {
 switch(sortBy) {
 case 'title':
 return (a.title || '').localeCompare(b.title || '');
 case 'author':
 return (a.author || '').localeCompare(b.author || '');
 case 'recent':
 default:
 return new Date(b.created_at) - new Date(a.created_at);
}
});

 setBooks(filtered);
};

 const loadData = async () => {
 const cachedData = readHomeDataCache(language);

 if (cachedData?.books?.length || cachedData?.categories?.length) {
 setAllBooks(cachedData.books);
 filterAndSortBooks(cachedData.books);
 setCategories(cachedData.categories);
 setLoading(false);
}

 try {
 if (!cachedData) {
 setLoading(true);
}
 // Load full catalog; age filtering is client-side via official AGE_GROUPS overlap.
 const [booksRes, categoriesRes] = await Promise.all([
 booksAPI.getPublishedBooks({
 category_id: selectedCategory || undefined,
 language
}),
 categoriesAPI.getAll()
 ]);
 setAllBooks(booksRes.data);
 // Filtrer par recherche si nécessaire
 filterAndSortBooks(booksRes.data);
 setCategories(categoriesRes.data);
 writeHomeDataCache(
 Array.isArray(booksRes.data) ? booksRes.data : [],
 Array.isArray(categoriesRes.data) ? categoriesRes.data : [],
 language
 );
} catch (error) {
 console.error('Error loading data:', error);
 console.error('Error details:', error.response?.data);
} finally {
 setLoading(false);
}
};

 const containerVariants = {
 hidden: {opacity: 0},
 visible: {
 opacity: 1,
 transition: {
 staggerChildren: 0.1,
 delayChildren: 0
}
}
};

 const itemVariants = {
 hidden: {opacity: 0, y: 20},
 visible: {
 opacity: 1, 
 y: 0,
 transition: {
 duration: 0.3
}
}
};

 // Petites statistiques pour la hero section
 const totalBooks = allBooks?.length || (loading ? FALLBACK_BOOK_COUNT : 0);
 const totalCategories = categories?.length || 0;
 const storyPreviewBooks = (allBooks || []).slice(0, 8);

 return (
 <div className="min-h-screen bg-gradient-home">
 {/* Header */}
 <motion.header 
 initial={{y: -100, opacity: 0}}
 animate={{y: 0, opacity: 1}}
 transition={{duration: 0.5}}
 className="sticky top-0 z-50 border-b border-border bg-card/95 shadow-sm backdrop-blur-md"
 >
 <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-3">
 <Logo size="default" />
 
 {/* Desktop Navigation */}
 <nav className="hidden md:flex items-center gap-2 text-foreground">
 <LibraryMenu
 categories={categories}
 onCategorySelect={setSelectedCategory}
 onAgeSelect={(age) => {
   setSelectedAge(age || '');
   if (age) setSearchParams({ age });
   else setSearchParams({});
 }}
 selectedCategory={selectedCategory}
 selectedAge={selectedAge}
 />
 <Link 
 to="/favorites" 
 className="btn-nav flex items-center gap-2 text-foreground hover:text-foreground-700 hover:bg-primary-50"
 title={t.favorites}
 >
 <HeartIcon className="w-4 h-4" filled={false} />
 <span>{t.favorites}</span>
 </Link>
 <Link 
 to="/history" 
 className="btn-nav flex items-center gap-2 text-foreground hover:text-foreground-700 hover:bg-primary-50"
 title={t.history}
 >
 <HistoryIcon className="w-4 h-4" />
 <span>{t.history}</span>
 </Link>
 <Link 
 to="/parent/login" 
 className="btn-nav flex items-center gap-2 text-foreground hover:text-foreground-700 hover:bg-primary-50"
 title={t.parentSignIn}
 >
 <LockIcon className="w-4 h-4" />
 <span>{t.parentSignIn}</span>
 </Link>
 <LanguageSelector />
 </nav>

 {/* Mobile Menu Button */}
 <div className="md:hidden flex items-center gap-2">
 <LanguageSelector />
 <motion.button
 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
 className="p-2 text-foreground hover:text-foreground-700 hover:bg-primary-50 rounded-2xl transition-colors min-h-touch min-w-touch"
 whileTap={{scale: 0.95}}
 aria-expanded={mobileMenuOpen}
 aria-controls="home-mobile-menu"
 aria-label={mobileMenuOpen ? t.close : t.homeLibrary}
 >
 {mobileMenuOpen ? (
 <XIcon className="w-6 h-6" />
 ) : (
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
 </svg>
 )}
 </motion.button>
 </div>
 </div>

 {/* Mobile Menu */}
 <AnimatePresence>
 {mobileMenuOpen && (
 <>
 {/* Overlay pour fermer le menu */}
 <motion.div
 initial={{opacity: 0}}
 animate={{opacity: 1}}
 exit={{opacity: 0}}
 onClick={() => setMobileMenuOpen(false)}
 className="md:hidden fixed inset-0 bg-black/50 z-40"
 />
 <motion.div
 initial={{opacity: 0, y: -20}}
 animate={{opacity: 1, y: 0}}
 exit={{opacity: 0, y: -20}}
 transition={{duration: 0.3}}
 className="md:hidden fixed top-[73px] left-0 right-0 bg-card/98 backdrop-blur-md border-t border-border z-50 max-h-[calc(100vh-73px)] overflow-y-auto shadow-lg"
 id="home-mobile-menu"
 >
 <nav className="px-4 py-4 space-y-2">
 <Link 
 to="/favorites" 
 onClick={() => setMobileMenuOpen(false)}
 className="flex items-center gap-3 px-4 py-3 text-foreground hover:text-primary-700 hover:bg-primary-50 rounded-2xl transition-colors min-h-touch"
 >
 <HeartIcon className="w-5 h-5" filled={false} />
 <span>{t.favorites}</span>
 </Link>
 <Link 
 to="/history" 
 onClick={() => setMobileMenuOpen(false)}
 className="flex items-center gap-3 px-4 py-3 text-foreground hover:text-primary-700 hover:bg-primary-50 rounded-2xl transition-colors min-h-touch"
 >
 <HistoryIcon className="w-5 h-5" />
 <span>{t.history}</span>
 </Link>
 <Link 
 to="/parent/login" 
 onClick={() => setMobileMenuOpen(false)}
 className="flex items-center gap-3 px-4 py-3 text-foreground hover:text-primary-700 hover:bg-primary-50 rounded-2xl transition-colors min-h-touch"
 >
 <LockIcon className="w-5 h-5" />
 <span>{t.parentSignIn}</span>
 </Link>
 <div className="pt-2 border-t border-border">
 <div className="px-4 py-3">
 <button
 onClick={() => {
 document.getElementById('books-section')?.scrollIntoView({behavior: 'smooth'});
 setMobileMenuOpen(false);
}}
 className="w-full flex items-center gap-3 px-4 py-3 text-foreground hover:text-primary-700 hover:bg-primary-50 rounded-2xl transition-colors min-h-touch"
 >
 <BookIcon className="w-5 h-5" />
 <span>{t.homeLibrary}</span>
 </button>
 </div>
 {/* Boutons d'âge pour mobile */}
 <div className="px-4 pb-3 space-y-2">
 <p className="text-xs text-foreground-muted uppercase tracking-wide px-4 py-2">{t.homeFilterByAge}</p>
 {[
 ...AGE_GROUPS.map((group) => ({
 age: group.id,
 label: t[group.labelKey] || `${group.min}–${group.max}`,
 color: 'bg-primary-500 hover:bg-primary-600',
 })),
 ].map((ageBtn) => {
 const isSelected = selectedAge === ageBtn.age;
 return (
 <button
 key={ageBtn.age}
 onClick={() => {
 setSelectedAge(ageBtn.age);
 setSearchParams({ age: ageBtn.age });
 setMobileMenuOpen(false);
 setTimeout(() => {
 document.getElementById('popular-stories')?.scrollIntoView({behavior: 'smooth'});
}, 100);
}}
 className={`w-full px-4 py-2.5 rounded-2xl text-white font-semibold text-sm transition-all min-h-touch ${
 isSelected ? ageBtn.color + ' ring-2 ring-offset-2 ring-offset-background ring-primary-300' : ageBtn.color
}`}
 >
 {ageBtn.label}
 </button>
 );
})}
 </div>
 </div>
 </nav>
 </motion.div>
 </>
 )}
 </AnimatePresence>
 </motion.header>
 <main id="main-content">
 <HeroSection t={t} totalBooks={totalBooks} />
 <BookOfTheWeekSection book={allBooks[0]} t={t} />
 <BrowseByAgeSection t={t} selectedAge={selectedAge} setSelectedAge={setSelectedAge} books={allBooks} />
 <StoryPreviewSection books={books} t={t} selectedAge={selectedAge} />
 <FeaturesSection />
 <TestimonialsSection />
 <NewsletterSection 
 t={t}
 newsletterEmail={newsletterEmail} 
 setNewsletterEmail={setNewsletterEmail} 
 handleNewsletterSubmit={handleNewsletterSubmit} 
 newsletterStatus={newsletterStatus} 
 newsletterLoading={newsletterLoading} 
 />
 <FooterSection t={t} />
 </main>
 </div>
 );
}

export default Home;

