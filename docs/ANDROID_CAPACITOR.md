# Le Lit Qui Lit - Android embarque

Ce document decrit l'integration Android Capacitor de HKids / Le Lit Qui Lit.

Voir aussi : [ANDROID_RELEASE_REPORT.md](./ANDROID_RELEASE_REPORT.md) pour le rapport final de preparation release.

## Architecture

- Le frontend React/Vite reste la source principale.
- Capacitor embarque le build `frontend/dist` dans `frontend/android`.
- La PWA reste active pour le web via `manifest.webmanifest` et `sw.js`.
- Le Service Worker est **desactive sur natif** (assets deja embarques dans l'APK).
- Le runtime mobile est isole dans `frontend/src/services/mobile/`.

## Prerequis

- **JDK 17 ou 21 LTS** (JDK 25 n'est pas supporte par Gradle Android actuellement)
- Android Studio ou Android SDK
- Variable `JAVA_HOME` pointant vers le JDK compatible

## Variables de build

Copier `frontend/.env.example` vers `frontend/.env.local` :

```bash
VITE_API_URL=https://votre-backend.example.com
VITE_ANDROID_KIOSK_IDLE_MS=600000
```

`VITE_API_URL` est **obligatoire** pour les builds Android production.

## Commandes

Depuis `frontend/` :

```bash
npm install
npm run android:sync       # build web + cap sync
npm run android:open       # ouvrir Android Studio
npm run android:run        # build + run sur appareil
npm run android:debug      # APK debug
npm run android:release    # APK release (signe si keystore.properties)
npm run android:bundle     # AAB Play Store
```

## Signature release

1. Generer un keystore :

```bash
keytool -genkey -v -keystore hkids-release.keystore -alias hkids -keyalg RSA -keysize 2048 -validity 10000
```

2. Copier `frontend/android/keystore.properties.example` vers `frontend/android/keystore.properties`
3. Renseigner `storeFile`, `storePassword`, `keyAlias`, `keyPassword`
4. Ne jamais committer le keystore ni `keystore.properties`

## Runtime Android

Au demarrage natif :

- classes CSS `capacitor-android` et `touch-kiosk`
- barre de statut masquee (Capacitor StatusBar)
- splash screen natif puis masque
- retour haptique sur boutons
- gestion bouton retour Android
- ecran toujours allume (`FLAG_KEEP_SCREEN_ON`)
- mode immersif sticky (API 30+ via WindowInsetsController)
- detection reseau native (`@capacitor/network`)
- deblocage audio WebView au premier touch
- retour auto vers `/kids` apres inactivite

Delai kiosk : `VITE_ANDROID_KIOSK_IDLE_MS` (0 = desactive).

## Permissions Android

Declarees :

- `INTERNET`, `ACCESS_NETWORK_STATE`
- `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`
- `VIBRATE`, `WAKE_LOCK`

Micro declare comme `required=false`.

## Mode kiosk

Kiosk logiciel prepare :

- plein ecran immersif
- portrait verrouille
- retour auto espace enfant
- minimize sur retour depuis `/kids`

Kiosk dur (Lock Task, boot auto) : necessite MDM / Android Enterprise.

## Offline

Sur natif :

- IndexedDB pour contenus telecharges
- queue de synchronisation offline
- cloud sync kid-scoped
- banniere offline via `@capacitor/network`

## Performance

- Code splitting Vite (react, motion, capacitor, heavy, vendor)
- Lazy loading des ecrans lourds (Admin, Parent, BookReader, IA...)
- Bundle principal reduit (~374 kB vs ~1.4 MB avant)

## Icônes et splash

- Adaptive icon : `android/app/src/main/res/mipmap-anydpi-v26/`
- Foreground vectoriel : `drawable/hkids_launcher_foreground.xml`
- Splash : `drawable/splash.xml` + plugin Capacitor
- PWA : `public/HKidsimg.webp`

## Verification tablette

1. `npm run android:debug` avec JDK 21
2. Installer APK sur tablette
3. Verifier plein ecran, navigation, audio, micro, offline, sync, idle kiosk
4. Configurer keystore puis `npm run android:bundle` pour Play Store

## Sorties build

| Type | Chemin |
|------|--------|
| APK debug | `android/app/build/outputs/apk/debug/app-debug.apk` |
| APK release | `android/app/build/outputs/apk/release/app-release.apk` |
| AAB release | `android/app/build/outputs/bundle/release/app-release.aab` |
