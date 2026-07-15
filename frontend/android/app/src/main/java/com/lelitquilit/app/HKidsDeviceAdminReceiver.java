package com.lelitquilit.app;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * Required for Device Owner / Lock Task Mode.
 * Set as device owner via ADB:
 *   adb shell dpm set-device-owner com.lelitquilit.app/.HKidsDeviceAdminReceiver
 */
public class HKidsDeviceAdminReceiver extends DeviceAdminReceiver {
    private static final String TAG = "HKidsDeviceAdmin";

    @Override
    public void onEnabled(Context context, Intent intent) {
        Log.i(TAG, "Device admin enabled");
    }

    @Override
    public void onDisabled(Context context, Intent intent) {
        Log.i(TAG, "Device admin disabled");
    }

    @Override
    public CharSequence onDisableRequested(Context context, Intent intent) {
        return "Le mode kiosk sera désactivé. L'appareil ne sera plus verrouillé sur HKids.";
    }
}
