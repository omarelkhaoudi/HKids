import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { privacyAPI } from '../../api/privacy';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  clearLocalPrivacyData,
  downloadPrivacyBlob
} from '../../services/privacy/privacyStorageService';
import {
  getConsent,
  updateConsent,
  revokeAllConsent,
  exportConsentData,
} from '../../services/privacy/consentService';
import { AlertIcon, CheckCircleIcon, HistoryIcon, ShieldIcon } from '../Icons';
import { Button, Input } from '../ui';
import { useToast } from '../ToastProvider';

function ConsentToggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer py-2">
      <span>
        <span className="text-sm font-bold text-foreground block">{label}</span>
        <span className="text-xs text-foreground-muted">{description}</span>
      </span>
      <span className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
        style={{ background: checked ? '#3b82f6' : '#d1d5db' }}>
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      </span>
    </label>
  );
}

export default function PrivacyCenter() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [logs, setLogs] = useState([]);
  const [exportSummary, setExportSummary] = useState(null);
  const [busyAction, setBusyAction] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [consent, setConsent] = useState(() => getConsent());

  const dateLocale = language === 'ar' ? 'ar' : language === 'en' ? 'en-US' : 'fr-FR';
  const deleteWord = t('parentPrivacyDeleteConfirmWord');

  const formatDate = useCallback((value) => {
    if (!value) return '—';
    return new Intl.DateTimeFormat(dateLocale, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }, [dateLocale]);

  const actionLabels = useMemo(() => ({
    privacy_export_viewed: t('parentPrivacyActionExportViewed'),
    privacy_export_downloaded: t('parentPrivacyActionExportDownloaded'),
    privacy_local_data_cleared: t('parentPrivacyActionLocalCleared'),
    kid_profile_deleted_permanently: t('parentPrivacyActionKidDeleted'),
    parent_account_deleted_permanently: t('parentPrivacyActionAccountDeleted'),
    consent_updated: t('parentPrivacyActionConsentUpdated'),
    consent_revoked: t('parentPrivacyActionConsentRevoked'),
  }), [t]);

  const loadLogs = useCallback(async () => {
    if (user?.role !== 'parent') return;
    try {
      const response = await privacyAPI.getLogs({ limit: 20, offset: 0 });
      setLogs(response.data?.items || []);
    } catch (error) {
      console.error('Could not load privacy logs:', error);
    }
  }, [user?.role]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  if (user?.role !== 'parent') {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-foreground-muted">
        {t('parentPrivacyParentOnly')}
      </div>
    );
  }

  const requirePassword = () => {
    if (password.trim()) return true;
    showToast(t('parentPrivacyPasswordRequired'), 'error');
    return false;
  };

  const prepareExport = async () => {
    if (!requirePassword()) return;
    try {
      setBusyAction('export');
      const response = await privacyAPI.exportData(password);
      const data = response.data?.data;
      setExportSummary({
        generatedAt: data?.generated_at,
        children: data?.children?.length || 0,
        stories: data?.generated_stories?.length || 0,
        logs: data?.security_logs?.length || 0
      });
      showToast(t('parentPrivacyExportReady'), 'success');
      await loadLogs();
    } catch (error) {
      showToast(error.response?.data?.error || t('parentSomethingWrong'), 'error');
    } finally {
      setBusyAction('');
    }
  };

  const downloadExport = async () => {
    if (!requirePassword()) return;
    try {
      setBusyAction('download');
      const response = await privacyAPI.downloadData(password);
      const filename = downloadPrivacyBlob(response);
      showToast(t('parentPrivacyDownloadSuccess', { filename }), 'success');
      await loadLogs();
    } catch (error) {
      showToast(error.response?.data?.error || t('parentSomethingWrong'), 'error');
    } finally {
      setBusyAction('');
    }
  };

  const clearDeviceData = async () => {
    const confirmed = window.confirm(t('parentPrivacyClearLocalConfirm'));
    if (!confirmed) return;
    try {
      setBusyAction('local');
      const result = await clearLocalPrivacyData({ includeAuthentication: false });
      await privacyAPI.logLocalDataCleared().catch((error) => {
        console.warn('Local erasure succeeded but could not be logged:', error);
      });
      showToast(
        t('parentPrivacyClearLocalSuccess', {
          count: result.local_storage_keys + result.session_storage_keys
        }),
        'success'
      );
      await loadLogs();
    } catch (error) {
      showToast(error.response?.data?.error || error.message || t('parentSomethingWrong'), 'error');
    } finally {
      setBusyAction('');
    }
  };

  const deleteAccount = async () => {
    if (!requirePassword() || confirmation !== deleteWord) return;
    try {
      setBusyAction('delete');
      await privacyAPI.deleteAccount(password);
      let localPurgeCompleted = true;
      try {
        await clearLocalPrivacyData({ includeAuthentication: true });
      } catch (error) {
        localPurgeCompleted = false;
        localStorage.setItem('privacy_purge_pending', 'true');
        console.warn('Account was deleted but local purge must be retried:', error);
      }
      logout({ purgeLocalData: false });
      if (localPurgeCompleted) localStorage.removeItem('privacy_purge_pending');
      showToast(t('parentPrivacyDeleteSuccess'), 'success');
      navigate('/parent/login', { replace: true });
    } catch (error) {
      showToast(error.response?.data?.error || t('parentSomethingWrong'), 'error');
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-primary-50 p-3 text-foreground-600">
            <ShieldIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold">{t('parentPrivacySecurityTitle')}</h4>
            <p className="mt-1 text-sm text-foreground-muted">
              {t('parentPrivacySecurityDesc')}
            </p>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t('parentPrivacyPasswordPlaceholder')}
              className="mt-4 max-w-md"
            />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <h4 className="font-bold flex items-center gap-2">
          <ShieldIcon className="h-4 w-4" /> {t('consentPreferencesTitle')}
        </h4>
        <p className="mt-2 text-sm text-foreground-muted">
          {t('consentPreferencesDesc')}
        </p>
        <div className="mt-4 divide-y divide-border">
          <div className="py-2 opacity-60">
            <span className="text-sm font-bold text-foreground block">{t('consentEssentialLabel')}</span>
            <span className="text-xs text-foreground-muted">{t('consentEssentialDesc')}</span>
          </div>
          <ConsentToggle
            checked={consent?.analytics ?? false}
            onChange={() => {
              const updated = updateConsent({ analytics: !consent?.analytics });
              setConsent(updated);
              showToast(t('consentUpdated'), 'success');
            }}
            label={t('consentAnalyticsLabel')}
            description={t('consentAnalyticsDesc')}
          />
          <ConsentToggle
            checked={consent?.ai ?? false}
            onChange={() => {
              const updated = updateConsent({ ai: !consent?.ai });
              setConsent(updated);
              showToast(t('consentUpdated'), 'success');
            }}
            label={t('consentAiLabel')}
            description={t('consentAiDesc')}
          />
          <ConsentToggle
            checked={consent?.local_storage ?? false}
            onChange={() => {
              const updated = updateConsent({ local_storage: !consent?.local_storage });
              setConsent(updated);
              showToast(t('consentUpdated'), 'success');
            }}
            label={t('consentStorageLabel')}
            description={t('consentStorageDesc')}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => {
              const data = exportConsentData();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `hkids-consent-${new Date().toISOString().slice(0, 10)}.json`;
              document.body.appendChild(link);
              link.click();
              link.remove();
              URL.revokeObjectURL(url);
              showToast(t('consentExported'), 'success');
            }}
          >
            {t('consentExportBtn')}
          </Button>
          <Button
            className="bg-danger-500 text-white hover:bg-danger-600"
            onClick={() => {
              revokeAllConsent();
              setConsent(getConsent());
              showToast(t('consentRevoked'), 'success');
            }}
          >
            {t('consentRevokeBtn')}
          </Button>
        </div>
        {consent?.revoked_at && (
          <p className="mt-3 text-xs text-danger-600">
            {t('consentRevokedAt')}: {formatDate(consent.revoked_at)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h4 className="font-bold">{t('parentPrivacyExportTitle')}</h4>
          <p className="mt-2 text-sm text-foreground-muted">
            {t('parentPrivacyExportDesc')}
          </p>
          <Button
            variant="outline"
            className="mt-5"
            disabled={Boolean(busyAction)}
            onClick={prepareExport}
          >
            {busyAction === 'export' ? t('parentPrivacyExportPreparing') : t('parentPrivacyExportPrepare')}
          </Button>
          {exportSummary && (
            <div className="mt-4 rounded-xl bg-surface-secondary p-3 text-xs text-foreground-secondary">
              {t('parentPrivacyExportSummary', {
                children: exportSummary.children,
                stories: exportSummary.stories,
                logs: exportSummary.logs,
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <h4 className="font-bold">{t('parentPrivacyDownloadTitle')}</h4>
          <p className="mt-2 text-sm text-foreground-muted">
            {t('parentPrivacyDownloadDesc')}
          </p>
          <Button
            className="mt-5"
            disabled={Boolean(busyAction)}
            onClick={downloadExport}
          >
            {busyAction === 'download' ? t('parentPrivacyDownloading') : t('parentPrivacyDownloadAction')}
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <h4 className="font-bold">{t('parentPrivacyClearLocalTitle')}</h4>
        <p className="mt-2 text-sm text-foreground-muted">
          {t('parentPrivacyClearLocalDesc')}
        </p>
        <Button
          variant="outline"
          className="mt-5"
          disabled={Boolean(busyAction)}
          onClick={clearDeviceData}
        >
          {busyAction === 'local' ? t('parentPrivacyDeleteConfirming') : t('parentPrivacyClearLocalTitle')}
        </Button>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h4 className="flex items-center gap-2 font-bold">
              <HistoryIcon className="h-4 w-4" /> {t('parentPrivacyActivityLog')}
            </h4>
            <p className="mt-1 text-sm text-foreground-muted">
              {t('parentPrivacyActivityLogDesc')}
            </p>
          </div>
          <Button variant="ghost" onClick={loadLogs}>{t('parentPrivacyRefresh')}</Button>
        </div>
        <div className="divide-y divide-border">
          {logs.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircleIcon className="h-4 w-4 text-secondary-500" />
                {actionLabels[entry.action] || entry.action}
              </span>
              <time className="text-xs text-foreground-muted">{formatDate(entry.created_at)}</time>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="py-4 text-sm text-foreground-muted">{t('parentPrivacyNoLogs')}</p>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-danger-200 bg-danger-50/40 p-6">
        <h4 className="flex items-center gap-2 font-bold text-danger-700">
          <AlertIcon className="h-5 w-5" /> {t('parentPrivacyDeleteTitle')}
        </h4>
        <p className="mt-2 text-sm text-danger-700/80">
          {t('parentPrivacyDeleteSectionDesc')}
        </p>
        <Button
          className="mt-5 bg-danger-500 text-white hover:bg-danger-600"
          onClick={() => setShowDeleteConfirmation(true)}
        >
          {t('parentPrivacyDeleteTitle')}
        </Button>
      </div>

      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-surface-900/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6">
            <h3 className="text-xl font-black text-danger-600">{t('parentPrivacyDeleteConfirmTitle')}</h3>
            <p className="mt-3 text-sm text-foreground-muted">
              {t('parentPrivacyDeleteConfirmDesc', { word: deleteWord })}
            </p>
            <Input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={deleteWord}
              className="mt-5"
              aria-label={deleteWord}
            />
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="ghost"
                disabled={busyAction === 'delete'}
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setConfirmation('');
                }}
              >
                {t('parentCancel')}
              </Button>
              <Button
                disabled={confirmation !== deleteWord || busyAction === 'delete'}
                className="bg-danger-500 text-white hover:bg-danger-600"
                onClick={deleteAccount}
              >
                {busyAction === 'delete' ? t('parentPrivacyDeleteConfirming') : t('parentPrivacyDeleteConfirmBtn')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
