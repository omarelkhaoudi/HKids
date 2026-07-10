import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Moon, Star, Library, Home, Play, Heart, Mic } from 'lucide-react';
import KidsButton from '../components/kids/KidsButton';
import KidsStoryCard from '../components/kids/KidsStoryCard';
import LitMascot from '../components/kids/LitMascot';

const STORIES = [
  {
    id: 1,
    title: 'Le Petit Prince',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80',
    duration: '15 min',
    color: 'primary',
  },
  {
    id: 2,
    title: 'La Lune Magique',
    image: 'https://images.unsplash.com/photo-1513628253939-010e64ac66cd?w=800&q=80',
    duration: '8 min',
    color: 'secondary',
  },
  {
    id: 3,
    title: 'Les Animaux',
    image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&q=80',
    duration: '12 min',
    color: 'accent',
  },
  {
    id: 4,
    title: 'Aventure Spatiale',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    duration: '20 min',
    color: 'primary',
  },
];

export default function HKidsMockup() {
  const [activeTab, setActiveTab] = useState('home');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-kids-bg text-surface-900 font-sans selection:bg-primary-200 overflow-hidden flex flex-col relative">
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute -top-32 -right-32 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-50" 
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 -left-32 w-80 h-80 bg-secondary-100 rounded-full blur-3xl opacity-50" 
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 md:p-8">
        <KidsButton variant="ghost" size="sm" icon={Settings} className="!rounded-full w-16 h-16 p-0" aria-label="Paramètres" />
        
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/80 backdrop-blur-md px-8 py-3 rounded-full shadow-sm border border-surface-200"
        >
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
            Le Lit Qui Lit
          </h1>
        </motion.div>
        
        <KidsButton variant="ghost" size="sm" icon={User} className="!rounded-full w-16 h-16 p-0 bg-primary-100 text-primary-600 border-primary-200" aria-label="Profil" />
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 px-6 md:px-12 pb-32 flex flex-col items-center max-w-7xl mx-auto w-full">
        
        {/* Hero Section */}
        <section className="flex flex-col md:flex-row items-center justify-between w-full mt-4 mb-12 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 text-center md:text-left"
          >
            <h2 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
              Bonjour, <span className="text-primary-500">Léo</span> !
            </h2>
            <p className="text-2xl text-surface-500 font-bold mb-8">
              Prêt pour une nouvelle histoire magique ?
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <KidsButton icon={Play} size="lg" className="w-full md:w-auto shadow-lg shadow-primary-500/30">
                Continuer
              </KidsButton>
              <KidsButton variant="secondary" icon={Mic} size="lg" className="w-full md:w-auto">
                Studio
              </KidsButton>
            </div>
          </motion.div>

          <div className="flex-1 flex justify-center">
            <LitMascot className="w-64 h-64 md:w-80 md:h-80" />
          </div>
        </section>

        {/* Categories / Tabs */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full mb-8 flex justify-center gap-4"
        >
          {['home', 'favorites', 'sleep'].map((tab) => {
            const icons = { home: Home, favorites: Heart, sleep: Moon };
            const labels = { home: 'Découvrir', favorites: 'Favoris', sleep: 'Pour dormir' };
            const isActive = activeTab === tab;
            const Icon = icons[tab];

            return (
              <motion.button
                key={tab}
                variants={itemVariants}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-3 px-6 py-4 rounded-full font-bold text-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary-500 text-white shadow-md' 
                    : 'bg-white text-surface-500 hover:bg-surface-50'
                }`}
              >
                <Icon className={isActive ? 'text-white' : 'text-surface-400'} />
                {labels[tab]}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Stories Grid */}
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          {STORIES.map((story) => (
            <motion.div key={story.id} variants={itemVariants}>
              <KidsStoryCard
                title={story.title}
                image={story.image}
                duration={story.duration}
                color={story.color}
                onClick={() => {}}
              />
            </motion.div>
          ))}
        </motion.section>
        
      </main>

      {/* Bottom Kiosk Navigation (Optional/Alternative to Tabs) */}
      <div className="fixed bottom-0 left-0 w-full p-6 z-20 pointer-events-none flex justify-center">
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="pointer-events-auto bg-white/90 backdrop-blur-xl p-4 rounded-full shadow-glass border border-white/50 flex gap-4"
        >
          <KidsButton variant={activeTab === 'home' ? 'primary' : 'ghost'} size="sm" icon={Library} className="!rounded-full px-6">
            Bibliothèque
          </KidsButton>
          <KidsButton variant="secondary" size="sm" icon={Star} className="!rounded-full px-6">
            Mes Badges
          </KidsButton>
        </motion.div>
      </div>
    </div>
  );
}
