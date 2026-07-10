# Dashboard Parent Supabase

## Objectif

Le Dashboard Parent n'utilise plus de statistiques de démonstration. Les métriques, listes et graphiques proviennent de PostgreSQL hébergé par Supabase via `DATABASE_URL`.

Le navigateur ne contacte jamais Supabase directement. Express conserve l'authentification JWT, la vérification parent-enfant, la validation et la protection des données enfant.

## Architecture

```mermaid
flowchart LR
  kidApp[Application enfant] -->|heartbeat, favoris, historique| parentalRoutes[Routes parentales]
  bookReader[Lecteur et quiz] -->|progression et tentatives| existingRoutes[Routes lecture et learning]
  parentApp[Dashboard parent] -->|snapshot paginé| parentalRoutes
  parentalRoutes --> dashboardService[parentDashboardService]
  existingRoutes -->|invalidation ciblée| dashboardService
  dashboardService --> redisCache[Redis TTL 60 s]
  dashboardService --> memoryCache[Cache mémoire TTL 60 s]
  dashboardService --> supabaseDb[(Supabase PostgreSQL)]
  offlineQueue[File IndexedDB] -->|reconnexion| parentalRoutes
```

### Responsabilités

- `backend/routes/parental.js` : authentification, rôles, validation des paramètres, appel du service, réponse JSON.
- `backend/services/parentDashboardService.js` : ownership, SQL, agrégations, pagination, métier, cache et invalidation.
- `frontend/src/components/kids/KidScreenTimeTracker.jsx` : temps actif visible, pause background et heartbeat cumulatif.
- `frontend/src/services/parental/kidActivitySyncService.js` : synchronisation en ligne, file offline et import local idempotent.
- `frontend/src/components/parent/ParentDashboardAnalytics.jsx` : graphiques SVG/CSS accessibles et listes réelles.

## Cache

Le service applique une stratégie à deux niveaux :

1. **Redis** si `REDIS_URL` est défini et que le client `redis` peut se connecter ;
2. **Mémoire** en fallback (`Map` locale) si Redis est absent ou indisponible.

Paramètres communs :

- TTL : 60 secondes ;
- capacité mémoire : 500 variantes de snapshots ;
- clé : enfant, parent/rôle, période, limites et offsets ;
- invalidation : lecture, quiz, heartbeat écran, favori, historique, import, objectif et règle parentale.

Exemple de configuration :

```env
REDIS_URL=redis://default:password@redis.example.com:6379
```

Sans `REDIS_URL`, le champ `cache.backend` de la réponse vaut `memory`. Avec Redis actif, il vaut `redis`.

## Nouveaux endpoints

### Snapshot parent

`GET /api/parental/kids/:id/dashboard`

Rôles : `parent`, `admin`.

Paramètres :

- `days` : `7` à `30`, défaut `7` ;
- `favorites_limit` : `1` à `20`, défaut `20` ;
- `favorites_offset` : défaut `0` ;
- `history_limit` : `1` à `50`, défaut `50` ;
- `history_offset` : défaut `0` ;
- `timeline_limit` : `1` à `50`, défaut `50` ;
- `timeline_offset` : défaut `0`.

Les alias génériques `limit` et `offset` sont acceptés. Les limites spécifiques restent prioritaires.

Réponse :

```json
{
  "kid": {},
  "period": { "days": 7 },
  "summary": {
    "reading_seconds": 0,
    "screen_seconds_today": 0,
    "screen_remaining_seconds_today": 0,
    "books_started": 0,
    "books_completed": 0,
    "average_progress_percent": 0,
    "quiz_attempts": 0,
    "quiz_successes": 0,
    "average_quiz_score": 0,
    "reading_streak_days": 0
  },
  "daily_activity": [],
  "progress": { "items": [], "limit": 12 },
  "favorites": { "items": [], "total": 0, "limit": 20, "offset": 0 },
  "history": { "items": [], "total": 0, "limit": 50, "offset": 0 },
  "timeline": { "items": [], "total": 0, "limit": 50, "offset": 0 },
  "subscription": null,
  "cache": { "hit": false, "backend": "memory", "ttl_seconds": 60 }
}
```

### Temps écran enfant

`POST /api/parental/me/screen-time`

