# ✅ Prochaines Étapes - Backend Déployé sur Fly.io

## 🎉 Félicitations !

Votre backend est maintenant déployé sur Fly.io :
**🌐 URL Production : https://hkids-backend.fly.dev**

## 📋 Checklist des Prochaines Étapes

### 1. ✅ Vérifier que l'API fonctionne

**Testez l'endpoint health check :**
```
https://hkids-backend.fly.dev/api/health
```

Ouvrez cette URL dans votre navigateur. Vous devriez voir :
```json
{
  "status": "ok",
  "message": "HKids API is running",
  "timestamp": "...",
  "uptime": ...,
  "environment": "production"
}
```

### 2. ✅ Vérifier la connexion à la base de données

**Vérifiez les logs :**
```powershell
cd backend
flyctl logs
```

Vous devriez voir :
- ✅ "Connexion PostgreSQL établie"
- ✅ "PostgreSQL database initialized"

**Si vous voyez des erreurs de connexion :**
- Vérifiez que `DB_PASSWORD` est bien configuré : `flyctl secrets list`
- Vérifiez que votre base Supabase est accessible

### 3. ✅ Ajouter les secrets manquants (si nécessaire)

Vérifiez que tous les secrets sont configurés :
```powershell
flyctl secrets list
```

**Si `DB_PASSWORD` ou `CORS_ORIGIN` manquent :**
```powershell
# Ajouter le mot de passe Supabase
flyctl secrets set DB_PASSWORD=votre-mot-de-passe-supabase

# Ajouter l'URL de votre frontend
flyctl secrets set CORS_ORIGIN=https://votre-frontend.vercel.app
```

Puis redéployez :
```powershell
flyctl deploy
```

### 4. ✅ Mettre à jour le Frontend

Dans votre frontend, mettez à jour la variable d'environnement pour pointer vers le nouveau backend :

**Si vous utilisez Vite (frontend React) :**
1. Créez/modifiez `.env.production` dans le dossier `frontend`
2. Ajoutez :
   ```
   VITE_API_URL=https://hkids-backend.fly.dev
   ```
3. Redéployez votre frontend sur Vercel

**Ou dans Vercel Dashboard :**
1. Allez dans votre projet frontend sur Vercel
2. Settings → Environment Variables
3. Ajoutez/modifiez : `VITE_API_URL` = `https://hkids-backend.fly.dev`
4. Redéployez

### 5. ✅ Tester l'Application Complète

1. **Testez l'authentification :**
   - Créez un compte utilisateur
   - Connectez-vous

2. **Testez les livres :**
   - Créez un livre
   - Consultez les livres publiés

3. **Vérifiez les logs en cas d'erreur :**
   ```powershell
   flyctl logs
   ```

## 🔧 Commandes Utiles Fly.io

```powershell
# Voir les logs en temps réel
flyctl logs

# Voir le statut de l'application
flyctl status

# Ouvrir l'application dans le navigateur
flyctl open

# Voir les secrets configurés
flyctl secrets list

# Redémarrer l'application
flyctl apps restart hkids-backend

# Voir les machines
flyctl machine list
```

## 🆘 Dépannage

### L'API ne répond pas
1. Vérifiez les logs : `flyctl logs`
2. Vérifiez le statut : `flyctl status`
3. Vérifiez que la machine est running

### Erreur de connexion à la base de données
1. Vérifiez que `DB_PASSWORD` est configuré : `flyctl secrets list`
2. Vérifiez que votre base Supabase est accessible
3. Testez la connexion depuis votre machine locale

### Erreur CORS
1. Vérifiez que `CORS_ORIGIN` est configuré avec l'URL exacte de votre frontend
2. Incluez le protocole `https://`

## 📝 Résumé

✅ Backend déployé : https://hkids-backend.fly.dev  
⏭️ Prochaine étape : Mettre à jour le frontend avec la nouvelle URL de l'API

