import {useEffect, useMemo, useState} from 'react';
import {useLanguage} from '../context/LanguageContext';
import {Link, useNavigate} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {generatedStoriesAPI} from '../api/generatedStories';
import {useAuth} from '../context/AuthContext';
import {speakText, stopSpeaking} from '../services/ai/browserTextToSpeech';
import {
 AudioIcon, BookIcon, CheckIcon, ClockIcon, SparklesIcon, StarIcon, 
 ChevronLeftIcon, PlayIcon, PauseIcon, BrainIcon, HeartIcon, HistoryIcon
} from '../components/Icons';
import {Logo} from '../components/Logo';
import {KidsBottomNav} from '../components/kids/KidsBottomNav';
import {KidsPageShell} from '../components/kids/KidsPageShell';
import {Button, Card, Badge, Avatar} from '../components/ui';
import { BRAND_HERO_GRADIENT, BRAND_SEMANTIC, storyGradientAtIndex } from '../constants/brandTheme';

const themeOptionDefs = [
 {id: 'aventure', label: 'Aventure', pictogram: '🗺️'},
 {id: 'animaux', label: 'Animaux', pictogram: '🦊'},
 {id: 'espace', label: 'Espace', pictogram: '🚀'},
 {id: 'princesses', label: 'Princesses', pictogram: '👑'},
 {id: 'dinosaures', label: 'Dinosaures', pictogram: '🦖'},
 {id: 'magie', label: 'Magie', pictogram: '🪄'},
 {id: 'nature', label: 'Nature', pictogram: '🌿'},
 {id: 'amitie', label: 'Amitié', pictogram: '🤝'}
];
const THEME_LABEL_KEYS = {
 aventure: 'studioTheme_adventure',
 animaux: 'studioTheme_animals',
 espace: 'studioTheme_space',
 princesses: 'studioTheme_princesses',
 dinosaures: 'studioTheme_dinosaurs',
 magie: 'studioTheme_magic',
 nature: 'studioTheme_nature',
 amitie: 'studioTheme_friendship',
};

const characterOptions = [
 {id: 'un dragon', label: 'Dragon', pictogram: '🐉'},
 {id: 'un robot', label: 'Robot', pictogram: '🤖'},
 {id: 'une fée', label: 'Fée', pictogram: '🧚‍♀️'},
 {id: 'un chat', label: 'Chat', pictogram: '🐱'},
 {id: 'un pirate', label: 'Pirate', pictogram: '🏴‍☠️'},
 {id: 'un extra-terrestre', label: 'Alien', pictogram: '👽'}
];

const valueOptions = [
 {id: 'friendship', label: 'Amitié'},
 {id: 'courage', label: 'Courage'},
 {id: 'respect', label: 'Respect'},
 {id: 'curiosity', label: 'Curiosité'}
];

const durationOptions = [2, 5, 8, 12];

const loadingSteps = [
"✨ Récolte d'idées magiques...",
"📚 Construction de l'aventure...",
"🧙 Création des personnages...",
"🎨 Imagination des décors...",
"📖 Écriture de l'histoire...",
"🎉 Finalisation de la magie..."
];

function getErrorMessage(error) {
 if (error.response?.status === 504) return 'La création a pris trop de temps. Réessaie avec une histoire plus courte.';
 if (error.response?.data?.error) return error.response.data.error;
 if (error.code === 'ECONNABORTED') return 'Le serveur met trop de temps à répondre. Réessaie dans un instant.';
 return error.message ||"Impossible de créer l'histoire pour le moment.";
}

function storyLanguageToSpeechCode(language) {
 if (language === 'en') return 'en-US';
 if (language === 'ar') return 'ar-MA';
 return 'fr-FR';
}

