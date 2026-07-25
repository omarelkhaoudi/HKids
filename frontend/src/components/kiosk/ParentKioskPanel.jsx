import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Input } from '../ui';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../ToastProvider';
import { isNativeAndroid } from '../../services/mobile/capacitorRuntime';
import {
  getKioskExitCode,
  getKioskStatus,
  provisionKioskTablet,
  releaseKioskTablet,
  setKioskExitCode,
} from '../../services/mobile/kioskService';

/**
 * Parent-facing control for a dedicated HKids tablet. Renders nothing outside the
 * Android app, so the web dashboard is unchanged.
 */
export function ParentKioskPanel() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [status, setStatus] = useState(null);
  const [exitCode, setExitCode] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setStatus(await getKioskStatus());
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

export default ParentKioskPanel;
