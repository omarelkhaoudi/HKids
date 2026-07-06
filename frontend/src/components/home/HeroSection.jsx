import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { StarIcon } from '../../components/Icons';

export default function HeroSection({ t, totalBooks }) {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-primary-50/40 to-secondary-50/20 pt-12 pb-16 md:pt-20 md:pb-24">
      {/* Background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-yellow-300 opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <StarIcon className="w-5 h-5 md:w-8 md:h-8" />
          </motion.div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left: Text Content */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-50 text-primary-600 rounded-full text-sm font-bold mb-6 border border-primary-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
              L'IA au service de l'imagination
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-surface-900 mb-6 leading-[1.1] tracking-tight">
              {t.heroTitle1}
              <br />
              <span className="text-primary-500">{t.heroTitle2}</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-surface-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              {t.heroDescription || "Des histoires personnalisées, éducatives et magiques pour chaque enfant. Créées avec amour, animées par l'IA."}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <button 
                onClick={() => navigate('/parent/signup')}
                className="w-full sm:w-auto px-8 py-4 bg-primary-500 text-white rounded-full font-bold text-lg shadow-[0_8px_20px_-6px_rgba(123,62,184,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(123,62,184,0.6)] hover:-translate-y-1 transition-all duration-300"
              >
                Commencer gratuitement
              </button>
              <button 
                onClick={() => navigate('/stories')}
                className="w-full sm:w-auto px-8 py-4 bg-white text-surface-800 rounded-full font-bold text-lg shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] border border-surface-200 hover:shadow-[0_12px_25px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Voir la démo
              </button>
            </div>

            {/* Trust markers */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm font-semibold text-surface-500">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">✓</div>
                100% sécurisé
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">✓</div>
                Contenu éducatif
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">✓</div>
                Sans publicité
              </div>
            </div>
          </motion.div>

          {/* Right: Glassmorphic Visual representation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-lg lg:max-w-none"
          >
            <div className="relative aspect-square w-full">
              {/* Blur behind the glass */}
              <div className="absolute inset-10 bg-gradient-to-tr from-primary-400 via-secondary-300 to-primary-300 rounded-[3rem] blur-3xl opacity-40"></div>
              
              {/* The glass pane */}
              <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/10 z-0"></div>
                
                {/* 3D Visual Content Placeholder */}
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8">
                  {/* Floating elements inside glass */}
                  <motion.div 
                    animate={{ y: [-10, 10, -10] }} 
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-10 left-10 w-16 h-16 bg-gradient-to-br from-secondary-300 to-secondary-500 rounded-2xl shadow-lg rotate-12 flex items-center justify-center"
                  >
                     <span className="text-white text-3xl">🪐</span>
                  </motion.div>
                  <motion.div 
                    animate={{ y: [10, -10, 10] }} 
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-20 right-10 w-14 h-14 bg-gradient-to-br from-accent-300 to-accent-500 rounded-full shadow-lg flex items-center justify-center"
                  >
                    <span className="text-white text-2xl">🚀</span>
                  </motion.div>

                  <div className="w-full max-w-[280px] aspect-square rounded-[2rem] bg-gradient-to-b from-primary-50 to-white shadow-2xl border-4 border-white relative mt-8 flex flex-col items-center justify-end overflow-hidden group">
                     {/* Real Image */}
                     <div className="absolute inset-0 flex items-center justify-center p-2">
                       <img src="/enfant3ans.webp" alt="Enfant qui lit" className="w-full h-full object-cover rounded-[1.5rem] filter drop-shadow-xl group-hover:scale-105 transition-transform duration-500" />
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10"></div>
                     <div className="relative z-20 bg-primary-600/95 backdrop-blur-md text-white font-bold text-xl py-3 px-10 rounded-t-2xl mb-0 shadow-lg border-t border-x border-white/20">HKids</div>
                  </div>
                </div>

                {/* Badges on glass */}
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md rounded-2xl px-5 py-3 shadow-lg border border-white/50 text-center z-20">
                  <div className="text-xl font-extrabold text-primary-600">+10K</div>
                  <div className="text-xs font-semibold text-surface-500">histoires créées</div>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-full px-5 py-3 shadow-lg border border-white/50 flex items-center gap-3 w-[max-content] z-20">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-sm shadow-sm z-30">👨‍👩‍👧</div>
                    <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-sm shadow-sm z-20">👩‍👦</div>
                    <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-sm shadow-sm z-10">👨‍👧‍👦</div>
                  </div>
                  <div className="text-xs font-semibold text-surface-600">
                    Rejoint par plus de<br/><span className="text-surface-900">5.000 familles</span> ✨
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
