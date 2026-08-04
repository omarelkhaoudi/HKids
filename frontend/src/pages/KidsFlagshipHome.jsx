import React from 'react';
import { motion } from 'framer-motion';

import ParticleEffect from '../components/kids/flagship/ParticleEffect';
import TopBar from '../components/kids/flagship/TopBar';
import ActionCard from '../components/kids/flagship/ActionCard';
import FloatingNavBar from '../components/kids/flagship/FloatingNavBar';

const KidsFlagshipHome = () => {
  return (
    <div className="relative min-h-screen bg-sky-100 overflow-hidden font-sans select-none">
      {/* Dynamic Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100 opacity-80" />
      
      {/* Magic Particles */}
      <ParticleEffect />

      <div className="relative z-10 h-full flex flex-col max-w-5xl mx-auto pb-32">
        <TopBar />

        {/* Main Content Area */}
        <main className="flex-1 w-full px-6 pt-4 overflow-y-auto pb-8 scrollbar-hide">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 auto-rows-min">
            
            <ActionCard 
              title="Listen to Stories" 
              imageSrc="/illustrations/hkids_stories_1785859306807.jpg"
              route="/kids/library"
              bgColor="bg-purple-100"
              size="large"
              delay={0.1}
            />

            <ActionCard 
              title="Educational Games" 
              imageSrc="/illustrations/hkids_games_1785859317533.jpg"
              route="/kids/games"
              bgColor="bg-green-100"
              delay={0.2}
            />

            <ActionCard 
              title="Explore the World" 
              imageSrc="/illustrations/hkids_explore_1785859328927.jpg"
              route="/kids/explore"
              bgColor="bg-orange-100"
              delay={0.3}
            />

            <ActionCard 
              title="Daily Surprise" 
              imageSrc="/illustrations/hkids_surprise_1785859339044.jpg"
              route="/kids/daily"
              bgColor="bg-pink-100"
              delay={0.4}
            />

            <ActionCard 
              title="Favorites" 
              imageSrc="/illustrations/hkids_avatar_1785859297185.jpg" // Using avatar for favorites temporarily if no specific image
              route="/kids/profile"
              bgColor="bg-yellow-100"
              delay={0.5}
            />

          </div>
        </main>

        <FloatingNavBar />
      </div>
    </div>
  );
};

export default KidsFlagshipHome;
