# Mode kiosk Android — Le Lit Qui Lit

## Deux niveaux de kiosk

### Niveau 1 — Kiosk logiciel (déjà livré)

Comportement actuel de l'APK Capacitor, adapté à un usage supervisé à la maison ou en démo :

| Fonctionnalité | Implémentation |
|----------------|----------------|
| Plein écran immersif | `MainActivity.java` — `FLAG_KEEP_SCREEN_ON`, barres système masquées |
| Orientation portrait | `AndroidManifest.xml` |
| Retour système | Depuis `/kids`, minimise l'app ; sinon navigation interne |
| Reset inactivité | `AndroidKioskIdleReset` dans `App.jsx` → retour `/kids` après 10 min (configurable) |
| Cibles tactiles | Classe CSS `.touch-kiosk` (min 44px) |
| Audio | Déverrouillage audio au premier geste (`androidAudio.js`) |

Variables d'environnement :

```env
VITE_ANDROID_KIOSK_IDLE_MS=600000   # 0 = désactivé
VITE_API_URL=https://votre-api.example.com
```

### Niveau 2 — Lock Task / Device Owner (tablette dédiée)

Pour une tablette **verrouillée sur l'app** (impossible de quitter via Home/Récents sans MDM) :

1. **Provisioning Device Owner** via MDM (Android Enterprise, Scalefusion, Hexnode…) ou `adb` en usine :
   ```bash
   adb shell dpm set-device-owner com.lelitquilit.app/.DeviceAdminReceiver
   ```
   *(nécessite un receiver Device Admin — non inclus par défaut ; à ajouter si déploiement sans MDM externe)*

2. **Whitelist Lock Task** pour `com.lelitquilit.app` dans la politique MDM.

3. **Politiques recommandées** :
   - Lancement automatique au boot
   - Désactivation barre de statut / paramètres système
   - Mise à jour APK contrôlée par MDM

4. **Option native future** : `startLockTask()` dans `MainActivity.java` + `android:lockTaskMode="if_whitelisted"` dans le manifest, derrière un flag build.

## Matrice de tests (avant démo partenaire)

- [ ] APK build release (`docs/ANDROID_CAPACITOR.md`)
- [ ] Plein écran persistant après perte de focus
- [ ] Bouton retour depuis lecteur → accueil enfant
- [ ] Bouton retour depuis `/kids` → minimise
- [ ] Idle reset → `/kids` après délai configuré
- [ ] Lecture offline d'un livre téléchargé
- [ ] Audio : premier tap débloque la lecture
- [ ] Connexion API production (`VITE_API_URL`)

## Limites connues

- Sans Device Owner, l'enfant peut encore quitter via gestes système ou Paramètres.
- Le kiosk logiciel ne remplace pas une politique MDM pour un déploiement institutionnel.
- JDK 17 ou 21 requis pour le build Gradle.

## Références

- Intégration Capacitor : `docs/ANDROID_CAPACITOR.md`
- Rapport release : `docs/ANDROID_RELEASE_REPORT.md`
- Runtime JS : `frontend/src/services/mobile/capacitorRuntime.js`
