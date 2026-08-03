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
    expect(status.kioskEnabled).toBe(false);
    expect(status.deviceOwner).toBe(false);
    expect(status.tablet).toBe(false);
    expect(status.platform).toBe('web');
  });

  it('getEmbeddedDiagnostics returns safe web defaults', async () => {
    const diagnostics = await kiosk.getEmbeddedDiagnostics();
    expect(diagnostics.platform).toBe('web');
    expect(diagnostics.health).toBe('healthy');
    expect(diagnostics.recoveryAttempts).toBe(0);
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

  it('device owner policy helpers report no capability on web', async () => {
    expect((await kiosk.applyDeviceOwnerPolicies()).applied).toBe(false);
    expect((await kiosk.clearDeviceOwnerPolicies()).cleared).toBe(false);
    expect((await kiosk.setKioskLauncher(true)).launcher).toBe(false);
  });

  it('wake lock helpers report an unheld lock on web', async () => {
    expect((await kiosk.acquireWakeLock()).held).toBe(false);
    expect((await kiosk.releaseWakeLock()).held).toBe(false);
  });

  it('orientation and immersive helpers stay inert on web', async () => {
    expect((await kiosk.setOrientation('landscape')).mode).toBe('auto');
    expect((await kiosk.refreshImmersiveMode()).immersive).toBe(false);
  });

  it('provisioning helpers refuse to run outside Android', async () => {
    const provisioned = await kiosk.provisionKioskTablet();
    expect(provisioned.provisioned).toBe(false);
    expect(provisioned.reason).toBe('not_android');

    const released = await kiosk.releaseKioskTablet();
    expect(released.released).toBe(false);
    expect(released.reason).toBe('not_android');
  });
});

describe('kiosk exit code', () => {
  let kiosk;

  beforeEach(async () => {
    localStorage.clear();
    kiosk = await import('./kioskService');
  });

  it('returns null when no exit code is configured', () => {
    expect(kiosk.getKioskExitCode()).toBe(import.meta.env.VITE_KIOSK_EXIT_CODE || null);
  });

  it('stores and verifies a numeric code of 4 to 8 digits', () => {
    expect(kiosk.setKioskExitCode('1379')).toBe(true);
    expect(kiosk.getKioskExitCode()).toBe('1379');
    expect(kiosk.verifyKioskExitCode('1379')).toBe(true);
    expect(kiosk.verifyKioskExitCode('1380')).toBe(false);

    expect(kiosk.setKioskExitCode('482913')).toBe(true);
    expect(kiosk.getKioskExitCode()).toBe('482913');
  });

  it('rejects codes that are too short, too long or not numeric', () => {
    expect(kiosk.setKioskExitCode('123')).toBe(false);
    expect(kiosk.setKioskExitCode('123456789')).toBe(false);
    expect(kiosk.setKioskExitCode('12a4')).toBe(false);
    expect(kiosk.setKioskExitCode('')).toBe(false);
  });

  it('never exits kiosk mode with a wrong code', async () => {
    kiosk.setKioskExitCode('918200');
    const result = await kiosk.requestKioskExit('000000');
    expect(result.exited).toBe(false);
    expect(result.reason).toBe('invalid_code');
  });

  it('reports not_android once the code is correct but no bridge exists', async () => {
    kiosk.setKioskExitCode('918200');
    const result = await kiosk.requestKioskExit('918200');
    expect(result.exited).toBe(false);
    expect(result.reason).toBe('not_android');
  });

  it('summarizes embedded diagnostics into actionable health warnings', () => {
    const summary = kiosk.summarizeEmbeddedHealth({
      health: 'healthy',
      kioskEnabled: true,
      recoveryAttempts: 4,
      memory: { pressure: 'warning' },
      storage: { pressure: 'healthy' },
      battery: { present: true, percent: 18, charging: false },
      network: { connected: false },
      webview: { wakeLockHeld: false },
    });

    expect(summary.ok).toBe(false);
    expect(summary.health).toBe('warning');
    expect(summary.warnings).toEqual(expect.arrayContaining([
      'memory',
      'battery',
      'network',
      'wake_lock',
      'recovery',
    ]));
  });
});
