# Catalogue contenu réel — HKids

Guide pour alimenter la bibliothèque avec du **contenu original** prêt pour la démo partenaire.

## Contenu fourni

Le dossier `backend/content/` contient :

| Fichier | Rôle |
|---------|------|
| `catalog.js` | 13 contenus originaux (histoires illustrées + comptines audio) |
| `svgAssets.js` | Génération couvertures et pages SVG |
| `audioAssets.js` | Synthèse vocale via Microsoft Edge TTS (`npx edge-tts`) |
| `audio/` | MP3 générés (créés au premier seed) |

### Thèmes couverts

- Dinosaures, espace, animaux, princesses, couleurs, métiers
- Alphabet, chiffres, comptines, chansons
- Métadonnées **FR** + localisations **EN/AR**
- Pistes audio multilingues pour les comptines

## Commande

```bash
cd backend
npm run seed:catalog
```

Options :

```bash
npm run seed:catalog -- --force      # régénère les MP3 existants
npm run seed:catalog -- --skip-audio # SVG seulement (sans TTS)
```

## Prérequis

- Base PostgreSQL accessible (`DATABASE_URL` ou config locale)
- Node 18+
- Dépendance `edge-tts-universal` (installée via `npm install` dans `backend/`)
- Connexion internet pour la synthèse vocale (premier seed)

Les fichiers sont écrits dans `backend/uploads/books/` et servis par l’API sur `/uploads/books/:filename`.

## Vérification

1. Démarrer le backend : `npm run dev`
2. Admin → Contenus : 13 entrées publiées
3. Enfant → Bibliothèque / Audio : couvertures visibles, lecture audio OK
4. Changer la langue UI (FR/EN/AR) : titres localisés via `content_localizations`

## Ajouter un contenu

1. Ajouter une entrée dans `backend/content/catalog.js`
2. Relancer `npm run seed:catalog`
3. Le script fait un **upsert par slug** (sans doublon)

## Production (Supabase)

En production avec `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`, les uploads passent par l’API admin (`BookManagement`). Pour un import massif prod :

1. Exécuter `seed:catalog` en local
2. Synchroniser `backend/uploads/books/` vers le bucket Supabase
3. Ou créer via l’admin avec les mêmes métadonnées

## Limites

- Les histoires sont des **textes originaux** (pas de livres sous copyright)
- L’audio TTS est une voix synthétique — remplaçable par des enregistrements studio via l’admin
- Les pages sont des **illustrations SVG** (emoji + texte court), pas des PDF scannés
