# Provisions a factory-reset Android tablet as a dedicated HKids kiosk device.
#
# Prerequisites:
#   - Tablet factory reset, USB debugging enabled, NO Google or other account added
#   - adb on PATH, tablet authorised (adb devices shows "device")
#
# Usage:
#   .\provision-device-owner.ps1 -ApkPath ..\app\build\outputs\apk\release\app-release.apk
#   .\provision-device-owner.ps1 -Remove

[CmdletBinding()]
param(
    [string]$ApkPath = "",
    [string]$Package = "com.lelitquilit.app",
    [string]$AdminReceiver = ".HKidsDeviceAdminReceiver",
    [switch]$Remove
)

$ErrorActionPreference = "Stop"
$admin = "$Package/$AdminReceiver"

function Invoke-Adb {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$AdbArgs)
    Write-Host "adb $($AdbArgs -join ' ')" -ForegroundColor DarkGray
    & adb @AdbArgs
    if ($LASTEXITCODE -ne 0) { throw "adb $($AdbArgs -join ' ') failed with exit code $LASTEXITCODE" }
}

if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
    throw "adb was not found on PATH. Install Android platform-tools first."
}

Write-Host "Waiting for a connected device..." -ForegroundColor Cyan
Invoke-Adb wait-for-device

if ($Remove) {
    Write-Host "Removing device owner and restoring normal Android mode..." -ForegroundColor Yellow
    & adb shell dpm remove-active-admin $admin
    & adb shell settings put global stay_on_while_plugged_in 0
    Write-Host "Device owner removed. Reboot the tablet to finish." -ForegroundColor Green
    exit 0
}

if ($ApkPath) {
    if (-not (Test-Path $ApkPath)) { throw "APK not found: $ApkPath" }
    Write-Host "Installing $ApkPath..." -ForegroundColor Cyan
    Invoke-Adb install -r -g $ApkPath
}

Write-Host "Checking that no account blocks provisioning..." -ForegroundColor Cyan
$accounts = & adb shell dumpsys account | Select-String -Pattern "Account \{" -AllMatches
if ($accounts) {
    Write-Warning "Accounts are present on the device. dpm set-device-owner will fail."
    Write-Warning "Factory reset the tablet and skip account setup, then run this script again."
}

Write-Host "Setting $admin as device owner..." -ForegroundColor Cyan
Invoke-Adb shell dpm set-device-owner $admin

# Screen stays on while charging: dedicated tablets are usually docked.
& adb shell settings put global stay_on_while_plugged_in 7
& adb shell settings put system screen_off_timeout 1800000

Write-Host "Launching HKids to apply the kiosk policies..." -ForegroundColor Cyan
Invoke-Adb shell monkey -p $Package -c android.intent.category.LAUNCHER 1

Write-Host ""
Write-Host "Device owner provisioning complete." -ForegroundColor Green
Write-Host "Reboot the tablet to verify auto-launch: adb reboot" -ForegroundColor Green
