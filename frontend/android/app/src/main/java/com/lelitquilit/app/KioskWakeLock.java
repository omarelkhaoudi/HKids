package com.lelitquilit.app;

import android.content.Context;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

/**
 * Single app-wide wake lock for dedicated tablets, so audio playback and story
 * sessions are never interrupted by the device sleeping.
 *
 * The lock is always released explicitly (never reference counted) and is a no-op when
 * the caller never asked for it, which keeps battery behaviour normal outside kiosk mode.
 */
final class KioskWakeLock {
    private static final String TAG = "HKidsWakeLock";
    private static final String LOCK_TAG = "HKids::KioskWakeLock";
    private static final long DEFAULT_TIMEOUT_MS = 12L * 60L * 60L * 1000L;

    private static PowerManager.WakeLock wakeLock;
    private static boolean screenLevel = false;

    private KioskWakeLock() {
    }

    static synchronized boolean acquire(Context context, boolean keepScreenBright, long timeoutMs) {
        release();

        PowerManager powerManager =
            (PowerManager) context.getApplicationContext().getSystemService(Context.POWER_SERVICE);
        if (powerManager == null) return false;

        int levelAndFlags = keepScreenBright
            ? PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP
            : PowerManager.PARTIAL_WAKE_LOCK;

        try {
            wakeLock = powerManager.newWakeLock(levelAndFlags, LOCK_TAG);
            wakeLock.setReferenceCounted(false);
            wakeLock.acquire(timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS);
            screenLevel = keepScreenBright;
            return true;
        } catch (Exception error) {
            Log.w(TAG, "Wake lock acquisition failed: " + error.getMessage());
            wakeLock = null;
            screenLevel = false;
            return false;
        }
    }

    static synchronized void release() {
        if (wakeLock == null) return;
        try {
            if (wakeLock.isHeld()) wakeLock.release();
        } catch (Exception error) {
            Log.w(TAG, "Wake lock release failed: " + error.getMessage());
        }
        wakeLock = null;
        screenLevel = false;
    }

    static synchronized boolean isHeld() {
        return wakeLock != null && wakeLock.isHeld();
    }

    static synchronized boolean isScreenLevel() {
        return isHeld() && screenLevel;
    }

    static boolean isDeviceInteractive(Context context) {
        PowerManager powerManager =
            (PowerManager) context.getApplicationContext().getSystemService(Context.POWER_SERVICE);
        if (powerManager == null) return true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
            return powerManager.isInteractive();
        }
        return true;
    }
}
