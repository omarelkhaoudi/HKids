# Déploiement sur Railway

## ✅ Pourquoi Railway ?

Railway est **parfait** pour les backends Express + PostgreSQL :
- ✅ Pas de timeout
- ✅ Connexions DB persistantes
- ✅ Support des uploads de fichiers
- ✅ PostgreSQL inclus (gratuit au départ)
- ✅ Déploiement automatique depuis GitHub
- ✅ Variables d'environnement faciles

## 🚀 Étapes de déploiement

### 1. Créer un compte Railway

1. Allez sur https://railway.app
2. Connectez-vous avec GitHub
3. Cliquez sur "New Project"

### 2. Ajouter PostgreSQL

1. Dans votre projet, cliquez sur "+ New"
2. Sélectionnez "Database" → "Add PostgreSQL"
3. Railway créera automatiquement une base de données

### 3. Déployer le backend

**Option A : Depuis GitHub (recommandé)**

1. Cliquez sur "+ New" → "GitHub Repo"
2. Sélectionnez votre dépôt `HKids`
3. Railway détectera automatiquement le backend
4. Configurez le **Root Directory** : `backend`

**Option B : Depuis le CLI**

```bash
npm i -g @railway/cli
railway login
cd backend
railway init
railway up
```

### 4. Configurer les variables d'environnement

Dans Railway Dashboard → Variables :

```
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_NAME=${{Postgres.PGDATABASE}}
JWT_SECRET=votre-secret-jwt-tres-securise
CORS_ORIGIN=https://votre-frontend.vercel.app
NODE_ENV=production
```

**Note** : Railway fournit automatiquement les variables PostgreSQL avec `${{Postgres.*}}`

### 5. Configurer le build

Railway détecte automatiquement Node.js, mais vous pouvez spécifier :

**Settings → Build Command** :
```bash
npm install
```

**Settings → Start Command** :
```bash
npm start
```

**Settings → Root Directory** :
```
backend
```

### 6. Obtenir l'URL de votre API

1. Cliquez sur votre service backend
2. Cliquez sur "Settings" → "Generate Domain"
3. Copiez l'URL (ex: `hkids-backend-production.up.railway.app`)

### 7. Mettre à jour le frontend

Dans votre frontend (Vercel ou autre), mettez à jour la variable d'environnement :

```
VITE_API_URL=https://hkids-backend-production.up.railway.app
```

## 📝 Notes importantes

- **Gratuit au départ** : Railway offre $5 de crédit gratuit par mois
- **Base de données** : PostgreSQL est inclus et géré automatiquement
- **Déploiement automatique** : Chaque push sur `main` déclenche un déploiement
- **Logs** : Accessibles directement dans le dashboard Railway

## 🔧 Configuration avancée

### Railway.toml (optionnel)

Créez `railway.toml` dans le dossier `backend` :

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

## 🆘 Dépannage

### Le backend ne démarre pas

1. Vérifiez les logs dans Railway Dashboard
2. Vérifiez que toutes les variables d'environnement sont définies
3. Vérifiez que PostgreSQL est bien connecté

### Erreur de connexion à la base de données

1. Vérifiez que la base de données PostgreSQL est active
2. Vérifiez les variables `DB_*` dans Railway
3. Testez la connexion avec `railway connect postgres`

