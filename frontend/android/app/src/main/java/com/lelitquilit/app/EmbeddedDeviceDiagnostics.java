package com.lelitquilit.app;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.os.BatteryManager;
import android.os.Build;
import android.os.PowerManager;
import android.os.StatFs;
import android.os.SystemClock;

import com.getcapacitor.JSObject;

import java.io.File;

/**
 * Read-only diagnostics for embedded Android tablets.
 *
 * Values intentionally avoid stable hardware identifiers. They are meant for operational
 * health checks in the parent kiosk panel and crash/performance triage.
 */
final class EmbeddedDeviceDiagnostics {
    private static final int STORAGE_CRITICAL_PERCENT = 5;
    private static final int STORAGE_WARNING_PERCENT = 12;
    private static final int MEMORY_CRITICAL_PERCENT = 8;
    private static final int MEMORY_WARNING_PERCENT = 18;
    private static final int BATTERY_WARNING_PERCENT = 20;

    private EmbeddedDeviceDiagnostics() {
    }

    static JSObject collect(Context context, Activity activity) {
        Context appContext = context.getApplicationContext();
        JSObject result = new JSObject();

        result.put("diagnosticsVersion", 1);
        result.put("timestamp", System.currentTimeMillis());
        result.put("uptimeMs", SystemClock.uptimeMillis());
        result.put("elapsedRealtimeMs", SystemClock.elapsedRealtime());
        result.put("lastLaunchAt", KioskState.getLastLaunchAt(appContext));
        result.put("lastHealthyAt", KioskState.getLastHealthyAt(appContext));
        result.put("lastRecoveryAt", KioskState.getLastRecoveryAt(appContext));
        result.put("recoveryAttempts", KioskState.getRecoveryAttempts(appContext));
        result.put("interactive", KioskWakeLock.isDeviceInteractive(appContext));
        result.put("kioskEnabled", KioskState.isKioskEnabled(appContext));
        result.put("deviceOwner", KioskPolicyManager.isDeviceOwner(appContext));

        JSObject memory = memoryDiagnostics(appContext);
        JSObject storage = storageDiagnostics(appContext);
        JSObject battery = batteryDiagnostics(appContext);
        JSObject network = networkDiagnostics(appContext);
        JSObject process = processDiagnostics();
        JSObject webview = webviewDiagnostics(activity);

        result.put("memory", memory);
        result.put("storage", storage);
        result.put("battery", battery);
        result.put("network", network);
        result.put("process", process);
        result.put("webview", webview);
        result.put("health", calculateEmbeddedHealth(
            memory.optString("pressure", "unknown"),
            storage.optString("pressure", "unknown"),
            battery.optInt("percent", -1),
            battery.optBoolean("charging", false),
            network.optBoolean("connected", false),
            KioskState.isKioskEnabled(appContext),
            KioskWakeLock.isHeld()
        ));

        return result;
    }

    static int percentage(long part, long total) {
        if (part < 0L || total <= 0L) return -1;
        return (int) Math.max(0L, Math.min(100L, Math.round((part * 100.0d) / total)));
    }

    static int normalizeBatteryPercent(int level, int scale) {
        if (level < 0 || scale <= 0) return -1;
        return percentage(level, scale);
    }

    static String classifyStoragePressure(long availableBytes, long totalBytes) {
        int availablePercent = percentage(availableBytes, totalBytes);
        if (availablePercent < 0) return "unknown";
        if (availablePercent <= STORAGE_CRITICAL_PERCENT) return "critical";
        if (availablePercent <= STORAGE_WARNING_PERCENT) return "warning";
        return "healthy";
    }

    static String classifyMemoryPressure(
        long availableBytes,
        long totalBytes,
        long thresholdBytes,
        boolean lowMemory
    ) {
        if (lowMemory) return "critical";
        if (availableBytes >= 0L && thresholdBytes > 0L && availableBytes <= thresholdBytes) {
            return "critical";
        }

        int availablePercent = percentage(availableBytes, totalBytes);
        if (availablePercent < 0) return "unknown";
        if (availablePercent <= MEMORY_CRITICAL_PERCENT) return "critical";
        if (availablePercent <= MEMORY_WARNING_PERCENT) return "warning";
        return "healthy";
    }

    static String calculateEmbeddedHealth(
        String memoryPressure,
        String storagePressure,
        int batteryPercent,
        boolean charging,
        boolean networkConnected,
        boolean kioskEnabled,
        boolean wakeLockHeld
    ) {
        if ("critical".equals(memoryPressure) || "critical".equals(storagePressure)) {
            return "critical";
        }
        if (kioskEnabled && !wakeLockHeld) return "warning";
        if (!networkConnected) return "warning";
        if (!charging && batteryPercent >= 0 && batteryPercent <= BATTERY_WARNING_PERCENT) {
            return "warning";
        }
        if ("warning".equals(memoryPressure) || "warning".equals(storagePressure)) {
            return "warning";
        }
        return "healthy";
    }

