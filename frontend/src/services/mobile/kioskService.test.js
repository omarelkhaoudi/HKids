import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
  },
  registerPlugin: vi.fn(() => ({})),
}));

describe('kioskService (web fallback)', () => {
  let kiosk;

  beforeEach(async () => {
    kiosk = await import('./kioskService');
  });

  it('enableKiosk returns not_android on web', async () => {
    const result = await kiosk.enableKiosk();
    expect(result.enabled).toBe(false);
    expect(result.reason).toBe('not_android');
  });

  it('disableKiosk returns enabled false on web', async () => {
    const result = await kiosk.disableKiosk();
    expect(result.enabled).toBe(false);
  });

  it('isKioskActive returns inactive on web', async () => {
    const result = await kiosk.isKioskActive();
    expect(result.active).toBe(false);
  });

  it('isDeviceOwner returns false on web', async () => {
    const result = await kiosk.isDeviceOwner();
    expect(result.owner).toBe(false);
  });

  it('getKioskStatus returns web defaults', async () => {
    const status = await kiosk.getKioskStatus();
    expect(status.kioskActive).toBe(false);
    expect(status.deviceOwner).toBe(false);
    expect(status.platform).toBe('web');
  });

  it('setScreenBrightness is a safe no-op on web', async () => {
    const result = await kiosk.setScreenBrightness(0.5);
    expect(result).toBeUndefined();
  });

  it('keepScreenOn is a safe no-op on web', async () => {
    const result = await kiosk.keepScreenOn(true);
    expect(result).toBeUndefined();
  });

  it('wakeScreen does not throw on web', () => {
    expect(() => kiosk.wakeScreen()).not.toThrow();
  });

  it('startSleepCycle does not throw on web', () => {
    expect(() => kiosk.startSleepCycle()).not.toThrow();
    kiosk.stopSleepCycle();
  });

  it('stopSleepCycle does not throw on web', () => {
    expect(() => kiosk.stopSleepCycle()).not.toThrow();
  });
});
