package com.lelitquilit.app;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.BatteryManager;
import android.os.Build;
import android.os.UserManager;
import android.provider.Settings;
import android.util.Log;

/**
 * Wraps every DevicePolicyManager interaction needed by a dedicated HKids tablet.
 *
 * Nothing here has any effect unless the app was provisioned as device owner, so the
 * same APK installed normally behaves like a regular Capacitor application.
 */
final class KioskPolicyManager {
    private static final String TAG = "HKidsKioskPolicy";

    /** Disabled by default in the manifest; only enabled on a provisioned tablet. */
    static final String LAUNCHER_ALIAS = "com.lelitquilit.app.KioskLauncherAlias";

    private static final String[] KIOSK_RESTRICTIONS = {
        UserManager.DISALLOW_SAFE_BOOT,
        UserManager.DISALLOW_FACTORY_RESET,
        UserManager.DISALLOW_ADD_USER,
        UserManager.DISALLOW_MOUNT_PHYSICAL_MEDIA,
        UserManager.DISALLOW_INSTALL_UNKNOWN_SOURCES,
    };

    private static final int STAY_ON_ALL_SOURCES =
        BatteryManager.BATTERY_PLUGGED_AC
            | BatteryManager.BATTERY_PLUGGED_USB
            | BatteryManager.BATTERY_PLUGGED_WIRELESS;

    private KioskPolicyManager() {
    }

    static DevicePolicyManager policyManager(Context context) {
        return (DevicePolicyManager) context.getApplicationContext()
            .getSystemService(Context.DEVICE_POLICY_SERVICE);
    }

    static ComponentName adminComponent(Context context) {
        return new ComponentName(context.getApplicationContext(), HKidsDeviceAdminReceiver.class);
    }

    static ComponentName launcherComponent(Context context) {
        return new ComponentName(context.getApplicationContext().getPackageName(), LAUNCHER_ALIAS);
    }

    static boolean isDeviceOwner(Context context) {
        try {
            DevicePolicyManager dpm = policyManager(context);
            return dpm != null && dpm.isDeviceOwnerApp(context.getApplicationContext().getPackageName());
        } catch (Exception error) {
            Log.w(TAG, "Device owner check failed: " + error.getMessage());
            return false;
        }
    }

    /** True when the tablet can still be provisioned through ADB / QR / NFC. */
    static boolean isProvisioningAllowed(Context context) {
        try {
            DevicePolicyManager dpm = policyManager(context);
            return dpm != null && dpm.isProvisioningAllowed(DevicePolicyManager.ACTION_PROVISION_MANAGED_DEVICE);
        } catch (Exception error) {
            return false;
        }
    }

    /**
     * Whitelists HKids for Lock Task. Required before {@code startLockTask()} can run
     * without the system pinning confirmation dialog.
     */
    static void applyLockTaskPolicy(Context context) {
        if (!isDeviceOwner(context)) return;

        DevicePolicyManager dpm = policyManager(context);
        ComponentName admin = adminComponent(context);
        String packageName = context.getApplicationContext().getPackageName();

        try {
            dpm.setLockTaskPackages(admin, new String[] { packageName });
        } catch (Exception error) {
            Log.w(TAG, "setLockTaskPackages failed: " + error.getMessage());
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            try {
                // Keep the power menu reachable for supervising adults, hide everything else.
                dpm.setLockTaskFeatures(admin, DevicePolicyManager.LOCK_TASK_FEATURE_GLOBAL_ACTIONS);
            } catch (Exception error) {
                Log.w(TAG, "setLockTaskFeatures failed: " + error.getMessage());
            }
        }
    }

    /**
     * Full dedicated-device configuration: no keyguard, no status bar, screen stays on
     * while charging, HKids cannot be uninstalled and owns the HOME intent.
     */
    static void applyDedicatedDevicePolicies(Context context) {
        if (!isDeviceOwner(context)) return;

        DevicePolicyManager dpm = policyManager(context);
        ComponentName admin = adminComponent(context);
        String packageName = context.getApplicationContext().getPackageName();

        applyLockTaskPolicy(context);

        trySetKeyguardDisabled(dpm, admin, true);
        trySetStatusBarDisabled(dpm, admin, true);

        try {
            dpm.setGlobalSetting(admin, Settings.Global.STAY_ON_WHILE_PLUGGED_IN,
                String.valueOf(STAY_ON_ALL_SOURCES));
        } catch (Exception error) {
            Log.w(TAG, "STAY_ON_WHILE_PLUGGED_IN failed: " + error.getMessage());
        }

        for (String restriction : KIOSK_RESTRICTIONS) {
            try {
                dpm.addUserRestriction(admin, restriction);
            } catch (Exception error) {
                Log.w(TAG, "addUserRestriction " + restriction + " failed: " + error.getMessage());
            }
        }

        try {
            dpm.setUninstallBlocked(admin, packageName, true);
        } catch (Exception error) {
            Log.w(TAG, "setUninstallBlocked failed: " + error.getMessage());
        }

        setKioskLauncher(context, true);
    }

