# HKids — Kiosk Mode (Android Embedded)

## Overview

HKids can run as a dedicated kiosk app on Android tablets. When provisioned as
**device owner**, the app locks the device into a single-app experience:

- Children cannot exit the app
- The tablet boots straight into HKids and becomes the home screen
- Hardware buttons (home, recents, menu, settings) are blocked
- The screen stays on while charging and dims after inactivity
- The app restores itself after a reboot, an update or a crash

**Kiosk behaviour is opt-in.** Every mechanism is gated on a persisted `kiosk_enabled` flag
(`KioskState`), which defaults to on only for device owner installs. The same APK installed
normally behaves like any other Capacitor app: no HOME takeover, no boot launch, no exit guard.

---

## Features

| Feature | Implementation |
|---|---|
| **Lock Task Mode** | `startLockTask()` via `KioskPlugin`, whitelisted by `KioskPolicyManager` |
| **Device Owner policies** | Keyguard off, status bar off, stay-on-while-plugged, user restrictions, uninstall blocked |
| **Kiosk launcher** | `KioskLauncherAlias` (HOME filter, disabled by default) + persistent preferred activity |
| **Auto-launch on boot** | `BootReceiver` on `BOOT_COMPLETED` / `MY_PACKAGE_REPLACED` / `QUICKBOOT_POWERON` |
| **Reboot recovery** | `MainActivity.restoreKioskSession()` re-applies policies, Lock Task and wake lock |
| **Crash recovery** | `KioskRecovery` schedules an `AlarmManager` restart on fatal exceptions |
| **Exit prevention** | Hardware keys blocked, `onStop` relaunch guard, Lock Task exit watchdog |
| **Controlled exit** | `KioskExitGate`: 3 s hold + parent code + lockout after 3 failures |
| **Wake lock** | `KioskWakeLock` (`SCREEN_BRIGHT`) held while kiosk is on |
| **Immersive mode** | `WindowInsetsController` on R+, sticky immersive flags below, re-applied on resume |
| **Tablet optimization** | Free rotation on sw600dp, portrait on phones, 56 px targets, 17 px base text |

---

## Setup

### 1. Build the APK

```bash
cd frontend
npm run android:sync
cd android && gradlew.bat assembleRelease
```

### 2. Provision the tablet as device owner

```powershell
cd frontend\android\kiosk
.\provision-device-owner.ps1 -ApkPath ..\app\build\outputs\apk\release\app-release.apk
```

The tablet must be **factory reset with no accounts**. See `docs/ANDROID_KIOSK.md` for the
QR / NFC provisioning payload and the full policy list.

### 3. Reboot

```bash
adb reboot
```

The tablet boots directly into HKids in Lock Task Mode.

### 4. Return to normal Android mode

```powershell
.\provision-device-owner.ps1 -Remove
```

Or from the parent dashboard ("Dedicated tablet" card), which clears the policies while
keeping the device owner grant so kiosk mode can be resumed without re-provisioning.

---

## JS API (Frontend)

All methods are safe no-ops on web and iOS.

```js
import {
  enableKiosk, disableKiosk, isKioskActive, isDeviceOwner, getKioskStatus,
  applyDeviceOwnerPolicies, clearDeviceOwnerPolicies, setKioskLauncher,
  acquireWakeLock, releaseWakeLock, setOrientation, refreshImmersiveMode,
  provisionKioskTablet, releaseKioskTablet,
  getKioskExitCode, setKioskExitCode, verifyKioskExitCode, requestKioskExit,
  setScreenBrightness, keepScreenOn, wakeScreen, startSleepCycle, stopSleepCycle,
} from '../services/mobile/kioskService';
```

| Method | Description |
|---|---|
| `enableKiosk({ persistent })` | Starts Lock Task, applies policies, persists the kiosk flag |
| `disableKiosk({ clearPolicies })` | Leaves kiosk, optionally restores normal Android |
| `provisionKioskTablet()` | Full pass: policies → launcher → Lock Task → wake lock |
| `releaseKioskTablet()` | Back to normal Android, device owner grant kept |
| `requestKioskExit(code)` | Authorised exit after verifying the parent code |
| `isKioskActive()` | `{ active, enabled, mode, deviceOwner }` |
| `isDeviceOwner()` | `{ owner, provisioningAllowed }` |
| `getKioskStatus()` | Full status: kiosk, launcher, wake lock, tablet, brightness, SDK |
| `setKioskLauncher(enabled)` | Enables/disables the HOME takeover |
| `acquireWakeLock({ screen })` | `screen: false` for a CPU-only lock (background audio) |
| `setOrientation(mode)` | `auto` (device class), `portrait`, `landscape`, `sensor` |
| `refreshImmersiveMode()` | Re-hides the system bars after a dialog or keyboard |
| `setScreenBrightness(0.5)` | 0.01 – 1.0, or -1 to restore the system value |
| `keepScreenOn(true/false)` | Toggles `FLAG_KEEP_SCREEN_ON` |
| `startSleepCycle({ dimAfterMs, sleepAfterMs })` | Managed dim/sleep timers |

---

## Architecture

```
┌──────────────── Android Native ────────────────┐
│  MainActivity                                   │
│  ├── registerPlugin(KioskPlugin)                │
│  ├── restoreKioskSession()  (boot/crash resume) │
│  ├── reassertLockTask()     (onResume)          │
│  ├── guardAgainstAccidentalExit()  (onStop)     │
│  ├── applyDeviceOrientation()  (phone/tablet)   │
│  └── applyImmersiveMode()                       │
│                                                  │
│  KioskPlugin (@CapacitorPlugin "Kiosk")         │
│  ├── enableKiosk / disableKiosk / requestExit   │
│  ├── applyDeviceOwnerPolicies / clear…          │
│  ├── setKioskLauncher / setOrientation          │
│  ├── acquireWakeLock / releaseWakeLock          │
│  └── getStatus / isKioskActive / isDeviceOwner  │
│                                                  │
│  KioskState        persisted kiosk_enabled flag │
│  KioskPolicyManager  DevicePolicyManager wrapper│
│  KioskWakeLock       single app-wide wake lock  │
│  KioskRecovery       crash restart via alarm    │
│  HKidsDeviceAdminReceiver  provisioning hooks   │
│  BootReceiver        auto-launch (kiosk only)   │
│  KioskLauncherAlias  HOME filter, off by default│
└─────────────────────────────────────────────────┘
         ↕ Capacitor bridge
┌──────────────── Frontend JS ───────────────────┐
│  kioskService.js      bridge + exit code store  │
│  capacitorRuntime.js  status → DOM, wake lock,  │
│                       orientation, immersive    │
│  KioskExitGate.jsx    hold + parent code gate   │
│  ParentKioskPanel.jsx parent provisioning card  │
└─────────────────────────────────────────────────┘
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_ANDROID_KIOSK_IDLE_MS` | `600000` (10 min) | Idle timeout before returning to `/kids` |
| `VITE_KIOSK_EXIT_CODE` | `1379` | Parent code for the kiosk exit gate — **change before deployment** |
| `VITE_KIOSK_AUTO_ENABLE` | `false` | `true` enables supervised kiosk on first launch (demo units) |

---

## See also

- `docs/ANDROID_KIOSK.md` — provisioning, policy list, test matrix (FR)
- `docs/ANDROID_CAPACITOR.md` — Capacitor build and sync
- `frontend/android/kiosk/` — provisioning scripts and QR payload
