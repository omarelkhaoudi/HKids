# Synchronisation Cloud HKids

## Objectif

Synchroniser bidirectionnellement les données enfant entre l'appareil et PostgreSQL (Supabase), en mode **offline-first** : écriture locale immédiate, push à la reconnexion, pull avec fusion automatique des conflits.

## Domaines synchronisés

| Domaine | Local | Cloud | Push | Pull |
| --- | --- | --- | --- | --- |
| Profil enfant | IndexedDB cache | `kids_profiles` | — | ✅ |
| Favoris | localStorage | `kid_book_favorites` | ✅ | ✅ |
| Progression | localStorage + queue | `kid_reading_progress` | ✅ | ✅ |
| Historique | localStorage | `kid_book_history` | ✅ | ✅ |
| Téléchargements | IndexedDB blobs + registre | `kid_download_registry` | ✅ | ✅ (métadonnées) |

Les fichiers binaires (PDF, audio, couvertures) restent sur l'appareil. Le cloud conserve uniquement le **registre** des contenus téléchargés pour la continuité multi-appareils.

## Architecture

```mermaid
flowchart LR
  ui[UI enfant] -->|ecriture immediate| local[localStorage + IndexedDB]
  local -->|queue offline| syncQueue[syncQueue]
  bridge[OfflineSyncBridge] -->|1 flush queue| syncQueue
  bridge -->|2 cloud sync| cloudService[cloudSyncService]
  cloudService -->|GET/POST| api[/parental/me/cloud-sync]
  api --> backend[cloudSyncService backend]
  backend --> db[(PostgreSQL)]
  backend -->|snapshot fusionne| cloudService
  cloudService -->|hydrate| local
```

## Endpoints

### `GET /api/parental/me/cloud-sync?sync_token=...`

Retourne le snapshot cloud ou `{ unchanged: true, sync_token }` si le token correspond (optimisation).

### `POST /api/parental/me/cloud-sync`

```json
{
  "sync_token": "md5...",
  "changes": {
    "favorites": { "add": [1, 2], "remove": [3] },
    "progress": [{ "book_id": 1, "current_page": 4, "total_pages": 12, "completed": false }],
    "history": {
      "reading": [{ "book_id": 1, "last_page": 4, "occurred_at": "ISO" }],
      "listening": [{ "book_id": 2, "listened_seconds": 90 }]
    },
    "downloads": [{ "content_type": "book", "content_id": 5, "status": "downloaded" }]
  }
}
```

Réponse : snapshot fusionné + `conflicts_resolved` + nouveau `sync_token`.

## Résolution des conflits

### Client (hydratation)

- **Favoris** : union local ∪ cloud (max 20)
- **Historique** : par `bookId`, conserve l'entrée avec la date la plus récente
- **Progression** : `GREATEST` sur les pages ; complétion = OR
- **Téléchargements** : union des registres ; blobs locaux inchangés

### Serveur (UPSERT)

- Réutilise `setKidBookFavorite`, `recordKidBookHistory`, `recordKidReadingProgress`
- Registre téléchargements : `GREATEST(downloaded_at)` sur conflit
- Invalidation cache dashboard parent après push

### File offline (queue)

- Dernière écriture gagne pour : favoris, historique, écran
- Progression : ordre FIFO (pas de déduplication)

## Performance

- **Sync token MD5** : évite un pull complet si rien n'a changé côté serveur
- **Limites** : favoris 20, historique 50, progression 50, téléchargements 60
- **Sync séquentiel** : flush queue → puis cloud sync (évite les courses)
- **Pas de push cloud** tant que la queue offline contient des mutations en attente

## Flux offline-first

1. L'enfant lit / favorise / télécharge → écriture locale immédiate
2. Hors ligne → mutation en `syncQueue`
3. Reconnexion → `OfflineSyncBridge` :
   - politique parentale
   - migration legacy (une fois)
   - flush queue
   - `performCloudSync()` pull/push + hydratation
4. UI lit toujours le localStorage (désormais aligné avec le cloud)

## Schéma SQL

### `kid_download_registry`

| Colonne | Description |
| --- | --- |
| `kid_profile_id` | Enfant |
| `content_type` | `book`, `generated-story`, `voice-message` |
| `content_id` | ID source |
| `status` | `downloaded` ou `removed` |
| `downloaded_at` | Date |
| `updated_at` | Horodatage sync |

Contrainte unique : `(kid_profile_id, content_type, content_id)`.

## Fichiers clés

| Fichier | Rôle |
| --- | --- |
| `backend/services/cloud/cloudSyncService.js` | Snapshot, push, merge serveur |
| `frontend/src/services/cloud/cloudSyncService.js` | Hydratation, collecte locale, sync token |
| `frontend/src/components/offline/OfflineSyncBridge.jsx` | Orchestration reconnexion |
| `frontend/src/utils/storage.js` | Source locale offline-first |
| `frontend/src/services/offline/offlineSyncService.js` | Queue mutations |

## Compatibilité

- Endpoints historiques conservés (`/me/favorites`, `/me/history`, `/reading-progress`, etc.)
- Import legacy `activity-import` toujours actif avant la première sync cloud
- Formats localStorage existants inchangés (clés scopées `:kid:{id}`)
