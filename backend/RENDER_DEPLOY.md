# Déploiement sur Render

## ✅ Pourquoi Render ?

Render est une excellente alternative gratuite :
- ✅ Plan gratuit disponible
- ✅ PostgreSQL inclus (gratuit)
- ✅ Support des uploads de fichiers
- ✅ Déploiement automatique depuis GitHub
- ✅ SSL automatique

## 🚀 Étapes de déploiement

### 1. Créer un compte Render

1. Allez sur https://render.com
2. Connectez-vous avec GitHub
3. Cliquez sur "New +"

### 2. Créer la base de données PostgreSQL

1. Cliquez sur "New +" → "PostgreSQL"
2. Configurez :
   - **Name** : `hkids-db`
   - **Database** : `hkids`
   - **User** : (généré automatiquement)
   - **Region** : Choisissez le plus proche
   - **Plan** : Free (pour commencer)
3. Cliquez sur "Create Database"

### 3. Noter les informations de connexion

Dans votre base de données, notez :
- **Internal Database URL** (pour le backend sur Render)
- **External Database URL** (pour connexions externes)

### 4. Déployer le backend

1. Cliquez sur "New +" → "Web Service"
2. Connectez votre dépôt GitHub `HKids`
3. Configurez :
   - **Name** : `hkids-backend`
   - **Root Directory** : `backend`
   - **Environment** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Plan** : Free (pour commencer)

### 5. Configurer les variables d'environnement

Dans "Environment" → "Environment Variables", ajoutez :

```
DB_HOST=<votre-host-postgres>
DB_PORT=5432
DB_USER=<votre-user>
DB_PASSWORD=<votre-password>
DB_NAME=hkids
JWT_SECRET=votre-secret-jwt-tres-securise
CORS_ORIGIN=https://votre-frontend.vercel.app
NODE_ENV=production
```

**Note** : Utilisez l'**Internal Database URL** de Render pour `DB_HOST`

### 6. Déployer

1. Cliquez sur "Create Web Service"
2. Render va automatiquement :
   - Cloner votre repo
   - Installer les dépendances
   - Démarrer le serveur

### 7. Obtenir l'URL de votre API

Une fois déployé, vous obtiendrez une URL comme :
```
https://hkids-backend.onrender.com
```

### 8. Mettre à jour le frontend

Dans votre frontend (Vercel), mettez à jour :

```
VITE_API_URL=https://hkids-backend.onrender.com
```

## 📝 Notes importantes

- **Plan gratuit** : Le service peut "s'endormir" après 15 minutes d'inactivité
- **Premier démarrage** : Peut prendre 30-60 secondes après l'inactivité
- **Base de données** : PostgreSQL gratuit avec 90 jours de rétention
- **SSL** : Automatique et gratuit

## 🔧 Configuration avancée

### render.yaml (optionnel)

Créez `render.yaml` à la racine du projet :

```yaml
services:
  - type: web
    name: hkids-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DB_HOST
        fromDatabase:
          name: hkids-db
          property: host
      - key: DB_PORT
        fromDatabase:
          name: hkids-db
          property: port
      - key: DB_USER
        fromDatabase:
          name: hkids-db
          property: user
      - key: DB_PASSWORD
        fromDatabase:
          name: hkids-db
          property: password
      - key: DB_NAME
        fromDatabase:
          name: hkids-db
          property: database

databases:
  - name: hkids-db
    plan: free
```

## 🆘 Dépannage

### Le service s'endort

C'est normal avec le plan gratuit. Le premier appel après l'inactivité prendra 30-60 secondes.

### Erreur de connexion à la base de données

1. Vérifiez que vous utilisez l'**Internal Database URL** (pas External)
2. Vérifiez que toutes les variables d'environnement sont correctes
3. Vérifiez les logs dans Render Dashboard