// Floating Stars Animation Component
const FloatingStars = () => {
 return (
 <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
 {[...Array(20)].map((_, i) => (
 <motion.div
 key={i}
 className="absolute text-accent-300 opacity-50"
 initial={{
 x: Math.random() * window.innerWidth, 
 y: Math.random() * window.innerHeight,
 scale: Math.random() * 0.5 + 0.5
}}
 animate={{
 y: [null, Math.random() * -100 - 50],
 opacity: [0.2, 0.8, 0.2]
}}
 transition={{
 duration: Math.random() * 5 + 5, 
 repeat: Infinity, 
 ease:"easeInOut" 
}}
 >
 ✨
 </motion.div>
 ))}
 </div>
 );
};

// Confetti Component for Success State
const Confetti = () => {
 const [particles, setParticles] = useState([]);
 
 useEffect(() => {
 const newParticles = Array.from({length: 100}).map((_, i) => ({
 id: i,
 x: window.innerWidth / 2,
 y: window.innerHeight / 2,
 size: Math.random() * 8 + 4,
 color: ['#7b3eb8', '#389d85', '#f76219', '#9b5fc9', '#5bb89e', '#f98a4a'][Math.floor(Math.random() * 6)],
 duration: Math.random() * 2 + 1,
 angle: Math.random() * Math.PI * 2,
 velocity: Math.random() * 300 + 100
}));
 setParticles(newParticles);
}, []);

 return (
 <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
 {particles.map(p => {
 const endX = p.x + Math.cos(p.angle) * p.velocity;
 const endY = p.y + Math.sin(p.angle) * p.velocity + 200; // gravity effect
 return (
 <motion.div
 key={p.id}
 initial={{x: p.x, y: p.y, opacity: 1, scale: 0}}
 animate={{x: endX, y: endY, opacity: 0, scale: 1, rotate: 720}}
 transition={{duration: p.duration, ease:"easeOut"}}
 style={{position: 'absolute', width: p.size, height: p.size, backgroundColor: p.color, borderRadius: Math.random() > 0.5 ? '50%' : '0%'}}
 />
 );
})}
 </div>
 );
};

