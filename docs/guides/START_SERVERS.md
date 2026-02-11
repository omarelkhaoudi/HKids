# Guide de démarrage des serveurs HKids

## Problème : ERR_CONNECTION_REFUSED

Si vous voyez l'erreur `ERR_CONNECTION_REFUSED` dans la console, cela signifie que le serveur backend n'est pas démarré.

## Solution : Démarrer les serveurs

### Option 1 : Démarrer manuellement (Recommandé)

**Terminal 1 - Backend :**
```bash
cd backend
npm run dev
```

Vous devriez voir :
```
🚀 HKids Backend running on http://localhost:3000
✅ Database initialized with default admin (username: admin, password: admin123)
```

**Terminal 2 - Frontend :**
```bash
cd frontend
npm run dev
```

Vous devriez voir :
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### Option 2 : Script automatique (Windows PowerShell)

Créez un fichier `start-all.ps1` à la racine du projet :

```powershell
# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"
Start-Sleep -Seconds 2

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
```

Puis exécutez :
```powershell
.\start-all.ps1
```

## Vérification

1. **Backend** : Ouvrez http://localhost:3000/api/health
   - Devrait retourner : `{"status":"ok","message":"HKids API is running"}`

2. **Frontend** : Ouvrez http://localhost:5173
   - La page d'accueil devrait se charger

3. **Login Admin** : http://localhost:5173/admin/login
   - Username: `admin`
   - Password: `admin123`

## Si le problème persiste

1. **Vérifier les ports** :
   - Backend : Port 3000 doit être libre
   - Frontend : Port 5173 doit être libre

2. **Réinitialiser l'utilisateur admin** :
   ```bash
   cd backend
   node scripts/reset-admin.js
   ```

3. **Vérifier les logs** :
   - Regardez les logs du serveur backend pour voir les erreurs
   - Vérifiez que la base de données est bien initialisée

4. **Redémarrer les serveurs** :
   - Arrêtez tous les processus (Ctrl+C)
   - Redémarrez le backend puis le frontend

