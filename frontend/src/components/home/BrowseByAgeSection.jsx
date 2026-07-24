import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRightIcon } from '../../components/Icons';
import { softSurfaceAtIndex, toneAtIndex } from '../../constants/brandTheme';
import {
  AGE_GROUPS,
  ALL_AGES_ID,
  countBooksByAgeGroup,
  kidsLibraryAgePath,
  parseAgeGroupId,
} from '../../constants/ageGroups';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const HOME_AGE_CARDS = [
  ...AGE_GROUPS,
  {
    id: ALL_AGES_ID,
    min: null,
    max: null,
    emoji: '🦄',
    titleKey: 'discoverLibrary',
    labelKey: 'allAges',
  },
];

export default function BrowseByAgeSection({ t, selectedAge, setSelectedAge, books = [] }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const reducedMotion = useReducedMotion();
  const activeAge = parseAgeGroupId(selectedAge || searchParams.get('age'));

  const applyAge = (ageId) => {
    const next = parseAgeGroupId(ageId);
    setSelectedAge(next === ALL_AGES_ID ? '' : next);
    if (next === ALL_AGES_ID) {
      const params = new URLSearchParams(searchParams);
      params.delete('age');
      setSearchParams(params);
    } else {
      const params = new URLSearchParams(searchParams);
      params.set('age', next);
      setSearchParams(params);
    }
  };

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
              onClick={() => navigate(kidsLibraryAgePath(activeAge))}
              className="text-primary-600 font-bold hover:text-primary-700 flex items-center gap-1 text-sm sm:text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-full px-2 py-1"
            >
              {t.homeSeeAllCategories}
              <ChevronRightIcon className="w-4 h-4" aria-hidden="true" />
            </button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {HOME_AGE_CARDS.map((item, i) => {
            const isSelected = activeAge === item.id
              || (item.id === ALL_AGES_ID && (!selectedAge || selectedAge === ALL_AGES_ID || selectedAge === ''));
            const tone = toneAtIndex(i);
            const count = countBooksByAgeGroup(books, item.id);
            const label = t[item.labelKey] || `${item.min}–${item.max}`;
            const title = t[item.titleKey] || label;
            const countLabel = `${count} ${count === 1 ? t.booksFound : t.booksFoundPlural}`;

            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => {
                  applyAge(item.id);
                  document.getElementById('popular-stories')?.scrollIntoView({
                    behavior: reducedMotion ? 'auto' : 'smooth',
                  });
                }}
                onDoubleClick={() => navigate(kidsLibraryAgePath(item.id))}
                initial={reducedMotion ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: reducedMotion ? 0 : i * 0.06, duration: 0.45 }}
                whileHover={reducedMotion ? undefined : { y: -5, scale: 1.02 }}
                whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                aria-pressed={isSelected}
                aria-label={`${label} — ${countLabel}`}
                className={`w-full relative overflow-hidden rounded-[2rem] p-6 text-left transition-all duration-300 border-2
                  ${isSelected ? 'border-primary-500 shadow-lg' : 'border-transparent hover:border-border hover:shadow-md'}
                  ${softSurfaceAtIndex(i)} group h-full min-h-[160px] flex flex-col justify-between focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300`}
              >
                <div className="flex justify-between items-start z-10 relative">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${tone.bgColor} ${tone.color}`}>
                    <span aria-hidden="true" className="me-1">{item.emoji}</span>
                    {label}
                  </div>
                </div>

                <div className="mt-4 z-10 relative flex-1 flex flex-col justify-end">
                  <h3 className="text-xl font-bold text-foreground mb-1 leading-tight">{title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-semibold text-foreground-secondary">{countLabel}</p>
                    <div
                      className="w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-sm group-hover:bg-primary-500 group-hover:text-white transition-colors"
                      aria-hidden="true"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(kidsLibraryAgePath(item.id));
                      }}
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-32 opacity-40 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none" aria-hidden="true">
                  <div className="absolute inset-0 flex items-center justify-center text-7xl select-none filter drop-shadow-md">
                    {item.emoji}
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
