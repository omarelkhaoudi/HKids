import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import {useAuth} from '../context/AuthContext';
import {KID_CATEGORIES} from '../constants/kidCategories';
import {VoiceAssistant} from '../components/kids/VoiceAssistant';
import {Logo} from '../components/Logo';
import {parentalAPI} from '../api/parental';
import {recommendationsAPI} from '../api/recommendations';
import {getImageUrl} from '../utils/imageUrl';
import {useToast} from '../components/ToastProvider';
import {getRestrictionMessage} from '../services/parental/parentalAccessService';
import {
 PlayIcon, StarIcon, LockIcon, SparklesIcon
} from '../components/Icons';
import {Avatar} from '../components/ui';

function getRecommendedBooks(sections = []) {
 const recommendedSection = sections.find((section) => section.id === 'recommended_for_you');
 return Array.isArray(recommendedSection?.items) ? recommendedSection.items : [];
}

function getMissionText(goal, summary) {
 if (goal) {
   const units = {
     minutes: 'min',
     completed_books: 'livres',
     sessions: 'sessions',
   };
   return `${Number(goal.progress_value || 0)} / ${Number(goal.target_value || 0)} ${units[goal.goal_type] || ''}`.trim();
 }

 const totalMinutes = Math.floor(Number(summary?.total_time_seconds || 0) / 60);
 if (totalMinutes > 0) return `${totalMinutes} min de lecture`;

 const totalSessions = Number(summary?.total_sessions || 0);
 if (totalSessions > 0) return `${totalSessions} session${totalSessions > 1 ? 's' : ''}`;

 return 'Aucune lecture enregistrée';
}

