import { useLanguage } from '../context/LanguageContext';
import { LANGUAGE_OPTIONS } from '../utils/translations';

function LanguageSelector() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-0 rounded-2xl border border-surface-200 bg-surface-50 px-1 py-0.5 sm:px-2 sm:py-1" dir="ltr">
      {LANGUAGE_OPTIONS.map((option, index) => (
        <div key={option.id} className="flex items-center">
          {index > 0 && <div className="mx-0.5 h-4 w-px bg-surface-300 sm:mx-1 sm:h-5" />}
          <button
            type="button"
            onClick={() => changeLanguage(option.id)}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm ${
              language === option.id
                ? 'bg-primary-100 text-foreground-700'
                : 'text-surface-700 hover:bg-white hover:text-foreground-700'
            }`}
            lang={option.htmlLang}
            dir={option.dir}
            aria-pressed={language === option.id}
          >
            <span className="hidden sm:inline">{option.label}</span>
            <span className="sm:hidden">{option.shortLabel}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

export default LanguageSelector;
