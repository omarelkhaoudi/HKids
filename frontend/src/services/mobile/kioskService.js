/**
 * Bridge to the native KioskPlugin for Lock Task Mode, screen control,
 * and embedded-device features. All methods are safe no-ops on web/iOS.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';

const Kiosk = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
  ? registerPlugin('Kiosk')
  : null;

function isAndroid() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function enableKiosk() {
  if (!isAndroid() || !Kiosk) return { enabled: false, reason: 'not_android' };
  try {
    return await Kiosk.enableKiosk();
  } catch (err) {
    console.warn('Kiosk enableKiosk failed:', err);
    return { enabled: false, error: err.message };
  }
}

export async function disableKiosk() {
  if (!isAndroid() || !Kiosk) return { enabled: false };
  try {
    return await Kiosk.disableKiosk();
  } catch (err) {
    console.warn('Kiosk disableKiosk failed:', err);
    return { enabled: true, error: err.message };
  }
}

export async function isKioskActive() {
  if (!isAndroid() || !Kiosk) return { active: false };
  try {
    return await Kiosk.isKioskActive();
  } catch {
    return { active: false };
  }
}

export async function isDeviceOwner() {
  if (!isAndroid() || !Kiosk) return { owner: false };
  try {
    return await Kiosk.isDeviceOwner();
  } catch {
    return { owner: false };
  }
}

export async function setScreenBrightness(brightness) {
  if (!isAndroid() || !Kiosk) return;
  try {
    return await Kiosk.setScreenBrightness({ brightness });
  } catch (err) {
    console.warn('setScreenBrightness failed:', err);
  }
}

export async function keepScreenOn(enabled = true) {
  if (!isAndroid() || !Kiosk) return;
  try {
    return await Kiosk.keepScreenOn({ enabled });
  } catch (err) {
    console.warn('keepScreenOn failed:', err);
  }
}

export async function getKioskStatus() {
  if (!isAndroid() || !Kiosk) return { kioskActive: false, deviceOwner: false, platform: 'web' };
  try {
    return await Kiosk.getStatus();
  } catch {
    return { kioskActive: false, deviceOwner: false, platform: 'android', error: true };
  }
}

const DIM_BRIGHTNESS = 0.05;
const FULL_BRIGHTNESS = -1.0;

let sleepTimer = null;
let dimTimer = null;

/**
 * Managed sleep cycle: dim after `dimAfterMs`, then optionally lock after `sleepAfterMs`.
 * Any user interaction should call `wakeScreen()` to reset timers.
 */
export function startSleepCycle({ dimAfterMs = 120000, sleepAfterMs = 300000 } = {}) {
  stopSleepCycle();

  dimTimer = setTimeout(() => {
    setScreenBrightness(DIM_BRIGHTNESS);
  }, dimAfterMs);

  if (sleepAfterMs > dimAfterMs) {
    sleepTimer = setTimeout(() => {
      setScreenBrightness(0.01);
    }, sleepAfterMs);
  }
}

export function wakeScreen() {
  stopSleepCycle();
  setScreenBrightness(FULL_BRIGHTNESS);
}

export function stopSleepCycle() {
  if (dimTimer) { clearTimeout(dimTimer); dimTimer = null; }
  if (sleepTimer) { clearTimeout(sleepTimer); sleepTimer = null; }
}