function KidsStoryStudio() {
 const {user} = useAuth();
 const {t} = useLanguage();
 const navigate = useNavigate();
 const themeOptions = useMemo(
  () => themeOptionDefs.map((theme, index) => ({
   ...theme,
   label: t(THEME_LABEL_KEYS[theme.id] || theme.id),
   gradient: storyGradientAtIndex(index),
  })),
  [t]
 );

 const [form, setForm] = useState({
 theme: themeOptionDefs[0].id,
 estimated_duration_minutes: 5,
 educational_value: 'friendship'
});
 const [selectedCharacters, setSelectedCharacters] = useState([characterOptions[0].id]);
 const [customCharacter, setCustomCharacter] = useState('');

 const [story, setStory] = useState(null);
 const [history, setHistory] = useState([]);
 const [kidProfiles, setKidProfiles] = useState([]);
 const [selectedKidProfileId, setSelectedKidProfileId] = useState('');
 
 const [profilesLoading, setProfilesLoading] = useState(true);
 const [loading, setLoading] = useState(false);
 const [loadingStepIndex, setLoadingStepIndex] = useState(0);
 const [showSuccess, setShowSuccess] = useState(false);
 const [saving, setSaving] = useState(false);
 const [speaking, setSpeaking] = useState(false);
 const [error, setError] = useState('');

 const canUseStoryStudio = ['kid', 'parent', 'admin'].includes(user?.role);
 const selectedKidProfile = kidProfiles.find((kid) => String(kid.id) === String(selectedKidProfileId));

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
 return () => {active = false; stopSpeaking();};
}, [canUseStoryStudio]);

 useEffect(() => {
 if (!canUseStoryStudio || !selectedKidProfileId) return undefined;
 let active = true;
 generatedStoriesAPI.getHistory({kid_profile_id: selectedKidProfileId})
 .then((response) => {if (active) setHistory(response.data || []);})
 .catch((err) => console.warn('Could not load generated story history:', err));
 return () => {active = false; stopSpeaking();};
}, [canUseStoryStudio, selectedKidProfileId]);

 const patchForm = (key, value) => {
 setForm((current) => ({...current, [key]: value}));
};

 const toggleCharacter = (id) => {
 setSelectedCharacters(curr => 
 curr.includes(id) ? curr.filter(c => c !== id) : [...curr, id]
 );
};

 const handleGenerate = async () => {
 if (!selectedKidProfileId) {
 setError('Choisis un profil enfant avant de créer une histoire.');
 return;
}
 setError('');
 setLoading(true);
 setLoadingStepIndex(0);
 setShowSuccess(false);
 stopSpeaking();
 setSpeaking(false);
 
 // Simulate Magical Loading Steps
 const stepInterval = setInterval(() => {
 setLoadingStepIndex(curr => Math.min(curr + 1, loadingSteps.length - 1));
}, 2500);

 const allCharacters = [...selectedCharacters];
 if (customCharacter.trim()) allCharacters.push(customCharacter.trim());
 const finalCharacters = allCharacters.join(', ');

 try {
 const response = await generatedStoriesAPI.generate({
 ...form,
 characters: finalCharacters || 'un doudou magique',
 kid_profile_id: selectedKidProfileId
});
 clearInterval(stepInterval);
 setLoadingStepIndex(loadingSteps.length - 1);
 
 const nextStory = response.data;
 
 setTimeout(() => {
 setLoading(false);
 setShowSuccess(true);
 setStory(nextStory);
 setHistory((current) => [nextStory, ...current.filter((item) => item.id !== nextStory.id)].slice(0, 30));
 
 // Hide success confetti after 4s
 setTimeout(() => setShowSuccess(false), 4000);
 
 // Scroll to story smoothly
 window.scrollTo({top: document.getElementById('story-result')?.offsetTop - 50, behavior: 'smooth'});
}, 1000);

} catch (err) {
 clearInterval(stepInterval);
 setLoading(false);
 console.error('Story generation failed:', err);
 setError(getErrorMessage(err));
}
};

 const handleSpeak = async (selectedStory = story) => {
 if (!selectedStory?.story_text) return;
 setError('');
 if (speaking) {
 stopSpeaking();
 setSpeaking(false);
 return;
}
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
 <div className="flex min-h-screen items-center justify-center bg-primary-900 px-4">
 <div className="max-w-md rounded-[2.5rem] bg-card p-8 text-center shadow-2xl">
 <p className="mb-6 text-xl font-black text-foreground">Espace enfant ou parent requis pour la magie ! ✨</p>
 <Button onClick={() => navigate('/kids')} variant="primary" className="rounded-full w-full font-black">
 Retour
 </Button>
 </div>
 </div>
 );
}

 return (
 <KidsPageShell variant="library" className="bg-primary-900 text-white" footer={<KidsBottomNav />}>
 <FloatingStars />
 {showSuccess && <Confetti />}

 {/* HEADER */}
 <header className="sticky top-0 z-40 bg-primary-900/80 backdrop-blur-xl border-b border-white/10 shadow-lg px-4 py-4 flex items-center justify-between">
 <Link to="/kids" className="flex items-center gap-2 group">
 <div className="p-2 rounded-full bg-card/10 group-hover:bg-card/20 transition-colors">
 <ChevronLeftIcon className="w-6 h-6 text-white" />
 </div>
 <span className="font-black text-xl tracking-wide hidden sm:block">Fabulia</span>
 </Link>
 <div className="flex items-center gap-3">
 <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-card/10 rounded-full">
 <Avatar src={null} fallback={selectedKidProfile?.name?.charAt(0) ||"K"} className="w-8 h-8 bg-gradient-to-br from-primary-400 to-secondary-500 text-white font-bold" />
 <span className="font-bold text-sm">{selectedKidProfile?.name ||"Enfant"}</span>
 </div>
 <Link to="/kids/ai-stories">
 <Button variant="outline" className="rounded-full bg-card/10 border-none text-white hover:bg-card/20 font-bold shadow-lg">
 <BookIcon className="w-5 h-5 mr-2" /> Mes histoires
 </Button>
 </Link>
 </div>
 </header>

 {/* MAGIC LOADING OVERLAY */}
 <AnimatePresence>
 {loading && (
 <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-900/90 backdrop-blur-md">
 <div className="text-center">
 <motion.div animate={{rotate: 360}} transition={{duration: 8, repeat: Infinity, ease: 'linear'}} className="w-32 h-32 mx-auto relative mb-8">
 <div className="absolute inset-0 rounded-full border-4 border-white/10 border-t-primary-500 border-r-secondary-500"></div>
 <div className="absolute inset-2 rounded-full border-4 border-white/5 border-b-accent-500 border-l-primary-400" style={{animation: 'spin 4s linear infinite reverse'}}></div>
 <SparklesIcon className="w-12 h-12 text-foreground-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
 </motion.div>
 
 <AnimatePresence mode="wait">
 <motion.h2 
 key={loadingStepIndex}
 initial={{y: 20, opacity: 0}} 
 animate={{y: 0, opacity: 1}} 
 exit={{y: -20, opacity: 0}}
 className="text-3xl md:text-4xl font-black text-white mb-2"
 >
 {loadingSteps[loadingStepIndex]}
 </motion.h2>
 </AnimatePresence>
 <p className="text-white/50 font-medium">L'intelligence artificielle travaille sa magie...</p>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
 
 {/* HERO TITLE */}
 <div className="text-center mb-12">
 <motion.div initial={{scale: 0}} animate={{scale: 1}} transition={{type: 'spring'}} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-500/30 rounded-full text-foreground-300 font-bold mb-6">
 <SparklesIcon className="w-4 h-4" /> Le Chaudron Magique
 </motion.div>
 <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]">
 Invente ton aventure !
 </h1>
 <p className="text-lg text-white/60 font-medium max-w-2xl mx-auto">
 Mélange tes ingrédients préférés pour créer une histoire unique.
 </p>
 {error && (
 <div className="mt-6 inline-block bg-rose-500/20 border border-rose-500/50 text-rose-200 px-6 py-3 rounded-full font-bold">
 {error}
 </div>
 )}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
 
 {/* LEFT: INGREDIENTS FORM */}
 <div className="lg:col-span-8 space-y-8">
 
 {/* THEME SELECTION */}
 <div className="bg-card/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 md:p-8">
 <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
 <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-sm">1</span> 
 Choisis un Thème
 </h2>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 {themeOptions.map(theme => (
 <motion.button
 key={theme.id}
 whileHover={{scale: 1.05, y: -5}}
 whileTap={{scale: 0.95}}
 onClick={() => patchForm('theme', theme.id)}
 className={`relative overflow-hidden rounded-[2rem] p-4 flex flex-col items-center justify-center gap-2 border-2 transition-all min-h-[120px] ${form.theme === theme.id ? 'border-white bg-card/20 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-white/5 bg-card/5 hover:bg-card/10'}`}
 >
 {form.theme === theme.id && <div className={`absolute inset-0 opacity-30 bg-gradient-to-br ${theme.gradient}`}></div>}
 <span className="text-4xl relative z-10">{theme.pictogram}</span>
 <span className="font-bold text-sm relative z-10">{theme.label}</span>
 {form.theme === theme.id && <div className="absolute top-2 right-2 w-3 h-3 bg-card rounded-full shadow-[0_0_10px_white]"></div>}
 </motion.button>
 ))}
 </div>
 </div>

 {/* CHARACTER SELECTION */}
 <div className="bg-card/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 md:p-8">
 <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
 <span className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary-400 to-accent-500 flex items-center justify-center text-sm">2</span> 
 Qui sera dans l'histoire ?
 </h2>
 <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
 {characterOptions.map(char => {
 const isSelected = selectedCharacters.includes(char.id);
 return (
 <motion.button
 key={char.id}
 whileHover={{scale: 1.1}}
 whileTap={{scale: 0.9}}
 onClick={() => toggleCharacter(char.id)}
 className={`aspect-square rounded-3xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${isSelected ? 'border-primary-400 bg-primary-400/20' : 'border-white/5 bg-card/5 hover:bg-card/10'}`}
 >
 <span className="text-3xl">{char.pictogram}</span>
 <span className="font-bold text-[10px] leading-tight text-center">{char.label}</span>
 </motion.button>
 );
})}
 </div>
 <div className="flex gap-3">
 <input 
 value={customCharacter}
 onChange={(e) => setCustomCharacter(e.target.value)}
 placeholder="Ajouter un autre personnage... (ex: Mamie, mon chien)" 
 className="flex-1 rounded-2xl bg-card/10 border-2 border-white/10 px-4 py-3 font-bold text-white placeholder-white/40 focus:border-primary-400 focus:outline-none"
 />
 </div>
 </div>

 {/* SETTINGS */}
 <div className="bg-card/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 grid sm:grid-cols-2 gap-8">
 <div>
 <h2 className="text-xl font-black mb-4 flex items-center gap-3">
 <ClockIcon className="w-6 h-6 text-rose-400" /> Durée
 </h2>
 <div className="flex flex-wrap gap-2">
 {durationOptions.map(dur => (
 <button
 key={dur}
 onClick={() => patchForm('estimated_duration_minutes', dur)}
 className={`px-4 py-2 rounded-full font-bold text-sm border-2 transition-all ${Number(form.estimated_duration_minutes) === dur ? 'border-rose-400 bg-rose-400/20 text-rose-200' : 'border-white/10 text-white/60 hover:bg-card/10 hover:text-white'}`}
 >
 {dur} min
 </button>
 ))}
 </div>
 </div>
 <div>
 <h2 className="text-xl font-black mb-4 flex items-center gap-3">
 <BrainIcon className="w-6 h-6 text-accent-400" /> Morale
 </h2>
 <div className="flex flex-wrap gap-2">
 {valueOptions.map(val => (
 <button
 key={val.id}
 onClick={() => patchForm('educational_value', val.id)}
 className={`px-4 py-2 rounded-full font-bold text-sm border-2 transition-all ${form.educational_value === val.id ? 'border-accent-400 bg-accent-400/20 text-accent-200' : 'border-white/10 text-white/60 hover:bg-card/10 hover:text-white'}`}
 >
 {val.label}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* GENERATE BUTTON */}
 <motion.button
 whileHover={{scale: 1.02}}
 whileTap={{scale: 0.98}}
 onClick={handleGenerate}
 disabled={loading || profilesLoading || !selectedKidProfileId}
 className="w-full relative group overflow-hidden rounded-[2.5rem] p-1"
 >
 <div className={`absolute inset-0 bg-gradient-to-r ${BRAND_HERO_GRADIENT} rounded-[2.5rem] opacity-70 group-hover:opacity-100 transition-opacity blur-md`}></div>
 <div className={`absolute inset-0 bg-gradient-to-r ${BRAND_HERO_GRADIENT} rounded-[2.5rem] opacity-90 group-hover:opacity-100 transition-opacity`}></div>
 <div className="relative bg-primary-900/20 backdrop-blur-sm rounded-[2.3rem] py-6 flex items-center justify-center gap-4 border border-white/20">
 <SparklesIcon className="w-8 h-8 text-white" />
 <span className="text-3xl font-black text-white tracking-wide">Créer la Magie</span>
 </div>
 </motion.button>

 </div>

 {/* RIGHT: STORY RESULT OR EMPTY STATE */}
 <div className="lg:col-span-4" id="story-result">
 <div className="sticky top-24">
 <AnimatePresence mode="wait">
 {!story ? (
 <motion.div 
 key="empty"
 initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0}}
 className="bg-card/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 text-center min-h-[400px] flex flex-col items-center justify-center"
 >
 <div className="w-24 h-24 bg-card/10 rounded-full flex items-center justify-center mb-6">
 <BookIcon className="w-12 h-12 text-white/50" />
 </div>
 <h3 className="text-2xl font-black mb-2">Le livre est vide</h3>
 <p className="text-white/60 font-medium">Mélange tes ingrédients à gauche et clique sur"Créer la Magie" pour voir ton histoire apparaître ici !</p>
 </motion.div>
 ) : (
 <motion.div 
 key="story"
 initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}
 className="bg-[#fff9f0] text-foreground rounded-[2.5rem] shadow-2xl overflow-hidden relative"
 >
 {/* Story Header */}
 <div className="bg-gradient-to-br from-primary-100 to-secondary-100 p-8 border-b border-border">
 <div className="flex flex-wrap gap-2 mb-4">
 <Badge variant="soft" className="bg-card/60 font-black">{story.theme}</Badge>
 <Badge variant="soft" className="bg-card/60 font-black">{story.estimated_duration_minutes} min</Badge>
 <Badge variant="soft" className={`${BRAND_SEMANTIC.success.bg} ${BRAND_SEMANTIC.success.text} font-black`}>{story.educational_value}</Badge>
 </div>
 <h2 className="text-3xl font-black leading-tight mb-2 text-foreground-900">{story.title}</h2>
 {story.summary && <p className="text-sm font-bold text-foreground-secondary leading-snug">{story.summary}</p>}
 </div>
 
 {/* Story Body */}
 <div className="p-8 max-h-[500px] overflow-y-auto">
 <div className="whitespace-pre-line text-lg font-bold leading-9 text-foreground font-serif">
 {story.story_text}
 </div>
 </div>
 
 {/* Actions */}
 <div className="p-6 bg-card border-t border-border flex gap-3">
 <Button 
 onClick={() => handleSpeak(story)} 
 className={`flex-1 rounded-2xl py-4 font-black shadow-lg ${speaking ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-primary-500 text-white hover:bg-primary-600'}`}
 >
 {speaking ? <PauseIcon className="w-5 h-5 mr-2"/> : <PlayIcon className="w-5 h-5 mr-2"/>}
 {speaking ? 'Pause' : 'Écouter'}
 </Button>
 <Button 
 onClick={handleSave} 
 disabled={story.saved || saving}
 variant="outline" 
 className={`px-6 rounded-2xl font-black border-border shadow-sm ${story.saved ? `${BRAND_SEMANTIC.success.bg} ${BRAND_SEMANTIC.success.text} ${BRAND_SEMANTIC.success.border}` : 'bg-surface-secondary text-foreground-secondary hover:bg-surface-secondary'}`}
 >
 <HeartIcon className="w-5 h-5" filled={story.saved} />
 </Button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 </div>

 {/* HISTORY SECTION */}
 {history.length > 0 && (
 <section className="mt-24">
 <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
 <HistoryIcon className="w-8 h-8 text-foreground-400" /> Tes anciennes aventures
 </h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
 {history.slice(0, 6).map((item) => (
 <motion.button
 key={item.id}
 whileHover={{y: -5}}
 onClick={() => {
 setStory(item);
 window.scrollTo({top: document.getElementById('story-result')?.offsetTop - 50, behavior: 'smooth'});
}}
 className="bg-card/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 text-left hover:bg-card/10 transition-colors group"
 >
 <div className="flex justify-between items-start mb-4">
 <h3 className="font-black text-xl text-white group-hover:text-foreground-300 transition-colors line-clamp-2">{item.title}</h3>
 {item.saved && <HeartIcon className="w-5 h-5 text-rose-400 shrink-0" filled />}
 </div>
 <p className="text-sm font-medium text-white/50 line-clamp-2 mb-4">{item.summary || item.story_text}</p>
 <div className="flex gap-2">
 <Badge variant="soft" className="bg-card/10 text-white/80 text-xs font-bold">{item.theme}</Badge>
 </div>
 </motion.button>
 ))}
 </div>
 </section>
 )}

 </main>
 </KidsPageShell>
 );
}

export default KidsStoryStudio;
