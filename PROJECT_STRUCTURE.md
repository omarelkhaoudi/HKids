# Structure du Projet HKids

Ce document décrit l'organisation de la structure du projet après réorganisation.

## Structure Principale

```
HKids/
├── backend/              # Serveur backend Node.js/Express
│   ├── config/          # Configuration
│   ├── database/        # Base de données SQLite
│   ├── middleware/      # Middlewares Express
│   ├── routes/          # Routes API
│   └── scripts/         # Scripts backend
│
├── frontend/            # Application React/Vite
│   ├── public/          # Fichiers statiques
│   ├── src/             # Code source React
│   └── scripts/         # Scripts frontend
│
├── docs/                # Documentation complète
│   ├── guides/          # Guides et tutoriels (8 fichiers)
│   ├── troubleshooting/ # Solutions aux problèmes (5 fichiers)
│   ├── development/     # Documentation de développement (8 fichiers)
│   └── [Documentation technique] # API, Architecture, etc.
│
├── scripts/             # Scripts du projet
│   ├── windows/         # Scripts Windows (.bat, .ps1) (6 fichiers)
│   └── [Scripts JS]     # Scripts JavaScript
│
├── test-images/         # Images de test
├── README.md            # Documentation principale (garde à la racine)
└── package.json         # Configuration npm racine
```

## Organisation des Fichiers

### 📚 Documentation (`docs/`)

#### Guides (`docs/guides/`)
Tous les guides et tutoriels pour utiliser le projet :
- `QUICK_START.md` - Démarrage rapide
- `SETUP.md` - Installation et configuration
- `START_SERVERS.md` - Démarrer les serveurs
- `GUIDE_IMAGES.md` - Gestion des images
- `LOGO_SETUP.md` - Configuration du logo
- `CREER_IMAGES_TEST.md` - Créer des images de test
- `CHECKLIST.md` - Checklist de vérification
- `DOCKER_README.md` - Guide Docker

#### Dépannage (`docs/troubleshooting/`)
Solutions aux problèmes courants :
- `FIX_SIGNUP_404.md` - Erreur 404 sur signup
- `FORCE_RESTART.md` - Forcer le redémarrage
- `RESTART_BACKEND.md` - Redémarrer le backend
- `URGENT_REDEMARRER.md` - Redémarrage urgent
- `SOLUTION_SIMPLE.md` - Solutions simples

#### Développement (`docs/development/`)
Documentation technique et notes de développement :
- `PROJECT_SUMMARY.md` - Résumé du projet
- `NEW_FEATURES.md` - Nouvelles fonctionnalités
- `DESIGN_SYSTEM.md` - Système de design
- `UI_UX_IMPROVEMENTS.md` - Améliorations UI/UX
- `PROFESSIONAL_IMPROVEMENTS.md` - Améliorations professionnelles
- `FINAL_REPORT.md` - Rapport final
- `VERIFICATION_COMPLETE.md` - Vérifications
- `README_PROFESSIONAL.md` - README professionnel

#### Documentation Technique (`docs/`)
- `API_DOCUMENTATION.md` - Documentation de l'API
- `ARCHITECTURE.md` - Architecture du projet
- `DEPLOYMENT.md` - Guide de déploiement
- `REQUIREMENTS_CHECKLIST.md` - Checklist des exigences
- `STACK_JUSTIFICATION.md` - Justification de la stack

### 🛠️ Scripts (`scripts/`)

#### Scripts Windows (`scripts/windows/`)
Scripts pour faciliter la gestion sur Windows :
- `redemarrer-backend.bat` - Redémarrer le backend
- `start-all.bat` - Démarrer tous les serveurs
- `force-restart-backend.ps1` - Forcer le redémarrage
- `restart-backend-now.ps1` - Redémarrer immédiatement
- `restart-backend.ps1` - Redémarrer le backend
- `start-all.ps1` - Démarrer tous les serveurs

#### Scripts JavaScript (`scripts/`)
- `generate-multiple-books.js` - Générer plusieurs livres
- `generate-test-images-html.js` - Générer HTML pour images de test
- `generate-test-images.js` - Générer images de test

## Fichiers à la Racine

Seuls les fichiers essentiels restent à la racine :
- `README.md` - Documentation principale du projet
- `package.json` - Configuration npm du projet racine
- `docker-compose.yml` - Configuration Docker
- `PROJECT_STRUCTURE.md` - Ce fichier

## Avantages de cette Organisation

✅ **Clarté** - Chaque type de fichier a son emplacement dédié
✅ **Facilité de navigation** - Structure logique et intuitive
✅ **Maintenance** - Plus facile de trouver et maintenir les fichiers
✅ **Documentation** - README dans chaque dossier pour expliquer le contenu
✅ **Séparation** - Guides, troubleshooting et développement sont séparés

## Utilisation

- **Pour démarrer le projet** : Consultez `docs/guides/QUICK_START.md`
- **Pour résoudre un problème** : Consultez `docs/troubleshooting/`
- **Pour comprendre le développement** : Consultez `docs/development/`
- **Pour utiliser les scripts** : Consultez `scripts/windows/README.md`

