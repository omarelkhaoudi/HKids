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
}
