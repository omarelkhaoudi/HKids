# Generated Stories Management

## Objectif

Cette phase complete la gestion des histoires generees par IA apres la generation: bibliotheque personnelle, historique, favoris, recherche, filtres, relecture, suppression et regeneration.

## Backend

### Modele

- `backend/models/GeneratedStory.js`
  - `mapGeneratedStory(row)`: format unique de reponse API.
  - `normalizeStoryListFilters(query)`: normalise recherche et filtres.
  - `buildGeneratedStoryWhereClause(...)`: construit les filtres SQL de liste.

### Base de donnees

Table `generated_stories`, champs ajoutes:

- `favorite`
- `favorited_at`
- `source_story_id`
- `version_number`

Index ajoutes:

- `generated_stories_kid_favorite_idx`
- `generated_stories_source_idx`

### Endpoints

- `GET /api/generated-stories`
  - Supporte `search`, `theme`, `language`, `age_level`, `educational_value`, `saved`, `favorite`, `limit`.
- `GET /api/generated-stories/:id`
  - Relire/recuperer une histoire existante sans appel IA.
- `POST /api/generated-stories/:id/save`
  - Marque une histoire comme sauvegardee.
- `POST /api/generated-stories/:id/favorite`
  - Ajoute ou retire une histoire des favoris.
- `POST /api/generated-stories/:id/version`
  - Cree une nouvelle version a partir d'une histoire existante.
- `DELETE /api/generated-stories/:id`
  - Supprime une histoire autorisee.

## Frontend

### Nouvelle page

- `frontend/src/pages/KidsAIStories.jsx`
  - Bibliotheque "Mes histoires IA".
  - Recherche.
  - Filtres par enfant, theme, statut sauvegarde et favori.
  - Selection et lecture d'une histoire existante.
  - Favori.
  - Sauvegarde.
  - Suppression.
  - Nouvelle version.

### Navigation

- Route ajoutee: `/kids/ai-stories`.
- Acces ajoute depuis l'accueil enfant.
- Acces ajoute depuis le studio d'histoires.

## Architecture future

La table conserve les champs deja prevus pour:

- illustrations IA: `illustration_plan`
- narration clonee: `narration_metadata`
- histoires interactives: `interactive_choices`
- histoires multi-chapitres: `chapters`

## Points de vigilance

- La suppression est physique pour cette V1.
- Une future phase peut ajouter une suppression douce avec `deleted_at`.
- Les favoris IA sont stockes en base, separes des favoris de livres stockes localement.
