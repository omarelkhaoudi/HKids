import { useCallback, useEffect, useState } from 'react';
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
  CATEGORIES,
} from '../../services/privacy/consentService';
import { AlertIcon, CheckCircleIcon, HistoryIcon, ShieldIcon } from '../Icons';
import { Button, Input } from '../ui';
import { useToast } from '../ToastProvider';

const ACTION_LABELS = {
  privacy_export_viewed: 'Export consulté',
  privacy_export_downloaded: 'Export RGPD téléchargé',
  privacy_local_data_cleared: 'Données locales effacées',
  kid_profile_deleted_permanently: 'Profil enfant supprimé',
  parent_account_deleted_permanently: 'Compte supprimé',
  consent_updated: 'Consentement modifié',
  consent_revoked: 'Consentement révoqué',
};

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

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
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [logs, setLogs] = useState([]);
  const [exportSummary, setExportSummary] = useState(null);
  const [busyAction, setBusyAction] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [consent, setConsent] = useState(() => getConsent());

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
        Les opérations RGPD sont disponibles depuis un compte parent.
      </div>
    );
  }

  const requirePassword = () => {
    if (password.trim()) return true;
    showToast('Confirmez votre mot de passe pour continuer.', 'error');
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
      showToast('Export personnel préparé.', 'success');
      await loadLogs();
    } catch (error) {
      showToast(error.response?.data?.error || 'Export impossible.', 'error');
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
      showToast(`${filename} téléchargé.`, 'success');
      await loadLogs();
    } catch (error) {
      showToast(error.response?.data?.error || 'Téléchargement impossible.', 'error');
    } finally {
      setBusyAction('');
    }
  };

  const clearDeviceData = async () => {
    const confirmed = window.confirm(
      'Effacer les téléchargements, files de synchronisation et données HKids stockées sur cet appareil ?'
    );
    if (!confirmed) return;
    try {
      setBusyAction('local');
      const result = await clearLocalPrivacyData({ includeAuthentication: false });
      await privacyAPI.logLocalDataCleared().catch((error) => {
        console.warn('Local erasure succeeded but could not be logged:', error);
      });
      showToast(
        `${result.local_storage_keys + result.session_storage_keys} élément(s) local(aux) supprimé(s).`,
        'success'
      );
      await loadLogs();
    } catch (error) {
      showToast(error.response?.data?.error || error.message || 'Nettoyage local impossible.', 'error');
    } finally {
      setBusyAction('');
    }
  };

  const deleteAccount = async () => {
    if (!requirePassword() || confirmation !== 'SUPPRIMER') return;
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
      showToast('Votre compte et ses données ont été supprimés définitivement.', 'success');
      navigate('/parent/login', { replace: true });
    } catch (error) {
      showToast(error.response?.data?.error || 'Suppression impossible.', 'error');
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
            <h4 className="font-bold">Confirmation de sécurité</h4>
            <p className="mt-1 text-sm text-foreground-muted">
              Votre mot de passe est vérifié par l’API avant tout export ou suppression.
            </p>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mot de passe actuel"
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
          <h4 className="font-bold">Export de vos données</h4>
          <p className="mt-2 text-sm text-foreground-muted">
            Prépare une copie structurée de votre compte, des profils enfants, activités,
            histoires, abonnements, voix et journaux.
          </p>
          <Button
            variant="outline"
            className="mt-5"
            disabled={Boolean(busyAction)}
            onClick={prepareExport}
          >
            {busyAction === 'export' ? 'Préparation…' : 'Préparer l’export'}
          </Button>
          {exportSummary && (
            <div className="mt-4 rounded-xl bg-surface-secondary p-3 text-xs text-foreground-secondary">
              {exportSummary.children} profil(s) enfant · {exportSummary.stories} histoire(s) ·{' '}
              {exportSummary.logs} événement(s)
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <h4 className="font-bold">Téléchargement RGPD</h4>
          <p className="mt-2 text-sm text-foreground-muted">
            Télécharge un fichier JSON portable. Le navigateur ne le met pas en cache.
          </p>
          <Button
            className="mt-5"
            disabled={Boolean(busyAction)}
            onClick={downloadExport}
          >
            {busyAction === 'download' ? 'Téléchargement…' : 'Télécharger mes données'}
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <h4 className="font-bold">Données stockées sur cet appareil</h4>
        <p className="mt-2 text-sm text-foreground-muted">
          Efface IndexedDB, les téléchargements hors ligne, les caches HKids et les
          files de synchronisation sans supprimer votre compte.
        </p>
        <Button
          variant="outline"
          className="mt-5"
          disabled={Boolean(busyAction)}
          onClick={clearDeviceData}
        >
          {busyAction === 'local' ? 'Suppression…' : 'Effacer les données locales'}
        </Button>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h4 className="flex items-center gap-2 font-bold">
              <HistoryIcon className="h-4 w-4" /> Journal de confidentialité
            </h4>
            <p className="mt-1 text-sm text-foreground-muted">
              Historique des exports et suppressions liés à votre compte.
            </p>
          </div>
          <Button variant="ghost" onClick={loadLogs}>Actualiser</Button>
        </div>
        <div className="divide-y divide-border">
          {logs.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircleIcon className="h-4 w-4 text-secondary-500" />
                {ACTION_LABELS[entry.action] || entry.action}
              </span>
              <time className="text-xs text-foreground-muted">{formatDate(entry.created_at)}</time>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="py-4 text-sm text-foreground-muted">Aucune opération enregistrée.</p>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-danger-200 bg-danger-50/40 p-6">
        <h4 className="flex items-center gap-2 font-bold text-danger-700">
          <AlertIcon className="h-5 w-5" /> Suppression définitive
        </h4>
        <p className="mt-2 text-sm text-danger-700/80">
          Supprime le compte, les profils enfants, les données cloud, les fichiers vocaux
          et le client Stripe. Cette action est irréversible.
        </p>
        <Button
          className="mt-5 bg-danger-500 text-white hover:bg-danger-600"
          onClick={() => setShowDeleteConfirmation(true)}
        >
          Supprimer définitivement mon compte
        </Button>
      </div>

      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-surface-900/60 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6">
            <h3 className="text-xl font-black text-danger-600">Confirmer la suppression</h3>
            <p className="mt-3 text-sm text-foreground-muted">
              Saisissez <strong>SUPPRIMER</strong>. Votre mot de passe renseigné plus haut
              sera vérifié une dernière fois.
            </p>
            <Input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="SUPPRIMER"
              className="mt-5"
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
                Annuler
              </Button>
              <Button
                disabled={confirmation !== 'SUPPRIMER' || busyAction === 'delete'}
                className="bg-danger-500 text-white hover:bg-danger-600"
                onClick={deleteAccount}
              >
                {busyAction === 'delete' ? 'Suppression…' : 'Supprimer irréversiblement'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
