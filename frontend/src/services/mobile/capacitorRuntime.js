import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { unlockAndroidAudio } from './androidAudio';
import { cleanupAndroidNetwork, getNativeNetworkSnapshot, initAndroidNetwork } from './androidNetwork';
import {
  acquireWakeLock,
  enableKiosk,
  getEmbeddedDiagnostics,
  getKioskStatus,
  isKioskActive,
  refreshImmersiveMode,
  releaseWakeLock,
  setOrientation,
  startSleepCycle,
  stopSleepCycle,
  wakeScreen,
} from './kioskService';

const DIAGNOSTICS_POLL_MS = 5 * 60 * 1000;
const WAKE_LOCK_RENEWAL_THRESHOLD_MS = 6 * 60 * 60 * 1000;
const runtimeStartedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();

let initialized = false;
let removeBackButtonListener = null;
let removeClickListener = null;
let removeResumeListener = null;
let removeWakeListener = null;
let removeNetworkDiagnosticsListener = null;
let diagnosticsInterval = null;
let kioskStatus = null;
let androidDiagnostics = null;

export function isNativeAndroid() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

async function configureAndroidChrome() {
  const startedAt = performance.now();
  await StatusBar.setStyle({ style: Style.Light });
  await StatusBar.setBackgroundColor({ color: '#fefcfb' });
  await StatusBar.hide();
  await SplashScreen.hide();
  emitAndroidRuntimeEvent('chrome_ready', { durationMs: Math.round(performance.now() - startedAt) });
}

function emitAndroidRuntimeEvent(type, detail = {}) {
  if (!isNativeAndroid()) return;
  window.dispatchEvent(new CustomEvent('hkids:android-runtime', {
    detail: {
      type,
      timestamp: Date.now(),
      runtimeSessionMs: Math.round(performance.now() - runtimeStartedAt),
      ...detail,
    },
  }));
}

function installBackButtonHandling() {
  removeBackButtonListener = App.addListener('backButton', async ({ canGoBack }) => {
    const kioskStatus = await isKioskActive();
    const path = window.location.pathname;
    const isPrimaryScreen = ['/', '/kids', '/kids/library'].includes(path);

    if (path.startsWith('/kids/read/') && !canGoBack) {
      window.location.assign('/kids/library');
      return;
    }

    if (canGoBack && !isPrimaryScreen) {
      window.history.back();
      return;
    }

    if (path !== '/kids') {
      window.location.assign('/kids');
      return;
    }

    if (kioskStatus.active) return;
    App.minimizeApp();
  });
}

function installTouchFeedback() {
  removeClickListener = async (event) => {
    const target = event.target?.closest?.('button, a, [role="button"]');
    if (!target || target.getAttribute('aria-disabled') === 'true' || target.disabled) return;

    await unlockAndroidAudio();

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics can be unavailable on some embedded Android builds.
    }
  };

  document.addEventListener('click', removeClickListener, { passive: true });
  document.addEventListener('touchstart', () => {
    unlockAndroidAudio();
  }, { passive: true, once: false });
}

function installResumeHandling() {
  removeResumeListener = App.addListener('appStateChange', async ({ isActive }) => {
    emitAndroidRuntimeEvent(isActive ? 'foreground' : 'background');

    if (!isActive) {
      stopSleepCycle();
      return;
    }

    unlockAndroidAudio();
    refreshImmersiveMode();
    if (kioskStatus?.kioskEnabled) {
      await acquireWakeLock({ screen: true });
    }
    startSleepCycle();
    await refreshAndroidDiagnostics('foreground');
  });
}

async function refreshAndroidDiagnostics(reason = 'poll') {
  if (!isNativeAndroid()) return null;

  let diagnostics = await getEmbeddedDiagnostics();
  if (await renewWakeLockFromDiagnostics(diagnostics)) {
    diagnostics = await getEmbeddedDiagnostics();
  }

  androidDiagnostics = {
    ...diagnostics,
    reason,
    networkSnapshot: getNativeNetworkSnapshot(),
    runtimeSessionMs: Math.round(performance.now() - runtimeStartedAt),
  };

  document.documentElement.dataset.androidHealth = androidDiagnostics.health || 'unknown';
  window.dispatchEvent(new CustomEvent('hkids:android-diagnostics', {
    detail: androidDiagnostics,
  }));

  return androidDiagnostics;
}

