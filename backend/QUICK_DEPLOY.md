# 🚀 Déploiement Rapide du Backend sur Vercel

## 📋 Checklist avant de commencer

- [ ] Compte Vercel créé (https://vercel.com)
- [ ] Base de données PostgreSQL hébergée (Supabase, Neon, ou Railway)
- [ ] URL de votre frontend déployé (pour CORS_ORIGIN)

## 🎯 Option 1 : Déploiement via Dashboard (Recommandé)

### Étape 1 : Connecter le Repository

1. Allez sur https://vercel.com/new
2. Connectez votre compte GitHub
3. Sélectionnez le repository `HKids`
4. Cliquez sur **Import**

### Étape 2 : Configurer le Projet

**IMPORTANT** : Configurez ces paramètres :

- **Framework Preset** : Other
- **Root Directory** : `backend` ⚠️ (très important !)
- **Build Command** : (laissez vide)
- **Output Directory** : (laissez vide)
- **Install Command** : `npm install`

### Étape 3 : Variables d'Environnement

Dans **Environment Variables**, ajoutez toutes ces variables :

```
DB_HOST=votre-host-postgres
DB_PORT=5432
DB_USER=votre-user
DB_PASSWORD=votre-password
DB_NAME=votre-database-name
JWT_SECRET=votre-secret-jwt-tres-securise-minimum-32-caracteres
CORS_ORIGIN=https://votre-frontend.vercel.app
NODE_ENV=production
VERCEL=1
```

**Comment obtenir ces valeurs ?**

#### Si vous utilisez Supabase :
1. Allez dans **Settings** → **Database**
2. Copiez les informations de connexion
3. **Host** : `db.xxxxx.supabase.co`
4. **Port** : `5432`
5. **Database** : `postgres`
6. **User** : `postgres`
7. **Password** : celui que vous avez défini

#### Générer un JWT_SECRET sécurisé :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Étape 4 : Déployer

1. Cliquez sur **Deploy**
2. Attendez 2-3 minutes
3. Votre API sera disponible à : `https://votre-projet.vercel.app`

## 🎯 Option 2 : Déploiement via CLI

### Étape 1 : Se connecter

```bash
cd backend
vercel login
```

### Étape 2 : Premier déploiement

```bash
vercel
```

Répondez aux questions :
- Set up and deploy? **Y**
- Which scope? (choisissez votre compte)
- Link to existing project? **N**
- What's your project's name? **hkids-backend** (ou autre)
- In which directory is your code located? **./** (déjà dans backend)

### Étape 3 : Configurer les Variables d'Environnement

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

Pour chaque variable, entrez la valeur correspondante.

### Étape 4 : Déployer en Production

```bash
vercel --prod
```

## ✅ Vérifier le Déploiement

Testez votre API :

```bash
curl https://votre-projet.vercel.app/api/health
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

## 🔧 Mettre à jour le Frontend

Dans votre frontend déployé sur Vercel, ajoutez/modifiez la variable d'environnement :

```
VITE_API_URL=https://votre-projet.vercel.app
```

Puis redéployez le frontend.

## ⚠️ Notes Importantes

1. **Uploads de fichiers** : Les fichiers uploadés ne persisteront pas sur Vercel. Vous devrez utiliser un service externe (Vercel Blob, AWS S3, Cloudinary, Supabase Storage).

2. **Timeout** : 
   - Plan gratuit : 10 secondes max par requête
   - Plan Pro : 60 secondes max par requête

3. **Cold Starts** : Le premier appel après inactivité peut prendre 2-5 secondes.

## 🆘 Dépannage

### Erreur : "Database connection failed"
- Vérifiez que toutes les variables `DB_*` sont correctement définies
- Vérifiez que votre base de données est accessible publiquement
- Vérifiez les logs dans Vercel Dashboard → Deployments → Functions

### Erreur : "CORS error"
- Vérifiez que `CORS_ORIGIN` pointe vers l'URL exacte de votre frontend
- Incluez le protocole `https://`

## 📝 Prochaines Étapes

1. ✅ Backend déployé sur Vercel
2. ⏭️ Configurer le stockage de fichiers (Vercel Blob, Supabase Storage, etc.)
3. ⏭️ Mettre à jour le frontend avec la nouvelle URL de l'API

