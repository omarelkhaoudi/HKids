package com.lelitquilit.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * Restarts HKids after a fatal crash so a dedicated tablet never ends up on a blank
 * screen. Only armed while kiosk mode is enabled; a normal install keeps the default
 * Android crash dialog.
 */
final class KioskRecovery {
    private static final String TAG = "HKidsKioskRecovery";
    private static final int REQUEST_CODE = 4711;
    private static final long RESTART_DELAY_MS = 1200L;

    private static boolean installed = false;

    private KioskRecovery() {
    }

    static void install(Context context) {
        if (installed) return;
        installed = true;

        Context appContext = context.getApplicationContext();
        Thread.UncaughtExceptionHandler previous = Thread.getDefaultUncaughtExceptionHandler();

        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            try {
                if (KioskState.isKioskEnabled(appContext)) {
                    Log.e(TAG, "Fatal crash in kiosk mode, scheduling restart", throwable);
                    scheduleRestart(appContext);
                }
            } catch (Exception error) {
                Log.w(TAG, "Restart scheduling failed: " + error.getMessage());
            }

            if (previous != null) {
                previous.uncaughtException(thread, throwable);
            } else {
                System.exit(2);
            }
        });
    }

    static void scheduleRestart(Context context) {
        Context appContext = context.getApplicationContext();
        Intent launch = new Intent(appContext, MainActivity.class);
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            appContext,
            REQUEST_CODE,
            launch,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        AlarmManager alarmManager = (AlarmManager) appContext.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        // Inexact on purpose: no SCHEDULE_EXACT_ALARM permission is required.
        alarmManager.set(
            AlarmManager.RTC_WAKEUP,
            System.currentTimeMillis() + RESTART_DELAY_MS,
            pendingIntent
        );
    }
}
