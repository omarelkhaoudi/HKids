# Catalogue contenu réel — HKids

Guide pour alimenter la bibliothèque avec du **contenu original** prêt pour la démo partenaire.

## Contenu fourni

| Fichier | Rôle |
|---------|------|
| `backend/content/catalog.js` | Catalogue livres (illustrés, audio, comptines, religieux) |
| `backend/content/catalogExtended.js` | Génération des contenus étendus |
| `backend/content/learningCatalog.js` | 20 quiz + 20 jeux éducatifs |
| `backend/content/storyTemplatesCatalog.js` | 10 histoires personnalisables (templates) |
| `backend/content/svgAssets.js` | Couvertures et pages SVG |
| `backend/content/audioAssets.js` | Synthèse vocale Edge TTS |
| `backend/scripts/seed-catalog.js` | Seed unifié (livres + learning + templates) |

### Volume cible (après seed)

| Type | Quantité |
|------|----------|
| Histoires audio (`audio_story`) | ≥ 30 |
| Comptines (`song`) | 20 |
| Histoires illustrées (`story`) | 9 |
| Histoires religieuses (`theme: spiritual`) | 10 |
| Quiz (`learning_contents`) | 20 |
| Jeux éducatifs (mémoire) | 20 |
| Histoires personnalisables (`generated_stories`) | 10 / profil enfant |

### Métadonnées

- **Catégories** : Histoires, Comptines, Dinosaures, Espace, Animaux, Spiritualité, Contes
- **Âge** : `age_group_min` / `age_group_max` + tag `level:2-4`, `level:5-7`, `level:8-10`
- **Tags** : thème, type, difficulté, editorial (`recommended`, `popular`, `new`)
- **Langues** : FR + localisations EN/AR via `content_localizations`
- **Illustrations** : SVG générés (emoji + texte)
- **Durée** : `duration_seconds` + pistes `book_audio_tracks`
- **Recommandations** : flags `is_recommended`, `is_popular`, `is_new` + tags pour le moteur IA

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
4. Enfant → **Jouer** (`/kids/learning`) : quiz et jeux
5. Enfant → **Mes histoires** : templates personnalisables
6. Admin → Contenus : entrées publiées avec tags

Tests :

```bash
cd backend
node --test tests/catalog.test.js
```

## Routes concernées

| Route | Contenu |
|-------|---------|
| `GET /api/books/published` | Bibliothèque enfant |
| `GET /api/learning/contents` | Quiz et jeux |
| `GET /api/generated-stories` | Histoires personnalisables |
| `POST /api/recommendations` | Suggestions (tags, âge, favoris) |

## Production (Supabase)

```bash
cd backend
npm run seed:catalog
```

Synchroniser `backend/uploads/books/` vers le bucket Supabase si nécessaire.
