import { useLanguage } from '../context/LanguageContext';

function LanguageSelector() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-0">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1.5 font-medium transition-colors ${
          language === 'en'
            ? 'text-blue-500'
            : 'text-gray-500 hover:text-gray-600'
        }`}
      >
        English
      </button>
      <div className="w-px h-5 bg-gray-300 mx-1"></div>
      <button
        onClick={() => changeLanguage('fr')}
        className={`px-3 py-1.5 font-medium transition-colors ${
          language === 'fr'
            ? 'text-blue-500'
            : 'text-gray-500 hover:text-gray-600'
        }`}
      >
        Français
      </button>
    </div>
  );
}

export default LanguageSelector;

