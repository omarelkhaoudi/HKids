import { Capacitor } from '@capacitor/core';

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV || Capacitor.isNativePlatform()) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
  });
}
