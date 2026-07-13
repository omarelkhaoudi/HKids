# Guide de deploiement - HKids

## Prerequis

- Node.js 18+ et npm
- PostgreSQL 12+ ou une base PostgreSQL managee
- Git

## Installation locale

### 1. Installer les dependances

```bash
npm run install:all
```

Cette commande installe les dependances du projet racine, du backend et du frontend.

### 2. Configurer la base de donnees

Creer une base PostgreSQL:

```sql
CREATE DATABASE hkids;
```

Puis configurer `backend/.env` a partir de `backend/env.example`.

Option recommandee:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/hkids
```

Le backend initialise automatiquement les tables au demarrage.

### 3. Demarrer en developpement

Terminal backend:

```bash
npm run dev:backend
```

Terminal frontend:

```bash
npm run dev:frontend
```

Acces locaux:

- Application: `http://localhost:5173`
- API: `http://localhost:3000/api`
- Admin: `http://localhost:5173/admin/login`
- Parent: `http://localhost:5173/parent/login`

## Structure de deploiement

```text
HKids/
├── backend/
│   ├── api/                 # Entry point serverless
│   ├── config/              # Env + storage config
│   ├── database/            # Initialisation PostgreSQL
│   ├── middleware/          # Express middleware
│   ├── routes/              # REST API
│   ├── scripts/             # Scripts de maintenance
│   ├── uploads/             # Stockage local en dev
│   └── server.js            # Serveur Express
├── frontend/
│   ├── public/              # Assets statiques
│   ├── src/                 # Application React
│   ├── vercel.json          # Rewrite SPA
│   └── vite.config.js
├── docs/                    # Documentation technique
└── scripts/                 # Scripts locaux
```

## Build production

Frontend:

```bash
cd frontend
npm run build
```

Backend:

```bash
cd backend
npm run build
```

## Variables d'environnement backend

Variables principales:

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://h-kids.vercel.app
FRONTEND_URL=https://h-kids.vercel.app
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_BUCKET=hkids-books
```

Utiliser un `JWT_SECRET` fort en production.

## Deploiement recommande

### Frontend

- Vercel ou autre hebergeur statique compatible SPA.
- Le fichier `frontend/vercel.json` redirige les routes React vers `index.html`.

### Backend

- Render, Fly.io, Vercel serverless, ou serveur Node.js classique.
- Le backend expose une API Express et peut utiliser PostgreSQL via `DATABASE_URL`.

### Stockage fichiers

- Developpement: `backend/uploads`.
- Production: Supabase Storage recommande pour eviter la perte de fichiers en environnement serverless.

## Base de donnees production

Utiliser PostgreSQL manage avec sauvegardes automatiques si possible: Supabase, Render, Neon ou equivalent.

Exemple:

```env
DATABASE_URL=postgresql://user:password@xxxxxx.neon.tech/dbname?sslmode=require
```

Backup manuel:

```bash
pg_dump "$DATABASE_URL" > hkids-backup.sql
```

## Securite production

- Changer les identifiants admin par defaut.
- Utiliser HTTPS.
- Restreindre `CORS_ORIGIN`.
- Garder les secrets uniquement dans les variables d'environnement.
- Activer les sauvegardes PostgreSQL.
- Limiter la taille des uploads.
- Surveiller les logs backend.

## Verification

Apres deploiement:

- Ouvrir `/` pour verifier la bibliotheque.
- Ouvrir `/admin/login` pour verifier le back-office.
- Ouvrir `/parent/login` pour verifier le dashboard parent.
- Tester un livre PDF/image dans `/book/:id`.
- Verifier que seuls les livres publies apparaissent cote lecture.

### Checklist pre-lancement

Voir [PRODUCTION_LAUNCH.md](./PRODUCTION_LAUNCH.md) pour la checklist complete (secrets, Stripe, Supabase, IA, monitoring).

Commandes de validation locale avant deploiement:

```bash
npm run ci
npm run test:e2e
```

Variables supplementaires (Stripe, IA, voix) — voir `backend/env.example` et [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md).
