import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

let initialized = false;
let online = true;
let removeListener = null;

export function isNativeOnline() {
  return online;
}

export async function initAndroidNetwork() {
  if (initialized || !Capacitor.isNativePlatform()) return;
  initialized = true;

  try {
    const status = await Network.getStatus();
    online = status.connected;
    removeListener = await Network.addListener('networkStatusChange', (event) => {
      online = event.connected;
      window.dispatchEvent(new CustomEvent('hkids:network-status', {
        detail: { online: event.connected, connectionType: event.connectionType }
      }));
    });
  } catch (error) {
    console.warn('Native network listener unavailable:', error);
  }
}

export async function cleanupAndroidNetwork() {
  if (removeListener) {
    const listener = await removeListener;
    listener?.remove?.();
    removeListener = null;
  }
  initialized = false;
}
