import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BrainIcon, ChevronRightIcon, ClockIcon, SparklesIcon, StarIcon } from '../../components/Icons';
import { KidsBookCover } from '../kids/KidsBookCover';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export default function BookOfTheWeekSection({ book, t }) {
  const reducedMotion = useReducedMotion();

  if (!book) return null;

  const motionProps = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-100px' },
        transition: { duration: 0.6, ease: 'easeOut' },
      };

  const description = book.description?.length > 170
    ? `${book.description.substring(0, 170)}...`
    : book.description;

  const meta = [
    {
      icon: StarIcon,
      label: t.homeRecommendedAge,
      value: book.age_group_min !== undefined && book.age_group_max !== undefined
        ? `${book.age_group_min}-${book.age_group_max}`
        : t.homeForAllAges,
    },
    {
      icon: ClockIcon,
      label: t.homeReadingTime,
      value: book.page_count ? `${Math.ceil(book.page_count * 0.5)} min` : '5 min',
    },
    {
      icon: BrainIcon,
      label: t.homeEducationalValue,
      value: book.category_name || t.homeForAllAges,
    },
  ];

  return (
    <section className="hkids-section bg-gradient-to-b from-primary-50/40 via-background to-white" aria-labelledby="home-book-highlight-title">
      <div className="hkids-section-inner">
        <motion.div {...motionProps} className="hkids-premium-surface p-5 md:p-8 lg:p-10">
          <div className="relative z-10 grid gap-10 lg:grid-cols-[0.88fr_0.72fr_0.7fr] lg:items-center">
            <div>
              <span className="hkids-section-eyebrow border-hkids-brown-light bg-hkids-brown-soft text-hkids-brown-darker">
                <SparklesIcon className="h-4 w-4" />
                {t.homeStoryHighlight}
              </span>

              <h2 id="home-book-highlight-title" className="mt-5 text-4xl font-black leading-[1.05] text-foreground md:text-5xl">
                {book.title}
              </h2>

              {description && (
                <p className="mt-5 max-w-xl text-lg font-semibold leading-relaxed text-foreground-secondary">
                  {description}
                </p>
              )}

              <Link to="/stories" className="mt-8 inline-flex">
                <span className="inline-flex min-h-touch items-center justify-center gap-2 rounded-full bg-primary-500 px-8 py-4 text-base font-black text-white shadow-floating transition hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300">
                  {t.homePreviewInLibrary}
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </span>
              </Link>
            </div>

            <motion.div
              whileHover={reducedMotion ? undefined : { y: -6, rotateZ: 1.5 }}
              transition={{ duration: 0.25 }}
              className="relative mx-auto w-full max-w-[18rem]"
            >
              <div className="absolute -inset-5 rounded-[2.25rem] bg-primary-100/70 blur-2xl" aria-hidden="true" />
              <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] border-[10px] border-white bg-primary-50 shadow-floating">
                <KidsBookCover
                  book={book}
                  alt={book.title}
                  imgClassName="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/35 via-transparent to-transparent" aria-hidden="true" />
              </div>
            </motion.div>

            <div className="grid gap-4">
              {meta.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-[1.5rem] border border-border bg-white/80 p-5 shadow-soft backdrop-blur">
                  <div className="flex items-start gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-50 text-primary-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-normal text-foreground-muted">{label}</div>
                      <div className="mt-1 text-lg font-black text-foreground">{value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
