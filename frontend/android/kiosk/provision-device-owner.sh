#!/usr/bin/env bash
#
# Provisions a factory-reset Android tablet as a dedicated HKids kiosk device.
#
# Prerequisites:
#   - Tablet factory reset, USB debugging enabled, NO Google or other account added
#   - adb on PATH, tablet authorised (adb devices shows "device")
#
# Usage:
#   ./provision-device-owner.sh [path/to/app-release.apk]
#   ./provision-device-owner.sh --remove

set -euo pipefail

PACKAGE="com.lelitquilit.app"
ADMIN="${PACKAGE}/.HKidsDeviceAdminReceiver"

command -v adb >/dev/null 2>&1 || {
  echo "adb was not found on PATH. Install Android platform-tools first." >&2
  exit 1
}

echo "Waiting for a connected device..."
adb wait-for-device

if [[ "${1:-}" == "--remove" ]]; then
  echo "Removing device owner and restoring normal Android mode..."
  adb shell dpm remove-active-admin "$ADMIN" || true
  adb shell settings put global stay_on_while_plugged_in 0 || true
  echo "Device owner removed. Reboot the tablet to finish."
  exit 0
fi

if [[ -n "${1:-}" ]]; then
  [[ -f "$1" ]] || { echo "APK not found: $1" >&2; exit 1; }
  echo "Installing $1..."
  adb install -r -g "$1"
fi

echo "Checking that no account blocks provisioning..."
if adb shell dumpsys account | grep -q "Account {"; then
  echo "WARNING: accounts are present on the device, dpm set-device-owner will fail." >&2
  echo "WARNING: factory reset the tablet and skip account setup, then run again." >&2
fi

echo "Setting $ADMIN as device owner..."
adb shell dpm set-device-owner "$ADMIN"

# Screen stays on while charging: dedicated tablets are usually docked.
adb shell settings put global stay_on_while_plugged_in 7 || true
adb shell settings put system screen_off_timeout 1800000 || true

echo "Launching HKids to apply the kiosk policies..."
adb shell monkey -p "$PACKAGE" -c android.intent.category.LAUNCHER 1 >/dev/null

echo
echo "Device owner provisioning complete."
echo "Reboot the tablet to verify auto-launch: adb reboot"
