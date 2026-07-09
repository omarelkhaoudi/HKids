import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { storage } from '../utils/storage';
import {
  DEFAULT_LANGUAGE,
  getLanguageOption,
  isRtlLanguage,
  normalizeLanguage,
  translate,
} from '../utils/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    const prefs = storage.getPreferences();
    if (prefs.language) {
      setLanguage(normalizeLanguage(prefs.language));
      return;
    }

    const browserLang = navigator.language || navigator.userLanguage;
    const detectedLang = normalizeLanguage(browserLang, DEFAULT_LANGUAGE);
    setLanguage(detectedLang);
    storage.setPreference('language', detectedLang);
  }, []);

  useEffect(() => {
    const option = getLanguageOption(language);
    document.documentElement.setAttribute('lang', option.htmlLang);
    document.documentElement.setAttribute('dir', option.dir);
    document.documentElement.classList.toggle('rtl', option.dir === 'rtl');
    document.body?.setAttribute('dir', option.dir);
  }, [language]);

  const value = useMemo(() => {
    const option = getLanguageOption(language);
    return {
      language,
      direction: option.dir,
      isRtl: isRtlLanguage(language),
      changeLanguage: (lang) => {
        const normalized = normalizeLanguage(lang);
        setLanguage(normalized);
        storage.setPreference('language', normalized);
      },
      t: (key, replacements) => translate(language, key, replacements),
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
