# 🚀 Commandes Fly.io - Copier-Coller

## ✅ Solution Rapide (3 minutes)

### Option 1 : Script Automatique (Recommandé)

```powershell
cd C:\Users\omare\Desktop\HKids\backend
.\fix-flyio-secrets.ps1
```

Le script va :
- ✅ Configurer tous les secrets automatiquement
- ✅ Redémarrer l'application
- ✅ Afficher les logs

---

### Option 2 : Commandes Manuelles

**Ouvrez PowerShell dans le dossier backend :**

```powershell
cd C:\Users\omare\Desktop\HKids\backend
```

**Puis exécutez ces commandes une par une :**

```powershell
# 1. Configurer DATABASE_URL (mot de passe encodé: @ devient %40)
flyctl secrets set DATABASE_URL="postgresql://postgres:2003%40English%402003@db.kueenrvthimjutyukdej.supabase.co:5432/postgres" --app hkids-backend

# 2. Configurer JWT_SECRET
flyctl secrets set JWT_SECRET="hkids-jwt-secret-production-$(Get-Random)" --app hkids-backend

# 3. Configurer CORS_ORIGIN (REMPLACEZ par votre URL frontend)
flyctl secrets set CORS_ORIGIN="https://votre-frontend.vercel.app" --app hkids-backend

# 4. Configurer NODE_ENV
flyctl secrets set NODE_ENV="production" --app hkids-backend

# 5. Vérifier les secrets
flyctl secrets list --app hkids-backend

# 6. Redémarrer l'application
flyctl apps restart hkids-backend

# 7. Voir les logs (attendez 10 secondes après le redémarrage)
flyctl logs --app hkids-backend
```

---

## ⚠️ Important : Encodage du Mot de Passe

Votre mot de passe contient `@` qui doit être encodé en `%40` dans l'URL.

**Mot de passe original** : `2003@English@2003`  
**Mot de passe encodé** : `2003%40English%402003`

**Format DATABASE_URL complet** :
```
postgresql://postgres:2003%40English%402003@db.kueenrvthimjutyukdej.supabase.co:5432/postgres
```

---

## 🧪 Tester après Configuration

1. **Attendez 30 secondes** après le redémarrage
2. **Ouvrez dans votre navigateur** :
   ```
   https://hkids-backend.fly.dev/api/health
   ```
3. **Vous devriez voir** :
   ```json
   {
     "status": "ok",
     "message": "HKids API is running",
     ...
   }
   ```

---

## 🆘 Si ça ne fonctionne toujours pas

### Vérifier les logs en temps réel

```powershell
flyctl logs --app hkids-backend
```

### Vérifier les secrets configurés

```powershell
flyctl secrets list --app hkids-backend
```

### Vérifier le statut de l'application

```powershell
flyctl status --app hkids-backend
```

---

## 📋 Checklist

- [ ] Secrets configurés (DATABASE_URL, JWT_SECRET, CORS_ORIGIN, NODE_ENV)
- [ ] Application redémarrée
- [ ] Logs montrent "✅ Database initialization completed"
- [ ] Test `/api/health` fonctionne
- [ ] Frontend configuré avec `VITE_API_URL=https://hkids-backend.fly.dev`