async function renewWakeLockFromDiagnostics(diagnostics) {
  if (!kioskStatus?.kioskEnabled) return false;

  const remainingMs = Number(diagnostics?.webview?.wakeLockRemainingMs || 0);
  const wakeLockHeld = Boolean(diagnostics?.webview?.wakeLockHeld);
  if (wakeLockHeld && remainingMs >= WAKE_LOCK_RENEWAL_THRESHOLD_MS) return false;

  await acquireWakeLock({ screen: true });
  emitAndroidRuntimeEvent('wake_lock_renewed', { remainingMs });
  return true;
}

function installDiagnosticsPolling() {
  if (!isNativeAndroid()) return;

  const refreshFromNetwork = () => {
    refreshAndroidDiagnostics('network');
  };

  window.addEventListener('hkids:network-status', refreshFromNetwork);
  removeNetworkDiagnosticsListener = () => {
    window.removeEventListener('hkids:network-status', refreshFromNetwork);
  };

  diagnosticsInterval = window.setInterval(() => {
    refreshAndroidDiagnostics('poll');
  }, DIAGNOSTICS_POLL_MS);

  refreshAndroidDiagnostics('startup');
}

/**
 * Reads the native kiosk status once and mirrors it into the DOM so layout and styling
 * can adapt to a dedicated tablet without querying the bridge on every render.
 */
async function configureKioskEnvironment() {
  kioskStatus = await getKioskStatus();

  const root = document.documentElement;
  root.classList.toggle('kiosk-tablet', Boolean(kioskStatus.tablet));
  root.classList.toggle('kiosk-locked', Boolean(kioskStatus.kioskEnabled));
  root.dataset.kioskMode = kioskStatus.deviceOwner
    ? 'device_owner'
    : kioskStatus.kioskEnabled ? 'soft' : 'off';

  await setOrientation('auto');

  // Opt-in for dedicated tablets that are not device owner yet (demo units, pilots).
  if (!kioskStatus.kioskEnabled && import.meta.env?.VITE_KIOSK_AUTO_ENABLE === 'true') {
    await enableKiosk({ persistent: true });
    kioskStatus = await getKioskStatus();
  }

  if (kioskStatus.kioskEnabled) {
    await acquireWakeLock({ screen: true });
  }

  await refreshAndroidDiagnostics('kiosk_environment');

  return kioskStatus;
}

export function getCachedKioskStatus() {
  return kioskStatus;
}

export function getCachedAndroidDiagnostics() {
  return androidDiagnostics;
}

export async function initCapacitorRuntime() {
  if (initialized || !isNativeAndroid()) return;
  initialized = true;

  document.documentElement.classList.add('capacitor-android');
  document.body.classList.add('touch-kiosk');

  try {
    await configureAndroidChrome();
    await initAndroidNetwork();
    await configureKioskEnvironment();
  } catch (error) {
    console.warn('Android chrome configuration unavailable:', error);
  }

  installBackButtonHandling();
  installTouchFeedback();
  installResumeHandling();
  installSleepCycle();
  installDiagnosticsPolling();
}

function installSleepCycle() {
  const dimMs = 2 * 60 * 1000;
  const sleepMs = 5 * 60 * 1000;

  const resetSleep = () => {
    wakeScreen();
    startSleepCycle({ dimAfterMs: dimMs, sleepAfterMs: sleepMs });
  };

  const wakeEvents = ['pointerdown', 'touchstart', 'keydown', 'scroll'];
  wakeEvents.forEach((evt) => window.addEventListener(evt, resetSleep, { passive: true }));

  removeWakeListener = () => {
    wakeEvents.forEach((evt) => window.removeEventListener(evt, resetSleep));
    stopSleepCycle();
  };

  startSleepCycle({ dimAfterMs: dimMs, sleepAfterMs: sleepMs });
}

export async function cleanupCapacitorRuntime() {
  if (removeBackButtonListener) {
    const listener = await removeBackButtonListener;
    listener?.remove?.();
    removeBackButtonListener = null;
  }

  if (removeResumeListener) {
    const listener = await removeResumeListener;
    listener?.remove?.();
    removeResumeListener = null;
  }

  if (removeClickListener) {
    document.removeEventListener('click', removeClickListener);
    removeClickListener = null;
  }

  if (removeWakeListener) {
    removeWakeListener();
    removeWakeListener = null;
  }

  if (removeNetworkDiagnosticsListener) {
    removeNetworkDiagnosticsListener();
    removeNetworkDiagnosticsListener = null;
  }

  if (diagnosticsInterval) {
    window.clearInterval(diagnosticsInterval);
    diagnosticsInterval = null;
  }

  await releaseWakeLock();
  await cleanupAndroidNetwork();
  kioskStatus = null;
  androidDiagnostics = null;
  initialized = false;
}
