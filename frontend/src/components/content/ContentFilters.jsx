import { CONTENT_LANGUAGES, localizeContentOptions } from '../../constants/contentOptions';
import { localizeContentAgeFilters, localizeContentLibraryCategories } from '../../constants/contentLibrary';
import { useLanguage } from '../../context/LanguageContext';
import { SearchIcon } from '../Icons';

export function ContentFilters({ filters, onChange, showCategory = true }) {
  const { language, isRtl, t } = useLanguage();
  const categories = localizeContentLibraryCategories(language);
  const ageFilters = localizeContentAgeFilters(language);
  const languages = localizeContentOptions(CONTENT_LANGUAGES, language);

  const updateFilter = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-surface-100 dark:bg-surface-800 dark:ring-surface-700">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <label className="relative block">
          <SearchIcon className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400 ${isRtl ? 'right-4' : 'left-4'}`} />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder={t('search')}
            className={`h-12 w-full rounded-2xl border border-surface-200 bg-surface-50 font-semibold outline-none transition focus:border-primary-400 focus:bg-white dark:border-surface-700 dark:bg-surface-700 dark:text-white ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
          />
        </label>

        {showCategory && (
          <select
            value={filters.category}
            onChange={(event) => updateFilter('category', event.target.value)}
            className="h-12 rounded-2xl border border-surface-200 bg-surface-50 px-4 font-bold outline-none transition focus:border-primary-400 dark:border-surface-700 dark:bg-surface-700 dark:text-white"
          >
            <option value="">{t('allCategories')}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </select>
        )}

        <select
          value={filters.age}
          onChange={(event) => updateFilter('age', event.target.value)}
          className="h-12 rounded-2xl border border-surface-200 bg-surface-50 px-4 font-bold outline-none transition focus:border-primary-400 dark:border-surface-700 dark:bg-surface-700 dark:text-white"
        >
          {ageFilters.map((age) => (
            <option key={age.id} value={age.value}>{age.label}</option>
          ))}
        </select>

        <select
          value={filters.language}
          onChange={(event) => updateFilter('language', event.target.value)}
          className="h-12 rounded-2xl border border-surface-200 bg-surface-50 px-4 font-bold outline-none transition focus:border-primary-400 dark:border-surface-700 dark:bg-surface-700 dark:text-white"
        >
          <option value="">{t('allLanguages')}</option>
          {languages.map((language) => (
            <option key={language.id} value={language.id}>{language.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
