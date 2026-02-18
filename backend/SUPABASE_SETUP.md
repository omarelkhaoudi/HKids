# 🔧 Configuration Supabase pour Vercel

## 📋 Étape 1 : Récupérer les Informations de Connexion Supabase

### Dans votre Dashboard Supabase :

1. **Allez dans votre projet** sur https://supabase.com/dashboard

2. **Cliquez sur "Settings"** (⚙️) dans la barre latérale gauche

3. **Cliquez sur "Database"** dans le menu Settings

4. **Trouvez la section "Connection string"** ou **"Connection pooling"**

5. **Notez ces informations** :

   - **Host** : `db.xxxxx.supabase.co` (dans "Connection string" ou "Connection pooling")
   - **Port** : `5432` (généralement)
   - **Database** : `postgres` (généralement)
   - **User** : `postgres` (généralement)
   - **Password** : Celui que vous avez défini lors de la création du projet

   **OU** utilisez la **Connection String** complète :
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### Alternative : Connection Pooling (Recommandé pour Vercel)

Pour de meilleures performances avec les fonctions serverless :

1. Dans **Settings** → **Database**
2. Trouvez **"Connection pooling"**
3. Utilisez l'URL de pooling (commence par `postgresql://postgres.xxxxx`)

## 📋 Étape 2 : Configurer les Variables d'Environnement sur Vercel

### Option A : Via le Dashboard Vercel (Recommandé)

1. **Allez sur** https://vercel.com/dashboard
2. **Sélectionnez votre projet** (ou créez-en un nouveau)
3. **Allez dans "Settings"** → **"Environment Variables"**
4. **Ajoutez ces variables** :

   ```
   DB_HOST=db.xxxxx.supabase.co
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=votre-mot-de-passe-supabase
   DB_NAME=postgres
   JWT_SECRET=votre-secret-jwt-tres-securise
   CORS_ORIGIN=https://votre-frontend.vercel.app
   NODE_ENV=production
   VERCEL=1
   ```

   **Important** :
   - Remplacez `db.xxxxx.supabase.co` par votre vrai host Supabase
   - Remplacez `votre-mot-de-passe-supabase` par votre mot de passe Supabase
   - Pour `JWT_SECRET`, générez une chaîne aléatoire sécurisée (ex: `openssl rand -base64 32`)
   - Pour `CORS_ORIGIN`, utilisez l'URL de votre frontend déployé

5. **Sélectionnez les environnements** : Production, Preview, Development
6. **Cliquez sur "Save"**

### Option B : Via Vercel CLI

```bash
cd backend
vercel env add DB_HOST
# Entrez: db.xxxxx.supabase.co

vercel env add DB_PORT
# Entrez: 5432

vercel env add DB_USER
# Entrez: postgres

vercel env add DB_PASSWORD
# Entrez: votre-mot-de-passe-supabase

vercel env add DB_NAME
# Entrez: postgres

vercel env add JWT_SECRET
# Entrez: votre-secret-jwt-tres-securise

vercel env add CORS_ORIGIN
# Entrez: https://votre-frontend.vercel.app

vercel env add NODE_ENV production
vercel env add VERCEL 1
```

## 📋 Étape 3 : Déployer sur Vercel

### Si vous n'avez pas encore déployé :

1. **Allez sur** https://vercel.com/new
2. **Connectez votre repository GitHub** `HKids`
3. **Configurez le projet** :
   - **Root Directory** : `backend`
   - **Framework Preset** : Other
   - **Build Command** : (laissez vide)
   - **Output Directory** : (laissez vide)
   - **Install Command** : `npm install`
4. **Ajoutez les variables d'environnement** (comme dans l'étape 2)
5. **Cliquez sur "Deploy"**

### Si vous avez déjà déployé :

1. **Allez dans votre projet Vercel**
2. **Cliquez sur "Deployments"**
3. **Cliquez sur les trois points** (⋯) du dernier déploiement
4. **Cliquez sur "Redeploy"**

## ✅ Étape 4 : Vérifier le Déploiement

1. **Attendez que le déploiement se termine**
2. **Copiez l'URL de votre API** (ex: `https://hkids-backend.vercel.app`)
3. **Testez le health check** :
   ```
   GET https://votre-api.vercel.app/api/health
   ```
   Vous devriez recevoir :
   ```json
   {
     "status": "ok",
     "message": "HKids API is running",
     "timestamp": "...",
     "uptime": ...,
     "environment": "production"
   }
   ```

## 🔧 Étape 5 : Mettre à jour le Frontend

Dans votre frontend (déployé sur Vercel) :

1. **Allez dans Settings** → **Environment Variables**
2. **Ajoutez ou modifiez** :
   ```
   VITE_API_URL=https://votre-api.vercel.app
   ```
3. **Redéployez le frontend**

## 🆘 Dépannage

### Erreur : "Database connection failed"

1. Vérifiez que toutes les variables `DB_*` sont correctement définies
2. Vérifiez que votre mot de passe Supabase est correct
3. Vérifiez que le host Supabase est correct (sans `https://` ou `http://`)
4. Vérifiez les logs dans Vercel Dashboard → **Deployments** → **Functions**

### Erreur : "Connection timeout"

1. Vérifiez que votre base de données Supabase est active
2. Vérifiez que vous utilisez le bon port (5432)
3. Essayez d'utiliser la **Connection Pooling URL** au lieu de la connexion directe

### Comment trouver votre Host Supabase

1. Allez dans **Settings** → **Database**
2. Regardez la section **"Connection string"**
3. Le host est la partie entre `@` et `:5432`
   Exemple : `postgresql://postgres:[PASSWORD]@db.abcdefgh.supabase.co:5432/postgres`
   → Host = `db.abcdefgh.supabase.co`

## 📝 Notes Importantes

- **Ne partagez jamais** vos mots de passe ou secrets publiquement
- **Utilisez Connection Pooling** pour de meilleures performances avec Vercel
- **Testez toujours** votre API après le déploiement
- **Vérifiez les logs** dans Vercel Dashboard en cas de problème

