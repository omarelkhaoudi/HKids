package com.lelitquilit.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Auto-launches HKids after a reboot or an app update on dedicated tablets, and re-applies
 * the Device Owner policies so kiosk mode is fully restored before the child touches
 * the screen.
 *
 * On a standard install kiosk mode is off, so the receiver returns immediately and the
 * device boots to its normal launcher.
 */
public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "HKidsBootReceiver";

    private static final Set<String> LAUNCH_ACTIONS = new HashSet<>(Arrays.asList(
        Intent.ACTION_BOOT_COMPLETED,
        Intent.ACTION_MY_PACKAGE_REPLACED,
        // Non-standard but emitted by several tablet OEMs after a fast boot.
        "android.intent.action.QUICKBOOT_POWERON",
        "com.htc.intent.action.QUICKBOOT_POWERON"
    ));

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent == null ? null : intent.getAction();
        if (action == null || !LAUNCH_ACTIONS.contains(action)) return;

        if (!KioskState.isKioskEnabled(context)) {
            Log.i(TAG, "Kiosk disabled, leaving normal Android boot untouched");
            return;
        }

        if (KioskPolicyManager.isDeviceOwner(context)) {
            KioskPolicyManager.applyDedicatedDevicePolicies(context);
        }

        Log.i(TAG, "Restoring HKids kiosk after " + action);

        try {
            Intent launch = new Intent(context, MainActivity.class);
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
            context.startActivity(launch);
        } catch (Exception error) {
            // Background activity starts can be refused; the alarm path retries shortly after.
            Log.w(TAG, "Direct launch refused, scheduling retry: " + error.getMessage());
            KioskRecovery.scheduleRestart(context);
        }
    }
}
