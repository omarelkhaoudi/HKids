# Mode kiosk Android — Le Lit Qui Lit

Tablette dédiée « HKids » : l'appareil démarre sur l'application, ne peut pas en sortir et
se restaure automatiquement après un redémarrage, une mise à jour ou un crash.

> Le même APK reste une application Android normale quand le mode kiosk n'est pas activé.
> Aucun comportement kiosk n'est appliqué tant que le drapeau `kiosk_enabled` est faux et
> que l'application n'est pas *device owner*.

## 1. Les deux niveaux de kiosk

| | Kiosk supervisé (sans provisioning) | Kiosk dédié (device owner) |
|---|---|---|
| Activation | `enableKiosk()` depuis l'app | `dpm set-device-owner` ou QR / NFC |
| Verrouillage | Épinglage d'écran (`startLockTask` avec confirmation système) | Lock Task silencieux |
| Home / Récents | Touches bloquées + relance automatique | Impossible (Lock Task) |
| Écran d'accueil | Non | Oui (`KioskLauncherAlias`) |
| Barre de statut | Masquée (immersif) | Désactivée par politique |
| Keyguard | Standard | Désactivé |
| Désinstallation | Possible | Bloquée |
| Usage | Tablette familiale, démo partenaire | Déploiement crèche / école / hôtel |

## 2. Provisioning device owner

### Via ADB (tablette en atelier)

```powershell
cd frontend\android\kiosk
.\provision-device-owner.ps1 -ApkPath ..\app\build\outputs\apk\release\app-release.apk
```

```bash
cd frontend/android/kiosk
./provision-device-owner.sh ../app/build/outputs/apk/release/app-release.apk
```

Le script installe l'APK, vérifie qu'aucun compte ne bloque le provisioning, exécute
`dpm set-device-owner com.lelitquilit.app/.HKidsDeviceAdminReceiver`, force l'écran allumé
sur secteur puis lance l'application pour appliquer les politiques.

> La tablette doit être **réinitialisée en usine et sans aucun compte** (ni Google, ni
> autre). Sinon `set-device-owner` échoue avec `Not allowed to set the device owner`.

### Via QR code (déploiement en série)

`frontend/android/kiosk/qr-provisioning.json` contient le payload prêt à encoder. Renseignez
l'URL HTTPS de l'APK signé et le checksum du certificat de signature, supprimez les champs
`_comment`, encodez en QR, puis tapez 6 fois sur l'écran d'accueil d'une tablette
réinitialisée pour ouvrir le lecteur QR.

À la fin du provisioning, `HKidsDeviceAdminReceiver.onProfileProvisioningComplete()` active
le mode kiosk, applique les politiques et lance l'application : aucune manipulation
supplémentaire n'est nécessaire.

### Retour en mode Android normal

```powershell
.\provision-device-owner.ps1 -Remove
```

Depuis l'application, le tableau de bord parent (« Tablette dédiée ») désactive le mode
kiosk et restaure keyguard, barre de statut et écran d'accueil sans supprimer le device
owner : le mode kiosk peut être réactivé sans re-provisionner.

## 3. Ce qui est appliqué sur une tablette dédiée

`KioskPolicyManager.applyDedicatedDevicePolicies()` :

- `setLockTaskPackages` — HKids autorisé en Lock Task
- `setLockTaskFeatures(GLOBAL_ACTIONS)` — seul le menu d'alimentation reste accessible
- `setKeyguardDisabled(true)` — pas d'écran de verrouillage au réveil
- `setStatusBarDisabled(true)` — notifications et réglages rapides inaccessibles
- `STAY_ON_WHILE_PLUGGED_IN` — écran allumé sur secteur, USB et induction
- Restrictions utilisateur : `DISALLOW_SAFE_BOOT`, `DISALLOW_FACTORY_RESET`,
  `DISALLOW_ADD_USER`, `DISALLOW_MOUNT_PHYSICAL_MEDIA`, `DISALLOW_INSTALL_UNKNOWN_SOURCES`
- `setUninstallBlocked` — HKids ne peut pas être désinstallée
- `addPersistentPreferredActivity` — HKids devient l'écran d'accueil, sans sélecteur

## 4. Lanceur kiosk et mode Android normal

Le filtre d'intention `HOME` est porté par un **activity-alias désactivé par défaut** :

```
com.lelitquilit.app/.KioskLauncherAlias   (android:enabled="false")
```

`KioskPolicyManager.setKioskLauncher(true)` l'active via `setComponentEnabledSetting` et
enregistre l'activité d'accueil persistante. Conséquence : sur une installation classique,
HKids n'apparaît **jamais** dans le sélecteur de lanceur Android, et l'appui sur Home se
comporte normalement.

## 5. Récupération après redémarrage et crash

| Situation | Mécanisme |
|---|---|
| Redémarrage | `BootReceiver` (`BOOT_COMPLETED`, `QUICKBOOT_POWERON`) → réapplique les politiques puis lance l'activité |
| Mise à jour de l'APK | `MY_PACKAGE_REPLACED` → même chemin |
| Démarrage à froid | `MainActivity.restoreKioskSession()` → politiques + Lock Task + wake lock |
| Lock Task perdu | `MainActivity.onResume()` → `reassertLockTask()` |
| Sortie non autorisée | `MainActivity.onStop()` → relance l'activité (throttlée à 1 s) |
| Crash fatal | `KioskRecovery` → redémarrage planifié par `AlarmManager` |
| Sortie de Lock Task inattendue | `onLockTaskModeExiting` → redémarrage planifié |

