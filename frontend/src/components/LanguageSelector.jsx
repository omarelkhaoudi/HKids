import { useLanguage } from '../context/LanguageContext';

function LanguageSelector() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-0 rounded-2xl border border-surface-200 bg-surface-50 px-1 py-0.5 sm:px-2 sm:py-1">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 sm:px-3 py-1 sm:py-1.5 font-medium transition-colors text-xs sm:text-sm rounded ${
          language === 'en'
            ? 'text-foreground-700 bg-primary-100'
            : 'text-surface-700 hover:text-foreground-700 hover:bg-white'
        }`}
      >
        <span className="hidden sm:inline">English</span>
        <span className="sm:hidden">EN</span>
      </button>
      <div className="w-px h-4 sm:h-5 bg-surface-300 mx-0.5 sm:mx-1"></div>
      <button
        onClick={() => changeLanguage('fr')}
        className={`px-2 sm:px-3 py-1 sm:py-1.5 font-medium transition-colors text-xs sm:text-sm rounded ${
          language === 'fr'
            ? 'text-foreground-700 bg-primary-100'
            : 'text-surface-700 hover:text-foreground-700 hover:bg-white'
        }`}
      >
        <span className="hidden sm:inline">Français</span>
        <span className="sm:hidden">FR</span>
      </button>
    </div>
  );
}

export default LanguageSelector;