    private static JSObject memoryDiagnostics(Context context) {
        JSObject memory = new JSObject();
        ActivityManager activityManager =
            (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        ActivityManager.MemoryInfo memoryInfo = new ActivityManager.MemoryInfo();

        if (activityManager != null) {
            activityManager.getMemoryInfo(memoryInfo);
            memory.put("availableBytes", memoryInfo.availMem);
            memory.put("totalBytes", memoryInfo.totalMem);
            memory.put("thresholdBytes", memoryInfo.threshold);
            memory.put("lowMemory", memoryInfo.lowMemory);
            memory.put("availablePercent", percentage(memoryInfo.availMem, memoryInfo.totalMem));
            memory.put("pressure", classifyMemoryPressure(
                memoryInfo.availMem,
                memoryInfo.totalMem,
                memoryInfo.threshold,
                memoryInfo.lowMemory
            ));
        } else {
            memory.put("pressure", "unknown");
            memory.put("availablePercent", -1);
        }

        return memory;
    }

    private static JSObject storageDiagnostics(Context context) {
        JSObject storage = new JSObject();
        try {
            File filesDir = context.getFilesDir();
            StatFs statFs = new StatFs(filesDir.getAbsolutePath());
            long availableBytes = statFs.getAvailableBytes();
            long totalBytes = statFs.getTotalBytes();
            storage.put("availableBytes", availableBytes);
            storage.put("totalBytes", totalBytes);
            storage.put("availablePercent", percentage(availableBytes, totalBytes));
            storage.put("pressure", classifyStoragePressure(availableBytes, totalBytes));
        } catch (Exception error) {
            storage.put("availablePercent", -1);
            storage.put("pressure", "unknown");
        }
        return storage;
    }

    private static JSObject batteryDiagnostics(Context context) {
        JSObject battery = new JSObject();
        Intent batteryIntent = context.registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        if (batteryIntent == null) {
            battery.put("present", false);
            battery.put("percent", -1);
            battery.put("charging", false);
            return battery;
        }

        int level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
        int scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
        int status = batteryIntent.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
        int plugged = batteryIntent.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0);
        boolean charging = status == BatteryManager.BATTERY_STATUS_CHARGING
            || status == BatteryManager.BATTERY_STATUS_FULL
            || plugged != 0;

        battery.put("present", batteryIntent.getBooleanExtra(BatteryManager.EXTRA_PRESENT, true));
        battery.put("percent", normalizeBatteryPercent(level, scale));
        battery.put("charging", charging);
        battery.put("plugged", plugged);
        return battery;
    }

    private static JSObject networkDiagnostics(Context context) {
        JSObject network = new JSObject();
        network.put("connected", false);
        network.put("type", "none");

        ConnectivityManager connectivityManager =
            (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (connectivityManager == null) return network;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Network activeNetwork = connectivityManager.getActiveNetwork();
                NetworkCapabilities capabilities = activeNetwork == null
                    ? null
                    : connectivityManager.getNetworkCapabilities(activeNetwork);
                if (capabilities == null) return network;

                network.put("connected", capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET));
                network.put("type", networkType(capabilities));
                return network;
            }

            NetworkInfo info = connectivityManager.getActiveNetworkInfo();
            if (info == null) return network;
            network.put("connected", info.isConnected());
            network.put("type", info.getTypeName() == null ? "unknown" : info.getTypeName().toLowerCase());
        } catch (Exception error) {
            network.put("type", "unknown");
        }

        return network;
    }

    private static String networkType(NetworkCapabilities capabilities) {
        if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) return "wifi";
        if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) return "ethernet";
        if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) return "cellular";
        if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH)) return "bluetooth";
        return "unknown";
    }

    private static JSObject processDiagnostics() {
        Runtime runtime = Runtime.getRuntime();
        JSObject process = new JSObject();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = Math.max(0L, totalMemory - freeMemory);

        process.put("availableProcessors", runtime.availableProcessors());
        process.put("heapUsedBytes", usedMemory);
        process.put("heapFreeBytes", freeMemory);
        process.put("heapTotalBytes", totalMemory);
        process.put("heapMaxBytes", runtime.maxMemory());
        process.put("heapUsedPercent", percentage(usedMemory, runtime.maxMemory()));
        return process;
    }

    private static JSObject webviewDiagnostics(Activity activity) {
        JSObject webview = new JSObject();
        webview.put("hasWindowFocus", activity != null && activity.hasWindowFocus());
        webview.put("wakeLockHeld", KioskWakeLock.isHeld());
        webview.put("wakeLockScreenLevel", KioskWakeLock.isScreenLevel());
        webview.put("wakeLockAcquiredAtElapsedMs", KioskWakeLock.getAcquiredAtElapsedMs());
        webview.put("wakeLockTimeoutMs", KioskWakeLock.getTimeoutMs());
        webview.put("wakeLockRemainingMs", KioskWakeLock.getRemainingMs());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            PowerManager powerManager =
                activity == null
                    ? null
                    : (PowerManager) activity.getSystemService(Context.POWER_SERVICE);
            webview.put("powerSaveMode", powerManager != null && powerManager.isPowerSaveMode());
        } else {
            webview.put("powerSaveMode", false);
        }
        return webview;
    }
}