`BootReceiver` retourne immédiatement quand le mode kiosk est désactivé : un téléphone
normal démarre sur son lanceur habituel.

## 6. Sortie contrôlée (anti-sortie accidentelle)

Bloqué nativement : `KEYCODE_HOME`, `KEYCODE_APP_SWITCH`, `KEYCODE_MENU`,
`KEYCODE_SETTINGS`, retour système en Lock Task, changement de tâche.

Seule sortie autorisée — `KioskExitGate` :

1. Appui long de **3 secondes** sur un coin invisible en haut au début de la ligne
2. Saisie du **code parent** à 4 chiffres
3. 3 échecs → verrouillage de 30 secondes
4. Succès → `requestExit()` : quitte Lock Task, désarme la relance, remet la tablette à Android

Le code se configure dans le tableau de bord parent, ou par défaut via
`VITE_KIOSK_EXIT_CODE`. **Changez-le avant tout déploiement.**

## 7. Optimisation tablette

- Orientation : `MainActivity.applyDeviceOrientation()` verrouille les téléphones en
  portrait et laisse les tablettes (`smallestScreenWidthDp >= 600`) tourner librement.
  Le manifeste ne fixe plus d'orientation.
- `android:resizeableActivity="true"` et `<supports-screens>` pour les grands écrans.
- Classe CSS `.kiosk-tablet` : corps de texte à 17 px, cibles tactiles à 56 px.
- Classe CSS `.kiosk-locked` : plus de sélection de texte, de rebond de défilement ni de
  barres de défilement visibles.
- Wake lock `SCREEN_BRIGHT` maintenu tant que le mode kiosk est actif, pour que les
  histoires audio longues ne soient jamais coupées.
- Cycle de veille géré : atténuation après 2 min, quasi-noir après 5 min, réveil au toucher.

## 8. API JS

```js
import {
  enableKiosk, disableKiosk, isKioskActive, isDeviceOwner, getKioskStatus,
  applyDeviceOwnerPolicies, clearDeviceOwnerPolicies, setKioskLauncher,
  acquireWakeLock, releaseWakeLock, setOrientation, refreshImmersiveMode,
  provisionKioskTablet, releaseKioskTablet,
  getKioskExitCode, setKioskExitCode, verifyKioskExitCode, requestKioskExit,
  setScreenBrightness, keepScreenOn, wakeScreen, startSleepCycle, stopSleepCycle,
} from '../services/mobile/kioskService';
```

Toutes les méthodes sont des no-op sûrs sur le web et iOS.

| Méthode | Description |
|---|---|
| `enableKiosk({ persistent })` | Lock Task + politiques + persistance du drapeau |
| `disableKiosk({ clearPolicies })` | Quitte le kiosk, restaure Android si `clearPolicies` |
| `provisionKioskTablet()` | Passe complète : politiques → lanceur → Lock Task → wake lock |
| `releaseKioskTablet()` | Retour au mode Android normal, device owner conservé |
| `requestKioskExit(code)` | Sortie autorisée après vérification du code parent |
| `getKioskStatus()` | `deviceOwner`, `kioskEnabled`, `tablet`, `smallestWidthDp`, `wakeLockHeld`… |
| `setOrientation('auto')` | `auto` (classe d'appareil), `portrait`, `landscape`, `sensor` |
| `acquireWakeLock({ screen })` | `screen: false` pour un verrou CPU seul (audio en fond) |

`getKioskStatus()` est lu une fois au démarrage par `capacitorRuntime.js`, qui reflète
l'état sur `<html>` : classes `kiosk-tablet` / `kiosk-locked` et `data-kiosk-mode`
(`device_owner`, `soft`, `off`).

## 9. Variables d'environnement

| Variable | Défaut | Description |
|---|---|---|
| `VITE_ANDROID_KIOSK_IDLE_MS` | `600000` | Retour automatique vers `/kids` après inactivité (0 = désactivé) |
| `VITE_KIOSK_EXIT_CODE` | `1379` | Code parent de sortie du kiosk — **à changer** |
| `VITE_KIOSK_AUTO_ENABLE` | `false` | `true` active le kiosk supervisé au premier lancement (unités de démo) |

## 10. Matrice de tests avant déploiement

Mode Android normal (téléphone non provisionné) :

- [ ] HKids n'apparaît pas dans le sélecteur de lanceur Android
- [ ] Un redémarrage démarre sur le lanceur habituel, pas sur HKids
- [ ] Home et Récents fonctionnent normalement
- [ ] Le bouton retour navigue dans l'application comme avant

Mode kiosk dédié (tablette device owner) :

- [ ] `adb reboot` → HKids se lance seule, sans sélecteur
- [ ] Home, Récents, Réglages et retour n'ont aucun effet
- [ ] Barre de statut inaccessible, pas d'écran de verrouillage au réveil
- [ ] `adb install -r` (mise à jour) → l'app se relance en Lock Task
- [ ] Appui long 3 s + code parent → sortie vers Android
- [ ] Code erroné 3 fois → verrouillage 30 s
- [ ] Rotation libre sur tablette, portrait forcé sur téléphone
- [ ] Lecture audio de 30 min sans extinction d'écran
- [ ] Lecture hors ligne d'un livre téléchargé

## 11. Références

- Intégration Capacitor : `docs/ANDROID_CAPACITOR.md`
- Vue d'ensemble kiosk et API : `docs/KIOSK_MODE.md`
- Rapport release : `docs/ANDROID_RELEASE_REPORT.md`
- Natif : `frontend/android/app/src/main/java/com/lelitquilit/app/`
- Runtime JS : `frontend/src/services/mobile/`
