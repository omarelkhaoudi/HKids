import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../ToastProvider';
import { reportsAPI } from '../../api/reports';
import { Button } from '../ui';
import { XIcon, WarningIcon } from '../Icons';

const REASON_KEYS = [
  'reportReasonInappropriate',
  'reportReasonScary',
  'reportReasonLanguage',
  'reportReasonTechnical',
  'reportReasonOther',
];

export function ContentReportModal({
  isOpen,
  onClose,
  targetType = 'book',
  targetId,
  targetTitle = '',
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [reasonKey, setReasonKey] = useState(REASON_KEYS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!targetId) return;
    setSubmitting(true);
    try {
      const reason = t(reasonKey);
      const response = await reportsAPI.create({
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      });
      if (response.data?.duplicate) {
        showToast(t('reportAlreadySubmitted'), 'info');
      } else {
        showToast(t('reportSubmitted'), 'success');
      }
      setDetails('');
      onClose();
    } catch (error) {
      showToast(error.response?.data?.error || t('reportSubmitError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl border border-border"
            role="dialog"
            aria-labelledby="content-report-title"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-accent-50 p-2 text-accent-600">
                  <WarningIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="content-report-title" className="text-xl font-black text-foreground">
                    {t('reportContentTitle')}
                  </h2>
                  {targetTitle && (
                    <p className="text-sm font-medium text-foreground-muted line-clamp-2">{targetTitle}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 hover:bg-surface-secondary transition"
                aria-label={t('close')}
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <fieldset>
                <legend className="text-sm font-bold text-foreground-secondary mb-2">
                  {t('reportReasonLabel')}
                </legend>
                <div className="space-y-2">
                  {REASON_KEYS.map((key) => (
                    <label
                      key={key}
                      className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 cursor-pointer transition ${
                        reasonKey === key
                          ? 'border-primary-400 bg-primary-50'
                          : 'border-border hover:border-primary-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        checked={reasonKey === key}
                        onChange={() => setReasonKey(key)}
                        className="accent-primary-500"
                      />
                      <span className="text-sm font-bold text-foreground">{t(key)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block">
                <span className="text-sm font-bold text-foreground-secondary mb-2 block">
                  {t('reportDetailsLabel')}
                </span>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder={t('reportDetailsPlaceholder')}
                  className="w-full rounded-2xl border-2 border-border bg-surface-secondary px-4 py-3 text-sm font-medium outline-none focus:border-primary-400 focus:bg-card"
                />
              </label>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" fullWidth onClick={onClose}>
                  {t('close')}
                </Button>
                <Button type="submit" variant="primary" fullWidth disabled={submitting}>
                  {submitting ? t('loading') : t('reportSubmit')}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
