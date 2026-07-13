import { useLanguage } from '../context/LanguageContext';

export function SkipToContent() {
  const { t } = useLanguage();

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10000] focus:rounded-xl focus:bg-surface-900 focus:px-4 focus:py-2 focus:text-white focus:font-bold focus:shadow-lg"
    >
      {t('skipToContent')}
    </a>
  );
}
