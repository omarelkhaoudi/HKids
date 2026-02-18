# 🚀 Instructions de Déploiement Fly.io

## ✅ Configuration terminée

- ✅ Application créée : `hkids-backend`
- ✅ Secrets configurés
- ✅ `fly.toml` corrigé

## 🎯 Déploiement

### Option 1 : Via PowerShell (dans le dossier backend)

```powershell
cd backend
fly deploy
```

### Option 2 : Via le script PowerShell

```powershell
cd backend
.\deploy-fly.ps1
```

### Option 3 : Si fly n'est pas dans le PATH

Ajoutez temporairement au PATH :
```powershell
$env:Path += ";C:\Users\omare\.fly\bin"
fly deploy
```

## 📝 Vérification après déploiement

```powershell
# Voir les logs
fly logs

# Tester l'API
fly open /api/health

# Voir le statut
fly status
```

## 🌐 URL de production

Une fois déployé, votre API sera disponible à :
**https://hkids-backend.fly.dev**

## ⚠️ Si vous avez des erreurs

1. Vérifiez que tous les secrets sont configurés :
   ```powershell
   fly secrets list
   ```

2. Vérifiez les logs :
   ```powershell
   fly logs
   ```

3. Vérifiez la configuration :
   ```powershell
   fly config validate
   ```

