import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

let initialized = false;
let online = typeof navigator === 'undefined' ? true : navigator.onLine;
let removeListener = null;
let pendingOnlineTimer = null;
let networkSnapshot = {
  online,
  connectionType: 'unknown',
  changedAt: Date.now(),
  stableAt: Date.now(),
};

const ONLINE_STABILITY_MS = 750;

export function isNativeOnline() {
  return online;
}

export function getNativeNetworkSnapshot() {
  return { ...networkSnapshot };
}

export function normalizeNetworkStatus(status = {}, previous = networkSnapshot) {
  const nextOnline = Boolean(status.connected);
  const connectionType = status.connectionType || previous.connectionType || 'unknown';

  return {
    online: nextOnline,
    connectionType,
    changedAt: Date.now(),
    stableAt: nextOnline === previous.online && connectionType === previous.connectionType
      ? previous.stableAt
      : Date.now(),
  };
}

function publishNetworkStatus(status) {
  networkSnapshot = normalizeNetworkStatus(status);
  online = networkSnapshot.online;
  window.dispatchEvent(new CustomEvent('hkids:network-status', {
    detail: { ...networkSnapshot }
  }));
}

function scheduleNetworkStatus(status) {
  if (pendingOnlineTimer) {
    window.clearTimeout(pendingOnlineTimer);
    pendingOnlineTimer = null;
  }

  if (!status.connected) {
    publishNetworkStatus(status);
    return;
  }

  pendingOnlineTimer = window.setTimeout(() => {
    publishNetworkStatus(status);
    pendingOnlineTimer = null;
  }, ONLINE_STABILITY_MS);
}

export async function initAndroidNetwork() {
  if (initialized || !Capacitor.isNativePlatform()) return;
  initialized = true;

  try {
    const status = await Network.getStatus();
    publishNetworkStatus(status);
    removeListener = await Network.addListener('networkStatusChange', (event) => {
      scheduleNetworkStatus(event);
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
  if (pendingOnlineTimer) {
    window.clearTimeout(pendingOnlineTimer);
    pendingOnlineTimer = null;
  }
  initialized = false;
}
