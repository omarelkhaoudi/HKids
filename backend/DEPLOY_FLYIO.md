# 🚀 Guide de Déploiement sur Fly.io

## ✅ Prérequis

1. **Compte Fly.io** : https://fly.io (gratuit avec crédits)
2. **Base de données PostgreSQL** hébergée (Supabase, Neon, etc.)
3. **Fly CLI** installé

## 📋 Étapes de Déploiement

### 1. Installer Fly CLI

**Windows (PowerShell) :**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**Ou via npm :**
```bash
npm install -g @fly/cli
```

### 2. Se connecter à Fly.io

```bash
fly auth login
```

Cela ouvrira votre navigateur pour vous connecter.

### 3. Initialiser l'application Fly.io

```bash
cd backend
fly launch
```

Répondez aux questions :
- **App name** : `hkids-backend` (ou laissez-le générer un nom)
- **Region** : Choisissez la région la plus proche (ex: `cdg` pour Paris)
- **PostgreSQL** : `n` (vous avez déjà Supabase)
- **Redis** : `n`

### 4. Configurer les Variables d'Environnement

```bash
# Base de données
fly secrets set DB_HOST=db.kueenrvthimjutyukdej.supabase.co
fly secrets set DB_PORT=5432
fly secrets set DB_USER=postgres
fly secrets set DB_PASSWORD=votre-mot-de-passe-supabase
fly secrets set DB_NAME=postgres

# JWT
fly secrets set JWT_SECRET=k0r07HOro0M6jH9o4Tl0IKv08l9bB8Oxx4DTo7rKF6Y=

# CORS
fly secrets set CORS_ORIGIN=https://votre-frontend.vercel.app

# Autres
fly secrets set NODE_ENV=production
```

**Ou en une seule commande :**
```bash
fly secrets set \
  DB_HOST=db.kueenrvthimjutyukdej.supabase.co \
  DB_PORT=5432 \
  DB_USER=postgres \
  DB_PASSWORD=votre-mot-de-passe \
  DB_NAME=postgres \
  JWT_SECRET=k0r07HOro0M6jH9o4Tl0IKv08l9bB8Oxx4DTo7rKF6Y= \
  CORS_ORIGIN=https://votre-frontend.vercel.app \
  NODE_ENV=production
```

### 5. Déployer

```bash
fly deploy
```

### 6. Vérifier le déploiement

```bash
# Voir les logs
fly logs

# Tester l'API
fly open /api/health
```

## 🔧 Configuration Post-Déploiement

### Voir l'URL de votre application

```bash
fly status
```

Votre API sera disponible à : `https://hkids-backend.fly.dev`

### Mettre à jour le Frontend

Dans votre frontend, mettez à jour :
```
VITE_API_URL=https://hkids-backend.fly.dev
```

## 📊 Gestion de l'Application

### Voir les logs en temps réel
```bash
fly logs
```

### Redémarrer l'application
```bash
fly apps restart hkids-backend
```

### Voir le statut
```bash
fly status
```

### Ouvrir l'application dans le navigateur
```bash
fly open
```

### Voir les secrets configurés
```bash
fly secrets list
```

## ⚠️ Notes Importantes

1. **Volumes persistants** : Pour les uploads de fichiers, vous devrez configurer un volume Fly.io ou utiliser un service externe (S3, Cloudinary, etc.)

2. **Scaling** : Par défaut, l'app s'arrête après inactivité (auto_stop_machines = true). Pour la production, vous pouvez désactiver cela.

3. **Régions** : Choisissez une région proche de vos utilisateurs pour de meilleures performances.

## 🆘 Dépannage

### Erreur : "Database connection failed"
- Vérifiez que tous les secrets DB_* sont correctement configurés
- Vérifiez que votre base Supabase est accessible publiquement

### Erreur : "Build failed"
- Vérifiez que le Dockerfile est correct
- Vérifiez les logs : `fly logs`

### L'application ne démarre pas
- Vérifiez les logs : `fly logs`
- Vérifiez que le PORT est bien 3000
- Vérifiez que toutes les variables d'environnement sont configurées

## 🔗 Liens Utiles

- [Documentation Fly.io](https://fly.io/docs)
- [Fly.io Dashboard](https://fly.io/dashboard)