```json
{
  "client_session_id": "uuid",
  "duration_seconds": 120,
  "started_at": "2026-07-10T08:00:00.000Z"
}
```

La durée est cumulative par session. L'UPSERT utilise `GREATEST`, ce qui rend les retries et la synchronisation offline idempotents.

### Favori enfant

`POST /api/parental/me/favorites`

```json
{ "book_id": 12, "favorite": true, "favorited_at": "ISO-8601" }
```

### Historique enfant

`POST /api/parental/me/history`

```json
{
  "book_id": 12,
  "last_page": 4,
  "listened_seconds": 90,
  "audio_duration_seconds": 300,
  "completed": false,
  "occurred_at": "ISO-8601"
}
```

### Import local idempotent

`POST /api/parental/me/activity-import`

```json
{
  "import_key": "legacy-local-storage-v1",
  "favorites": [],
  "history": [],
  "listening_history": []
}
```

Une contrainte unique `(kid_profile_id, import_key)` interdit le double import.

### Endpoints existants délégués au service

Ces routes historiques restent inchangées côté URL et format JSON. Leur SQL et logique métier vivent désormais dans `parentDashboardService.js` :

| Route | Méthode service |
| --- | --- |
| `GET /api/parental/kids/:id/activity` | `getKidActivitySnapshot` |
| `GET /api/parental/me/overview` | `getConnectedKidOverview` |
| `POST /api/parental/reading-progress` | `recordKidReadingProgress` |
| `PUT /api/parental/kids/:id/reading-goal` | `upsertKidReadingGoal` |
| `DELETE /api/parental/kids/:id/reading-goal` | `disableKidReadingGoal` |

## Schéma SQL

### `kid_screen_time_sessions`

- une ligne par session frontend ;
- `client_session_id` unique par enfant ;
- durée cumulative ;
- timestamps de début et heartbeat.

### `kid_book_favorites`

- relation enfant-livre unique ;
- suppression physique lors du retrait ;
- tri par `favorited_at`.

### `kid_book_history`

- une ligne agrégée par enfant-livre ;
- dernière page, temps écouté, complétion et dates ;
- UPSERT avec maxima pour résister aux retries offline.

### `kid_data_imports`

- registre des imports historiques ;
- unicité enfant + clé de migration.

### Index

Les requêtes dashboard utilisent des index composites :

- `kids_profiles(parent_id, created_at DESC)` ;
- `kid_screen_time_sessions(kid_profile_id, started_at DESC)` ;
- `kid_book_favorites(kid_profile_id, favorited_at DESC)` ;
- `kid_book_history(kid_profile_id, last_opened_at DESC)` ;
- `kid_reading_sessions(kid_profile_id, book_id, created_at DESC)` ;
- `learning_attempts(kid_profile_id, success, created_at DESC)`.

## Flux et invalidation

```mermaid
sequenceDiagram
  participant Child as Compte enfant
  participant Queue as IndexedDB
  participant API as Express
  participant Service as ParentDashboardService
  participant DB as SupabasePostgres
  participant Cache as CacheTTL
  participant Parent as Dashboard parent

  Child->>API: activité
  alt hors ligne
    Child->>Queue: mutation idempotente
    Queue->>API: synchronisation à la reconnexion
  end
  API->>Service: entrée validée
  Service->>DB: UPSERT ou INSERT
  Service->>Cache: invalider enfant
  Parent->>API: GET dashboard
  API->>Service: paramètres bornés
  alt cache valide
    Service-->>Parent: snapshot cache
  else cache absent
    Service->>DB: agrégations indexées
    Service->>Cache: TTL 60 secondes
    Service-->>Parent: snapshot réel
  end
```

## Compatibilité

- Les endpoints historiques `/activity`, `/me/overview`, `/reading-progress`, règles, objectifs et learning ne changent pas de contrat.
- Les écrans enfant conservent le localStorage comme cache offline.
- Les anciennes données sont copiées vers Supabase sans suppression locale.
- La politique de temps écran utilise les nouvelles sessions lorsqu'elles existent et les sessions de lecture comme fallback pour les comptes historiques.
- Aucune librairie graphique n'est ajoutée : SVG, CSS, Tailwind et Framer Motion déjà présents sont réutilisés.
