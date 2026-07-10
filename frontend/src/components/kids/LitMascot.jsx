import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export function LitMascot({ className = '', size = 'default', showBubble = true }) {
  const { t } = useLanguage();
  const isLarge = size === 'large';

  return (
    <div className={`relative flex items-end gap-3 ${className}`} aria-hidden={!showBubble}>
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        className={`relative shrink-0 ${isLarge ? 'w-28 h-28 md:w-36 md:h-36' : 'w-20 h-20 md:w-24 md:h-24'}`}
      >
        <motion.span
          animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-2 -right-1 text-2xl md:text-3xl filter drop-shadow-md"
        >
          🌙
        </motion.span>

        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-400 via-violet-500 to-fuchsia-500 shadow-xl border-4 border-white/60 overflow-hidden">
          <div className="absolute inset-x-2 top-3 h-8 rounded-full bg-white/25 blur-sm" />
          <div className="absolute bottom-0 inset-x-0 h-[55%] bg-gradient-to-t from-indigo-900/50 to-transparent" />

          <div className={`absolute left-1/2 -translate-x-1/2 ${isLarge ? 'top-8' : 'top-6'} flex gap-3`}>
            <motion.span
              animate={{ scaleY: [1, 0.15, 1] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
              className={`block rounded-full bg-white ${isLarge ? 'w-3 h-3' : 'w-2.5 h-2.5'}`}
            />
            <motion.span
              animate={{ scaleY: [1, 0.15, 1] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, delay: 0.1 }}
              className={`block rounded-full bg-white ${isLarge ? 'w-3 h-3' : 'w-2.5 h-2.5'}`}
            />
          </div>

          <motion.span
            animate={{ scaleX: [1, 1.15, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute left-1/2 -translate-x-1/2 rounded-full border-b-4 border-white/90 ${isLarge ? 'bottom-7 w-8' : 'bottom-5 w-6'}`}
          />

          <motion.span
            animate={{ opacity: [0.4, 1, 0.4], y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-1 right-2 text-sm"
          >
            ✨
          </motion.span>
        </div>

        <motion.div
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 2.8, repeat: Infinity }}
          className={`absolute -bottom-1 ${isLarge ? '-left-3 text-xl' : '-left-2 text-base'}`}
        >
          📖
        </motion.div>
      </motion.div>

      {showBubble && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: -8 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 260 }}
          className={`relative rounded-[1.75rem] bg-white shadow-lg border-4 border-primary-100 px-4 py-3 ${isLarge ? 'max-w-[14rem]' : 'max-w-[11rem]'}`}
        >
          <div className="absolute -left-2 bottom-4 w-4 h-4 rotate-45 bg-white border-l-4 border-b-4 border-primary-100" />
          <p className="text-xs font-black uppercase tracking-wide text-primary-500 mb-0.5">
            {t('litMascotName')}
          </p>
          <p className={`font-black text-foreground-700 leading-tight ${isLarge ? 'text-base' : 'text-sm'}`}>
            {t('litMascotGreeting')}
          </p>
        </motion.div>
      )}
    </div>
  );
}
