# Déploiement sur Vercel

## ⚠️ Limitations importantes

Vercel utilise des **fonctions serverless**, ce qui signifie :

1. **Timeout** : 10 secondes (gratuit) ou 60 secondes (Pro)
2. **Connexions DB** : Les connexions PostgreSQL doivent être gérées avec un pool de connexions adapté
3. **Fichiers statiques** : Les uploads doivent être stockés sur un service externe (S3, Cloudinary, etc.)
4. **Cold starts** : Premier appel peut être lent (2-5 secondes)

## 📋 Prérequis

1. Compte Vercel (gratuit)
2. Base de données PostgreSQL hébergée (Supabase, Railway, Neon, etc.)
3. Variables d'environnement configurées

## 🚀 Étapes de déploiement

### 1. Préparer la base de données

Vous devez avoir une base de données PostgreSQL accessible publiquement :
- **Supabase** (gratuit) : https://supabase.com
- **Neon** (gratuit) : https://neon.tech
- **Railway** (gratuit) : https://railway.app

### 2. Installer Vercel CLI

```bash
npm i -g vercel
```

### 3. Se connecter à Vercel

```bash
cd backend
vercel login
```

### 4. Configurer les variables d'environnement

Sur le dashboard Vercel ou via CLI :

```bash
vercel env add DB_HOST
vercel env add DB_PORT
vercel env add DB_USER
vercel env add DB_PASSWORD
vercel env add DB_NAME
vercel env add JWT_SECRET
vercel env add CORS_ORIGIN
vercel env add NODE_ENV production
```

### 5. Déployer

```bash
vercel --prod
```

## 🔧 Configuration recommandée

### Variables d'environnement minimales

```
DB_HOST=votre-host-postgres
DB_PORT=5432
DB_USER=votre-user
DB_PASSWORD=votre-password
DB_NAME=votre-db-name
JWT_SECRET=votre-secret-jwt
CORS_ORIGIN=https://votre-frontend.vercel.app
NODE_ENV=production
VERCEL=1
```

### Alternative : Utiliser Railway ou Render

Pour un backend Express complet, **Railway** ou **Render** sont plus adaptés :

- ✅ Pas de timeout
- ✅ Connexions DB persistantes
- ✅ Support des uploads de fichiers
- ✅ Processus long possible

Voir `RAILWAY_DEPLOY.md` ou `RENDER_DEPLOY.md` pour plus de détails.

## 📝 Notes

- Les fichiers uploadés doivent être stockés sur un service externe (S3, Cloudinary)
- Le dossier `uploads/` ne persiste pas sur Vercel
- Utilisez un pool de connexions PostgreSQL adapté aux fonctions serverless

