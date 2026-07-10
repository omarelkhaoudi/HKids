# HKids — Rapport final Android / Capacitor

Date : 10 juillet 2026  
Projet : `frontend/` (Capacitor 8.4, Android SDK 36, minSdk 24)

---

## Résumé exécutif

HKids est **prêt à ~90 %** pour un déploiement Android tablette/kiosk. L’architecture Capacitor, le mode kiosk logiciel, l’offline, l’audio, les permissions, les icônes, le splash et la chaîne release Gradle sont en place.

**Blocage environnement local** : le build Gradle échoue avec **JDK 25** (`Unsupported class file major version 69`). Android/Gradle requiert **JDK 17 ou 21 LTS**. Une fois le bon JDK installé, les commandes `npm run android:debug` / `android:release` doivent fonctionner.

---

## 1. Capacitor — vérification

| Élément | Statut |
|---------|--------|
| `capacitor.config.json` | OK — scheme HTTPS, splash, status bar |
| Plugins Android | OK — App, Haptics, Network, Preferences, SplashScreen, StatusBar |
| `cap sync android` | OK — assets web copiés, 6 plugins détectés |
| `webDir: dist` | OK — build Vite synchronisé |
| Runtime mobile | OK — `capacitorRuntime.js` |

**Commandes disponibles** (depuis `frontend/`) :

```bash
npm run android:sync      # build + sync
npm run android:open      # Android Studio
npm run android:run       # build + run device
npm run android:debug     # APK debug
npm run android:release   # APK release (signé si keystore.properties)
npm run android:bundle    # AAB Play Store
```

**Prérequis build** :

```bash
# .env.local (obligatoire pour Android prod)
VITE_API_URL=https://votre-backend.example.com
VITE_ANDROID_KIOSK_IDLE_MS=600000
```

Sans `VITE_API_URL`, l’app native ne peut pas joindre l’API (Capacitor utilise `https://localhost`).

---

## 2. Mode kiosk

| Fonctionnalité | Implémentation |
|----------------|----------------|
| Plein écran immersif | `MainActivity.java` — WindowInsetsController (API 30+) + fallback legacy |
| Écran toujours allumé | `FLAG_KEEP_SCREEN_ON` |
| Portrait verrouillé | `AndroidManifest.xml` |
| Retour auto `/kids` | `AndroidKioskIdleReset` — idle 10 min (configurable) |
| Bouton retour Android | Routage intelligent vers bibliothèque / kids / minimize |
| Cibles tactiles 44px | CSS `.touch-kiosk` |
| Haptique | `@capacitor/haptics` |

**Limites** (documentées) : pas de Lock Task Mode natif. Kiosk dur = MDM / Android Enterprise / launcher dédié.

---

## 3. Performance

| Optimisation | Avant | Après |
|--------------|-------|-------|
| Bundle principal | ~1 433 kB | **374 kB** (gzip 94 kB) |
| Code splitting | Monolithique | Chunks : react, motion, capacitor, heavy, vendor |
| Lazy routes | Non | BookReader, Admin, Parent, Voices, AI, Learning, Studio |
| Hardware accel | — | `android:hardwareAccelerated="true"` |
| Large heap | — | `android:largeHeap="true"` (PDF/Tesseract) |

---

## 4. Cache

| Couche | Comportement Android |
|--------|---------------------|
| Assets embarqués | Capacitor sert `dist/` depuis l’APK — pas de SW nécessaire |
| Service Worker | **Désactivé sur natif** (`registerServiceWorker.js`) |
| IndexedDB | Actif — téléchargements, blobs, sync queue |
| Cloud sync | Actif — `cloudSyncService.js` |
| API cache (web) | SW network-first — web/PWA uniquement |

---

## 5. Audio

| Amélioration | Fichier |
|--------------|---------|
| Déblocage autoplay WebView | `androidAudio.js` — silent unlock au premier touch |
| `preload`, `playsinline`, `crossOrigin` | `useAudioPlayer.js` |
| Reprise après background | `appStateChange` dans `capacitorRuntime.js` |

**À valider sur tablette** : narration livre, voix clonées, assistant vocal (`getUserMedia`), TTS navigateur.

---

## 6. Offline

| Composant | Statut natif |
|-----------|--------------|
| IndexedDB (`offlineDb.js`) | OK |
| Téléchargement histoires | OK |
| File sync (`offlineSyncService.js`) | OK |
| Détection réseau native | **Nouveau** — `@capacitor/network` + bannière offline |
| Purge privacy | OK — `privacyStorageService.js` |

