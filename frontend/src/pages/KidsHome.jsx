import {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {useAuth} from '../context/AuthContext';
import {KID_CATEGORIES} from '../constants/kidCategories';
import {VoiceAssistant} from '../components/kids/VoiceAssistant';
import {Logo} from '../components/Logo';
import {
 AudioIcon, BookIcon, BrainIcon, LogOutIcon, SparklesIcon, 
 PlayIcon, StarIcon, LockIcon 
} from '../components/Icons';
import {Card, Badge, ProgressBar, Avatar, Carousel, BookCard, EmptyState, Button} from '../components/ui';

function KidsHome() {
 const {user, logout} = useAuth();
 const navigate = useNavigate();
 const [greeting, setGreeting] = useState('Bonjour');

 useEffect(() => {
 const hour = new Date().getHours();
 if (hour < 12) setGreeting('Bonjour');
 else if (hour < 18) setGreeting('Bon après-midi');
 else setGreeting('Bonsoir');
}, []);

 const handleLogout = () => {
 logout();
 navigate('/parent/login');
};

 // --- DUMMY DATA FOR UI ---
 const kidName = user?.username || 'Champion';
 const dailyMissionProgress = 60; // 60%
 const currentStreak = 5;
 const totalStars = 1240;
 
 const continueReadingBook = {
 id: 1,
 title:"Le Petit Prince",
 coverUrl:"https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400",
 progress: 75,
 remainingMinutes: 5,
 lastOpened:"Aujourd'hui"
};

 const dummyBooks = [
 {id: 2, title:"Alice au pays des merveilles", coverUrl:"https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&q=80&w=400", author:"Lewis Carroll"},
 {id: 3, title:"Peter Pan", coverUrl:"https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400", author:"J.M. Barrie"},
 {id: 4, title:"Le Livre de la Jungle", coverUrl:"https://images.unsplash.com/photo-1501862700950-18382cd41497?auto=format&fit=crop&q=80&w=400", author:"Rudyard Kipling"},
 {id: 5, title:"Pinocchio", coverUrl:"https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400", author:"Carlo Collodi"}
 ];

 const badges = [
 {id: 1, name:"Premier Livre", icon:"📚", unlocked: true},
 {id: 2, name:"Série de 7 jours", icon:"🔥", unlocked: false},
 {id: 3, name:"Créateur IA", icon:"✨", unlocked: true},
 {id: 4, name:"Lecteur Nocturne", icon:"🌙", unlocked: false},
 ];

 return (
 <div className="min-h-screen bg-[#f8fbff] text-foreground overflow-x-hidden font-sans pb-32">
 
 {/* HEADER */}
 <header className="fixed top-0 inset-x-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border shadow-sm px-4 py-3 flex items-center justify-between">
 <Link to="/kids" className="shrink-0 transition-transform hover:scale-105 active:scale-95">
 <Logo size="default" showText={true} />
 </Link>
 <div className="flex items-center gap-2 md:gap-4">
 <div className="hidden md:flex items-center gap-4 bg-surface-secondary rounded-full px-4 py-2">
 <div className="flex items-center gap-1 font-black text-amber-500"><StarIcon className="w-5 h-5"/> {totalStars}</div>
 <div className="w-px h-4 bg-surface-300"></div>
 <div className="flex items-center gap-1 font-black text-orange-500">🔥 {currentStreak}</div>
 </div>
 <button onClick={handleLogout} className="p-3 bg-card border border-border rounded-full text-foreground-500 shadow-sm hover:bg-surface-secondary hover:scale-105 transition-all">
 <LogOutIcon className="h-6 w-6" />
 </button>
 </div>
 </header>

 {/* HERO SECTION (Disney+ / Nintendo style) */}
 <div className="relative pt-24 pb-12 px-4 sm:px-8 lg:px-12 bg-gradient-to-b from-sky-300 via-sky-200 to-[#f8fbff] overflow-hidden">
 {/* Animated clouds/blobs */}
 <motion.div animate={{x: [0, 50, 0], y: [0, -20, 0]}} transition={{duration: 10, repeat: Infinity, ease: 'easeInOut'}} className="absolute top-10 left-10 w-64 h-64 bg-card/40 rounded-full blur-3xl" />
 <motion.div animate={{x: [0, -50, 0], y: [0, 30, 0]}} transition={{duration: 15, repeat: Infinity, ease: 'easeInOut'}} className="absolute top-20 right-20 w-96 h-96 bg-yellow-300/30 rounded-full blur-3xl" />
 
 <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-8">
 {/* Avatar Area */}
 <motion.div 
 animate={{y: [0, -10, 0]}} 
 transition={{duration: 4, repeat: Infinity, ease: 'easeInOut'}}
 className="relative"
 >
 <div className="absolute inset-0 bg-primary-400 rounded-full blur-xl opacity-50 scale-110 animate-pulse"></div>
 <Avatar src={null} fallback={kidName[0].toUpperCase()} size="xl" className="w-32 h-32 md:w-48 md:h-48 border-8 border-white shadow-2xl relative z-10 text-5xl bg-gradient-to-br from-primary-400 to-secondary-500 text-white" />
 <div className="absolute -bottom-4 -right-4 bg-card rounded-full p-2 shadow-xl z-20">
 <div className="bg-amber-400 text-white font-black text-lg w-12 h-12 flex items-center justify-center rounded-full border-4 border-white">
 Lv.5
 </div>
 </div>
 </motion.div>

 <div className="text-center md:text-left flex-1">
 <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="inline-flex items-center gap-2 bg-card/60 backdrop-blur-md px-4 py-2 rounded-full font-bold text-foreground-700 mb-4 shadow-sm border border-white">
 <SparklesIcon className="w-5 h-5" /> Explorateur Stellaire
 </motion.div>
 <motion.h1 initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} className="text-4xl md:text-6xl font-black text-foreground tracking-tight mb-2">
 {greeting}, <span className="text-foreground-600">{kidName}</span> !
 </motion.h1>
 <motion.p initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}} className="text-lg md:text-xl font-bold text-foreground-secondary opacity-90">
 Prêt pour une nouvelle aventure aujourd'hui ?
 </motion.p>
 </div>

 {/* Quick Stats Mobile */}
 <div className="md:hidden flex items-center gap-4 bg-card/80 backdrop-blur-md rounded-3xl p-4 shadow-lg w-full justify-center">
 <div className="flex flex-col items-center"><div className="text-2xl">⭐</div><div className="font-black text-foreground">{totalStars}</div></div>
 <div className="w-px h-10 bg-surface-200"></div>
 <div className="flex flex-col items-center"><div className="text-2xl">🔥</div><div className="font-black text-foreground">{currentStreak}</div></div>
 <div className="w-px h-10 bg-surface-200"></div>
 <div className="flex flex-col items-center"><div className="text-2xl">🏆</div><div className="font-black text-foreground">12</div></div>
 </div>
 </div>
 </div>

 <main className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 -mt-8 relative z-20 space-y-12">
 
 {/* MAIN TOP GRID: Continue Reading & Daily Mission */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Continue Reading Featured Card */}
 <motion.div whileHover={{y: -5}} className="lg:col-span-2">
 <Card className="h-full p-0 overflow-hidden border-4 border-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white relative group cursor-pointer" onClick={() => navigate(`/book/${continueReadingBook.id}`)}>
 <div className="absolute top-0 right-0 w-64 h-64 bg-card/20 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
 <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 h-full items-center">
 <img src={continueReadingBook.coverUrl} alt="Cover" className="w-32 md:w-40 rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-300" />
 <div className="flex-1 text-center md:text-left flex flex-col h-full justify-center">
 <Badge variant="glass" className="bg-card/20 text-white border-none self-center md:self-start mb-3 font-bold">Reprendre la lecture</Badge>
 <h2 className="text-3xl font-black mb-2">{continueReadingBook.title}</h2>
 <p className="text-white/80 font-medium mb-6">Encore {continueReadingBook.remainingMinutes} minutes pour terminer !</p>
 <div className="mt-auto w-full">
 <div className="flex justify-between text-sm font-bold mb-2">
 <span>{continueReadingBook.progress}%</span>
 </div>
 <ProgressBar progress={continueReadingBook.progress} color="bg-green-400" className="h-3 bg-card/20" />
 </div>
 </div>
 <div className="hidden md:flex items-center justify-center">
 <button className="w-16 h-16 bg-card text-violet-600 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
 <PlayIcon className="w-8 h-8 ml-1" />
 </button>
 </div>
 </div>
 </Card>
 </motion.div>

 {/* Daily Mission */}
 <motion.div whileHover={{y: -5}}>
 <Card className="h-full p-6 md:p-8 border-4 border-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] bg-card flex flex-col items-center justify-center text-center relative overflow-hidden">
 <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
 <h3 className="text-xl font-black text-foreground mb-2">Mission du jour</h3>
 <p className="text-foreground-muted font-bold mb-6">Lis pendant 15 minutes</p>
 
 <div className="relative w-32 h-32 mb-6">
 <svg className="w-full h-full transform -rotate-90">
 <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-surface-100" />
 <motion.circle initial={{strokeDashoffset: 351}} animate={{strokeDashoffset: 351 - (351 * dailyMissionProgress / 100)}} transition={{duration: 1.5, ease: 'easeOut'}} cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="12" strokeDasharray="351" strokeLinecap="round" className="text-amber-500" />
 </svg>
 <div className="absolute inset-0 flex items-center justify-center">
 <div className="text-3xl">🎁</div>
 </div>
 </div>
 <Button variant="primary" fullWidth className="bg-amber-500 hover:bg-amber-600 border-none shadow-lg shadow-amber-500/30">
 Récupérer (Bientôt)
 </Button>
 </Card>
 </motion.div>
 </div>

 {/* MAGIC SHORTCUTS (Story Studio, AI Stories, Learning) */}
 <section>
 <h2 className="text-2xl font-black text-foreground mb-6 px-2">Créer & Jouer</h2>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <Link to="/kids/story-studio" className="group p-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-[2rem] text-white shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-card/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
 <div className="w-16 h-16 bg-card/20 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-transform"><SparklesIcon className="w-8 h-8" /></div>
 <span className="font-black text-lg">Créer Histoire</span>
 </Link>
 <Link to="/kids/ai-stories" className="group p-6 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-[2rem] text-white shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-card/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
 <div className="w-16 h-16 bg-card/20 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-12 transition-transform"><BookIcon className="w-8 h-8" /></div>
 <span className="font-black text-lg">Mes IA</span>
 </Link>
 <Link to="/content-library" className="group p-6 bg-gradient-to-br from-accent-400 to-accent-600 rounded-[2rem] text-white shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-card/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
 <div className="w-16 h-16 bg-card/20 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-transform"><AudioIcon className="w-8 h-8" /></div>
 <span className="font-black text-lg">Audiobooks</span>
 </Link>
 <Link to="/kids/learning" className="group p-6 bg-gradient-to-br from-green-400 to-green-600 rounded-[2rem] text-white shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-card/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
 <div className="w-16 h-16 bg-card/20 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-12 transition-transform"><BrainIcon className="w-8 h-8" /></div>
 <span className="font-black text-lg">Jeux & Quiz</span>
 </Link>
 </div>
 </section>

 {/* CAROUSELS (Netflix / Disney+ style) */}
 <section>
 <div className="flex items-center justify-between px-2 mb-6">
 <h2 className="text-2xl font-black text-foreground">Recommandé pour toi</h2>
 <Link to="/content-library" className="text-foreground-600 font-bold hover:text-foreground-700">Voir tout</Link>
 </div>
 <Carousel items={dummyBooks} renderItem={(book) => (
 <div className="w-40 md:w-48 pb-4">
 <BookCard book={book} />
 </div>
 )} />
 </section>

 <section>
 <div className="flex items-center justify-between px-2 mb-6">
 <h2 className="text-2xl font-black text-foreground">Nouvelles Histoires</h2>
 </div>
 <Carousel items={[...dummyBooks].reverse()} renderItem={(book) => (
 <div className="w-40 md:w-48 pb-4">
 <BookCard book={book} />
 </div>
 )} />
 </section>

 {/* ACHIEVEMENTS & BADGES */}
 <section>
 <h2 className="text-2xl font-black text-foreground mb-6 px-2">Mes Trophées</h2>
 <Card className="p-8 border-4 border-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] bg-card">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
 {badges.map(badge => (
 <motion.div whileHover={{scale: 1.05}} key={badge.id} className="flex flex-col items-center text-center gap-3">
 <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-xl border-4 ${badge.unlocked ? 'bg-gradient-to-br from-yellow-300 to-amber-500 border-yellow-200' : 'bg-surface-secondary border-border grayscale opacity-50'}`}>
 {badge.unlocked ? badge.icon : <LockIcon className="w-8 h-8 text-surface-400" />}
 </div>
 <span className={`font-black ${badge.unlocked ? 'text-foreground' : 'text-surface-400'}`}>{badge.name}</span>
 </motion.div>
 ))}
 </div>
 <div className="mt-8 text-center">
 <Button variant="outline" className="font-bold border-2 rounded-full">Voir tous mes badges</Button>
 </div>
 </Card>
 </section>

 </main>

 {/* Floating Voice Assistant */}
 <VoiceAssistant />
 </div>
 );
}

export default KidsHome;
