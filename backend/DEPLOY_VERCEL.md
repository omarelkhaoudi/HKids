# 🚀 Guide de Déploiement sur Vercel

## ✅ Prérequis

1. **Compte Vercel** : https://vercel.com (gratuit)
2. **Base de données PostgreSQL** hébergée :
   - **Supabase** (recommandé, gratuit) : https://supabase.com
   - **Neon** (gratuit) : https://neon.tech
   - **Railway** (gratuit au départ) : https://railway.app
3. **Vercel CLI** (optionnel, pour déploiement depuis terminal)

## 📋 Étapes de Déploiement

### 1. Préparer la Base de Données PostgreSQL

#### Option A : Supabase (Recommandé)

1. Créez un compte sur https://supabase.com
2. Créez un nouveau projet
3. Allez dans **Settings** → **Database**
4. Notez les informations de connexion :
   - **Host** : `db.xxxxx.supabase.co`
   - **Port** : `5432`
   - **Database** : `postgres`
   - **User** : `postgres`
   - **Password** : (celui que vous avez défini)

#### Option B : Neon

1. Créez un compte sur https://neon.tech
2. Créez un nouveau projet
3. Copiez la **Connection String** ou les informations séparées

### 2. Installer Vercel CLI (Optionnel)

```bash
npm i -g vercel
```

### 3. Déployer via le Dashboard Vercel (Recommandé)

#### Étape 1 : Connecter votre Repository GitHub

1. Allez sur https://vercel.com/new
2. Connectez votre compte GitHub
3. Sélectionnez le repository `HKids`
4. Cliquez sur **Import**

#### Étape 2 : Configurer le Projet

**Root Directory** : `backend`

**Build Command** : (laissez vide ou `npm install`)

**Output Directory** : (laissez vide)

**Install Command** : `npm install`

**Development Command** : (laissez vide)

#### Étape 3 : Configurer les Variables d'Environnement

Dans **Environment Variables**, ajoutez :

```
DB_HOST=votre-host-postgres
DB_PORT=5432
DB_USER=votre-user
DB_PASSWORD=votre-password
DB_NAME=votre-database-name
JWT_SECRET=votre-secret-jwt-tres-securise
CORS_ORIGIN=https://votre-frontend.vercel.app
NODE_ENV=production
VERCEL=1
```

**Important** :
- Remplacez `votre-host-postgres`, `votre-user`, etc. par vos vraies valeurs
- Pour `CORS_ORIGIN`, utilisez l'URL de votre frontend déployé sur Vercel
- Pour `JWT_SECRET`, générez une chaîne aléatoire sécurisée

#### Étape 4 : Déployer

1. Cliquez sur **Deploy**
2. Attendez que le déploiement se termine
3. Votre API sera disponible à : `https://votre-projet.vercel.app`

### 4. Déployer via CLI (Alternative)

```bash
cd backend
vercel login
vercel
```

Puis configurez les variables d'environnement :

```bash
vercel env add DB_HOST
vercel env add DB_PORT
vercel env add DB_USER
vercel env add DB_PASSWORD
vercel env add DB_NAME
vercel env add JWT_SECRET
vercel env add CORS_ORIGIN
vercel env add NODE_ENV production
vercel env add VERCEL 1
```

Déployez en production :

```bash
vercel --prod
```

## 🔧 Configuration Post-Déploiement

### 1. Tester l'API

Votre API sera disponible à : `https://votre-projet.vercel.app`

Testez le health check :
```
GET https://votre-projet.vercel.app/api/health
```

### 2. Mettre à jour le Frontend

Dans votre frontend (déployé sur Vercel), mettez à jour la variable d'environnement :

```
VITE_API_URL=https://votre-projet.vercel.app
```

## ⚠️ Limitations Importantes

### 1. Uploads de Fichiers

**Les fichiers uploadés ne persisteront pas** sur Vercel. Vous devez :

- Utiliser un service de stockage externe :
  - **Vercel Blob** (recommandé pour Vercel)
  - **AWS S3**
  - **Cloudinary**
  - **Supabase Storage**

### 2. Timeout

- **Plan gratuit** : 10 secondes maximum par requête
- **Plan Pro** : 60 secondes maximum par requête

### 3. Cold Starts

Le premier appel après une période d'inactivité peut prendre 2-5 secondes.

### 4. Connexions Database

Utilisez un pool de connexions PostgreSQL adapté aux fonctions serverless.

## 🆘 Dépannage

### Erreur : "Database connection failed"

1. Vérifiez que toutes les variables `DB_*` sont correctement définies
2. Vérifiez que votre base de données PostgreSQL est accessible publiquement
3. Vérifiez les logs dans Vercel Dashboard → **Deployments** → **Functions**

### Erreur : "CORS error"

1. Vérifiez que `CORS_ORIGIN` pointe vers l'URL exacte de votre frontend
2. Incluez le protocole `https://`

### Erreur : "Function timeout"

1. Vérifiez que vos requêtes prennent moins de 10 secondes (gratuit) ou 60 secondes (Pro)
2. Optimisez vos requêtes database
3. Considérez passer au plan Pro si nécessaire

## 📝 Notes Finales

- **Recommandation** : Pour un backend Express complet, **Railway** ou **Render** sont plus adaptés
- Vercel est excellent pour le frontend et les API simples
- Pour les uploads de fichiers, utilisez un service externe

## 🔗 Liens Utiles

- [Documentation Vercel](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Supabase](https://supabase.com)
- [Neon](https://neon.tech)

