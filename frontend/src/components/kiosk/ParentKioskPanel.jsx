import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Input } from '../ui';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../ToastProvider';
import { isNativeAndroid } from '../../services/mobile/capacitorRuntime';
import {
  getEmbeddedDiagnostics,
  getKioskExitCode,
  getKioskStatus,
  provisionKioskTablet,
  releaseKioskTablet,
  setKioskExitCode,
  summarizeEmbeddedHealth,
} from '../../services/mobile/kioskService';

/**
 * Parent-facing control for a dedicated HKids tablet. Renders nothing outside the
 * Android app, so the web dashboard is unchanged.
 */
export function ParentKioskPanel() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [status, setStatus] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [exitCode, setExitCode] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [nextStatus, nextDiagnostics] = await Promise.all([
      getKioskStatus(),
      getEmbeddedDiagnostics(),
    ]);
    setStatus(nextStatus);
    setDiagnostics({ ...nextDiagnostics, kioskEnabled: nextStatus.kioskEnabled });
  }, []);

  useEffect(() => {
    if (!isNativeAndroid()) return;
    setExitCode(getKioskExitCode());
    refresh();
  }, [refresh]);

  const toggleKiosk = useCallback(async () => {
    setBusy(true);
    try {
      const result = status?.kioskEnabled
        ? await releaseKioskTablet()
        : await provisionKioskTablet();

      if (!status?.kioskEnabled && !result.provisioned) {
        showToast(t('kioskPanelEnableFailed'), 'error');
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [refresh, showToast, status?.kioskEnabled, t]);

  const saveExitCode = useCallback(() => {
    if (setKioskExitCode(exitCode)) {
      showToast(t('kioskPanelExitCodeSaved'), 'success');
    } else {
      showToast(t('kioskPanelExitCodeInvalid'), 'error');
    }
  }, [exitCode, showToast, t]);

  if (!isNativeAndroid() || !status) return null;

  const deviceLabelKey = status.tablet ? 'kioskPanelTabletLabel' : 'kioskPanelPhoneLabel';
  const health = summarizeEmbeddedHealth(diagnostics);
  const healthLabels = {
    healthy: t('kioskPanelHealthHealthy'),
    warning: t('kioskPanelHealthWarning'),
    critical: t('kioskPanelHealthCritical'),
  };
  const healthTone = health.health === 'critical'
    ? 'border-danger-200 bg-danger-50 text-danger-700'
    : health.health === 'warning'
      ? 'border-warning-200 bg-warning-50 text-warning-700'
      : 'border-success-200 bg-success-50 text-success-700';

  return (
    <section className="parent-panel space-y-4" aria-label={t('kioskPanelTitle')}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{t('kioskPanelTitle')}</h3>
          <p className="mt-1 text-sm text-foreground-muted">{t('kioskPanelSubtitle')}</p>
        </div>
        <Badge variant={status.kioskEnabled ? 'success' : 'neutral'}>
          {status.kioskEnabled ? t('kioskPanelStatusActive') : t('kioskPanelStatusInactive')}
        </Badge>
      </header>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-foreground-muted">{t('kioskPanelDeviceLabel')}</dt>
          <dd className="font-semibold text-foreground">
            {t(deviceLabelKey, { width: status.smallestWidthDp ?? '—' })}
          </dd>
        </div>
        <div>
          <dt className="text-foreground-muted">{t('kioskExitTitle')}</dt>
          <dd className="font-semibold text-foreground">
            {status.deviceOwner ? t('kioskPanelDeviceOwner') : t('kioskPanelSoftMode')}
          </dd>
        </div>
      </dl>

      {!status.deviceOwner && (
        <p className="rounded-2xl bg-surface p-3 text-xs text-foreground-muted">
          {t('kioskPanelProvisionHint')}
        </p>
      )}

      {diagnostics && (
        <div className={`rounded-2xl border p-3 text-sm ${healthTone}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="font-semibold text-foreground">{t('kioskPanelDiagnosticsTitle')}</h4>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold">
              {healthLabels[health.health] || health.health}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-foreground">
            <div>
              <dt className="text-xs text-foreground-muted">{t('kioskPanelBattery')}</dt>
              <dd className="font-semibold">
                {formatPercent(diagnostics.battery?.percent)}
                {diagnostics.battery?.charging ? ` - ${t('kioskPanelCharging')}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-muted">{t('kioskPanelMemory')}</dt>
              <dd className="font-semibold">{formatPercent(diagnostics.memory?.availablePercent)}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-muted">{t('kioskPanelStorage')}</dt>
              <dd className="font-semibold">{formatPercent(diagnostics.storage?.availablePercent)}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-muted">{t('kioskPanelNetwork')}</dt>
              <dd className="font-semibold">
                {diagnostics.network?.connected ? diagnostics.network?.type || 'online' : 'offline'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-muted">{t('kioskPanelWakeLock')}</dt>
              <dd className="font-semibold">
                {diagnostics.webview?.wakeLockHeld
                  ? formatDuration(diagnostics.webview?.wakeLockRemainingMs)
                  : t('kioskPanelWakeLockOff')}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-muted">{t('kioskPanelRecoveryAttempts')}</dt>
              <dd className="font-semibold">{diagnostics.recoveryAttempts || 0}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[12rem] text-sm">
          <span className="text-foreground-muted">{t('kioskPanelExitCodeLabel')}</span>
          <Input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={exitCode}
            onChange={(event) => setExitCode(event.target.value)}
            className="mt-1"
          />
        </label>
        <Button variant="secondary" onClick={saveExitCode}>
          {t('kioskPanelExitCodeSave')}
        </Button>
      </div>

      <Button
        variant={status.kioskEnabled ? 'secondary' : 'primary'}
        onClick={toggleKiosk}
        disabled={busy}
        className="w-full"
      >
        {status.kioskEnabled ? t('kioskPanelDisable') : t('kioskPanelEnable')}
      </Button>
    </section>
  );
}

function formatPercent(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? `${Math.round(numeric)}%` : 'n/a';
}

function formatDuration(ms) {
  const numeric = Number(ms);
  if (!Number.isFinite(numeric) || numeric <= 0) return 'n/a';
  const hours = Math.floor(numeric / 3600000);
  const minutes = Math.floor((numeric % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(1, minutes)}m`;
}

export default ParentKioskPanel;
