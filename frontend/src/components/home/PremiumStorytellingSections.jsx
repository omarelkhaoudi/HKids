import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ActivityIcon,
  AudioIcon,
  BookIcon,
  BrainIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  GraduationIcon,
  LockIcon,
  PlayIcon,
  ShieldIcon,
  SparklesIcon,
  StarIcon,
} from '../../components/Icons';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Button } from '../ui/Button';

const copy = {
  fr: {
    experienceEyebrow: 'Experience HKids',
    experienceTitle: 'Chaque histoire devient un rituel calme et memorable.',
    experienceBody: 'HKids transforme la lecture en moment doux: une scene lisible, une narration apaisante, des controles simples et un chemin qui donne envie de revenir.',
    stageTitle: 'Le voyage de lecture',
    stageMeta: 'Lecture, audio, progression',
    playLabel: 'Lire maintenant',
    journey: [
      { title: 'Choisir un univers', body: 'Des categories claires pour trouver rapidement le bon livre.' },
      { title: 'Entrer dans l histoire', body: 'Une lecture immersive avec voix, ambiance et rythme confortable.' },
      { title: 'Grandir doucement', body: 'Les progres et recommandations guident chaque enfant sans pression.' },
    ],
    trustEyebrow: 'Pour toute la famille',
    trustTitle: 'Un produit premium qui rassure les parents et inspire les enfants.',
    trustBody: 'Les espaces enfants, parents et admin gardent le meme langage visuel: calme, naturel, structure et accessible.',
    pillars: [
      { title: 'Parents en confiance', body: 'Suivi clair, profils enfants, historique, favoris et recommandations utiles.' },
      { title: 'Narration IA douce', body: 'Creation d histoires et audio guides dans un environnement minimal et securise.' },
      { title: 'Apprentissage naturel', body: 'Parcours, defis et badges sobres pour encourager la curiosite.' },
    ],
    premiumEyebrow: 'HKids Premium',
    premiumTitle: 'Une experience plus riche sans devenir bruyante.',
    premiumBody: 'Le premium utilise le brun HKids, les surfaces creme et des accents verts pour rester elegant, chaleureux et lisible.',
    premiumFeatures: ['Histoires IA personnalisees', 'Audio et voix familiales', 'Bibliotheque calme hors ligne', 'Tableau de bord parent'],
    primaryCta: 'Commencer gratuitement',
    secondaryCta: 'Explorer la bibliotheque',
    faqTitle: 'Questions frequentes',
    faqs: [
      { q: 'HKids est-il adapte aux jeunes enfants ?', a: 'Oui. Les interfaces utilisent de grands controles, des contrastes lisibles et une atmosphere volontairement calme.' },
      { q: 'Les parents gardent-ils le controle ?', a: 'Oui. Les espaces parents permettent de suivre les progres, profils, contenus et preferences.' },
      { q: 'La partie IA change-t-elle la securite ?', a: 'Non. L experience IA reste integree au parcours HKids et conserve les protections du projet.' },
    ],
  },
  en: {
    experienceEyebrow: 'HKids Experience',
    experienceTitle: 'Every story becomes a calm, memorable ritual.',
    experienceBody: 'HKids turns reading into a gentle moment: a readable stage, soothing narration, simple controls, and a path children want to revisit.',
    stageTitle: 'The reading journey',
    stageMeta: 'Reading, audio, progress',
    playLabel: 'Read now',
    journey: [
      { title: 'Choose a world', body: 'Clear categories help each child find the right book quickly.' },
      { title: 'Enter the story', body: 'Immersive reading with voice, ambience, and a comfortable pace.' },
      { title: 'Grow gently', body: 'Progress and recommendations guide every child without pressure.' },
    ],
    trustEyebrow: 'For the whole family',
    trustTitle: 'A premium product parents trust and children feel drawn to.',
    trustBody: 'Kids, parents, and admin spaces share one visual language: calm, natural, structured, and accessible.',
    pillars: [
      { title: 'Parent confidence', body: 'Clear progress, child profiles, history, favorites, and useful recommendations.' },
      { title: 'Gentle AI narration', body: 'Story creation and audio guidance in a minimal, protected environment.' },
      { title: 'Natural learning', body: 'Paths, challenges, and quiet badges encourage curiosity.' },
    ],
    premiumEyebrow: 'HKids Premium',
    premiumTitle: 'A richer experience without visual noise.',
    premiumBody: 'Premium uses HKids brown, cream surfaces, and green accents to stay elegant, warm, and readable.',
    premiumFeatures: ['Personalized AI stories', 'Audio and family voices', 'Calm offline library', 'Parent dashboard'],
    primaryCta: 'Start for free',
    secondaryCta: 'Explore library',
    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'Is HKids suitable for young children?', a: 'Yes. Interfaces use large controls, readable contrast, and an intentionally calm atmosphere.' },
      { q: 'Do parents stay in control?', a: 'Yes. Parent spaces support progress, profiles, content, and preferences.' },
      { q: 'Does AI change safety?', a: 'No. AI stays inside the HKids experience and keeps the project protections.' },
    ],
  },
  ar: {
    experienceEyebrow: 'تجربة HKids',
    experienceTitle: 'كل قصة تصبح لحظة قراءة هادئة ومميزة.',
    experienceBody: 'HKids يجعل القراءة تجربة دافئة: شاشة واضحة، سرد هادئ، تحكم بسيط، ومسار يشجع الطفل على العودة.',
    stageTitle: 'رحلة القراءة',
    stageMeta: 'قراءة، صوت، تقدم',
    playLabel: 'ابدأ القراءة',
    journey: [
      { title: 'اختيار عالم', body: 'تصنيفات واضحة تساعد الطفل على إيجاد القصة المناسبة.' },
      { title: 'الدخول إلى القصة', body: 'قراءة مريحة مع صوت وإيقاع هادئ.' },
      { title: 'نمو تدريجي', body: 'تقدم وتوصيات تشجع الطفل بدون ضغط.' },
    ],
    trustEyebrow: 'لكل العائلة',
    trustTitle: 'منتج راق يطمئن الآباء ويلهم الأطفال.',
    trustBody: 'مساحات الأطفال والآباء والإدارة تستعمل لغة بصرية واحدة: هادئة، طبيعية، منظمة وسهلة.',
    pillars: [
      { title: 'ثقة الآباء', body: 'متابعة واضحة، ملفات الأطفال، التاريخ، المفضلات والتوصيات.' },
      { title: 'سرد ذكي هادئ', body: 'إنشاء القصص والصوت داخل تجربة بسيطة وآمنة.' },
      { title: 'تعلم طبيعي', body: 'مسارات وتحديات وشارات هادئة تشجع الفضول.' },
    ],
    premiumEyebrow: 'HKids Premium',
    premiumTitle: 'تجربة أغنى بدون ضجيج بصري.',
    premiumBody: 'يستعمل Premium اللون البني الرسمي، أسطح كريمية، ولمسات خضراء حتى يبقى دافئا وواضحا.',
    premiumFeatures: ['قصص ذكية مخصصة', 'أصوات عائلية', 'مكتبة هادئة دون اتصال', 'لوحة متابعة للآباء'],
    primaryCta: 'ابدأ مجانا',
    secondaryCta: 'استكشف المكتبة',
    faqTitle: 'أسئلة شائعة',
    faqs: [
      { q: 'هل HKids مناسب للأطفال الصغار؟', a: 'نعم. الواجهات تعتمد أزرارا كبيرة، تباينا واضحا وجوا هادئا.' },
      { q: 'هل يبقى التحكم لدى الآباء؟', a: 'نعم. مساحة الآباء تدعم التقدم، الملفات، المحتوى والتفضيلات.' },
      { q: 'هل يغير الذكاء الاصطناعي الأمان؟', a: 'لا. يبقى الذكاء الاصطناعي داخل تجربة HKids مع نفس الحماية.' },
    ],
  },
};

