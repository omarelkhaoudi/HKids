import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { toneAtIndex } from '../../constants/brandTheme';

const TRUST_PILLARS = [
  { titleKey: 'homeTrustCalmTitle', bodyKey: 'homeTrustCalmBody', emoji: '🌙' },
  { titleKey: 'homeTrustSafeTitle', bodyKey: 'homeTrustSafeBody', emoji: '🛡️' },
  { titleKey: 'homeTrustQualityTitle', bodyKey: 'homeTrustQualityBody', emoji: '📚' },
  { titleKey: 'homeTrustPrivacyTitle', bodyKey: 'homeTrustPrivacyBody', emoji: '🔒' },
];

export default function TestimonialsSection() {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();

  return (
    <section className="bg-background py-12 md:py-16 relative z-10" aria-labelledby="home-trust-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center md:text-start"
        >
          <h2 id="home-trust-title" className="brand-section-title">{t('homeTrustTitle')}</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {TRUST_PILLARS.map((pillar, i) => {
            const tone = toneAtIndex(i);
            return (
              <motion.article
                key={pillar.titleKey}
                initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: reducedMotion ? 0 : i * 0.08, duration: 0.5 }}
                whileHover={reducedMotion ? undefined : { y: -4 }}
                className="brand-surface-card p-6 hover:shadow-medium transition-all duration-300 h-full"
              >
                <div className={`w-12 h-12 rounded-2xl ${tone.bgColor} flex items-center justify-center text-2xl mb-4`} aria-hidden="true">
                  {pillar.emoji}
                </div>
                <h3 className="font-bold text-foreground mb-2">{t(pillar.titleKey)}</h3>
                <p className="text-sm text-foreground-secondary leading-relaxed">{t(pillar.bodyKey)}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
