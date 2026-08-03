package com.lelitquilit.app;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * Persisted kiosk flags shared by the activity, the boot receiver and the plugin.
 *
 * Every kiosk behaviour (auto-launch on boot, HOME takeover, exit guard, crash
 * recovery) is gated on {@link #isKioskEnabled}. A standard install keeps normal
 * Android behaviour because the flag is unset and the app is not device owner.
 */
final class KioskState {
    private static final String PREFS = "hkids_kiosk";
    private static final String KEY_ENABLED = "kiosk_enabled";
    private static final String KEY_AUTHORIZED_EXIT = "authorized_exit";
    private static final String KEY_LAST_LAUNCH_AT = "last_launch_at";
    private static final String KEY_LAST_HEALTHY_AT = "last_healthy_at";
    private static final String KEY_RECOVERY_WINDOW_STARTED_AT = "recovery_window_started_at";
    private static final String KEY_RECOVERY_ATTEMPTS = "recovery_attempts";
    private static final String KEY_LAST_RECOVERY_AT = "last_recovery_at";
    private static final long RECOVERY_WINDOW_MS = 5L * 60L * 1000L;

    private KioskState() {
    }

    private static SharedPreferences prefs(Context context) {
        return context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /**
     * A device owner install is a dedicated tablet, so kiosk defaults to on until an
     * operator explicitly turns it off. Any explicit choice always wins.
     */
    static boolean isKioskEnabled(Context context) {
        SharedPreferences preferences = prefs(context);
        if (preferences.contains(KEY_ENABLED)) {
            return preferences.getBoolean(KEY_ENABLED, false);
        }
        return KioskPolicyManager.isDeviceOwner(context);
    }

    static boolean hasExplicitPreference(Context context) {
        return prefs(context).contains(KEY_ENABLED);
    }

    /** Written synchronously so the value survives an immediate reboot or crash. */
    static void setKioskEnabled(Context context, boolean enabled) {
        prefs(context).edit().putBoolean(KEY_ENABLED, enabled).commit();
    }

    /** Allows the next activity stop to happen without the exit guard bringing us back. */
    static void markAuthorizedExit(Context context) {
        prefs(context).edit().putBoolean(KEY_AUTHORIZED_EXIT, true).commit();
    }

    static boolean consumeAuthorizedExit(Context context) {
        SharedPreferences preferences = prefs(context);
        boolean authorized = preferences.getBoolean(KEY_AUTHORIZED_EXIT, false);
        if (authorized) {
            preferences.edit().putBoolean(KEY_AUTHORIZED_EXIT, false).commit();
        }
        return authorized;
    }

    static void markLaunch(Context context) {
        prefs(context).edit().putLong(KEY_LAST_LAUNCH_AT, System.currentTimeMillis()).commit();
    }

    static void markHealthy(Context context) {
        prefs(context).edit()
            .putLong(KEY_LAST_HEALTHY_AT, System.currentTimeMillis())
            .putLong(KEY_RECOVERY_WINDOW_STARTED_AT, 0L)
            .putInt(KEY_RECOVERY_ATTEMPTS, 0)
            .commit();
    }

    static int recordRecoveryAttempt(Context context) {
        SharedPreferences preferences = prefs(context);
        long now = System.currentTimeMillis();
        long windowStartedAt = preferences.getLong(KEY_RECOVERY_WINDOW_STARTED_AT, 0L);
        int attempts = preferences.getInt(KEY_RECOVERY_ATTEMPTS, 0);

        if (windowStartedAt <= 0L || now - windowStartedAt > RECOVERY_WINDOW_MS) {
            windowStartedAt = now;
            attempts = 0;
        }

        attempts += 1;
        preferences.edit()
            .putLong(KEY_RECOVERY_WINDOW_STARTED_AT, windowStartedAt)
            .putInt(KEY_RECOVERY_ATTEMPTS, attempts)
            .putLong(KEY_LAST_RECOVERY_AT, now)
            .commit();
        return attempts;
    }

    static int getRecoveryAttempts(Context context) {
        return prefs(context).getInt(KEY_RECOVERY_ATTEMPTS, 0);
    }

    static long getLastLaunchAt(Context context) {
        return prefs(context).getLong(KEY_LAST_LAUNCH_AT, 0L);
    }

    static long getLastHealthyAt(Context context) {
        return prefs(context).getLong(KEY_LAST_HEALTHY_AT, 0L);
    }

    static long getLastRecoveryAt(Context context) {
        return prefs(context).getLong(KEY_LAST_RECOVERY_AT, 0L);
    }
}
