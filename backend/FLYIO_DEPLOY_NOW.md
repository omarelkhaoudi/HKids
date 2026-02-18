# 🚀 Déploiement Fly.io - Commandes Finales

## ✅ Déjà fait
- ✅ Application créée : `hkids-backend`
- ✅ Secrets configurés : DB_HOST, DB_PORT, DB_USER, DB_NAME, NODE_ENV, JWT_SECRET

## ⏳ À faire maintenant

### 1. Ajouter les 2 secrets manquants

```bash
cd backend

# Remplacez par votre vrai mot de passe Supabase
fly secrets set DB_PASSWORD=votre-mot-de-passe-supabase

# Remplacez par l'URL de votre frontend déployé
fly secrets set CORS_ORIGIN=https://votre-frontend.vercel.app
```

### 2. Déployer

```bash
fly deploy
```

### 3. Vérifier

```bash
# Voir les logs
fly logs

# Tester l'API
fly open /api/health
```

## 📝 Votre URL de production

Une fois déployé, votre API sera disponible à :
**https://hkids-backend.fly.dev**

## 🔧 Commandes utiles

```bash
# Voir le statut
fly status

# Voir les secrets configurés
fly secrets list

# Redémarrer l'app
fly apps restart hkids-backend

# Ouvrir l'app dans le navigateur
fly open
```

