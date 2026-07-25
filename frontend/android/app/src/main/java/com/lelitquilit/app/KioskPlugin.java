package com.lelitquilit.app;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.os.Build;
import android.view.WindowManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Native kiosk surface for dedicated HKids tablets: Lock Task, Device Owner policies,
 * launcher takeover, wake lock, brightness and orientation.
 *
 * Every method is safe to call on a non-provisioned device: it degrades to the soft kiosk
 * (screen pinning) or reports the missing capability instead of throwing.
 */
@CapacitorPlugin(name = "Kiosk")
public class KioskPlugin extends Plugin {

    @PluginMethod
    public void enableKiosk(PluginCall call) {
        boolean persistent = call.getBoolean("persistent", true);
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                if (persistent) {
                    KioskState.setKioskEnabled(activity, true);
                }

                boolean deviceOwner = KioskPolicyManager.isDeviceOwner(activity);
                if (deviceOwner) {
                    KioskPolicyManager.applyDedicatedDevicePolicies(activity);
                }

                activity.startLockTask();
                KioskWakeLock.acquire(activity, true, 0);

                JSObject result = new JSObject();
                result.put("enabled", true);
                result.put("deviceOwner", deviceOwner);
                result.put("mode", deviceOwner ? "lock_task" : "screen_pinning");
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Failed to enable kiosk: " + error.getMessage(), error);
            }
        });
    }

    @PluginMethod
    public void disableKiosk(PluginCall call) {
        boolean clearPolicies = call.getBoolean("clearPolicies", false);
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                // Clearing the flag is enough to disarm the exit guard and the boot receiver.
                KioskState.setKioskEnabled(activity, false);

                if (clearPolicies) {
                    KioskPolicyManager.clearDedicatedDevicePolicies(activity);
                } else {
                    KioskPolicyManager.setKioskLauncher(activity, false);
                }

                activity.stopLockTask();
                KioskWakeLock.release();

                JSObject result = new JSObject();
                result.put("enabled", false);
                result.put("policiesCleared", clearPolicies);
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Failed to disable kiosk: " + error.getMessage(), error);
            }
        });
    }

    /**
     * Applies the full dedicated-device configuration without waiting for a restart.
     * Requires Device Owner; otherwise reports what is still missing.
     */
    @PluginMethod
    public void applyDeviceOwnerPolicies(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        boolean deviceOwner = KioskPolicyManager.isDeviceOwner(activity);
        if (deviceOwner) {
            KioskPolicyManager.applyDedicatedDevicePolicies(activity);
        }

        JSObject result = new JSObject();
        result.put("applied", deviceOwner);
        result.put("deviceOwner", deviceOwner);
        result.put("provisioningAllowed", KioskPolicyManager.isProvisioningAllowed(activity));
        call.resolve(result);
    }

    @PluginMethod
    public void clearDeviceOwnerPolicies(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        KioskPolicyManager.clearDedicatedDevicePolicies(activity);

        JSObject result = new JSObject();
        result.put("cleared", true);
        result.put("deviceOwner", KioskPolicyManager.isDeviceOwner(activity));
        call.resolve(result);
    }

    /** Turns HKids into (or removes it from) the tablet home screen. */
    @PluginMethod
    public void setKioskLauncher(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", true);
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        KioskPolicyManager.setKioskLauncher(activity, enabled);

        JSObject result = new JSObject();
        result.put("launcher", KioskPolicyManager.isKioskLauncherEnabled(activity));
        result.put("persistentHome", enabled && KioskPolicyManager.isDeviceOwner(activity));
        call.resolve(result);
    }

    @PluginMethod
    public void isKioskActive(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        int lockTaskMode = lockTaskModeState(activity);
        JSObject result = new JSObject();
        result.put("active", lockTaskMode != ActivityManager.LOCK_TASK_MODE_NONE);
        result.put("enabled", KioskState.isKioskEnabled(activity));
        result.put("mode", lockTaskMode);
        result.put("deviceOwner", KioskPolicyManager.isDeviceOwner(activity));
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
        result.put("owner", KioskPolicyManager.isDeviceOwner(activity));
        result.put("provisioningAllowed", KioskPolicyManager.isProvisioningAllowed(activity));
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
            WindowManager.LayoutParams params = activity.getWindow().getAttributes();
            // -1 restores the system brightness; anything else is clamped to a visible value.
            params.screenBrightness = brightness < 0
                ? WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
                : Math.max(0.01f, Math.min(1.0f, brightness));
            activity.getWindow().setAttributes(params);

            JSObject result = new JSObject();
            result.put("brightness", params.screenBrightness);
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

    /**
     * Holds a wake lock so long audio sessions survive the screen turning off.
     * Pass {@code screen: false} for a CPU-only lock during background playback.
     */
    @PluginMethod
    public void acquireWakeLock(PluginCall call) {
        boolean screen = call.getBoolean("screen", true);
        long timeoutMs = call.getInt("timeoutMs", 0).longValue();
        Context context = getContext();
        if (context == null) {
            call.reject("Context not available");
            return;
        }

        boolean acquired = KioskWakeLock.acquire(context, screen, timeoutMs);

        JSObject result = new JSObject();
        result.put("held", acquired);
        result.put("screen", screen && acquired);
        call.resolve(result);
    }

    @PluginMethod
    public void releaseWakeLock(PluginCall call) {
        KioskWakeLock.release();

        JSObject result = new JSObject();
        result.put("held", false);
        call.resolve(result);
    }

    /**
     * Orientation control for tablet deployments.
     * Accepts {@code auto} (device default), {@code portrait}, {@code landscape} or {@code sensor}.
     */
    @PluginMethod
    public void setOrientation(PluginCall call) {
        String mode = call.getString("mode", "auto");
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                if ("auto".equals(mode) && activity instanceof MainActivity) {
                    ((MainActivity) activity).applyDeviceOrientation();
                } else {
                    activity.setRequestedOrientation(orientationFor(mode));
                }

                JSObject result = new JSObject();
                result.put("mode", mode);
                result.put("orientation", activity.getRequestedOrientation());
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Failed to set orientation: " + error.getMessage(), error);
            }
        });
    }

    /** Re-hides the system bars, useful after a keyboard or system dialog appeared. */
    @PluginMethod
    public void refreshImmersiveMode(PluginCall call) {
        Activity activity = getActivity();
        if (!(activity instanceof MainActivity)) {
            JSObject unavailable = new JSObject();
            unavailable.put("immersive", false);
            call.resolve(unavailable);
            return;
        }

        activity.runOnUiThread(() -> {
            ((MainActivity) activity).applyImmersiveMode();
            JSObject result = new JSObject();
            result.put("immersive", true);
            call.resolve(result);
        });
    }

    /**
     * Authorised exit used by the parent gate once the kiosk code has been verified: leaves
     * Lock Task, disarms the relaunch guard and hands the tablet back to Android. Device
     * Owner policies stay in place so kiosk mode can be resumed without re-provisioning.
     */
    @PluginMethod
    public void requestExit(PluginCall call) {
        boolean background = call.getBoolean("background", true);
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                KioskState.setKioskEnabled(activity, false);
                KioskState.markAuthorizedExit(activity);
                KioskPolicyManager.setKioskLauncher(activity, false);
                activity.stopLockTask();
                KioskWakeLock.release();

                if (background) {
                    activity.moveTaskToBack(true);
                }

                JSObject result = new JSObject();
                result.put("exited", true);
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Failed to exit kiosk: " + error.getMessage(), error);
            }
        });
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        Configuration configuration = activity.getResources().getConfiguration();
        int lockTaskMode = lockTaskModeState(activity);
        WindowManager.LayoutParams params = activity.getWindow().getAttributes();
        boolean screenOn = (params.flags & WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) != 0;

        JSObject result = new JSObject();
        result.put("platform", "android");
        result.put("kioskActive", lockTaskMode != ActivityManager.LOCK_TASK_MODE_NONE);
        result.put("kioskEnabled", KioskState.isKioskEnabled(activity));
        result.put("lockTaskMode", lockTaskMode);
        result.put("deviceOwner", KioskPolicyManager.isDeviceOwner(activity));
        result.put("provisioningAllowed", KioskPolicyManager.isProvisioningAllowed(activity));
        result.put("launcherEnabled", KioskPolicyManager.isKioskLauncherEnabled(activity));
        result.put("wakeLockHeld", KioskWakeLock.isHeld());
        result.put("screenOn", screenOn);
        result.put("brightness", params.screenBrightness);
        result.put("orientation", activity.getRequestedOrientation());
        result.put("tablet", configuration.smallestScreenWidthDp >= MainActivity.TABLET_MIN_WIDTH_DP);
        result.put("smallestWidthDp", configuration.smallestScreenWidthDp);
        result.put("sdkVersion", Build.VERSION.SDK_INT);
        result.put("model", Build.MODEL);
        result.put("manufacturer", Build.MANUFACTURER);
        call.resolve(result);
    }

    private static int lockTaskModeState(Activity activity) {
        ActivityManager activityManager =
            (ActivityManager) activity.getSystemService(Context.ACTIVITY_SERVICE);
        return activityManager == null
            ? ActivityManager.LOCK_TASK_MODE_NONE
            : activityManager.getLockTaskModeState();
    }

    private static int orientationFor(String mode) {
        switch (mode == null ? "" : mode) {
            case "portrait":
                return ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
            case "landscape":
                return ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE;
            case "sensor":
                return ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR;
            default:
                return ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED;
        }
    }
}
