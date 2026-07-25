/**
 * Bridge to the native KioskPlugin: Lock Task Mode, Device Owner policies, launcher
 * takeover, wake lock, brightness and orientation.
 *
 * Every method is a safe no-op on web and iOS, so the same code runs in the browser.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';

const Kiosk = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
  ? registerPlugin('Kiosk')
  : null;

const EXIT_CODE_KEY = 'hkids_kiosk_exit_code';
const DEFAULT_EXIT_CODE = '1379';

const WEB_STATUS = {
  platform: 'web',
  kioskActive: false,
  kioskEnabled: false,
  deviceOwner: false,
  provisioningAllowed: false,
  launcherEnabled: false,
  wakeLockHeld: false,
  tablet: false,
};

function isAndroid() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

async function invoke(method, options, fallback) {
  if (!isAndroid() || !Kiosk?.[method]) return fallback;
  try {
    return await Kiosk[method](options);
  } catch (error) {
    console.warn(`Kiosk ${method} failed:`, error);
    return { ...fallback, error: error?.message || 'kiosk_error' };
  }
}

export async function enableKiosk({ persistent = true } = {}) {
  if (!isAndroid() || !Kiosk) return { enabled: false, reason: 'not_android' };
  try {
    return await Kiosk.enableKiosk({ persistent });
  } catch (error) {
    console.warn('Kiosk enableKiosk failed:', error);
    return { enabled: false, error: error.message };
  }
}

export async function disableKiosk({ clearPolicies = false } = {}) {
  if (!isAndroid() || !Kiosk) return { enabled: false };
  try {
    return await Kiosk.disableKiosk({ clearPolicies });
  } catch (error) {
    console.warn('Kiosk disableKiosk failed:', error);
    return { enabled: true, error: error.message };
  }
}

export async function isKioskActive() {
  return invoke('isKioskActive', undefined, { active: false, enabled: false });
}

export async function isDeviceOwner() {
  return invoke('isDeviceOwner', undefined, { owner: false, provisioningAllowed: false });
}

/** Applies the dedicated-tablet policies (keyguard, status bar, restrictions, launcher). */
export async function applyDeviceOwnerPolicies() {
  return invoke('applyDeviceOwnerPolicies', undefined, { applied: false, deviceOwner: false });
}

/** Restores a normal Android device without removing the Device Owner grant. */
export async function clearDeviceOwnerPolicies() {
  return invoke('clearDeviceOwnerPolicies', undefined, { cleared: false });
}

export async function setKioskLauncher(enabled = true) {
  return invoke('setKioskLauncher', { enabled }, { launcher: false });
}

export async function setScreenBrightness(brightness) {
  if (!isAndroid() || !Kiosk) return;
  try {
    return await Kiosk.setScreenBrightness({ brightness });
  } catch (error) {
    console.warn('setScreenBrightness failed:', error);
  }
}

export async function keepScreenOn(enabled = true) {
  if (!isAndroid() || !Kiosk) return;
  try {
    return await Kiosk.keepScreenOn({ enabled });
  } catch (error) {
    console.warn('keepScreenOn failed:', error);
  }
}

/** Holds a wake lock so long audio sessions are never cut short by the device sleeping. */
export async function acquireWakeLock({ screen = true, timeoutMs = 0 } = {}) {
  return invoke('acquireWakeLock', { screen, timeoutMs }, { held: false });
}

export async function releaseWakeLock() {
  return invoke('releaseWakeLock', undefined, { held: false });
}

/** `auto` follows the device class: portrait on phones, free rotation on tablets. */
export async function setOrientation(mode = 'auto') {
  return invoke('setOrientation', { mode }, { mode: 'auto' });
}

export async function refreshImmersiveMode() {
  return invoke('refreshImmersiveMode', undefined, { immersive: false });
}

export async function getKioskStatus() {
  if (!isAndroid() || !Kiosk) return { ...WEB_STATUS };
  try {
    return { ...WEB_STATUS, platform: 'android', ...(await Kiosk.getStatus()) };
  } catch {
    return { ...WEB_STATUS, platform: 'android', error: true };
  }
}

/**
 * Full provisioning pass for a dedicated tablet: lock task, dedicated-device policies,
 * HOME takeover and wake lock, in the order the system expects.
 */
export async function provisionKioskTablet() {
  if (!isAndroid()) return { provisioned: false, reason: 'not_android' };

  const owner = await isDeviceOwner();
  await applyDeviceOwnerPolicies();
  await setKioskLauncher(true);
  const enabled = await enableKiosk({ persistent: true });
  await acquireWakeLock({ screen: true });

  return {
    provisioned: Boolean(enabled.enabled),
    deviceOwner: Boolean(owner.owner),
    mode: enabled.mode || (owner.owner ? 'lock_task' : 'screen_pinning'),
  };
}

/** Returns the tablet to normal Android mode, keeping the Device Owner grant intact. */
export async function releaseKioskTablet({ clearPolicies = true } = {}) {
  if (!isAndroid()) return { released: false, reason: 'not_android' };

  await releaseWakeLock();
  const result = await disableKiosk({ clearPolicies });
  return { released: !result.enabled, ...result };
}

export function getKioskExitCode() {
  try {
    const stored = localStorage.getItem(EXIT_CODE_KEY);
    if (stored) return stored;
  } catch {
    // Private browsing or a locked-down WebView: fall back to the build-time code.
  }
  return import.meta.env?.VITE_KIOSK_EXIT_CODE || DEFAULT_EXIT_CODE;
}

export function setKioskExitCode(code) {
  const normalized = String(code || '').trim();
  if (!/^\d{4,8}$/.test(normalized)) return false;
  try {
    localStorage.setItem(EXIT_CODE_KEY, normalized);
    return true;
  } catch {
    return false;
  }
}

export function verifyKioskExitCode(code) {
  return String(code || '').trim() === getKioskExitCode();
}

/**
 * Leaves kiosk mode only when the parent code matches. This is the single authorised exit
 * path: everything else (back, home, recents, task switch) is blocked natively.
 */
export async function requestKioskExit(code) {
  if (!verifyKioskExitCode(code)) return { exited: false, reason: 'invalid_code' };
  if (!isAndroid() || !Kiosk) return { exited: false, reason: 'not_android' };

  try {
    return await Kiosk.requestExit({ background: true });
  } catch (error) {
    console.warn('Kiosk requestExit failed:', error);
    return { exited: false, error: error.message };
  }
}

const DIM_BRIGHTNESS = 0.05;
const FULL_BRIGHTNESS = -1.0;

let sleepTimer = null;
let dimTimer = null;

/**
 * Managed sleep cycle: dim after `dimAfterMs`, then further after `sleepAfterMs`.
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
