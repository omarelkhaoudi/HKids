# Catalogue contenu réel — HKids

Guide pour alimenter la bibliothèque avec du **contenu original** prêt pour la production.

## Contenu fourni

| Fichier | Rôle |
|---------|------|
| `backend/content/catalog.js` | Catalogue unifié (base + extensions + final) |
| `backend/content/catalogExtended.js` | Audio, comptines, spiritualité |
| `backend/content/catalogPremiumExpansion.js` | Expansion premium (`prem-*`) |
| `backend/content/catalogPlus100Expansion.js` | +100 livres (`plus-*`) |
| `backend/content/catalogFinalExpansion.js` | Complétion finale (audiobooks, langues, sciences, géo, créativité, religion, personnages) |
| `backend/content/catalogMetadata.js` | Métadonnées production, alias de recherche, corrections AR |
| `backend/content/learningCatalog.js` | Quiz, jeux et activités éducatives finales |
| `backend/content/storyTemplatesCatalog.js` | 10 histoires personnalisables |
| `backend/content/svgAssets.js` | Couvertures et pages SVG |
| `backend/content/audioAssets.js` | Synthèse vocale Edge TTS |
| `backend/scripts/seed-catalog.js` | Seed unifié (livres + learning + templates) |

### Volume cible (après seed)

| Type | Quantité |
|------|----------|
| Catalogue total | ≥ 290 (≈ 301) |
| Expansion `final-*` | ≥ 20 |
| Expansion `plus-*` | **100** |
| Histoires illustrées (`story`) | ≥ 100 |
| Histoires audio (`audio_story`) | ≥ 40 |
| Comptines (`song`) | ≥ 20 |
| Religion / valeurs | ≥ 12 |
| Expansion premium (`prem-*`) | ≥ 100 |
| Quiz + activités learning | ≥ 32 |
| Jeux éducatifs (mémoire) | 20 |
| Histoires personnalisables | 10 / profil enfant |

### Zones pédagogiques couvertes

- Audiobooks
- Language learning
- Educational activities
- Religion / values
- Rhymes
- Science
- Geography
- Creativity
- Premium characters

### Métadonnées production

- **Catégories** : Histoires, Comptines, Dinosaures, Espace, Animaux, Spiritualité, Contes, Livres audio, Langues, Sciences, Géographie, Créativité, Religion et valeurs, Personnages premium
- **Âge** : `age_group_min` / `age_group_max` + tag `level:2-4`, `level:5-7`, `level:8-10`
- **Tags enrichis** : `area:*`, `subject:*`, `skill:*`, `character:*`, `series:*`
- **Metadata JSON** : `catalog_area`, `subjects`, `skills`, `search_terms`, `editorial_rank`, localisation FR/EN/AR, couverture
- **Langues** : FR + localisations EN/AR via `content_localizations`
- **Recherche** : titres, descriptions, tags, metadata et alias multilingues
- **Recommandations** : score déterministe (âge, langue localisée, intérêts, progression, diversité d’aires)

## Commande

```bash
cd backend
npm run seed:catalog
```

Options :

```bash
npm run seed:catalog -- --force      # régénère les MP3 existants
npm run seed:catalog -- --skip-audio  # SVG seulement (sans TTS)
```

## Prérequis

- `backend/.env` avec `DATABASE_URL` (même base que le serveur)
- Node 18+
- `edge-tts-universal` installé
- Internet pour la synthèse vocale (sans `--skip-audio`)

## Vérification

1. `npm run dev` (backend)
2. Enfant → **Bibliothèque** : histoires illustrées + audio
3. Enfant → **Audio** : comptines et histoires audio
4. Enfant → **Jouer** (`/kids/learning`) : quiz, jeux et activités
5. Enfant → **Mes histoires** : templates personnalisables
6. Admin → Contenus : entrées publiées avec tags / metadata

Tests :

```bash
cd backend
node --test tests/catalog.test.js tests/catalogFinalCompletion.test.js

cd ../frontend
npm test -- src/utils/__tests__/catalogFinalCompletion.test.js
```

## Routes concernées

| Route | Contenu |
|-------|---------|
| `GET /api/books/published` | Bibliothèque enfant (+ filtre `q`) |
| `GET /api/learning/contents` | Quiz, jeux et activités |
| `GET /api/generated-stories` | Histoires personnalisables |
| `POST /api/recommendations` | Suggestions (tags, âge, localisation, intérêts) |

## Production (Supabase)

```bash
cd backend
npm run seed:catalog
```

Synchroniser `backend/uploads/books/` vers le bucket Supabase si nécessaire.