const pillarIcons = [ShieldIcon, AudioIcon, GraduationIcon];
const journeyIcons = [BookIcon, PlayIcon, ActivityIcon];

function MotionBlock({ children, className = '', delay = 0 }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay: reducedMotion ? 0 : delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function PremiumStorytellingSections() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const c = copy[language] || copy.fr;

  return (
    <>
      <section className="hkids-section bg-gradient-to-b from-background via-white to-primary-50/40" aria-labelledby="hkids-experience-title">
        <div className="hkids-ambient-field" aria-hidden="true" />
        <div className="hkids-section-inner">
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <MotionBlock>
              <span className="hkids-section-eyebrow">
                <SparklesIcon className="h-4 w-4" />
                {c.experienceEyebrow}
              </span>
              <h2 id="hkids-experience-title" className="brand-section-title mt-5 max-w-3xl">
                {c.experienceTitle}
              </h2>
              <p className="hkids-section-copy">{c.experienceBody}</p>

              <div className="mt-8 space-y-4">
                {c.journey.map((item, index) => {
                  const Icon = journeyIcons[index] || BookIcon;
                  return (
                    <div key={item.title} className="flex gap-4 rounded-[1.75rem] border border-border bg-white/80 p-4 shadow-soft">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-50 text-primary-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-foreground">{item.title}</h3>
                        <p className="mt-1 text-sm font-semibold leading-relaxed text-foreground-secondary">{item.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </MotionBlock>

            <MotionBlock className="relative" delay={0.08}>
              <div className="hkids-premium-surface p-4 md:p-6">
                <div className="relative z-10 rounded-[2rem] bg-white/90 p-5 shadow-soft md:p-7">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black uppercase tracking-normal text-primary-700">{c.stageMeta}</p>
                      <h3 className="mt-1 text-2xl font-black text-foreground">{c.stageTitle}</h3>
                    </div>
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-primary-500 text-white shadow-card">
                      <PlayIcon className="h-6 w-6 translate-x-0.5" />
                    </div>
                  </div>

                  <div className="mt-7 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                    <div className="relative min-h-[18rem] overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-primary-50 to-secondary-50 p-5">
                      <div className="absolute inset-0 hkids-soft-grid opacity-55" aria-hidden="true" />
                      <motion.div
                        animate={reducedMotion ? undefined : { y: [0, -9, 0], rotate: [-3, -1, -3] }}
                        transition={reducedMotion ? undefined : { duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute left-8 top-8 h-40 w-28 rotate-[-3deg] rounded-3xl border border-hkids-green-light bg-white p-3 shadow-floating"
                        aria-hidden="true"
                      >
                        <div className="h-full rounded-2xl bg-gradient-to-br from-primary-100 via-white to-secondary-100" />
                      </motion.div>
                      <motion.div
                        animate={reducedMotion ? undefined : { y: [0, 10, 0], rotate: [6, 3, 6] }}
                        transition={reducedMotion ? undefined : { duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute bottom-8 right-8 h-44 w-32 rotate-[6deg] rounded-3xl border border-hkids-brown-light bg-white p-3 shadow-floating"
                        aria-hidden="true"
                      >
                        <div className="h-full rounded-2xl bg-gradient-to-br from-hkids-brown-light via-white to-primary-50" />
                      </motion.div>
                      <StarIcon className="absolute right-16 top-10 h-8 w-8 text-hkids-brown opacity-50" />
                      <StarIcon className="absolute bottom-14 left-16 h-5 w-5 text-hkids-green opacity-50" />
                    </div>

                    <div className="flex flex-col justify-between gap-4 rounded-[2rem] border border-border bg-card p-5 shadow-soft">
                      <div className="space-y-4">
                        <div className="h-2 overflow-hidden rounded-full bg-primary-100">
                          <motion.div
                            className="h-full rounded-full bg-primary-500"
                            initial={{ width: '42%' }}
                            animate={reducedMotion ? undefined : { width: ['42%', '78%', '42%'] }}
                            transition={reducedMotion ? undefined : { duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-primary-50 p-3">
                            <ClockIcon className="mb-2 h-5 w-5 text-primary-700" />
                            <p className="text-xs font-black text-foreground-secondary">12 min</p>
                          </div>
                          <div className="rounded-2xl bg-secondary-50 p-3">
                            <BrainIcon className="mb-2 h-5 w-5 text-secondary-800" />
                            <p className="text-xs font-black text-foreground-secondary">Learning</p>
                          </div>
                        </div>
                      </div>
                      <Button size="md" className="w-full rounded-full" onClick={() => navigate('/stories')}>
                        {c.playLabel}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </MotionBlock>
          </div>
        </div>
      </section>

      <section className="hkids-section bg-gradient-to-b from-primary-50/40 via-white to-secondary-50/50" aria-labelledby="hkids-family-title">
        <div className="hkids-section-inner">
          <MotionBlock className="mx-auto max-w-3xl text-center">
            <span className="hkids-section-eyebrow">
              <LockIcon className="h-4 w-4" />
              {c.trustEyebrow}
            </span>
            <h2 id="hkids-family-title" className="brand-section-title mt-5">{c.trustTitle}</h2>
            <p className="hkids-section-copy mx-auto">{c.trustBody}</p>
          </MotionBlock>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {c.pillars.map((item, index) => {
              const Icon = pillarIcons[index] || ShieldIcon;
              return (
                <MotionBlock key={item.title} delay={index * 0.08}>
                  <div className="hkids-premium-surface h-full p-6">
                    <div className="relative z-10 flex h-full flex-col">
                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary-700 shadow-soft">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="mt-6 text-2xl font-black text-foreground">{item.title}</h3>
                      <p className="mt-3 text-base font-semibold leading-relaxed text-foreground-secondary">{item.body}</p>
                      <div className="mt-8 h-24 rounded-[1.5rem] border border-border bg-gradient-to-br from-white to-primary-50/70" />
                    </div>
                  </div>
                </MotionBlock>
              );
            })}
          </div>
        </div>
      </section>

      <section className="hkids-section bg-gradient-to-b from-secondary-50/50 via-background to-white" aria-labelledby="hkids-premium-title">
        <div className="hkids-ambient-field" aria-hidden="true" />
        <div className="hkids-section-inner">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <MotionBlock>
              <span className="hkids-section-eyebrow border-hkids-brown-light bg-hkids-brown-soft text-hkids-brown-darker">
                <StarIcon className="h-4 w-4" />
                {c.premiumEyebrow}
              </span>
              <h2 id="hkids-premium-title" className="brand-section-title mt-5">{c.premiumTitle}</h2>
              <p className="hkids-section-copy">{c.premiumBody}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="rounded-full px-8" onClick={() => navigate('/parent/signup')}>
                  {c.primaryCta}
                </Button>
                <Button variant="outline" size="lg" className="rounded-full px-8 bg-white/90" onClick={() => navigate('/stories')}>
                  {c.secondaryCta}
                </Button>
              </div>
            </MotionBlock>

            <MotionBlock delay={0.08}>
              <div className="hkids-premium-surface p-6 md:p-8">
                <div className="relative z-10 grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
                  <div className="rounded-[2rem] bg-hkids-brown-soft p-6 text-hkids-brown-darker shadow-soft">
                    <p className="text-sm font-black uppercase tracking-normal">{c.premiumEyebrow}</p>
                    <p className="mt-4 text-5xl font-black">HKids</p>
                    <p className="mt-2 text-sm font-bold text-hkids-brown-dark">Premium reading, calm by design.</p>
                  </div>

                  <div className="rounded-[2rem] border border-border bg-white/90 p-6 shadow-soft">
                    <ul className="space-y-4">
                      {c.premiumFeatures.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm font-extrabold text-foreground-secondary">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-50 text-primary-700">
                            <CheckIcon className="h-4 w-4" />
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </MotionBlock>
          </div>

          <MotionBlock className="mt-12" delay={0.1}>
            <div className="rounded-[2rem] border border-border bg-white/80 p-5 shadow-card md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h3 className="text-2xl font-black text-foreground">{c.faqTitle}</h3>
                <ChevronRightIcon className="hidden h-6 w-6 text-primary-600 sm:block" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {c.faqs.map((faq) => (
                  <details key={faq.q} className="group rounded-[1.5rem] border border-border bg-card p-5 shadow-soft">
                    <summary className="cursor-pointer list-none text-base font-black text-foreground focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300 rounded-xl">
                      {faq.q}
                    </summary>
                    <p className="mt-3 text-sm font-semibold leading-relaxed text-foreground-secondary">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </MotionBlock>
        </div>
      </section>
    </>
  );
}
