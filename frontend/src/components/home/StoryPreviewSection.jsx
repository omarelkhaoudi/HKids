import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '../../components/Icons';
import { KidsBookCover } from '../kids/KidsBookCover';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getAgeGroupById, parseAgeGroupId, ALL_AGES_ID } from '../../constants/ageGroups';

export default function StoryPreviewSection({ books, t, selectedAge = '' }) {
  const reducedMotion = useReducedMotion();

  if (!books || books.length === 0) return null;

  const displayBooks = books.slice(0, 4);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: reducedMotion ? 0 : 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const ageId = parseAgeGroupId(selectedAge);
  const ageGroup = getAgeGroupById(ageId);
  const selectedAgeLabel = ageGroup && ageId !== ALL_AGES_ID
    ? (t[ageGroup.labelKey] || `${ageGroup.min}–${ageGroup.max}`)
    : '';

  return (
    <section id="popular-stories" className="bg-background py-12 md:py-16 relative z-10" aria-labelledby="popular-stories-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 id="popular-stories-title" className="brand-section-title">
              {selectedAge ? selectedAgeLabel : t.homePopularStories}
            </h2>
            {selectedAge && (
              <p className="text-sm text-foreground-secondary mt-2">
                {displayBooks.length} {displayBooks.length === 1 ? t.booksFound : t.booksFoundPlural}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link
              to="/stories"
              className="text-primary-600 font-bold hover:text-primary-700 flex items-center gap-1 text-sm sm:text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-full px-2 py-1"
            >
              {t.homeSeeFullLibrary}
              <ChevronRightIcon className="w-4 h-4" aria-hidden="true" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {displayBooks.map((book) => (
            <motion.div
              key={book.id}
              variants={itemVariants}
              whileHover={reducedMotion ? undefined : { y: -8, scale: 1.02 }}
              className="h-full"
            >
              <Link
                to="/stories"
                className="block h-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300 rounded-3xl"
                aria-label={`${book.title} — ${t.homePreviewInLibrary}`}
              >
                <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.1)] border border-surface-100 transition-all duration-300 h-full flex flex-col group">
                  <div className="relative aspect-[3/4] overflow-hidden bg-surface-100">
                    <KidsBookCover
                      book={book}
                      alt=""
                      imgClassName="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transform-none"
                    />
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg text-surface-900 mb-1 line-clamp-2 group-hover:text-foreground-600 transition-colors">
                      {book.title}
                    </h3>

                    <div className="mt-auto flex items-center justify-between pt-2 gap-2">
                      <span className="text-sm font-medium text-surface-500 truncate">
                        {book.category_name || t.homeForAllAges}
                      </span>
                      <span className="text-xs font-bold text-primary-600 whitespace-nowrap">
                        {t.homePreviewInLibrary} →
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
