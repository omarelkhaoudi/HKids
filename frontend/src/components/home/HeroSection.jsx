import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { StarIcon } from '../../components/Icons';
import { Button } from '../ui/Button';

export default function HeroSection({ t, totalBooks }) {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-primary-50/40 to-secondary-50/20 dark:from-surface-900 dark:via-primary-900/20 dark:to-secondary-900/10 pt-12 pb-16 md:pt-20 md:pb-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-yellow-300 opacity-60"
            style={{
              left: `${(i * 17 + 7) % 100}%`,
              top: `${(i * 23 + 11) % 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              delay: (i % 5) * 0.4,
            }}
          >
            <StarIcon className="w-5 h-5 md:w-8 md:h-8" />
          </motion.div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-50 text-primary-700 rounded-full text-sm font-bold mb-6 border border-primary-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              {t.heroBadge}
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-[1.1] tracking-tight">
              {t.heroTitle1}
              <br />
              <span className="text-primary-600">{t.heroTitle2}</span>
            </h1>

            <p className="text-lg sm:text-xl text-foreground-secondary mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              {t.heroDescription}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <Button size="lg" className="rounded-full shadow-lg w-full sm:w-auto" onClick={() => navigate('/parent/signup')}>
                {t.startFree}
              </Button>
              <Button variant="ghost" size="lg" className="rounded-full bg-white dark:bg-surface-800 border border-border shadow-md w-full sm:w-auto" onClick={() => navigate('/stories')}>
                {t.viewDemo}
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm font-semibold text-foreground-muted">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">✓</div>
                {t.trustSecure}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">✓</div>
                {t.trustEducational}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">✓</div>
                {t.trustNoAds}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="relative mx-auto w-full max-w-lg lg:max-w-none"
          >
            <div className="relative aspect-square w-full">
              <div className="absolute inset-10 bg-gradient-to-tr from-primary-400 via-secondary-300 to-primary-300 rounded-[3rem] blur-3xl opacity-40" />

              <div className="absolute inset-0 bg-white/40 dark:bg-surface-800/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 dark:border-white/10 shadow-floating flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/10 dark:from-white/10 dark:to-transparent z-0" />

                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8">
                  <motion.div
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-10 left-10 w-16 h-16 bg-gradient-to-br from-secondary-300 to-secondary-500 rounded-2xl shadow-lg rotate-12 flex items-center justify-center"
                  >
                    <span className="text-white text-3xl">🪐</span>
                  </motion.div>
                  <motion.div
                    animate={{ y: [10, -10, 10] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute bottom-20 right-10 w-14 h-14 bg-gradient-to-br from-accent-300 to-accent-500 rounded-full shadow-lg flex items-center justify-center"
                  >
                    <span className="text-white text-2xl">🚀</span>
                  </motion.div>

                  <div className="w-full max-w-[280px] aspect-square rounded-[2rem] bg-gradient-to-b from-primary-50 to-white shadow-2xl border-4 border-white relative mt-8 flex flex-col items-center justify-end overflow-hidden group">
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                      <img src="/enfant3ans.webp" alt="" className="w-full h-full object-cover rounded-[1.5rem] filter drop-shadow-xl group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
                    <div className="relative z-20 bg-primary-600/95 backdrop-blur-md text-white font-bold text-xl py-3 px-10 rounded-t-2xl mb-0 shadow-lg border-t border-x border-white/20">HKids</div>
                  </div>
                </div>

                <div className="absolute top-6 right-6 bg-white/90 dark:bg-surface-800/90 backdrop-blur-md rounded-2xl px-5 py-3 shadow-lg border border-white/50 text-center z-20">
                  <div className="text-xl font-extrabold text-primary-600">+{totalBooks || '10K'}</div>
                  <div className="text-xs font-semibold text-foreground-muted">{t.storiesCreated}</div>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-surface-800/90 backdrop-blur-md rounded-full px-5 py-3 shadow-lg border border-white/50 flex items-center gap-3 w-max z-20">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-sm shadow-sm z-30">👨‍👩‍👧</div>
                    <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-sm shadow-sm z-20">👩‍👦</div>
                    <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-sm shadow-sm z-10">👨‍👧‍👦</div>
                  </div>
                  <div className="text-xs font-semibold text-foreground-secondary">
                    {t.familiesJoined} ✨
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