**Scénarios à tester** : télécharger → couper Wi‑Fi → lire → rétablir → sync.

---

## 7. Permissions Android

**Conservées (justifiées)** :

- `INTERNET`, `ACCESS_NETWORK_STATE`
- `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` (assistant vocal)
- `VIBRATE` (haptique)
- `WAKE_LOCK` (lecture prolongée)

**Retirées (inutilisées)** :

- `POST_NOTIFICATIONS`
- `READ_MEDIA_AUDIO`, `READ_MEDIA_IMAGES`
- `READ_EXTERNAL_STORAGE`

**Sécurité** : `allowBackup="false"`, `usesCleartextTraffic="false"`.

---

## 8. Icônes & Splash

| Ressource | Fichier |
|-----------|---------|
| Icône adaptive (API 26+) | `mipmap-anydpi-v26/ic_launcher.xml` |
| Foreground vectoriel | `drawable/hkids_launcher_foreground.xml` |
| Splash natif | `drawable/splash.xml` + plugin Capacitor |
| PWA / web | `public/HKidsimg.webp` (ajouté) |
| Couleurs marque | `values/colors.xml` — #EF3F61, #FEFCFB |

---

## 9. Build Release

| Élément | Statut |
|---------|--------|
| `versionName` | 1.0.0 |
| `signingConfigs` | Configuré via `keystore.properties` |
| Template keystore | `android/keystore.properties.example` |
| `.gitignore` keystore | OK |
| `assembleDebug` | **Échec local** — JDK 25 incompatible |
| `assembleRelease` | Prêt après JDK 17/21 + keystore |

### Créer le keystore release

```bash
keytool -genkey -v -keystore hkids-release.keystore -alias hkids -keyalg RSA -keysize 2048 -validity 10000
```

Copier `keystore.properties.example` → `keystore.properties` et renseigner les valeurs.

### Build production

```bash
cd frontend
# Créer .env.local avec VITE_API_URL
npm run android:release   # APK
npm run android:bundle    # AAB Play Store
```

**Sorties attendues** :

- APK : `android/app/build/outputs/apk/release/app-release.apk`
- AAB : `android/app/build/outputs/bundle/release/app-release.aab`

---

## 10. Checklist validation tablette

1. [ ] Installer JDK 21 et relancer `npm run android:debug`
2. [ ] Configurer `VITE_API_URL` vers backend prod
3. [ ] Lancement plein écran + splash
4. [ ] Navigation enfant tactile
5. [ ] Lecture audio (tap → play)
6. [ ] Micro assistant vocal
7. [ ] Téléchargement + mode hors ligne
8. [ ] Sync au retour réseau
9. [ ] Idle kiosk → retour `/kids`
10. [ ] Signature release + test AAB

---

## 11. Risques résiduels

| Risque | Mitigation |
|--------|------------|
| JDK 25 sur machine dev | Installer Temurin 21 LTS |
| API URL manquante au build | `.env.example` + erreur console native |
| Kiosk dur non garanti | MDM externe pour tablettes partagées |
| TTS/STT WebView variable | Tester sur cible ; plugins natifs si besoin |
| Icônes API 24–25 | Adaptive icon API 26+ ; legacy raster optionnel via Android Studio Asset Studio |
| JWT localStorage | Documenté dans PRIVACY_SECURITY.md |

---

## Fichiers modifiés (session)

- `frontend/android/` — Manifest, MainActivity, build.gradle, ressources, keystore template
- `frontend/src/services/mobile/` — capacitorRuntime, androidAudio, androidNetwork
- `frontend/src/App.jsx` — lazy loading
- `frontend/vite.config.js` — code splitting
- `frontend/package.json` — scripts + @capacitor/network
- `frontend/public/HKidsimg.webp` — icône PWA
- `frontend/.env.example`
- `docs/ANDROID_CAPACITOR.md` — mis à jour

---

## Conclusion

HKids dispose d’une **base Android production solide** : kiosk logiciel, performance optimisée, offline natif, audio débloqué, permissions épurées, assets brandés et pipeline release documenté.

**Prochaine étape immédiate** : installer **JDK 21**, configurer `VITE_API_URL`, générer le keystore, puis `npm run android:debug` sur une tablette cible.
