import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('fr'); // 'fr' ou 'en'

  useEffect(() => {
    // Charger la langue depuis les préférences
    const prefs = storage.getPreferences();
    if (prefs.language) {
      setLanguage(prefs.language);
    } else {
      // Détecter la langue du navigateur
      const browserLang = navigator.language || navigator.userLanguage;
      const detectedLang = browserLang.startsWith('fr') ? 'fr' : 'en';
      setLanguage(detectedLang);
      storage.setPreference('language', detectedLang);
    }
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    storage.setPreference('language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

