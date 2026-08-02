import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '../../components/Icons';
import { KidsBookCover } from '../kids/KidsBookCover';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getAgeGroupById, parseAgeGroupId, ALL_AGES_ID } from '../../constants/ageGroups';

export default function StoryPreviewSection({ books, t, selectedAge = '' }) {
  const reducedMotion = useReducedMotion();
  const ageId = parseAgeGroupId(selectedAge);
  const ageGroup = getAgeGroupById(ageId);
  const selectedAgeLabel = ageGroup && ageId !== ALL_AGES_ID
    ? (t[ageGroup.labelKey] || `${ageGroup.min}-${ageGroup.max}`)
    : '';
  const displayBooks = (books || []).slice(0, 4);

  if (displayBooks.length === 0) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: reducedMotion ? 0 : 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <section id="popular-stories" className="hkids-section bg-gradient-to-b from-white via-background to-primary-50/40" aria-labelledby="popular-stories-title">
      <div className="absolute inset-0 hkids-soft-grid opacity-35" aria-hidden="true" />
      <div className="hkids-section-inner">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <motion.div
            key={`title-${ageId}`}
            initial={reducedMotion ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
          >
            <span className="hkids-section-eyebrow mb-4">{t.homeStoryHighlight}</span>
            <h2 id="popular-stories-title" className="brand-section-title">
              {selectedAge ? selectedAgeLabel : t.homePopularStories}
            </h2>
            {selectedAge && (
              <p className="mt-3 text-sm font-bold text-foreground-secondary">
                {books.length} {books.length === 1 ? t.booksFound : t.booksFoundPlural}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Link
              to="/stories"
              className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-5 py-3 text-sm font-black text-primary-700 shadow-soft transition hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
            >
              {t.homeSeeFullLibrary}
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          key={`stories-${ageId}-${displayBooks.map((book) => book.id).join(',')}`}
          variants={containerVariants}
          initial={reducedMotion ? false : 'hidden'}
          animate="visible"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        >
          {displayBooks.map((book) => (
            <motion.div
              key={book.id}
              variants={itemVariants}
              whileHover={reducedMotion ? undefined : { y: -8, scale: 1.015 }}
              className="h-full"
            >
              <Link
                to="/stories"
                className="block h-full rounded-[2rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
                aria-label={`${book.title} - ${t.homePreviewInLibrary}`}
              >
                <div className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-border bg-white p-3 shadow-card transition-all duration-300 hover:border-primary-200 hover:shadow-floating">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-primary-50">
                    <KidsBookCover
                      book={book}
                      alt=""
                      imgClassName="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transform-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/42 via-transparent to-white/5" aria-hidden="true" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-primary-700 shadow-soft backdrop-blur">
                        {book.page_count ? `${Math.ceil(book.page_count * 0.5)} min` : '5 min'}
                      </span>
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-500 text-white shadow-soft">
                        <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-3 pt-5">
                    <h3 className="line-clamp-2 text-xl font-black leading-tight text-foreground transition-colors group-hover:text-primary-700">
                      {book.title}
                    </h3>

                    <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                      <span className="truncate rounded-full bg-secondary-50 px-3 py-1 text-xs font-black text-secondary-800">
                        {book.category_name || t.homeForAllAges}
                      </span>
                      <span className="whitespace-nowrap text-xs font-black text-primary-700">
                        {t.homePreviewInLibrary}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
