# Sécurité et confidentialité

## Architecture

Le module Privacy suit le flux suivant :

```text
SettingsCenterModal
  -> PrivacyCenter
    -> frontend/src/api/privacy.js
      -> /api/privacy/*
        -> vérification JWT + limite de débit
          -> backend/services/privacy/privacyService.js
            -> PostgreSQL / Stripe / ElevenLabs / stockage vocal
```

Les routes Express ne contiennent que l'autorisation, la validation du transport,
l'appel du service et la réponse HTTP. Les opérations sensibles exigent une
réauthentification par mot de passe. Les réponses d'export utilisent
`Cache-Control: no-store`.

## Endpoints

Tous les endpoints utilisent un Bearer JWT.

| Méthode | Endpoint | Rôle | Confirmation | Résultat |
| --- | --- | --- | --- | --- |
| `POST` | `/api/privacy/export` | parent | mot de passe | export JSON dans `{ data }` |
| `POST` | `/api/privacy/export/download` | parent | mot de passe | pièce jointe JSON RGPD |
| `GET` | `/api/privacy/logs?limit=50&offset=0` | parent | JWT | journal paginé |
| `POST` | `/api/privacy/local-data-cleared` | parent | JWT + confirmation UI | preuve d'effacement local |
| `DELETE` | `/api/privacy/kids/:id` | parent propriétaire ou admin | confirmation UI | suppression définitive du profil |
| `DELETE` | `/api/privacy/account` | parent | mot de passe + saisie `SUPPRIMER` | suppression définitive |

Les anciens contrats `DELETE /kids/:id` et `DELETE /account` restent compatibles.

## Données incluses dans l'export

- compte parent, profils enfants et contrôles parentaux ;
- progression, sessions, objectifs, temps d'écran, favoris et historique ;
- registre de téléchargements et imports offline ;
- histoires générées, métadonnées et contenu ;
- apprentissage, défis et récompenses ;
- abonnements, factures, événements et déblocages ;
- profils, messages, consentements, usages et journaux vocaux ;
- signalements et journaux de sécurité du compte.

Les mots de passe, clés API et identifiants internes du fournisseur vocal ne sont
jamais exportés. Les fichiers binaires vocaux ne sont pas inclus dans le JSON ;
leurs métadonnées et leur présence sont indiquées.

## Suppression définitive

1. Le mot de passe parent est vérifié avec bcrypt.
2. Les abonnements Stripe actifs sont annulés et le client Stripe est supprimé.
3. Les profils vocaux externes et les fichiers locaux sont supprimés.
4. Une transaction PostgreSQL supprime les comptes enfants, profils, activités,
   histoires, données d'apprentissage, rapports et données de facturation.
5. Les anciens journaux de sécurité sont minimisés (IP, user-agent et métadonnées).
6. Une preuve d'effacement anonymisée est conservée.
7. Le frontend efface les données HKids de localStorage, sessionStorage,
   IndexedDB et Cache Storage, puis invalide la session.

Les suppressions enfant s'appuient sur les clés étrangères `ON DELETE CASCADE`
et suppriment explicitement le compte de connexion enfant afin d'éviter tout
compte orphelin.

## Journalisation

Les actions suivantes sont enregistrées dans `security_audit_logs` :

- `privacy_export_viewed`
- `privacy_export_downloaded`
- `privacy_local_data_cleared`
- `kid_profile_deleted_permanently`
- `parent_account_deleted_permanently`

Le frontend expose les journaux du seul utilisateur connecté. La pagination est
limitée à 100 entrées par requête.

## Stockage local

`privacyStorageService` supprime :

- toutes les clés préfixées `hkids_`, `hkids:` ou `le-lit-qui-lit` ;
- la base IndexedDB `le-lit-qui-lit-offline` et ses blobs/files de synchronisation ;
- les caches applicatifs HKids ;
- le token et l'utilisateur local après suppression du compte.

L'action « effacer cet appareil » conserve la session afin de ne pas transformer
un nettoyage offline en déconnexion involontaire.

## Mesures de sécurité vérifiées

- requêtes SQL paramétrées ;
- contrôle d'appartenance des profils enfants ;
- réauthentification des exports et suppressions ;
- limite de débit dédiée aux endpoints sensibles ;
- CORS de production sur liste blanche et support explicite de `PATCH` ;
- en-têtes anti-clickjacking, HSTS, nosniff et politique de permissions ;
- secret JWT faible refusé en production ;
- aucun compte Admin par défaut créé en production ;
- données sensibles expurgées des journaux techniques ;
- dépendances de production vérifiées avec `npm audit`.

## Risques résiduels et recommandations

1. Le JWT reste dans `localStorage`. Une migration vers un cookie `HttpOnly`,
   `Secure`, `SameSite=Strict` réduirait l'impact d'une XSS, mais modifierait le
   contrat d'authentification mobile/web.
2. Le limiteur mémoire n'est pas partagé entre plusieurs instances. Configurer
   un limiteur Redis distribué avant une montée en charge.
3. Ajouter une CSP avec nonce après inventaire des scripts/styles et domaines
   audio ; une CSP restrictive appliquée sans cet inventaire casserait le lecteur.
4. Les prestataires Stripe et ElevenLabs peuvent conserver certaines preuves
   légales ou sauvegardes selon leurs propres politiques. Les accords de
   sous-traitance doivent préciser délais et demandes d'effacement.
5. Les factures peuvent être soumises à une durée légale de conservation. La
   stratégie actuelle privilégie la suppression demandée ; une politique validée
   juridiquement peut imposer anonymisation et archivage légal à la place.
6. L'adresse de newsletter n'est pas reliée au compte utilisateur dans le schéma
   actuel et ne peut donc pas être automatiquement incluse ou supprimée.

## Scénarios testés

- mot de passe correct, absent et incorrect ;
- pagination négative, excessive et invalide ;
- génération sûre du nom du fichier RGPD ;
- suppression d'un compte enfant lié avant cascade du profil ;
- isolation des journaux par utilisateur ;
- export et compilation frontend ;
- cycle de vie Stripe et signature webhook existants ;
- catalogue de permissions Admin ;
- audit des dépendances backend et frontend.

Pour une validation de production, exécuter également un test avec de vrais
comptes Stripe/ElevenLabs de test, une base PostgreSQL de staging et deux onglets
ouverts afin de vérifier le cas IndexedDB `blocked`.
