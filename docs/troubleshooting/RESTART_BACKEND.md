# 🔄 Redémarrer le serveur backend

## Problème : Erreur 404 sur /api/auth/signup

Le serveur backend doit être redémarré pour charger la nouvelle route `/api/auth/signup`.

## Solution : Redémarrer le serveur backend

### Option 1 : Redémarrage manuel

1. **Arrêtez le serveur backend** :
   - Trouvez le terminal où le backend tourne
   - Appuyez sur `Ctrl+C` pour l'arrêter

2. **Redémarrez le serveur** :
   ```bash
   cd backend
   npm run dev
   ```

### Option 2 : Redémarrage automatique

Si vous utilisez `npm run dev` avec `--watch`, le serveur devrait se redémarrer automatiquement. Sinon :

1. Arrêtez tous les processus Node.js backend
2. Redémarrez avec :
   ```bash
   cd backend
   npm run dev
   ```

## Vérification

Après le redémarrage, testez la route :

```bash
# Test avec curl (si disponible)
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

Ou ouvrez dans votre navigateur : http://localhost:3000/api/health

Vous devriez voir :
```json
{"status":"ok","message":"HKids API is running"}
```

## Après le redémarrage

1. Rafraîchissez la page d'inscription dans votre navigateur (F5)
2. Essayez de créer un compte à nouveau
3. La route devrait maintenant fonctionner !

