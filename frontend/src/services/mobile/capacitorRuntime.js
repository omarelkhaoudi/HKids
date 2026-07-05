import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

let initialized = false;
let removeBackButtonListener = null;
let removeClickListener = null;

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
  removeBackButtonListener = App.addListener('backButton', ({ canGoBack }) => {
    const path = window.location.pathname;
    const isPrimaryScreen = ['/', '/kids', '/kids/library'].includes(path);

    if (canGoBack && !isPrimaryScreen) {
      window.history.back();
      return;
    }

    if (path !== '/kids') {
      window.location.assign('/kids');
      return;
    }

    App.minimizeApp();
  });
}

function installTouchFeedback() {
  removeClickListener = async (event) => {
    const target = event.target?.closest?.('button, a, [role="button"]');
    if (!target || target.getAttribute('aria-disabled') === 'true' || target.disabled) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics can be unavailable on some embedded Android builds.
    }
  };

  document.addEventListener('click', removeClickListener, { passive: true });
}

export async function initCapacitorRuntime() {
  if (initialized || !isNativeAndroid()) return;
  initialized = true;

  document.documentElement.classList.add('capacitor-android');
  document.body.classList.add('touch-kiosk');

  try {
    await configureAndroidChrome();
  } catch (error) {
    console.warn('Android chrome configuration unavailable:', error);
  }

  installBackButtonHandling();
  installTouchFeedback();
}

export async function cleanupCapacitorRuntime() {
  if (removeBackButtonListener) {
    const listener = await removeBackButtonListener;
    listener?.remove?.();
    removeBackButtonListener = null;
  }

  if (removeClickListener) {
    document.removeEventListener('click', removeClickListener);
    removeClickListener = null;
  }

  initialized = false;
}
