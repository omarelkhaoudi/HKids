# Panneau Admin HKids

## Architecture

```mermaid
flowchart LR
  UI[AdminDashboard React] --> API[/api/admin]
  API --> Auth[JWT + adminOnly]
  Auth --> Permissions[Permissions granulaires]
  Permissions --> Service[adminService]
  Service --> DB[(PostgreSQL)]
  Service --> Stripe[Stripe API]
  Service --> Audit[security_audit_logs]
```

Le panneau conserve les routes historiques et ajoute des endpoints spécialisés. Les comptes `admin` existants gardent un accès complet grâce au mode de compatibilité `admin_permissions = NULL`.

## Modules

| Module | Fonctionnalités |
| --- | --- |
| Vue d'ensemble | Statistiques et activité existantes |
| Histoires CMS | Création/édition conservées, nouveaux livres placés en validation |
| Modération | Livres et histoires IA, approbation/rejet, notes |
| Signalements | Priorité, affectation, résolution, classement |
| Utilisateurs | Recherche, détails, suppression sécurisée |
| Abonnements | Tous les statuts, annulation/réactivation Stripe ou locale |
| Recherche | Recherche unifiée utilisateurs/livres/abonnements/signalements |
| Journal | Actions sensibles, acteur, IP, ressource, métadonnées expurgées |
| Permissions | Capacités granulaires par compte admin |

## Permissions

| Permission | Portée |
| --- | --- |
| `overview.read` | Vue d'ensemble et statistiques |
| `users.read` | Lecture des comptes |
| `users.delete` | Suppression des comptes non-admin |
| `content.read` | CMS et file de modération |
| `content.moderate` | Édition, rejet et modération |
| `books.validate` | Validation et publication des livres |
| `subscriptions.read` | Lecture des abonnements |
| `subscriptions.manage` | Annulation/réactivation/statut |
| `reports.read` | Lecture des signalements |
| `reports.manage` | Traitement des signalements |
| `audit.read` | Journal des actions |
| `permissions.manage` | Gestion des droits admin |
| `search.use` | Recherche globale |

`NULL` signifie accès complet pour garantir la compatibilité des admins existants. Un tableau vide signifie aucun droit fonctionnel hors lecture de ses propres permissions.

## Endpoints ajoutés

Tous les endpoints Admin exigent JWT, rôle `admin` et permission associée.

| Méthode | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/moderation` | File paginée et filtrable |
| `PATCH` | `/api/admin/moderation/:type/:id` | Approuver/rejeter |
| `GET` | `/api/admin/reports` | Signalements |
| `PATCH` | `/api/admin/reports/:id` | Priorité/statut/résolution |
| `GET` | `/api/admin/audit-logs` | Journal paginé |
| `GET` | `/api/admin/search?q=...` | Recherche avancée |
| `DELETE` | `/api/admin/users/:id` | Suppression sécurisée |
| `GET` | `/api/admin/managed-subscriptions` | Tous les abonnements |
| `PATCH` | `/api/admin/managed-subscriptions/:id` | Action abonnement |
| `GET` | `/api/admin/permissions/me` | Droits courants |
| `GET` | `/api/admin/permissions` | Comptes et catalogue |
| `PUT` | `/api/admin/permissions/:id` | Modifier les droits |
| `POST` | `/api/reports` | Créer un signalement authentifié |

Les endpoints historiques `/overview`, `/users`, `/users/:id`, `/statistics` et `/subscriptions` conservent leurs formats de réponse.

## Modération et validation

### Livres

Les nouveaux livres sont enregistrés avec :

- `moderation_status = pending` ;
- `is_published = false`.

Seule une validation avec `books.validate` peut approuver et publier. Un rejet dépublie automatiquement le livre.

### Histoires générées

Une histoire rejetée reçoit `is_hidden = true` et disparaît des listes enfant. Une approbation la rend à nouveau visible.

## Signalements

La table `content_reports` prend en charge :

- cibles `book`, `generated_story`, `user` ;
- statuts `open`, `reviewing`, `resolved`, `dismissed` ;
- priorités `low`, `normal`, `high`, `urgent` ;
- affectation à un admin et note de résolution ;
- détection des doublons ouverts pour un même auteur et une même cible.

## Suppression utilisateur

La suppression :

1. interdit l'auto-suppression et la suppression d'un autre admin ;
2. annule d'abord les abonnements Stripe actifs ;
3. supprime ensuite le compte et ses données liées par transaction/cascades ;
4. journalise l'acteur, la cible et le motif.

Si Stripe n'est pas configuré alors que l'utilisateur possède un abonnement Stripe actif, l'opération est refusée pour éviter une facturation orpheline.

## Journal des actions

Les opérations sensibles écrivent dans `security_audit_logs`. Les secrets, tokens, mots de passe et données vocales sont expurgés par `logSecurityEvent`.

Le middleware `adminOnly` journalise aussi toute mutation Admin réussie (`POST`, `PUT`, `PATCH`, `DELETE`), y compris les routes historiques livres, catégories et apprentissage.

## Recherche avancée

`GET /api/admin/search` effectue des requêtes PostgreSQL bornées en parallèle sur :

- utilisateurs ;
- livres ;
- abonnements ;
- signalements.

La palette `Ctrl/Cmd + K` applique un debounce de 250 ms et navigue vers le module correspondant.

## Schéma ajouté

- `users.admin_permissions JSONB`
- Colonnes de modération sur `books` et `generated_stories`
- `generated_stories.is_hidden`
- `content_reports`
- Index de statut/date pour files de modération et signalements

## Vérifications

```powershell
cd backend
npm test
npm run build

cd ../frontend
npm run build
```

Les tests couvrent le catalogue, la compatibilité `NULL`, la déduplication et le rejet des permissions inconnues.
