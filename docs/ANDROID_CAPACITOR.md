# Le Lit Qui Lit - Android embarque

Ce document decrit l'integration Android Capacitor ajoutee autour de l'application web HKids / Le Lit Qui Lit.

## Architecture

- Le frontend React/Vite reste la source principale.
- Capacitor embarque le build `frontend/dist` dans `frontend/android`.
- La PWA existante reste active pour le web via `manifest.webmanifest` et `sw.js`.
- Le runtime mobile est isole dans `frontend/src/services/mobile/capacitorRuntime.js`.
- Les permissions Android sont declarees dans `frontend/android/app/src/main/AndroidManifest.xml`.

## Runtime Android

Au demarrage natif Android, l'application :

- ajoute les classes CSS `capacitor-android` et `touch-kiosk`;
- cache la barre de statut via Capacitor StatusBar;
- masque le splash screen apres lancement;
- active un retour haptique leger sur les boutons et liens;
- gere le bouton retour Android;
- revient automatiquement vers `/kids` apres inactivite.

Le delai d'inactivite est configurable avec :

```bash
VITE_ANDROID_KIOSK_IDLE_MS=600000
```

Mettre `VITE_ANDROID_KIOSK_IDLE_MS=0` desactive ce comportement.

## Permissions Android

Permissions declarees :

- `INTERNET` et `ACCESS_NETWORK_STATE` pour API, cache et synchronisation;
- `RECORD_AUDIO` et `MODIFY_AUDIO_SETTINGS` pour assistant vocal et voix famille;
- `POST_NOTIFICATIONS` pour notifications Android recentes;
- `READ_MEDIA_AUDIO`, `READ_MEDIA_IMAGES` et `READ_EXTERNAL_STORAGE` pour compatibilite media;
- `VIBRATE` pour retour haptique;
- `WAKE_LOCK` pour usage kiosk/lecture prolongee.

Les cles OpenAI, ElevenLabs et autres fournisseurs restent cote backend.

## Mode kiosk

L'application prepare le kiosk logiciel :

- lancement en plein ecran;
- orientation portrait;
- barres systeme masquees en mode immersif;
- retour automatique a l'espace enfant apres inactivite.

Limites materielles :

- le lancement automatique apres redemarrage depend du firmware Android ou d'un MDM;
- le blocage complet des boutons systeme necessite un mode kiosk Android Enterprise, MDM ou launcher dedie;
- la prevention de sortie d'application ne peut pas etre garantie par une WebView seule.

## Offline et PWA

La compatibilite offline repose toujours sur :

- Service Worker pour assets et API GET;
- IndexedDB pour contenus volumineux;
- queue de synchronisation pour mutations;
- stockage local existant pour preferences et etats legers.

Capacitor embarque les assets du build, mais le Service Worker reste utile pour la version web/PWA et les caches applicatifs.

## Commandes

Depuis `frontend` :

```bash
npm.cmd install
npm.cmd run build
npm.cmd run android:sync
npm.cmd run android:open
```

Prerequis pour compiler l'APK/AAB :

- JDK installe;
- variable `JAVA_HOME` configuree;
- Android Studio ou Android SDK installe;
- une signature Android release pour les builds de production.

## Generer un APK debug

Depuis `frontend/android` :

```bash
.\gradlew.bat assembleDebug
```

APK attendu :

```text
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

## Generer un APK release

Configurer d'abord une signature Android dans Gradle ou Android Studio.

Puis depuis `frontend/android` :

```bash
.\gradlew.bat assembleRelease
```

APK attendu :

```text
frontend/android/app/build/outputs/apk/release/app-release.apk
```

## Generer un AAB

Configurer d'abord la signature release.

Puis depuis `frontend/android` :

```bash
.\gradlew.bat bundleRelease
```

AAB attendu :

```text
frontend/android/app/build/outputs/bundle/release/app-release.aab
```

## Verification recommandee sur tablette Android

1. Installer l'APK debug.
2. Verifier le lancement plein ecran.
3. Verifier la navigation tactile enfant.
4. Verifier la lecture audio.
5. Verifier l'assistant vocal apres demande de permission micro.
6. Verifier les histoires IA avec connexion.
7. Telecharger une histoire et verifier l'acces hors connexion.
8. Couper Internet, verifier bibliotheque offline, favoris, historique et messages parentaux telecharges.
9. Retablir Internet et verifier la synchronisation.
10. Laisser l'app inactive et verifier le retour a `/kids`.
