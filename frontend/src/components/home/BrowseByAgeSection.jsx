import { motion } from 'framer-motion';
import { ChevronRightIcon } from '../../components/Icons';
import { softSurfaceAtIndex, toneAtIndex } from '../../constants/brandTheme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

function countBooksForAge(books = [], ageRange) {
  if (!ageRange) return books.length;
  const [min, max] = ageRange.split('-').map(Number);
  return books.filter((book) => {
    const bookMin = book.age_group_min ?? 0;
    const bookMax = book.age_group_max ?? 12;
    return bookMin <= max && bookMax >= min;
  }).length;
}

const AGE_GROUPS = [
  { labelKey: 'age3to5', age: '3-5', titleKey: 'firstSteps', iconFallback: '🧸' },
  { labelKey: 'age6to8', age: '6-8', titleKey: 'shortStories', iconFallback: '🦖' },
  { labelKey: 'age9to12', age: '9-12', titleKey: 'adventures', iconFallback: '🦊' },
  { labelKey: 'allAges', age: '', titleKey: 'discoverLibrary', iconFallback: '🦄' },
];

export default function BrowseByAgeSection({ t, selectedAge, setSelectedAge, books = [] }) {
  const reducedMotion = useReducedMotion();

  return (
    <section id="books-section" className="bg-background py-12 md:py-16 relative z-10" aria-labelledby="browse-by-age-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 gap-4">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 id="browse-by-age-title" className="brand-section-title">{t.browseByAge}</h2>
            <p className="text-sm text-foreground-secondary mt-2 max-w-xl">{t.homeBrowseHint}</p>
          </motion.div>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <button
              type="button"
              onClick={() => {
                setSelectedAge('');
                document.getElementById('popular-stories')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
              }}
              className="text-primary-600 font-bold hover:text-primary-700 flex items-center gap-1 text-sm sm:text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-full px-2 py-1"
            >
              {t.homeSeeAllCategories}
              <ChevronRightIcon className="w-4 h-4" aria-hidden="true" />
            </button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {AGE_GROUPS.map((item, i) => {
            const isSelected = selectedAge === item.age;
            const tone = toneAtIndex(i);
            const count = countBooksForAge(books, item.age);
            const countLabel = count > 0
              ? `${count} ${count === 1 ? t.booksFound : t.booksFoundPlural}`
              : t.discoverLibrary;

            return (
              <motion.button
                key={item.labelKey}
                type="button"
                onClick={() => {
                  setSelectedAge(item.age);
                  document.getElementById('popular-stories')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
                }}
                initial={reducedMotion ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: reducedMotion ? 0 : i * 0.1, duration: 0.5 }}
                whileHover={reducedMotion ? undefined : { y: -5, scale: 1.02 }}
                whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                aria-pressed={isSelected}
                className={`w-full relative overflow-hidden rounded-[2rem] p-6 text-left transition-all duration-300 border-2
                  ${isSelected ? 'border-primary-500 shadow-lg' : 'border-transparent hover:border-border hover:shadow-md'}
                  ${softSurfaceAtIndex(i)} group h-full min-h-[160px] flex flex-col justify-between focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300`}
              >
                <div className="flex justify-between items-start z-10 relative">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${tone.bgColor} ${tone.color}`}>
                    {t[item.labelKey]}
                  </div>
                </div>

                <div className="mt-4 z-10 relative flex-1 flex flex-col justify-end">
                  <h3 className="text-xl font-bold text-foreground mb-1 leading-tight">{t[item.titleKey]}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-semibold text-foreground-secondary">{countLabel}</p>
                    <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-sm group-hover:bg-primary-500 group-hover:text-white transition-colors" aria-hidden="true">
                      <ChevronRightIcon className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-32 opacity-40 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none" aria-hidden="true">
                  <div className="absolute inset-0 flex items-center justify-center text-7xl select-none filter drop-shadow-md">
                    {item.iconFallback}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
