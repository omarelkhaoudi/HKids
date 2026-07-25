package com.lelitquilit.app;

import android.app.ActivityManager;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "HKidsMain";

    /** Tablet threshold used by Android resource qualifiers (sw600dp). */
    static final int TABLET_MIN_WIDTH_DP = 600;

    private static final long RELAUNCH_DELAY_MS = 350L;
    private static final long RELAUNCH_THROTTLE_MS = 1000L;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private long lastRelaunchAt = 0L;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(KioskPlugin.class);
        super.onCreate(savedInstanceState);

        KioskRecovery.install(this);
        applyDeviceOrientation();
        applyImmersiveMode();
        restoreKioskSession();
    }

    @Override
    protected void onResume() {
        super.onResume();
        applyImmersiveMode();
        reassertLockTask();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyImmersiveMode();
        }
    }

    @Override
    protected void onStop() {
        super.onStop();
        guardAgainstAccidentalExit();
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (isFinishing()) {
            KioskWakeLock.release();
        }
        super.onDestroy();
    }

    /**
     * Restores the dedicated-tablet configuration on every cold start, which is what makes
     * kiosk mode survive a reboot, an app update or a crash restart.
     */
    private void restoreKioskSession() {
        if (!KioskState.isKioskEnabled(this)) return;

        try {
            if (KioskPolicyManager.isDeviceOwner(this)) {
                KioskPolicyManager.applyDedicatedDevicePolicies(this);
                startLockTaskSafely();
            }
            KioskWakeLock.acquire(this, true, 0);
        } catch (Exception error) {
            Log.w(TAG, "Kiosk session restore failed: " + error.getMessage());
        }
    }

    /**
     * Re-engages Lock Task if the system dropped it (for instance after an OTA dialog).
     * Only automatic for device owners, where no confirmation dialog is shown.
     */
    private void reassertLockTask() {
        if (!KioskState.isKioskEnabled(this)) return;
        if (!KioskPolicyManager.isDeviceOwner(this)) return;
        if (lockTaskModeState() != ActivityManager.LOCK_TASK_MODE_NONE) return;
        startLockTaskSafely();
    }

    private void startLockTaskSafely() {
        try {
            KioskPolicyManager.applyLockTaskPolicy(this);
            if (lockTaskModeState() == ActivityManager.LOCK_TASK_MODE_NONE) {
                startLockTask();
                Log.i(TAG, "Lock task mode engaged");
            }
        } catch (Exception error) {
            Log.w(TAG, "startLockTask failed: " + error.getMessage());
        }
    }

    /**
     * Brings HKids back to the front when the activity is stopped without an authorised
     * exit. This covers the soft-kiosk case where the app is not device owner and a child
     * reaches the home screen through a system gesture.
     */
    private void guardAgainstAccidentalExit() {
        if (isFinishing()) return;
        if (!KioskState.isKioskEnabled(this)) return;
        if (KioskState.consumeAuthorizedExit(this)) return;

        long now = System.currentTimeMillis();
        if (now - lastRelaunchAt < RELAUNCH_THROTTLE_MS) return;
        lastRelaunchAt = now;

        handler.postDelayed(() -> {
            try {
                Intent intent = new Intent(this, MainActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                startActivity(intent);
            } catch (Exception error) {
                Log.w(TAG, "Kiosk relaunch failed: " + error.getMessage());
            }
        }, RELAUNCH_DELAY_MS);
    }

    /**
     * Blocks home, recents, menu and settings keys as soon as kiosk mode is on. Back is
     * only swallowed inside Lock Task; outside of it the web layer owns back navigation
     * and already refuses to leave the kids area.
     */
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int keyCode = event.getKeyCode();
        if (KioskState.isKioskEnabled(this)
                && (keyCode == KeyEvent.KEYCODE_HOME
                    || keyCode == KeyEvent.KEYCODE_APP_SWITCH
                    || keyCode == KeyEvent.KEYCODE_MENU
                    || keyCode == KeyEvent.KEYCODE_SETTINGS)) {
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onBackPressed() {
        if (isKioskLocked()) return;
        super.onBackPressed();
    }

    @Override
    public void onUserLeaveHint() {
        super.onUserLeaveHint();
        if (isKioskLocked()) {
            applyImmersiveMode();
        }
    }

    private boolean isKioskLocked() {
        return lockTaskModeState() != ActivityManager.LOCK_TASK_MODE_NONE;
    }

    private int lockTaskModeState() {
        ActivityManager activityManager = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
        return activityManager == null
            ? ActivityManager.LOCK_TASK_MODE_NONE
            : activityManager.getLockTaskModeState();
    }

    /**
     * Phones stay portrait as before; tablets rotate freely so a 10" screen can be used
     * in landscape for reading and in portrait for browsing.
     */
    void applyDeviceOrientation() {
        try {
            setRequestedOrientation(isTablet()
                ? ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR
                : ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        } catch (Exception error) {
            Log.w(TAG, "Orientation setup failed: " + error.getMessage());
        }
    }

    boolean isTablet() {
        return getResources().getConfiguration().smallestScreenWidthDp >= TABLET_MIN_WIDTH_DP;
    }

    void applyImmersiveMode() {
        Window window = getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
            }
            return;
        }

        View decorView = window.getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );
    }
}
