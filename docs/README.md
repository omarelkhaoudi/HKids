# Documentation HKids

Cette section contient toute la documentation technique du projet HKids.

## Documents Disponibles

### 0. [Analyse Cahier des Charges - Le Lit Qui Lit](./LE_LIT_QUI_LIT_GAP_ANALYSIS.md)
Analyse du nouveau cahier des charges, ecarts avec le repo actuel, MVP recommande, risques et questions a poser.

### 0.1. [Feuille de Route Step by Step - Le Lit Qui Lit](./LE_LIT_QUI_LIT_STEP_BY_STEP_ROADMAP.md)
Plan d'execution fichier par fichier pour transformer le POC HKids en MVP Le Lit Qui Lit.

### 1. [Architecture Technique](./ARCHITECTURE.md)
Description complète de l'architecture du système, des composants, et de la structure technique.

### 2. [Justification du Stack](./STACK_JUSTIFICATION.md)
Justification détaillée des choix technologiques basée sur la scalabilité, maintenabilité, sécurité et compatibilité.

### 3. [Documentation API](./API_DOCUMENTATION.md)
Documentation complète de l'API REST avec exemples d'utilisation.

### 4. [Guide de Déploiement](./DEPLOYMENT.md)
Instructions pour déployer l'application en développement et en production.

### 5. [Dashboard Parent Supabase](./PARENT_DASHBOARD_SUPABASE.md)
Architecture du snapshot parental réel, endpoints, cache TTL, schéma SQL, pagination et flux de synchronisation offline.

### 6. [Stripe Production](./STRIPE_PRODUCTION.md)
Checkout, webhooks signés, abonnements, annulation, renouvellement, factures, historique et essai gratuit.

## Vue d'Ensemble

HKids est une plateforme de lecture numérique pour enfants construite avec:

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Base de données**: PostgreSQL
- **Authentification**: JWT
- **Stockage**: Système de fichiers local (cloud storage en production)

## Points Clés

- ✅ Architecture modulaire et extensible
- ✅ Hardware-agnostic (fonctionne sur tablettes et appareils dédiés)
- ✅ Interface de lecture immersive avec animations
- ✅ Système de gestion de contenu complet
- ✅ Sécurisé avec authentification JWT
- ⚠ Base POC solide, mais le nouveau MVP "Le Lit Qui Lit" demande encore audio, IA vocale, clonage vocal, offline et consentement avance

## Démarrage Rapide

1. Installer les dépendances: `npm run install:all`
2. Démarrer le backend: `npm run dev:backend`
3. Démarrer le frontend: `npm run dev:frontend`
4. Accéder à l'application: http://localhost:5173

Voir [Guide de Déploiement](./DEPLOYMENT.md) pour plus de détails.

