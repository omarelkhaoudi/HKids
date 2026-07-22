import { storage } from './storage';
import { normalizeLanguage, translate, getLocaleFromLanguage } from './translations';

export function getAppLanguage() {
  const prefs = storage.getPreferences();
  return normalizeLanguage(prefs.language);
}

export function i18nT(key, replacements) {
  return translate(getAppLanguage(), key, replacements);
}

export { getLocaleFromLanguage };
