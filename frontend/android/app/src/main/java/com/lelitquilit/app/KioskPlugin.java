package com.lelitquilit.app;

import android.app.Activity;
import android.app.ActivityManager;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.view.WindowManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Kiosk")
public class KioskPlugin extends Plugin {

    private PowerManager.WakeLock wakeLock;

    @PluginMethod
    public void enableKiosk(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                if (isDeviceOwnerInternal(activity)) {
                    DevicePolicyManager dpm = (DevicePolicyManager) activity.getSystemService(Context.DEVICE_POLICY_SERVICE);
                    ComponentName admin = new ComponentName(activity, HKidsDeviceAdminReceiver.class);
                    String[] packages = { activity.getPackageName() };
                    dpm.setLockTaskPackages(admin, packages);
                }
                activity.startLockTask();

                JSObject result = new JSObject();
                result.put("enabled", true);
                result.put("deviceOwner", isDeviceOwnerInternal(activity));
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to enable kiosk: " + e.getMessage(), e);
            }
        });
    }

    @PluginMethod
    public void disableKiosk(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                activity.stopLockTask();
                JSObject result = new JSObject();
                result.put("enabled", false);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to disable kiosk: " + e.getMessage(), e);
            }
        });
    }

    @PluginMethod
    public void isKioskActive(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        ActivityManager am = (ActivityManager) activity.getSystemService(Context.ACTIVITY_SERVICE);
        int lockTaskMode = am.getLockTaskModeState();
        boolean active = lockTaskMode != ActivityManager.LOCK_TASK_MODE_NONE;

        JSObject result = new JSObject();
        result.put("active", active);
        result.put("mode", lockTaskMode);
        result.put("deviceOwner", isDeviceOwnerInternal(activity));
        call.resolve(result);
    }

    @PluginMethod
    public void isDeviceOwner(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        JSObject result = new JSObject();
        result.put("owner", isDeviceOwnerInternal(activity));
        call.resolve(result);
    }

    @PluginMethod
    public void setScreenBrightness(PluginCall call) {
        float brightness = call.getFloat("brightness", 1.0f);
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        activity.runOnUiThread(() -> {
            WindowManager.LayoutParams lp = activity.getWindow().getAttributes();
            lp.screenBrightness = Math.max(0.01f, Math.min(1.0f, brightness));
            activity.getWindow().setAttributes(lp);

            JSObject result = new JSObject();
            result.put("brightness", lp.screenBrightness);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void keepScreenOn(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", true);
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        activity.runOnUiThread(() -> {
            if (enabled) {
                activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            } else {
                activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }

            JSObject result = new JSObject();
            result.put("enabled", enabled);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        ActivityManager am = (ActivityManager) activity.getSystemService(Context.ACTIVITY_SERVICE);
        int lockTaskMode = am.getLockTaskModeState();

        JSObject result = new JSObject();
        result.put("kioskActive", lockTaskMode != ActivityManager.LOCK_TASK_MODE_NONE);
        result.put("lockTaskMode", lockTaskMode);
        result.put("deviceOwner", isDeviceOwnerInternal(activity));
        result.put("screenOn", activity.getWindow().getAttributes().flags
                == (activity.getWindow().getAttributes().flags | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON));
        result.put("brightness", activity.getWindow().getAttributes().screenBrightness);
        result.put("sdkVersion", Build.VERSION.SDK_INT);
        call.resolve(result);
    }

    private boolean isDeviceOwnerInternal(Activity activity) {
        DevicePolicyManager dpm = (DevicePolicyManager) activity.getSystemService(Context.DEVICE_POLICY_SERVICE);
        return dpm.isDeviceOwnerApp(activity.getPackageName());
    }
}
