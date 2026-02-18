# 🚀 Déploiement Backend sur Render - Guide Complet

## ✅ Prérequis

- ✅ Compte GitHub avec votre projet `HKids` poussé
- ✅ Compte Render (gratuit) : https://render.com
- ✅ Base de données Supabase PostgreSQL configurée

---

## 📋 Étape 1 : Créer un compte Render (2 minutes)

1. Allez sur **https://render.com**
2. Cliquez sur **"Get Started for Free"**
3. Connectez-vous avec votre compte **GitHub**
4. Autorisez Render à accéder à vos repositories

---

## 📋 Étape 2 : Connecter votre Repository (3 minutes)

1. Dans le Dashboard Render, cliquez sur **"New +"**
2. Sélectionnez **"Web Service"**
3. Cliquez sur **"Connect account"** si ce n'est pas déjà fait
4. Sélectionnez votre repository **HKids**
5. Cliquez sur **"Connect"**

---

## 📋 Étape 3 : Configurer le Web Service (5 minutes)

### 3.1 Informations de base

- **Name** : `hkids-backend`
- **Region** : Choisissez le plus proche (ex: `Frankfurt` pour l'Europe)
- **Branch** : `main` (ou `master`)
- **Root Directory** : `backend` ⚠️ **IMPORTANT**
- **Runtime** : `Node`
- **Build Command** : `npm install`
- **Start Command** : `npm start`
- **Plan** : `Free` (pour commencer)

### 3.2 Variables d'environnement

Cliquez sur **"Advanced"** → **"Add Environment Variable"** et ajoutez :

#### Variables de base de données (Supabase)

```
DB_HOST=db.kueenrvthimjutyukdej.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=2003@English@2003
DB_NAME=postgres
```

**OU** utilisez `DATABASE_URL` (plus simple) :

```
DATABASE_URL=postgresql://postgres:2003@English@2003@db.kueenrvthimjutyukdej.supabase.co:5432/postgres
```

#### Variables de sécurité

```
JWT_SECRET=votre-secret-jwt-tres-securise-changez-moi
NODE_ENV=production
PORT=3000
```

#### Variable CORS (URL de votre frontend)

```
CORS_ORIGIN=https://votre-frontend.vercel.app
```

**Remplacez** `https://votre-frontend.vercel.app` par l'URL réelle de votre frontend déployé sur Vercel.

---

## 📋 Étape 4 : Déployer (2 minutes)

1. Vérifiez toutes les variables d'environnement
2. Cliquez sur **"Create Web Service"**
3. Render va automatiquement :
   - Cloner votre repository
   - Installer les dépendances (`npm install`)
   - Démarrer le serveur (`npm start`)

**⏱️ Temps de déploiement** : 3-5 minutes

---

## 📋 Étape 5 : Vérifier le déploiement (2 minutes)

### 5.1 Vérifier les logs

Dans le Dashboard Render, allez dans **"Logs"** et vérifiez :

```
✅ Database initialization completed
🚀 HKids Backend running on http://localhost:3000
```

### 5.2 Tester l'API

Une fois déployé, vous obtiendrez une URL comme :
```
https://hkids-backend.onrender.com
```

**Testez l'endpoint de santé** :
```
https://hkids-backend.onrender.com/api/health
```

Vous devriez voir :
```json
{
  "status": "ok",
  "message": "HKids API is running",
  "timestamp": "...",
  "uptime": ...,
  "environment": "production"
}
```

---

## 📋 Étape 6 : Configurer le Frontend (5 minutes)

### 6.1 Dans Vercel Dashboard

1. Allez sur **https://vercel.com/dashboard**
2. Ouvrez votre projet **frontend**
3. **Settings** → **Environment Variables**
4. Ajoutez/modifiez :

```
VITE_API_URL=https://hkids-backend.onrender.com
```

5. **Redéployez** le frontend

### 6.2 Tester l'application complète

1. Ouvrez votre frontend déployé
2. Connectez-vous avec `admin` / `admin123`
3. Vérifiez que les livres s'affichent

---

## 🎉 C'est Fait !

Votre backend est maintenant déployé sur Render !

**URL de votre API** : `https://hkids-backend.onrender.com`

---

## ⚠️ Notes importantes sur le plan gratuit

### Service qui "s'endort"

- Le service gratuit s'endort après **15 minutes d'inactivité**
- Le premier appel après l'inactivité prend **30-60 secondes** (temps de démarrage)
- C'est normal et gratuit !

### Pour éviter l'endormissement

1. **Upgrade vers un plan payant** (à partir de $7/mois)
2. **Utiliser un service de "ping"** gratuit (ex: UptimeRobot) pour maintenir le service actif

---

## 🆘 Dépannage

### Erreur : "Database initialization failed"

**Solution** :
1. Vérifiez que `DB_PASSWORD` est correct
2. Vérifiez que votre base Supabase accepte les connexions externes
3. Vérifiez les logs dans Render Dashboard

### Erreur : "Port already in use"

**Solution** : Render gère automatiquement le port. Vérifiez que vous n'avez pas défini `PORT` dans les variables d'environnement, ou utilisez `PORT=3000`.

### Erreur CORS

**Solution** :
1. Vérifiez que `CORS_ORIGIN` correspond exactement à l'URL de votre frontend
2. Incluez `https://` dans l'URL
3. Pas d'URL avec `/` à la fin

### Le service ne démarre pas

**Solution** :
1. Vérifiez les logs dans Render Dashboard
2. Vérifiez que `Root Directory` est bien `backend`
3. Vérifiez que `Start Command` est `npm start`

---

## 📝 Checklist finale

- [ ] Compte Render créé
- [ ] Repository GitHub connecté
- [ ] Web Service créé avec `Root Directory: backend`
- [ ] Variables d'environnement ajoutées (DB_*, JWT_SECRET, CORS_ORIGIN)
- [ ] Déploiement réussi
- [ ] Test `/api/health` fonctionne
- [ ] Frontend configuré avec `VITE_API_URL`
- [ ] Application complète testée

---

## 🔗 Liens utiles

- **Render Dashboard** : https://dashboard.render.com
- **Documentation Render** : https://render.com/docs
- **Votre API** : `https://hkids-backend.onrender.com`

