import { motion } from 'framer-motion';
import { BookIcon, LockIcon, MoonIcon, ShieldIcon } from '../../components/Icons';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { toneAtIndex } from '../../constants/brandTheme';

const TRUST_PILLARS = [
  { titleKey: 'homeTrustCalmTitle', bodyKey: 'homeTrustCalmBody', Icon: MoonIcon },
  { titleKey: 'homeTrustSafeTitle', bodyKey: 'homeTrustSafeBody', Icon: ShieldIcon },
  { titleKey: 'homeTrustQualityTitle', bodyKey: 'homeTrustQualityBody', Icon: BookIcon },
  { titleKey: 'homeTrustPrivacyTitle', bodyKey: 'homeTrustPrivacyBody', Icon: LockIcon },
];

export default function TestimonialsSection() {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();

  return (
    <section className="hkids-section bg-gradient-to-b from-secondary-50/40 via-white to-background" aria-labelledby="home-trust-title">
      <div className="hkids-section-inner">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 max-w-3xl"
        >
          <span className="hkids-section-eyebrow mb-4">{t('footerCompany')}</span>
          <h2 id="home-trust-title" className="brand-section-title">{t('homeTrustTitle')}</h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          {TRUST_PILLARS.map((pillar, i) => {
            const tone = toneAtIndex(i);
            const Icon = pillar.Icon;
            return (
              <motion.article
                key={pillar.titleKey}
                initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: reducedMotion ? 0 : i * 0.08, duration: 0.5 }}
                whileHover={reducedMotion ? undefined : { y: -4 }}
                className="brand-surface-card h-full p-6"
              >
                <div className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl ${tone.bgColor} ${tone.color} border ${tone.borderColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-black text-foreground">{t(pillar.titleKey)}</h3>
                <p className="text-sm font-semibold leading-relaxed text-foreground-secondary">{t(pillar.bodyKey)}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