    /** Restores a normal Android device: keyguard, status bar, HOME chooser, uninstall. */
    static void clearDedicatedDevicePolicies(Context context) {
        if (!isDeviceOwner(context)) {
            setLauncherAliasEnabled(context, false);
            return;
        }

        DevicePolicyManager dpm = policyManager(context);
        ComponentName admin = adminComponent(context);
        String packageName = context.getApplicationContext().getPackageName();

        setKioskLauncher(context, false);

        trySetKeyguardDisabled(dpm, admin, false);
        trySetStatusBarDisabled(dpm, admin, false);

        try {
            dpm.setGlobalSetting(admin, Settings.Global.STAY_ON_WHILE_PLUGGED_IN, "0");
        } catch (Exception error) {
            Log.w(TAG, "Reset STAY_ON_WHILE_PLUGGED_IN failed: " + error.getMessage());
        }

        for (String restriction : KIOSK_RESTRICTIONS) {
            try {
                dpm.clearUserRestriction(admin, restriction);
            } catch (Exception error) {
                Log.w(TAG, "clearUserRestriction " + restriction + " failed: " + error.getMessage());
            }
        }

        try {
            dpm.setUninstallBlocked(admin, packageName, false);
        } catch (Exception error) {
            Log.w(TAG, "Unblock uninstall failed: " + error.getMessage());
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            try {
                dpm.setLockTaskFeatures(admin, DevicePolicyManager.LOCK_TASK_FEATURE_NONE);
            } catch (Exception error) {
                Log.w(TAG, "Reset lock task features failed: " + error.getMessage());
            }
        }
    }

    /**
     * Turns HKids into the tablet home screen. The alias carries the HOME intent filter
     * so a non-kiosk install never appears in the launcher chooser.
     */
    static void setKioskLauncher(Context context, boolean enabled) {
        setLauncherAliasEnabled(context, enabled);

        if (!isDeviceOwner(context)) return;

        DevicePolicyManager dpm = policyManager(context);
        ComponentName admin = adminComponent(context);

        try {
            if (enabled) {
                IntentFilter homeFilter = new IntentFilter(Intent.ACTION_MAIN);
                homeFilter.addCategory(Intent.CATEGORY_HOME);
                homeFilter.addCategory(Intent.CATEGORY_DEFAULT);
                dpm.addPersistentPreferredActivity(admin, homeFilter, launcherComponent(context));
            } else {
                dpm.clearPackagePersistentPreferredActivities(
                    admin, context.getApplicationContext().getPackageName());
            }
        } catch (Exception error) {
            Log.w(TAG, "Persistent home activity update failed: " + error.getMessage());
        }
    }

    static boolean isKioskLauncherEnabled(Context context) {
        try {
            int state = context.getApplicationContext().getPackageManager()
                .getComponentEnabledSetting(launcherComponent(context));
            return state == PackageManager.COMPONENT_ENABLED_STATE_ENABLED;
        } catch (Exception error) {
            return false;
        }
    }

    private static void setLauncherAliasEnabled(Context context, boolean enabled) {
        try {
            context.getApplicationContext().getPackageManager().setComponentEnabledSetting(
                launcherComponent(context),
                enabled
                    ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                    : PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP
            );
        } catch (Exception error) {
            Log.w(TAG, "Launcher alias toggle failed: " + error.getMessage());
        }
    }

    private static void trySetKeyguardDisabled(DevicePolicyManager dpm, ComponentName admin, boolean disabled) {
        try {
            dpm.setKeyguardDisabled(admin, disabled);
        } catch (Exception error) {
            Log.w(TAG, "setKeyguardDisabled failed: " + error.getMessage());
        }
    }

    private static void trySetStatusBarDisabled(DevicePolicyManager dpm, ComponentName admin, boolean disabled) {
        try {
            dpm.setStatusBarDisabled(admin, disabled);
        } catch (Exception error) {
            Log.w(TAG, "setStatusBarDisabled failed: " + error.getMessage());
        }
    }
}
