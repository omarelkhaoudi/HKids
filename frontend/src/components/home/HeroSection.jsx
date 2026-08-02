import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AudioIcon, BookIcon, ChildIcon, PlayIcon, SparklesIcon, StarIcon } from '../../components/Icons';
import { Button } from '../ui/Button';
import { LandingRoleSelector } from '../landing/LandingRoleSelector';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const trustItems = [
  { icon: ChildIcon, labelKey: 'trustSecure' },
  { icon: BookIcon, labelKey: 'trustEducationalContent' },
  { icon: SparklesIcon, labelKey: 'trustNoAdsLong' },
];

export default function HeroSection({ t, totalBooks }) {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const catalogLabel = totalBooks > 0
    ? (t.landingCatalogCount || '').replace('{count}', String(totalBooks))
    : t.discoverLibrary;

  const floatingMotion = reducedMotion
    ? {}
    : {
        animate: { y: [0, -12, 0], rotate: [0, 1.5, 0] },
        transition: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
      };

  return (
    <section className="hkids-section min-h-[calc(100vh-5rem)] bg-gradient-to-br from-white via-primary-50/70 to-secondary-50/45 pt-10 md:pt-16 lg:pt-20">
      <div className="hkids-ambient-field" aria-hidden="true" />
      <div className="absolute inset-0 hkids-soft-grid opacity-60" aria-hidden="true" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-hkids-brown opacity-30"
            style={{
              left: `${(i * 19 + 8) % 96}%`,
              top: `${(i * 29 + 12) % 88}%`,
            }}
            animate={reducedMotion ? undefined : { y: [0, -10, 0], opacity: [0.2, 0.48, 0.2] }}
            transition={reducedMotion ? undefined : { duration: 5 + (i % 4), repeat: Infinity, delay: i * 0.18 }}
          >
            <StarIcon className="h-4 w-4 md:h-6 md:w-6" />
          </motion.div>
        ))}
      </div>

      <div className="hkids-section-inner">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14 xl:gap-20">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="text-center lg:text-start"
          >
            <div className="hkids-section-eyebrow mb-6">
              <span className="h-2 w-2 rounded-full bg-hkids-green" aria-hidden="true" />
              {t.heroBadge}
            </div>

            <h1 className="mx-auto max-w-4xl text-5xl font-black leading-[0.98] tracking-normal text-foreground sm:text-6xl lg:mx-0 lg:text-7xl xl:text-8xl">
              {t.heroTitle1}
              <span className="block text-primary-600">{t.heroTitle2}</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg font-semibold leading-relaxed text-foreground-secondary sm:text-xl lg:mx-0">
              {t.heroDescription}
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-4 sm:flex-row lg:justify-start">
              <div className="flex flex-col items-center gap-2 lg:items-start">
                <Button
                  size="lg"
                  className="w-full rounded-full px-9 shadow-floating sm:w-auto"
                  onClick={() => navigate('/parent/signup')}
                >
                  {t.startFree}
                </Button>
                <p className="px-2 text-xs font-bold text-foreground-muted">{t.landingHeroPrimaryHint}</p>
              </div>
              <div className="flex flex-col items-center gap-2 lg:items-start">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-full px-9 bg-white/90 sm:w-auto"
                  onClick={() => navigate('/stories')}
                >
                  {t.viewDemo}
                </Button>
                <p className="px-2 text-xs font-bold text-foreground-muted">{t.landingHeroDemoHint}</p>
              </div>
            </div>

            <div className="mt-8">
              <LandingRoleSelector />
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {trustItems.map(({ icon: Icon, labelKey }, index) => (
                <motion.div
                  key={labelKey}
                  initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: reducedMotion ? 0 : 0.18 + index * 0.08 }}
                  className="rounded-3xl border border-border bg-white/78 px-4 py-3 text-start shadow-soft backdrop-blur"
                >
                  <Icon className="mb-2 h-5 w-5 text-primary-600" />
                  <p className="text-sm font-extrabold leading-snug text-foreground-secondary">{t[labelKey]}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: reducedMotion ? 0 : 0.15, ease: 'easeOut' }}
            className="relative mx-auto w-full max-w-2xl"
          >
            <motion.div
              {...floatingMotion}
              className="absolute -left-3 top-12 z-20 hidden w-24 rotate-[-8deg] rounded-3xl border border-hkids-green-light bg-white p-3 shadow-floating sm:block"
              aria-hidden="true"
            >
              <div className="h-24 rounded-2xl bg-gradient-to-br from-primary-100 to-white" />
              <div className="mt-3 h-2 rounded-full bg-hkids-green-light" />
              <div className="mt-2 h-2 w-2/3 rounded-full bg-hkids-brown-light" />
            </motion.div>

            <motion.div
              animate={reducedMotion ? undefined : { y: [0, 10, 0], rotate: [5, 3, 5] }}
              transition={reducedMotion ? undefined : { duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-2 bottom-20 z-20 hidden w-28 rotate-[5deg] rounded-3xl border border-hkids-brown-light bg-white p-3 shadow-floating md:block"
              aria-hidden="true"
            >
              <div className="h-28 rounded-2xl bg-gradient-to-br from-hkids-brown-light to-white" />
              <div className="mt-3 h-2 rounded-full bg-hkids-brown-light" />
              <div className="mt-2 h-2 w-3/4 rounded-full bg-hkids-green-light" />
            </motion.div>

            <div className="hkids-premium-surface rounded-[2.75rem] p-4 sm:p-6">
              <div className="relative z-10 rounded-[2.25rem] border border-white/80 bg-white/75 p-4 shadow-soft backdrop-blur md:p-6">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border-[10px] border-foreground bg-foreground shadow-floating">
                  <img
                    src="/enfant3ans.webp"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-white/10" aria-hidden="true" />

                  <div className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-sm font-black text-primary-700 shadow-soft backdrop-blur">
                    HKids
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 rounded-[1.5rem] border border-white/35 bg-white/90 p-4 shadow-card backdrop-blur">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-foreground">{t.homeStoryHighlight}</p>
                        <p className="text-xs font-bold text-foreground-secondary">{catalogLabel}</p>
                      </div>
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-500 text-white shadow-soft">
                        <PlayIcon className="h-5 w-5 translate-x-0.5" />
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-100">
                      <motion.div
                        className="h-full rounded-full bg-primary-500"
                        initial={{ width: '18%' }}
                        animate={reducedMotion ? undefined : { width: ['18%', '68%', '18%'] }}
                        transition={reducedMotion ? undefined : { duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    { icon: BookIcon, label: t.homeLibrary },
                    { icon: AudioIcon, label: t.footerCreativeAi },
                    { icon: SparklesIcon, label: t.homeFeaturesTitle },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="rounded-3xl border border-border bg-white/80 p-3 text-center shadow-soft">
                      <Icon className="mx-auto mb-2 h-5 w-5 text-primary-600" />
                      <p className="truncate text-xs font-black text-foreground-secondary">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
