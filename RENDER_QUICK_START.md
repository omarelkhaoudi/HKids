# 🚀 Déploiement Render - Démarrage Rapide

## ✅ Actions Immédiates

### 1. Aller sur Render (1 min)
👉 **https://render.com** → Connectez-vous avec GitHub

### 2. Créer le Web Service (5 min)

1. **"New +"** → **"Web Service"**
2. Connectez votre repo **HKids**
3. Configurez :
   - **Name** : `hkids-backend`
   - **Root Directory** : `backend` ⚠️
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Plan** : `Free`

### 3. Ajouter les Variables d'Environnement (3 min)

Dans **"Environment Variables"**, ajoutez :

```
DATABASE_URL=postgresql://postgres:2003@English@2003@db.kueenrvthimjutyukdej.supabase.co:5432/postgres
JWT_SECRET=votre-secret-jwt-changez-moi
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://votre-frontend.vercel.app
```

### 4. Déployer (2 min)

Cliquez sur **"Create Web Service"** et attendez 3-5 minutes.

### 5. Tester (1 min)

Ouvrez : `https://hkids-backend.onrender.com/api/health`

---

## 📖 Guide Complet

👉 Voir `backend/DEPLOY_RENDER_NOW.md` pour le guide détaillé.

---

## 🎯 Après le déploiement

1. **Configurer le frontend** : Ajoutez `VITE_API_URL=https://hkids-backend.onrender.com` dans Vercel
2. **Redéployer le frontend** sur Vercel
3. **Tester** l'application complète

---

## ⚠️ Note Plan Gratuit

Le service s'endort après 15 min d'inactivité. Le premier appel prend 30-60 secondes (normal et gratuit).

