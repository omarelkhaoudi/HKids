# Audit securite - HKids / Le Lit Qui Lit

## Ameliorations realisees

- Ajout de headers HTTP de securite globaux :
  - `X-Content-Type-Options`;
  - `X-Frame-Options`;
  - `Referrer-Policy`;
  - `Permissions-Policy`;
  - `Strict-Transport-Security` lorsque la requete arrive en HTTPS.
- Desactivation de l'en-tete `X-Powered-By`.
- Ajout d'un journal d'audit applicatif central `security_audit_logs`.
- Journalisation sans donnees sensibles :
  - inscription;
  - connexion reussie;
  - connexion refusee;
  - creation de profil enfant;
  - suppression de profil enfant;
  - creation de compte enfant;
  - suppression definitive de donnees privacy.
- Durcissement de l'inscription :
  - role par defaut `parent`;
  - creation admin desactivee par defaut;
  - creation admin possible seulement avec `ADMIN_SIGNUP_ENABLED=true` et, si configure, `ADMIN_SIGNUP_CODE`.
- Validation username renforcee.
- Hash bcrypt augmente pour les nouveaux comptes.
- Ajout d'une route centralisee de suppression definitive :
  - `DELETE /api/privacy/kids/:id`;
  - `DELETE /api/privacy/account`.
- Renforcement des fichiers vocaux :
  - blocage de l'acces direct a `/uploads/voices`;
  - acces via `/api/voices/files/:filename` avec authentification et verification d'autorisation;
  - les chemins internes ne sont plus retournes pour les narrations clonees.
- Consentement vocal :
  - conservation du consentement existant;
  - ajout de la revocation via `POST /api/voices/profiles/:id/revoke-consent`;
  - suppression des narrations clonees lors de la revocation;
  - interdiction de generer des messages avec une voix clonee sans consentement.

## Verification publicite

Recherche effectuee sur le code applicatif : aucun SDK publicitaire connu ni composant publicitaire n'a ete trouve.

Mots-cles controles :

- ads
- adMob
- googleads
- doubleclick
- facebook audience

## Compatibilite

Les changements restent cote backend ou dans des routes existantes.

- Web : compatible.
- PWA : compatible, pas de changement du Service Worker.
- Android Capacitor : compatible, les appels API restent identiques.
- OpenAI : non modifie.
- ElevenLabs : compatible avec la logique de consentement.
- Offline : les routes privacy retournent des instructions de nettoyage local que le frontend pourra utiliser.
- Dashboards Parent/Admin/Enfant : routes existantes conservees.

## Risques residuels

- Les builds Android release necessitent toujours un environnement JDK/Android SDK local.
- La suppression physique des anciens fichiers audio deja presents sur disque depend du stockage de production; les chemins DB sont neutralises et l'acces direct est bloque.
- Pour une production stricte, remplacer le rate limiter en memoire par Redis ou un service equivalent.

