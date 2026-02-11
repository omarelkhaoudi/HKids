# Documentation HKids

Cette section contient toute la documentation technique du projet HKids.

## Documents Disponibles

### 1. [Architecture Technique](./ARCHITECTURE.md)
Description complète de l'architecture du système, des composants, et de la structure technique.

### 2. [Justification du Stack](./STACK_JUSTIFICATION.md)
Justification détaillée des choix technologiques basée sur la scalabilité, maintenabilité, sécurité et compatibilité.

### 3. [Documentation API](./API_DOCUMENTATION.md)
Documentation complète de l'API REST avec exemples d'utilisation.

### 4. [Guide de Déploiement](./DEPLOYMENT.md)
Instructions pour déployer l'application en développement et en production.

## Vue d'Ensemble

HKids est une plateforme de lecture numérique pour enfants construite avec:

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Base de données**: SQLite (migration PostgreSQL possible)
- **Authentification**: JWT
- **Stockage**: Système de fichiers local (cloud storage en production)

## Points Clés

- ✅ Architecture modulaire et extensible
- ✅ Hardware-agnostic (fonctionne sur tablettes et appareils dédiés)
- ✅ Interface de lecture immersive avec animations
- ✅ Système de gestion de contenu complet
- ✅ Sécurisé avec authentification JWT
- ✅ Prêt pour la production avec recommandations d'amélioration

## Démarrage Rapide

1. Installer les dépendances: `npm run install:all`
2. Démarrer le backend: `npm run dev:backend`
3. Démarrer le frontend: `npm run dev:frontend`
4. Accéder à l'application: http://localhost:5173

Voir [Guide de Déploiement](./DEPLOYMENT.md) pour plus de détails.

