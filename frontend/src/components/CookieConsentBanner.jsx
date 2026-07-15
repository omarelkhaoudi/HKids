import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { BRAND_SEMANTIC } from '../constants/brandTheme';
import {
  hasDecided,
  acceptAll,
  acceptEssentialOnly,
  updateConsent,
  getConsent,
} from '../services/privacy/consentService';

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <span className="relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
        style={{ background: checked ? '#3b82f6' : '#d1d5db' }}>
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      </span>
      <span>
        <span className="text-sm font-bold text-foreground block">{label}</span>
        <span className="text-xs text-foreground-secondary leading-tight">{description}</span>
      </span>
    </label>
  );
}

export function hasCookieConsent() {
  return hasDecided();
}

export function CookieConsentBanner() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [choices, setChoices] = useState({ analytics: true, ai: true, local_storage: true });

  useEffect(() => {
    setVisible(!hasDecided());
  }, []);

  const handleAcceptAll = () => {
    acceptAll();
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    acceptEssentialOnly();
    setVisible(false);
  };

  const handleSaveChoices = () => {
    updateConsent(choices);
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
            {t('consentTitle')}
          </p>
          <p className="text-sm font-medium text-foreground-secondary leading-relaxed mb-4">
            {t('consentBody')}
          </p>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 mb-4 p-4 rounded-xl bg-surface-secondary/60">
                  <div className="flex items-start gap-3 opacity-60">
                    <span className="relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-blue-500">
                      <span className="inline-block h-4 w-4 rounded-full bg-white shadow translate-x-4" />
                    </span>
                    <span>
                      <span className="text-sm font-bold text-foreground block">{t('consentEssentialLabel')}</span>
                      <span className="text-xs text-foreground-secondary">{t('consentEssentialDesc')}</span>
                    </span>
                  </div>
                  <Toggle
                    checked={choices.analytics}
                    onChange={() => setChoices((prev) => ({ ...prev, analytics: !prev.analytics }))}
                    label={t('consentAnalyticsLabel')}
                    description={t('consentAnalyticsDesc')}
                  />
                  <Toggle
                    checked={choices.ai}
                    onChange={() => setChoices((prev) => ({ ...prev, ai: !prev.ai }))}
                    label={t('consentAiLabel')}
                    description={t('consentAiDesc')}
                  />
                  <Toggle
                    checked={choices.local_storage}
                    onChange={() => setChoices((prev) => ({ ...prev, local_storage: !prev.local_storage }))}
                    label={t('consentStorageLabel')}
                    description={t('consentStorageDesc')}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleAcceptAll}
              className={`flex-1 rounded-full px-5 py-3 text-sm font-black text-white shadow-md ${BRAND_SEMANTIC.info.solid} hover:opacity-90 transition`}
            >
              {t('consentAcceptAll')}
            </button>
            {showDetails ? (
              <button
                type="button"
                onClick={handleSaveChoices}
                className="rounded-full px-5 py-3 text-sm font-bold text-foreground-secondary border border-border hover:bg-surface-secondary transition"
              >
                {t('consentSaveChoices')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEssentialOnly}
                className="rounded-full px-5 py-3 text-sm font-bold text-foreground-secondary border border-border hover:bg-surface-secondary transition"
              >
                {t('consentEssentialOnly')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="rounded-full px-5 py-3 text-sm font-bold text-foreground-secondary hover:text-foreground transition"
            >
              {showDetails ? t('consentHideDetails') : t('consentShowDetails')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
