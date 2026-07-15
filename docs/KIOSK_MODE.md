# HKids — Kiosk Mode (Android Embedded)

## Overview

HKids can run as a dedicated kiosk/embedded app on Android tablets. When configured
as **device owner**, the app locks the device into a single-app experience:

- Children cannot exit the app
- The device auto-starts HKids on boot
- Hardware buttons (home, recent apps) are blocked
- The screen dims after inactivity and wakes on touch
- The app auto-restarts after a crash or update

---

## Features

| Feature | Implementation |
|---|---|
| **Lock Task Mode** | `startLockTask()` via `KioskPlugin` + auto-start in `MainActivity` |
| **Kiosk mode** | Full immersive mode + Lock Task when device owner |
| **Auto-start on boot** | `BootReceiver` listens for `BOOT_COMPLETED` |
| **Return to HKids** | `HOME` + `DEFAULT` intent filter (becomes default launcher) |
| **Back button disabled** | `dispatchKeyEvent` blocks HOME/APP_SWITCH in lock task; JS back handler redirects to `/kids` |
| **Orientation locked** | `android:screenOrientation="portrait"` in manifest |
| **Controlled sleep** | Brightness dimming after 2 min, near-black after 5 min; wake on any touch |
| **Crash recovery** | Lock Task auto-re-engages on `onCreate` if device owner |

---

## Setup

### 1. Build the APK

```bash
cd frontend
npm run android:sync
cd android && gradlew.bat assembleDebug
```

### 2. Install on the tablet

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 3. Set as Device Owner (one-time, on a factory-reset device)

```bash
adb shell dpm set-device-owner com.lelitquilit.app/.HKidsDeviceAdminReceiver
```

> **Important**: The device must have **no accounts** (no Google account) configured.
> Factory-reset the device first if needed.

### 4. Reboot

The app will auto-start in Lock Task Mode after reboot.

---

## Removing Device Owner

To remove device owner status (e.g., for development):

```bash
adb shell dpm remove-active-admin com.lelitquilit.app/.HKidsDeviceAdminReceiver
```

Or from the app (admin-only), call `disableKiosk()` first then remove via Settings.

---

## JS API (Frontend)

All methods are safe no-ops on web/iOS.

```js
import {
  enableKiosk,
  disableKiosk,
  isKioskActive,
  isDeviceOwner,
  getKioskStatus,
  setScreenBrightness,
  keepScreenOn,
  wakeScreen,
  startSleepCycle,
  stopSleepCycle,
} from '../services/mobile/kioskService';
```

| Method | Description |
|---|---|
| `enableKiosk()` | Starts Lock Task Mode |
| `disableKiosk()` | Stops Lock Task Mode |
| `isKioskActive()` | Returns `{ active: boolean }` |
| `isDeviceOwner()` | Returns `{ owner: boolean }` |
| `getKioskStatus()` | Full status (kiosk, brightness, SDK, etc.) |
| `setScreenBrightness(0.5)` | Set brightness (0.01 – 1.0, -1 for auto) |
| `keepScreenOn(true/false)` | Toggle FLAG_KEEP_SCREEN_ON |
| `wakeScreen()` | Reset to full brightness + restart sleep cycle |
| `startSleepCycle({ dimAfterMs, sleepAfterMs })` | Managed dim/sleep timers |

---

## Architecture

```
┌──────────────── Android Native ────────────────┐
│  MainActivity.java                              │
│  ├── registerPlugin(KioskPlugin.class)          │
│  ├── autoStartLockTaskIfOwner()                 │
│  ├── enableKioskChrome() (immersive)            │
│  └── dispatchKeyEvent() (block hardware keys)   │
│                                                  │
│  KioskPlugin.java (@CapacitorPlugin)            │
│  ├── enableKiosk / disableKiosk                 │
│  ├── isKioskActive / isDeviceOwner              │
│  ├── setScreenBrightness / keepScreenOn         │
│  └── getStatus                                  │
│                                                  │
│  HKidsDeviceAdminReceiver.java                  │
│  └── Required for dpm set-device-owner          │
│                                                  │
│  BootReceiver.java                              │
│  └── BOOT_COMPLETED → launch MainActivity      │
└─────────────────────────────────────────────────┘
         ↕ Capacitor bridge
┌──────────────── Frontend JS ───────────────────┐
│  kioskService.js                                │
│  ├── enableKiosk() / disableKiosk()             │
│  ├── sleep cycle management                     │
│  └── brightness control                         │
│                                                  │
│  capacitorRuntime.js                            │
│  ├── Back button → /kids (never exit in kiosk)  │
│  └── installSleepCycle() (dim/wake on touch)    │
└─────────────────────────────────────────────────┘
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_ANDROID_KIOSK_IDLE_MS` | `600000` (10 min) | Idle timeout before returning to `/kids` |
