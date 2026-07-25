import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { unlockAndroidAudio } from './androidAudio';
import { cleanupAndroidNetwork, initAndroidNetwork } from './androidNetwork';
import {
  acquireWakeLock,
  enableKiosk,
  getKioskStatus,
  isKioskActive,
  refreshImmersiveMode,
  releaseWakeLock,
  setOrientation,
  startSleepCycle,
  stopSleepCycle,
  wakeScreen,
} from './kioskService';

let initialized = false;
let removeBackButtonListener = null;
let removeClickListener = null;
let removeResumeListener = null;
let removeWakeListener = null;
let kioskStatus = null;

export function isNativeAndroid() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

async function configureAndroidChrome() {
  await StatusBar.setStyle({ style: Style.Light });
  await StatusBar.setBackgroundColor({ color: '#fefcfb' });
  await StatusBar.hide();
  await SplashScreen.hide();
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
  removeResumeListener = App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) return;
    unlockAndroidAudio();
    // A system dialog or the keyboard can reveal the status bar: hide it again.
    refreshImmersiveMode();
  });
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

  return kioskStatus;
}

export function getCachedKioskStatus() {
  return kioskStatus;
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

  await releaseWakeLock();
  await cleanupAndroidNetwork();
  kioskStatus = null;
  initialized = false;
}