function KidsHome() {
 const {user} = useAuth();
 const {showToast} = useToast();
 const navigate = useNavigate();
 const [greeting, setGreeting] = useState('Bonjour');
 const [homeData, setHomeData] = useState(null);
 const [recommendationSections, setRecommendationSections] = useState([]);

 useEffect(() => {
   const hour = new Date().getHours();
   if (hour < 12) setGreeting('Bonjour');
   else if (hour < 18) setGreeting('Bon après-midi');
   else setGreeting('Bonsoir');
 }, []);

 useEffect(() => {
   let active = true;

   const loadKidsHome = async () => {
     const [overviewResult, recommendationsResult] = await Promise.allSettled([
       parentalAPI.getConnectedKidOverview(),
       recommendationsAPI.getForKid(),
     ]);

     if (!active) return;

     if (overviewResult.status === 'fulfilled') {
       setHomeData(overviewResult.value.data);
     } else {
       console.warn('Connected kid overview unavailable:', overviewResult.reason);
     }

     if (recommendationsResult.status === 'fulfilled') {
       setRecommendationSections(recommendationsResult.value.data?.sections || []);
     } else {
       console.warn('Kid recommendations unavailable:', recommendationsResult.reason);
       const message = getRestrictionMessage(recommendationsResult.reason);
       if (message) showToast(message, 'info');
     }
   };

   loadKidsHome();
   return () => {
     active = false;
   };
 }, [showToast]);

 const kid = homeData?.kid || null;
 const kidName = kid?.name || user?.username || '';
 const avatarSrc = kid?.photo_url ? getImageUrl(kid.photo_url) : null;
 const avatarInitials = kid?.avatar || kidName.trim().charAt(0).toUpperCase() || '?';
 const progressRows = Array.isArray(homeData?.progress) ? homeData.progress : [];
 const continueReading = progressRows.find((item) => (
   !item.completed && Number(item.progress_percent || 0) > 0
 )) || null;
 const recommendedBooks = getRecommendedBooks(recommendationSections);
 const featuredBook = continueReading
   ? {
       id: continueReading.book_id,
       title: continueReading.book_title,
       cover_image: continueReading.cover_image,
       progress: Number(continueReading.progress_percent || 0),
       isInProgress: true,
     }
   : recommendedBooks[0]
     ? {
         ...recommendedBooks[0],
         progress: Number(recommendedBooks[0].kid_progress_percent || 0),
         isInProgress: false,
       }
     : null;
 const badges = Array.isArray(homeData?.badges) ? homeData.badges : [];
 const missionText = getMissionText(homeData?.goal, homeData?.summary);

 const handleSurprise = () => {
   if (recommendedBooks.length === 0) {
     navigate('/kids/library');
     return;
   }

   const randomBook = recommendedBooks[Math.floor(Math.random() * recommendedBooks.length)];
   navigate(`/book/${randomBook.id}`);
 };

 return (
   <div className="min-h-screen bg-[#f8fbff] text-foreground overflow-x-hidden font-sans pb-32">
     
     {/* BACKGROUND MAGIC */}
     <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div animate={{x: [0, 30, 0], y: [0, -20, 0]}} transition={{duration: 10, repeat: Infinity, ease: 'easeInOut'}} className="absolute top-10 left-10 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl" />
        <motion.div animate={{x: [0, -30, 0], y: [0, 30, 0]}} transition={{duration: 15, repeat: Infinity, ease: 'easeInOut'}} className="absolute top-20 right-20 w-[30rem] h-[30rem] bg-amber-200/30 rounded-full blur-3xl" />
     </div>

     {/* HEADER (Discreet) */}
     <header className="relative z-10 px-6 py-4 flex items-center justify-between">
       <div className="flex items-center gap-4">
         <Avatar src={avatarSrc} initials={avatarInitials} alt={kidName} size="lg" className="w-16 h-16 border-4 border-white shadow-lg bg-gradient-to-br from-primary-400 to-secondary-500 text-white" />
         <div>
           <h1 className="text-2xl font-black text-foreground-700">{greeting} <span className="text-primary-600">{kidName}</span></h1>
           <p className="text-sm font-bold text-foreground-muted">Prêt à jouer ?</p>
         </div>
       </div>
       <Link to="/kids" className="shrink-0 transition-transform hover:scale-105 active:scale-95">
         <Logo size="default" showText={false} />
       </Link>
     </header>

     <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 space-y-12 mt-4">
       
       {/* TOP SECTION: Continue Reading & Daily Mission */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* CONTINUER LA LECTURE (Massive Card) */}
         <motion.div
           whileHover={{scale: 1.02}}
           whileTap={{scale: 0.98}}
           className="lg:col-span-2 cursor-pointer"
           onClick={() => featuredBook && navigate(`/book/${featuredBook.id}`)}
         >
           <div className="relative h-64 md:h-80 w-full rounded-[2.5rem] overflow-hidden shadow-2xl group">
             {featuredBook?.cover_image && (
               <img src={getImageUrl(featuredBook.cover_image)} alt={featuredBook.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
             
             {/* Giant Play Button */}
             <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-24 h-24 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/50 group-hover:scale-110 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.4)]">
                 <PlayIcon className="w-12 h-12 text-white ml-2 drop-shadow-md" filled />
               </div>
             </div>

             {/* Progress & Title */}
             <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col gap-3">
               <div className="flex items-center justify-between">
                 <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-black border border-white/30 uppercase tracking-wider">
                   {featuredBook?.isInProgress ? 'Reprendre' : 'Découvrir'}
                 </span>
                 <span className="text-white font-black drop-shadow-md">{featuredBook?.progress || 0}%</span>
               </div>
               <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden border border-white/20 backdrop-blur-sm">
                 <motion.div initial={{width: 0}} animate={{width: `${featuredBook?.progress || 0}%`}} className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
               </div>
               <h2 className="text-white text-2xl font-black drop-shadow-lg opacity-90">{featuredBook?.title || 'Aucune lecture disponible'}</h2>
             </div>
           </div>
         </motion.div>

         {/* MISSION DU JOUR (Magic Chest) */}
         <motion.div whileHover={{y: -5}} className="cursor-pointer">
           <div className="h-64 md:h-80 rounded-[2.5rem] bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl border-4 border-white/50">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
             <motion.div 
               animate={{y: [0, -10, 0], rotate: [0, 5, -5, 0]}} 
               transition={{duration: 4, repeat: Infinity, ease: 'easeInOut'}}
               className="text-8xl filter drop-shadow-2xl mb-4"
             >
               🎁
             </motion.div>
             <h3 className="text-white text-2xl font-black drop-shadow-md mb-2">Coffre Magique</h3>
             <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 text-white font-bold">
               <StarIcon className="w-5 h-5 text-yellow-300" />
               <span>{missionText}</span>
             </div>
           </div>
         </motion.div>
       </div>

       {/* CENTRAL SURPRISE BUTTON */}
       <div className="flex justify-center my-8">
         <motion.button 
           whileHover={{scale: 1.05}} 
           whileTap={{scale: 0.95}}
           onClick={handleSurprise}
           className="group relative flex items-center gap-4 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 p-4 pr-8 rounded-[3rem] shadow-2xl border-4 border-white overflow-hidden"
         >
           <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMiIvPgo8L3N2Zz4=')] opacity-30 mix-blend-overlay"></div>
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner relative z-10 group-hover:rotate-12 transition-transform">
             <SparklesIcon className="w-8 h-8 text-fuchsia-500" />
           </div>
           <span className="text-white font-black text-2xl relative z-10 drop-shadow-md">Surprends-moi !</span>
         </motion.button>
       </div>

       {/* UNIVERSES GRID (The main navigation) */}
       <section>
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
           {KID_CATEGORIES.map((category) => (
             <motion.div 
               key={category.id}
               whileHover={{scale: 1.05, rotate: Math.random() * 4 - 2}}
               whileTap={{scale: 0.95}}
               onClick={() => navigate(`/kids/library?theme=${category.id}`)}
               className={`cursor-pointer rounded-[2.5rem] bg-gradient-to-br ${category.gradient} p-6 flex flex-col items-center justify-center text-center aspect-square shadow-xl relative overflow-hidden border-4 border-white/40`}
             >
               <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
               <span className="text-6xl md:text-7xl mb-4 filter drop-shadow-lg transform transition-transform group-hover:scale-110">{category.pictogram}</span>
               <span className="text-white font-black text-xl md:text-2xl drop-shadow-md leading-tight">{category.shortLabel || category.label}</span>
             </motion.div>
           ))}
         </div>
       </section>

       {/* RECOMMANDÉ POUR TOI (Immersive Cards) */}
       <section>
         <h2 className="text-2xl font-black text-foreground-700 mb-6 pl-2">⭐ Pour Toi</h2>
         <div className="flex gap-4 overflow-x-auto pb-8 pt-2 px-2 snap-x snap-mandatory custom-scrollbar">
           {recommendedBooks.map((book) => (
             <motion.div 
               key={book.id} 
               whileHover={{y: -10}} 
               className="snap-start shrink-0 relative w-48 h-64 md:w-56 md:h-72 rounded-[2rem] overflow-hidden shadow-xl cursor-pointer"
               onClick={() => navigate(`/book/${book.id}`)}
             >
               {book.cover_image && (
                 <img src={getImageUrl(book.cover_image)} alt={book.title} className="absolute inset-0 w-full h-full object-cover" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
               <div className="absolute bottom-0 inset-x-0 p-4">
                 <h3 className="text-white font-black text-lg leading-tight drop-shadow-md">{book.title}</h3>
               </div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                 <PlayIcon className="w-8 h-8 text-white ml-1" filled />
               </div>
             </motion.div>
           ))}
         </div>
       </section>

       {/* TROPHIES (Giant Animated Medals) */}
       <section className="mb-12">
         <h2 className="text-2xl font-black text-foreground-700 mb-6 pl-2">🏆 Tes Médailles</h2>
         <div className="flex flex-wrap gap-6 justify-center md:justify-start px-2">
           {badges.map((badge) => (
             <motion.div 
               key={badge.id}
               whileHover={{scale: 1.1, rotate: [0, -10, 10, -10, 10, 0]}}
               title={`${badge.label} — ${badge.description}`}
               className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center text-5xl md:text-6xl shadow-2xl border-8 ${badge.earned ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 border-yellow-200' : 'bg-surface-200 border-surface-300 grayscale opacity-60'}`}
             >
               {badge.earned ? (
                 <>
                   <span className="filter drop-shadow-lg z-10 relative">{badge.icon}</span>
                   <motion.div animate={{rotate: 360}} transition={{duration: 10, repeat: Infinity, ease: 'linear'}} className="absolute inset-0 rounded-full border-4 border-dashed border-white/40"></motion.div>
                 </>
               ) : (
                 <LockIcon className="w-10 h-10 text-surface-400" />
               )}
             </motion.div>
           ))}
         </div>
       </section>

     </main>

     {/* Floating Voice Assistant */}
     <VoiceAssistant />
   </div>
 );
}

export default KidsHome;
