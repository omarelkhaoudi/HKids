import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ClockIcon, BrainIcon } from '../../components/Icons';
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
        transition: { duration: 0.6 },
      };

  return (
    <section className="bg-background py-12 md:py-20 relative z-20" aria-labelledby="home-book-highlight-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div {...motionProps}>
          <div className="bg-gradient-to-br from-primary-50 via-secondary-50/60 to-accent-50/40 rounded-[2.5rem] p-8 md:p-12 lg:p-16 shadow-soft border border-primary-100 relative overflow-hidden">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary-200/25 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5 flex flex-col items-start text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-100 text-accent-700 rounded-full text-sm font-bold mb-6">
                  <span aria-hidden="true">✨</span>
                  {t.homeStoryHighlight}
                </div>

                <h2 id="home-book-highlight-title" className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-6 leading-tight">
                  {book.title}
                </h2>

                {book.description && (
                  <p className="text-lg text-surface-600 mb-8 leading-relaxed">
                    {book.description.length > 150
                      ? `${book.description.substring(0, 150)}...`
                      : book.description}
                  </p>
                )}

                <Link to="/stories" className="w-full sm:w-auto">
                  <motion.button
                    type="button"
                    whileHover={reducedMotion ? undefined : { scale: 1.03, y: -2 }}
                    whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                    className="w-full sm:w-auto px-8 py-4 bg-primary-500 text-white rounded-full font-bold text-lg shadow-[0_8px_20px_-6px_rgba(123,62,184,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(123,62,184,0.6)] transition-all flex items-center justify-center gap-2 min-h-[3.25rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
                  >
                    {t.homePreviewInLibrary}
                    <span aria-hidden="true">→</span>
                  </motion.button>
                </Link>
              </div>

              <div className="lg:col-span-4 flex justify-center">
                <motion.div
                  whileHover={reducedMotion ? undefined : { scale: 1.02, rotateZ: 1 }}
                  className="relative w-full max-w-[16rem] sm:max-w-[18rem] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white z-20 kids-hero-cover !transform-none"
                >
                  <KidsBookCover
                    book={book}
                    alt={book.title}
                    imgClassName="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/15 to-transparent pointer-events-none" aria-hidden="true" />
                </motion.div>
              </div>

              <div className="lg:col-span-3 flex flex-col gap-6 pl-0 lg:pl-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0 text-surface-400" aria-hidden="true">🎂</div>
                  <div>
                    <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">{t.homeRecommendedAge}</div>
                    <div className="text-surface-900 font-bold text-lg">
                      {book.age_group_min !== undefined && book.age_group_max !== undefined
                        ? `${book.age_group_min}-${book.age_group_max}`
                        : t.homeForAllAges}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <ClockIcon className="w-6 h-6 text-surface-400 mt-1 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">{t.homeReadingTime}</div>
                    <div className="text-surface-900 font-bold text-lg">
                      {book.page_count ? `${Math.ceil(book.page_count * 0.5)} min` : '5 min'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <BrainIcon className="w-6 h-6 text-surface-400 mt-1 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">{t.homeEducationalValue}</div>
                    <div className="text-surface-900 font-bold text-lg">
                      {book.category_name || t.homeForAllAges}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
