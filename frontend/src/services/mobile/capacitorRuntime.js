import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { unlockAndroidAudio } from './androidAudio';
import { cleanupAndroidNetwork, initAndroidNetwork } from './androidNetwork';
import { isKioskActive, wakeScreen, startSleepCycle, stopSleepCycle } from './kioskService';

let initialized = false;
let removeBackButtonListener = null;
let removeClickListener = null;
let removeResumeListener = null;
let removeWakeListener = null;

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
    if (isActive) unlockAndroidAudio();
  });
}

export async function initCapacitorRuntime() {
  if (initialized || !isNativeAndroid()) return;
  initialized = true;

  document.documentElement.classList.add('capacitor-android');
  document.body.classList.add('touch-kiosk');

  try {
    await configureAndroidChrome();
    await initAndroidNetwork();
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

  await cleanupAndroidNetwork();
  initialized = false;
}
