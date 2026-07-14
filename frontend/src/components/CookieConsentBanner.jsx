import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { BRAND_SEMANTIC } from '../constants/brandTheme';

const CONSENT_KEY = 'hkids_cookie_consent_v1';

export function hasCookieConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'accepted';
  } catch {
    return false;
  }
}

export function CookieConsentBanner() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasCookieConsent());
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'accepted');
    } catch {
      // ignore storage errors
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          role="dialog"
          aria-labelledby="cookie-consent-title"
          className="fixed inset-x-4 bottom-4 z-[110] mx-auto max-w-2xl rounded-2xl border border-border bg-card/95 p-5 shadow-2xl backdrop-blur-md md:inset-x-6 md:bottom-6 md:p-6"
        >
          <p id="cookie-consent-title" className="text-base font-black text-foreground mb-2">
            {t('cookieConsentTitle')}
          </p>
          <p className="text-sm font-medium text-foreground-secondary leading-relaxed mb-4">
            {t('cookieConsentBody')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={accept}
              className={`flex-1 rounded-full px-5 py-3 text-sm font-black text-white shadow-md ${BRAND_SEMANTIC.info.solid} hover:opacity-90 transition`}
            >
              {t('cookieConsentAccept')}
            </button>
            <button
              type="button"
              onClick={accept}
              className="rounded-full px-5 py-3 text-sm font-bold text-foreground-secondary border border-border hover:bg-surface-secondary transition"
            >
              {t('cookieConsentEssential')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
