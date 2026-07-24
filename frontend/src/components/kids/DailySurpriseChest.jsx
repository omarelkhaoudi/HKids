import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { luLabel } from '../../constants/learningUniverseLabels';
import { playKidsUiSound } from '../../utils/kidsUiSound';
import { BRAND_CONFETTI } from '../../constants/brandTheme';

export function DailySurpriseChest({
  claimed = false,
  language = 'fr',
  onOpen,
  reducedMotion = false,
}) {
  const [reward, setReward] = useState(null);
  const [opening, setOpening] = useState(false);

  const handleOpen = () => {
    if (claimed || opening) return;
    setOpening(true);
    playKidsUiSound('success');
    const result = onOpen?.();
    if (result?.claimed) {
      setReward(result.reward);
    }
    setTimeout(() => setOpening(false), 1200);
  };

  return (
    <section className="rounded-32 bg-gradient-to-br from-amber-300 to-orange-500 p-space-24 text-white shadow-card relative overflow-hidden">
      {!reducedMotion && opening && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.span
              key={i}
              className={`absolute w-2 h-2 rounded-sm ${BRAND_CONFETTI[i % BRAND_CONFETTI.length]}`}
              initial={{ x: '50%', y: '50%', opacity: 1 }}
              animate={{
                x: `${20 + Math.random() * 60}%`,
                y: `${10 + Math.random() * 80}%`,
                opacity: 0,
              }}
              transition={{ duration: 1 }}
            />
          ))}
        </div>
      )}
      <p className="text-caption font-bold opacity-90 mb-2">{luLabel('luDailyChest', language)}</p>
      <div className="flex items-center gap-4">
        <motion.button
          type="button"
          whileTap={reducedMotion || claimed ? undefined : { scale: 0.92 }}
          onClick={handleOpen}
          disabled={claimed}
          className="text-6xl min-h-[72px] min-w-[72px] grid place-items-center rounded-24 bg-white/20 border border-white/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
          aria-label={luLabel('luOpenChest', language)}
        >
          {claimed ? '✨' : '🎁'}
        </motion.button>
        <div className="min-w-0">
          <p className="text-heading-m font-black">
            {claimed ? luLabel('luChestClaimed', language) : luLabel('luOpenChest', language)}
          </p>
          <AnimatePresence>
            {reward && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-body font-bold mt-1"
              >
                {luLabel('luYouWon', language)}: {reward.emoji} {luLabel(reward.labelKey, language)}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default DailySurpriseChest;
