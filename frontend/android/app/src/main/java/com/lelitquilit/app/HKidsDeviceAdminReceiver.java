package com.lelitquilit.app;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * Device Admin entry point required for Device Owner and Lock Task Mode.
 *
 * Provision on a factory-reset tablet with no accounts:
 *   adb shell dpm set-device-owner com.lelitquilit.app/.HKidsDeviceAdminReceiver
 *
 * See docs/ANDROID_KIOSK.md for the QR and NFC provisioning payloads.
 */
public class HKidsDeviceAdminReceiver extends DeviceAdminReceiver {
    private static final String TAG = "HKidsDeviceAdmin";

    @Override
    public void onEnabled(Context context, Intent intent) {
        Log.i(TAG, "Device admin enabled");
        if (KioskPolicyManager.isDeviceOwner(context)) {
            KioskPolicyManager.applyLockTaskPolicy(context);
        }
    }

    @Override
    public void onDisabled(Context context, Intent intent) {
        Log.i(TAG, "Device admin disabled; reverting to normal Android mode");
        KioskState.setKioskEnabled(context, false);
        KioskPolicyManager.setKioskLauncher(context, false);
    }

    @Override
    public CharSequence onDisableRequested(Context context, Intent intent) {
        return context.getString(R.string.kiosk_admin_disable_warning);
    }

    /**
     * Fired once managed provisioning (QR / NFC / zero-touch) completes. This is the first
     * chance to lock the tablet down, before HKids is ever launched.
     */
    @Override
    public void onProfileProvisioningComplete(Context context, Intent intent) {
        Log.i(TAG, "Managed provisioning complete; applying kiosk policies");
        KioskState.setKioskEnabled(context, true);
        KioskPolicyManager.applyDedicatedDevicePolicies(context);

        Intent launch = new Intent(context, MainActivity.class);
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            context.startActivity(launch);
        } catch (Exception error) {
            Log.w(TAG, "Post-provisioning launch failed: " + error.getMessage());
        }
    }

    @Override
    public void onLockTaskModeEntering(Context context, Intent intent, String packageName) {
        Log.i(TAG, "Lock task entering for " + packageName);
    }

    @Override
    public void onLockTaskModeExiting(Context context, Intent intent) {
        Log.i(TAG, "Lock task exiting");
        // An unexpected exit while kiosk is still enabled means the app must come back.
        if (KioskState.isKioskEnabled(context)) {
            KioskRecovery.scheduleRestart(context);
        }
    }
}
